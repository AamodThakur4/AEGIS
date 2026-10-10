
export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  signal?: AbortSignal;
}

export class GemmaError extends Error {
  constructor(
    public readonly kind: 'no-key' | 'auth' | 'quota' | 'rate-limit' | 'not-found' | 'network' | 'server' | 'bad-shape',
    message: string,
  ) {
    super(message);
    this.name = 'GemmaError';
  }
}

const trimSlash = (s: string) => s.replace(/\/+$/, '');

const rawBaseUrl = trimSlash(import.meta.env.VITE_GEMMA_BASE_URL || 'https://openrouter.ai/api/v1');

export const gemma = {
  baseUrl: rawBaseUrl,
  apiKey: (import.meta.env.VITE_GEMMA_API_KEY || '').trim(),
  model: (import.meta.env.VITE_GEMMA_MODEL || 'google/gemma-4-31b-it').trim(),
  viaProxy: rawBaseUrl.startsWith('/'),
  local: /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/i.test(rawBaseUrl),
};

export function gemmaReady(): boolean {
  return gemma.viaProxy || gemma.local || gemma.apiKey.length > 0;
}

export function gemmaStatus(): { online: boolean; label: string } {
  if (gemma.viaProxy) return { online: true, label: 'Online · Gemma via AEGIS proxy' };
  if (gemma.local) return { online: true, label: `Online · Gemma (local ${gemma.model})` };
  if (gemma.apiKey) return { online: true, label: `Online · ${gemma.model} via OpenRouter` };
  return { online: false, label: 'Offline · local rules only' };
}

function friendlyError(status: number, body: string): GemmaError {
  const snippet = body.slice(0, 240);
  if (status === 401 || status === 403) {
    return new GemmaError('auth', 'API key rejected. Check VITE_GEMMA_API_KEY.');
  }
  if (status === 402) {
    return new GemmaError('quota', 'OpenRouter account has no credits. Add credits or switch to a :free model.');
  }
  if (status === 404) {
    return new GemmaError('not-found', `Model "${gemma.model}" not found on this endpoint. Check VITE_GEMMA_MODEL.`);
  }
  if (status === 429) {
    return new GemmaError('rate-limit', 'Rate limited by the model provider. Wait a moment and retry.');
  }
  if (status >= 500) {
    return new GemmaError('server', `Provider error ${status}. ${snippet}`);
  }
  return new GemmaError('server', `Request failed (${status}). ${snippet}`);
}

// throws GemmaError with a message that's safe to show the user
export async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  const { temperature = 0.4, maxTokens = 800, json = false, signal } = opts;

  if (!gemmaReady()) {
    throw new GemmaError('no-key', 'No API key configured.');
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!gemma.viaProxy && !gemma.local) {
    headers.Authorization = `Bearer ${gemma.apiKey}`;
    // OpenRouter attribution headers (recommended, not required).
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'AEGIS Disaster Response';
  }

  const baseBody = {
    model: gemma.model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  const attempt = async (body: unknown): Promise<Response> => {
    try {
      return await fetch(`${gemma.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal,
      });
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') throw err;
      throw new GemmaError(
        'network',
        `Could not reach ${gemma.baseUrl}. Check your connection and VITE_GEMMA_BASE_URL.`,
      );
    }
  };

  let res: Response;
  if (json) {
    res = await attempt({ ...baseBody, response_format: { type: 'json_object' } });
    if (res.status === 400) {
      // Provider does not support response_format -> fall back to prompt-only JSON.
      res = await attempt(baseBody);
    }
  } else {
    res = await attempt(baseBody);
  }

  if (!res.ok) throw friendlyError(res.status, await res.text().catch(() => ''));

  const data = (await res.json().catch(() => null)) as {
    choices?: { message?: { content?: string | null } }[];
  } | null;

  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string') {
    throw new GemmaError('bad-shape', 'The model returned an unexpected response shape.');
  }
  return text;
}
