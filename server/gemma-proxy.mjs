#!/usr/bin/env node

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PORT = Number(process.env.PORT || 8787);
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

async function loadEnvFile() {
  try {
    const raw = await readFile(join(ROOT, '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i.exec(line);
      if (!m) continue;
      const key = m[1];
      const value = m[2].replace(/^["']|["']$/g, '');
      if (process.env[key] === undefined && value) process.env[key] = value;
    }
  } catch {
  }
}

await loadEnvFile();

const UPSTREAM = (process.env.GEMMA_BASE_URL || process.env.VITE_GEMMA_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
const KEY = process.env.GEMMA_API_KEY || process.env.VITE_GEMMA_API_KEY || '';
const MODEL = process.env.GEMMA_MODEL || process.env.VITE_GEMMA_MODEL || 'google/gemma-4-31b-it';

// the VITE_ names are accepted too, but nothing in src/ reads them, so the
// key still never ends up in the browser bundle
const env = (name) => process.env[name] || process.env[`VITE_${name}`] || '';

// accepts https://api.textbee.dev or https://api.textbee.dev/api/v1
const TEXTBEE_BASE = (() => {
  const raw = (env('TEXTBEE_BASE_URL') || 'https://api.textbee.dev').replace(/\/+$/, '');
  return /\/api\/v\d+$/.test(raw) ? raw : `${raw}/api/v1`;
})();
const TEXTBEE_KEY = env('TEXTBEE_API_KEY');
const TEXTBEE_DEVICE = env('TEXTBEE_DEVICE_ID');
// recipients are pinned here so the browser can't text arbitrary numbers
const SMS_TO = (env('SOS_SMS_RECIPIENTS') || env('TEXTBEE_TO_NUMBER'))
  .split(',')
  .map((s) => s.replace(/[\s()-]/g, ''))
  .filter(Boolean);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function send(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS, ...extraHeaders });
  res.end(JSON.stringify(payload));
}

async function readJson(req, limit) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > limit) throw Object.assign(new Error('Payload too large'), { status: 413 });
  }
  try {
    return JSON.parse(body);
  } catch {
    throw Object.assign(new Error('Body must be JSON'), { status: 400 });
  }
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// the text is composed here from structured fields, never taken verbatim
// from the client, so the endpoint can't be used as an open SMS relay
function buildSosSms(p) {
  const lat = num(p.lat);
  const lng = num(p.lng);
  const acc = num(p.accuracy);
  const idx = num(p.updateIndex);
  const total = num(p.updateTotal);
  const head = idx && total ? `AEGIS SOS UPDATE ${idx}/${total}` : 'AEGIS SOS ALERT';
  const lines = [`${head}: citizen needs emergency help.`];
  if (lat !== null && lng !== null) {
    lines.push(`GPS ${lat.toFixed(5)}, ${lng.toFixed(5)}${acc !== null ? ` (±${Math.round(acc)}m)` : ''}`);
    lines.push(`Map: https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`);
  } else {
    lines.push('Location unavailable (permission not granted).');
  }
  lines.push(`Time: ${new Date().toLocaleString()}`);
  lines.push('Respond immediately.');
  return lines.join('\n');
}

async function handleSosSms(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: { message: 'Method not allowed' } });
  if (!TEXTBEE_KEY || SMS_TO.length === 0) {
    return send(res, 500, {
      error: { message: 'SMS not configured - set TEXTBEE_API_KEY and SOS_SMS_RECIPIENTS in .env and restart npm run proxy.' },
    });
  }

  let parsed;
  try {
    parsed = await readJson(req, 10_000);
  } catch (err) {
    return send(res, err.status || 400, { error: { message: err.message } });
  }

  const endpoint = TEXTBEE_DEVICE
    ? `${TEXTBEE_BASE}/gateway/devices/${encodeURIComponent(TEXTBEE_DEVICE)}/send-sms`
    : `${TEXTBEE_BASE}/gateway/send-sms`;

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': TEXTBEE_KEY },
      body: JSON.stringify({ recipients: SMS_TO, message: buildSosSms(parsed || {}) }),
      signal: AbortSignal.timeout(20_000),
    });
    const text = await upstream.text();
    if (!upstream.ok) {
      return send(res, 502, { error: { message: `TextBee responded ${upstream.status}: ${text.slice(0, 300)}` } });
    }
    send(res, 200, { ok: true, recipients: SMS_TO.length });
  } catch (err) {
    send(res, 502, { error: { message: `TextBee request failed: ${err.message}` } });
  }
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Liveness check for the UI - never returns the key.
  if (url.pathname === '/api/gemma/health') {
    return send(res, 200, {
      ok: Boolean(KEY) || UPSTREAM.startsWith('http://localhost'),
      upstream: UPSTREAM,
      model: MODEL,
      hasKey: Boolean(KEY),
    });
  }

  if (url.pathname === '/api/sms/health') {
    return send(res, 200, { ok: Boolean(TEXTBEE_KEY && SMS_TO.length), recipients: SMS_TO.length });
  }

  if (url.pathname === '/api/sms/sos') {
    return handleSosSms(req, res);
  }

  if (url.pathname !== '/api/gemma/chat/completions') {
    return send(res, 404, { error: { message: `Unknown route ${url.pathname}` } });
  }

  if (req.method !== 'POST') {
    return send(res, 405, { error: { message: 'Method not allowed' } });
  }

  if (!KEY && !UPSTREAM.startsWith('http://localhost')) {
    return send(res, 500, {
      error: { message: 'Server has no GEMMA_API_KEY. Add it to .env and restart npm run proxy.' },
    });
  }

  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) {
      return send(res, 413, { error: { message: 'Payload too large' } });
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return send(res, 400, { error: { message: 'Body must be JSON' } });
  }

  // Never trust a model id from the client - the operator pins it server-side.
  const payload = { ...parsed, model: parsed.model && process.env.ALLOW_CLIENT_MODEL ? parsed.model : MODEL };

  const headers = { 'Content-Type': 'application/json' };
  if (KEY) {
    headers.Authorization = `Bearer ${KEY}`;
    headers['HTTP-Referer'] = req.headers.origin || 'http://localhost:5173';
    headers['X-Title'] = 'AEGIS Disaster Response';
  }

  try {
    const upstream = await fetch(`${UPSTREAM}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60_000),
    });

    const text = await upstream.text();
    res.writeHead(upstream.status, { 'Content-Type': 'application/json', ...CORS });
    res.end(text);
  } catch (err) {
    send(res, 502, { error: { message: `Upstream request failed: ${err.message}` } });
  }
});

server.listen(PORT, () => {
  console.log(`\n  AEGIS Gemma proxy`);
  console.log(`  -> ${UPSTREAM}  (${MODEL})`);
  console.log(`  -> http://localhost:${PORT}/api/gemma/health`);
  console.log(`  key: ${KEY ? 'loaded from .env' : 'MISSING'}`);
  console.log(`  sms: ${TEXTBEE_KEY && SMS_TO.length ? `TextBee -> ${SMS_TO.length} recipient(s)` : 'not configured'}\n`);
});
