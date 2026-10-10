import type { ReactNode } from 'react';
import { Bell, Building2, History, Home, Map, Monitor } from 'lucide-react';
import type { CitizenPage } from '@/types';
import { alerts } from '@/data';
import { COMMAND_URL, LANDING_URL, PAGE_URL } from '@/navigation';
import { BrandMark } from '@/components/BrandMark';
import { NoticeToast } from '@/components/NoticeToast';

const bottomNav: { id: CitizenPage; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'resources', label: 'Resources', icon: Building2 },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'history', label: 'History', icon: History },
];

export function CitizenShell({ page, children }: { page: CitizenPage | null; children: ReactNode }) {
  const openAlerts = alerts.filter((a) => a.active).length;

  return (
    <div className="min-h-screen bg-surface-page">
      <header className="sticky top-0 z-40 bg-surface-card/95 backdrop-blur-md border-b border-earth-stone/30">
        <div className="mx-auto max-w-3xl px-5">
          <div className="flex h-16 items-center justify-between">
            <a href={LANDING_URL} className="flex items-center gap-2.5" aria-label="AEGIS home">
              <BrandMark className="h-8 w-8" />
              <span className="text-xl font-serif font-600 tracking-wide text-ink-primary">AEGIS</span>
            </a>
            <div className="flex items-center gap-3">
              <a
                href={COMMAND_URL}
                className="flex items-center gap-1.5 text-xs font-500 text-ink-muted transition-colors hover:text-ink-primary link-underline"
              >
                <Monitor size={14} /> Command Center
              </a>
              <a
                href={PAGE_URL.alerts}
                aria-label={`Alerts, ${openAlerts} active`}
                className="relative flex h-8 w-8 items-center justify-center text-ink-muted hover:text-ink-primary transition-colors"
              >
                <Bell size={17} />
                {openAlerts > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-status-critical px-1 text-[9px] font-600 text-cream">
                    {openAlerts}
                  </span>
                )}
              </a>
              <div
                className="flex h-8 w-8 items-center justify-center border border-earth-stone/50 text-xs font-500 text-ink-primary"
                style={{ borderRadius: '2px' }}
              >
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 pb-24">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-card/95 backdrop-blur-md border-t border-earth-stone/30">
        <div className="mx-auto max-w-3xl px-2">
          <div className="flex items-center justify-around">
            {bottomNav.map((item) => {
              const Icon = item.icon;
              const active = page === item.id;
              return (
                <a
                  key={item.id}
                  href={PAGE_URL[item.id]}
                  aria-current={active ? 'page' : undefined}
                  className="flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors"
                  style={{ color: active ? '#F5F0E8' : '#A89F92' }}
                >
                  <span className="relative">
                    <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                    {item.id === 'alerts' && openAlerts > 0 && (
                      <span className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-status-critical" />
                    )}
                  </span>
                  <span className="text-[10px] font-500 tracking-wide">{item.label}</span>
                  {active && <div className="h-0.5 w-6 bg-ink-primary" />}
                </a>
              );
            })}
          </div>
        </div>
      </nav>

      <NoticeToast />
    </div>
  );
}
