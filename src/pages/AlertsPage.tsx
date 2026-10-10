import type { Alert, Resource, Incident } from '@/types';
import { AlertBanner } from '@/components/AlertBanner';
import { Bell, BellOff, Waves, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { accent } from '@/lib/palette';
import { useState } from 'react';

interface AlertsPageProps {
  alerts: Alert[];
  resources: Resource[];
  incidents: Incident[];
}

export function AlertsPage({ alerts, resources, incidents }: AlertsPageProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  const visible = alerts.filter((a) => !dismissed.includes(a.id));
  const dismissedAlerts = alerts.filter((a) => dismissed.includes(a.id));
  const display = showAll ? [...visible, ...dismissedAlerts] : visible;

  const areasAffected = new Set(
    visible.flatMap((a) => a.area.split(',').map((s) => s.trim()).filter(Boolean)),
  ).size;

  const stats = [
    { label: 'Active Alerts', value: visible.length, icon: Bell, color: accent.critical },
    { label: 'Areas Affected', value: areasAffected, icon: Waves, color: accent.slate },
    { label: 'Open Shelters', value: resources.filter((r) => r.type === 'shelter' && r.status !== 'offline').length, icon: ShieldCheck, color: accent.sand },
    { label: 'Resolved', value: incidents.filter((i) => i.status === 'resolved').length, icon: CheckCircle2, color: accent.moss },
  ];

  const dismiss = (id: string) =>
    setDismissed((p) => (p.includes(id) ? p : [...p, id]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-600 text-ink-primary">Alerts</h1>

      {}
      <div className="grid grid-cols-2 gap-px border border-earth-stone/30 bg-earth-stone/30 sm:grid-cols-4" style={{ borderRadius: '2px', overflow: 'hidden' }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-surface-card p-4">
              <Icon size={18} style={{ color: s.color }} />
              <p className="mt-2 text-2xl font-serif font-600 text-ink-primary">{s.value}</p>
              <p className="text-xs text-ink-muted">{s.label}</p>
            </div>
          );
        })}
      </div>

      {}
      <div>
        <h2 className="text-xs font-500 uppercase tracking-[0.15em] text-ink-muted mb-3">
          Active Disaster Alerts
        </h2>
        {visible.length === 0 && (
          <div className="border border-earth-stone/30 bg-surface-card p-12 text-center" style={{ borderRadius: '2px' }}>
            <BellOff size={28} className="mx-auto text-earth-sage mb-2" />
            <p className="text-sm font-500 text-ink-primary">All Clear</p>
            <p className="text-xs text-ink-muted mt-1">No active alerts in your area.</p>
          </div>
        )}
        <div className="space-y-3">
          {display.map((alert) => (
            <AlertBanner
              key={alert.id}
              alert={alert}
              onDismiss={() => dismiss(alert.id)}
            />
          ))}
        </div>
      </div>

      {}
      {dismissedAlerts.length > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs font-500 text-ink-muted link-underline"
        >
          {showAll ? 'Hide dismissed alerts' : `Show ${dismissedAlerts.length} dismissed alert${dismissedAlerts.length > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
}
