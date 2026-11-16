/**
 * Helpers for the reminder message editor (admin > Carts).
 * The editor produces HTML. This file cleans it and converts it for each channel:
 *  - html: kept formatting (for "Copy formatted", paste into Gmail / Outlook)
 *  - WhatsApp: *bold* _italic_ ~strike~ (the only styles WhatsApp understands)
 *  - plain text: for a mailto: link (it cannot carry styles)
 */

const BLOCK = new Set(["p", "div", "h1", "h2", "h3", "li", "ul", "ol"]);

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const parse = (html: string) => new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body;

interface Look { bold: boolean; italic: boolean; underline: boolean; strike: boolean }

/** Styles an element adds (from its tag and from inline styles, so Word / Google Docs pastes work) */
function looks(el: HTMLElement): Look {
  const tag = el.tagName.toLowerCase();
  const st = el.style;
  const fw = st.fontWeight;
  const explicitNormal = fw === "normal" || fw === "400" || fw === "300" || fw === "lighter";
  const bold = (tag === "b" || tag === "strong" ? !explicitNormal : false) || fw === "bold" || fw === "bolder" || Number(fw) >= 600;
  const italic = tag === "i" || tag === "em" || st.fontStyle === "italic";
  const deco = `${st.textDecoration} ${st.textDecorationLine}`;
  return {
    bold,
    italic,
    underline: tag === "u" || deco.includes("underline"),
    strike: tag === "s" || tag === "strike" || tag === "del" || deco.includes("line-through"),
  };
}

const SKIP = new Set(["script", "style", "meta", "link", "head", "title", "noscript", "template"]);

function safeHref(h: string | null): string {
  const v = (h || "").trim();
  return /^(https?:|mailto:|tel:)/i.test(v) ? v : "";
}

/** Clean HTML: only simple formatting survives (bold, italic, underline, strike, lists, links, line breaks) */
export function sanitizeHtml(html: string): string {
  const walk = (node: Node): string => {
    if (node.nodeType === 3) return escapeHtml(node.textContent || "");
    if (node.nodeType !== 1) return "";
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (SKIP.has(tag)) return "";
    if (tag === "br") return "<br>";
    let inner = Array.from(el.childNodes).map(walk).join("");
    if (tag === "a") {
      const href = safeHref(el.getAttribute("href"));
      return href ? `<a href="${escapeHtml(href)}">${inner}</a>` : inner;
    }
    if (tag === "p" || tag === "div") return `<${tag}>${inner}</${tag}>`;
    if (tag === "h1" || tag === "h2" || tag === "h3") return `<p><b>${inner}</b></p>`;
    if (tag === "ul" || tag === "ol" || tag === "li") return `<${tag}>${inner}</${tag}>`;
    const l = looks(el);
    if (!inner) return "";
    if (l.strike) inner = `<s>${inner}</s>`;
    if (l.underline) inner = `<u>${inner}</u>`;
    if (l.italic) inner = `<i>${inner}</i>`;
    if (l.bold) inner = `<b>${inner}</b>`;
    return inner;
  };
  return Array.from(parse(html).childNodes).map(walk).join("");
}

/** Convert to text. With marks = true uses WhatsApp styling characters. */
function toText(html: string, marks: boolean): string {
  const walk = (node: Node): string => {
    if (node.nodeType === 3) return (node.textContent || "").replace(/ /g, " ");
    if (node.nodeType !== 1) return "";
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (SKIP.has(tag)) return "";
    if (tag === "br") return "\n";
    let inner = Array.from(el.childNodes).map(walk).join("");
    if (tag === "a") {
      const href = safeHref(el.getAttribute("href"));
      return href && href !== inner.trim() ? `${inner} (${href})` : inner;
    }
    if (tag === "li") return `• ${inner.trim()}\n`;
    if (tag === "ul" || tag === "ol") return `\n${inner}\n`;
    if (tag === "p" || tag === "h1" || tag === "h2" || tag === "h3") return `${inner}\n\n`;
    if (tag === "div") return `${inner}\n`;
    if (marks && inner.trim()) {
      const l = looks(el);
      // markers go against the words; the spaces stay outside
      const wrap = (mark: string) => {
        const m = inner.match(/^(\s*)([\s\S]*?)(\s*)$/);
        inner = m ? `${m[1]}${mark}${m[2]}${mark}${m[3]}` : inner;
      };
      if (l.strike) wrap("~");
      if (l.italic) wrap("_");
      if (l.bold) wrap("*");
    }
    return inner;
  };
  return Array.from(parse(html).childNodes).map(walk).join("").replace(/\n{3,}/g, "\n\n").trim();
}

export const toWhatsApp = (html: string) => toText(html, true);
export const toPlain = (html: string) => toText(html, false);

export interface CartFill {
  name: string;
  total: string;
  link: string;
  items: { text: string }[];
}

/** Put the customer's details into the template */
export function fillTemplate(html: string, f: CartFill): string {
  const list = `<ul>${f.items.map((i) => `<li>${escapeHtml(i.text)}</li>`).join("")}</ul>`;
  return html
    .replaceAll("{name}", escapeHtml(f.name))
    .replaceAll("{items}", list)
    .replaceAll("{total}", escapeHtml(f.total))
    .replaceAll("{link}", escapeHtml(f.link));
}
