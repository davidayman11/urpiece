import { notFound, redirect } from "next/navigation";
import { getCustomer } from "@/lib/customer-auth";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { formatPrice, parseJson } from "@/lib/utils";
import { formatAddress } from "@/lib/checkout-fields";
import { statusInfo, TRACKER_STEPS, PAYMENT_STATUS } from "@/lib/order-status";
import CopyButton from "@/components/store/CopyButton";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orderNumber: string }>;
}

const card = "bg-[#FBF8F0] border border-[#E0D6BD] p-6";
const heading = "text-[10px] tracking-[0.3em] uppercase text-[#A8975E] mb-4";

export default async function OrderDetailPage({ params }: Props) {
  const { orderNumber } = await params;
  const customer = await getCustomer();
  if (!customer) redirect(`/account/login?next=${encodeURIComponent(`/orders/${orderNumber}`)}`);
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: { include: { product: { select: { images: true, slug: true } } } },
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });

  // Only the account that placed the order can see it
  if (!order || order.customerId !== customer.id) notFound();

  const st = statusInfo(order.status);
  const shipping = parseJson<Record<string, string>>(order.shippingAddress, {});
  const custom = Object.entries(parseJson<Record<string, string>>(order.customData, {}));
  const addressLine = formatAddress(shipping);
  const isNew = order.status === "PENDING";

  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          {isNew && (
            <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-[#A8975E] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5EFE2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </div>
          )}
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#A8975E] mb-2">
            {isNew ? "Thank you for your order" : "Your order"}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-light text-[#1C1711] break-all">{order.orderNumber}</h1>
          <div className="mt-3 flex items-center justify-center gap-3">
            <p className="text-xs text-[#8A7E6E]">Placed {format(new Date(order.createdAt), "d MMMM yyyy, HH:mm")}</p>
            <CopyButton text={order.orderNumber} />
          </div>
        </div>

        {/* Status + tracker */}
        <div className={`${card} mb-8`}>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className={`text-[11px] tracking-wider px-3 py-1 rounded-full ${st.tone}`}>{st.label}</span>
            <span className="text-xs text-[#8A7E6E]">{PAYMENT_STATUS[order.paymentStatus] || ""}</span>
          </div>
          <p className="text-sm text-[#5A5040]">{st.desc}</p>
          {order.rejectionReason && (
            <p className="mt-2 text-sm italic text-[#9A3328]">Reason: {order.rejectionReason}</p>
          )}

          {st.step !== null && (
            <ol className="mt-7 grid grid-cols-5 gap-1">
              {TRACKER_STEPS.map((label, i) => {
                const done = i <= (st.step as number) && !(i === 0 && order.status === "PAYMENT_REJECTED");
                return (
                  <li key={label} className="relative flex flex-col items-center text-center">
                    {i > 0 && (
                      <span className={`absolute top-[11px] right-1/2 w-full h-px ${i <= (st.step as number) ? "bg-[#A8975E]" : "bg-[#E0D8C4]"}`} />
                    )}
                    <span
                      className={`relative z-10 w-[23px] h-[23px] rounded-full flex items-center justify-center border ${
                        done ? "bg-[#A8975E] border-[#A8975E]" : "bg-[#F5EFE2] border-[#E0D8C4]"
                      }`}
                    >
                      {done && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F5EFE2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      )}
                    </span>
                    <span className={`mt-2 text-[10px] leading-tight ${done ? "text-[#1C1711]" : "text-[#A59C88]"}`}>{label}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Items */}
          <div className="md:col-span-3 space-y-8">
            <div className={card}>
              <h2 className={heading}>Items</h2>
              <div className="divide-y divide-[#EDE6D4]">
                {order.items.map((item) => {
                  const img = parseJson<string[]>(item.product?.images || "[]", [])[0];
                  return (
                    <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="relative w-16 h-20 shrink-0 bg-[#EDE6D4] overflow-hidden">
                        {img && <Image src={img} alt={item.productName} fill className="object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${item.product?.slug}`} className="font-serif text-base text-[#1C1711] hover:text-[#8A7A4A] transition-colors">
                          {item.productName}
                        </Link>
                        {item.variantName && <p className="text-xs text-[#8A7E6E] mt-0.5">{item.variantName}</p>}
                        <p className="text-xs text-[#8A7E6E] mt-1">
                          {formatPrice(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm text-[#1C1711] shrink-0">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {order.statusHistory.length > 0 && (
              <div className={card}>
                <h2 className={heading}>Order history</h2>
                <ul className="space-y-5">
                  {order.statusHistory.map((h, i) => (
                    <li key={h.id} className="flex gap-4">
                      <span className="flex flex-col items-center">
                        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 ${i === 0 ? "bg-[#A8975E]" : "bg-[#D6CEBC]"}`} />
                        {i < order.statusHistory.length - 1 && <span className="flex-1 w-px bg-[#E0D8C4] mt-1" />}
                      </span>
                      <div className="pb-1">
                        <p className="text-sm text-[#1C1711]">{statusInfo(h.status).label}</p>
                        {h.note && <p className="text-xs text-[#8A7E6E] mt-0.5">{h.note}</p>}
                        <p className="text-[11px] text-[#A59C88] mt-0.5">{format(new Date(h.createdAt), "d MMM yyyy, HH:mm")}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Summary + shipping */}
          <div className="md:col-span-2 space-y-8">
            <div className={card}>
              <h2 className={heading}>Summary</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#8A7E6E]">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount{order.promoCodeUsed ? ` (${order.promoCodeUsed})` : ""}</span>
                    <span>−{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#8A7E6E]">Shipping</span>
                  <span>{order.shippingFee > 0 ? formatPrice(order.shippingFee) : "Free"}</span>
                </div>
                <div className="flex justify-between font-medium pt-3 mt-1 border-t border-[#EDE6D4] text-base">
                  <span>Total</span>
                  <span className="text-[#A8975E]">{formatPrice(order.total)}</span>
                </div>
                {order.paymentType === "DEPOSIT" && (
                  <div className="pt-3 mt-1 border-t border-[#EDE6D4] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#8A7E6E]">Deposit paid</span>
                      <span>{formatPrice(order.amountDue)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Due on delivery</span>
                      <span className="text-[#A8975E]">{formatPrice(order.balanceDue)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={card}>
              <h2 className={heading}>Shipping to</h2>
              <div className="text-sm text-[#5A5040] space-y-1.5">
                <p className="text-[#1C1711]">{order.customerName}</p>
                {addressLine && <p>{addressLine}</p>}
                {order.customerPhone && <p>{order.customerPhone}</p>}
                {order.customerEmail && <p className="break-all">{order.customerEmail}</p>}
              </div>
              {custom.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#EDE6D4] space-y-2 text-sm">
                  {custom.map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[11px] text-[#8A7E6E]">{k}</p>
                      <p className="text-[#5A5040] whitespace-pre-wrap">{v}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Link href="/shop" className="block text-center bg-[#A8975E] text-[#F5EFE2] py-3 text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors">
                Continue shopping
              </Link>
              <Link href="/orders" className="block text-center border border-[#CFC4A6] bg-white/50 text-[#5A5040] py-3 text-xs tracking-widest uppercase hover:border-[#A8975E] transition-colors">
                All my orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
