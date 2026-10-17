/**
 * Server-only English → Bangla translation.
 *
 * Uses the same public endpoint the Google Translate widget uses — no API key,
 * no extra dependency. Results are memoised in a module-level cache so a page is
 * translated once per server process instead of on every request.
 *
 * Batching: the endpoint accepts a single `q`, but multi-line input comes back
 * line-for-line, so we join a batch with "\n" and split the result. Batching is
 * bounded by URL length, not by a fixed count.
 */

const ENDPOINT = "https://translate.googleapis.com/translate_a/single";

const MAX_CACHE_ENTRIES = 8000;
const MAX_BATCH_CHARS = 1400;
const MAX_CONCURRENCY = 6;
const FETCH_TIMEOUT_MS = 10000;

const cache = new Map<string, string>();

function normalizeCore(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function cacheGet(key: string): string | undefined {
  const value = cache.get(key);
  if (value === undefined) return undefined;
  cache.delete(key);
  cache.set(key, value);
  return value;
}

function cacheSet(key: string, value: string): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, value);
}

async function fetchWithTimeout(text: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const url = `${ENDPOINT}?client=gtx&sl=en&tl=bn&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`translate http ${res.status}`);
    const json: unknown = await res.json();
    const segments = Array.isArray(json) && Array.isArray((json as unknown[])[0])
      ? ((json as unknown[])[0] as unknown[])
      : [];
    return segments
      .map((seg) => (Array.isArray(seg) ? String(seg[0] ?? "") : ""))
      .join("");
  } finally {
    clearTimeout(timer);
  }
}

async function fetchTranslation(text: string): Promise<string> {
  return fetchWithTimeout(text);
}

/** Translate a batch of single-line strings in one request. */
async function translateChunk(texts: string[]): Promise<string[]> {
  if (texts.length === 1) return [await fetchTranslation(texts[0])];

  const joined = texts.join("\n");
  const output = await fetchTranslation(joined);
  const lines = output.split("\n");

  if (lines.length === texts.length) return lines;

  const results: string[] = [];
  for (const text of texts) results.push(await fetchTranslation(text));
  return results;
}

export async function translateToBangla(texts: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const misses: string[] = [];
  const seen = new Set<string>();

  for (const raw of texts) {
    if (typeof raw !== "string") continue;
    const key = normalizeCore(raw);
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const cached = cacheGet(key);
    if (cached !== undefined) {
      result[key] = cached;
      continue;
    }
    misses.push(key);
  }

  const batchable = misses.filter((t) => !t.includes("\n") && t.length <= 1000);
  const solo = misses.filter((t) => t.includes("\n") || t.length > 1000);

  const chunks: string[][] = [];
  let current: string[] = [];
  let currentLength = 0;
  for (const text of batchable) {
    const cost = text.length + 1;
    if (current.length > 0 && currentLength + cost > MAX_BATCH_CHARS) {
      chunks.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(text);
    currentLength += cost;
  }
  if (current.length > 0) chunks.push(current);

  for (const text of solo) {
    chunks.push([text]);
  }

  let next = 0;
  const worker = async () => {
    while (next < chunks.length) {
      const chunk = chunks[next++];
      try {
        const translated = await translateChunk(chunk);
        chunk.forEach((source, index) => {
          const value = translated[index];
          if (value) {
            result[source] = value;
            cacheSet(source, value);
          }
        });
      } catch {
        // Leave this chunk in English; a later request can retry.
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(MAX_CONCURRENCY, Math.max(1, chunks.length)) }, worker),
  );

  return result;
}
