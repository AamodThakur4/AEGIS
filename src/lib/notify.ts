
const ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';

const config = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID ?? '',
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? '',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY ?? '',
  toEmail: import.meta.env.VITE_NOTIFY_EMAIL ?? '',
};

export function emailjsConfigured(): boolean {
  return Boolean(config.serviceId && config.templateId && config.publicKey);
}

export function notifyRecipient(): string | null {
  return config.toEmail || null;
}

export type NoticeTrigger = 'sos' | 'incident';

export interface EmergencyNotice {
  trigger: NoticeTrigger;
  severity: string;
  title: string;
  location: string;
  coordinates?: string | null;
  lat?: number | null;
  lng?: number | null;
  accuracy?: number | null;
  fixAt?: number | null;
  update?: { index: number; total: number } | null;
  details?: string;
  peopleAffected?: number | null;
  reportedBy?: string;
}

export type NoticeChannel = 'email' | 'sms';

export interface NoticeOutcome {
  id: string;
  at: number;
  channel: NoticeChannel;
  trigger: NoticeTrigger;
  subject: string;
  sent: boolean;
  detail: string;
  mailto?: string;
}

let noticeLog: NoticeOutcome[] = [];

export function getNotices(): NoticeOutcome[] {
  return noticeLog;
}

const listeners = new Set<(log: NoticeOutcome[]) => void>();

export function subscribeNotices(fn: (log: NoticeOutcome[]) => void): () => void {
  listeners.add(fn);
  fn(noticeLog);
  return () => {
    listeners.delete(fn);
  };
}

function record(outcome: NoticeOutcome): NoticeOutcome {
  noticeLog = [outcome, ...noticeLog].slice(0, 8);
  listeners.forEach((fn) => fn(noticeLog));
  return outcome;
}

export function mapsPinLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export function mapsDirectionsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

interface NoticeLinks {
  map: string | null;
  directions: string | null;
}

function buildLinks(n: EmergencyNotice): NoticeLinks {
  const usable =
    typeof n.lat === 'number' && typeof n.lng === 'number' &&
    Number.isFinite(n.lat) && Number.isFinite(n.lng);
  if (!usable) return { map: null, directions: null };
  const lat = n.lat as number;
  const lng = n.lng as number;
  return { map: mapsPinLink(lat, lng), directions: mapsDirectionsLink(lat, lng) };
}

function buildSubject(n: EmergencyNotice): string {
  const where = n.location && n.location !== 'Unknown' ? ` — ${n.location}` : '';
  if (n.trigger !== 'sos') {
    return `[AEGIS · CRITICAL] New critical incident: ${n.title}${where}`;
  }
  const seq = n.update ? ` · live update ${n.update.index}/${n.update.total}` : '';
  return `[AEGIS · SOS${seq}] Citizen requesting emergency assistance${where}`;
}

// used verbatim by the mailto draft, and by {{details}} in the template
function buildBody(n: EmergencyNotice, subject: string, links: NoticeLinks): string {
  const line = (k: string, v: string) => `${k.padEnd(11)}: ${v}`;
  return [
    subject,
    '='.repeat(52),
    line('Type', n.trigger === 'sos' ? 'Citizen SOS' : 'New critical incident'),
    line('Severity', n.severity),
    line('Title', n.title),
    line('Location', n.location || 'Unknown'),
    line('GPS', n.coordinates || 'Not available'),
    line('Accuracy', n.accuracy != null ? `±${n.accuracy} m` : 'Unknown'),
    line('Fix taken', n.fixAt ? new Date(n.fixAt).toLocaleString() : 'Unknown'),
    line('Map', links.map ?? 'No fix recorded'),
    line('Directions', links.directions ?? '—'),
    line('Affected', n.peopleAffected == null ? 'Unknown' : String(n.peopleAffected)),
    line('Reported', new Date().toLocaleString()),
    line('By', n.reportedBy || 'AEGIS'),
    '',
    'DETAILS',
    '-'.repeat(52),
    n.details || n.title,
    '',
    'IMMEDIATE RESPONSE REQUIRED - reply to the originating number.',
    'Sent by AEGIS Disaster Response.',
  ].join('\n');
}

// appended to {{details}} as well as sent as {{map_link}} — plenty of
// templates only ever render {{details}}, so one param wouldn't be enough
function detailsWithLinks(n: EmergencyNotice, links: NoticeLinks): string {
  const base = n.details || n.title;
  const extra = [
    links.map ? `LIVE MAP: ${links.map}` : null,
    links.directions ? `DIRECTIONS: ${links.directions}` : null,
  ].filter((s): s is string => s !== null);
  return extra.length > 0 ? `${base}\n\n${extra.join('\n')}` : base;
}

