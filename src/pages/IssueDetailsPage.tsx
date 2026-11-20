import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  ThumbsUp,
  Upload,
  Wrench,
} from 'lucide-react';
import { api } from '../api';
import {
  DEPARTMENTS,
  StatusText,
  UrgencyText,
  formatDateTime,
} from '../components/CivicBrand';
import { IssueVisual } from '../components/CivicIllustrations';
import type { CivicReport, IssueStatus, UserProfile } from '../types';

interface IssueDetailsPageProps {
  report: CivicReport;
  relatedReports: CivicReport[];
  user: UserProfile | null;
  onBack: () => void;
  onRequireAuth: () => void;
  onReportUpdated: (updated: CivicReport) => void;
  onInspectReport: (reportId: string) => void;
}

const ORDERED_STAGES: IssueStatus[] = [
  'Submitted',
  'Verified',
  'Assigned',
  'In Progress',
  'Evidence Uploaded',
  'Resolved',
];

export function IssueDetailsPage({
  report,
  relatedReports,
  user,
  onBack,
  onRequireAuth,
  onReportUpdated,
  onInspectReport,
}: IssueDetailsPageProps) {
  const [evidenceNote, setEvidenceNote] = useState('');
  const [evidencePhoto, setEvidencePhoto] = useState<string | undefined>(undefined);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Authority inline workflow state
  const [selectedDept, setSelectedDept] = useState(
    report.assignedDepartment || report.aiSuggestedDepartment || DEPARTMENTS[0]
  );
  const [officerName, setOfficerName] = useState(report.assignedOfficer || 'S. Venkatesh (Exec. Engineer)');
  const [authNote, setAuthNote] = useState('');
  const [resolutionImg, setResolutionImg] = useState<string | undefined>(undefined);

  const stageIdx = ORDERED_STAGES.indexOf(report.status);

  const handlePhotoSelect = (setter: (val: string | undefined) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const triggerValidation = async (type: 'still_exists' | 'confirm_resolved' | 'support') => {
    if (!user) {
      onRequireAuth();
      return;
    }
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.validateReport(report.id, { type });
      onReportUpdated(res.report);
      setFeedback({ type: 'ok', text: 'Your verified neighbourhood confirmation has been logged.' });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to record confirmation.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const submitAdditionalEvidence = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.validateReport(report.id, {
        type: 'evidence',
        note: evidenceNote,
        evidenceImage: evidencePhoto,
      });
      onReportUpdated(res.report);
      setEvidenceNote('');
      setEvidencePhoto(undefined);
      setFeedback({ type: 'ok', text: 'Additional evidence added to the transparent timeline.' });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to submit evidence.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const runAuthorityStep = async (
    action: 'verify' | 'assign' | 'start_work' | 'upload_evidence' | 'resolve'
  ) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.authorityAction(report.id, {
        action,
        department: selectedDept,
        officer: officerName,
        note: authNote,
        resolutionEvidenceImage: resolutionImg,
      });
      onReportUpdated(res.report);
      setAuthNote('');
      setResolutionImg(undefined);
      setFeedback({ type: 'ok', text: `Timeline updated: ${res.report.status}.` });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Authority action failed.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 lg:py-12 space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-medium text-[#77827E] hover:text-[#202C2A]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      {/* Top Header */}
      <div className="border-b border-[#E7ECE8] pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#77827E]">
            <span className="font-mono font-semibold text-[#202C2A] tabular-nums">{report.id}</span>
            <span aria-hidden="true">·</span>
            <span>{report.category}</span>
            <span aria-hidden="true">·</span>
            <span>{report.ward}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">Reported {formatDateTime(report.createdAt)}</span>
          </div>
          <h1
            className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#202C2A]"
            style={{ textWrap: 'balance' }}
          >
            {report.title}
          </h1>
          <p className="mt-1.5 text-sm text-[#77827E]">{report.address}</p>
        </div>

        <div className="flex items-center gap-5 shrink-0">
          <UrgencyText urgency={report.urgency} />
          <StatusText status={report.status} />
        </div>
      </div>

      {/* 6-Stage Progress Rail */}
      <section className="rounded-xl border border-[#E7ECE8] bg-[#F6F8F6] p-5">
        <p className="text-xs font-medium text-[#77827E] mb-4">Transparent Resolution Progress</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ORDERED_STAGES.map((stage, i) => {
            const reached = i <= stageIdx;
            const current = i === stageIdx;
            return (
              <div
                key={stage}
                className={`rounded-lg border px-3 py-2.5 text-xs ${
                  current
                    ? 'border-[#246B61] bg-white text-[#194B45] font-semibold'
                    : reached
                    ? 'border-[#A9C4B4] bg-[#F0F4F1] text-[#202C2A] font-medium'
                    : 'border-[#E7ECE8] bg-white/60 text-[#77827E]'
                }`}
              >
                <span className="font-mono text-[10px] block tabular-nums">0{i + 1}</span>
                <span className="mt-0.5 block">{stage}</span>
              </div>
            );
          })}
        </div>
      </section>

      {feedback && (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-xs font-medium ${
            feedback.type === 'ok'
              ? 'border-[#A9C4B4] bg-[#F0F4F1] text-[#194B45]'
              : 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Description, Evidence Visuals & Full Timeline */}
        <div className="lg:col-span-7 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#E7ECE8] bg-white overflow-hidden">
              <IssueVisual
                imageData={report.imageData}
                illustrationKey={report.illustrationKey}
                alt={report.title}
                className="w-full h-48"
              />
              <div className="px-4 py-2.5 border-t border-[#E7ECE8] text-xs text-[#77827E]">
                Reported street condition · {report.reporterName}
              </div>
            </div>

            {report.status === 'Evidence Uploaded' || report.status === 'Resolved' ? (
              <div className="rounded-xl border border-[#A9C4B4] bg-white overflow-hidden">
                <IssueVisual
                  imageData={report.resolutionEvidenceImage}
                  illustrationKey="resolved"
                  alt="Post-repair resolution evidence"
                  className="w-full h-48"
                />
                <div className="px-4 py-2.5 border-t border-[#E7ECE8] text-xs text-[#194B45] font-medium">
                  Resolution evidence · {report.assignedDepartment || 'Municipal Crew'}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#E7ECE8] bg-[#F6F8F6] p-5 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-medium text-[#246B61]">Assessment & Dispatch</p>
                  <p className="mt-2 text-sm text-[#202C2A] leading-relaxed">{report.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E7ECE8] text-xs text-[#77827E] space-y-1">
                  <p>
                    <span className="font-medium text-[#202C2A]">Department:</span>{' '}
                    {report.assignedDepartment || 'Awaiting assignment'}
                  </p>
                  <p>
                    <span className="font-medium text-[#202C2A]">Urgency basis:</span> {report.urgencyReason}
                  </p>
                </div>
              </div>
            )}
          </div>

          {(report.status === 'Evidence Uploaded' || report.status === 'Resolved') && (
            <div className="rounded-xl border border-[#E7ECE8] bg-[#F6F8F6] p-5 space-y-2">
              <p className="text-sm text-[#202C2A] leading-relaxed">{report.description}</p>
              {report.resolutionNote && (
                <p className="text-xs text-[#194B45] pt-2 border-t border-[#E7ECE8]">
                  <span className="font-semibold">Resolution note:</span> {report.resolutionNote}
                </p>
              )}
            </div>
          )}

          {report.originalTranscript && (
            <div className="rounded-xl border border-[#E7ECE8] bg-white p-5">
              <p className="text-xs font-medium text-[#246B61]">
                Original Voice Transcript ({report.languageReported === 'hi' ? 'हिन्दी' : 'Hinglish'})
              </p>
              <p className="mt-1.5 text-sm text-[#202C2A]">{report.originalTranscript}</p>
            </div>
          )}

          {/* Chronological Activity Timeline */}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-[#202C2A]">Activity timeline</h2>
            <div className="space-y-0 border border-[#E7ECE8] rounded-xl bg-white divide-y divide-[#E7ECE8]">
              {report.timeline.map((entry) => (
                <div key={entry.id} className="p-5 flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#77827E]">
                      <span className="font-semibold text-[#246B61]">{entry.stage}</span>
                      <span aria-hidden="true">·</span>
                      <span>{entry.actorName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{entry.actorRole}</span>
                    </div>
                    <p className="text-sm font-medium text-[#202C2A]">{entry.title}</p>
                    <p className="text-xs text-[#77827E] leading-relaxed">{entry.description}</p>
                  </div>
                  <span className="font-mono text-[11px] text-[#77827E] tabular-nums whitespace-nowrap shrink-0">
                    {formatDateTime(entry.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Community Validation + Authority Controls */}
        <aside className="lg:col-span-5 space-y-6">
          <section className="rounded-xl border border-[#E7ECE8] bg-white p-6 space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#202C2A]">Community Validation</h2>
              <p className="mt-0.5 text-xs text-[#77827E]">
                One confirmation per verified account prevents duplicate manipulation.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center border-t border-b border-[#E7ECE8] py-3">
              <div>
                <p className="font-mono text-lg font-medium text-[#202C2A] tabular-nums">
                  {report.confirmStillExistsCount}
                </p>
                <p className="text-[11px] text-[#77827E]">Still exists</p>
              </div>
              <div>
                <p className="font-mono text-lg font-medium text-[#15803D] tabular-nums">
                  {report.confirmResolvedCount}
                </p>
                <p className="text-[11px] text-[#77827E]">Resolved</p>
              </div>
              <div>
                <p className="font-mono text-lg font-medium text-[#246B61] tabular-nums">
                  {report.supportCount}
                </p>
                <p className="text-[11px] text-[#77827E]">Supports</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {report.status !== 'Resolved' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => triggerValidation('still_exists')}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#246B61] bg-[#F0F4F1] px-4 py-2.5 text-xs font-semibold text-[#194B45] hover:bg-[#E4EDE7] disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm issue still exists</span>
                </button>
              )}

              {(report.status === 'Evidence Uploaded' || report.status === 'In Progress') && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => triggerValidation('confirm_resolved')}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#246B61] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#194B45] disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm issue has been resolved</span>
                </button>
              )}

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => triggerValidation('support')}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#E7ECE8] bg-white px-4 py-2.5 text-xs font-medium text-[#202C2A] hover:bg-[#F6F8F6] disabled:opacity-50"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Support priority for this report</span>
              </button>
            </div>

            {/* Submit Additional Evidence */}
            <form onSubmit={submitAdditionalEvidence} className="pt-4 border-t border-[#E7ECE8] space-y-3">
              <label htmlFor="add-evidence" className="block text-xs font-medium text-[#202C2A]">
                Submit additional street evidence
              </label>
              <textarea
                id="add-evidence"
                rows={2}
                value={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.value)}
                placeholder="Add time-stamped field observation or safety note..."
                className="w-full rounded-lg border border-[#E7ECE8] bg-white px-3 py-2 text-xs text-[#202C2A] focus:border-[#246B61] focus:outline-none"
              />
              <div className="flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-1.5 text-xs text-[#246B61] cursor-pointer hover:text-[#194B45]">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{evidencePhoto ? 'Photo attached' : 'Attach photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect(setEvidencePhoto)}
                    className="sr-only"
                  />
                </label>
                <button
                  type="submit"
                  disabled={actionLoading || (!evidenceNote.trim() && !evidencePhoto)}
                  className="rounded-md bg-[#202C2A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#194B45] disabled:opacity-40"
                >
                  Add Evidence
                </button>
              </div>
            </form>
          </section>

          {/* Authority Inline Workflow Controls */}
          {user?.role === 'authority' && (
            <section className="rounded-xl border border-[#A9C4B4] bg-[#F6F8F6] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-[#194B45]">
                  Authority Field Operations
                </h2>
                <Wrench className="w-4 h-4 text-[#246B61]" />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#202C2A] mb-1">Assign Department</label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full rounded-lg border border-[#E7ECE8] bg-white px-3 py-2 text-xs text-[#202C2A]"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#202C2A] mb-1">Field Officer</label>
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full rounded-lg border border-[#E7ECE8] bg-white px-3 py-2 text-xs text-[#202C2A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#202C2A] mb-1">
                    Official inspection / resolution note
                  </label>
                  <textarea
                    rows={2}
                    value={authNote}
                    onChange={(e) => setAuthNote(e.target.value)}
                    placeholder="Document crew work or repair verification..."
                    className="w-full rounded-lg border border-[#E7ECE8] bg-white px-3 py-2 text-xs text-[#202C2A]"
                  />
                </div>

                <label className="inline-flex items-center gap-1.5 text-xs text-[#246B61] cursor-pointer">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>{resolutionImg ? 'Resolution photo attached' : 'Attach post-repair proof photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect(setResolutionImg)}
                    className="sr-only"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => runAuthorityStep('verify')}
                    className="rounded-lg border border-[#E7ECE8] bg-white px-3 py-2 text-xs font-medium text-[#202C2A] hover:border-[#246B61]"
                  >
                    Mark Verified
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => runAuthorityStep('assign')}
                    className="rounded-lg border border-[#E7ECE8] bg-white px-3 py-2 text-xs font-medium text-[#202C2A] hover:border-[#246B61]"
                  >
                    Assign Dept
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => runAuthorityStep('start_work')}
                    className="rounded-lg border border-[#E7ECE8] bg-white px-3 py-2 text-xs font-medium text-[#202C2A] hover:border-[#246B61]"
                  >
                    Start Field Work
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => runAuthorityStep('upload_evidence')}
                    className="rounded-lg border border-[#246B61] bg-[#F0F4F1] px-3 py-2 text-xs font-medium text-[#194B45]"
                  >
                    Upload Evidence
                  </button>
                </div>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => runAuthorityStep('resolve')}
                  className="w-full rounded-lg bg-[#246B61] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#194B45]"
                >
                  Approve Evidence & Mark Resolved
                </button>
              </div>
            </section>
          )}

          {/* Related Duplicate Cluster Reports */}
          {relatedReports.length > 0 && (
            <section className="rounded-xl border border-[#E7ECE8] bg-white p-5 space-y-3">
              <h3 className="font-display text-sm font-semibold text-[#202C2A]">
                Linked Duplicate Cluster ({report.duplicateClusterId})
              </h3>
              {relatedReports.map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => onInspectReport(rel.id)}
                  className="w-full rounded-lg border border-[#E7ECE8] bg-[#F6F8F6] p-3 text-left hover:border-[#246B61]"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#77827E]">
                    <span>{rel.id}</span>
                    <span>{rel.status}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-[#202C2A]">{rel.title}</p>
                </button>
              ))}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
