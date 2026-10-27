"use server";

import { translateToBangla } from "@/lib/translate";

/**
 * Server action backing the `<AutoTranslate>` layer.
 *
 * The visitor's browser ships the English strings it can see; the server
 * translates them (cache-backed) and returns a lookup. Guarded so a compromised
 * client cannot turn this into an unbounded translation proxy.
 */

const MAX_TEXTS = 400;
const MAX_TEXT_LENGTH = 15000;

export async function translateTextsAction(texts: string[]): Promise<Record<string, string>> {
  if (!Array.isArray(texts)) return {};

  const clean = texts
    .filter((t): t is string => typeof t === "string")
    .slice(0, MAX_TEXTS)
    .map((t) => (t.length > MAX_TEXT_LENGTH ? t.slice(0, MAX_TEXT_LENGTH) : t))
    .filter((t) => t.trim().length > 0);

  if (clean.length === 0) return {};

  try {
    return await translateToBangla(clean);
  } catch {
    return {};
  }
}
