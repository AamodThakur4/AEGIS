import { useId, useState } from 'react';
import type { Resource, Incident, ResourceType, DisasterType } from '@/types';
import { Hospital, Droplet, Ambulance, Home, HardHat, AlertTriangle, Plus, Minus, Locate, Layers } from 'lucide-react';
import { accent } from '@/lib/palette';

const markerConfig: Record<ResourceType, { icon: typeof Hospital; color: string; ink: string }> = {
  hospital: { icon: Hospital, color: '#2D4A5C', ink: accent.slate },
  blood_bank: { icon: Droplet, color: '#9B3A2C', ink: accent.critical },
  ambulance: { icon: Ambulance, color: '#C66B47', ink: accent.clay },
  shelter: { icon: Home, color: '#5B6E4F', ink: accent.moss },
  rescue: { icon: HardHat, color: '#7B5E3B', ink: accent.sand },
  incident: { icon: AlertTriangle, color: '#9B3A2C', ink: accent.critical },
};

const severitySize: Record<string, number> = { critical: 34, high: 28, moderate: 24, low: 20 };
const severityGlow: Record<string, string> = {
  critical: 'rgba(155,58,44,0.25)',
  high: 'rgba(198,107,71,0.25)',
  moderate: 'rgba(201,154,59,0.2)',
  low: 'rgba(91,110,79,0.2)',
};

const severityColor: Record<string, string> = {
  critical: '#9B3A2C',
  high: '#C66B47',
  moderate: '#C99A3B',
  low: '#5B6E4F',
};

