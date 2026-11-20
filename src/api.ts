import type {
  AuthorityPriorityRecommendation,
  CivicReport,
  DuplicateCandidate,
  IssueCategory,
  SmartReportSuggestion,
  UrgencyLevel,
  UserProfile,
  UserRole,
  VoiceReportResult,
  WardTrendPoint,
} from './types';

const TOKEN_KEY = 'civicsense_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  login(email: string, password: string) {
    return request<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  signup(payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    ward: string;
    preferredLanguage: 'en' | 'hi';
    department?: string;
  }) {
    return request<{ token: string; user: UserProfile }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  me() {
    return request<{ user: UserProfile }>('/api/auth/me');
  },

  getReports(params?: {
    ward?: string;
    category?: string;
    status?: string;
    urgency?: string;
    search?: string;
    mine?: boolean;
    userId?: string;
  }) {
    const qs = new URLSearchParams();
    if (params?.ward) qs.set('ward', params.ward);
    if (params?.category) qs.set('category', params.category);
    if (params?.status) qs.set('status', params.status);
    if (params?.urgency) qs.set('urgency', params.urgency);
    if (params?.search) qs.set('search', params.search);
    if (params?.mine) qs.set('mine', 'true');
    if (params?.userId) qs.set('userId', params.userId);
    const query = qs.toString();
    return request<{ reports: CivicReport[] }>(`/api/reports${query ? `?${query}` : ''}`);
  },

  getReport(id: string) {
    return request<{ report: CivicReport; relatedReports: CivicReport[] }>(`/api/reports/${id}`);
  },

  createReport(payload: {
    title: string;
    description: string;
    category: IssueCategory;
    urgency: UrgencyLevel;
    urgencyReason?: string;
    ward: string;
    address: string;
    mapX: number;
    mapY: number;
    imageData?: string;
    languageReported: 'en' | 'hi' | 'mixed';
    originalTranscript?: string;
    linkedClusterId?: string;
  }) {
    return request<{ report: CivicReport }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  validateReport(
    id: string,
    payload: {
      type: 'still_exists' | 'confirm_resolved' | 'support' | 'evidence';
      note?: string;
      evidenceImage?: string;
    }
  ) {
    return request<{ report: CivicReport }>(`/api/reports/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  authorityAction(
    id: string,
    payload: {
      action: 'verify' | 'assign' | 'start_work' | 'upload_evidence' | 'resolve' | 'approve_priority';
      department?: string;
      officer?: string;
      note?: string;
      resolutionEvidenceImage?: string;
      urgency?: UrgencyLevel;
    }
  ) {
    return request<{ report: CivicReport }>(`/api/reports/${id}/authority`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  getCivicPulse(ward = 'All') {
    return request<{
      summary: {
        total: number;
        open: number;
        resolved: number;
        resolutionRate: number;
        medianResolutionHours: number;
        totalConfirmations: number;
      };
      categoryCounts: Array<{ category: IssueCategory; total: number; open: number; resolved: number }>;
      wardBreakdown: Array<{
        ward: string;
        total: number;
        open: number;
        resolved: number;
        criticalCount: number;
      }>;
      hotspots: Array<{
        id: string;
        ward: string;
        category: IssueCategory;
        area: string;
        count: number;
        totalConfirmations: number;
        highestUrgency: string;
        mapX: number;
        mapY: number;
        reportIds: string[];
      }>;
      trends: WardTrendPoint[];
      recentReports: CivicReport[];
    }>(`/api/civicpulse?ward=${encodeURIComponent(ward)}`);
  },

  getCitizenImpact() {
    return request<{
      submittedCount: number;
      verifiedCount: number;
      resolvedCount: number;
      communityContributions: number;
      wardResolutionRate: number;
      wardOpenCount: number;
    }>('/api/citizen/impact');
  },

  analyzeSmartReport(payload: { imageData?: string; notes?: string; address?: string }) {
    return request<{ suggestion: SmartReportSuggestion }>('/api/ai/smart-report', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  processVoiceReport(payload: {
    audioData?: string;
    mimeType?: string;
    transcriptText?: string;
    languageHint: 'en' | 'hi' | 'mixed';
  }) {
    return request<{ result: VoiceReportResult }>('/api/ai/voice-report', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  checkDuplicates(payload: {
    title?: string;
    description?: string;
    category?: IssueCategory;
    mapX?: number;
    mapY?: number;
  }) {
    return request<{ candidates: DuplicateCandidate[] }>('/api/reports/check-duplicates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  runAuthorityPrioritization() {
    return request<{ recommendations: AuthorityPriorityRecommendation[] }>('/api/ai/prioritize', {
      method: 'POST',
    });
  },
};
