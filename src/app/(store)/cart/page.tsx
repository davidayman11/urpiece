"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { itemNames } from "@/lib/localize";
import { Txt, useLang, useT } from "@/components/store/TextsProvider";

export default function CartPage() {
  const { items, removeItem, updateQty, clearCart, total, packagingTotal } = useCartStore();
  const t = useT();
  const lang = useLang();
  const [freeMin, setFreeMin] = useState(0);
  useEffect(() => {
    fetch("/api/settings/payment")
      .then((r) => r.json())
      .then((d) => setFreeMin(d.freeShippingMin || 0))
      .catch(() => {});
  }, []);

  if (items.length === 0) {
    return (
      <div data-font-area="cart" className="pt-32 pb-24 min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-[#C4B07A] mb-6">
          <path d="M8 8h12l8 32h28l8-24H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="30" cy="56" r="4" fill="currentColor"/>
          <circle cx="48" cy="56" r="4" fill="currentColor"/>
        </svg>
        <h1 className="font-serif text-3xl text-[#1C1711] mb-3"><Txt k="cart.empty.title" /></h1>
        <p className="text-sm text-[#8A7E6E] mb-8"><Txt k="cart.empty.subtitle" /></p>
        <Link
          href="/shop"
          className="bg-[#A8975E] text-[#F5EFE2] px-8 py-3 text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors"
        >
          <Txt k="cart.empty.shopNow" />
        </Link>
      </div>
    );
  }

  const cartTotal = total();
  const packTotal = packagingTotal();

  return (
    <div data-font-area="cart" className="pt-28 pb-24 min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-end justify-between gap-4 mb-10">
          <h1 className="font-serif text-4xl font-light text-[#1C1711]"><Txt k="cart.title" /></h1>
          <button
            type="button"
            onClick={() => { if (window.confirm(t("cart.clearConfirm"))) clearCart(); }}
            className="text-xs tracking-wider text-[#8A7E6E] hover:text-red-600 underline underline-offset-4 transition-colors pb-1"
          >
            <Txt k="cart.clear" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative w-24 h-32 shrink-0 bg-[#EDE6D4] overflow-hidden">
                  {item.image ? (
                    <Image src={item.image} alt={itemNames(item, lang).product} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#C4B07A]">
                        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-lg text-[#1C1711]">{itemNames(item, lang).product}</h3>
                  {item.bundleId && (
                    <p className="text-[9px] tracking-[0.2em] uppercase text-[#A8975E] mt-0.5"><Txt k="cart.item.bundle" /></p>
                  )}
                  {item.variantName && (
                    <p className="text-xs text-[#8A7E6E] mt-0.5">{itemNames(item, lang).variant}</p>
                  )}
                  <p className="text-sm text-[#A8975E] mt-1">{formatPrice(item.price)}</p>
                  {item.packagingName && (
                    <p className="text-xs text-[#8A7E6E] mt-0.5">
                      <Txt k="cart.summary.packaging" />: {lang === "ar" && item.packagingNameAr ? item.packagingNameAr : item.packagingName}
                      {(item.packagingPrice || 0) > 0 && ` (+${formatPrice(item.packagingPrice || 0)})`}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center border border-[#CFC4A6] bg-white">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="w-8 h-8 text-sm text-[#5A5040] hover:text-[#1C1711]"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="w-8 h-8 text-sm text-[#5A5040] hover:text-[#1C1711]"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-[#8A7E6E] hover:text-red-600 transition-colors tracking-wider"
                    >
                      <Txt k="cart.item.remove" />
                    </button>
                  </div>
                </div>
                <div className="text-sm font-medium text-[#1C1711] shrink-0">
                  {formatPrice((item.price + (item.packagingPrice || 0)) * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div>
            <div className="bg-[#EDE6D4] p-6">
              <h2 className="font-serif text-xl text-[#1C1711] mb-6"><Txt k="cart.summary.title" /></h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#5A5040]"><Txt k="cart.summary.subtotal" /></span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                {packTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#5A5040]"><Txt k="cart.summary.packaging" /></span>
                    <span>{formatPrice(packTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#5A5040]"><Txt k="cart.summary.shipping" /></span>
                  <span className="text-[#8A7E6E]">
                    {freeMin > 0 && cartTotal >= freeMin ? <Txt k="cart.summary.free" /> : <Txt k="cart.summary.calculatedAtCheckout" />}
                  </span>
                </div>
                {freeMin > 0 && (
                  <p className={`text-xs ${cartTotal >= freeMin ? "text-green-700" : "text-[#8A7E6E]"}`}>
                    {cartTotal >= freeMin
                      ? <Txt k="cart.summary.freeUnlocked" />
                      : <Txt k="cart.summary.addMoreForFree" vars={{ amount: formatPrice(freeMin - cartTotal) }} />}
                  </p>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-[#E0D8C4] flex justify-between font-medium">
                <span><Txt k="cart.summary.total" /></span>
                <span className="text-[#A8975E]">{formatPrice(cartTotal + packTotal)}</span>
              </div>
              <Link
                href="/checkout"
                className="mt-6 block w-full bg-[#A8975E] text-[#F5EFE2] py-3.5 text-center text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors"
              >
                <Txt k="cart.summary.checkoutButton" />
              </Link>
              <Link
                href="/shop"
                className="mt-3 block w-full text-center text-xs tracking-wider text-[#8A7E6E] hover:text-[#5A5040] py-2"
              >
                <Txt k="cart.summary.continueShopping" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
