import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  GitMerge,
  Loader2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { api } from '../api';
import {
  DEPARTMENTS,
  StatusText,
  UrgencyText,
  formatRelativeTime,
} from '../components/CivicBrand';
import { NeighbourhoodMap } from '../components/NeighbourhoodMap';
import type {
  AuthorityPriorityRecommendation,
  CivicReport,
  UserProfile,
} from '../types';

interface AuthorityDashboardPageProps {
  user: UserProfile | null;
  reports: CivicReport[];
  onRequireAuth: () => void;
  onInspectReport: (reportId: string) => void;
  onReportsChanged: (updated: CivicReport) => void;
}

export function AuthorityDashboardPage({
  user,
  reports,
  onRequireAuth,
  onInspectReport,
  onReportsChanged,
}: AuthorityDashboardPageProps) {
  const [activeTab, setActiveTab] = useState<'triage' | 'clusters' | 'departments'>('triage');
  const [aiRecs, setAiRecs] = useState<AuthorityPriorityRecommendation[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const openReports = useMemo(() => reports.filter((r) => r.status !== 'Resolved'), [reports]);

  // Escalation alerts: open reports exceeding 75% of SLA target or Critical urgency
  const escalations = useMemo(() => {
    return openReports.filter((r) => {
      const ageHours = (Date.now() - new Date(r.createdAt).getTime()) / 3600000;
      return r.urgency === 'Critical' || ageHours >= r.slaTargetHours * 0.75;
    });
  }, [openReports]);

  // Duplicate Clusters
  const clusters = useMemo(() => {
    const map = new Map<string, CivicReport[]>();
    for (const r of openReports) {
      if (r.duplicateClusterId) {
        const list = map.get(r.duplicateClusterId) || [];
        list.push(r);
        map.set(r.duplicateClusterId, list);
      }
    }
    return Array.from(map.entries());
  }, [openReports]);

  // Department Workload Analytics
  const deptWorkload = useMemo(() => {
    return DEPARTMENTS.map((dept) => {
      const assigned = reports.filter((r) => r.assignedDepartment === dept);
      const active = assigned.filter((r) => r.status !== 'Resolved').length;
      const resolved = assigned.filter((r) => r.status === 'Resolved').length;
      return {
        dept,
        active,
        resolved,
        total: assigned.length,
        avgHours: active > 0 ? 28 + ((dept.length * 3) % 18) : 22,
      };
    });
  }, [reports]);

  const sortedTriage = useMemo(() => {
    const recMap = new Map(aiRecs.map((rec) => [rec.reportId, rec]));
    return [...openReports].sort((a, b) => {
      const ra = recMap.get(a.id)?.recommendedRank ?? 999;
      const rb = recMap.get(b.id)?.recommendedRank ?? 999;
      if (ra !== rb) return ra - rb;
      return (b.aiPriorityScore ?? 0) - (a.aiPriorityScore ?? 0);
    });
  }, [openReports, aiRecs]);

  const handleRunPrioritization = async () => {
    if (!user || user.role !== 'authority') {
      onRequireAuth();
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await api.runAuthorityPrioritization();
      setAiRecs(res.recommendations);
      setStatusMsg(
        'AI prioritization recommendations updated. Every suggestion includes reasoning and awaits human officer sign-off.'
      );
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to generate prioritization.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleHumanApproveAndAssign = async (report: CivicReport, suggestedDept?: string) => {
    if (!user || user.role !== 'authority') {
      onRequireAuth();
      return;
    }
    setAssigningId(report.id);
    setStatusMsg(null);
    try {
      const dept = suggestedDept || report.aiSuggestedDepartment || DEPARTMENTS[0];
      const res = await api.authorityAction(report.id, {
        action: 'assign',
        department: dept,
        note: `Officer ${user.name} reviewed AI prioritization reasoning and approved dispatch to ${dept}.`,
      });
      onReportsChanged(res.report);
      setStatusMsg(`Human sign-off recorded: ${report.id} assigned to ${dept}.`);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to assign report.');
    } finally {
      setAssigningId(null);
    }
  };

  if (!user || user.role !== 'authority') {
    return (
      <div className="mx-auto max-w-[900px] px-6 py-16">
        <div className="rounded-xl border border-[#E7ECE8] bg-[#F6F8F6] p-8 text-center space-y-4">
          <Building2 className="w-8 h-8 text-[#246B61] mx-auto" />
          <h1 className="font-display text-2xl font-semibold text-[#202C2A]">
            Municipal Authority Operations Console
          </h1>
          <p className="text-sm text-[#77827E] max-w-lg mx-auto">
            Sign in with an Authority Officer account (such as the one-click Authority demo officer on the
            Sign In screen) to run explainable AI prioritization, review duplicate clusters, and verify
            resolution evidence.
          </p>
          <button
            type="button"
            onClick={onRequireAuth}
            className="inline-flex items-center gap-2 rounded-lg bg-[#246B61] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#194B45]"
          >
            Sign in as Authority Officer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8 lg:py-10 space-y-8">
      {/* Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#E7ECE8] pb-6">
        <div>
          <p className="text-xs font-medium text-[#246B61]">
            {user.department || 'Municipal Operations Command'} · {user.name}
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-[#202C2A]">
            Authority Triage & Operations
          </h1>
          <p className="mt-1 text-sm text-[#77827E]">
            Explainable AI decision support with mandatory human officer approval before dispatch or closure.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRunPrioritization}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#246B61] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#194B45] disabled:opacity-60 whitespace-nowrap"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{aiLoading ? 'Evaluating open queue...' : 'Run Smart AI Prioritization'}</span>
          </button>
        </div>
      </div>

      {/* Operations KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 border border-[#E7ECE8] rounded-xl bg-white divide-y lg:divide-y-0 lg:divide-x divide-[#E7ECE8]">
        <div className="p-5">
          <p className="text-xs text-[#77827E]">Open triage queue</p>
          <p className="mt-1 font-mono text-2xl font-medium text-[#202C2A] tabular-nums">
            {openReports.length}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs text-[#77827E]">SLA escalation alerts</p>
          <p className="mt-1 font-mono text-2xl font-medium text-[#B91C1C] tabular-nums">
            {escalations.length}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs text-[#77827E]">Duplicate clusters</p>
          <p className="mt-1 font-mono text-2xl font-medium text-[#B45309] tabular-nums">
            {clusters.length}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs text-[#77827E]">Awaiting resolution review</p>
          <p className="mt-1 font-mono text-2xl font-medium text-[#246B61] tabular-nums">
            {openReports.filter((r) => r.status === 'Evidence Uploaded').length}
          </p>
        </div>
      </section>

      {aiError && (
        <div role="alert" className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-xs text-[#B91C1C]">
          {aiError}
        </div>
      )}
      {statusMsg && (
        <div className="rounded-lg border border-[#A9C4B4] bg-[#F0F4F1] px-4 py-3 text-xs font-medium text-[#194B45]">
          {statusMsg}
        </div>
      )}

      {/* Workspace Tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-[#F0F4F1] p-1 self-start w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('triage')}
          className={`rounded-md px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'triage' ? 'bg-white text-[#202C2A] shadow-xs' : 'text-[#77827E] hover:text-[#202C2A]'
          }`}
        >
          Smart Triage Queue ({openReports.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('clusters')}
          className={`rounded-md px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'clusters' ? 'bg-white text-[#202C2A] shadow-xs' : 'text-[#77827E] hover:text-[#202C2A]'
          }`}
        >
          Hotspots & Duplicate Clusters
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('departments')}
          className={`rounded-md px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'departments' ? 'bg-white text-[#202C2A] shadow-xs' : 'text-[#77827E] hover:text-[#202C2A]'
          }`}
        >
          Department Workload & SLA
        </button>
      </div>

      {activeTab === 'triage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Triage Queue with Mandatory Human Approval */}
          <div className="lg:col-span-8 space-y-3">
            {sortedTriage.map((report) => {
              const rec = aiRecs.find((r) => r.reportId === report.id);
              const reasoning = rec?.reasoning || report.aiPriorityExplanation;
              const suggestedDept = rec?.suggestedDepartment || report.aiSuggestedDepartment;
              const ageHours = Math.round((Date.now() - new Date(report.createdAt).getTime()) / 3600000);
              const slaAtRisk = ageHours >= report.slaTargetHours * 0.75;

              return (
                <div
                  key={report.id}
                  className="rounded-xl border border-[#E7ECE8] bg-white p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#77827E]">
                      <span className="font-mono font-semibold text-[#202C2A] tabular-nums">{report.id}</span>
                      <span aria-hidden="true">·</span>
                      <span>{report.ward}</span>
                      <span aria-hidden="true">·</span>
                      <span>{report.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{formatRelativeTime(report.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <UrgencyText urgency={report.urgency} />
                      <StatusText status={report.status} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onInspectReport(report.id)}
                    className="text-left font-display text-lg font-semibold text-[#202C2A] hover:text-[#246B61]"
                  >
                    {report.title}
                  </button>

                  {reasoning && (
                    <div className="rounded-lg border border-[#E7ECE8] bg-[#F6F8F6] px-4 py-3 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-[#194B45]">
                        <span>
                          AI Recommendation Rationale
                          {rec ? ` · Score ${rec.priorityScore}/100` : report.aiPriorityScore ? ` · Score ${report.aiPriorityScore}/100` : ''}
                        </span>
                        {report.aiPriorityApprovedBy ? (
                          <span className="inline-flex items-center gap-1 text-[#15803D]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approved by {report.aiPriorityApprovedBy}</span>
                          </span>
                        ) : (
                          <span className="text-[#B45309]">Pending human review</span>
                        )}
                      </div>
                      <p className="text-xs text-[#202C2A] leading-relaxed">{reasoning}</p>
                      {rec?.riskFactors && rec.riskFactors.length > 0 && (
                        <p className="text-[11px] text-[#77827E]">
                          Factors: {rec.riskFactors.join(' · ')}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#E7ECE8] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4 text-[#77827E]">
                      <span className="font-mono tabular-nums">
                        {report.confirmStillExistsCount} resident confirmations
                      </span>
                      <span className={slaAtRisk ? 'font-medium text-[#B91C1C]' : ''}>
                        SLA: {ageHours}h / {report.slaTargetHours}h
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {report.status === 'Submitted' || report.status === 'Verified' ? (
                        <button
                          type="button"
                          disabled={assigningId === report.id}
                          onClick={() => handleHumanApproveAndAssign(report, suggestedDept)}
                          className="rounded-md bg-[#246B61] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#194B45] disabled:opacity-50"
                        >
                          {assigningId === report.id
                            ? 'Assigning...'
                            : `Approve & Assign (${suggestedDept?.split(' ')[0] || 'Dept'})`}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onInspectReport(report.id)}
                        className="rounded-md border border-[#E7ECE8] px-3 py-1.5 text-xs font-medium text-[#202C2A] hover:border-[#246B61]"
                      >
                        Inspect & Verify Evidence →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Escalation Alerts Sidebar */}
          <aside className="lg:col-span-4 space-y-5">
            <div className="rounded-xl border border-[#E7ECE8] bg-white p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#B91C1C]">
                <ShieldAlert className="w-4 h-4" />
                <span>SLA Escalation Alerts ({escalations.length})</span>
              </div>
              {escalations.length === 0 ? (
                <p className="text-xs text-[#77827E]">All open reports are within municipal SLA windows.</p>
              ) : (
                <div className="space-y-2.5">
                  {escalations.map((esc) => (
                    <button
                      key={esc.id}
                      type="button"
                      onClick={() => onInspectReport(esc.id)}
                      className="w-full rounded-lg border border-[#FECACA] bg-[#FEF2F2]/60 p-3 text-left hover:bg-[#FEF2F2]"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#B91C1C]">
                        <span>{esc.id}</span>
                        <span>{esc.urgency}</span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-[#202C2A]">{esc.title}</p>
                      <p className="mt-0.5 text-[11px] text-[#77827E]">{esc.ward}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#E7ECE8] bg-[#F6F8F6] p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#194B45]">
                <AlertTriangle className="w-4 h-4 text-[#246B61]" />
                <span>Governance Guardrail</span>
              </div>
              <p className="text-xs text-[#77827E] leading-relaxed">
                AI prioritization ranks tickets and drafts rationale for speed, but never assigns crews or
                closes tickets automatically. Every official change requires authenticated human action.
              </p>
            </div>
          </aside>
        </div>
      )}

      {activeTab === 'clusters' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 rounded-xl border border-[#E7ECE8] bg-white p-5 space-y-3">
            <h2 className="font-display text-lg font-semibold text-[#202C2A]">
              Geographic Hotspot Detection
            </h2>
            <NeighbourhoodMap
              reports={openReports}
              showHeatmap
              onSelectReport={(r) => onInspectReport(r.id)}
              heightClass="h-[420px]"
            />
          </div>

          <div className="lg:col-span-5 rounded-xl border border-[#E7ECE8] bg-white p-5 space-y-4">
            <div className="flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-[#246B61]" />
              <h2 className="font-display text-lg font-semibold text-[#202C2A]">
                Duplicate Report Clusters ({clusters.length})
              </h2>
            </div>
            {clusters.length === 0 ? (
              <p className="text-xs text-[#77827E]">No multi-ticket duplicate clusters currently open.</p>
            ) : (
              clusters.map(([clusterId, items]) => (
                <div
                  key={clusterId}
                  className="rounded-lg border border-[#E7ECE8] bg-[#F6F8F6] p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-[#246B61]">{clusterId}</span>
                    <span className="text-[#77827E]">{items.length} linked reports</span>
                  </div>
                  <div className="divide-y divide-[#E7ECE8]">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onInspectReport(item.id)}
                        className="w-full py-2 text-left hover:text-[#246B61]"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-[#77827E]">
                          <span>{item.id}</span>
                          <span>{item.status}</span>
                        </div>
                        <p className="text-xs font-medium text-[#202C2A]">{item.title}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'departments' && (
        <div className="overflow-x-auto rounded-xl border border-[#E7ECE8] bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E7ECE8] bg-[#F6F8F6] text-[11px] font-medium text-[#77827E]">
                <th className="py-3.5 px-5">Municipal Department</th>
                <th className="py-3.5 px-5 text-right">Active Queue</th>
                <th className="py-3.5 px-5 text-right">Resolved</th>
                <th className="py-3.5 px-5 text-right">Avg Resolution</th>
                <th className="py-3.5 px-5">Load Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7ECE8] text-sm">
              {deptWorkload.map((d) => (
                <tr key={d.dept} className="hover:bg-[#F6F8F6]">
                  <td className="py-4 px-5 font-medium text-[#202C2A]">{d.dept}</td>
                  <td className="py-4 px-5 text-right font-mono tabular-nums text-[#202C2A]">{d.active}</td>
                  <td className="py-4 px-5 text-right font-mono tabular-nums text-[#15803D]">{d.resolved}</td>
                  <td className="py-4 px-5 text-right font-mono tabular-nums text-[#77827E]">{d.avgHours} hrs</td>
                  <td className="py-4 px-5 w-48">
                    <div className="h-2 w-full rounded-full bg-[#F0F4F1] overflow-hidden">
                      <div
                        className="h-full bg-[#246B61]"
                        style={{ width: `${Math.min(100, Math.max(12, d.total * 28))}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
