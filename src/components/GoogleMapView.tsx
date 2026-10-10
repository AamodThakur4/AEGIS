import { useEffect, useRef, useState } from 'react';
import type { Incident, Resource } from '@/types';
import { resourceTypeLabel } from '@/data';
import {
  MAP_STYLES,
  escapeHTML,
  hasMapsKey,
  loadGoogleMaps,
  resourceColor,
  severityColor,
  zoomToFit,
} from '@/lib/maps';
import { formatCoords, useLocation } from '@/context/location';
import { AlertTriangle, Crosshair, Minus, Plus } from 'lucide-react';

const DEFAULT_CENTER = { lat: 27.7172, lng: 85.324 };

interface GoogleMapViewProps {
  resources: Resource[];
  incidents: Incident[];
  onMarkerClick?: (id: string) => void;
  selectedId?: string;
}

type Mode = 'loading' | 'ready' | 'fallback';

type Placed = { marker: google.maps.Marker; html: string };

function resourceInfo(r: Resource): string {
  const meta = [
    r.distanceKm != null ? `${r.distanceKm} km` : null,
    r.etaMin != null ? `${r.etaMin} min` : null,
    r.phone,
  ].filter(Boolean).join(' · ');
  return `<div class="aegis-info">
    <div class="aegis-info-kicker" style="color:${resourceColor[r.type]}">${escapeHTML(
      resourceTypeLabel[r.type],
    )} · ${escapeHTML(r.status.replace('_', ' '))}</div>
    <div class="aegis-info-title">${escapeHTML(r.name)}</div>
    <div class="aegis-info-meta">${escapeHTML(meta)}</div>
  </div>`;
}

function incidentInfo(i: Incident): string {
  const meta = [i.location, i.reportedAt].filter(Boolean).join(' · ');
  return `<div class="aegis-info">
    <div class="aegis-info-kicker" style="color:${severityColor[i.severity]}">${escapeHTML(
      i.severity,
    )} · ${escapeHTML(i.type)}</div>
    <div class="aegis-info-title">${escapeHTML(i.title)}</div>
    <div class="aegis-info-meta">${escapeHTML(meta)}</div>
    <div class="aegis-info-note">${escapeHTML(
      `${i.peopleAffected.toLocaleString()} affected`,
    )}</div>
  </div>`;
}