function buildMailto(subject: string, body: string): string {
  const to = config.toEmail;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// resolves with an outcome, never rejects
export async function sendEmergencyNotice(n: EmergencyNotice): Promise<NoticeOutcome> {
  const subject = buildSubject(n);
  const links = buildLinks(n);
  const body = buildBody(n, subject, links);
  const draft = buildMailto(subject, body);
  const recipient = notifyRecipient();
  const base = {
    channel: 'email' as const,
    trigger: n.trigger,
    subject,
    at: Date.now(),
  };

  if (!emailjsConfigured()) {
    return record({
      ...base,
      id: `notice-${Date.now()}`,
      sent: false,
      mailto: draft,
      detail: `Automatic send not configured — one-tap draft ready for ${recipient ?? 'your mail app'}`,
    });
  }

  const payload = {
    service_id: config.serviceId,
    template_id: config.templateId,
    user_id: config.publicKey,
    template_params: {
      to_email: config.toEmail,
      subject,
      trigger: n.trigger === 'sos' ? 'Citizen SOS' : 'New critical incident',
      title: n.title,
      severity: n.severity,
      location: n.location || 'Unknown',
      coordinates: n.coordinates || 'Not available',
      details: detailsWithLinks(n, links),
      map_link: links.map ?? '',
      directions_link: links.directions ?? '',
      accuracy_m: n.accuracy == null ? 'Unknown' : String(n.accuracy),
      fixed_at: n.fixAt ? new Date(n.fixAt).toISOString() : 'Unknown',
      // Ready-made plain text block, handy if the template just dumps it.
      email_body: body,
      people_affected: n.peopleAffected == null ? 'Unknown' : String(n.peopleAffected),
      reported_by: n.reportedBy || 'AEGIS',
      app: 'AEGIS Disaster Response',
      action_required: 'Immediate response required — reply to the originating number.',
      sent_at_local: new Date().toLocaleString(),
      sent_at_iso: new Date().toISOString(),
    },
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return record({
        ...base,
        id: `notice-${Date.now()}`,
        sent: false,
        mailto: draft,
        detail: text || `EmailJS responded ${res.status} — draft ready`,
      });
    }

    return record({
      ...base,
      id: `notice-${Date.now()}`,
      sent: true,
      detail: config.toEmail ? `Delivered to ${config.toEmail}` : 'Delivered',
    });
  } catch (err) {
    return record({
      ...base,
      id: `notice-${Date.now()}`,
      sent: false,
      mailto: draft,
      detail: `${err instanceof Error ? err.message : 'Network error reaching EmailJS'} — draft ready`,
    });
  }
}

// TextBee SMS goes through the local proxy (npm run proxy), which holds the
// API key and the recipient list and composes the text itself.
const SMS_ENDPOINT = '/api/sms/sos';

// resolves with an outcome, never rejects
export async function sendSosSms(n: EmergencyNotice): Promise<NoticeOutcome> {
  const subject = n.update
    ? `SOS SMS · live update ${n.update.index}/${n.update.total}`
    : 'SOS SMS to emergency contacts';
  const base = {
    channel: 'sms' as const,
    trigger: n.trigger,
    subject,
    at: Date.now(),
  };

  try {
    const res = await fetch(SMS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat: n.lat ?? null,
        lng: n.lng ?? null,
        accuracy: n.accuracy ?? null,
        updateIndex: n.update?.index ?? null,
        updateTotal: n.update?.total ?? null,
      }),
    });
    const data = (await res.json().catch(() => null)) as
      | { recipients?: number; error?: { message?: string } }
      | null;

    if (!res.ok) {
      return record({
        ...base,
        id: `sms-${Date.now()}`,
        sent: false,
        detail: data?.error?.message || `SMS proxy responded ${res.status} — is npm run proxy running?`,
      });
    }

    const count = data?.recipients ?? 0;
    return record({
      ...base,
      id: `sms-${Date.now()}`,
      sent: true,
      detail: `Sent via TextBee to ${count} contact${count === 1 ? '' : 's'}`,
    });
  } catch (err) {
    return record({
      ...base,
      id: `sms-${Date.now()}`,
      sent: false,
      detail: `${err instanceof Error ? err.message : 'Network error'} — SMS proxy unreachable`,
    });
  }
}
