import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import {
  createSeedDatabase,
  hashPassword,
  verifyPassword,
  type CivicDatabase,
  type StoredUser,
} from './server/seedData.ts';
import type {
  AuthorityPriorityRecommendation,
  CivicReport,
  DuplicateCandidate,
  IssueCategory,
  UrgencyLevel,
  UserProfile,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'civicsense.json');
const TOKEN_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const CATEGORIES: IssueCategory[] = [
  'Roads & Potholes',
  'Streetlights & Power',
  'Waste & Sanitation',
  'Water & Drainage',
  'Parks & Trees',
  'Traffic & Safety',
];

const URGENCIES: UrgencyLevel[] = ['Low', 'Medium', 'High', 'Critical'];

function ensureDb(): CivicDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seed = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(raw) as CivicDatabase;
}

let db: CivicDatabase = ensureDb();

function saveDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

function sanitizeUser(user: StoredUser): UserProfile {
  const { passwordHash: _ignored, ...profile } = user;
  return profile;
}

function signToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as { uid?: string };
    return parsed.uid || null;
  } catch {
    return null;
  }
}

interface AuthedRequest extends Request {
  user?: StoredUser;
}

function authOptional(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const uid = verifyToken(header.slice(7));
    if (uid) {
      req.user = db.users.find((u) => u.id === uid);
    }
  }
  next();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  authOptional(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please sign in to continue.' });
    }
    next();
  });
}

function requireAuthority(req: AuthedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'authority') {
      return res.status(403).json({ error: 'Municipal Authority role required for this operation.' });
    }
    next();
  });
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured. Please add your API key in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

