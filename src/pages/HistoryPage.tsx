import type { Incident } from '@/types';
import { SeverityBadge } from '@/components/StatusBadge';
import { MapPin, Users, Clock, CheckCircle2, AlertCircle, Activity } from 'lucide-react';
import { accent } from '@/lib/palette';

interface HistoryPageProps {
  incidents: Incident[];
}

const statusConfig = {
  active: { label: 'Active', icon: AlertCircle, color: accent.critical },
  responding: { label: 'Responding', icon: Activity, color: accent.clay },
  resolved: { label: 'Resolved', icon: CheckCircle2, color: accent.moss },
};

export function HistoryPage({ incidents }: HistoryPageProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-600 text-ink-primary">Incident History</h1>

      {}
      <div className="grid grid-cols-3 gap-px border border-earth-stone/30 bg-earth-stone/30" style={{ borderRadius: '2px', overflow: 'hidden' }}>
        <div className="bg-surface-card p-4 text-center">
          <p className="text-2xl font-serif font-600" style={{ color: statusConfig.active.color }}>
            {incidents.filter((i) => i.status === 'active').length}
          </p>
          <p className="text-xs text-ink-muted">Active</p>
        </div>
        <div className="bg-surface-card p-4 text-center">
          <p className="text-2xl font-serif font-600" style={{ color: statusConfig.responding.color }}>
            {incidents.filter((i) => i.status === 'responding').length}
          </p>
          <p className="text-xs text-ink-muted">Responding</p>
        </div>
        <div className="bg-surface-card p-4 text-center">
          <p className="text-2xl font-serif font-600" style={{ color: statusConfig.resolved.color }}>
            {incidents.filter((i) => i.status === 'resolved').length}
          </p>
          <p className="text-xs text-ink-muted">Resolved</p>
        </div>
      </div>

      {}
      <div className="space-y-3">
        {incidents.map((inc) => {
          const sc = statusConfig[inc.status];
          const StatusIcon = sc.icon;
          return (
            <div key={inc.id} className="border border-earth-stone/30 bg-surface-card p-5 animate-fade-in-up" style={{ borderRadius: '2px' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-serif font-600 text-ink-primary">{inc.title}</h3>
                    <SeverityBadge severity={inc.severity} />
                  </div>
                  <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">{inc.description}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 text-xs font-500" style={{ color: sc.color }}>
                  <StatusIcon size={13} />
                  {sc.label}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-5 text-xs text-ink-muted border-t border-earth-stone/30 pt-3">
                <span className="flex items-center gap-1.5">
                  <MapPin size={12} /> {inc.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={12} /> {inc.peopleAffected.toLocaleString()} affected
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} /> {inc.reportedAt}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
