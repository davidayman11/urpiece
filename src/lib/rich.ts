/**
 * Light formatting inside a text, written with simple markers (the admin never has to type them:
 * Site Text has buttons that add them around the selected words):
 *   **bold**   __underline__   ''italic''   ~~strikethrough~~
 *   sizes: ,,smaller,,   ^^larger^^   %%much larger%%   @@huge@@
 * A marker only counts when it has a matching partner, so a lone "**" stays as typed.
 * Nothing here ever produces HTML: the page builds ordinary React text/spans from the pieces.
 */

export type RichKind = "bold" | "underline" | "italic" | "strike" | "sm" | "lg" | "xl" | "xxl";
export const RICH_MARKERS: Record<RichKind, string> = { bold: "**", underline: "__", italic: "''", strike: "~~", sm: ",,", lg: "^^", xl: "%%", xxl: "@@" };
const KINDS = Object.keys(RICH_MARKERS) as RichKind[];
export type RichSize = "sm" | "lg" | "xl" | "xxl";
const SIZE_KINDS: RichSize[] = ["xxl", "xl", "lg", "sm"]; // if several are on at once, the biggest wins
/** em size of each per-word size (the same scale as the whole-text sizes in Site Text) */
export const RICH_SIZE_EM: Record<RichSize, string> = { sm: "0.85em", lg: "1.25em", xl: "1.6em", xxl: "2.2em" };

export interface RichSegment { text: string; bold?: boolean; underline?: boolean; italic?: boolean; strike?: boolean; size?: RichSize }

/**
 * Size chosen in Admin > Pages as CSS, or undefined for normal size.
 * A text's own size ("<field>_size") wins; otherwise the size set for the whole section ("fontSize") is used.
 */
export function fieldSizeStyle(content: Record<string, string> | undefined, field: string): { fontSize: string } | undefined {
  const v = (content?.[`${field}_size`] || content?.fontSize) as RichSize | undefined;
  return v && RICH_SIZE_EM[v] ? { fontSize: RICH_SIZE_EM[v] } : undefined;
}

export function parseRich(input: string): RichSegment[] {
  const out: RichSegment[] = [];
  const on = Object.fromEntries(KINDS.map((k) => [k, false])) as Record<RichKind, boolean>;
  let buf = "";
  const flush = () => {
    if (!buf) return;
    const seg: RichSegment = { text: buf };
    if (on.bold) seg.bold = true;
    if (on.underline) seg.underline = true;
    if (on.italic) seg.italic = true;
    if (on.strike) seg.strike = true;
    const size = SIZE_KINDS.find((k) => on[k]);
    if (size) seg.size = size;
    out.push(seg);
    buf = "";
  };
  let i = 0;
  while (i < input.length) {
    const kind = KINDS.find((k) => input.startsWith(RICH_MARKERS[k], i));
    if (kind) {
      const m = RICH_MARKERS[kind];
      // closing is always fine; opening needs a partner later in the text
      if (on[kind] || input.indexOf(m, i + m.length) !== -1) {
        flush();
        on[kind] = !on[kind];
        i += m.length;
        continue;
      }
    }
    buf += input[i];
    i++;
  }
  flush();
  return out;
}

/** The text without any markers (used wherever formatting cannot be shown: placeholders, tab titles, alerts...). */
export function stripRich(input: string): string {
  return parseRich(input).map((s) => s.text).join("");
}

/** True when the text contains at least one working marker pair. */
export function hasRich(input: string): boolean {
  const segs = parseRich(input);
  return segs.some((s) => s.bold || s.underline || s.italic || s.strike || s.size);
}

/**
 * Admin editor helper: add or remove a marker pair around the selected words.
 * If the selection is already wrapped in that marker, it is unwrapped (so the button toggles).
 */
export function toggleMarker(value: string, start: number, end: number, kind: RichKind): { value: string; start: number; end: number } {
  const m = RICH_MARKERS[kind];
  if (start === end) return { value, start, end }; // nothing selected
  const before = value.slice(0, start);
  const sel = value.slice(start, end);
  const after = value.slice(end);
  if (before.endsWith(m) && after.startsWith(m)) {
    return { value: before.slice(0, -m.length) + sel + after.slice(m.length), start: start - m.length, end: end - m.length };
  }
  if (sel.startsWith(m) && sel.endsWith(m) && sel.length >= m.length * 2) {
    const inner = sel.slice(m.length, -m.length);
    return { value: before + inner + after, start, end: start + inner.length };
  }
  return { value: before + m + sel + m + after, start: start + m.length, end: end + m.length };
}
