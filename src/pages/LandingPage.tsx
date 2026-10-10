import { ArrowRight, Bell, Building2, History, Home, Map, Monitor, Radio, Waves } from 'lucide-react';
import { alerts } from '@/data';
import { COMMAND_URL, PAGE_URL } from '@/navigation';
import { useIncidents, useResources } from '@/store';

const features: { href: string; label: string; blurb: string; icon: typeof Home }[] = [
  { href: PAGE_URL.home, label: 'Home & SOS', blurb: 'Hold one button to record your location and alert the response organisation.', icon: Radio },
  { href: PAGE_URL.map, label: 'Live Map', blurb: 'Real Google Maps view of every incident, unit and shelter near you.', icon: Map },
  { href: PAGE_URL.resources, label: 'Resources', blurb: 'Hospitals, blood banks, ambulances, rescue teams and shelters.', icon: Building2 },
  { href: PAGE_URL.alerts, label: 'Alerts', blurb: 'Active warnings for the valley, with the units assigned to each.', icon: Bell },
  { href: PAGE_URL.history, label: 'History', blurb: 'Past incidents and how the response played out.', icon: History },
  { href: COMMAND_URL, label: 'Command Center', blurb: 'Operators register units, log incidents and track the response.', icon: Monitor },
];

export function LandingPage() {
  const [resources] = useResources();
  const [incidents] = useIncidents();
  const activeAlerts = alerts.filter((a) => a.active).length;

  const activeIncidents = incidents.filter((i) => i.status === 'active').length;
  const floodActive = incidents.some((i) => i.status !== 'resolved' && i.type === 'flood');

  return (
    <div className="space-y-10">
      <section className="animate-fade-in-up">
        <div className="flex items-center gap-2 text-xs font-500 uppercase tracking-[0.2em] text-earth-terracotta">
          <Waves size={13} /> {floodActive ? 'Flood Monitoring Active' : 'Emergency Monitoring Active'}
        </div>
        <h1 className="mt-3 text-4xl font-serif font-600 leading-tight text-ink-primary text-balance">
          See. Respond. Save.
        </h1>
        <p className="mt-3 text-base text-ink-muted max-w-xl leading-relaxed">
          AI-Powered Disaster Response & Relief Network. Real-time monitoring and emergency
          coordination across Kathmandu Valley — from a citizen's phone to the operators running
          the response.
        </p>

        <div className="mt-5 flex flex-wrap gap-6 text-sm text-ink-muted">
          <span className="flex items-center gap-1.5">
            <Home size={14} className="text-earth-terracotta" />
            {activeIncidents} active incidents
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 size={14} className="text-earth-ochre" />
            {resources.length} units tracked
          </span>
          <span className="flex items-center gap-1.5">
            <Bell size={14} className="text-earth-sage" />
            {activeAlerts} open alerts
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={PAGE_URL.home}
            className="inline-flex items-center gap-2 border border-status-critical bg-status-critical px-5 py-3 text-sm font-500 uppercase tracking-wider text-cream transition-opacity hover:opacity-90"
            style={{ borderRadius: '2px' }}
          >
            <Radio size={15} /> Open SOS
          </a>
          <a
            href={PAGE_URL.map}
            className="inline-flex items-center gap-2 border border-earth-stone/40 bg-surface-card px-5 py-3 text-sm font-500 uppercase tracking-wider text-ink-primary transition-colors hover:bg-earth-stone/15"
            style={{ borderRadius: '2px' }}
          >
            <Map size={15} /> View Live Map
          </a>
        </div>
      </section>

      <div className="h-px bg-earth-stone/40" />

      <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-xl font-serif font-600 text-ink-primary mb-4">Everything in one network</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <a
                key={f.href}
                href={f.href}
                className="group flex items-start gap-3 border border-earth-stone/40 bg-surface-card p-4 transition-colors hover:bg-earth-stone/10"
                style={{ borderRadius: '2px' }}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-earth-stone/50 text-earth-terracotta">
                  <Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-600 text-ink-primary">
                    {f.label}
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-1 block text-xs text-ink-muted leading-relaxed">{f.blurb}</span>
                </span>
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}
