import { useMemo, useState } from 'react';
import { FileText, Plus, Search } from 'lucide-react';
import { StatusText, UrgencyText, formatDateTime } from '../components/CivicBrand';
import type { CivicReport, UserProfile } from '../types';

interface MyReportsPageProps {
  user: UserProfile;
  reports: CivicReport[];
  onInspectReport: (reportId: string) => void;
  onStartReport: () => void;
}

export function MyReportsPage({ user, reports, onInspectReport, onStartReport }: MyReportsPageProps) {
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Resolved'>('All');
  const [search, setSearch] = useState('');

  const myReports = useMemo(() => {
    return reports.filter((r) => {
      const isMine =
        r.reporterId === user.id || r.validations.some((v) => v.userId === user.id);
      if (!isMine) return false;
      if (statusFilter === 'Open' && r.status === 'Resolved') return false;
      if (statusFilter === 'Resolved' && r.status !== 'Resolved') return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          r.id.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reports, user.id, statusFilter, search]);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 lg:py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E7ECE8] pb-6">
        <div>
          <p className="text-xs font-medium text-[#246B61]">Personal Ledger</p>
          <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-[#202C2A]">
            My reports & verified confirmations
          </h1>
          <p className="mt-1.5 text-sm text-[#77827E]">
            Every issue you reported or corroborated, with live resolution stages.
          </p>
        </div>
        <button
          type="button"
          onClick={onStartReport}
          className="inline-flex items-center gap-2 rounded-lg bg-[#246B61] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#194B45] transition-colors whitespace-nowrap self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Report</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-lg bg-[#F0F4F1] p-1 self-start">
          {(['All', 'Open', 'Resolved'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab ? 'bg-white text-[#202C2A] shadow-xs' : 'text-[#77827E] hover:text-[#202C2A]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#77827E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID, street, or category..."
            className="w-full rounded-lg border border-[#E7ECE8] bg-white pl-9 pr-3 py-2 text-sm text-[#202C2A] focus:border-[#246B61] focus:outline-none"
          />
        </div>
      </div>

      {myReports.length === 0 ? (
        <div className="rounded-xl border border-[#E7ECE8] bg-[#F6F8F6] py-14 px-6 text-center">
          <FileText className="w-8 h-8 text-[#A9C4B4] mx-auto" />
          <h2 className="mt-3 font-display text-lg font-semibold text-[#202C2A]">No matching reports</h2>
          <p className="mt-1 text-sm text-[#77827E] max-w-md mx-auto">
            {search || statusFilter !== 'All'
              ? 'Try clearing your status filter or search query.'
              : 'Your submitted issues and community confirmations will appear here.'}
          </p>
          <button
            type="button"
            onClick={onStartReport}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#246B61] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#194B45]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Your First Report</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E7ECE8] bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E7ECE8] bg-[#F6F8F6] text-[11px] font-medium text-[#77827E]">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Issue & Location</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7ECE8] text-sm">
              {myReports.map((report) => {
                const isReporter = report.reporterId === user.id;
                return (
                  <tr
                    key={report.id}
                    onClick={() => onInspectReport(report.id)}
                    className="hover:bg-[#F6F8F6] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-medium text-[#202C2A] tabular-nums whitespace-nowrap">
                      {report.id}
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="font-medium text-[#202C2A] truncate">{report.title}</p>
                      <p className="text-xs text-[#77827E] truncate">
                        {report.category} · {report.address}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#77827E] whitespace-nowrap">
                      {isReporter ? 'Reporter' : 'Confirmed'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <UrgencyText urgency={report.urgency} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusText status={report.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-[#77827E] tabular-nums whitespace-nowrap">
                      {formatDateTime(report.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
