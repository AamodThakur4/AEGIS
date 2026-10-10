import { useState, type FormEvent } from 'react';
import type { Resource, ResourceDraft, ResourceType, ResourceStatus, Incident, IncidentDraft, DisasterType, Severity } from '@/types';
import { MapView } from '@/components/MapView';
import { ResourceCard } from '@/components/ResourceCard';
import { SeverityBadge } from '@/components/StatusBadge';
import { AIAssistant } from '@/components/AIAssistant';
import { BrandMark } from '@/components/BrandMark';
import { MapPage } from './MapPage';
import {
  LayoutDashboard, Map, Siren, Building2, BarChart3, Settings,
  AlertTriangle, Hospital, Droplet, Ambulance, Home, HardHat,
  Users, TrendingUp, Clock, MapPin, Bell, Search, Menu, X, CheckCircle2, Plus,
  Trash2, Copy, Pencil,
} from 'lucide-react';

interface CommandCenterProps {
  resources: Resource[];
  incidents: Incident[];
  onAdvance: (id: string) => void;
  onReport: (draft: IncidentDraft) => void;
  onAddResource: (draft: ResourceDraft) => void;
  onDuplicateResource: (id: string) => void;
  onRemoveResource: (id: string) => void;
  onUpdateResource: (id: string, patch: Partial<Resource>) => void;
}

type CmdPage = 'dashboard' | 'map' | 'incidents' | 'resources' | 'analytics';

