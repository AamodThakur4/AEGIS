
import type { Resource, Incident, ChatMessage, DisasterType, Severity } from '@/types';
import type { ChatMessage as ApiMessage } from './gemma';
import { chat, gemmaReady, GemmaError } from './gemma';
import { distanceKm } from '@/data';

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number | null;
  area: string | null;
}

export interface NearestHospital {
  name: string;
  phone: string;
  km: number;
}

export interface AegisAssessment {
  reply: string;
  critical: boolean;
  disasterType: DisasterType;
  severity: Severity;
  location: string | null;
  peopleAffected: number | null;
  recommendedActions: string[];
  hospital?: NearestHospital | null;
}

const SCHEMA_HINT = `{
  "reply": "2-4 short sentences answering the citizen. Plain language, no markdown.",
  "critical": true|false,
  "disasterType": "flood" | "fire" | "earthquake" | "landslide" | "accident" | "medical",
  "severity": "critical" | "high" | "moderate" | "low",
  "location": "area name or null if not stated",
  "peopleAffected": number or null if not stated,
  "recommendedActions": ["action 1", "action 2"]
}`;

const SYSTEM_PROMPT = `You are AEGIS AI, the triage assistant inside AEGIS, a disaster response and relief platform used by citizens and emergency operators in Kathmandu, Nepal.

YOUR JOB
- Classify the reported emergency and extract the key facts.
- Give the person 2-4 concrete, immediately useful next steps.
- Reply in the same language the user wrote in. If they write Nepali, answer in Nepali.

HARD RULES
- NEVER say you have dispatched, alerted, notified, routed or rescued anyone. You cannot perform actions. You can only RECOMMEND. Use phrasing like "Recommended: move to higher ground" or "I recommend contacting X".
- NEVER invent a hospital, shelter, blood bank, phone number or distance that is not in the LIVE DATA below.
- If a value is unknown, return null. Do not guess a number to look helpful.
- If the user is in immediate physical danger, set critical to true and put the life-safety instruction first.
- Keep "reply" under 60 words. Put detail in recommendedActions.
- Do not add a "critical emergency" banner unless someone is actually hurt or in danger.
- If USER LOCATION is given and the user does not name a place, use the detected area (or coordinates) as "location" and do not ask them where they are.
- If the user asks for an ambulance, tell them to call 102 and give the NEAREST HOSPITAL name and tel exactly as listed in LIVE DATA.

LIVE DATA (only cite these)
${'{{SNAPSHOT}}'}

RESPOND WITH ONLY A JSON OBJECT MATCHING THIS SHAPE, NO MARKDOWN, NO PROSE OUTSIDE THE JSON:
${SCHEMA_HINT}`;

// live distance from the user when we have a fix, else the stored estimate
function kmFrom(r: Resource, loc: UserLocation | null): number | null {
  if (loc && typeof r.lat === 'number' && typeof r.lng === 'number') {
    return Math.round(distanceKm(loc, { lat: r.lat, lng: r.lng }) * 10) / 10;
  }
  return r.distanceKm ?? null;
}

export function nearestHospital(resources: Resource[], loc: UserLocation | null): NearestHospital | null {
  let best: NearestHospital | null = null;
  for (const r of resources) {
    if (r.type !== 'hospital' || !r.phone || r.status === 'offline') continue;
    const km = kmFrom(r, loc);
    if (km == null) continue;
    if (!best || km < best.km) best = { name: r.name, phone: r.phone, km };
  }
  return best;
}

const AMBULANCE_WORDS = /ambulance|ambulence|ambulans|एम्बुलेन्स|एम्बुलेंस|एम्बुलेन्/i;

export function wantsAmbulance(text: string): boolean {
  return AMBULANCE_WORDS.test(text);
}

