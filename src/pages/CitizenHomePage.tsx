import { useEffect, useState } from 'react';
import { ArrowRight, Camera, CheckCircle2, Compass, Mic } from 'lucide-react';
import { api } from '../api';
import { StatusText, UrgencyText, formatRelativeTime } from '../components/CivicBrand';
import { IssueVisual } from '../components/CivicIllustrations';
import type { CivicReport, UserProfile } from '../types';

interface CitizenHomePageProps {
  user: UserProfile;
  reports: CivicReport[];
  onNavigate: (view: 'report' | 'explore' | 'my-reports' | 'pulse', mode?: 'photo' | 'voice') => void;
  onInspectReport: (reportId: string) => void;
  onQuickConfirm: (reportId: string, type: 'still_exists' | 'confirm_resolved') => Promise<void>;
}

export function CitizenHomePage({
  user,
  reports,
  onNavigate,
  onInspectReport,
  onQuickConfirm,
}: CitizenHomePageProps) {
  const [impact, setImpact] = useState<{
    submittedCount: number;
    verifiedCount: number;
    resolvedCount: number;
    communityContributions: number;
    wardResolutionRate: number;
    wardOpenCount: number;
  } | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getCitizenImpact().then(setImpact).catch(() => {});
  }, [reports]);

  const wardReports = reports.filter((r) => r.ward === user.ward);
  const needsVerification = wardReports.filter(
    (r) =>
      r.status === 'Submitted' ||
      r.status === 'Verified' ||
      r.status === 'Evidence Uploaded'
  ).slice(0, 3);

  const myRecent = reports
    .filter((r) => r.reporterId === user.id || r.validations.some((v) => v.userId === user.id))
    .slice(0, 3);

  const handleConfirm = async (reportId: string, type: 'still_exists' | 'confirm_resolved') => {
    setConfirmingId(reportId);
    setActionMsg(null);
    try {
      await onQuickConfirm(reportId, type);
      setActionMsg(
        type === 'confirm_resolved'
          ? `Resolution confirmed on ${reportId}.`
          : `Confirmation recorded on ${reportId}.`
      );
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Unable to record confirmation.');
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 lg:py-12 space-y-12">
      {/* Welcoming Header & Quick Actions */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7">
          <p className="text-xs font-medium text-[#246B61]">{user.ward}</p>
          <h1
            className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#202C2A]"
            style={{ textWrap: 'balance' }}
          >
            Welcome back, {user.name.split(' ')[0]}.
          </h1>
          <p className="mt-2 text-sm text-[#77827E] max-w-xl leading-relaxed">
            Your neighbourhood currently has{' '}
            <span className="font-mono text-[#202C2A] tabular-nums">
              {impact?.wardOpenCount ?? wardReports.filter((r) => r.status !== 'Resolved').length}
            </span>{' '}
            open civic issues and a{' '}
            <span className="font-mono text-[#246B61] tabular-nums">
              {impact?.wardResolutionRate ?? 0}%
            </span>{' '}
            verified resolution rate.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('report', 'photo')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#246B61] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#194B45] transition-colors whitespace-nowrap"
            >
              <Camera className="w-4 h-4" />
              <span>Report with Photo AI</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('report', 'voice')}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E7ECE8] bg-white px-4 py-2.5 text-sm font-medium text-[#202C2A] hover:bg-[#F6F8F6] transition-colors whitespace-nowrap"
            >
              <Mic className="w-4 h-4 text-[#246B61]" />
              <span>Voice Report (EN / हिन्दी)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E7ECE8] bg-white px-4 py-2.5 text-sm font-medium text-[#202C2A] hover:bg-[#F6F8F6] transition-colors whitespace-nowrap"
            >
              <Compass className="w-4 h-4 text-[#246B61]" />
              <span>Neighbourhood Radar</span>
            </button>
          </div>
        </div>

        {/* Civic Impact Overview (Calm, Meaningful, No Gamification) */}
        <div className="lg:col-span-5 rounded-xl border border-[#E7ECE8] bg-[#F6F8F6] p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-[#202C2A]">Your Civic Impact</h2>
            <span className="text-xs text-[#77827E]">Verified record</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-y-5 gap-x-6">
            <div>
              <p className="font-mono text-2xl font-medium text-[#202C2A] tabular-nums">
                {impact?.submittedCount ?? 0}
              </p>
              <p className="mt-0.5 text-xs text-[#77827E]">Reports submitted</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-medium text-[#202C2A] tabular-nums">
                {impact?.verifiedCount ?? 0}
              </p>
              <p className="mt-0.5 text-xs text-[#77827E]">Issues verified</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-medium text-[#246B61] tabular-nums">
                {impact?.resolvedCount ?? 0}
              </p>
              <p className="mt-0.5 text-xs text-[#77827E]">Issues resolved</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-medium text-[#202C2A] tabular-nums">
                {impact?.communityContributions ?? 0}
              </p>
              <p className="mt-0.5 text-xs text-[#77827E]">Community contributions</p>
            </div>
          </div>
          <div className="mt-5 border-t border-[#E7ECE8] pt-4 flex items-center justify-between text-xs">
            <span className="text-[#77827E]">Local ward improvement rate</span>
            <span className="font-mono font-medium text-[#194B45] tabular-nums">
              {impact?.wardResolutionRate ?? 0}% closed
            </span>
          </div>
        </div>
      </section>

      {actionMsg && (
        <div className="rounded-lg border border-[#A9C4B4] bg-[#F0F4F1] px-4 py-3 text-xs font-medium text-[#194B45]">
          {actionMsg}
        </div>
      )}

      {/* Community Verification Queue */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#246B61]">Community Validation</p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[#202C2A]">
              Nearby issues awaiting resident verification
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="text-xs font-medium text-[#246B61] hover:text-[#194B45] whitespace-nowrap"
          >
            View all nearby →
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {needsVerification.map((report) => {
            const isEvidenceReady = report.status === 'Evidence Uploaded';
            return (
              <article
                key={report.id}
                className="rounded-xl border border-[#E7ECE8] bg-white overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => onInspectReport(report.id)}
                    className="block w-full text-left"
                  >
                    <IssueVisual
                      imageData={report.imageData}
                      illustrationKey={report.illustrationKey}
                      alt={report.title}
                      className="w-full h-40 border-b border-[#E7ECE8]"
                    />
                  </button>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#77827E]">
                      <span className="font-mono text-[#202C2A] tabular-nums">{report.id}</span>
                      <span>{formatRelativeTime(report.createdAt)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onInspectReport(report.id)}
                      className="mt-2 text-left font-display text-base font-semibold text-[#202C2A] hover:text-[#246B61] line-clamp-2"
                    >
                      {report.title}
                    </button>
                    <p className="mt-1 text-xs text-[#77827E] truncate">{report.address}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <StatusText status={report.status} />
                      <UrgencyText urgency={report.urgency} />
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 border-t border-[#E7ECE8] bg-[#F6F8F6] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={confirmingId === report.id}
                    onClick={() =>
                      handleConfirm(report.id, isEvidenceReady ? 'confirm_resolved' : 'still_exists')
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#246B61] hover:text-[#194B45] disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isEvidenceReady ? 'Confirm resolved' : 'Confirm still exists'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onInspectReport(report.id)}
                    className="text-xs font-medium text-[#77827E] hover:text-[#202C2A]"
                  >
                    Timeline →
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Recent Personal Activity */}
      <section className="border-t border-[#E7ECE8] pt-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#202C2A]">Your recent reports</h2>
            <p className="mt-0.5 text-xs text-[#77827E]">Live status across submissions and confirmations</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('my-reports')}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#246B61] hover:text-[#194B45]"
          >
            <span>Open My Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-5 divide-y divide-[#E7ECE8] border-t border-b border-[#E7ECE8]">
          {myRecent.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#77827E]">
              You haven’t submitted a report yet. Start with a street photo or quick voice note.
            </div>
          ) : (
            myRecent.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => onInspectReport(report.id)}
                className="w-full py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-[#F6F8F6] px-3 -mx-3 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-[#77827E]">
                    <span className="font-mono text-[#202C2A] tabular-nums">{report.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{report.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatRelativeTime(report.updatedAt)}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-[#202C2A] truncate">{report.title}</p>
                </div>
                <div className="flex items-center gap-5 shrink-0">
                  <StatusText status={report.status} />
                  <span className="text-xs text-[#246B61] font-medium">View timeline →</span>
                </div>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
