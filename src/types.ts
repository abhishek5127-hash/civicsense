export type UserRole = 'citizen' | 'authority';

export type IssueCategory =
  | 'Roads & Potholes'
  | 'Streetlights & Power'
  | 'Waste & Sanitation'
  | 'Water & Drainage'
  | 'Parks & Trees'
  | 'Traffic & Safety';

export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type IssueStatus =
  | 'Submitted'
  | 'Verified'
  | 'Assigned'
  | 'In Progress'
  | 'Evidence Uploaded'
  | 'Resolved';

export type IllustrationKey =
  | 'pothole'
  | 'streetlight'
  | 'waste'
  | 'water'
  | 'park'
  | 'traffic'
  | 'resolved';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ward: string;
  department?: string;
  preferredLanguage: 'en' | 'hi';
  joinedAt: string;
}

export interface TimelineStage {
  id: string;
  stage: IssueStatus;
  title: string;
  description: string;
  actorName: string;
  actorRole: 'Citizen' | 'Community' | 'Authority' | 'Field Crew';
  timestamp: string;
  evidenceImage?: string;
}

export interface ValidationEntry {
  id: string;
  userId: string;
  userName: string;
  type: 'still_exists' | 'confirm_resolved' | 'support' | 'evidence';
  note?: string;
  evidenceImage?: string;
  wardVerified: boolean;
  timestamp: string;
}

export interface CivicReport {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  urgency: UrgencyLevel;
  urgencyReason: string;
  status: IssueStatus;
  ward: string;
  address: string;
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
  reporterId: string;
  reporterName: string;
  languageReported: 'en' | 'hi' | 'mixed';
  originalTranscript?: string;
  imageData?: string;
  illustrationKey?: IllustrationKey;
  resolutionEvidenceImage?: string;
  resolutionNote?: string;
  assignedDepartment?: string;
  assignedOfficer?: string;
  slaTargetHours: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  confirmStillExistsCount: number;
  confirmResolvedCount: number;
  supportCount: number;
  duplicateClusterId?: string;
  aiPriorityScore?: number;
  aiPriorityExplanation?: string;
  aiSuggestedDepartment?: string;
  aiPriorityApprovedBy?: string;
  aiPriorityApprovedAt?: string;
  timeline: TimelineStage[];
  validations: ValidationEntry[];
}

export interface SmartReportSuggestion {
  category: IssueCategory;
  title: string;
  description: string;
  missingInfo: string[];
  urgency: UrgencyLevel;
  urgencyReason: string;
  imageSummary: string;
}

export interface VoiceReportResult {
  transcript: string;
  detectedLanguage: string;
  englishSummary: string;
  category: IssueCategory;
  title: string;
  description: string;
  missingInfo: string[];
  urgency: UrgencyLevel;
  urgencyReason: string;
}

export interface DuplicateCandidate {
  report: CivicReport;
  similarityScore: number;
  distanceMeters: number;
  reason: string;
  matchSignals: string[];
}

export interface AuthorityPriorityRecommendation {
  reportId: string;
  recommendedRank: number;
  priorityScore: number;
  suggestedDepartment: string;
  reasoning: string;
  riskFactors: string[];
}

export interface WardTrendPoint {
  week: string;
  reported: number;
  resolved: number;
}
