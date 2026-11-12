import type { TextDef } from "./types";

const L = "My orders";
const O = "Order page";

export const ordersTexts: TextDef[] = [
  // ---- My orders ----
  { key: "orders.list.metaTitle", group: L, label: "Orders list — browser tab title", default: "My orders" },
  { key: "orders.list.thanks", group: L, label: "Orders list — banner title after placing an order", default: "Thank you! Your order was placed." },
  { key: "orders.list.review", group: L, label: "Orders list — banner text", default: "We'll review your payment shortly." },
  { key: "orders.list.viewOrder", group: L, label: "Orders list — banner link ({number} = order number)", default: "View order {number}" },
  { key: "orders.list.eyebrow", group: L, label: "Orders list — small heading", default: "My account" },
  { key: "orders.list.title", group: L, label: "Orders list — heading", default: "My orders" },
  { key: "orders.list.empty", group: L, label: "Orders list — no orders yet", default: "You haven't placed any orders yet." },
  { key: "orders.list.startShopping", group: L, label: "Orders list — Start shopping button", default: "Start shopping" },
  { key: "orders.list.more", group: L, label: "Orders list — more items ({count} = number)", default: "+{count} more" },

  // ---- Order page ----
  { key: "orders.copy.copy", group: O, label: "Copy button — Copy", default: "Copy" },
  { key: "orders.copy.copied", group: O, label: "Copy button — after copying", default: "Copied ✓" },
  { key: "orders.detail.thanks", group: O, label: "Order page — small heading for a new order", default: "Thank you for your order" },
  { key: "orders.detail.yourOrder", group: O, label: "Order page — small heading", default: "Your order" },
  { key: "orders.detail.placed", group: O, label: "Order page — placed on ({date} = date)", default: "Placed {date}" },
  { key: "orders.detail.reason", group: O, label: "Order page — rejection reason ({reason})", default: "Reason: {reason}" },
  { key: "orders.detail.items", group: O, label: "Order page — Items heading", default: "Items" },
  { key: "orders.detail.bundle", group: O, label: "Order page — bundle label ({name} = bundle name)", default: "Bundle · {name}" },
  { key: "orders.detail.history", group: O, label: "Order page — Order history heading", default: "Order history" },
  { key: "orders.detail.summary", group: O, label: "Order page — Summary heading", default: "Summary" },
  { key: "orders.detail.subtotal", group: O, label: "Order page — Subtotal", default: "Subtotal" },
  { key: "orders.detail.discount", group: O, label: "Order page — Discount", default: "Discount" },
  { key: "orders.detail.shipping", group: O, label: "Order page — Shipping", default: "Shipping" },
  { key: "orders.detail.free", group: O, label: "Order page — free shipping", default: "Free" },
  { key: "orders.detail.total", group: O, label: "Order page — Total", default: "Total" },
  { key: "orders.detail.depositPaid", group: O, label: "Order page — Deposit paid", default: "Deposit paid" },
  { key: "orders.detail.dueOnDelivery", group: O, label: "Order page — Due on delivery", default: "Due on delivery" },
  { key: "orders.detail.shippingTo", group: O, label: "Order page — Shipping to heading", default: "Shipping to" },
  { key: "orders.detail.continue", group: O, label: "Order page — Continue shopping button", default: "Continue shopping" },
  { key: "orders.detail.allOrders", group: O, label: "Order page — All my orders button", default: "All my orders" },

  // Tracker steps
  { key: "orders.step.placed", group: O, label: "Tracker — step 1", default: "Order placed" },
  { key: "orders.step.paid", group: O, label: "Tracker — step 2", default: "Payment confirmed" },
  { key: "orders.step.preparing", group: O, label: "Tracker — step 3", default: "Preparing" },
  { key: "orders.step.shipped", group: O, label: "Tracker — step 4", default: "Shipped" },
  { key: "orders.step.delivered", group: O, label: "Tracker — step 5", default: "Delivered" },

  // Statuses
  { key: "orders.status.PENDING.label", group: O, label: "Status 'Pending' — name", default: "Order received" },
  { key: "orders.status.PENDING.desc", group: O, label: "Status 'Pending' — description", multiline: true, default: "Thank you! We've received your order and will review your payment shortly." },
  { key: "orders.status.AWAITING_PAYMENT.label", group: O, label: "Status 'Awaiting payment' — name", default: "Awaiting payment" },
  { key: "orders.status.AWAITING_PAYMENT.desc", group: O, label: "Status 'Awaiting payment' — description", multiline: true, default: "Please complete your InstaPay transfer and upload the screenshot." },
  { key: "orders.status.PAYMENT_UPLOADED.label", group: O, label: "Status 'Payment uploaded' — name", default: "Payment under review" },
  { key: "orders.status.PAYMENT_UPLOADED.desc", group: O, label: "Status 'Payment uploaded' — description", multiline: true, default: "We're verifying your payment. This usually takes a few hours." },
  { key: "orders.status.PAYMENT_REJECTED.label", group: O, label: "Status 'Payment rejected' — name", default: "Payment rejected" },
  { key: "orders.status.PAYMENT_REJECTED.desc", group: O, label: "Status 'Payment rejected' — description", multiline: true, default: "We couldn't verify your payment. Please contact us." },
  { key: "orders.status.CONFIRMED.label", group: O, label: "Status 'Confirmed' — name", default: "Confirmed" },
  { key: "orders.status.CONFIRMED.desc", group: O, label: "Status 'Confirmed' — description", multiline: true, default: "Your payment is confirmed and your order will be prepared soon." },
  { key: "orders.status.PROCESSING.label", group: O, label: "Status 'Processing' — name", default: "Preparing your order" },
  { key: "orders.status.PROCESSING.desc", group: O, label: "Status 'Processing' — description", multiline: true, default: "Your pieces are being packed with care." },
  { key: "orders.status.SHIPPED.label", group: O, label: "Status 'Shipped' — name", default: "On its way" },
  { key: "orders.status.SHIPPED.desc", group: O, label: "Status 'Shipped' — description", multiline: true, default: "Your order has been shipped." },
  { key: "orders.status.COMPLETED.label", group: O, label: "Status 'Completed' — name", default: "Delivered" },
  { key: "orders.status.COMPLETED.desc", group: O, label: "Status 'Completed' — description", multiline: true, default: "Your order has been delivered. Enjoy your piece!" },
  { key: "orders.status.CANCELLED.label", group: O, label: "Status 'Cancelled' — name", default: "Cancelled" },
  { key: "orders.status.CANCELLED.desc", group: O, label: "Status 'Cancelled' — description", multiline: true, default: "This order has been cancelled." },

  // Payment wording
  { key: "orders.pay.AWAITING_UPLOAD", group: O, label: "Payment status — waiting for screenshot", default: "Waiting for payment screenshot" },
  { key: "orders.pay.UPLOADED", group: O, label: "Payment status — screenshot received", default: "Screenshot received — under review" },
  { key: "orders.pay.VERIFIED", group: O, label: "Payment status — verified", default: "Payment verified" },
  { key: "orders.pay.REJECTED", group: O, label: "Payment status — rejected", default: "Payment rejected" },
  { key: "orders.track.eyebrow", group: "My orders", label: "Find my order (guests) — small heading", default: "Your order" },
  { key: "orders.track.title", group: "My orders", label: "Find my order (guests) — heading", default: "Find your order" },
  { key: "orders.track.subtitle", group: "My orders", label: "Find my order (guests) — sentence under the heading", default: "Enter your order number and the email you used at checkout." },
  { key: "orders.track.orderNumber", group: "My orders", label: "Find my order — order number label", default: "Order number" },
  { key: "orders.track.email", group: "My orders", label: "Find my order — email label", default: "Email" },
  { key: "orders.track.button", group: "My orders", label: "Find my order — button", default: "Find my order" },
  { key: "orders.track.loading", group: "My orders", label: "Find my order — button while searching", default: "Searching…" },
  { key: "orders.track.notFound", group: "My orders", label: "Find my order — nothing matched", default: "We couldn't find an order with those details. Check the order number and email." },
  { key: "orders.track.haveAccount", group: "My orders", label: "Find my order — text before the sign in link", default: "Have an account?" },
  { key: "orders.track.signIn", group: "My orders", label: "Find my order — sign in link", default: "Sign in to see all your orders" },
  { key: "orders.track.placeholder", group: "My orders", label: "Find my order — order number example", default: "UP-XXXX-XXXX" },
];
