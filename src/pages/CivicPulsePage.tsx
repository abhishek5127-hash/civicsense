import { useEffect, useState } from 'react';
import { Flame, TrendingUp } from 'lucide-react';
import { api } from '../api';
import { WARDS, StatusText, formatRelativeTime } from '../components/CivicBrand';
import { NeighbourhoodMap } from '../components/NeighbourhoodMap';
import type { CivicReport, IssueCategory, WardTrendPoint } from '../types';

interface CivicPulsePageProps {
  reports: CivicReport[];
  onInspectReport: (reportId: string) => void;
}

export function CivicPulsePage({ reports, onInspectReport }: CivicPulsePageProps) {
  const [selectedWard, setSelectedWard] = useState<string>('All');
  const [pulseData, setPulseData] = useState<{
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
  } | null>(null);

  useEffect(() => {
    api.getCivicPulse(selectedWard).then(setPulseData).catch(() => {});
  }, [selectedWard, reports]);

  const wardReports =
    selectedWard === 'All' ? reports : reports.filter((r) => r.ward === selectedWard);

  const maxCatTotal = Math.max(
    1,
    ...(pulseData?.categoryCounts.map((c) => c.total) || [1])
  );

  // SVG Trend chart scaling
  const trends = pulseData?.trends || [];
  const maxTrendVal = Math.max(
    10,
    ...trends.flatMap((t) => [t.reported, t.resolved])
  );

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8 lg:py-12 space-y-10">
      {/* Header + Ward Selector */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#E7ECE8] pb-6">
        <div>
          <p className="text-xs font-medium text-[#246B61]">CivicPulse Neighbourhood Intelligence</p>
          <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-[#202C2A]">
            Civic condition & resolution health
          </h1>
          <p className="mt-1 text-sm text-[#77827E]">
            Live neighbourhood breakdown of recurring problems, emerging hotspots, and closure velocity.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedWard('All')}
            className={`rounded-md px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              selectedWard === 'All'
                ? 'bg-[#246B61] text-white'
                : 'bg-[#F6F8F6] text-[#77827E] hover:text-[#202C2A]'
            }`}
          >
            All East Wards
          </button>
          {WARDS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setSelectedWard(w)}
              className={`rounded-md px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                selectedWard === w
                  ? 'bg-[#246B61] text-white'
                  : 'bg-[#F6F8F6] text-[#77827E] hover:text-[#202C2A]'
              }`}
            >
              {w.split(' · ')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* Headline Intelligence Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-5 border border-[#E7ECE8] rounded-xl bg-white divide-y lg:divide-y-0 lg:divide-x divide-[#E7ECE8]">
        <div className="p-5">
          <p className="text-xs text-[#77827E]">Total logged</p>
          <p className="mt-1 font-mono text-2xl font-medium text-[#202C2A] tabular-nums">
            {pulseData?.summary.total ?? wardReports.length}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs text-[#77827E]">Active unresolved</p>
          <p className="mt-1 font-mono text-2xl font-medium text-[#B45309] tabular-nums">
            {pulseData?.summary.open ?? 0}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs text-[#77827E]">Resolved & verified</p>
          <p className="mt-1 font-mono text-2xl font-medium text-[#15803D] tabular-nums">
            {pulseData?.summary.resolved ?? 0}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs text-[#77827E]">Resolution rate</p>
          <p className="mt-1 font-mono text-2xl font-medium text-[#246B61] tabular-nums">
            {pulseData?.summary.resolutionRate ?? 0}%
          </p>
        </div>
        <div className="p-5 col-span-2 lg:col-span-1">
          <p className="text-xs text-[#77827E]">Resident validations</p>
          <p className="mt-1 font-mono text-2xl font-medium text-[#202C2A] tabular-nums">
            {pulseData?.summary.totalConfirmations ?? 0}
          </p>
        </div>
      </section>

      {/* Main Bento: Hotspot Map + Resolved vs Unresolved Trend */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 rounded-xl border border-[#E7ECE8] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#202C2A]">
                Hotspot density & spatial distribution
              </h2>
              <p className="text-xs text-[#77827E]">
                Shaded clusters mark streets with multiple open reports or high confirmation volume
              </p>
            </div>
          </div>
          <NeighbourhoodMap
            reports={wardReports}
            showHeatmap
            onSelectReport={(r) => onInspectReport(r.id)}
            heightClass="h-[360px]"
          />
        </div>

        {/* Resolved vs Reported Community Trend Chart */}
        <div className="lg:col-span-5 rounded-xl border border-[#E7ECE8] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#202C2A]">
                Community activity trend
              </h2>
              <p className="text-xs text-[#77827E]">Weekly reported vs. resolved volume</p>
            </div>
            <TrendingUp className="w-4 h-4 text-[#246B61]" />
          </div>

          <div className="pt-2">
            <svg viewBox="0 0 360 190" className="w-full h-48 overflow-visible" role="img" aria-label="Weekly reported vs resolved issues chart">
              {[0, 0.25, 0.5, 0.75, 1].map((step) => {
                const y = 155 - step * 130;
                return (
                  <g key={step}>
                    <line x1="28" y1={y} x2="348" y2={y} stroke="#E7ECE8" strokeWidth="1" />
                    <text x="20" y={y + 3} textAnchor="end" fontSize="9" fill="#77827E" fontFamily="JetBrains Mono">
                      {Math.round(step * maxTrendVal)}
                    </text>
                  </g>
                );
              })}

              {trends.length > 1 && (
                <>
                  {/* Reported polyline */}
                  <polyline
                    fill="none"
                    stroke="#77827E"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    points={trends
                      .map((t, i) => {
                        const x = 42 + (i * 292) / (trends.length - 1);
                        const y = 155 - (t.reported / maxTrendVal) * 130;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                  {/* Resolved polyline */}
                  <polyline
                    fill="none"
                    stroke="#246B61"
                    strokeWidth="2.5"
                    points={trends
                      .map((t, i) => {
                        const x = 42 + (i * 292) / (trends.length - 1);
                        const y = 155 - (t.resolved / maxTrendVal) * 130;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                  {trends.map((t, i) => {
                    const x = 42 + (i * 292) / (trends.length - 1);
                    const yRep = 155 - (t.reported / maxTrendVal) * 130;
                    const yRes = 155 - (t.resolved / maxTrendVal) * 130;
                    return (
                      <g key={t.week}>
                        <circle cx={x} cy={yRep} r="3" fill="#77827E" />
                        <circle cx={x} cy={yRes} r="3.5" fill="#246B61" />
                        <text x={x} y="176" textAnchor="middle" fontSize="9.5" fill="#77827E">
                          {t.week}
                        </text>
                      </g>
                    );
                  })}
                </>
              )}
            </svg>
            <div className="mt-2 flex items-center gap-6 text-xs text-[#77827E]">
              <span className="inline-flex items-center gap-2">
                <span className="w-3 h-0.5 bg-[#246B61]" />
                <span>Resolved with evidence</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-3 h-0.5 bg-[#77827E]" />
                <span>Reported volume</span>
              </span>
            </div>
          </div>

          {/* Emerging Hotspots */}
          <div className="border-t border-[#E7ECE8] pt-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#202C2A]">
              <Flame className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Emerging hotspot corridors</span>
            </div>
            {(pulseData?.hotspots || []).slice(0, 3).map((spot) => (
              <button
                key={spot.id}
                type="button"
                onClick={() => onInspectReport(spot.reportIds[0])}
                className="w-full rounded-lg border border-[#E7ECE8] bg-[#F6F8F6] px-3.5 py-2.5 text-left hover:border-[#246B61] transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#202C2A] truncate">{spot.area}</span>
                  <span className="font-mono text-[#B45309] tabular-nums shrink-0 ml-2">
                    {spot.totalConfirmations} confirms
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#77827E]">
                  {spot.category} · {spot.count} active report(s)
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Common Local Problems + Recent Issues */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 rounded-xl border border-[#E7ECE8] bg-white p-6 space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#202C2A]">Most common local problems</h2>
            <p className="text-xs text-[#77827E]">Resolved vs. unresolved share by category</p>
          </div>
          <div className="space-y-4 pt-1">
            {(pulseData?.categoryCounts || []).map((cat) => {
              const totalPct = Math.round((cat.total / maxCatTotal) * 100);
              const resolvedPct = cat.total > 0 ? Math.round((cat.resolved / cat.total) * 100) : 0;
              return (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#202C2A]">{cat.category}</span>
                    <span className="font-mono text-[#77827E] tabular-nums">
                      {cat.open} open · {cat.resolved} resolved
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#F0F4F1] overflow-hidden">
                    <div
                      className="h-full bg-[#A9C4B4] flex"
                      style={{ width: `${Math.max(8, totalPct)}%` }}
                    >
                      <div
                        className="h-full bg-[#246B61]"
                        style={{ width: `${resolvedPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-xl border border-[#E7ECE8] bg-white p-6 space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#202C2A]">Recently reported in area</h2>
            <p className="text-xs text-[#77827E]">Latest submissions and live resolution stages</p>
          </div>
          <div className="divide-y divide-[#E7ECE8]">
            {(pulseData?.recentReports || []).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onInspectReport(r.id)}
                className="w-full py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left hover:bg-[#F6F8F6] px-2 -mx-2 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-[#77827E]">
                    <span className="font-mono text-[#202C2A] tabular-nums">{r.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{r.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatRelativeTime(r.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-[#202C2A] truncate">{r.title}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <StatusText status={r.status} />
                  <span className="font-mono text-xs text-[#77827E] tabular-nums">
                    {r.confirmStillExistsCount} confirms
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
