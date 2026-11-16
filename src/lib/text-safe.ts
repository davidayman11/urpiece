/**
 * Helpers that keep emoji and Arabic text intact.
 * JavaScript strings are UTF-16: an emoji such as 🛍️ is TWO code units (a surrogate pair).
 * Cutting a string with slice() in the middle of a pair leaves a lone surrogate, which later turns into
 * the replacement character (shown as a diamond with a question mark) in JSON, the database or a chat app.
 */

/** Replace any lone surrogate with nothing (valid text is returned unchanged) */
export function wellFormed(s: string): string {
  const w = (s as unknown as { toWellFormed?: () => string }).toWellFormed;
  if (typeof w === "function") return w.call(s).replaceAll("�", "");
  return s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "").replaceAll("�", "");
}

/** Cut to at most `max` characters (whole emoji, never half of one) */
export function truncateChars(s: string, max: number): string {
  const clean = wellFormed(s);
  const chars = Array.from(clean);
  return chars.length <= max ? clean : chars.slice(0, max).join("");
}

export const hasArabic = (s: string) => /[؀-ۿݐ-ݿ]/.test(s);

/** Left-to-right mark: keeps "Arabic name x2 - EGP 450" in the right order when a line starts with Arabic */
export const LRM = "‎";
