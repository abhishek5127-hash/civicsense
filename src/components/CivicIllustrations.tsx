import { useState } from 'react';
import { Camera } from 'lucide-react';
import type { IllustrationKey } from '../types';

export function HeroNeighborhoodIllustration() {
  return (
    <svg
      viewBox="0 0 720 460"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full object-cover"
      role="img"
      aria-label="Architectural illustration of a calm tree-lined neighbourhood street monitored by CivicSense"
    >
      <rect width="720" height="460" fill="#F6F8F6" />

      {/* Soft morning sky and horizon hills */}
      <circle cx="565" cy="96" r="56" fill="#F0F4F1" />
      <circle cx="565" cy="96" r="34" fill="#A9C4B4" fillOpacity="0.28" />
      <path d="M0 300 Q180 260 390 288 T720 274 L720 460 L0 460 Z" fill="#F0F4F1" />

      {/* Clean architectural neighbourhood blocks */}
      <rect x="44" y="180" width="112" height="140" rx="6" fill="#FFFFFF" stroke="#E7ECE8" strokeWidth="1.5" />
      <rect x="64" y="202" width="24" height="32" rx="2" fill="#F0F4F1" />
      <rect x="104" y="202" width="24" height="32" rx="2" fill="#F0F4F1" />
      <rect x="64" y="250" width="24" height="32" rx="2" fill="#F0F4F1" />
      <rect x="104" y="250" width="24" height="32" rx="2" fill="#A9C4B4" fillOpacity="0.45" />

      <rect x="176" y="138" width="128" height="182" rx="6" fill="#FFFFFF" stroke="#E7ECE8" strokeWidth="1.5" />
      <rect x="196" y="160" width="88" height="16" rx="2" fill="#F0F4F1" />
      <rect x="196" y="192" width="38" height="42" rx="2" fill="#F0F4F1" />
      <rect x="246" y="192" width="38" height="42" rx="2" fill="#F0F4F1" />
      <rect x="196" y="248" width="38" height="42" rx="2" fill="#A9C4B4" fillOpacity="0.4" />
      <rect x="246" y="248" width="38" height="42" rx="2" fill="#F0F4F1" />

      <rect x="458" y="156" width="136" height="164" rx="6" fill="#FFFFFF" stroke="#E7ECE8" strokeWidth="1.5" />
      <rect x="478" y="180" width="28" height="34" rx="2" fill="#F0F4F1" />
      <rect x="518" y="180" width="28" height="34" rx="2" fill="#F0F4F1" />
      <rect x="558" y="180" width="18" height="34" rx="2" fill="#A9C4B4" fillOpacity="0.4" />
      <rect x="478" y="230" width="98" height="58" rx="3" fill="#F6F8F6" stroke="#E7ECE8" />

      {/* Trees */}
      <circle cx="356" cy="236" r="42" fill="#A9C4B4" fillOpacity="0.55" />
      <circle cx="384" cy="248" r="32" fill="#246B61" fillOpacity="0.22" />
      <rect x="364" y="264" width="6" height="58" rx="3" fill="#194B45" fillOpacity="0.45" />

      <circle cx="638" cy="246" r="36" fill="#A9C4B4" fillOpacity="0.5" />
      <rect x="635" y="270" width="6" height="52" rx="3" fill="#194B45" fillOpacity="0.45" />

      {/* Sidewalk & avenue */}
      <rect x="0" y="320" width="720" height="24" fill="#FFFFFF" stroke="#E7ECE8" strokeWidth="1" />
      <rect x="0" y="344" width="720" height="116" fill="#202C2A" fillOpacity="0.06" />
      <line x1="28" y1="398" x2="118" y2="398" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      <line x1="168" y1="398" x2="258" y2="398" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      <line x1="308" y1="398" x2="398" y2="398" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      <line x1="448" y1="398" x2="538" y2="398" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      <line x1="588" y1="398" x2="678" y2="398" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />

      {/* Streetlamp */}
      <path d="M424 320V198C424 189 431 182 440 182H462" stroke="#194B45" strokeWidth="3.5" strokeLinecap="round" />
      <rect x="454" y="180" width="16" height="5" rx="2" fill="#246B61" />

      {/* CivicSense radar pulse arcs around resolved street point */}
      <circle cx="246" cy="368" r="46" stroke="#246B61" strokeOpacity="0.18" strokeWidth="1.5" strokeDasharray="4 4" />
      <circle cx="246" cy="368" r="24" fill="#246B61" fillOpacity="0.12" />
      <path
        d="M246 332C235.5 332 227 340.5 227 351C227 364.2 246 378 246 378C246 378 265 364.2 265 351C265 340.5 256.5 332 246 332Z"
        fill="#246B61"
      />
      <circle cx="246" cy="350" r="6.5" fill="#FFFFFF" />
      <path d="M243 350L245.2 352.2L249.5 347.8" stroke="#246B61" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      {/* Subtle second marker */}
      <circle cx="534" cy="354" r="14" fill="#FFFFFF" stroke="#246B61" strokeWidth="2" />
      <circle cx="534" cy="354" r="5" fill="#246B61" />
    </svg>
  );
}

