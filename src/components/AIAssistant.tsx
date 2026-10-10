import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessage, Resource, Incident } from '@/types';
import { askAegis, assessmentToFields, type UserLocation } from '@/lib/emergencyAI';
import { gemmaStatus } from '@/lib/gemma';
import { accent } from '@/lib/palette';
import { nearestPlace } from '@/data';
import { useOptionalLocation } from '@/context/location';
import { getCurrentCoordinates, type Coordinates } from '@/hooks/useGeolocation';
import { Bot, Send, AlertTriangle, Sparkles, WifiOff, MapPin, Phone } from 'lucide-react';

function toUserLocation(c: Coordinates): UserLocation {
  return { lat: c.lat, lng: c.lng, accuracy: c.accuracy, area: nearestPlace(c.lat, c.lng) };
}

interface AIAssistantProps {
  dark?: boolean;
  resources?: Resource[];
  incidents?: Incident[];
}

export function AIAssistant({ dark, resources = [], incidents = [] }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm0',
      sender: 'ai',
      text: "I'm AEGIS AI, your emergency assistant. Describe what's happening — I'll classify it, extract key details, and tell you what to do next.",
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const status = useMemo(() => gemmaStatus(), []);
  const geo = useOptionalLocation();
  const here = geo?.coords ? toUserLocation(geo.coords) : null;

  // pages without the shared tracker still get a one-off fix
  const [ownFix, setOwnFix] = useState<Coordinates | null>(null);
  useEffect(() => {
    if (geo) return;
    let live = true;
    void getCurrentCoordinates(8000).then((r) => {
      if (live && r.coords) setOwnFix(r.coords);
    });
    return () => {
      live = false;
    };
  }, [geo]);
  const location = here ?? (ownFix ? toUserLocation(ownFix) : null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || thinking) return;

    const userMsg: ChatMessage = { id: `u${Date.now()}`, sender: 'user', text };
    const history = messages;
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setThinking(true);
    setNotice(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      // no fix yet - ask once (this is also what triggers the permission prompt),
      // but never hold up an emergency reply for more than a few seconds
      let loc = location;
      if (!loc && geo?.status !== 'denied') {
        geo?.start();
        const r = await Promise.race([
          getCurrentCoordinates(4000),
          new Promise<{ coords?: undefined }>((ok) => window.setTimeout(() => ok({}), 5000)),
        ]);
        if (r.coords) loc = toUserLocation(r.coords);
      }

      const { assessment, degraded } = await askAegis(
        text,
        { resources, incidents, history, location: loc },
        ctrl.signal,
      );
      if (degraded) setNotice(degraded);

      const aiMsg: ChatMessage = {
        id: `a${Date.now()}`,
        sender: 'ai',
        text: assessment.reply,
        critical: assessment.critical && assessment.severity === 'critical',
        extracted: assessmentToFields(assessment),
        call: assessment.hospital
          ? {
              name: assessment.hospital.name,
              phone: assessment.hospital.phone,
              note: `Nearest hospital · ${assessment.hospital.km} km away`,
            }
          : undefined,
      };
      setMessages((p) => [...p, aiMsg]);
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        setNotice((err as Error)?.message || 'Request failed.');
        setMessages((p) => [
          ...p,
          {
            id: `a${Date.now()}`,
            sender: 'ai',
            text: 'I could not reach the AI service, so I cannot analyse this report right now. Your emergency is not submitted — use SOS if someone is in danger.',
          },
        ]);
      }
    } finally {
      setThinking(false);
      abortRef.current = null;
    }
  };

  const suggestions = ['Flood near my house', 'Need an ambulance', 'Blood bank near me', 'Need shelter'];

  return (
    <div className={`flex flex-col border ${dark ? 'bg-surface-darkCard border-white/10' : 'bg-surface-card border-earth-stone/30'}`} style={{ height: '100%', borderRadius: '2px' }}>
      {/* Header */}
      <div className={`flex items-center gap-3 border-b px-4 py-3 ${dark ? 'border-white/10' : 'border-earth-stone/30'}`}>
        <div className="flex h-9 w-9 items-center justify-center border bg-aegis-slate text-cream" style={{ borderRadius: '2px' }}>
          <Bot size={17} />
        </div>
        <div className="flex-1">
          <p className={`text-sm font-500 ${dark ? 'text-ink-light' : 'text-ink-primary'}`}>AEGIS AI Assistant</p>
          <p className={`flex items-center gap-1 text-xs ${dark ? 'text-ink-lightMuted' : 'text-ink-muted'}`}>
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: status.online ? accent.moss : accent.ochre }}
            />
            {status.label}
          </p>
          <p className={`mt-0.5 flex items-center gap-1 text-[11px] ${dark ? 'text-ink-lightMuted' : 'text-ink-muted'}`}>
            <MapPin size={11} />
            {location
              ? `${location.area ? `Near ${location.area}` : 'Location detected'} · ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
              : geo?.status === 'denied'
                ? 'Location blocked — allow it in the browser to share your position'
                : 'Detecting your location…'}
          </p>
        </div>
        <Sparkles size={15} className="text-earth-ochre" />
      </div>

      {/* Degraded-mode notice */}
      {notice && (
        <div className={`flex items-start gap-2 border-b px-4 py-2 text-xs ${dark ? 'border-white/10 bg-white/5 text-ink-lightMuted' : 'border-earth-stone/30 bg-earth-ochre/10 text-earth-ochre'}`} style={{ borderRadius: '2px' }}>
          <WifiOff size={13} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} dark={dark} />
        ))}
        {thinking && (
          <div className={`flex items-center gap-2 ${dark ? 'text-ink-lightMuted' : 'text-ink-muted'}`}>
            <div className="flex h-7 w-7 items-center justify-center border bg-aegis-slate text-cream shrink-0" style={{ borderRadius: '2px' }}>
              <Bot size={13} />
            </div>
            <div className="flex gap-1 items-center px-3 py-2.5 border border-earth-stone/30 bg-surface-raised" style={{ borderRadius: '2px' }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-aegis-slate animate-loading-dot"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={thinking}
              className={`text-xs border px-3 py-1.5 font-500 transition-colors disabled:opacity-50 ${dark ? 'border-white/15 text-ink-lightMuted hover:bg-white/5' : 'border-earth-stone/40 text-ink-muted hover:bg-earth-stone/15'}`}
              style={{ borderRadius: '2px' }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className={`border-t p-3 ${dark ? 'border-white/10' : 'border-earth-stone/30'}`}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) void send();
            }}
            placeholder="Describe the emergency..."
            className={`flex-1 border px-4 py-2.5 text-sm outline-none transition-colors ${dark ? 'bg-surface-darkSecondary text-ink-light placeholder-ink-lightMuted border-white/10 focus:border-aegis-slate' : 'bg-surface-page text-ink-primary placeholder-ink-muted border-earth-stone/40 focus:border-ink-primary'}`}
            style={{ borderRadius: '2px' }}
          />
          <button
            onClick={() => send()}
            disabled={thinking || !input.trim()}
            aria-label="Send message"
            className="flex h-10 w-10 items-center justify-center border border-cream bg-cream text-ink-inverse transition-colors hover:bg-earth-stone disabled:opacity-40"
            style={{ borderRadius: '2px' }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, dark }: { message: ChatMessage; dark?: boolean }) {
  if (message.sender === 'user') {
    return (
      <div className="flex justify-end animate-fade-in-up">
        <div className="max-w-[80%] border border-earth-stone/30 bg-surface-raised px-4 py-2.5 text-sm text-ink-primary" style={{ borderRadius: '2px' }}>
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 animate-fade-in-up">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center border bg-aegis-slate text-cream" style={{ borderRadius: '2px' }}>
        <Bot size={13} />
      </div>
      <div className={`max-w-[85%] border px-4 py-3 text-sm ${dark ? 'bg-surface-darkSecondary text-ink-light border-white/10' : 'bg-surface-card text-ink-primary border-earth-stone/30'}`} style={{ borderRadius: '2px' }}>
        {message.critical && (
          <div className="mb-2 -mx-4 -mt-3 flex items-center gap-1.5 border-l-2 border-status-critical bg-status-critical/5 px-4 py-1.5 text-xs font-500 uppercase text-earth-terracotta tracking-wider">
            <AlertTriangle size={12} /> Critical Emergency
          </div>
        )}
        <p className="leading-relaxed">{message.text}</p>
        {message.extracted && (
          <div className={`mt-3 space-y-1.5 border-t pt-2.5 ${dark ? 'border-white/10' : 'border-earth-stone/30'}`}>
            {message.extracted.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className={`font-500 ${dark ? 'text-ink-lightMuted' : 'text-ink-muted'}`}>{e.label}:</span>
                <span className={`font-500 ${dark ? 'text-ink-light' : 'text-ink-primary'}`}>{e.value}</span>
              </div>
            ))}
          </div>
        )}
        {message.call && (
          <a
            href={`tel:${message.call.phone.replace(/[^\d+]/g, '')}`}
            className="mt-3 flex items-center gap-3 border border-status-critical/40 bg-status-critical/10 px-3 py-2.5 transition-colors hover:bg-status-critical/20"
            style={{ borderRadius: '2px' }}
          >
            <Phone size={16} className="shrink-0 text-earth-terracotta" />
            <span className="min-w-0 flex-1">
              <span className={`block text-sm font-600 ${dark ? 'text-ink-light' : 'text-ink-primary'}`}>
                Call {message.call.name}
              </span>
              <span className={`block text-xs ${dark ? 'text-ink-lightMuted' : 'text-ink-muted'}`}>
                {message.call.phone} · {message.call.note}
              </span>
            </span>
          </a>
        )}
      </div>
    </div>
  );
}
