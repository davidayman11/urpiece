export type RequiredFields = { phone: boolean; address: boolean; city: boolean };

export const DEFAULT_REQUIRED: RequiredFields = { phone: true, address: true, city: true };

/** Parse the stored JSON; anything missing defaults to required. */
export function parseRequired(raw?: string | null): RequiredFields {
  try {
    const v = JSON.parse(raw || "{}");
    return {
      phone: v.phone !== false,
      address: v.address !== false,
      city: v.city !== false,
    };
  } catch {
    return { ...DEFAULT_REQUIRED };
  }
}
