import { useEffect, useRef, useState } from 'react';
import type { Alert, Resource, Incident, ResourceType } from '@/types';
import { SOSButton } from '@/components/SOSButton';
import { AlertBanner } from '@/components/AlertBanner';
import { ResourceCard } from '@/components/ResourceCard';
import { AIAssistant } from '@/components/AIAssistant';
import { GoogleMapView } from '@/components/GoogleMapView';
import { Hospital, Droplet, Ambulance, Home, Waves, ArrowRight, Activity, Users, ChevronRight, Radio, MapPin } from 'lucide-react';
import { accent } from '@/lib/palette';
import { emailjsConfigured, mapsPinLink, sendEmergencyNotice, sendSosSms, type EmergencyNotice } from '@/lib/notify';
import { getCurrentCoordinates, type Coordinates } from '@/hooks/useGeolocation';
import { formatCoords, useLocation } from '@/context/location';

const LIVE_UPDATE_MS = 120_000;
const MAX_LIVE_UPDATES = 5;
const MAX_LIVE_ATTEMPTS = MAX_LIVE_UPDATES * 2;

interface SosRecord {
  coords: Coordinates | null;
  text: string | null;
  error: string | null;
  mapLink: string | null;
  raisedAt: number;
  updates: number;
}

interface FixResult {
  coords: Coordinates | null;
  error: string | null;
}

async function resolveFix(fallback: Coordinates | null): Promise<FixResult> {
  const fresh = await getCurrentCoordinates(8000);
  if (fresh.coords) return { coords: fresh.coords, error: null };
  if (fallback) return { coords: fallback, error: null };
  return { coords: null, error: fresh.error ?? 'Location unavailable.' };
}

function recorded(fix: FixResult): Pick<SosRecord, 'coords' | 'text' | 'error' | 'mapLink'> {
  return {
    coords: fix.coords,
    text: formatCoords(fix.coords),
    error: fix.error,
    mapLink: fix.coords ? mapsPinLink(fix.coords.lat, fix.coords.lng) : null,
  };
}

async function sendSosNotice(
  fix: FixResult,
  update?: { index: number; total: number },
): Promise<void> {
  const text = formatCoords(fix.coords);
  const notice: EmergencyNotice = {
    trigger: 'sos',
    severity: 'critical',
    title: update
      ? 'Citizen SOS — live location update'
      : 'Citizen SOS — emergency assistance requested',
    location: text ?? 'Coordinates unavailable (permission not granted)',
    coordinates: text,
    lat: fix.coords?.lat ?? null,
    lng: fix.coords?.lng ?? null,
    accuracy: fix.coords?.accuracy ?? null,
    fixAt: fix.coords?.at ?? null,
    update: update ?? null,
    peopleAffected: null,
    reportedBy: 'Citizen device (AEGIS app)',
    details: update
      ? 'Follow-up fix while this SOS is still open. The citizen has not cancelled — treat these coordinates as current.'
      : 'A citizen pressed and held the SOS button. Call this device back immediately and dispatch the nearest available unit.',
  };
  // email and SMS go out side by side - one failing never blocks the other
  await Promise.all([sendEmergencyNotice(notice), sendSosSms(notice)]);
}

interface HomePageProps {
  alerts: Alert[];
  resources: Resource[];
  incidents: Incident[];
  onNavigate: (page: string, type?: ResourceType) => void;
}