function EditorialIssueSvg({ kind }: { kind: IllustrationKey }) {
  return (
    <svg viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
      <rect width="400" height="280" fill="#F6F8F6" />
      <rect y="186" width="400" height="94" fill="#E7ECE8" />
      <line x1="0" y1="186" x2="400" y2="186" stroke="#D1DBD3" strokeWidth="2" />

      {kind === 'pothole' && (
        <>
          <rect y="200" width="400" height="80" fill="#D5DDD7" />
          <path d="M126 226 C150 212, 245 212, 272 228 C286 238, 260 256, 200 258 C142 256, 114 238, 126 226 Z" fill="#202C2A" fillOpacity="0.82" />
          <path d="M138 232 C164 222, 232 222, 258 234" stroke="#A9C4B4" strokeWidth="2" strokeLinecap="round" />
          <path d="M98 242 L120 232 M276 234 L302 246" stroke="#77827E" strokeWidth="2" strokeLinecap="round" />
          <path d="M58 186 V140 L74 140 L74 186" fill="#FFFFFF" stroke="#246B61" strokeWidth="2" />
          <rect x="52" y="152" width="28" height="8" rx="2" fill="#B45309" />
        </>
      )}

      {kind === 'streetlight' && (
        <>
          <rect width="400" height="186" fill="#EEF3EF" />
          <path d="M172 186 V62 C172 50 182 40 194 40 H248" stroke="#194B45" strokeWidth="6" strokeLinecap="round" />
          <rect x="234" y="38" width="28" height="9" rx="3" fill="#202C2A" />
          <path d="M236 52 L212 128 H282 L258 52 Z" fill="#A9C4B4" fillOpacity="0.22" stroke="#A9C4B4" strokeDasharray="4 4" />
          <circle cx="96" cy="144" r="32" fill="#A9C4B4" fillOpacity="0.45" />
          <rect x="93" y="160" width="6" height="26" fill="#194B45" fillOpacity="0.5" />
        </>
      )}

      {kind === 'waste' && (
        <>
          <rect x="132" y="114" width="62" height="72" rx="6" fill="#246B61" />
          <rect x="128" y="106" width="70" height="10" rx="3" fill="#194B45" />
          <rect x="206" y="122" width="58" height="64" rx="6" fill="#A9C4B4" />
          <circle cx="272" cy="176" r="14" fill="#77827E" fillOpacity="0.45" />
          <circle cx="292" cy="180" r="10" fill="#202C2A" fillOpacity="0.25" />
          <circle cx="156" cy="96" r="12" fill="#A9C4B4" fillOpacity="0.7" />
        </>
      )}

      {kind === 'water' && (
        <>
          <rect x="150" y="172" width="100" height="16" rx="3" fill="#202C2A" fillOpacity="0.2" />
          <path d="M196 172 C196 146, 214 146, 214 172" stroke="#246B61" strokeWidth="3.5" fill="none" />
          <ellipse cx="206" cy="222" rx="92" ry="22" fill="#246B61" fillOpacity="0.22" stroke="#246B61" strokeOpacity="0.5" strokeWidth="1.5" />
          <ellipse cx="212" cy="224" rx="54" ry="12" fill="#246B61" fillOpacity="0.18" />
        </>
      )}

      {kind === 'park' && (
        <>
          <circle cx="176" cy="108" r="54" fill="#A9C4B4" fillOpacity="0.55" />
          <circle cx="224" cy="118" r="42" fill="#246B61" fillOpacity="0.28" />
          <rect x="176" y="132" width="10" height="54" fill="#194B45" fillOpacity="0.65" />
          <path d="M186 146 Q246 154 294 172" stroke="#194B45" strokeWidth="6" strokeLinecap="round" />
          <path d="M40 162 Q200 176 360 162" stroke="#77827E" strokeWidth="2" strokeDasharray="5 4" />
        </>
      )}

      {kind === 'traffic' && (
        <>
          <rect y="206" width="400" height="74" fill="#D5DDD7" />
          <rect x="78" y="218" width="38" height="44" rx="2" fill="#FFFFFF" fillOpacity="0.55" />
          <rect x="136" y="218" width="38" height="44" rx="2" fill="#FFFFFF" fillOpacity="0.3" />
          <rect x="194" y="218" width="38" height="44" rx="2" fill="#FFFFFF" fillOpacity="0.65" />
          <rect x="252" y="218" width="38" height="44" rx="2" fill="#FFFFFF" fillOpacity="0.25" />
          <rect x="308" y="96" width="4" height="90" fill="#194B45" />
          <polygon points="310,66 334,104 286,104" fill="#FFFFFF" stroke="#B45309" strokeWidth="3" />
        </>
      )}

      {kind === 'resolved' && (
        <>
          <rect y="200" width="400" height="80" fill="#CFDAD2" />
          <rect x="110" y="214" width="180" height="42" rx="4" fill="#246B61" fillOpacity="0.18" stroke="#246B61" strokeWidth="1.5" />
          <circle cx="200" cy="126" r="34" fill="#246B61" fillOpacity="0.14" />
          <circle cx="200" cy="126" r="22" fill="#246B61" />
          <path d="M190 126L197 133L211 119" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

export function IssueVisual({
  imageData,
  illustrationKey = 'pothole',
  alt,
  className = 'w-full h-48',
}: {
  imageData?: string;
  illustrationKey?: IllustrationKey;
  alt: string;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (imageData && !imgError) {
    return (
      <div className={`relative overflow-hidden bg-[#F6F8F6] ${className}`}>
        <img
          src={imageData}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#F6F8F6] ${className}`}>
      <EditorialIssueSvg kind={illustrationKey} />
      <div className="sr-only">
        <Camera className="w-4 h-4" />
        <span>{alt}</span>
      </div>
    </div>
  );
}

export function createSampleIssueImageDataUrl(kind: 'pothole' | 'streetlight' | 'waste'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Sky / backdrop
  ctx.fillStyle = kind === 'streetlight' ? '#1E293B' : '#DCE4DF';
  ctx.fillRect(0, 0, 640, 260);

  // Sidewalk & curb
  ctx.fillStyle = '#CBD5CE';
  ctx.fillRect(0, 250, 640, 42);

  // Asphalt road
  ctx.fillStyle = kind === 'streetlight' ? '#2B3540' : '#4A5452';
  ctx.fillRect(0, 292, 640, 188);

  if (kind === 'pothole') {
    // Cracked pothole cavity with pooled rainwater
    ctx.fillStyle = '#242A29';
    ctx.beginPath();
    ctx.ellipse(320, 382, 130, 48, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#536A67';
    ctx.beginPath();
    ctx.ellipse(326, 386, 90, 26, 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1F2524';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(190, 382);
    ctx.lineTo(140, 405);
    ctx.moveTo(450, 376);
    ctx.lineTo(505, 396);
    ctx.stroke();
  } else if (kind === 'streetlight') {
    // Unlit pole at twilight
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(260, 270);
    ctx.lineTo(260, 70);
    ctx.lineTo(350, 70);
    ctx.stroke();
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(334, 64, 42, 16);
    ctx.fillStyle = '#334155';
    ctx.fillRect(420, 150, 140, 110);
  } else {
    // Overflowing municipal bins
    ctx.fillStyle = '#1E5B4F';
    ctx.fillRect(210, 178, 86, 108);
    ctx.fillRect(310, 186, 82, 100);
    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.arc(425, 272, 24, 0, Math.PI * 2);
    ctx.arc(458, 276, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78716C';
    ctx.beginPath();
    ctx.arc(254, 172, 26, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL('image/png');
}
