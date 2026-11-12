export function parseDepositRule(b: Record<string, unknown>) {
  const type = b.type === "PERCENT" ? "PERCENT" : "FIXED";
  const value = Number(b.value);
  const minAmount = Math.max(0, Number(b.minAmount) || 0);
  const maxRaw = b.maxAmount === "" || b.maxAmount == null ? null : Number(b.maxAmount);
  if (!Number.isFinite(value) || value <= 0) return { error: "Enter the deposit amount" };
  if (type === "PERCENT" && value > 100) return { error: "A percentage can't be more than 100" };
  if (maxRaw !== null && (!Number.isFinite(maxRaw) || maxRaw <= minAmount)) {
    return { error: "\"Up to\" must be higher than \"From\" (or leave it empty for no limit)" };
  }
  return { data: { type, value, minAmount, maxAmount: maxRaw, isActive: b.isActive !== false } };
}
