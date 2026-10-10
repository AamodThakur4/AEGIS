import { Crosshair, ExternalLink, MapPin } from 'lucide-react';
import { formatCoords, useLocation } from '@/context/location';

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  idle: { label: 'Location off', tone: '#A89F92' },
  locating: { label: 'Locating…', tone: '#C99A3B' },
  ready: { label: 'Live', tone: '#9DB389' },
  denied: { label: 'Permission denied', tone: '#F27A66' },
  unsupported: { label: 'Unavailable', tone: '#F27A66' },
  unavailable: { label: 'No fix', tone: '#F27A66' },
};

export function LocationMap() {
  const { status, coords, message, start } = useLocation();

  const tone = STATUS_COPY[status] ?? STATUS_COPY.idle;
  const hasFix = status === 'ready' && coords !== null;
  const openSrc = hasFix
    ? `https://www.google.com/maps?q=${coords!.lat},${coords!.lng}`
    : 'https://www.google.com/maps';

  return (
    <div
      className="border border-earth-stone/30 bg-surface-card"
      style={{ borderRadius: '2px' }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-earth-stone/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-earth-terracotta" />
          <span className="text-xs font-500 uppercase tracking-[0.15em] text-ink-muted">
            {hasFix ? 'My live location' : 'Location tracking'}
          </span>
        </div>
        <span
          className="flex items-center gap-1.5 text-[11px] font-500 uppercase tracking-wider"
          style={{ color: tone.tone }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.tone }} />
          {tone.label}
        </span>
      </div>

      <div className="space-y-2 px-4 py-3">
        <p className="font-mono text-xs text-ink-primary">
          {formatCoords(coords) ?? 'Awaiting coordinates…'}
          {hasFix && coords?.accuracy != null ? `  ± ${coords.accuracy} m` : ''}
        </p>
        <p className="text-[11px] leading-relaxed text-ink-muted">
          {message ??
            (hasFix
              ? `Updated ${new Date(coords!.at).toLocaleTimeString()} · tracked continuously`
              : 'Allow location access to place yourself on the map.')}
        </p>

        <div className="flex gap-2 pt-1">
          <button
            onClick={start}
            className="flex flex-1 items-center justify-center gap-1.5 border border-earth-stone/40 bg-surface-raised py-2 text-xs font-500 text-ink-primary transition-colors hover:bg-earth-stone/15"
            style={{ borderRadius: '2px' }}
          >
            <Crosshair size={13} /> {status === 'ready' ? 'Refresh' : 'Locate me'}
          </button>
          <a
            href={openSrc}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 border border-cream bg-cream py-2 text-xs font-500 text-ink-inverse transition-colors hover:bg-earth-stone"
            style={{ borderRadius: '2px' }}
          >
            <ExternalLink size={13} /> Open in Maps
          </a>
        </div>
      </div>
    </div>
  );
}
