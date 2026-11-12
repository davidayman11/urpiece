"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function CartPage() {
  const { items, removeItem, updateQty, total } = useCartStore();
  const [freeMin, setFreeMin] = useState(0);
  useEffect(() => {
    fetch("/api/settings/payment")
      .then((r) => r.json())
      .then((d) => setFreeMin(d.freeShippingMin || 0))
      .catch(() => {});
  }, []);

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-[#C4B07A] mb-6">
          <path d="M8 8h12l8 32h28l8-24H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="30" cy="56" r="4" fill="currentColor"/>
          <circle cx="48" cy="56" r="4" fill="currentColor"/>
        </svg>
        <h1 className="font-serif text-3xl text-[#1C1711] mb-3">Your cart is empty</h1>
        <p className="text-sm text-[#8A7E6E] mb-8">Discover our curated pieces and find your glow.</p>
        <Link
          href="/shop"
          className="bg-[#A8975E] text-[#F5EFE2] px-8 py-3 text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  const cartTotal = total();

  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-serif text-4xl font-light text-[#1C1711] mb-10">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative w-24 h-32 shrink-0 bg-[#EDE6D4] overflow-hidden">
                  {item.image ? (
                    <Image src={item.image} alt={item.productName} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#C4B07A]">
                        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-lg text-[#1C1711]">{item.productName}</h3>
                  {item.variantName && (
                    <p className="text-xs text-[#8A7E6E] mt-0.5">{item.variantName}</p>
                  )}
                  <p className="text-sm text-[#A8975E] mt-1">{formatPrice(item.price)}</p>

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
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-sm font-medium text-[#1C1711] shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div>
            <div className="bg-[#EDE6D4] p-6">
              <h2 className="font-serif text-xl text-[#1C1711] mb-6">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#5A5040]">Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A5040]">Shipping</span>
                  <span className="text-[#8A7E6E]">
                    {freeMin > 0 && cartTotal >= freeMin ? "Free" : "Calculated at checkout"}
                  </span>
                </div>
                {freeMin > 0 && (
                  <p className={`text-xs ${cartTotal >= freeMin ? "text-green-700" : "text-[#8A7E6E]"}`}>
                    {cartTotal >= freeMin
                      ? "You've unlocked free shipping!"
                      : `Add ${formatPrice(freeMin - cartTotal)} more for free shipping`}
                  </p>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-[#E0D8C4] flex justify-between font-medium">
                <span>Total</span>
                <span className="text-[#A8975E]">{formatPrice(cartTotal)}</span>
              </div>
              <Link
                href="/checkout"
                className="mt-6 block w-full bg-[#A8975E] text-[#F5EFE2] py-3.5 text-center text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors"
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/shop"
                className="mt-3 block w-full text-center text-xs tracking-wider text-[#8A7E6E] hover:text-[#5A5040] py-2"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
