import type { Resource, ResourceType } from '@/types';
import { StatusBadge } from './StatusBadge';
import { Hospital, Droplet, Ambulance, Home, HardHat, Navigation, Phone, MapPin } from 'lucide-react';
import { accent } from '@/lib/palette';

const typeConfig: Record<ResourceType, { icon: typeof Hospital; color: string }> = {
  hospital: { icon: Hospital, color: accent.slate },
  blood_bank: { icon: Droplet, color: accent.critical },
  ambulance: { icon: Ambulance, color: accent.clay },
  shelter: { icon: Home, color: accent.moss },
  rescue: { icon: HardHat, color: accent.sand },
  incident: { icon: MapPin, color: accent.critical },
};

const typeLabel: Record<ResourceType, string> = {
  hospital: 'Hospital',
  blood_bank: 'Blood Bank',
  ambulance: 'Ambulance',
  shelter: 'Shelter',
  rescue: 'Rescue Team',
  incident: 'Incident',
};

interface ResourceCardProps {
  resource: Resource;
  compact?: boolean;
  dark?: boolean;
}

export function ResourceCard({ resource, compact, dark }: ResourceCardProps) {
  const c = typeConfig[resource.type];
  const Icon = c.icon;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resource.name)}`;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 border p-3 transition-all hover:shadow-sm ${dark ? 'bg-surface-darkCard border-white/10' : 'bg-surface-card border-earth-stone/30'}`}
        style={{ borderRadius: '2px' }}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center border" style={{ borderColor: `${c.color}25`, background: `${c.color}10`, borderRadius: '2px' }}>
          <Icon size={16} style={{ color: c.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-500 truncate ${dark ? 'text-ink-light' : 'text-ink-primary'}`}>{resource.name}</p>
          <p className={`text-xs ${dark ? 'text-ink-lightMuted' : 'text-ink-muted'}`}>
            {[
              resource.distanceKm != null ? `${resource.distanceKm} km` : null,
              resource.etaMin != null ? `${resource.etaMin} min` : null,
            ].filter(Boolean).join(' · ') || 'Route not measured'}
          </p>
        </div>
        <StatusBadge status={resource.status} />
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Directions to ${resource.name}`}
          className={`flex h-8 w-8 shrink-0 items-center justify-center border transition-colors ${dark ? 'border-white/15 text-ink-light hover:bg-white/5' : 'border-ink-primary/20 text-ink-primary hover:bg-earth-stone/15'}`}
          style={{ borderRadius: '2px' }}
        >
          <Navigation size={14} />
        </a>
      </div>
    );
  }

  return (
    <div
      className={`border p-5 transition-all hover:shadow-md animate-fade-in-up ${dark ? 'bg-surface-darkCard border-white/10' : 'bg-surface-card border-earth-stone/30'}`}
      style={{ borderRadius: '2px' }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center border" style={{ borderColor: `${c.color}25`, background: `${c.color}10`, borderRadius: '2px' }}>
          <Icon size={20} style={{ color: c.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={`text-lg font-serif font-600 truncate ${dark ? 'text-ink-light' : 'text-ink-primary'}`}>
                {resource.name}
              </h3>
              <p className={`text-xs ${dark ? 'text-ink-lightMuted' : 'text-ink-muted'}`}>{typeLabel[resource.type]}</p>
            </div>
            <StatusBadge status={resource.status} />
          </div>
        </div>
      </div>

      <div className={`mt-4 flex items-center gap-5 ${dark ? 'text-ink-lightMuted' : 'text-ink-muted'}`}>
        {resource.distanceKm != null ? (
          <span className="flex items-center gap-1.5 text-sm">
            <MapPin size={13} /> {resource.distanceKm} km
          </span>
        ) : null}
        {resource.etaMin != null ? (
          <span className="flex items-center gap-1.5 text-sm">
            <Navigation size={13} /> {resource.etaMin} min
          </span>
        ) : null}
        {resource.distanceKm == null && resource.etaMin == null && (
          <span className="text-sm">Route not measured</span>
        )}
      </div>

      <div className={`mt-3 space-y-1 border-t pt-3 ${dark ? 'border-white/10' : 'border-earth-stone/30'}`}>
        {resource.details.map((d, i) => (
          <p key={i} className={`text-sm ${dark ? 'text-ink-lightMuted' : 'text-ink-muted'}`}>
            {d}
          </p>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 border border-cream bg-cream py-2.5 text-sm font-500 text-ink-inverse transition-colors hover:bg-earth-stone"
          style={{ borderRadius: '2px' }}
        >
          <Navigation size={14} /> Directions
        </a>
        {resource.phone ? (
          <a
            href={`tel:${resource.phone}`}
            className={`flex items-center justify-center gap-1.5 border px-4 py-2.5 text-sm font-500 transition-colors ${dark ? 'border-white/15 text-ink-light hover:bg-white/5' : 'border-ink-primary/20 text-ink-primary hover:bg-earth-stone/15'}`}
            style={{ borderRadius: '2px' }}
          >
            <Phone size={14} /> Call
          </a>
        ) : (
          <span
            className={`flex items-center justify-center gap-1.5 border px-4 py-2.5 text-xs font-500 ${dark ? 'border-white/10 text-ink-lightMuted' : 'border-earth-stone/40 text-ink-muted'}`}
            style={{ borderRadius: '2px' }}
            title="No direct line registered for this resource"
          >
            No line
          </span>
        )}
      </div>
    </div>
  );
}
