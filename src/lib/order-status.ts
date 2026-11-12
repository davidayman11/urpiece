import type { TFunction } from "@/lib/texts/types";

export interface StatusInfo {
  label: string;
  desc: string;
  /** Tailwind classes for a soft badge, kept close to the store palette */
  tone: string;
  /** Index on the 5-step tracker (null = not shown, e.g. cancelled) */
  step: number | null;
}

export const trackerSteps = (t: TFunction): string[] => [
  t("orders.step.placed"),
  t("orders.step.paid"),
  t("orders.step.preparing"),
  t("orders.step.shipped"),
  t("orders.step.delivered"),
];

// Wording comes from the site texts (orders.status.<STATUS>.label / .desc); tone + step stay in code
const STATUS_META: Record<string, { tone: string; step: number | null }> = {
  PENDING: { tone: "bg-[#F3E9C6] text-[#7A6420]", step: 0 },
  AWAITING_PAYMENT: { tone: "bg-[#F6E3CF] text-[#8A5524]", step: 0 },
  PAYMENT_UPLOADED: { tone: "bg-[#DDE7F3] text-[#2F5483]", step: 0 },
  PAYMENT_REJECTED: { tone: "bg-[#F5D9D5] text-[#9A3328]", step: 0 },
  CONFIRMED: { tone: "bg-[#DCEBDD] text-[#2F6B3A]", step: 1 },
  PROCESSING: { tone: "bg-[#E6DEF1] text-[#5B3F8A]", step: 2 },
  SHIPPED: { tone: "bg-[#DCE3F5] text-[#34498F]", step: 3 },
  COMPLETED: { tone: "bg-[#D8EEE2] text-[#22663F]", step: 4 },
  CANCELLED: { tone: "bg-[#E8E4DC] text-[#5A5040]", step: null },
};

const PAYMENT_KEYS = ["AWAITING_UPLOAD", "UPLOADED", "VERIFIED", "REJECTED"];

export const paymentStatusLabel = (s: string, t: TFunction): string =>
  PAYMENT_KEYS.includes(s) ? t(`orders.pay.${s}`) : "";

export const statusInfo = (s: string, t: TFunction): StatusInfo => {
  const m = STATUS_META[s];
  if (m) return { label: t(`orders.status.${s}.label`), desc: t(`orders.status.${s}.desc`), ...m };
  return { label: s, desc: "", tone: "bg-[#E8E4DC] text-[#5A5040]", step: null };
};