const sidebarItems: { id: CmdPage; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'map', label: 'Live Map', icon: Map },
  { id: 'incidents', label: 'Incidents', icon: Siren },
  { id: 'resources', label: 'Resources', icon: Building2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export function CommandCenter({
  resources,
  incidents,
  onAdvance,
  onReport,
  onAddResource,
  onDuplicateResource,
  onRemoveResource,
  onUpdateResource,
}: CommandCenterProps) {
  const [page, setPage] = useState<CmdPage>('dashboard');
  const [navOpen, setNavOpen] = useState(false);

  const goTo = (p: CmdPage) => {
    setPage(p);
    setNavOpen(false);
  };

  const navList = (
    <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto no-scrollbar">
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        const active = page === item.id;
        return (
          <button
            key={item.id}
            onClick={() => goTo(item.id)}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm font-500 transition-colors ${
              active ? 'bg-white/8 text-cream border-l-2 border-cream' : 'text-ink-lightMuted hover:bg-white/4 hover:text-ink-light border-l-2 border-transparent'
            }`}
          >
            <Icon size={16} /> {item.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-surface-dark text-ink-light overflow-hidden">
      {/* Sidebar (desktop) */}
      <div className="hidden md:flex w-56 shrink-0 flex-col bg-surface-darkSecondary border-r border-white/8">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/8">
          <BrandMark className="h-8 w-8" />
          <div>
            <p className="text-base font-serif font-600 text-ink-light">AEGIS</p>
            <p className="text-[10px] text-ink-lightMuted uppercase tracking-[0.15em]">Command Center</p>
          </div>
        </div>

        {navList}

        <div className="p-3 border-t border-white/8">
          <button className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-500 text-ink-lightMuted hover:bg-white/4 hover:text-ink-light transition-colors">
            <Settings size={16} /> Settings
          </button>
          <div className="mt-2 flex items-center gap-2.5 px-3 py-2">
            <div className="h-7 w-7 border border-white/20 flex items-center justify-center text-xs font-500 text-cream" style={{ borderRadius: '2px' }}>
              OP
            </div>
            <div className="min-w-0">
              <p className="text-xs font-500 text-ink-light truncate">Operator</p>
              <p className="text-[10px] text-ink-lightMuted truncate">Nepal EOC</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer — without this, phones had no way to leave the dashboard. */}
      {navOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-surface-darkSecondary border-r border-white/10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <BrandMark className="h-8 w-8" />
                <div>
                  <p className="text-base font-serif font-600 text-ink-light">AEGIS</p>
                  <p className="text-[10px] text-ink-lightMuted uppercase tracking-[0.15em]">Command Center</p>
                </div>
              </div>
              <button onClick={() => setNavOpen(false)} aria-label="Close navigation" className="text-ink-lightMuted hover:text-ink-light">
                <X size={18} />
              </button>
            </div>
            {navList}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-3 bg-surface-darkSecondary border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
              className="flex h-8 w-8 items-center justify-center border border-white/10 text-ink-light md:hidden"
              style={{ borderRadius: '2px' }}
            >
              <Menu size={16} />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <BrandMark className="h-8 w-8" />
              <span className="text-base font-serif font-600">AEGIS</span>
            </div>
          </div>
          <div className="flex-1 max-w-md relative hidden sm:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-lightMuted" />
            <input
              type="text"
              placeholder="Search incidents, resources..."
              className="w-full bg-surface-dark text-ink-light placeholder-ink-lightMuted border border-white/10 py-2 pl-9 pr-3 text-sm outline-none focus:border-cream/30 transition-colors"
              style={{ borderRadius: '2px' }}
            />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink-lightMuted">
              <span className="h-1.5 w-1.5 rounded-full bg-status-safe animate-pulse-soft" />
              System Operational
            </div>
            <button
              onClick={() => goTo('incidents')}
              aria-label="Incidents"
              className="relative flex h-8 w-8 items-center justify-center hover:bg-white/5 transition-colors"
            >
              <Bell size={16} className="text-ink-lightMuted" />
              {incidents.filter((i) => i.status === 'active').length > 0 && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-status-critical" />
              )}
            </button>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-5">
          {page === 'dashboard' && <Dashboard resources={resources} incidents={incidents} onNavigate={goTo} />}
          {page === 'map' && <MapPage resources={resources} incidents={incidents} dark />}
          {page === 'incidents' && <IncidentsPage incidents={incidents} onAdvance={onAdvance} onNavigate={goTo} onReport={onReport} />}
          {page === 'resources' && (
          <CommandResourcesPage
            resources={resources}
            onAdd={onAddResource}
            onDuplicate={onDuplicateResource}
            onRemove={onRemoveResource}
            onUpdate={onUpdateResource}
          />
        )}
          {page === 'analytics' && <AnalyticsPage resources={resources} incidents={incidents} />}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ resources, incidents, onNavigate }: { resources: Resource[]; incidents: Incident[]; onNavigate: (p: CmdPage) => void }) {
  const open = incidents.filter((i) => i.status !== 'resolved');
  // Share of incidents that have a responder assigned (responding or resolved).
  const responseRate = incidents.length
    ? Math.round((incidents.filter((i) => i.status !== 'active').length / incidents.length) * 100)
    : 0;

  const stats = [
    { label: 'Active Incidents', value: incidents.filter((i) => i.status === 'active').length, icon: AlertTriangle, color: '#C66B47' },
    { label: 'Hospitals', value: resources.filter((r) => r.type === 'hospital').length, icon: Hospital, color: '#4A6275' },
    { label: 'Ambulances', value: resources.filter((r) => r.type === 'ambulance').length, icon: Ambulance, color: '#C99A3B' },
    { label: 'Shelters', value: resources.filter((r) => r.type === 'shelter').length, icon: Home, color: '#8B9B7E' },
    { label: 'Blood Banks', value: resources.filter((r) => r.type === 'blood_bank').length, icon: Droplet, color: '#C66B47' },
    { label: 'Rescue Teams', value: resources.filter((r) => r.type === 'rescue').length, icon: HardHat, color: '#A89F92' },
    { label: 'People Affected', value: open.reduce((s, i) => s + i.peopleAffected, 0).toLocaleString(), icon: Users, color: '#4A6275' },
    { label: 'Response Rate', value: `${responseRate}%`, icon: TrendingUp, color: '#8B9B7E' },
  ];

  const priority = open.filter((i) => i.severity === 'critical' || i.severity === 'high');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-serif font-600 text-ink-light">Dashboard</h1>
        <p className="text-sm text-ink-lightMuted mt-1">Real-time overview of all operations</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/8 border border-white/8" style={{ borderRadius: '2px', overflow: 'hidden' }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-surface-darkCard p-4">
              <Icon size={18} style={{ color: s.color }} />
              <p className="mt-2 text-2xl font-serif font-600 text-ink-light">{s.value}</p>
              <p className="text-xs text-ink-lightMuted">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Map + side panels */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 h-[400px]">
          <MapView resources={resources} incidents={open} dark height="100%" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-500 uppercase tracking-[0.15em] text-ink-lightMuted">Priority Incidents</h3>
            <button onClick={() => onNavigate('incidents')} className="text-xs text-cream/70 link-underline">View all</button>
          </div>
          <div className="space-y-2 max-h-[370px] overflow-y-auto no-scrollbar">
            {priority.map((inc) => (
              <div key={inc.id} className="bg-surface-darkCard border border-white/8 p-3" style={{ borderRadius: '2px' }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-500 text-ink-light">{inc.title}</p>
                  <SeverityBadge severity={inc.severity} />
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-ink-lightMuted">
                  <span className="flex items-center gap-1"><MapPin size={11} /> {inc.location}</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {inc.reportedAt}</span>
                </div>
              </div>
            ))}
            {priority.length === 0 && (
              <div className="border border-white/8 p-4 text-center" style={{ borderRadius: '2px' }}>
                <CheckCircle2 size={18} className="mx-auto text-earth-sage mb-1.5" />
                <p className="text-xs text-ink-lightMuted">No priority incidents. All reports are low severity.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <div className="h-[360px]">
        <AIAssistant dark resources={resources} incidents={incidents} />
      </div>
    </div>
  );
}

const FORM_FIELD =
  'w-full border border-white/10 bg-surface-darkSecondary px-3 py-2.5 text-sm text-ink-light placeholder-ink-lightMuted outline-none transition-colors focus:border-aegis-slate';

function IncidentsPage({
  incidents,
  onAdvance,
  onNavigate,
  onReport,
}: {
  incidents: Incident[];
  onAdvance: (id: string) => void;
  onNavigate: (p: CmdPage) => void;
  onReport: (draft: IncidentDraft) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'active' | 'responding' | 'resolved'>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    location: '',
    type: 'flood' as DisasterType,
    severity: 'critical' as Severity,
    peopleAffected: '',
    description: '',
  });

  const filtered = filter === 'all' ? incidents : incidents.filter((i) => i.status === filter);
  const canSubmit = form.title.trim().length > 1 && form.location.trim().length > 1;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const title = form.title.trim();
    const location = form.location.trim();
    onReport({
      title,
      location,
      type: form.type,
      severity: form.severity,
      peopleAffected: Number(form.peopleAffected) || 0,
      description:
        form.description.trim() ||
        `${title} reported at ${location}. Awaiting field assessment.`,
    });
    setForm({
      title: '',
      location: '',
      type: 'flood',
      severity: 'critical',
      peopleAffected: '',
      description: '',
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-600 text-ink-light">Incidents</h1>
          <p className="text-sm text-ink-lightMuted mt-1">All reported emergencies</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 border border-cream bg-cream px-4 py-2.5 text-sm font-500 text-ink-inverse transition-colors hover:bg-earth-stone"
          style={{ borderRadius: '2px' }}
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancel' : 'Report incident'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="border border-white/8 bg-surface-darkCard p-5 animate-fade-in-up"
          style={{ borderRadius: '2px' }}
        >
          <p className="text-xs font-500 uppercase tracking-[0.15em] text-ink-lightMuted">
            New incident report
          </p>
          <p className="mt-1.5 text-xs text-ink-lightMuted">
            Marking this{' '}
            <span className="text-earth-terracotta">critical</span> emails the response
            organisation straight away.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
                Title
              </span>
              <input
                className={FORM_FIELD}
                style={{ borderRadius: '2px' }}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Structure fire near Kalanki"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
                Location
              </span>
              <input
                className={FORM_FIELD}
                style={{ borderRadius: '2px' }}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Area / landmark"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
                People affected
              </span>
              <input
                type="number"
                min={0}
                className={FORM_FIELD}
                style={{ borderRadius: '2px' }}
                value={form.peopleAffected}
                onChange={(e) => setForm({ ...form, peopleAffected: e.target.value })}
                placeholder="0"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
                Type
              </span>
              <select
                className={FORM_FIELD}
                style={{ borderRadius: '2px' }}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as DisasterType })}
              >
                {(['flood', 'fire', 'earthquake', 'landslide', 'accident', 'medical'] as DisasterType[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
                Severity
              </span>
              <select
                className={FORM_FIELD}
                style={{ borderRadius: '2px' }}
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })}
              >
                {(['critical', 'high', 'moderate', 'low'] as Severity[]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
                Description (optional)
              </span>
              <textarea
                rows={2}
                className={FORM_FIELD}
                style={{ borderRadius: '2px' }}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What responders need to know before they arrive"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-white/15 px-4 py-2 text-sm font-500 text-ink-lightMuted transition-colors hover:bg-white/5"
              style={{ borderRadius: '2px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="border border-cream bg-cream px-5 py-2 text-sm font-500 text-ink-inverse transition-colors hover:bg-earth-stone disabled:cursor-not-allowed disabled:opacity-40"
              style={{ borderRadius: '2px' }}
            >
              Submit report
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-px border border-white/8 bg-white/8 overflow-x-auto no-scrollbar" style={{ borderRadius: '2px' }}>
        {(['all', 'active', 'responding', 'resolved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-2.5 text-sm font-500 capitalize transition-colors ${
              filter === f ? 'bg-cream text-ink-inverse' : 'bg-surface-darkCard text-ink-lightMuted hover:text-ink-light'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((inc) => (
          <div key={inc.id} className="bg-surface-darkCard border border-white/8 p-5" style={{ borderRadius: '2px' }}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-serif font-600 text-ink-light">{inc.title}</h3>
              <SeverityBadge severity={inc.severity} />
            </div>
            <p className="mt-2 text-sm text-ink-lightMuted leading-relaxed">{inc.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-5 text-xs text-ink-lightMuted border-t border-white/8 pt-3">
              <span className="flex items-center gap-1.5"><MapPin size={12} /> {inc.location}</span>
              <span className="flex items-center gap-1.5"><Users size={12} /> {inc.peopleAffected.toLocaleString()} affected</span>
              <span className="flex items-center gap-1.5"><Clock size={12} /> {inc.reportedAt}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => onAdvance(inc.id)}
                disabled={inc.status === 'resolved'}
                className={`flex-1 border py-2 text-sm font-500 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  inc.status === 'active'
                    ? 'border-status-safe bg-status-safe text-cream hover:bg-earth-sage'
                    : inc.status === 'responding'
                      ? 'border-aegis-slate bg-aegis-slate text-cream hover:opacity-90'
                      : 'border-white/15 text-ink-lightMuted'
                }`}
                style={{ borderRadius: '2px' }}
              >
                {inc.status === 'active' ? 'Accept dispatch' : inc.status === 'responding' ? 'Mark resolved' : 'Closed'}
              </button>
              <button
                onClick={() => onNavigate('map')}
                className="border border-white/15 px-4 py-2 text-sm font-500 text-ink-lightMuted hover:bg-white/5 transition-colors"
                style={{ borderRadius: '2px' }}
              >
                Locate
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="border border-white/8 p-10 text-center" style={{ borderRadius: '2px' }}>
          <CheckCircle2 size={22} className="mx-auto text-earth-sage mb-2" />
          <p className="text-sm font-500 text-ink-light">No {filter === 'all' ? '' : filter} incidents</p>
          <p className="text-xs text-ink-lightMuted mt-1">Switch filters to see other reports.</p>
        </div>
      )}
    </div>
  );
}

const RESOURCE_TYPES: ResourceType[] = [
  'hospital', 'blood_bank', 'ambulance', 'shelter', 'rescue',
];

const RESOURCE_STATUSES: ResourceStatus[] = [
  'available', 'critical', 'responding', 'in_transit', 'offline',
];

const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  hospital: 'Hospital',
  blood_bank: 'Blood Bank',
  ambulance: 'Ambulance',
  shelter: 'Shelter',
  rescue: 'Rescue Team',
  incident: 'Incident',
};

const EMPTY_RESOURCE_FORM = {
  name: '',
  type: 'ambulance' as ResourceType,
  status: 'available' as ResourceStatus,
  location: '',
  lat: '',
  lng: '',
  distanceKm: '',
  etaMin: '',
  capacity: '',
  phone: '',
  details: '',
};

interface CommandResourcesPageProps {
  resources: Resource[];
  onAdd: (draft: ResourceDraft) => void;
  /** Clones a unit, raising the count of that type. */
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Resource>) => void;
}

function CommandResourcesPage({
  resources,
  onAdd,
  onDuplicate,
  onRemove,
  onUpdate,
}: CommandResourcesPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_RESOURCE_FORM);
  /** Set while the form patches an existing resource instead of creating one. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = editingId ? (resources.find((r) => r.id === editingId) ?? null) : null;

  /** Blank means "not measured", not zero — zero would be a claim we can't back. */
  const numberOrUndefined = (raw: string) => {
    const value = Number(raw);
    return raw.trim() !== '' && Number.isFinite(value) ? value : undefined;
  };

  const set = (key: keyof typeof EMPTY_RESOURCE_FORM, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /** Opens the form pre-filled with an existing resource. Coordinates come across
   *  verbatim, so saving without touching them leaves the pin exactly where it is. */
  const startEdit = (resource: Resource) => {
    setEditingId(resource.id);
    setForm({
      name: resource.name,
      type: resource.type,
      status: resource.status,
      location: '',
      lat: resource.lat != null ? String(resource.lat) : '',
      lng: resource.lng != null ? String(resource.lng) : '',
      distanceKm: resource.distanceKm != null ? String(resource.distanceKm) : '',
      etaMin: resource.etaMin != null ? String(resource.etaMin) : '',
      capacity: resource.capacity ?? '',
      phone: resource.phone ?? '',
      details: resource.details.join('\n'),
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm(EMPTY_RESOURCE_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  /** Position needs both coordinates or neither — a half-entered pair would
   *  otherwise be dropped and quietly leave the pin somewhere it isn't. */
  const partialCoords = (form.lat.trim() === '') !== (form.lng.trim() === '');

  const canSubmit =
    form.name.trim().length > 1 &&
    !partialCoords &&
    (editingId !== null || form.location.trim().length > 1);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const name = form.name.trim();

    if (editingId) {
      // The card may have been removed while the form was open.
      if (!editing) return resetForm();
      onUpdate(editingId, {
        name,
        type: form.type,
        status: form.status,
        lat: numberOrUndefined(form.lat),
        lng: numberOrUndefined(form.lng),
        distanceKm: numberOrUndefined(form.distanceKm),
        etaMin: numberOrUndefined(form.etaMin),
        capacity: form.capacity.trim() || undefined,
        phone: form.phone.trim() || undefined,
        details: form.details
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      });
      resetForm();
      return;
    }

    onAdd({
      name,
      type: form.type,
      status: form.status,
      location: form.location.trim(),
      lat: numberOrUndefined(form.lat),
      lng: numberOrUndefined(form.lng),
      distanceKm: numberOrUndefined(form.distanceKm),
      etaMin: numberOrUndefined(form.etaMin),
      capacity: form.capacity,
      phone: form.phone,
      details: form.details,
    });
    setForm(EMPTY_RESOURCE_FORM);
    setShowForm(false);
  };

  const available = resources.filter((r) => r.status === 'available').length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-600 text-ink-light">Resources</h1>
          <p className="text-sm text-ink-lightMuted mt-1">
            {resources.length} registered · {available} available
          </p>
        </div>
        <button
          onClick={() => (editingId ? resetForm() : setShowForm((v) => !v))}
          className="flex shrink-0 items-center gap-1.5 border border-cream bg-cream px-4 py-2.5 text-sm font-500 text-ink-inverse transition-colors hover:bg-earth-stone"
          style={{ borderRadius: '2px' }}
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {editingId ? 'Cancel edit' : showForm ? 'Close' : 'Add resource'}
        </button>
      </div>

      {/* Head-count per unit type — the number of resources at a glance. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {RESOURCE_TYPES.map((type) => (
          <div
            key={type}
            className="border border-white/8 bg-surface-darkCard px-3 py-2.5"
            style={{ borderRadius: '2px' }}
          >
            <p className="text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
              {RESOURCE_TYPE_LABEL[type]}
            </p>
            <p className="mt-0.5 text-lg font-600 text-ink-light">
              {resources.filter((r) => r.type === type).length}
            </p>
          </div>
        ))}
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="border border-white/8 bg-surface-darkCard p-5 animate-fade-in-up"
          style={{ borderRadius: '2px' }}
        >
          <p className="text-xs font-500 uppercase tracking-[0.15em] text-ink-lightMuted">
            {editing ? `Editing — ${editing.name}` : 'Register a resource'}
          </p>
          <p className="mt-1.5 text-xs text-ink-lightMuted">
            {editing ? (
              'Position comes from the coordinates below, so saving without touching them keeps the pin exactly where it is.'
            ) : (
              <>
                Appears straight away on every map, list and report. Distance and ETA
                stay <span className="text-earth-ochre">unset</span> unless you enter
                them — the app will not quote a route nobody has measured.
              </>
            )}
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
                Name
              </span>
              <input
                className={FORM_FIELD}
                style={{ borderRadius: '2px' }}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Ambulance Unit-08"
              />
            </label>

            {/* Place-name lookup is a creation convenience — on edit the pin is
                driven by the coordinates below, so the field would be ambiguous. */}
            {!editing && (
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
                  Location (place name)
                </span>
                <input
                  className={FORM_FIELD}
                  style={{ borderRadius: '2px' }}
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  placeholder="e.g. Kalanki, Kathmandu"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
                Type
              </span>
              <select
                className={FORM_FIELD}
                style={{ borderRadius: '2px' }}
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>{RESOURCE_TYPE_LABEL[t]}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
                Status
              </span>
              <select
                className={FORM_FIELD}
                style={{ borderRadius: '2px' }}
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
              >
                {RESOURCE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
                {editing ? 'Latitude' : 'Latitude (optional)'}
              </span>
              <input
                inputMode="decimal"
                className={FORM_FIELD}
                style={{ borderRadius: '2px' }}
                value={form.lat}
                onChange={(e) => set('lat', e.target.value)}
                placeholder={editing ? '27.7172' : '27.7172 — else resolve the place name'}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
                {editing ? 'Longitude' : 'Longitude (optional)'}
              </span>
              <input
                inputMode="decimal"
                className={FORM_FIELD}
                style={{ borderRadius: '2px' }}
                value={form.lng}
                onChange={(e) => set('lng', e.target.value)}
                placeholder={editing ? '85.3240' : '85.3240 — else resolve the place name'}
              />
            </label>

            {partialCoords && (
              <p className="text-xs text-status-critical md:col-span-2">
                Enter both latitude and longitude, or leave both blank — a half-entered
                pair would place the pin somewhere it isn't.
              </p>
            )}

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
                Distance km (optional)
              </span>
              <input
                type="number"
                min={0}
                step="0.1"
                className={FORM_FIELD}
                style={{ borderRadius: '2px' }}
                value={form.distanceKm}
                onChange={(e) => set('distanceKm', e.target.value)}
                placeholder="Leave blank if unmeasured"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
                ETA minutes (optional)
              </span>
              <input
                type="number"
                min={0}
                className={FORM_FIELD}
                style={{ borderRadius: '2px' }}
                value={form.etaMin}
                onChange={(e) => set('etaMin', e.target.value)}
                placeholder="Leave blank if unmeasured"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
                Capacity (optional)
              </span>
              <input
                className={FORM_FIELD}
                style={{ borderRadius: '2px' }}
                value={form.capacity}
                onChange={(e) => set('capacity', e.target.value)}
                placeholder="e.g. Capacity: 500 people"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
                Phone (optional)
              </span>
              <input
                className={FORM_FIELD}
                style={{ borderRadius: '2px' }}
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="e.g. 01-4221000"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-[11px] font-500 uppercase tracking-wider text-ink-lightMuted">
                Details (optional, one per line)
              </span>
              <textarea
                rows={2}
                className={FORM_FIELD}
                style={{ borderRadius: '2px' }}
                value={form.details}
                onChange={(e) => set('details', e.target.value)}
                placeholder="ICU: 3 beds available"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="border border-white/15 px-4 py-2 text-sm font-500 text-ink-lightMuted transition-colors hover:bg-white/5"
              style={{ borderRadius: '2px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center gap-1.5 border border-cream bg-cream px-4 py-2 text-sm font-500 text-ink-inverse transition-colors hover:bg-earth-stone disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderRadius: '2px' }}
            >
              {editing ? <CheckCircle2 size={14} /> : <Plus size={14} />}
              {editing ? 'Save changes' : 'Add resource'}
            </button>
          </div>
        </form>
      )}

      {resources.length === 0 ? (
        <div className="border border-dashed border-white/15 p-10 text-center" style={{ borderRadius: '2px' }}>
          <Building2 size={20} className="mx-auto mb-2 text-ink-lightMuted" />
          <p className="text-sm text-ink-light">No resources registered</p>
          <p className="mt-1 text-xs text-ink-lightMuted">
            Add the first one to place it on every map and report.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <div key={r.id} className="space-y-2">
              <ResourceCard resource={r} dark />

              <select
                aria-label={`Status for ${r.name}`}
                className={FORM_FIELD}
                style={{ borderRadius: '2px' }}
                value={r.status}
                onChange={(e) => onUpdate(r.id, { status: e.target.value as ResourceStatus })}
              >
                {RESOURCE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>

              {editingId === r.id && (
                <p className="text-[11px] font-600 uppercase tracking-wider text-earth-ochre">
                  Editing — changes are in the form above
                </p>
              )}

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => startEdit(r)}
                  className="flex items-center justify-center gap-1.5 border border-white/15 px-2 py-2 text-xs font-500 text-ink-light transition-colors hover:bg-white/5"
                  style={{ borderRadius: '2px' }}
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => onDuplicate(r.id)}
                  className="flex items-center justify-center gap-1.5 border border-white/15 px-2 py-2 text-xs font-500 text-ink-light transition-colors hover:bg-white/5"
                  style={{ borderRadius: '2px' }}
                >
                  <Copy size={13} /> Duplicate
                </button>
                <button
                  onClick={() => {
                    // Never leave the form editing something that no longer exists.
                    if (editingId === r.id) resetForm();
                    onRemove(r.id);
                  }}
                  className="flex items-center justify-center gap-1.5 border border-status-critical/40 px-2 py-2 text-xs font-500 text-status-critical transition-colors hover:bg-status-critical/10"
                  style={{ borderRadius: '2px' }}
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsPage({ resources, incidents }: { resources: Resource[]; incidents: Incident[] }) {
  const typeCount = resources.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Math.max(...) on an empty list is -Infinity, which produced NaN bar widths.
  const maxCount = Math.max(1, ...Object.values(typeCount));

  const ambulances = resources.filter((r) => r.type === 'ambulance');
  // Only ambulances that actually report an ETA can contribute to an average —
  // otherwise a newly registered unit with no route would silently drag it down.
  const withEta = ambulances.filter((r) => r.etaMin != null);
  const avgEta = withEta.length
    ? Math.round(withEta.reduce((s, r) => s + (r.etaMin as number), 0) / withEta.length)
    : null;

  const bars = [
    { label: 'Hospitals', count: typeCount.hospital || 0, color: '#4A6275' },
    { label: 'Blood Banks', count: typeCount.blood_bank || 0, color: '#C66B47' },
    { label: 'Ambulances', count: typeCount.ambulance || 0, color: '#C99A3B' },
    { label: 'Shelters', count: typeCount.shelter || 0, color: '#8B9B7E' },
    { label: 'Rescue Teams', count: typeCount.rescue || 0, color: '#A89F92' },
  ];

  const kpis = [
    { label: 'Total Incidents', value: incidents.length, icon: Siren, color: '#C66B47' },
    { label: 'Resolved', value: incidents.filter((i) => i.status === 'resolved').length, icon: CheckCircle2, color: '#5B6E4F' },
    { label: 'Affected (total)', value: incidents.reduce((s, i) => s + i.peopleAffected, 0).toLocaleString(), icon: Users, color: '#C99A3B' },
    { label: 'Avg Ambulance ETA', value: avgEta == null ? '—' : `${avgEta} min`, icon: Clock, color: '#8B9B7E' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-serif font-600 text-ink-light">Analytics</h1>
        <p className="text-sm text-ink-lightMuted mt-1">Operational insights and performance</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/8 border border-white/8" style={{ borderRadius: '2px', overflow: 'hidden' }}>
        {kpis.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-surface-darkCard p-4">
              <Icon size={18} style={{ color: s.color }} />
              <p className="mt-2 text-2xl font-serif font-600 text-ink-light">{s.value}</p>
              <p className="text-xs text-ink-lightMuted">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Resource distribution */}
      <div className="bg-surface-darkCard border border-white/8 p-5" style={{ borderRadius: '2px' }}>
        <h3 className="text-sm font-serif font-600 text-ink-light mb-4">Resource Distribution</h3>
        <div className="space-y-3">
          {bars.map((b) => (
            <div key={b.label}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-ink-lightMuted font-500">{b.label}</span>
                <span className="text-ink-light font-500">{b.count}</span>
              </div>
              <div className="h-1.5 bg-white/8 overflow-hidden" style={{ borderRadius: '1px' }}>
                <div
                  className="h-full transition-all animate-fade-in"
                  style={{ width: `${(b.count / maxCount) * 100}%`, background: b.color, borderRadius: '1px' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incident timeline */}
      <div className="bg-surface-darkCard border border-white/8 p-5" style={{ borderRadius: '2px' }}>
        <h3 className="text-sm font-serif font-600 text-ink-light mb-4">Incident Timeline</h3>
        <div className="space-y-3">
          {incidents.map((inc) => {
            const color = inc.severity === 'critical' ? '#C66B47' : inc.severity === 'high' ? '#D4845A' : '#C99A3B';
            return (
              <div key={inc.id} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center" style={{ background: `${color}20`, borderRadius: '2px' }}>
                  <AlertTriangle size={13} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-500 text-ink-light truncate">{inc.title}</p>
                  <p className="text-xs text-ink-lightMuted">{inc.location}</p>
                </div>
                <span className="text-xs text-ink-lightMuted shrink-0">{inc.reportedAt}</span>
                <SeverityBadge severity={inc.severity} />
              </div>
            );
          })}
          {incidents.length === 0 && <p className="text-xs text-ink-lightMuted">No incidents recorded.</p>}
        </div>
      </div>
    </div>
  );
}