function snapshot(resources: Resource[], incidents: Incident[], loc: UserLocation | null): string {
  const open = incidents.filter((i) => i.status !== 'resolved');
  const lines: string[] = [];

  lines.push('USER LOCATION (detected by GPS):');
  lines.push(
    loc
      ? `- ${loc.area ? `near ${loc.area}, ` : ''}${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}${loc.accuracy != null ? ` (±${loc.accuracy}m)` : ''}`
      : '- unknown (location permission not granted)',
  );

  const hospital = nearestHospital(resources, loc);
  lines.push('NEAREST HOSPITAL:');
  lines.push(hospital ? `- ${hospital.name} | tel=${hospital.phone} | ${hospital.km}km` : '- none with a phone number');

  lines.push('RESOURCES:');
  for (const r of resources) {
    const km = kmFrom(r, loc);
    const bits = [
      r.type,
      r.name,
      `status=${r.status}`,
      km != null ? `${km}km` : null,
      r.etaMin != null ? `${r.etaMin}min` : null,
      r.capacity ? `capacity=${r.capacity}` : null,
      r.phone ? `tel=${r.phone}` : null,
      `details=${r.details.join('; ')}`,
    ].filter(Boolean);
    lines.push(`- ${bits.join(' | ')}`);
  }

  lines.push('OPEN INCIDENTS:');
  if (open.length === 0) lines.push('- none');
  for (const i of open) {
    lines.push(
      `- ${i.type} | ${i.severity} | ${i.title} | ${i.location} | affected=${i.peopleAffected} | status=${i.status} | reported=${i.reportedAt}`,
    );
  }

  lines.push('CLOSED INCIDENTS (for history questions):');
  for (const i of incidents.filter((x) => x.status === 'resolved')) {
    lines.push(`- ${i.type} | ${i.title} | ${i.location} | affected=${i.peopleAffected} | ${i.reportedAt}`);
  }

  return lines.join('\n');
}

