import type { Alert, DisasterType } from '@/types';
import { accent } from '@/lib/palette';
import { Waves, Flame, Mountain, CarFront, HeartPulse, CloudRain, X, MapPin } from 'lucide-react';

const disasterIcon: Record<DisasterType, typeof Waves> = {
  flood: Waves,
  fire: Flame,
  earthquake: Mountain,
  landslide: Mountain,
  accident: CarFront,
  medical: HeartPulse,
};

const severityAccent: Record<string, string> = {
  critical: accent.critical,
  high: accent.clay,
  moderate: accent.ochre,
  low: accent.moss,
};

export function AlertBanner({ alert, onDismiss }: { alert: Alert; onDismiss?: () => void }) {
  const Icon = disasterIcon[alert.type] || CloudRain;
  const accent = severityAccent[alert.severity] || severityAccent.moderate;

  return (
    <div className="flex items-start gap-4 border-l-2 bg-surface-card p-5 animate-fade-in-up" style={{ borderColor: accent }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center border" style={{ borderColor: `${accent}30`, background: `${accent}10`, borderRadius: '2px' }}>
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-serif font-600 text-ink-primary">{alert.title}</h3>
        </div>
        <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">{alert.message}</p>
        <div className="mt-2.5 flex items-center gap-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <MapPin size={12} /> {alert.area}
          </span>
          <span className="text-ink-muted/90">{alert.time}</span>
        </div>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 text-ink-muted/90 hover:text-ink-primary transition-colors">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
