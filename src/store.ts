import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type {
  DisasterType,
  Incident,
  IncidentDraft,
  Resource,
  ResourceDraft,
  ResourceStatus,
  ResourceType,
  Severity,
} from '@/types';
import { incidents as seedIncidents, lookupPlace, resources as seedResources } from '@/data';
import { sendEmergencyNotice } from '@/lib/notify';


const K_RESOURCES = 'aegis.resources.v1';
const K_INCIDENTS = 'aegis.incidents.v1';
const K_KNOWN_INCIDENTS = 'aegis.knownIncidents.v1';
export const K_RESOURCE_FILTER = 'aegis.resourceFilter.v1';

function read<T>(key: string, seed: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return seed;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T) : seed;
  } catch {
    return seed;
  }
}

type Guard<T> = (value: unknown) => value is T;

const RESOURCE_TYPES = new Set<ResourceType>([
  'hospital', 'blood_bank', 'ambulance', 'shelter', 'rescue', 'incident',
]);
const RESOURCE_STATUSES = new Set<ResourceStatus>([
  'available', 'critical', 'responding', 'in_transit', 'offline',
]);
const DISASTER_TYPES = new Set<DisasterType>([
  'flood', 'fire', 'earthquake', 'landslide', 'accident', 'medical',
]);
const SEVERITIES = new Set<Severity>(['critical', 'high', 'moderate', 'low']);
const INCIDENT_STATUSES = new Set<Incident['status']>(['active', 'responding', 'resolved']);

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

function isResource(v: unknown): v is Resource {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    v.name.trim().length > 0 &&
    RESOURCE_TYPES.has(v.type as ResourceType) &&
    RESOURCE_STATUSES.has(v.status as ResourceStatus) &&
    typeof v.x === 'number' &&
    typeof v.y === 'number' &&
    (v.distanceKm === undefined || typeof v.distanceKm === 'number') &&
    (v.etaMin === undefined || typeof v.etaMin === 'number')
  );
}

const fixResource = (r: Resource): Resource => ({
  ...r,
  details: Array.isArray(r.details)
    ? r.details.filter((d): d is string => typeof d === 'string')
    : [],
});

function isIncident(v: unknown): v is Incident {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    v.title.trim().length > 0 &&
    typeof v.description === 'string' &&
    typeof v.location === 'string' &&
    typeof v.peopleAffected === 'number' &&
    typeof v.reportedAt === 'string' &&
    DISASTER_TYPES.has(v.type as DisasterType) &&
    SEVERITIES.has(v.severity as Severity) &&
    INCIDENT_STATUSES.has(v.status as Incident['status']) &&
    typeof v.x === 'number' &&
    typeof v.y === 'number'
  );
}

function readList<T>(key: string, seed: T[], guard: Guard<T>, fix?: (v: T) => T): T[] {
  let parsed: unknown;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return seed;
    parsed = JSON.parse(raw);
  } catch {
    return seed;
  }
  if (!Array.isArray(parsed)) return seed;
  const valid = parsed.filter(guard);
  return fix ? valid.map(fix) : valid;
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function usePersisted<T>(
  key: string,
  seed: T[],
  guard: Guard<T>,
  fix?: (v: T) => T,
): [T[], Dispatch<SetStateAction<T[]>>] {
  const [value, setValue] = useState<T[]>(() => readList(key, seed, guard, fix));
  const seedRef = useRef(seed);

  useEffect(() => {
    write(key, value);
  }, [key, value]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setValue(readList(key, seedRef.current, guard, fix));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, guard, fix]);

  return [value, setValue];
}

const scatter = () => ({
  x: 18 + Math.round(Math.random() * 64),
  y: 18 + Math.round(Math.random() * 64),
});

export interface ResourceActions {
  addResource: (draft: ResourceDraft) => void;
  duplicateResource: (id: string) => void;
  removeResource: (id: string) => void;
  updateResource: (id: string, patch: Partial<Resource>) => void;
}

