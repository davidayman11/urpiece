export type FieldMode = "required" | "optional" | "hidden";
export type BuiltinField = "name" | "email" | "phone" | "address" | "city";
export type FieldModes = Record<BuiltinField, FieldMode>;

export const BUILTIN_FIELDS: { key: BuiltinField; label: string; canHide: boolean }[] = [
  { key: "name", label: "Full name", canHide: false },
  { key: "email", label: "Email", canHide: false },
  { key: "phone", label: "Phone number", canHide: true },
  { key: "address", label: "Street address", canHide: true },
  { key: "city", label: "City", canHide: true },
];

export const DEFAULT_MODES: FieldModes = {
  name: "required", email: "required", phone: "required", address: "required", city: "required",
};

/** Parse stored JSON. Missing = required. Legacy booleans (true/false) are supported. */
export function parseFieldModes(raw?: string | null): FieldModes {
  let v: Record<string, unknown> = {};
  try { v = JSON.parse(raw || "{}") || {}; } catch { /* defaults */ }
  const out = { ...DEFAULT_MODES };
  for (const { key, canHide } of BUILTIN_FIELDS) {
    const x = v[key];
    let m: FieldMode = "required";
    if (x === false || x === "optional") m = "optional";
    else if (x === "hidden") m = "hidden";
    if (m === "hidden" && !canHide) m = "optional";
    out[key] = m;
  }
  return out;
}

export type CustomFieldType = "text" | "textarea" | "select";

export interface CustomField {
  id: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  placeholder?: string;
  /** For type "select": the choices */
  options?: string[];
}

export function parseCustomFields(raw?: string | null): CustomField[] {
  try {
    const v = JSON.parse(raw || "[]");
    if (!Array.isArray(v)) return [];
    return v
      .filter((f) => f && typeof f.label === "string" && f.label.trim())
      .map((f) => ({
        id: String(f.id || f.label),
        label: String(f.label).trim(),
        type: (["text", "textarea", "select"].includes(f.type) ? f.type : "text") as CustomFieldType,
        required: !!f.required,
        placeholder: f.placeholder ? String(f.placeholder) : "",
        options: Array.isArray(f.options) ? f.options.map(String).filter(Boolean) : [],
      }));
  } catch {
    return [];
  }
}

/**
 * Display order of checkout fields. Keys: "name" | "email" | "phone" | "address" | "city"
 * | "c:<customFieldId>". Unknown keys are dropped; anything missing is appended
 * (built-ins in default order first, then custom fields).
 */
export function resolveFieldOrder(raw: string | string[] | null | undefined, customIds: string[]): string[] {
  let stored: unknown = raw;
  if (typeof raw === "string") {
    try { stored = JSON.parse(raw || "[]"); } catch { stored = []; }
  }
  const valid = new Set<string>([...BUILTIN_FIELDS.map((f) => f.key), ...customIds.map((id) => `c:${id}`)]);
  const out: string[] = [];
  for (const k of Array.isArray(stored) ? stored : []) {
    if (typeof k === "string" && valid.has(k) && !out.includes(k)) out.push(k);
  }
  for (const k of valid) if (!out.includes(k)) out.push(k);
  return out;
}