export function HomePage({ alerts, resources, incidents, onNavigate }: HomePageProps) {
  const [sos, setSos] = useState<SosRecord | null>(null);
  const [showAI, setShowAI] = useState(false);
  const { coords: liveCoords, start: startTracking } = useLocation();

  const liveCoordsRef = useRef(liveCoords);
  useEffect(() => {
    liveCoordsRef.current = liveCoords;
  }, [liveCoords]);

  const sosActive = sos !== null;
  const configured = emailjsConfigured();

  const quickActions: { type: Resource['type']; label: string; icon: typeof Hospital; color: string }[] = [
    { type: 'hospital', label: 'Hospital', icon: Hospital, color: accent.slate },
    { type: 'blood_bank', label: 'Blood Bank', icon: Droplet, color: accent.critical },
    { type: 'ambulance', label: 'Ambulance', icon: Ambulance, color: accent.clay },
    { type: 'shelter', label: 'Shelter', icon: Home, color: accent.moss },
  ];

  const activeIncidents = incidents.filter((i) => i.status === 'active');
  const openIncidents = incidents.filter((i) => i.status !== 'resolved');
  const affectedNow = openIncidents.reduce((s, i) => s + i.peopleAffected, 0);
  const floodActive = openIncidents.some((i) => i.type === 'flood');
  const nearest = resources
    .filter((r) => r.distanceKm != null)
    .sort((a, b) => (a.distanceKm as number) - (b.distanceKm as number))
    .slice(0, 3);

  const handleSos = () => {
    setSos({ ...recorded({ coords: null, error: null }), raisedAt: Date.now(), updates: 0 });
    startTracking();
    void resolveFix(liveCoords).then((fix) => {
      setSos((prev) => (prev ? { ...prev, ...recorded(fix) } : prev));
      void sendSosNotice(fix);
    });
  };

  const cancelSos = () => setSos(null);

  useEffect(() => {
    if (!sosActive) return;
    let cancelled = false;
    let sent = 0;
    let attempts = 0;

    const tick = async () => {
      if (cancelled || sent >= MAX_LIVE_UPDATES || attempts >= MAX_LIVE_ATTEMPTS) return;
      attempts += 1;
      const fix = await resolveFix(liveCoordsRef.current);
      if (cancelled || !fix.coords) return;
      sent += 1;
      setSos((prev) => (prev ? { ...prev, ...recorded(fix), updates: sent } : prev));
      await sendSosNotice(fix, { index: sent, total: MAX_LIVE_UPDATES });
    };

    const id = window.setInterval(() => void tick(), LIVE_UPDATE_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [sosActive]);

  return (
    <div className="space-y-8">
      {}
      <section className="animate-fade-in-up">
        <div className="flex items-center gap-2 text-xs font-500 uppercase tracking-[0.2em] text-earth-terracotta">
          <Waves size={13} /> {floodActive ? 'Flood Monitoring Active' : 'Emergency Monitoring Active'}
        </div>
        <h1 className="mt-3 text-4xl font-serif font-600 leading-tight text-ink-primary text-balance">
          See. Respond. Save.
        </h1>
        <p className="mt-2 text-base text-ink-muted max-w-md leading-relaxed">
          AI-Powered Disaster Response & Relief Network. Real-time monitoring and emergency coordination across Kathmandu Valley.
        </p>
        <div className="mt-4 flex flex-wrap gap-6 text-sm text-ink-muted">
          <span className="flex items-center gap-1.5">
            <Activity size={14} className="text-earth-terracotta" />
            {activeIncidents.length} active incidents
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={14} className="text-earth-ochre" />
            {affectedNow.toLocaleString()} people affected
          </span>
        </div>
      </section>

      <div className="h-px bg-earth-stone/40" />

      {}
      <section className="flex flex-col items-center text-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-xs font-500 uppercase tracking-[0.2em] text-ink-muted">Emergency SOS</h2>
        <p className="mt-2 text-sm text-ink-muted max-w-xs">
          Press and hold to alert emergency services with your location
        </p>
        <div className="mt-6">
          <SOSButton onActivate={handleSos} onCancel={cancelSos} />
        </div>
        {sos && (
          <div className="mt-6 w-full max-w-sm space-y-3 animate-fade-in-up">
            <div className="border border-status-safe bg-status-safe/10 p-4 text-left" style={{ borderRadius: '2px' }}>
              <p className="flex items-center gap-2 text-sm font-600 text-earth-sage">
                <Radio size={14} /> SOS raised — responders notified
              </p>
              <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
                {configured
                  ? 'Your location is emailed and texted to the response organisation now, and again every two minutes while this SOS stays open.'
                  : 'Automatic email is not configured, so the notice below offers a one-tap email draft. An SMS alert is still sent to emergency contacts.'}
              </p>

              <dl className="mt-3 space-y-1.5 text-xs">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="shrink-0 text-ink-muted">Location</dt>
                  <dd className="text-right font-500 text-ink-primary">
                    {sos.text ?? sos.error ?? 'Acquiring satellite fix…'}
                  </dd>
                </div>
                {sos.coords?.accuracy != null && (
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="shrink-0 text-ink-muted">Accuracy</dt>
                    <dd className="font-500 text-ink-primary">±{sos.coords.accuracy} m</dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="shrink-0 text-ink-muted">Recorded</dt>
                  <dd className="font-500 text-ink-primary">
                    {new Date(sos.coords ? sos.coords.at : sos.raisedAt).toLocaleTimeString()}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="shrink-0 text-ink-muted">Live updates</dt>
                  <dd className="font-500 text-ink-primary">
                    {sos.updates}/{MAX_LIVE_UPDATES} sent
                  </dd>
                </div>
              </dl>

              {sos.mapLink && (
                <a
                  href={sos.mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 border border-earth-sage/50 bg-earth-sage/10 py-2 text-xs font-500 uppercase tracking-wider text-earth-sage transition-colors hover:bg-earth-sage/20"
                  style={{ borderRadius: '2px' }}
                >
                  <MapPin size={13} /> Open my location in Google Maps
                </a>
              )}
            </div>
            <button
              onClick={cancelSos}
              className="w-full border border-earth-stone/40 bg-surface-card py-3 text-sm font-500 uppercase tracking-wider text-ink-primary transition-colors hover:bg-earth-stone/15"
              style={{ borderRadius: '2px' }}
            >
              Cancel SOS
            </button>
          </div>
        )}
      </section>

      <div className="h-px bg-earth-stone/40" />

      {}
      {alerts.filter((a) => a.active).length > 0 && (
        <section className="animate-fade-in-up">
          <h2 className="text-xl font-serif font-600 text-ink-primary mb-4">Active Alerts</h2>
          <div className="space-y-3">
            {alerts.filter((a) => a.active).slice(0, 2).map((alert) => (
              <AlertBanner key={alert.id} alert={alert} />
            ))}
          </div>
        </section>
      )}

      {}
      <section className="animate-fade-in-up">
        <h2 className="text-xl font-serif font-600 text-ink-primary mb-4">Find Resources</h2>
        <div className="grid grid-cols-2 gap-px bg-earth-stone/30 border border-earth-stone/30" style={{ borderRadius: '2px', overflow: 'hidden' }}>
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.type}
                onClick={() => onNavigate('resources', a.type)}
                className="group flex items-center gap-3 bg-surface-card p-4 transition-colors hover:bg-surface-raised"
              >
                <div className="flex h-10 w-10 items-center justify-center border" style={{ borderColor: `${a.color}25`, background: `${a.color}10`, borderRadius: '2px' }}>
                  <Icon size={18} style={{ color: a.color }} />
                </div>
                <span className="text-sm font-500 text-ink-primary">{a.label}</span>
                <ChevronRight size={14} className="ml-auto text-ink-muted/50 transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>
      </section>

      {/* AI Assistant toggle */}
      <section className="animate-fade-in-up">
        <div className="border border-earth-stone/30 bg-surface-card p-5" style={{ borderRadius: '2px' }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border bg-aegis-slate text-cream" style={{ borderRadius: '2px' }}>
                <span className="text-lg font-serif">A</span>
              </div>
              <div>
                <h3 className="text-lg font-serif font-600 text-ink-primary">AEGIS AI Assistant</h3>
                <p className="text-sm text-ink-muted">Report emergencies in natural language</p>
              </div>
            </div>
            <button
              onClick={() => setShowAI(!showAI)}
              className="shrink-0 border border-ink-primary/20 px-4 py-2 text-sm font-500 text-ink-primary transition-colors hover:bg-earth-stone/15"
              style={{ borderRadius: '2px' }}
            >
              {showAI ? 'Close' : 'Open'}
            </button>
          </div>
        </div>
        {showAI && (
          <div className="mt-3 h-[420px] animate-fade-in-up">
            <AIAssistant resources={resources} incidents={incidents} />
          </div>
        )}
      </section>

      {/* Mini map */}
      <section className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-600 text-ink-primary">Live Map</h2>
          <button onClick={() => onNavigate('map')} className="flex items-center gap-1 text-sm font-500 text-ink-muted link-underline">
            View full map <ArrowRight size={14} />
          </button>
        </div>
        {/* Real Google Map — same component as the Map page. The wrapper must
            be `relative`: GoogleMapView positions itself absolute inset-0, so
            without a positioned ancestor it would escape to the page and the
            overlays (status badge, zoom controls) would drift. */}
        <div className="relative h-[280px]">
          <GoogleMapView resources={resources} incidents={openIncidents} />
        </div>
      </section>

      {/* Nearest resources */}
      <section className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-600 text-ink-primary">Nearest Resources</h2>
          <button onClick={() => onNavigate('resources')} className="flex items-center gap-1 text-sm font-500 text-ink-muted link-underline">
            See all <ArrowRight size={14} />
          </button>
        </div>
        <div className="space-y-2">
          {nearest.map((r) => (
            <ResourceCard key={r.id} resource={r} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
