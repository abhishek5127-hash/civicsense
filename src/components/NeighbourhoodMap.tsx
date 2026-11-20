import { useState, type MouseEvent } from 'react';
import { Crosshair, Minus, Plus, RotateCcw } from 'lucide-react';
import type { CivicReport } from '../types';

interface NeighbourhoodMapProps {
  reports: CivicReport[];
  selectedId?: string | null;
  onSelectReport?: (report: CivicReport) => void;
  showHeatmap?: boolean;
  radarRadiusKm?: number | null;
  radarCenter?: { x: number; y: number };
  pickMode?: boolean;
  pickedCoords?: { x: number; y: number };
  onPickCoords?: (coords: { x: number; y: number }) => void;
  heightClass?: string;
}

export function NeighbourhoodMap({
  reports,
  selectedId,
  onSelectReport,
  showHeatmap = false,
  radarRadiusKm = null,
  radarCenter = { x: 48, y: 45 },
  pickMode = false,
  pickedCoords,
  onPickCoords,
  heightClass = 'h-[480px]',
}: NeighbourhoodMapProps) {
  const [zoom, setZoom] = useState(1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleMapClick = (e: MouseEvent<SVGSVGElement>) => {
    if (!pickMode || !onPickCoords) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 100;
    const relY = ((e.clientY - rect.top) / rect.height) * 100;
    onPickCoords({
      x: Math.round(Math.max(8, Math.min(92, relX))),
      y: Math.round(Math.max(8, Math.min(92, relY))),
    });
  };

  const radarPx = radarRadiusKm === 0.5 ? 14 : radarRadiusKm === 1 ? 26 : radarRadiusKm === 2 ? 42 : 0;

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden rounded-xl border border-[#E7ECE8] bg-[#F6F8F6] select-none`}>
      <div
        className="w-full h-full transition-transform duration-200 ease-out origin-center"
        style={{ transform: `scale(${zoom})` }}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          onClick={handleMapClick}
          className={`w-full h-full ${pickMode ? 'cursor-crosshair' : 'cursor-default'}`}
          role="img"
          aria-label="Interactive CivicSense neighbourhood street map"
        >
          <defs>
            <radialGradient id="heatHot" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#B91C1C" stopOpacity="0.30" />
              <stop offset="60%" stopColor="#B45309" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heatTeal" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#246B61" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#246B61" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ward subtle quadrants */}
          <rect x="0" y="0" width="100" height="100" fill="#F6F8F6" />
          <path d="M27 0 V100 M67 0 V100 M0 54 H100" stroke="#E7ECE8" strokeWidth="0.35" strokeDasharray="1.5 1.5" />

          {/* Urban city blocks */}
          <rect x="6" y="7" width="18" height="16" rx="1.5" fill="#FFFFFF" stroke="#E7ECE8" strokeWidth="0.3" />
          <rect x="30" y="8" width="22" height="14" rx="1.5" fill="#FFFFFF" stroke="#E7ECE8" strokeWidth="0.3" />
          <rect x="58" y="8" width="18" height="18" rx="1.5" fill="#F0F4F1" stroke="#A9C4B4" strokeWidth="0.3" />
          <rect x="80" y="10" width="14" height="22" rx="1.5" fill="#FFFFFF" stroke="#E7ECE8" strokeWidth="0.3" />
          <rect x="8" y="31" width="16" height="18" rx="1.5" fill="#FFFFFF" stroke="#E7ECE8" strokeWidth="0.3" />
          <rect x="31" y="30" width="14" height="16" rx="1.5" fill="#FFFFFF" stroke="#E7ECE8" strokeWidth="0.3" />
          <rect x="52" y="30" width="15" height="17" rx="1.5" fill="#F0F4F1" stroke="#A9C4B4" strokeWidth="0.35" />
          <rect x="72" y="38" width="20" height="19" rx="1.5" fill="#FFFFFF" stroke="#E7ECE8" strokeWidth="0.3" />
          <rect x="10" y="58" width="20" height="24" rx="1.5" fill="#FFFFFF" stroke="#E7ECE8" strokeWidth="0.3" />
          <rect x="36" y="58" width="22" height="20" rx="1.5" fill="#FFFFFF" stroke="#E7ECE8" strokeWidth="0.3" />
          <rect x="65" y="62" width="24" height="22" rx="1.5" fill="#F0F4F1" stroke="#A9C4B4" strokeWidth="0.3" />

          {/* Secondary street grid */}
          <path
            d="M0 26 H100 M0 47 H100 M0 74 H100 M26 0 V100 M48 0 V100 M69 0 V100 M85 0 V100"
            stroke="#FFFFFF"
            strokeWidth="1.2"
          />

          {/* Primary arterial corridors */}
          <path d="M0 24 Q48 22 100 26" stroke="#FFFFFF" strokeWidth="2.4" fill="none" />
          <path d="M45 0 L47 100" stroke="#FFFFFF" strokeWidth="2.6" fill="none" />
          <path d="M0 68 Q54 66 100 72" stroke="#FFFFFF" strokeWidth="2.1" fill="none" />

          {/* Metro line alignment */}
          <path d="M0 23.8 Q48 21.8 100 25.8" stroke="#A9C4B4" strokeWidth="0.55" strokeDasharray="1.8 1.2" fill="none" />

          {/* Street labels */}
          <text x="12" y="22" fontSize="2.2" fill="#77827E" fontFamily="Plus Jakarta Sans, sans-serif">
            CMH ROAD
          </text>
          <text x="48.5" y="14" fontSize="2.2" fill="#77827E" fontFamily="Plus Jakarta Sans, sans-serif">
            100 FEET RD
          </text>
          <text x="33" y="45.5" fontSize="2.0" fill="#77827E" fontFamily="Plus Jakarta Sans, sans-serif">
            12TH MAIN
          </text>
          <text x="56" y="17" fontSize="2.0" fill="#246B61" fontFamily="Plus Jakarta Sans, sans-serif">
            INDIRANAGAR PARK
          </text>
          <text x="72" y="73" fontSize="2.0" fill="#246B61" fontFamily="Plus Jakarta Sans, sans-serif">
            BDA PARK
          </text>

          {/* Ward labels */}
          <text x="5" y="5" fontSize="2.1" fontWeight="600" fill="#77827E" fontFamily="Plus Jakarta Sans, sans-serif">
            WARD 113 · HALASURU
          </text>
          <text x="74" y="5" fontSize="2.1" fontWeight="600" fill="#77827E" fontFamily="Plus Jakarta Sans, sans-serif">
            WARD 79 · CV RAMAN
          </text>
          <text x="32" y="96" fontSize="2.1" fontWeight="600" fill="#246B61" fontFamily="Plus Jakarta Sans, sans-serif">
            WARD 82 · INDIRANAGAR
          </text>
          <text x="74" y="96" fontSize="2.1" fontWeight="600" fill="#77827E" fontFamily="Plus Jakarta Sans, sans-serif">
            WARD 80 · HOYSALA
          </text>

          {/* Issue Density Heatmap */}
          {showHeatmap &&
            reports
              .filter((r) => r.status !== 'Resolved')
              .map((r) => (
                <circle
                  key={`heat-${r.id}`}
                  cx={r.mapX}
                  cy={r.mapY}
                  r={r.urgency === 'Critical' || r.urgency === 'High' ? 12 : 8}
                  fill={r.urgency === 'Critical' || r.urgency === 'High' ? 'url(#heatHot)' : 'url(#heatTeal)'}
                />
              ))}

          {/* Neighbourhood Radar Proximity Ring */}
          {radarRadiusKm && (
            <g>
              <circle
                cx={radarCenter.x}
                cy={radarCenter.y}
                r={radarPx}
                fill="#246B61"
                fillOpacity="0.05"
                stroke="#246B61"
                strokeOpacity="0.35"
                strokeWidth="0.4"
                strokeDasharray="1.5 1"
              />
              <circle cx={radarCenter.x} cy={radarCenter.y} r="1.2" fill="#194B45" />
            </g>
          )}

          {/* Picked Location Marker (for Report Screen) */}
          {pickMode && pickedCoords && (
            <g>
              <circle
                cx={pickedCoords.x}
                cy={pickedCoords.y}
                r="4.5"
                fill="#246B61"
                fillOpacity="0.16"
                stroke="#246B61"
                strokeWidth="0.4"
              />
              <circle cx={pickedCoords.x} cy={pickedCoords.y} r="1.9" fill="#246B61" stroke="#FFFFFF" strokeWidth="0.6" />
            </g>
          )}
        </svg>
      </div>

      {/* Crisp HTML Marker Pins (avoids non-uniform SVG scaling distortion) */}
      {!pickMode &&
        reports.map((report) => {
          const isSelected = selectedId === report.id;
          const isHovered = hoveredId === report.id;
          const isResolved = report.status === 'Resolved';
          const pinColor = isResolved
            ? 'bg-[#15803D] border-white'
            : report.urgency === 'Critical'
            ? 'bg-[#B91C1C] border-white'
            : report.urgency === 'High'
            ? 'bg-[#B45309] border-white'
            : 'bg-[#246B61] border-white';

          const leftPct = 50 + (report.mapX - 50) * zoom;
          const topPct = 50 + (report.mapY - 50) * zoom;
          if (leftPct < 2 || leftPct > 98 || topPct < 2 || topPct > 98) return null;

          return (
            <div
              key={report.id}
              style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            >
              <button
                type="button"
                onClick={() => onSelectReport?.(report)}
                onMouseEnter={() => setHoveredId(report.id)}
                onMouseLeave={() => setHoveredId(null)}
                aria-label={`${report.id}: ${report.title}`}
                className={`group relative flex items-center justify-center rounded-full border-2 shadow-sm transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#246B61] ${pinColor} ${
                  isSelected ? 'w-6 h-6 scale-115 ring-4 ring-[#246B61]/25' : 'w-4.5 h-4.5 hover:scale-115'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </button>

              {(isHovered || isSelected) && (
                <div className="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-56 rounded-lg border border-[#E7ECE8] bg-white px-3 py-2 shadow-md z-30">
                  <div className="flex items-center justify-between text-[11px] text-[#77827E] font-mono tabular-nums">
                    <span>{report.id}</span>
                    <span>{report.status}</span>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-[#202C2A] line-clamp-2">{report.title}</p>
                  <p className="mt-0.5 text-[11px] text-[#77827E] truncate">{report.address}</p>
                </div>
              )}
            </div>
          );
        })}

      {/* Map Controls */}
      <div className="absolute right-3 bottom-3 flex flex-col gap-1.5 z-20">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.25).toFixed(2))))}
          aria-label="Zoom in map"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E7ECE8] bg-white text-[#202C2A] hover:bg-[#F6F8F6] transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
          aria-label="Zoom out map"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E7ECE8] bg-white text-[#202C2A] hover:bg-[#F6F8F6] transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          aria-label="Reset map zoom"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E7ECE8] bg-white text-[#202C2A] hover:bg-[#F6F8F6] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute left-3 bottom-3 flex flex-wrap items-center gap-3 rounded-lg border border-[#E7ECE8] bg-white/95 px-3 py-1.5 text-[11px] text-[#202C2A] z-20">
        {pickMode ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-[#246B61]">
            <Crosshair className="w-3.5 h-3.5" />
            <span>Click anywhere on the street grid to pin exact issue location</span>
          </span>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C]" />
              <span>Critical</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
              <span>High</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#246B61]" />
              <span>Open</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
              <span>Resolved</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