export function useResources(): [Resource[], ResourceActions] {
  const [resourceList, setResourceList] = usePersisted<Resource>(
    K_RESOURCES,
    seedResources,
    isResource,
    fixResource,
  );

  const addResource = (draft: ResourceDraft) => {
    const { location, lat, lng, details, distanceKm, etaMin, ...rest } = draft;
    const resolved =
      Number.isFinite(lat) && Number.isFinite(lng)
        ? { lat: lat as number, lng: lng as number }
        : (lookupPlace(location) ?? {});

    setResourceList((prev) => [
      {
        ...rest,
        ...resolved,
        id: `res-${Date.now()}`,
        ...scatter(),
        details: details
          ? details.split('\n').map((d) => d.trim()).filter(Boolean)
          : [],
        ...(Number.isFinite(distanceKm) ? { distanceKm: distanceKm as number } : {}),
        ...(Number.isFinite(etaMin) ? { etaMin: etaMin as number } : {}),
        ...(rest.capacity?.trim() ? { capacity: rest.capacity.trim() } : {}),
        ...(rest.phone?.trim() ? { phone: rest.phone.trim() } : {}),
      },
      ...prev,
    ]);
  };

  const duplicateResource = (id: string) => {
    setResourceList((prev) => {
      const source = prev.find((r) => r.id === id);
      if (!source) return prev;
      // "Ambulance Unit-07" becomes "Ambulance Unit-07 (2)", then "(3)"
      const base = source.name.replace(/ \(\d+\)$/, '');
      const n = prev.filter((r) => r.name === base || r.name.startsWith(`${base} (`)).length + 1;
      return [{ ...source, id: `res-${Date.now()}`, name: `${base} (${n})`, ...scatter() }, ...prev];
    });
  };

  const removeResource = (id: string) =>
    setResourceList((prev) => prev.filter((r) => r.id !== id));

  const updateResource = (id: string, patch: Partial<Resource>) =>
    setResourceList((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return [resourceList, { addResource, duplicateResource, removeResource, updateResource }];
}

export interface IncidentActions {
  advanceIncident: (id: string) => void;
  reportIncident: (draft: IncidentDraft) => void;
}

// emailNewCritical should only be true on the page that creates incidents,
// otherwise two pages could both pick up the same new report
export function useIncidents(emailNewCritical = false): [Incident[], IncidentActions] {
  const [incidents, setIncidents] = usePersisted<Incident>(K_INCIDENTS, seedIncidents, isIncident);
  const known = useRef<Set<string> | null>(null);

  const advanceIncident = (id: string) =>
    setIncidents((prev) =>
      prev.map<Incident>((i) => {
        if (i.id !== id) return i;
        if (i.status === 'active') return { ...i, status: 'responding' };
        if (i.status === 'responding') return { ...i, status: 'resolved' };
        return i;
      }),
    );

  const reportIncident = (draft: IncidentDraft) =>
    setIncidents((prev) => [
      {
        ...draft,
        id: `inc-${Date.now()}`,
        status: 'active',
        reportedAt: 'Just now',
        x: 18 + Math.round(Math.random() * 64),
        y: 18 + Math.round(Math.random() * 64),
        // only set when the place name resolves
        ...(lookupPlace(draft.location) ?? {}),
      },
      ...prev,
    ]);

  // email about new critical incidents. the seeded ids get recorded on the
  // first run so the demo data never fires anything
  useEffect(() => {
    if (!emailNewCritical) return;

    if (known.current === null) {
      const stored = read<string[] | null>(K_KNOWN_INCIDENTS, null);
      known.current = new Set(Array.isArray(stored) ? stored : incidents.map((i) => i.id));
      if (!Array.isArray(stored)) write(K_KNOWN_INCIDENTS, [...known.current]);
      return;
    }

    const fresh = incidents.filter((i) => !known.current!.has(i.id));
    if (fresh.length === 0) return;

    // saved before sending, so a second tab doesn't mail them again
    const next = [...known.current, ...fresh.map((i) => i.id)];
    known.current = new Set(next);
    write(K_KNOWN_INCIDENTS, next);

    fresh
      .filter((i) => i.severity === 'critical' && i.status !== 'resolved')
      .forEach((i) => {
        const at =
          typeof i.lat === 'number' && typeof i.lng === 'number'
            ? `${i.lat.toFixed(5)}, ${i.lng.toFixed(5)}`
            : null;
        void sendEmergencyNotice({
          trigger: 'incident',
          severity: i.severity,
          title: i.title,
          location: i.location,
          coordinates: at,
          lat: i.lat ?? null,
          lng: i.lng ?? null,
          peopleAffected: i.peopleAffected,
          details: i.description,
          reportedBy: 'AEGIS incident monitor',
        });
      });
  }, [incidents, emailNewCritical]);

  return [incidents, { advanceIncident, reportIncident }];
}
