import type { CSSProperties } from "react";
import { parseRich, type RichSegment } from "@/lib/rich";
import { formatText, type TextVars } from "@/lib/texts/types";

const segCss = (s: RichSegment): CSSProperties | undefined => {
  const css: CSSProperties = {};
  if (s.bold) css.fontWeight = 700;
  if (s.italic) css.fontStyle = "italic";
  const deco = [s.underline && "underline", s.strike && "line-through"].filter(Boolean).join(" ");
  if (deco) { css.textDecoration = deco; if (s.underline) css.textUnderlineOffset = "0.2em"; }
  return Object.keys(css).length ? css : undefined;
};

/**
 * Draws a text that may contain formatting markers (**bold** __underline__ ''italic'' ~~strike~~),
 * and wraps all of it in `style` (font / size / colour / ...) if given.
 * Plain text with no formatting is drawn as plain text: no extra tags.
 */
export default function RichText({ text, vars, style }: { text: string; vars?: TextVars; style?: CSSProperties }) {
  // {placeholders} are filled AFTER reading the markers, so a value containing ** can't change the look
  const nodes = parseRich(text).map((seg, i) => {
    const t = formatText(seg.text, vars);
    const css = segCss(seg);
    return css ? <span key={i} style={css}>{t}</span> : t;
  });
  const content = nodes.length === 1 ? nodes[0] : nodes;
  return style ? <span style={style}>{content}</span> : <>{content}</>;
}
