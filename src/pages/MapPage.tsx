import { useState } from 'react';
import type { Resource, Incident } from '@/types';
import { resourceTypeLabel } from '@/data';
import { GoogleMapView } from '@/components/GoogleMapView';
import { ResourceCard } from '@/components/ResourceCard';
import { LocationMap } from '@/components/LocationMap';
import { SeverityBadge } from '@/components/StatusBadge';
import { Search, X } from 'lucide-react';

interface MapPageProps {
  resources: Resource[];
  incidents: Incident[];
  dark?: boolean;
}

export function MapPage({ resources, incidents, dark }: MapPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const liveIncidents = incidents.filter((i) => i.status !== 'resolved');

  const selectedResource = resources.find((r) => r.id === selectedId);
  const selectedIncident = liveIncidents.find((i) => i.id === selectedId);
  const selected = selectedResource || selectedIncident;

  const needle = query.trim().toLowerCase();
  const filteredResources = needle
    ? resources.filter(
        (r) =>
          r.name.toLowerCase().includes(needle) ||
          resourceTypeLabel[r.type].toLowerCase().includes(needle) ||
          r.type.includes(needle) ||
          r.details.some((d) => d.toLowerCase().includes(needle)),
      )
    : resources;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:h-[calc(100vh-200px)]">
      {}
      <div className="relative h-[300px] shrink-0 border border-earth-stone/30 lg:h-full lg:flex-1">
        <GoogleMapView
          resources={filteredResources}
          incidents={liveIncidents}
          onMarkerClick={(id) => setSelectedId(id)}
          selectedId={selectedId || undefined}
        />
      </div>

      {}
      <div className="w-full lg:w-80 shrink-0 space-y-4 overflow-y-auto no-scrollbar">
        {}
        <LocationMap />

        {}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources..."
            className={`w-full border py-2.5 pl-9 pr-3 text-sm outline-none transition-colors ${dark ? 'bg-surface-darkSecondary text-ink-light placeholder-ink-lightMuted border-white/10 focus:border-aegis-slate' : 'bg-surface-card text-ink-primary placeholder-ink-muted border-earth-stone/40 focus:border-ink-primary'}`}
            style={{ borderRadius: '2px' }}
          />
        </div>

        {/* Active incidents */}
        <div>
          <h3 className={`text-xs font-500 uppercase tracking-[0.15em] mb-3 ${dark ? 'text-ink-lightMuted' : 'text-ink-muted'}`}>
            Active Incidents ({liveIncidents.filter((i) => i.status === 'active').length} of {liveIncidents.length} open)
          </h3>
          <div className="space-y-2">
            {liveIncidents.map((inc) => (
              <button
                key={inc.id}
                onClick={() => setSelectedId(inc.id)}
                className={`w-full text-left border p-3 transition-all ${selectedId === inc.id ? (dark ? 'border-cream' : 'border-ink-primary') : ''} ${dark ? 'bg-surface-darkCard border-white/10 hover:border-white/20' : 'bg-surface-card border-earth-stone/30 hover:border-earth-stone'}`}
                style={{ borderRadius: '2px' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-500 ${dark ? 'text-ink-light' : 'text-ink-primary'}`}>{inc.title}</p>
                  <SeverityBadge severity={inc.severity} />
                </div>
                <p className={`mt-1 text-xs ${dark ? 'text-ink-lightMuted' : 'text-ink-muted'}`}>
                  {inc.location} · {inc.reportedAt}
                </p>
              </button>
            ))}
            {liveIncidents.length === 0 && (
              <p className={`text-xs ${dark ? 'text-ink-lightMuted' : 'text-ink-muted'}`}>No open incidents.</p>
            )}
          </div>
        </div>

        {/* Selected detail */}
        {selected && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-xs font-500 uppercase tracking-[0.15em] ${dark ? 'text-ink-lightMuted' : 'text-ink-muted'}`}>
                Selected
              </h3>
              <button onClick={() => setSelectedId(null)} className={dark ? 'text-ink-lightMuted' : 'text-ink-muted'} aria-label="Clear selection">
                <X size={13} />
              </button>
            </div>
            {selectedResource && <ResourceCard resource={selectedResource} dark={dark} />}
            {selectedIncident && (
              <div className={`border p-4 ${dark ? 'bg-surface-darkCard border-white/10' : 'bg-surface-card border-earth-stone/30'}`} style={{ borderRadius: '2px' }}>
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-lg font-serif font-600 ${dark ? 'text-ink-light' : 'text-ink-primary'}`}>{selectedIncident.title}</h4>
                  <SeverityBadge severity={selectedIncident.severity} />
                </div>
                <p className={`mt-2 text-sm ${dark ? 'text-ink-lightMuted' : 'text-ink-muted'}`}>{selectedIncident.description}</p>
                <div className={`mt-3 flex items-center gap-4 text-xs ${dark ? 'text-ink-lightMuted' : 'text-ink-muted'} border-t pt-3 ${dark ? 'border-white/10' : 'border-earth-stone/30'}`}>
                  <span>{selectedIncident.location}</span>
                  <span>{selectedIncident.peopleAffected.toLocaleString()} affected</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nearby resources list */}
        {!selected && (
          <div>
            <h3 className={`text-xs font-500 uppercase tracking-[0.15em] mb-3 ${dark ? 'text-ink-lightMuted' : 'text-ink-muted'}`}>
              Nearby ({filteredResources.length})
            </h3>
            <div className="space-y-2">
              {filteredResources.slice(0, 5).map((r) => (
                <ResourceCard key={r.id} resource={r} compact dark={dark} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