/** Extract JSON even if the model wrapped it in ``` fences or added stray text. */
function parseJson(raw: string): unknown | null {
  const stripped = raw.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(stripped.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

const DISASTER_TYPES: DisasterType[] = ['flood', 'fire', 'earthquake', 'landslide', 'accident', 'medical'];
const SEVERITIES: Severity[] = ['critical', 'high', 'moderate', 'low'];

function coerce(input: Record<string, unknown>, fallbackReply: string): AegisAssessment {
  const type = DISASTER_TYPES.includes(input.disasterType as DisasterType)
    ? (input.disasterType as DisasterType)
    : 'medical';
  const severity = SEVERITIES.includes(input.severity as Severity)
    ? (input.severity as Severity)
    : 'moderate';

  return {
    reply: typeof input.reply === 'string' && input.reply.trim() ? input.reply.trim() : fallbackReply,
    critical: input.critical === true,
    disasterType: type,
    severity,
    location: typeof input.location === 'string' && input.location.trim() ? input.location.trim() : null,
    peopleAffected:
      typeof input.peopleAffected === 'number' && Number.isFinite(input.peopleAffected)
        ? Math.max(0, Math.round(input.peopleAffected))
        : null,
    recommendedActions: Array.isArray(input.recommendedActions)
      ? input.recommendedActions.filter((a): a is string => typeof a === 'string').slice(0, 4)
      : [],
  };
}


function offlineAssessment(text: string): AegisAssessment {
  const lower = text.toLowerCase();
  const says = (...k: string[]) => k.some((w) => lower.includes(w));

  if (says('flood', 'water', 'river', 'drown', 'submerged')) {
    return {
      reply:
        'Offline analysis: this reads as a flood report. I could not reach the AI service, so this is a local rules-based check only.',
      critical: true,
      disasterType: 'flood',
      severity: 'critical',
      location: null,
      peopleAffected: null,
      recommendedActions: [
        'Move to higher ground immediately if water is rising.',
        'Avoid walking or driving through moving water.',
        'Reconnect your API key for a full AI assessment.',
      ],
    };
  }
  if (says('blood', 'donate')) {
    return {
      reply: 'Offline analysis: a blood request. Check the Resources page for live blood bank status.',
      critical: false,
      disasterType: 'medical',
      severity: 'high',
      location: null,
      peopleAffected: null,
      recommendedActions: ['Open Resources and filter to Blood Banks.', 'Call ahead before travelling.'],
    };
  }
  if (says('ambulance', 'accident', 'injured', 'unconscious', 'bleeding', 'chest')) {
    return {
      reply:
        'Offline analysis: a possible medical emergency. If anyone is unresponsive or having trouble breathing, call 102 (ambulance) now.',
      critical: true,
      disasterType: 'medical',
      severity: 'critical',
      location: null,
      peopleAffected: null,
      recommendedActions: [
        'Call 102 for an ambulance.',
        'Keep the person still and warm if it is safe to do so.',
        'Do not move someone with a suspected spine injury.',
      ],
    };
  }
  if (says('shelter', 'evacuate', 'displaced', 'homeless')) {
    return {
      reply: 'Offline analysis: a shelter or evacuation request. See the Resources page for shelters with free capacity.',
      critical: false,
      disasterType: 'flood',
      severity: 'high',
      location: null,
      peopleAffected: null,
      recommendedActions: ['Open Resources and filter to Shelters.', 'Take identity documents and medication.'],
    };
  }
  if (says('fire', 'smoke', 'burning')) {
    return {
      reply: 'Offline analysis: a possible fire. Call 101 for the fire brigade if it is not already burning.',
      critical: true,
      disasterType: 'fire',
      severity: 'critical',
      location: null,
      peopleAffected: null,
      recommendedActions: ['Call 101.', 'Get out low under the smoke.', 'Do not go back inside.'],
    };
  }

  return {
    reply:
      'Offline analysis: I could not reach the AI service, so I cannot classify this yet. Add VITE_GEMMA_API_KEY to enable Gemma, or use the quick actions below.',
    critical: false,
    disasterType: 'medical',
    severity: 'low',
    location: null,
    peopleAffected: null,
    recommendedActions: ['Use SOS for an immediate emergency.', 'Check the Alerts page for active warnings.'],
  };
}


export function toApiMessage(m: ChatMessage): ApiMessage {
  return { role: m.sender === 'user' ? 'user' : 'assistant', content: m.text };
}

export interface AskContext {
  resources: Resource[];
  incidents: Incident[];
  history: ChatMessage[];
  location?: UserLocation | null;
}

// things we know for certain shouldn't depend on the model remembering them
function finalize(a: AegisAssessment, userText: string, resources: Resource[], loc: UserLocation | null): AegisAssessment {
  const out = { ...a };
  if (!out.location && loc) {
    out.location = `${loc.area ? `Near ${loc.area} ` : ''}(${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}) — detected`;
  }
  if (wantsAmbulance(userText)) {
    const h = nearestHospital(resources, loc);
    out.hospital = h;
    if (h && !out.recommendedActions.some((x) => x.includes(h.phone))) {
      out.recommendedActions = [`Call ${h.name}: ${h.phone} (${h.km} km away)`, ...out.recommendedActions].slice(0, 4);
    }
  }
  return out;
}

export async function askAegis(
  userText: string,
  { resources, incidents, history, location = null }: AskContext,
  signal?: AbortSignal,
): Promise<{ assessment: AegisAssessment; degraded: string | null }> {
  const done = (assessment: AegisAssessment, degraded: string | null) => ({
    assessment: finalize(assessment, userText, resources, location),
    degraded,
  });

  if (!gemmaReady()) {
    return done(offlineAssessment(userText), 'AI service not configured');
  }

  const system = SYSTEM_PROMPT.replace('{{SNAPSHOT}}', snapshot(resources, incidents, location));

  const recent = history.slice(-8).map(toApiMessage);

  let raw: string;
  try {
    raw = await chat(
      [{ role: 'system', content: system }, ...recent, { role: 'user', content: userText }],
      { json: true, temperature: 0.3, maxTokens: 900, signal },
    );
  } catch (err) {
    if (err instanceof GemmaError && err.kind === 'no-key') {
      return done(offlineAssessment(userText), 'AI service not configured');
    }
    if ((err as Error)?.name === 'AbortError') throw err;
    const message = err instanceof GemmaError ? err.message : 'Unexpected AI error.';
    return done(offlineAssessment(userText), message);
  }

  const parsed = parseJson(raw) as Record<string, unknown> | null;
  if (!parsed || typeof parsed !== 'object') {
    return done({ ...offlineAssessment(userText), reply: raw.trim().slice(0, 600) }, 'Model returned unstructured output');
  }

  return done(coerce(parsed, offlineAssessment(userText).reply), null);
}

export function assessmentToFields(a: AegisAssessment): { label: string; value: string }[] {
  const clean = (s: string) => s.replace(/^\s*(?:I\s+)?(?:recommend(?:ed)?|suggestion|action)\b[\s:]*/i, '');

  const people =
    a.peopleAffected === null
      ? 'Unknown'
      : a.peopleAffected === 1
        ? '1 person'
        : `~${a.peopleAffected.toLocaleString()} people`;

  const fields: { label: string; value: string }[] = [
    { label: 'Type', value: a.disasterType },
    { label: 'Severity', value: a.severity },
    { label: 'Location', value: a.location ?? 'Not specified' },
    { label: 'People affected', value: people },
  ];
  for (const action of a.recommendedActions.slice(0, 2)) {
    fields.push({ label: 'Recommended', value: clean(action) });
  }
  return fields;
}