const disasterIcon: Record<DisasterType, typeof AlertTriangle> = {
  flood: AlertTriangle,
  fire: AlertTriangle,
  earthquake: AlertTriangle,
  landslide: AlertTriangle,
  accident: AlertTriangle,
  medical: AlertTriangle,
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.5;
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

interface MapViewProps {
  resources?: Resource[];
  incidents?: Incident[];
  dark?: boolean;
  showUser?: boolean;
  height?: string;
  onMarkerClick?: (id: string) => void;
  selectedId?: string;
}

interface MapControl {
  icon: typeof Plus;
  label: string;
  onClick: () => void;
  active?: boolean;
}

export function MapView({
  resources = [],
  incidents = [],
  dark = true,
  showUser = true,
  height = '100%',
  onMarkerClick,
  selectedId,
}: MapViewProps) {
  const patternId = `map-${useId().replace(/:/g, '')}`;
  const [zoom, setZoom] = useState(1);
  const [showTerrain, setShowTerrain] = useState(true);
  const [locatePulse, setLocatePulse] = useState(0);

  const gridStroke = dark ? 'rgba(255,255,255,0.05)' : 'rgba(44,37,32,0.06)';
  const roadStroke = dark ? 'rgba(255,255,255,0.06)' : 'rgba(44,37,32,0.1)';
  const minorStroke = dark ? 'rgba(255,255,255,0.04)' : 'rgba(44,37,32,0.07)';

  const controls: MapControl[] = [
    { icon: Plus, label: 'Zoom in', onClick: () => setZoom((z) => clampZoom(z + 0.25)) },
    { icon: Minus, label: 'Zoom out', onClick: () => setZoom((z) => clampZoom(z - 0.25)) },
    {
      icon: Locate,
      label: 'Recentre on my location',
      onClick: () => {
        setZoom(1);
        setLocatePulse((p) => p + 1);
      },
    },
    {
      icon: Layers,
      label: showTerrain ? 'Hide terrain layer' : 'Show terrain layer',
      onClick: () => setShowTerrain((t) => !t),
      active: showTerrain,
    },
  ];

  return (
    <div
      className={`relative overflow-hidden border ${dark ? 'bg-surface-darkSecondary border-white/10' : 'bg-surface-page border-earth-stone/30'}`}
      style={{ height, borderRadius: '2px' }}
    >
      {/* Zoomable map layer */}
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{ transform: `scale(${zoom})`, transformOrigin: '50% 50%' }}
      >
        {/* Map background */}
        <div className="absolute inset-0">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id={patternId} width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke={gridStroke} strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill={`url(#${patternId})`} />

            {showTerrain ? (
              <g>
                {/* River / water */}
                <path d="M 0,55 Q 25,48 40,52 T 65,50 Q 80,48 100,55" fill="none" stroke="#3D6A8C" strokeWidth="3" opacity="0.3" strokeLinecap="round" />
                <path d="M 0,55 Q 25,48 40,52 T 65,50 Q 80,48 100,55" fill="none" stroke="#5B89A8" strokeWidth="1" opacity="0.5" strokeLinecap="round" />

                {/* Flood zones */}
                <ellipse cx="45" cy="50" rx="12" ry="7" fill="#3D6A8C" opacity="0.1" />
                <ellipse cx="30" cy="53" rx="10" ry="6" fill="#3D6A8C" opacity="0.08" />

                {/* Roads */}
                <line x1="0" y1="25" x2="100" y2="25" stroke={roadStroke} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="50" y1="0" x2="50" y2="100" stroke={roadStroke} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="0" y1="75" x2="100" y2="75" stroke={minorStroke} strokeWidth="1" strokeLinecap="round" />
                <line x1="20" y1="0" x2="20" y2="100" stroke={minorStroke} strokeWidth="0.8" strokeLinecap="round" />
                <line x1="75" y1="0" x2="75" y2="100" stroke={minorStroke} strokeWidth="0.8" strokeLinecap="round" />

                {/* Dispatch route */}
                <path d="M 50,50 Q 48,40 45,32" fill="none" stroke="#2D4A5C" strokeWidth="0.6" strokeDasharray="2,1.5" className="animate-route-dash" opacity="0.5" />
              </g>
            ) : (
              <g>
                {/* Contour / elevation layer */}
                {[12, 24, 36].map((r, i) => (
                  <ellipse key={r} cx="66" cy="34" rx={r} ry={r * 0.62} fill="none" stroke="#7B5E3B" strokeWidth="0.4" opacity={0.25 - i * 0.05} />
                ))}
                {[10, 20, 30].map((r, i) => (
                  <ellipse key={r} cx="26" cy="72" rx={r} ry={r * 0.55} fill="none" stroke="#5B6E4F" strokeWidth="0.4" opacity={0.25 - i * 0.05} />
                ))}
                <rect x="0" y="0" width="100" height="100" fill="#5B6E4F" opacity="0.04" />
              </g>
            )}
          </svg>
        </div>

        {/* User location marker */}
        {showUser && (
          <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <div className="relative flex items-center justify-center" key={locatePulse}>
              <div className="absolute h-10 w-10 border border-aegis-slate/40 animate-pulse-ring" style={{ borderRadius: '50%' }} />
              <div className="absolute h-10 w-10 border border-aegis-slate/30 animate-pulse-ring" style={{ borderRadius: '50%', animationDelay: '1s' }} />
              <div className="relative flex h-4 w-4 items-center justify-center border-2 border-cream/70 bg-aegis-slate" style={{ borderRadius: '50%' }}>
                <div className="h-1.5 w-1.5 rounded-full bg-cream/80" />
              </div>
            </div>
          </div>
        )}

        {/* Incident markers */}
        {incidents.map((inc) => {
          const size = severitySize[inc.severity] || 24;
          const Icon = disasterIcon[inc.type];
          const isSel = selectedId === inc.id;
          const color = severityColor[inc.severity] || severityColor.moderate;
          return (
            <button
              key={inc.id}
              onPointerDown={() => onMarkerClick?.(inc.id)}
              aria-label={`${inc.title} at ${inc.location}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:z-20 focus:outline-none focus-visible:z-30"
              style={{ left: `${inc.x}%`, top: `${inc.y}%` }}
            >
              <div
                className="relative flex items-center justify-center text-cream animate-marker-drop"
                style={{
                  width: size,
                  height: size,
                  background: color,
                  borderRadius: '2px',
                  boxShadow: `0 0 0 ${isSel ? '5px' : '3px'} ${severityGlow[inc.severity]}`,
                }}
              >
                <Icon size={size * 0.45} />
                {inc.severity === 'critical' && (
                  <div className="absolute inset-0 border border-status-critical/40 animate-pulse-soft" style={{ borderRadius: '2px' }} />
                )}
              </div>
            </button>
          );
        })}

        {/* Resource markers */}
        {resources.map((r) => {
          const mc = markerConfig[r.type];
          const Icon = mc.icon;
          const isSel = selectedId === r.id;
          return (
            <button
              key={r.id}
              onPointerDown={() => onMarkerClick?.(r.id)}
              aria-label={`${resourceLabel(r)} ${r.name}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:z-20 hover:scale-110 focus:outline-none focus-visible:z-30"
              style={{ left: `${r.x}%`, top: `${r.y}%` }}
            >
              <div
                className="flex items-center justify-center border-2 border-cream/40 text-cream shadow-sm"
                style={{
                  width: 26,
                  height: 26,
                  background: mc.color,
                  borderRadius: '2px',
                  boxShadow: isSel ? `0 0 0 4px ${mc.color}25` : `0 1px 4px rgba(0,0,0,0.15)`,
                }}
              >
                <Icon size={13} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Floating controls (outside the zoom layer so they stay put) */}
      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        {controls.map((ctrl) => {
          const CtrlIcon = ctrl.icon;
          return (
            <button
              key={ctrl.label}
              onClick={ctrl.onClick}
              aria-label={ctrl.label}
              title={ctrl.label}
              className={`flex h-8 w-8 items-center justify-center border transition-colors ${dark ? 'bg-surface-darkCard/90 border-white/10 text-ink-light hover:bg-surface-darkCard' : 'bg-surface-card/90 border-earth-stone/30 text-ink-primary hover:bg-surface-card'} ${ctrl.active ? 'text-earth-terracotta' : ''}`}
              style={{ borderRadius: '2px' }}
            >
              <CtrlIcon size={16} />
            </button>
          );
        })}
      </div>

      {/* Zoom readout */}
      <div className={`absolute right-12 top-3 border px-2 py-1 text-[10px] font-500 uppercase tracking-wider ${dark ? 'bg-surface-darkCard/90 border-white/10 text-ink-lightMuted' : 'bg-surface-card/90 border-earth-stone/30 text-ink-muted'}`} style={{ borderRadius: '2px' }}>
        {zoom.toFixed(2)}×
      </div>

      {/* Legend */}
      <div className={`absolute bottom-3 left-3 flex flex-wrap gap-3 border px-3 py-2 text-[10px] font-500 uppercase tracking-wider ${dark ? 'bg-surface-darkCard/90 border-white/10 text-ink-lightMuted' : 'bg-surface-card/90 border-earth-stone/30 text-ink-muted'}`} style={{ borderRadius: '2px' }}>
        {(['hospital', 'blood_bank', 'ambulance', 'shelter', 'rescue'] as ResourceType[]).map((t) => {
          const mc = markerConfig[t];
          const Icon = mc.icon;
          return (
            <span key={t} className="flex items-center gap-1">
              <Icon size={10} style={{ color: mc.ink }} />
              {t.replace('_', ' ')}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function resourceLabel(r: Resource): string {
  return r.type.replace('_', ' ');
}