function mapIllustrationForCategory(cat: IssueCategory): CivicReport['illustrationKey'] {
  switch (cat) {
    case 'Roads & Potholes':
      return 'pothole';
    case 'Streetlights & Power':
      return 'streetlight';
    case 'Waste & Sanitation':
      return 'waste';
    case 'Water & Drainage':
      return 'water';
    case 'Parks & Trees':
      return 'park';
    case 'Traffic & Safety':
      return 'traffic';
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // --- Health check ---
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, reportCount: db.reports.length });
  });

  // --- Auth routes ---
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const token = signToken(user.id);
    res.json({ token, user: sanitizeUser(user) });
  });

  app.post('/api/auth/signup', (req, res) => {
    const { name, email, password, role, ward, preferredLanguage, department } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: 'citizen' | 'authority';
      ward?: string;
      preferredLanguage?: 'en' | 'hi';
      department?: string;
    };

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const newUser: StoredUser = {
      id: `usr_${crypto.randomBytes(5).toString('hex')}`,
      name: name.trim(),
      email: cleanEmail,
      passwordHash: hashPassword(password),
      role: role === 'authority' ? 'authority' : 'citizen',
      ward: ward?.trim() || 'Ward 82 · Indiranagar',
      department: role === 'authority' ? department?.trim() || 'Municipal Operations Command' : undefined,
      preferredLanguage: preferredLanguage === 'hi' ? 'hi' : 'en',
      joinedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDb();
    const token = signToken(newUser.id);
    res.status(201).json({ token, user: sanitizeUser(newUser) });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
    res.json({ user: sanitizeUser(req.user!) });
  });

  // --- Reports listing & detail ---
  app.get('/api/reports', (req, res) => {
    const { ward, category, status, urgency, search, mine, userId } = req.query as Record<string, string | undefined>;
    let list = [...db.reports];

    if (ward && ward !== 'All') {
      list = list.filter((r) => r.ward === ward);
    }
    if (category && category !== 'All') {
      list = list.filter((r) => r.category === category);
    }
    if (status && status !== 'All') {
      if (status === 'Open') {
        list = list.filter((r) => r.status !== 'Resolved');
      } else {
        list = list.filter((r) => r.status === status);
      }
    }
    if (urgency && urgency !== 'All') {
      list = list.filter((r) => r.urgency === urgency);
    }
    if (mine === 'true' && userId) {
      list = list.filter(
        (r) => r.reporterId === userId || r.validations.some((v) => v.userId === userId)
      );
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q) ||
          r.ward.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ reports: list });
  });

  app.get('/api/reports/:id', (req, res) => {
    const report = db.reports.find((r) => r.id === req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    const relatedReports = report.duplicateClusterId
      ? db.reports.filter((r) => r.duplicateClusterId === report.duplicateClusterId && r.id !== report.id)
      : [];
    res.json({ report, relatedReports });
  });

  // --- Create Report ---
  app.post('/api/reports', requireAuth, (req: AuthedRequest, res) => {
    const {
      title,
      description,
      category,
      urgency,
      urgencyReason,
      ward,
      address,
      mapX,
      mapY,
      imageData,
      languageReported,
      originalTranscript,
      linkedClusterId,
    } = req.body as {
      title?: string;
      description?: string;
      category?: IssueCategory;
      urgency?: UrgencyLevel;
      urgencyReason?: string;
      ward?: string;
      address?: string;
      mapX?: number;
      mapY?: number;
      imageData?: string;
      languageReported?: 'en' | 'hi' | 'mixed';
      originalTranscript?: string;
      linkedClusterId?: string;
    };

    if (!title?.trim() || !description?.trim() || !category || !address?.trim()) {
      return res.status(400).json({ error: 'Title, description, category, and street address are required.' });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid issue category.' });
    }

    const safeMapX = typeof mapX === 'number' ? Math.max(5, Math.min(95, mapX)) : 50;
    const safeMapY = typeof mapY === 'number' ? Math.max(5, Math.min(95, mapY)) : 50;
    const lat = Number((12.965 + ((100 - safeMapY) / 100) * 0.022).toFixed(5));
    const lng = Number((77.628 + (safeMapX / 100) * 0.028).toFixed(5));

    const maxNum = db.reports.reduce((acc, r) => {
      const n = parseInt(r.id.replace('CS-', ''), 10);
      return Number.isFinite(n) && n > acc ? n : acc;
    }, 8208);

    const newId = `CS-${maxNum + 1}`;
    const now = new Date().toISOString();
    const safeUrgency: UrgencyLevel = URGENCIES.includes(urgency as UrgencyLevel) ? (urgency as UrgencyLevel) : 'Medium';
    const slaTargetHours =
      safeUrgency === 'Critical' ? 16 : safeUrgency === 'High' ? 24 : safeUrgency === 'Medium' ? 48 : 72;

    const newReport: CivicReport = {
      id: newId,
      title: title.trim(),
      description: description.trim(),
      category,
      urgency: safeUrgency,
      urgencyReason: urgencyReason?.trim() || 'Logged with citizen severity assessment.',
      status: 'Submitted',
      ward: ward?.trim() || req.user!.ward || 'Ward 82 · Indiranagar',
      address: address.trim(),
      lat,
      lng,
      mapX: safeMapX,
      mapY: safeMapY,
      reporterId: req.user!.id,
      reporterName: req.user!.name,
      languageReported: languageReported || 'en',
      originalTranscript: originalTranscript?.trim() || undefined,
      imageData: imageData || undefined,
      illustrationKey: mapIllustrationForCategory(category),
      slaTargetHours,
      createdAt: now,
      updatedAt: now,
      confirmStillExistsCount: 1,
      confirmResolvedCount: 0,
      supportCount: 1,
      duplicateClusterId: linkedClusterId || undefined,
      timeline: [
        {
          id: `tl-${newId}-1`,
          stage: 'Submitted',
          title:
            languageReported === 'hi'
              ? 'Voice report submitted in Hindi & translated'
              : imageData
              ? 'Report submitted with SmartReport AI photo analysis'
              : 'Report submitted by resident',
          description: `Logged at ${address.trim()} (${ward?.trim() || req.user!.ward}).`,
          actorName: req.user!.name,
          actorRole: 'Citizen',
          timestamp: now,
          evidenceImage: imageData || undefined,
        },
      ],
      validations: [],
    };

    db.reports.unshift(newReport);
    saveDb();
    res.status(201).json({ report: newReport });
  });

  // --- Community Validation with anti-manipulation safeguards ---
  app.post('/api/reports/:id/validate', requireAuth, (req: AuthedRequest, res) => {
    const report = db.reports.find((r) => r.id === req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const { type, note, evidenceImage } = req.body as {
      type?: 'still_exists' | 'confirm_resolved' | 'support' | 'evidence';
      note?: string;
      evidenceImage?: string;
    };

    if (!type || !['still_exists', 'confirm_resolved', 'support', 'evidence'].includes(type)) {
      return res.status(400).json({ error: 'Invalid validation action.' });
    }

    // Safeguard 1: Prevent duplicate manipulation from the same account for still_exists / confirm_resolved / support
    if (type !== 'evidence') {
      const alreadyDone = report.validations.some(
        (v) => v.userId === req.user!.id && v.type === type
      );
      if (alreadyDone) {
        return res.status(409).json({
          error: 'Safeguard: Each verified resident account can record this confirmation once per report.',
        });
      }
    } else if (!note?.trim() && !evidenceImage) {
      return res.status(400).json({ error: 'Please include a field observation note or photo evidence.' });
    }

    const now = new Date().toISOString();
    const wardVerified = req.user!.ward === report.ward || req.user!.role === 'authority';

    report.validations.unshift({
      id: `val-${crypto.randomBytes(4).toString('hex')}`,
      userId: req.user!.id,
      userName: req.user!.name,
      type,
      note: note?.trim() || undefined,
      evidenceImage: evidenceImage || undefined,
      wardVerified,
      timestamp: now,
    });

    if (type === 'still_exists') report.confirmStillExistsCount += 1;
    if (type === 'confirm_resolved') report.confirmResolvedCount += 1;
    if (type === 'support') report.supportCount += 1;

    if (type === 'evidence') {
      report.timeline.push({
        id: `tl-${crypto.randomBytes(4).toString('hex')}`,
        stage: report.status,
        title: 'Community evidence added',
        description: note?.trim() || 'Additional resident photograph uploaded.',
        actorName: req.user!.name,
        actorRole: 'Community',
        timestamp: now,
        evidenceImage: evidenceImage || undefined,
      });
    }

    // Auto-verify Submitted reports once 3 community confirmations are recorded
    if (type === 'still_exists' && report.status === 'Submitted' && report.confirmStillExistsCount >= 3) {
      report.status = 'Verified';
      report.timeline.push({
        id: `tl-${crypto.randomBytes(4).toString('hex')}`,
        stage: 'Verified',
        title: `Verified by ${report.confirmStillExistsCount} neighbourhood residents`,
        description: 'Community quorum safeguard reached; escalated for departmental assignment.',
        actorName: 'Neighbourhood Quorum',
        actorRole: 'Community',
        timestamp: now,
      });
    }

    // Close Evidence Uploaded reports once 2 independent citizens confirm resolution
    if (type === 'confirm_resolved' && report.status === 'Evidence Uploaded' && report.confirmResolvedCount >= 2) {
      report.status = 'Resolved';
      report.resolvedAt = now;
      report.timeline.push({
        id: `tl-${crypto.randomBytes(4).toString('hex')}`,
        stage: 'Resolved',
        title: `Issue marked resolved with ${report.confirmResolvedCount} citizen confirmations`,
        description: 'Independent residents verified post-repair condition on site.',
        actorName: req.user!.name,
        actorRole: 'Community',
        timestamp: now,
      });
    }

    report.updatedAt = now;
    saveDb();
    res.json({ report });
  });

  // --- Authority Workflow Actions (Human-in-the-loop) ---
  app.patch('/api/reports/:id/authority', requireAuthority, (req: AuthedRequest, res) => {
    const report = db.reports.find((r) => r.id === req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const { action, department, officer, note, resolutionEvidenceImage, urgency } = req.body as {
      action?: 'verify' | 'assign' | 'start_work' | 'upload_evidence' | 'resolve' | 'approve_priority';
      department?: string;
      officer?: string;
      note?: string;
      resolutionEvidenceImage?: string;
      urgency?: UrgencyLevel;
    };

    const now = new Date().toISOString();

    switch (action) {
      case 'verify': {
        report.status = 'Verified';
        report.timeline.push({
          id: `tl-${crypto.randomBytes(4).toString('hex')}`,
          stage: 'Verified',
          title: 'Report verified by Municipal Officer',
          description: note?.trim() || 'Verified report location, category, and safety footprint.',
          actorName: req.user!.name,
          actorRole: 'Authority',
          timestamp: now,
        });
        break;
      }
      case 'assign': {
        if (!department?.trim()) {
          return res.status(400).json({ error: 'Department selection is required.' });
        }
        report.assignedDepartment = department.trim();
        report.assignedOfficer = officer?.trim() || 'Duty Field Engineer';
        report.status = 'Assigned';
        report.aiPriorityApprovedBy = req.user!.name;
        report.aiPriorityApprovedAt = now;
        report.timeline.push({
          id: `tl-${crypto.randomBytes(4).toString('hex')}`,
          stage: 'Assigned',
          title: `Assigned to ${department.trim()}`,
          description:
            note?.trim() ||
            `Human officer approved dispatch to ${department.trim()} (${report.assignedOfficer}).`,
          actorName: req.user!.name,
          actorRole: 'Authority',
          timestamp: now,
        });
        break;
      }
      case 'start_work': {
        report.status = 'In Progress';
        report.timeline.push({
          id: `tl-${crypto.randomBytes(4).toString('hex')}`,
          stage: 'In Progress',
          title: 'Field work started on site',
          description: note?.trim() || 'Field crew arrived on location and commenced corrective work.',
          actorName: report.assignedOfficer || req.user!.name,
          actorRole: 'Field Crew',
          timestamp: now,
        });
        break;
      }
      case 'upload_evidence': {
        if (!note?.trim() && !resolutionEvidenceImage) {
          return res.status(400).json({
            error: 'Evidence-based verification requires a resolution photo or detailed completion note.',
          });
        }
        report.status = 'Evidence Uploaded';
        report.resolutionNote = note?.trim() || report.resolutionNote;
        if (resolutionEvidenceImage) {
          report.resolutionEvidenceImage = resolutionEvidenceImage;
        }
        report.timeline.push({
          id: `tl-${crypto.randomBytes(4).toString('hex')}`,
          stage: 'Evidence Uploaded',
          title: 'Resolution evidence uploaded for citizen verification',
          description: note?.trim() || 'Post-repair site photograph logged.',
          actorName: req.user!.name,
          actorRole: 'Authority',
          timestamp: now,
          evidenceImage: resolutionEvidenceImage || undefined,
        });
        break;
      }
      case 'resolve': {
        if (!report.resolutionNote && !note?.trim() && !report.resolutionEvidenceImage && !resolutionEvidenceImage) {
          return res.status(400).json({
            error: 'Cannot mark Resolved without resolution evidence or completion documentation.',
          });
        }
        if (note?.trim()) report.resolutionNote = note.trim();
        if (resolutionEvidenceImage) report.resolutionEvidenceImage = resolutionEvidenceImage;
        report.status = 'Resolved';
        report.resolvedAt = now;
        report.timeline.push({
          id: `tl-${crypto.randomBytes(4).toString('hex')}`,
          stage: 'Resolved',
          title: 'Issue marked resolved after evidence inspection',
          description:
            note?.trim() ||
            report.resolutionNote ||
            'Officer verified completion evidence and closed municipal work order.',
          actorName: req.user!.name,
          actorRole: 'Authority',
          timestamp: now,
          evidenceImage: resolutionEvidenceImage || report.resolutionEvidenceImage || undefined,
        });
        break;
      }
      case 'approve_priority': {
        if (urgency && URGENCIES.includes(urgency)) {
          report.urgency = urgency;
        }
        if (department?.trim()) {
          report.aiSuggestedDepartment = department.trim();
        }
        report.aiPriorityApprovedBy = req.user!.name;
        report.aiPriorityApprovedAt = now;
        break;
      }
      default:
        return res.status(400).json({ error: 'Unknown authority action.' });
    }

    report.updatedAt = now;
    saveDb();
    res.json({ report });
  });

  // --- CivicPulse Intelligence ---
  app.get('/api/civicpulse', (req, res) => {
    const ward = (req.query.ward as string) || 'All';
    const reports = ward === 'All' ? db.reports : db.reports.filter((r) => r.ward === ward);

    const total = reports.length;
    const resolved = reports.filter((r) => r.status === 'Resolved').length;
    const open = total - resolved;
    const totalConfirmations = reports.reduce(
      (sum, r) => sum + r.confirmStillExistsCount + r.confirmResolvedCount,
      0
    );

    const categoryCounts = CATEGORIES.map((cat) => ({
      category: cat,
      total: reports.filter((r) => r.category === cat).length,
      open: reports.filter((r) => r.category === cat && r.status !== 'Resolved').length,
      resolved: reports.filter((r) => r.category === cat && r.status === 'Resolved').length,
    })).sort((a, b) => b.total - a.total);

    const wardBreakdown = Array.from(new Set(db.reports.map((r) => r.ward))).map((w) => {
      const wReports = db.reports.filter((r) => r.ward === w);
      const wResolved = wReports.filter((r) => r.status === 'Resolved').length;
      return {
        ward: w,
        total: wReports.length,
        open: wReports.length - wResolved,
        resolved: wResolved,
        criticalCount: wReports.filter((r) => r.urgency === 'Critical' || r.urgency === 'High').length,
      };
    });

    // Hotspots grouped by duplicateClusterId or proximity
    const clusterMap = new Map<string, CivicReport[]>();
    for (const r of reports) {
      if (r.status === 'Resolved') continue;
      const key = r.duplicateClusterId || `${r.ward}-${r.category}`;
      const existing = clusterMap.get(key) || [];
      existing.push(r);
      clusterMap.set(key, existing);
    }

    const hotspots = Array.from(clusterMap.entries())
      .map(([key, items]) => ({
        id: key,
        ward: items[0].ward,
        category: items[0].category,
        area: items[0].address,
        count: items.length,
        totalConfirmations: items.reduce((s, i) => s + i.confirmStillExistsCount, 0),
        highestUrgency: items.some((i) => i.urgency === 'Critical')
          ? 'Critical'
          : items.some((i) => i.urgency === 'High')
          ? 'High'
          : 'Medium',
        mapX: items[0].mapX,
        mapY: items[0].mapY,
        reportIds: items.map((i) => i.id),
      }))
      .sort((a, b) => b.totalConfirmations - a.totalConfirmations)
      .slice(0, 5);

    res.json({
      summary: {
        total,
        open,
        resolved,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
        medianResolutionHours: 34,
        totalConfirmations,
      },
      categoryCounts,
      wardBreakdown,
      hotspots,
      trends: db.wardTrends,
      recentReports: [...reports]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
    });
  });

  // --- Citizen Impact ---
  app.get('/api/citizen/impact', requireAuth, (req: AuthedRequest, res) => {
    const uid = req.user!.id;
    const submitted = db.reports.filter((r) => r.reporterId === uid);
    const resolvedSubmitted = submitted.filter((r) => r.status === 'Resolved');
    const validationsMade = db.reports.reduce(
      (acc, r) => acc + r.validations.filter((v) => v.userId === uid).length,
      0
    );
    const wardReports = db.reports.filter((r) => r.ward === req.user!.ward);
    const wardResolved = wardReports.filter((r) => r.status === 'Resolved').length;

    res.json({
      submittedCount: submitted.length,
      verifiedCount: submitted.filter((r) => r.status !== 'Submitted').length,
      resolvedCount: resolvedSubmitted.length,
      communityContributions: validationsMade + submitted.reduce((s, r) => s + r.supportCount, 0),
      wardResolutionRate:
        wardReports.length > 0 ? Math.round((wardResolved / wardReports.length) * 100) : 0,
      wardOpenCount: wardReports.length - wardResolved,
    });
  });

  // --- AI: SmartReport AI (Photo + Context) ---
  app.post('/api/ai/smart-report', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const { imageData, notes, address } = req.body as {
        imageData?: string;
        notes?: string;
        address?: string;
      };

      if (!imageData && !notes?.trim()) {
        return res.status(400).json({ error: 'Provide a photo or brief observation for SmartReport AI.' });
      }

      const ai = getAiClient();
      const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];

      if (imageData) {
        const parsed = parseDataUrl(imageData);
        if (!parsed) {
          return res.status(400).json({ error: 'Invalid image format. Please upload a PNG, JPEG, or WebP photo.' });
        }
        parts.push({ inlineData: { mimeType: parsed.mimeType, data: parsed.data } });
      }

      parts.push({
        text: `Analyze this civic issue report for an Indian urban municipality (e.g. Bengaluru).
Citizen notes: ${notes?.trim() || 'None provided'}
Location hint: ${address?.trim() || 'Not specified'}

Allowed categories: ${CATEGORIES.join(', ')}
Allowed urgency levels: ${URGENCIES.join(', ')}

Return a helpful, concise, accurate draft that the citizen will review and edit before submitting. Identify up to 3 specific pieces of missing information (like exact nearby landmark, hazard width, or duration) that would help field engineers resolve it faster.`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are CivicSense SmartReport AI, an objective municipal intake assistant. Be factual, concise, and avoid exaggerating hazards.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, enum: CATEGORIES },
              title: { type: Type.STRING, description: 'Clear 6-12 word issue headline.' },
              description: {
                type: Type.STRING,
                description: '2-3 sentence factual civic description suitable for field engineers.',
              },
              missingInfo: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Specific missing details that would help dispatch.',
              },
              urgency: { type: Type.STRING, enum: URGENCIES },
              urgencyReason: {
                type: Type.STRING,
                description: 'Plain-language explanation of why this urgency level was suggested.',
              },
              imageSummary: {
                type: Type.STRING,
                description: 'One-sentence observation of what is visible in the photo or notes.',
              },
            },
            required: [
              'category',
              'title',
              'description',
              'missingInfo',
              'urgency',
              'urgencyReason',
              'imageSummary',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({ suggestion: parsed });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SmartReport AI analysis failed.';
      res.status(500).json({ error: message });
    }
  });

  // --- AI: Multilingual Voice Reporting (English & Hindi) ---
  app.post('/api/ai/voice-report', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const { audioData, mimeType, transcriptText, languageHint } = req.body as {
        audioData?: string;
        mimeType?: string;
        transcriptText?: string;
        languageHint?: 'en' | 'hi' | 'mixed';
      };

      const ai = getAiClient();
      let transcript = transcriptText?.trim() || '';

      if (audioData) {
        const cleanBase64 = audioData.includes(',') ? audioData.split(',')[1] : audioData;
        const transcribeResp = await ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'audio/webm',
                  data: cleanBase64,
                },
              },
              {
                text:
                  languageHint === 'hi'
                    ? 'Transcribe this Hindi or Hinglish civic complaint verbatim in its original script.'
                    : 'Transcribe this spoken civic issue report verbatim.',
              },
            ],
          },
        });
        transcript = (transcribeResp.text ?? '').trim();
      }

      if (!transcript) {
        return res.status(400).json({
          error: 'No speech detected in recording. Please speak clearly or type your issue in Hindi or English.',
        });
      }

      const structuredResp = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Convert this citizen spoken report (which may be in Hindi, Hinglish, or English) into a structured municipal report draft for human review.

