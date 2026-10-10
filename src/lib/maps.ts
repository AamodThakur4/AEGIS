import type { Severity, ResourceType } from '@/types';

export const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

export function hasMapsKey(): boolean {
  return MAPS_KEY.trim().length > 0;
}

type MapsGlobal = { google?: { maps?: { Map?: unknown } } };

let pending: Promise<void> | null = null;

function waitForGlobal(timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      const g = (window as MapsGlobal).google;
      if (g?.maps?.Map) {
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('Timed out waiting for Google Maps to initialise'));
        return;
      }
      window.setTimeout(tick, 60);
    };
    tick();
  });
}

export function loadGoogleMaps(): Promise<void> {
  if (!hasMapsKey()) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set'));
  }
  const w = window as MapsGlobal;
  if (w.google?.maps?.Map) return Promise.resolve();
  if (pending) return pending;

  const run = (async () => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      MAPS_KEY,
    )}&v=weekly`;
    script.async = true;
    script.referrerPolicy = 'no-referrer-when-downgrade';

    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(
        () => reject(new Error('Google Maps script timed out')),
        20000,
      );
      script.onload = () => {
        window.clearTimeout(timer);
        resolve();
      };
      script.onerror = () => {
        window.clearTimeout(timer);
        reject(
          new Error(
            "Google Maps failed to load — check the key's HTTP referrer restrictions and that billing is enabled",
          ),
        );
      };
      document.head.appendChild(script);
    });

    await waitForGlobal(12000);
  })();

  pending = run;
  run.catch(() => {
    if (pending === run) pending = null;
  });
  return run;
}

// dark earth so the map reads as part of the app. Google allows recolouring;
// it forbids obscuring content, which this doesn't do
export const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#24211C' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#24211C' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#A89F92' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#57503F' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#F5F0E8' }],
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#C9A87C' }],
  },
  // declutter — the poi glyphs bury the incident markers. parks stay on
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#2B3128' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9DB389' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3A342D' }] },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#2B2721' }],
  },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#A89F92' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4A423A' }] },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#3A342D' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#C9A87C' }],
  },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#3A342D' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#2C3E48' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#7FA3B0' }] },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry',
    stylers: [{ color: '#2B2721' }],
  },
];

/** Same hues as `accent` / MapView's severity fills, so both maps agree. */
export const severityColor: Record<Severity, string> = {
  critical: '#F27A66',
  high: '#E09267',
  moderate: '#C99A3B',
  low: '#9DB389',
};

export const resourceColor: Record<ResourceType, string> = {
  hospital: '#7BA3C4',
  blood_bank: '#F27A66',
  ambulance: '#E09267',
  shelter: '#9DB389',
  rescue: '#C9A87C',
  incident: '#C99A3B',
};

/* --- Fitting the viewport ------------------------------------------------- */

const WORLD = 256; // Web Mercator world size in pixels at zoom 0

const lngToUnit = (lng: number) => ((lng + 180) / 360) * WORLD;

const latToUnit = (lat: number) => {
  const clamped = Math.max(-85, Math.min(85, lat));
  const s = Math.sin((clamped * Math.PI) / 180);
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * WORLD;
};

// zoom that fits `bounds` in a width×height box with `pad` spare, floored so
// the outermost markers are always inside. fitBounds() is async and reads a
// container whose height may not have settled yet, hence doing it ourselves
export function zoomToFit(
  bounds: google.maps.LatLngBoundsLiteral,
  width: number,
  height: number,
  pad = 48,
  maxZoom = 14,
): number {
  const availW = Math.max(width - pad * 2, 1);
  const availH = Math.max(height - pad * 2, 1);
  const dx = Math.abs(lngToUnit(bounds.east) - lngToUnit(bounds.west));
  const dy = Math.abs(latToUnit(bounds.north) - latToUnit(bounds.south));
  const zx = dx > 0 ? Math.log2(availW / dx) : maxZoom;
  const zy = dy > 0 ? Math.log2(availH / dy) : maxZoom;
  return Math.max(3, Math.min(maxZoom, Math.floor(Math.min(zx, zy))));
}

/** Escape user-entered text before it goes into an InfoWindow's innerHTML. */
export function escapeHTML(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
