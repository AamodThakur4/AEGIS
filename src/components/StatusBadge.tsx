import type { ResourceStatus, Severity } from '@/types';
import { accent } from '@/lib/palette';

const statusConfig: Record<ResourceStatus, { label: string; dot: string; text: string }> = {
  available: { label: 'Available', dot: accent.moss, text: accent.moss },
  critical: { label: 'Critical', dot: accent.critical, text: accent.critical },
  responding: { label: 'Responding', dot: accent.clay, text: accent.clay },
  in_transit: { label: 'In Transit', dot: accent.slate, text: accent.slate },
  offline: { label: 'Offline', dot: accent.stone, text: accent.stone },
};

const severityConfig: Record<Severity, { label: string; dot: string; text: string }> = {
  critical: { label: 'Critical', dot: accent.critical, text: accent.critical },
  high: { label: 'High', dot: accent.clay, text: accent.clay },
  moderate: { label: 'Moderate', dot: accent.ochre, text: accent.ochre },
  low: { label: 'Low', dot: accent.moss, text: accent.moss },
};

export function StatusBadge({ status }: { status: ResourceStatus }) {
  const c = statusConfig[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-500 uppercase tracking-wider" style={{ color: c.text }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const c = severityConfig[severity];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-500 uppercase tracking-wider" style={{ color: c.text }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}
