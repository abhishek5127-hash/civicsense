import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck2,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import type { IssueCategory, IssueStatus, UrgencyLevel } from '../types';

export const WARDS = [
  'Ward 82 · Indiranagar',
  'Ward 80 · Hoysala Nagar',
  'Ward 113 · Halasuru',
  'Ward 79 · CV Raman Nagar',
];

export const CATEGORIES: IssueCategory[] = [
  'Roads & Potholes',
  'Streetlights & Power',
  'Waste & Sanitation',
  'Water & Drainage',
  'Parks & Trees',
  'Traffic & Safety',
];

export const DEPARTMENTS = [
  'Roads & Asphalt Division',
  'Electrical & Streetlighting Cell',
  'Solid Waste Management',
  'Water Supply & Sewerage Board',
  'Stormwater & Drainage Cell',
  'Urban Forestry & Parks',
  'Traffic Engineering & Mobility',
];

export function CivicLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="1.5" y="1.5" width="25" height="25" rx="7" fill="#F0F4F1" stroke="#A9C4B4" strokeWidth="1.2" />
        <path
          d="M14 6.2C10.35 6.2 7.4 9.15 7.4 12.8C7.4 17.25 14 22.3 14 22.3C14 22.3 20.6 17.25 20.6 12.8C20.6 9.15 17.65 6.2 14 6.2Z"
          fill="#246B61"
        />
        <circle cx="14" cy="12.6" r="2.7" fill="#FFFFFF" />
        <path
          d="M14 7.9V9.3M14 15.9V17.3M9.3 12.6H10.7M17.3 12.6H18.7"
          stroke="#A9C4B4"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-display text-[19px] font-semibold tracking-tight text-[#202C2A]">
        CivicSense
      </span>
    </span>
  );
}

export function StatusText({ status }: { status: IssueStatus }) {
  switch (status) {
    case 'Resolved':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#15803D] whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Resolved</span>
        </span>
      );
    case 'Evidence Uploaded':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#194B45] whitespace-nowrap">
          <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
          <span>Evidence Uploaded</span>
        </span>
      );
    case 'In Progress':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B45309] whitespace-nowrap">
          <Wrench className="w-3.5 h-3.5 shrink-0" />
          <span>In Progress</span>
        </span>
      );
    case 'Assigned':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#246B61] whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Assigned</span>
        </span>
      );
    case 'Verified':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#246B61] whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Verified</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#77827E] whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Submitted</span>
        </span>
      );
  }
}

export function UrgencyText({ urgency }: { urgency: UrgencyLevel }) {
  switch (urgency) {
    case 'Critical':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B91C1C] whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Critical urgency</span>
        </span>
      );
    case 'High':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B45309] whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>High urgency</span>
        </span>
      );
    case 'Medium':
      return <span className="text-xs font-medium text-[#246B61] whitespace-nowrap">Medium urgency</span>;
    default:
      return <span className="text-xs font-medium text-[#77827E] whitespace-nowrap">Low urgency</span>;
  }
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
