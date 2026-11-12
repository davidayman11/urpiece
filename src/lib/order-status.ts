export interface StatusInfo {
  label: string;
  desc: string;
  /** Tailwind classes for a soft badge, kept close to the store palette */
  tone: string;
  /** Index on the 5-step tracker (null = not shown, e.g. cancelled) */
  step: number | null;
}

export const TRACKER_STEPS = ["Order placed", "Payment confirmed", "Preparing", "Shipped", "Delivered"];

export const ORDER_STATUS: Record<string, StatusInfo> = {
  PENDING: { label: "Order received", desc: "Thank you! We've received your order and will review your payment shortly.", tone: "bg-[#F3E9C6] text-[#7A6420]", step: 0 },
  AWAITING_PAYMENT: { label: "Awaiting payment", desc: "Please complete your InstaPay transfer and upload the screenshot.", tone: "bg-[#F6E3CF] text-[#8A5524]", step: 0 },
  PAYMENT_UPLOADED: { label: "Payment under review", desc: "We're verifying your payment. This usually takes a few hours.", tone: "bg-[#DDE7F3] text-[#2F5483]", step: 0 },
  PAYMENT_REJECTED: { label: "Payment rejected", desc: "We couldn't verify your payment. Please contact us.", tone: "bg-[#F5D9D5] text-[#9A3328]", step: 0 },
  CONFIRMED: { label: "Confirmed", desc: "Your payment is confirmed and your order will be prepared soon.", tone: "bg-[#DCEBDD] text-[#2F6B3A]", step: 1 },
  PROCESSING: { label: "Preparing your order", desc: "Your pieces are being packed with care.", tone: "bg-[#E6DEF1] text-[#5B3F8A]", step: 2 },
  SHIPPED: { label: "On its way", desc: "Your order has been shipped.", tone: "bg-[#DCE3F5] text-[#34498F]", step: 3 },
  COMPLETED: { label: "Delivered", desc: "Your order has been delivered. Enjoy your piece!", tone: "bg-[#D8EEE2] text-[#22663F]", step: 4 },
  CANCELLED: { label: "Cancelled", desc: "This order has been cancelled.", tone: "bg-[#E8E4DC] text-[#5A5040]", step: null },
};

export const PAYMENT_STATUS: Record<string, string> = {
  AWAITING_UPLOAD: "Waiting for payment screenshot",
  UPLOADED: "Screenshot received — under review",
  VERIFIED: "Payment verified",
  REJECTED: "Payment rejected",
};

export const statusInfo = (s: string): StatusInfo =>
  ORDER_STATUS[s] || { label: s, desc: "", tone: "bg-[#E8E4DC] text-[#5A5040]", step: null };
