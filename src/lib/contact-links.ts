/**
 * Contact links shown on the Contact page (Admin > Pages > Contact).
 * The admin picks a type and types a handle, number or address; this builds the real link.
 */
export interface ContactLink { type: string; value: string; label: string; label_ar: string }

export const LINK_TYPES: { type: string; name: string; placeholder: string; icon: string }[] = [
  { type: "whatsapp", name: "WhatsApp", placeholder: "01012345678 (phone number)", icon: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>' },
  { type: "phone", name: "Phone call", placeholder: "01012345678", icon: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>' },
  { type: "email", name: "Email", placeholder: "hello@urpiece.com", icon: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>' },
  { type: "instagram", name: "Instagram", placeholder: "@urpiece or the profile link", icon: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>' },
  { type: "facebook", name: "Facebook", placeholder: "page name or the page link", icon: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>' },
  { type: "tiktok", name: "TikTok", placeholder: "@urpiece or the profile link", icon: '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>' },
  { type: "snapchat", name: "Snapchat", placeholder: "username or the profile link", icon: '<path d="M12 3c3 0 5 2.2 5 5v2l2 1-2 1c.5 1.5 1.5 2.5 3 3-1 .8-2.5 1-3.5 1.2-.4.7-1.2 1.3-2.5 1.3h-4c-1.3 0-2.1-.6-2.5-1.3C6.5 17.5 5 17.3 4 16.5c1.5-.5 2.5-1.5 3-3l-2-1 2-1V8c0-2.8 2-5 5-5z"/>' },
  { type: "telegram", name: "Telegram", placeholder: "@username or the link", icon: '<path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>' },
  { type: "x", name: "X (Twitter)", placeholder: "@urpiece or the profile link", icon: '<path d="M4 4l16 16M20 4L4 20"/>' },
  { type: "youtube", name: "YouTube", placeholder: "the channel link", icon: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>' },
  { type: "pinterest", name: "Pinterest", placeholder: "username or the profile link", icon: '<circle cx="12" cy="12" r="10"/><path d="M10 21l2-9"/><path d="M9 11a3 3 0 1 1 5 2"/>' },
  { type: "linkedin", name: "LinkedIn", placeholder: "the profile link", icon: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>' },
  { type: "website", name: "Website / other link", placeholder: "https://...", icon: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' },
];

export const typeInfo = (type: string) => LINK_TYPES.find((t) => t.type === type) ?? LINK_TYPES[LINK_TYPES.length - 1];

export function parseContactLinks(raw?: string): ContactLink[] {
  try {
    const v = JSON.parse(raw || "[]");
    if (!Array.isArray(v)) return [];
    return v
      .filter((x) => x && typeof x === "object" && typeof x.value === "string" && x.value.trim())
      .map((x) => ({ type: String(x.type || "website"), value: String(x.value).trim(), label: String(x.label || ""), label_ar: String(x.label_ar || "") }));
  } catch { return []; }
}

const handle = (v: string) => v.replace(/^@/, "").replace(/^\/+|\/+$/g, "");
const isUrl = (v: string) => /^https?:\/\//i.test(v);
const withProtocol = (v: string) => (isUrl(v) ? v : /^[\w-]+(\.[\w-]+)+(\/|$)/.test(v) ? `https://${v}` : "");

/** Egyptian-friendly phone digits: 01012345678 -> 201012345678 */
function waDigits(p: string) {
  let d = p.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "20" + d.slice(1);
  else if (!d.startsWith("20") && d.length <= 11) d = "20" + d;
  return d;
}

/** The real link for a type + what the admin typed. Empty string when it can't be built. */
export function linkHref(type: string, value: string): string {
  const v = value.trim();
  if (!v) return "";
  switch (type) {
    case "whatsapp": { const d = waDigits(v); return d ? `https://wa.me/${d}` : ""; }
    case "phone": { const d = v.replace(/[^\d+]/g, ""); return d ? `tel:${d}` : ""; }
    case "email": return v.includes("@") ? `mailto:${v}` : "";
    case "instagram": return isUrl(v) ? v : `https://instagram.com/${handle(v)}`;
    case "facebook": return isUrl(v) ? v : `https://facebook.com/${handle(v)}`;
    case "tiktok": return isUrl(v) ? v : `https://tiktok.com/@${handle(v)}`;
    case "snapchat": return isUrl(v) ? v : `https://snapchat.com/add/${handle(v)}`;
    case "telegram": return isUrl(v) ? v : `https://t.me/${handle(v)}`;
    case "x": return isUrl(v) ? v : `https://x.com/${handle(v)}`;
    case "pinterest": return isUrl(v) ? v : `https://pinterest.com/${handle(v)}`;
    case "youtube":
    case "linkedin":
    case "website":
    default: return withProtocol(v);
  }
}
