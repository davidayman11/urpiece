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
