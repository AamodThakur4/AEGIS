import { useEffect, useRef, useState } from 'react';

interface SOSButtonProps {
  onActivate: () => void;
  onCancel?: () => void;
  dark?: boolean;
}

export function SOSButton({ onActivate, onCancel, dark }: SOSButtonProps) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activated, setActivated] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startHold = () => {
    if (activated) return;
    setHolding(true);
    setProgress(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(elapsed / 2000, 1);
      setProgress(pct);
      if (pct >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        setActivated(true);
        setHolding(false);
        onActivate();
      }
    }, 30);
  };

  const cancelHold = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setHolding(false);
    setProgress(0);
  };

  const reset = () => {
    setActivated(false);
    setProgress(0);
    onCancel?.();
  };

  if (activated) {
    return (
      <div className="flex flex-col items-center gap-4 animate-scale-in">
        <div className="relative flex h-40 w-40 items-center justify-center border border-status-critical bg-status-critical text-cream">
          <div className="absolute inset-0 bg-status-critical animate-pulse-soft opacity-80" />
          <div className="relative flex flex-col items-center gap-1.5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="text-xs font-500 uppercase tracking-[0.2em]">Activated</span>
          </div>
        </div>
        <p className={`text-center text-sm ${dark ? 'text-ink-lightMuted' : 'text-ink-muted'}`}>
          Help is on the way. Stay safe and keep your location on.
        </p>
        <button
          onClick={reset}
          className={`text-xs font-500 link-underline ${dark ? 'text-ink-light' : 'text-ink-primary'}`}
        >
          Cancel SOS
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault();
            startHold();
          }
        }}
        onKeyUp={cancelHold}
        aria-label="Hold for two seconds to activate SOS"
        className="relative flex h-40 w-40 touch-none select-none items-center justify-center border border-status-critical/30 bg-status-critical text-cream transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
        style={{ borderRadius: '2px' }}
      >
        {holding && (
          <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: '1px' }}>
            <div
              className="absolute bottom-0 left-0 h-full w-full origin-bottom"
              style={{ transform: `scaleY(${progress})`, background: 'rgba(0,0,0,0.2)' }}
            />
          </div>
        )}
        {holding && (
          <div className="absolute -inset-2 border border-status-critical/20 animate-pulse-soft" style={{ borderRadius: '2px' }} />
        )}
        <div className="relative flex flex-col items-center gap-1.5">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="text-lg font-serif font-600 tracking-[0.3em]">SOS</span>
          <span className="text-[10px] font-400 uppercase tracking-wider opacity-70">
            {holding ? 'Keep holding...' : 'Hold 2s to activate'}
          </span>
        </div>
      </button>
    </div>
  );
}
