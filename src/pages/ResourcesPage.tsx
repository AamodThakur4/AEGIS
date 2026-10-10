import type { Resource, ResourceType } from '@/types';
import { resourceTypeLabel } from '@/data';
import { ResourceCard } from '@/components/ResourceCard';
import { Hospital, Droplet, Ambulance, Home, HardHat, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ResourcesPageProps {
  resources: Resource[];
  initialType?: ResourceType | 'all';
}

const filterTabs: { type: ResourceType | 'all'; label: string; icon: typeof Hospital }[] = [
  { type: 'all', label: 'All', icon: Search },
  { type: 'hospital', label: 'Hospitals', icon: Hospital },
  { type: 'blood_bank', label: 'Blood Banks', icon: Droplet },
  { type: 'ambulance', label: 'Ambulances', icon: Ambulance },
  { type: 'shelter', label: 'Shelters', icon: Home },
  { type: 'rescue', label: 'Rescue Teams', icon: HardHat },
];

function matches(r: Resource, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    r.name.toLowerCase().includes(needle) ||
    resourceTypeLabel[r.type].toLowerCase().includes(needle) ||
    r.type.includes(needle) ||
    r.details.some((d) => d.toLowerCase().includes(needle)) ||
    (r.capacity ?? '').toLowerCase().includes(needle)
  );
}

export function ResourcesPage({ resources, initialType = 'all' }: ResourcesPageProps) {
  const [filter, setFilter] = useState<ResourceType | 'all'>(initialType);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setFilter(initialType);
  }, [initialType]);

  const filtered = resources.filter((r) => {
    if (filter !== 'all' && r.type !== filter) return false;
    return matches(r, query);
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-serif font-600 text-ink-primary">Resources</h1>

      {}
      <div className="relative">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search: 'blood bank near me', 'nearest ICU', 'shelter'..."
          className="w-full border border-earth-stone/40 bg-surface-card py-3 pl-11 pr-4 text-sm text-ink-primary placeholder-ink-muted outline-none transition-colors focus:border-ink-primary"
          style={{ borderRadius: '2px' }}
        />
      </div>

      {}
      <div className="flex gap-px border border-earth-stone/30 bg-earth-stone/30 overflow-x-auto no-scrollbar" style={{ borderRadius: '2px', overflow: 'hidden' }}>
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const active = filter === tab.type;
          return (
            <button
              key={tab.type}
              onClick={() => setFilter(tab.type)}
              className={`flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-sm font-500 transition-colors ${
                active ? 'bg-cream text-ink-inverse' : 'bg-surface-card text-ink-muted hover:bg-surface-raised'
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-xs text-ink-muted">{filtered.length} resources found</p>

      {/* Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((r) => (
          <ResourceCard key={r.id} resource={r} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="border border-earth-stone/30 bg-surface-card p-12 text-center" style={{ borderRadius: '2px' }}>
          <p className="text-sm text-ink-muted">No resources match your search.</p>
        </div>
      )}
    </div>
  );
}
