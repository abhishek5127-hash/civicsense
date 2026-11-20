import { useMemo, useState } from 'react';
import { ArrowRight, Layers, Radar } from 'lucide-react';
import { CATEGORIES, StatusText, UrgencyText, formatRelativeTime } from '../components/CivicBrand';
import { IssueVisual } from '../components/CivicIllustrations';
import { NeighbourhoodMap } from '../components/NeighbourhoodMap';
import type { CivicReport, IssueCategory, UrgencyLevel } from '../types';

interface ExploreMapPageProps {
  reports: CivicReport[];
  onInspectReport: (reportId: string) => void;
}

export function ExploreMapPage({ reports, onInspectReport }: ExploreMapPageProps) {
  const [categoryFilter, setCategoryFilter] = useState<'All' | IssueCategory>('All');
  const [urgencyFilter, setUrgencyFilter] = useState<'All' | UrgencyLevel>('All');
  const [includeResolved, setIncludeResolved] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [radarKm, setRadarKm] = useState<number>(1);
  const [selectedReport, setSelectedReport] = useState<CivicReport | null>(reports[0] || null);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (!includeResolved && r.status === 'Resolved') return false;
      if (categoryFilter !== 'All' && r.category !== categoryFilter) return false;
      if (urgencyFilter !== 'All' && r.urgency !== urgencyFilter) return false;
      return true;
    });
  }, [reports, includeResolved, categoryFilter, urgencyFilter]);

  const activeInspection =
    selectedReport && filteredReports.some((r) => r.id === selectedReport.id)
      ? selectedReport
      : filteredReports[0] || null;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8 lg:py-10 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#E7ECE8] pb-5">
        <div>
          <p className="text-xs font-medium text-[#246B61]">Neighbourhood Radar</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-[#202C2A]">
            Explore civic activity around your streets
          </h1>
        </div>

        {/* Radar & Density Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-[#F0F4F1] p-1">
            <span className="px-2 text-[11px] font-medium text-[#77827E] inline-flex items-center gap-1">
              <Radar className="w-3.5 h-3.5 text-[#246B61]" />
              <span>Radar</span>
            </span>
            {[0.5, 1, 2].map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => setRadarKm(km)}
                className={`rounded-md px-2.5 py-1 text-xs font-mono transition-colors ${
                  radarKm === km ? 'bg-white text-[#202C2A] shadow-xs' : 'text-[#77827E] hover:text-[#202C2A]'
                }`}
              >
                {km < 1 ? '500m' : `${km}km`}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowHeatmap((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              showHeatmap
                ? 'border-[#246B61] bg-[#F0F4F1] text-[#194B45]'
                : 'border-[#E7ECE8] bg-white text-[#202C2A]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Density Heatmap</span>
          </button>

          <button
            type="button"
            onClick={() => setIncludeResolved((v) => !v)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              includeResolved
                ? 'border-[#246B61] bg-[#F0F4F1] text-[#194B45]'
                : 'border-[#E7ECE8] bg-white text-[#77827E]'
            }`}
          >
            {includeResolved ? 'Showing Resolved' : 'Open Only'}
          </button>
        </div>
      </div>

      {/* Category & Severity Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategoryFilter('All')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              categoryFilter === 'All'
                ? 'bg-[#246B61] text-white'
                : 'bg-[#F6F8F6] text-[#77827E] hover:text-[#202C2A]'
            }`}
          >
            All categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                categoryFilter === cat
                  ? 'bg-[#246B61] text-white'
                  : 'bg-[#F6F8F6] text-[#77827E] hover:text-[#202C2A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setUrgencyFilter(sev)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                urgencyFilter === sev
                  ? 'border border-[#246B61] bg-[#F0F4F1] text-[#194B45]'
                  : 'border border-[#E7ECE8] bg-white text-[#77827E] hover:text-[#202C2A]'
              }`}
            >
              {sev === 'All' ? 'All severity' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Map + Inspection Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <NeighbourhoodMap
            reports={filteredReports}
            selectedId={activeInspection?.id}
            onSelectReport={(rep) => setSelectedReport(rep)}
            showHeatmap={showHeatmap}
            radarRadiusKm={radarKm}
            heightClass="h-[520px]"
          />
          <div className="mt-3 flex items-center justify-between text-xs text-[#77827E]">
            <span>
              Showing <span className="font-mono text-[#202C2A] tabular-nums">{filteredReports.length}</span>{' '}
              reports within {radarKm < 1 ? '500m' : `${radarKm}km`} neighbourhood corridor
            </span>
            <span>Click any map marker to inspect timeline & confirmations</span>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          {activeInspection ? (
            <div className="rounded-xl border border-[#E7ECE8] bg-white overflow-hidden">
              <IssueVisual
                imageData={activeInspection.imageData}
                illustrationKey={
                  activeInspection.status === 'Resolved' ? 'resolved' : activeInspection.illustrationKey
                }
                alt={activeInspection.title}
                className="w-full h-44 border-b border-[#E7ECE8]"
              />
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#77827E]">
                  <span className="font-mono text-[#202C2A] tabular-nums">{activeInspection.id}</span>
                  <span>{formatRelativeTime(activeInspection.createdAt)}</span>
                </div>
                <h2 className="font-display text-lg font-semibold text-[#202C2A]">
                  {activeInspection.title}
                </h2>
                <p className="text-xs text-[#77827E] leading-relaxed">{activeInspection.description}</p>
                <div className="pt-2 border-t border-[#E7ECE8] flex items-center justify-between">
                  <StatusText status={activeInspection.status} />
                  <UrgencyText urgency={activeInspection.urgency} />
                </div>
                <div className="text-xs text-[#77827E] flex items-center justify-between">
                  <span>{activeInspection.address}</span>
                  <span className="font-mono tabular-nums text-[#202C2A]">
                    {activeInspection.confirmStillExistsCount} confirmed
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onInspectReport(activeInspection.id)}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[#246B61] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#194B45] transition-colors"
                >
                  <span>Open Full Resolution Timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#E7ECE8] bg-[#F6F8F6] p-8 text-center text-sm text-[#77827E]">
              No reports match the active category and severity filters.
            </div>
          )}

          {/* Compact Nearby List */}
          <div className="rounded-xl border border-[#E7ECE8] bg-white p-4">
            <h3 className="text-xs font-semibold text-[#202C2A] mb-3">Nearby list ({filteredReports.length})</h3>
            <div className="max-h-56 overflow-y-auto divide-y divide-[#E7ECE8]">
              {filteredReports.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReport(r)}
                  className={`w-full py-2.5 px-2 text-left rounded transition-colors ${
                    activeInspection?.id === r.id ? 'bg-[#F0F4F1]' : 'hover:bg-[#F6F8F6]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-[#77827E]">
                    <span className="font-mono text-[#202C2A] tabular-nums">{r.id}</span>
                    <span>{r.status}</span>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-[#202C2A] truncate">{r.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
