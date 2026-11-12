export function parseRule(b: Record<string, unknown>) {
  const name = String(b.name || "").trim();
  const value = Number(b.value);
  const type = b.type === "FIXED" ? "FIXED" : "PERCENT";
  if (!name) return { error: "Give the discount a name" };
  if (!Number.isFinite(value) || value <= 0) return { error: "Enter a discount value" };
  if (type === "PERCENT" && value > 100) return { error: "Percent can't be more than 100" };
  return {
    data: {
      name,
      nameAr: String(b.nameAr || "").trim() || null,
      type,
      value,
      minAmount: Math.max(0, Number(b.minAmount) || 0),
      isActive: b.isActive !== false,
      startsAt: b.startsAt ? new Date(b.startsAt as string) : null,
      endsAt: b.endsAt ? new Date(b.endsAt as string) : null,
    },
  };
}