export function GoogleMapView({ resources, incidents, onMarkerClick, selectedId }: GoogleMapViewProps) {
  const { coords, status, message, start } = useLocation();

  const holderRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const layerRef = useRef<google.maps.Marker[]>([]);
  const placedRef = useRef<Map<string, Placed>>(new Map());
  const meRef = useRef<{ marker: google.maps.Marker; circle: google.maps.Circle } | null>(null);
  const fittedRef = useRef(false);

  const [mode, setMode] = useState<Mode>(hasMapsKey() ? 'loading' : 'fallback');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasMapsKey()) return;
    let dead = false;
    loadGoogleMaps()
      .then(() => {
        if (!dead) setMode('ready');
      })
      .catch((err: unknown) => {
        if (dead) return;
        setLoadError(err instanceof Error ? err.message : 'Google Maps failed to load');
        setMode('fallback');
      });
    return () => {
      dead = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== 'ready' || mapRef.current) return;
    const holder = holderRef.current;
    if (!holder) return;

    let timer: number | undefined;
    let attempts = 0;

    const nudge = () => {
      if (!mapRef.current) return;
      window.dispatchEvent(new Event('resize'));
      if (holder.querySelector('.gm-style')) return;      if (attempts++ < 20) timer = window.setTimeout(nudge, 250);
    };

    const build = () => {
      if (mapRef.current) return;
      const { width, height } = holder.getBoundingClientRect();
      if (width < 2 || height < 2) return;
      mapRef.current = new google.maps.Map(holder, {
        center: DEFAULT_CENTER,
        zoom: 12,
        styles: MAP_STYLES,
        gestureHandling: 'greedy',
        clickableIcons: false,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        rotateControl: false,
        keyboardShortcuts: false,
      });
      infoRef.current = new google.maps.InfoWindow();
      window.clearTimeout(timer);
      timer = window.setTimeout(nudge, 0);
    };

    build();

    const wake = () => {
      if (document.visibilityState !== 'visible') return;
      if (!mapRef.current) {
        build();
        return;
      }
      attempts = 0;
      nudge();
    };
    document.addEventListener('visibilitychange', wake);

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        window.clearTimeout(timer);
        document.removeEventListener('visibilitychange', wake);
      };
    }
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      if (mapRef.current) nudge();
      else build();
    });
    ro.observe(holder);

    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
      document.removeEventListener('visibilitychange', wake);
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== 'ready') return;
    const map = mapRef.current;
    if (!map) return;

    layerRef.current.forEach((m) => m.setMap(null));
    layerRef.current = [];
    placedRef.current.clear();
    infoRef.current?.close();

    const bounds = new google.maps.LatLngBounds();
    let plotted = 0;

    const place = (id: string, position: google.maps.LatLngLiteral, title: string, color: string, html: string) => {
      const marker = new google.maps.Marker({
        map,
        position,
        title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#F5F0E8',
          strokeWeight: 2,
        },
        zIndex: 10,
      });
      marker.addListener('click', () => {
        infoRef.current?.setContent(html);
        infoRef.current?.open({ map, anchor: marker });
        onMarkerClick?.(id);
      });
      layerRef.current.push(marker);
      placedRef.current.set(id, { marker, html });
      bounds.extend(position);
      plotted += 1;
    };

    resources.forEach((r) => {
      if (typeof r.lat !== 'number' || typeof r.lng !== 'number') return;
      place(
        r.id,
        { lat: r.lat, lng: r.lng },
        r.name,
        resourceColor[r.type],
        resourceInfo(r),
      );
    });

    incidents.forEach((i) => {
      if (typeof i.lat !== 'number' || typeof i.lng !== 'number') return;
      place(
        i.id,
        { lat: i.lat, lng: i.lng },
        i.title,
        severityColor[i.severity],
        incidentInfo(i),
      );
    });

    if (plotted > 0 && !fittedRef.current) {
      fittedRef.current = true;
      google.maps.event.addListenerOnce(map, 'idle', () => {
        const div = map.getDiv();
        const z = zoomToFit(bounds.toJSON(), div.clientWidth, div.clientHeight, 32, 14);
        map.setCenter(bounds.getCenter());
        map.setZoom(z);
      });
    }
  }, [mode, resources, incidents, onMarkerClick]);

  useEffect(() => {
    if (mode !== 'ready') return;
    const map = mapRef.current;
    if (!map) return;

    if (!coords) {
      if (meRef.current) {
        meRef.current.marker.setMap(null);
        meRef.current.circle.setMap(null);
        meRef.current = null;
      }
      return;
    }

    const position: google.maps.LatLngLiteral = { lat: coords.lat, lng: coords.lng };
    const radius = Math.max(coords.accuracy ?? 35, 12);

    if (!meRef.current) {
      const circle = new google.maps.Circle({
        map,
        center: position,
        radius,
        strokeColor: '#7BA3C4',
        strokeOpacity: 0.75,
        strokeWeight: 1,
        fillColor: '#7BA3C4',
        fillOpacity: 0.16,
        zIndex: 5,
      });
      const marker = new google.maps.Marker({
        map,
        position,
        zIndex: 999,
        title: 'You are here',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: '#F5F0E8',
          fillOpacity: 1,
          strokeColor: '#7BA3C4',
          strokeWeight: 3,
        },
      });
      meRef.current = { marker, circle };
    } else {
      meRef.current.marker.setPosition(position);
      meRef.current.circle.setCenter(position);
      meRef.current.circle.setRadius(radius);
    }
  }, [mode, coords]);

  useEffect(() => {
    if (mode !== 'ready') return;
    const map = mapRef.current;
    const info = infoRef.current;
    if (!map || !info) return;

    if (!selectedId) {
      info.close();
      return;
    }
    const placed = placedRef.current.get(selectedId);
    if (!placed) return;
    info.setContent(placed.html);
    info.open({ map, anchor: placed.marker });
    const pos = placed.marker.getPosition();
    if (pos) map.panTo(pos);
  }, [mode, selectedId]);

  const zoomBy = (delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    const z = map.getZoom() ?? 12;
    map.setZoom(Math.min(18, Math.max(3, z + delta)));
  };

  const locate = () => {
    start();
    const map = mapRef.current;
    if (!map || !coords) return;
    map.panTo({ lat: coords.lat, lng: coords.lng });
    map.setZoom(16);
  };

  const unplaced =
    incidents.filter((i) => typeof i.lat !== 'number').length +
    resources.filter((r) => typeof r.lat !== 'number').length;

  if (mode === 'fallback') {
    const lat = coords?.lat ?? DEFAULT_CENTER.lat;
    const lng = coords?.lng ?? DEFAULT_CENTER.lng;
    const embed = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}&z=${
      coords ? 15 : 11
    }&hl=en&output=embed`;
    return (
      <div className="absolute inset-0 overflow-hidden">
        <iframe
          title="Google Map showing incident and resource area"
          src={embed}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <div className="pointer-events-none absolute left-3 top-3 max-w-[16rem] border border-earth-stone/40 bg-surface-dark/90 px-3 py-2 text-[11px] leading-snug text-ink-muted backdrop-blur-sm">
          <span className="text-earth-ochre">Embed mode</span> —{' '}
          {loadError ?? 'Google Maps API unavailable, showing the keyless embed.'}
        </div>
      </div>
    );
  }

  const statusTone =
    status === 'ready' ? '#9DB389' : status === 'locating' ? '#C99A3B' : '#F27A66';
  const statusLabel =
    status === 'ready'
      ? `Live${coords?.accuracy != null ? ` · ± ${coords.accuracy} m` : ''}`
      : status === 'locating'
        ? 'Locating…'
        : status === 'idle'
          ? 'Location off'
          : status === 'denied'
            ? 'Permission blocked'
            : 'No fix';

  return (
    <div className="absolute inset-0 overflow-hidden bg-surface-dark">
      {}
      <div ref={holderRef} className="absolute inset-0" />

      {}
      {mode === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-dark">
          <p className="text-xs font-500 uppercase tracking-[0.15em] text-ink-muted">
            Loading Google Maps…
          </p>
        </div>
      )}

      {}
      <div className="pointer-events-none absolute left-3 top-3 flex max-w-[62%] flex-col gap-1.5">
        <div className="flex flex-wrap gap-1.5">
          <span
            className="flex items-center gap-1.5 border bg-surface-dark/90 px-2.5 py-1.5 text-[11px] font-500 uppercase tracking-wider backdrop-blur-sm"
            style={{ borderRadius: '2px', borderColor: 'rgba(245,240,232,0.16)', color: statusTone }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusTone }} />
            {statusLabel}
          </span>
          {unplaced > 0 && (
            <span
              className="flex items-center gap-1.5 border bg-surface-dark/90 px-2.5 py-1.5 text-[11px] text-ink-muted backdrop-blur-sm"
              style={{ borderRadius: '2px', borderColor: 'rgba(245,240,232,0.16)' }}
            >
              <AlertTriangle size={12} className="text-earth-ochre" />
              {unplaced} without coordinates
            </span>
          )}
        </div>
        <span
          className="w-fit border border-white/10 bg-surface-dark/90 px-2.5 py-1.5 font-mono text-[11px] text-ink-primary backdrop-blur-sm"
          style={{ borderRadius: '2px' }}
        >
          {formatCoords(coords) ?? 'awaiting fix'}
        </span>
        {status !== 'ready' && status !== 'locating' && (
          <span
            className="w-fit max-w-full border border-earth-stone/40 bg-surface-dark/90 px-2.5 py-1.5 text-[11px] leading-snug text-ink-muted backdrop-blur-sm"
            style={{ borderRadius: '2px' }}
          >
            {message ?? 'Allow location access to place yourself on the map.'}
          </span>
        )}
      </div>

      {}
      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => zoomBy(1)}
          aria-label="Zoom in"
          className="flex h-8 w-8 items-center justify-center border border-white/15 bg-surface-darkCard/90 text-ink-light backdrop-blur-sm transition-colors hover:bg-surface-darkSecondary"
          style={{ borderRadius: '2px' }}
        >
          <Plus size={15} />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(-1)}
          aria-label="Zoom out"
          className="flex h-8 w-8 items-center justify-center border border-white/15 bg-surface-darkCard/90 text-ink-light backdrop-blur-sm transition-colors hover:bg-surface-darkSecondary"
          style={{ borderRadius: '2px' }}
        >
          <Minus size={15} />
        </button>
        <button
          type="button"
          onClick={locate}
          aria-label="Zoom to my live location"
          className="flex h-8 w-8 items-center justify-center border border-cream/40 bg-surface-darkCard/90 text-cream backdrop-blur-sm transition-colors hover:bg-surface-darkSecondary"
          style={{ borderRadius: '2px' }}
        >
          <Crosshair size={15} />
        </button>
      </div>
    </div>
  );
}
