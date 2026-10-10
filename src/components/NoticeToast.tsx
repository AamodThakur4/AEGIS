import { useEffect, useState } from 'react';
import { Mail, MessageSquare, AlertTriangle, X } from 'lucide-react';
import { useNotices } from '@/hooks/useNotices';
import type { NoticeOutcome } from '@/lib/notify';

// email + SMS for one SOS land a moment apart; show them together
const BURST_MS = 15_000;

function label(n: NoticeOutcome): string {
  const what = n.channel === 'sms' ? 'Emergency SMS' : 'Emergency email';
  return n.sent ? `${what} sent` : `${what} not sent`;
}

function NoticeRow({ notice }: { notice: NoticeOutcome }) {
  const ok = notice.sent;
  const Icon = !ok ? AlertTriangle : notice.channel === 'sms' ? MessageSquare : Mail;
  return (
    <div className="flex items-start gap-3">
      <span
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border"
        style={{
          borderRadius: '2px',
          borderColor: ok ? 'rgba(157,179,137,0.5)' : 'rgba(242,122,102,0.5)',
          background: ok ? 'rgba(157,179,137,0.12)' : 'rgba(242,122,102,0.12)',
          color: ok ? '#9DB389' : '#F27A66',
        }}
      >
        <Icon size={14} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-600 text-ink-primary">{label(notice)}</p>
        <p className="mt-0.5 break-words text-xs text-ink-muted">{notice.subject}</p>
        <p className="mt-1 break-words text-[11px]" style={{ color: ok ? '#9DB389' : '#F27A66' }}>
          {notice.detail}
        </p>
        {!ok && notice.mailto && (
          <a
            href={notice.mailto}
            className="mt-2 inline-flex items-center gap-1.5 border border-white/15 px-3 py-1.5 text-xs font-500 text-ink-light transition-colors hover:bg-white/5"
            style={{ borderRadius: '2px' }}
          >
            <Mail size={12} /> Open email draft
          </a>
        )}
      </div>
    </div>
  );
}

export function NoticeToast() {
  const notices = useNotices();
  const latest = notices[0];
  const [visibleId, setVisibleId] = useState<string | null>(null);

  useEffect(() => {
    if (!latest || latest.id === visibleId) return;
    setVisibleId(latest.id);
    const timer = window.setTimeout(() => setVisibleId(null), 9000);
    return () => window.clearTimeout(timer);
  }, [latest, visibleId]);

  if (!latest || latest.id !== visibleId) return null;

  const burst = notices.filter((n) => latest.at - n.at < BURST_MS && n.trigger === latest.trigger);
  const allOk = burst.every((n) => n.sent);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 right-4 z-[60] animate-fade-in-up border bg-surface-darkSecondary shadow-lg sm:right-auto sm:max-w-sm"
      style={{
        borderRadius: '2px',
        borderColor: allOk ? 'rgba(157,179,137,0.45)' : 'rgba(242,122,102,0.5)',
      }}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-3">
          {burst.map((n) => (
            <NoticeRow key={n.id} notice={n} />
          ))}
          <p className="text-[11px] text-ink-muted">
            {new Date(latest.at).toLocaleTimeString()} ·{' '}
            {latest.trigger === 'sos' ? 'Citizen SOS' : 'Critical incident'}
          </p>
        </div>

        <button
          onClick={() => setVisibleId(null)}
          aria-label="Dismiss notification"
          className="shrink-0 text-ink-muted transition-colors hover:text-ink-primary"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
