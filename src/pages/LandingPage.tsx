import { ArrowRight, CheckCircle2, Compass, Mic, ShieldCheck, Sparkles } from 'lucide-react';
import { HeroNeighborhoodIllustration } from '../components/CivicIllustrations';
import { StatusText, UrgencyText, formatRelativeTime } from '../components/CivicBrand';
import type { CivicReport } from '../types';

interface LandingPageProps {
  reports: CivicReport[];
  onNavigate: (view: 'auth' | 'report' | 'explore' | 'pulse' | 'authority', reportId?: string) => void;
  onInspectReport: (reportId: string) => void;
}

export function LandingPage({ reports, onNavigate, onInspectReport }: LandingPageProps) {
  const recentSample = reports.slice(0, 3);
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;
  const totalConfirmations = reports.reduce(
    (sum, r) => sum + r.confirmStillExistsCount + r.confirmResolvedCount,
    0
  );

  return (
    <div className="bg-white text-[#202C2A]">
      {/* Hero Split Section */}
      <section className="mx-auto max-w-[1200px] px-6 pt-12 pb-12 lg:pt-16 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-medium tracking-wide text-[#246B61]">
              East Zone Municipal Pilot · Bengaluru Wards 79–113
            </p>
            <h1
              className="mt-4 font-display font-semibold tracking-tight text-[#202C2A] leading-[1.08]"
              style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
            >
              Calm, accountable neighbourhood resolution from street photo to verified repair.
            </h1>
            <p className="mt-5 text-[16px] leading-[1.65] text-[#77827E] max-w-xl">
              CivicSense pairs photo and Hindi/English voice intake with duplicate detection, community
              corroboration, and transparent municipal timelines—so every repair leaves verifiable proof.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('report')}
                className="inline-flex items-center gap-2 rounded-lg bg-[#246B61] px-5 py-3 text-sm font-medium text-white hover:bg-[#194B45] transition-colors whitespace-nowrap shrink-0"
              >
                <span>Report an issue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('explore')}
                className="inline-flex items-center gap-2 rounded-lg border border-[#E7ECE8] bg-white px-5 py-3 text-sm font-medium text-[#202C2A] hover:bg-[#F6F8F6] transition-colors whitespace-nowrap shrink-0"
              >
                <span>Explore Neighbourhood Radar</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[320px] lg:min-h-[420px] overflow-hidden rounded-xl border border-[#E7ECE8] bg-[#F6F8F6]">
              <HeroNeighborhoodIllustration />
            </div>
          </div>
        </div>

        {/* Full-width Claim-to-Proof Metric Strip below hero split */}
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 border-t border-b border-[#E7ECE8] divide-y lg:divide-y-0 lg:divide-x divide-[#E7ECE8]">
          <div className="py-5 pr-6">
            <p className="font-mono text-2xl font-medium text-[#202C2A] tabular-nums">34 hrs</p>
            <p className="mt-1 text-xs text-[#77827E]">Median resolution turnaround across 4 wards</p>
          </div>
          <div className="py-5 lg:px-6">
            <p className="font-mono text-2xl font-medium text-[#202C2A] tabular-nums">
              {totalConfirmations}
            </p>
            <p className="mt-1 text-xs text-[#77827E]">Verified resident street confirmations logged</p>
          </div>
          <div className="py-5 pr-6 lg:px-6">
            <p className="font-mono text-2xl font-medium text-[#202C2A] tabular-nums">
              {resolvedCount} / {reports.length}
            </p>
            <p className="mt-1 text-xs text-[#77827E]">Issues closed with post-repair evidence</p>
          </div>
          <div className="py-5 lg:pl-6">
            <p className="font-mono text-2xl font-medium text-[#246B61] tabular-nums">100%</p>
            <p className="mt-1 text-xs text-[#77827E]">Human officer sign-off on AI triage</p>
          </div>
        </div>
      </section>

      {/* Signature Capabilities Asymmetric Bento */}
      <section className="bg-[#F6F8F6] border-t border-b border-[#E7ECE8] py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#246B61]">Core Architecture</p>
            <h2
              className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#202C2A]"
              style={{ textWrap: 'balance' }}
            >
              Built for clear citizen reporting and evidence-led municipal work.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-xl border border-[#E7ECE8] bg-white p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-[#77827E]">
                  <span>01 · SmartReport AI & Duplicate Intelligence</span>
                  <Sparkles className="w-4 h-4 text-[#246B61]" />
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold text-[#202C2A]">
                  Upload a street photo—review AI category, missing details, and nearby duplicates before sending
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#77827E]">
                  SmartReport inspects your photograph to suggest an accurate title, department category, and
                  urgency explanation, while flagging missing landmarks and matching open reports within 350m
                  so residents strengthen one ticket instead of creating clutter.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-[#E7ECE8] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs text-[#202C2A]">
                  <span>Category suggestion</span>
                  <span aria-hidden="true" className="text-[#A9C4B4]">·</span>
                  <span>Proximity deduplication</span>
                  <span aria-hidden="true" className="text-[#A9C4B4]">·</span>
                  <span>Citizen editable</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('report')}
                  className="text-xs font-semibold text-[#246B61] hover:text-[#194B45] whitespace-nowrap"
                >
                  Try SmartReport →
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[#E7ECE8] bg-white p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-[#77827E]">
                  <span>02 · Bilingual Voice</span>
                  <Mic className="w-4 h-4 text-[#246B61]" />
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold text-[#202C2A]">
                  Speak naturally in हिन्दी or English
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#77827E]">
                  Record a quick voice note describing a broken streetlight or blocked drain. CivicSense
                  transcribes your words and prepares a structured draft you approve before submission.
                </p>
              </div>
              <p className="mt-6 pt-5 border-t border-[#E7ECE8] text-xs text-[#77827E]">
                Supports Hindi, Hinglish, and English voice capture
              </p>
            </div>

            <div className="rounded-xl border border-[#E7ECE8] bg-white p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-[#77827E]">
                  <span>03 · CivicPulse</span>
                  <Compass className="w-4 h-4 text-[#246B61]" />
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold text-[#202C2A]">
                  Neighbourhood Radar & Hotspot Intelligence
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#77827E]">
                  See recurring ward problems, issue density heatmaps, and recently resolved repairs within
                  500m to 2km of your street.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('pulse')}
                className="mt-6 pt-5 border-t border-[#E7ECE8] text-left text-xs font-semibold text-[#246B61] hover:text-[#194B45]"
              >
                Open CivicPulse →
              </button>
            </div>

            <div className="md:col-span-2 rounded-xl border border-[#E7ECE8] bg-white p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-[#77827E]">
                  <span>04 · Transparent Resolution & Authority Command</span>
                  <ShieldCheck className="w-4 h-4 text-[#246B61]" />
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold text-[#202C2A]">
                  Six-stage public timeline with citizen closure confirmation
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#77827E]">
                  Every report tracks Submitted → Verified → Assigned → Work Started → Evidence Uploaded →
                  Resolved. Authority officers receive explainable AI prioritization recommendations that always
                  require human review and post-repair photographic proof.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-[#E7ECE8] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs text-[#77827E]">
                  <CheckCircle2 className="w-4 h-4 text-[#246B61]" />
                  <span>Anti-manipulation safeguards limit 1 confirmation per verified resident</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('authority')}
                  className="text-xs font-semibold text-[#246B61] hover:text-[#194B45] whitespace-nowrap"
                >
                  View Authority Console →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Neighbourhood Activity Preview */}
      <section className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#246B61]">Live Neighbourhood Ledger</p>
            <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-[#202C2A]">
              Recent civic reports & ongoing resolutions
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="text-sm font-medium text-[#246B61] hover:text-[#194B45] whitespace-nowrap"
          >
            Inspect all on Neighbourhood Radar →
          </button>
        </div>

        <div className="mt-8 divide-y divide-[#E7ECE8] border-t border-b border-[#E7ECE8]">
          {recentSample.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => onInspectReport(report.id)}
              className="w-full py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left hover:bg-[#F6F8F6] px-3 -mx-3 rounded-lg transition-colors"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#77827E]">
                  <span className="font-mono text-[#202C2A] tabular-nums">{report.id}</span>
                  <span aria-hidden="true">·</span>
                  <span>{report.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{report.ward}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{formatRelativeTime(report.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-base font-medium text-[#202C2A] truncate">{report.title}</p>
                <p className="mt-0.5 text-xs text-[#77827E] truncate">{report.address}</p>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <UrgencyText urgency={report.urgency} />
                <StatusText status={report.status} />
                <span className="text-xs font-mono text-[#77827E] tabular-nums">
                  {report.confirmStillExistsCount} confirmed
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-[#E7ECE8] bg-[#F6F8F6] py-10">
        <div className="mx-auto max-w-[1200px] px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#77827E]">
          <div className="flex items-center gap-3">
            <span className="font-display font-semibold text-sm text-[#202C2A]">CivicSense</span>
            <span aria-hidden="true">·</span>
            <span>Neighbourhood Civic Intelligence & Transparent Operations</span>
          </div>
          <div className="flex items-center gap-6">
            <button type="button" onClick={() => onNavigate('pulse')} className="hover:text-[#202C2A]">
              CivicPulse
            </button>
            <button type="button" onClick={() => onNavigate('explore')} className="hover:text-[#202C2A]">
              Neighbourhood Radar
            </button>
            <button type="button" onClick={() => onNavigate('auth')} className="hover:text-[#202C2A]">
              Citizen & Authority Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