Original transcript:
"${transcript}"

Allowed categories: ${CATEGORIES.join(', ')}
Allowed urgency levels: ${URGENCIES.join(', ')}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedLanguage: { type: Type.STRING, description: 'e.g., Hindi, English, or Hinglish' },
              englishSummary: { type: Type.STRING, description: 'Faithful English translation of the spoken report.' },
              category: { type: Type.STRING, enum: CATEGORIES },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              missingInfo: { type: Type.ARRAY, items: { type: Type.STRING } },
              urgency: { type: Type.STRING, enum: URGENCIES },
              urgencyReason: { type: Type.STRING },
            },
            required: [
              'detectedLanguage',
              'englishSummary',
              'category',
              'title',
              'description',
              'missingInfo',
              'urgency',
              'urgencyReason',
            ],
          },
        },
      });

      const structured = JSON.parse((structuredResp.text ?? '{}').trim());
      res.json({
        result: {
          transcript,
          ...structured,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Voice transcription failed.';
      res.status(500).json({ error: message });
    }
  });

  // --- Duplicate Intelligence ---
  app.post('/api/reports/check-duplicates', requireAuth, async (req: AuthedRequest, res) => {
    const { title, description, category, mapX, mapY } = req.body as {
      title?: string;
      description?: string;
      category?: IssueCategory;
      mapX?: number;
      mapY?: number;
    };

    const safeMapX = typeof mapX === 'number' ? mapX : 50;
    const safeMapY = typeof mapY === 'number' ? mapY : 50;
    const lat = 12.965 + ((100 - safeMapY) / 100) * 0.022;
    const lng = 77.628 + (safeMapX / 100) * 0.028;

    const openReports = db.reports.filter((r) => r.status !== 'Resolved');

    // Compute deterministic spatial + category + temporal signals first
    const scored = openReports
      .map((report) => {
        const distanceMeters = Math.round(haversineMeters(lat, lng, report.lat, report.lng));
        const ageHours = (Date.now() - new Date(report.createdAt).getTime()) / 3600000;
        const sameCategory = category && report.category === category;

        const signals: string[] = [];
        let score = 0;

        if (distanceMeters <= 120) {
          score += 45;
          signals.push(`Within ${distanceMeters}m proximity`);
        } else if (distanceMeters <= 350) {
          score += 28;
          signals.push(`${distanceMeters}m nearby`);
        }

        if (sameCategory) {
          score += 30;
          signals.push(`Matching category: ${report.category}`);
        }

        if (ageHours <= 72) {
          score += 10;
          signals.push('Reported within 72h');
        }

        const draftWords = `${title || ''} ${description || ''}`
          .toLowerCase()
          .split(/\W+/)
          .filter((w) => w.length > 3);
        const reportText = `${report.title} ${report.description} ${report.address}`.toLowerCase();
        const overlap = draftWords.filter((w) => reportText.includes(w));
        if (overlap.length >= 2) {
          score += Math.min(20, overlap.length * 6);
          signals.push(`Shared descriptors (${overlap.slice(0, 3).join(', ')})`);
        }

        return { report, distanceMeters, score, signals };
      })
      .filter((item) => item.score >= 40 || (item.distanceMeters <= 250 && category === item.report.category))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (scored.length === 0) {
      return res.json({ candidates: [] });
    }

    // Enrich semantic similarity reasoning using Gemini when API key is configured & text exists
    let aiReasons: Record<string, { similarityScore: number; reason: string }> = {};
    if ((title?.trim() || description?.trim()) && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = getAiClient();
        const candidateSummary = scored
          .map(
            (c) =>
              `- ID: ${c.report.id} | Category: ${c.report.category} | Distance: ${c.distanceMeters}m | Title: "${c.report.title}" | Description: "${c.report.description}"`
          )
          .join('\n');

        const resp = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Compare this draft civic report with nearby open reports and rate whether each is likely a duplicate or related cluster.

Draft Report:
Category: ${category || 'Unspecified'}
Title: "${title || ''}"
Description: "${description || ''}"

Nearby Open Reports:
${candidateSummary}`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  similarityScore: { type: Type.INTEGER, description: '0 to 100 percentage' },
                  reason: { type: Type.STRING, description: 'One-sentence explanation comparing location, category, and issue details.' },
                },
                required: ['id', 'similarityScore', 'reason'],
              },
            },
          },
        });

        const arr = JSON.parse((resp.text ?? '[]').trim()) as Array<{
          id: string;
          similarityScore: number;
          reason: string;
        }>;
        for (const item of arr) {
          aiReasons[item.id] = { similarityScore: item.similarityScore, reason: item.reason };
        }
      } catch {
        // Spatial & categorical match signals still stand even if AI explanation call hits transient limits
      }
    }

    const candidates: DuplicateCandidate[] = scored.map((item) => {
      const aiInfo = aiReasons[item.report.id];
      return {
        report: item.report,
        similarityScore: aiInfo ? aiInfo.similarityScore : Math.min(96, item.score),
        distanceMeters: item.distanceMeters,
        reason:
          aiInfo?.reason ||
          `Located ${item.distanceMeters}m away in ${item.report.category}; confirming the existing ticket avoids splitting repair crews.`,
        matchSignals: item.signals,
      };
    });

    res.json({ candidates });
  });

  // --- AI: Authority Smart Prioritization (Explainable, Human-Approved) ---
  app.post('/api/ai/prioritize', requireAuthority, async (_req: AuthedRequest, res) => {
    try {
      const openReports = db.reports.filter((r) => r.status !== 'Resolved');
      if (openReports.length === 0) {
        return res.json({ recommendations: [] });
      }

      const ai = getAiClient();
      const digest = openReports.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        urgency: r.urgency,
        status: r.status,
        ward: r.ward,
        confirmStillExistsCount: r.confirmStillExistsCount,
        ageHours: Math.round((Date.now() - new Date(r.createdAt).getTime()) / 3600000),
        slaTargetHours: r.slaTargetHours,
        duplicateClusterId: r.duplicateClusterId || null,
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Evaluate these open municipal civic reports and generate an explainable prioritization order for human authority review. Do not omit any report ID. Explain clearly why each recommendation was generated based on public safety, SLA deadline pressure, community confirmations, and cluster overlap.

Open Reports:
${JSON.stringify(digest, null, 2)}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are CivicSense Operations Decision Support. Recommendations are advisory only and require human officer sign-off.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                reportId: { type: Type.STRING },
                recommendedRank: { type: Type.INTEGER },
                priorityScore: { type: Type.INTEGER },
                suggestedDepartment: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                'reportId',
                'recommendedRank',
                'priorityScore',
                'suggestedDepartment',
                'reasoning',
                'riskFactors',
              ],
            },
          },
        },
      });

      const recommendations = JSON.parse(
        (response.text ?? '[]').trim()
      ) as AuthorityPriorityRecommendation[];

      // Store advisory scores/explanations on reports WITHOUT auto-changing official status or approval
      for (const rec of recommendations) {
        const target = db.reports.find((r) => r.id === rec.reportId);
        if (target) {
          target.aiPriorityScore = rec.priorityScore;
          target.aiPriorityExplanation = rec.reasoning;
          target.aiSuggestedDepartment = rec.suggestedDepartment;
        }
      }
      saveDb();

      res.json({ recommendations });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Prioritization analysis failed.';
      res.status(500).json({ error: message });
    }
  });

  // --- Vite dev middleware or static dist ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicSense server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
