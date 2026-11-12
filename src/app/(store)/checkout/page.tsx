"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface PaymentSettings {
  instapayId?: string;
  instapayPhone?: string;
  instructions?: string;
  extraFields?: { id: string; label: string; value: string; type: "text" | "link" | "qr" }[];
}

type CheckoutStep = "details" | "payment" | "confirm";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore();
  const router = useRouter();
  const [step, setStep] = useState<CheckoutStep>("details");
  const [paySettings, setPaySettings] = useState<PaymentSettings>({});
  const [loading, setLoading] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoData, setPromoData] = useState<{ discount: number; code: string } | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [zones, setZones] = useState<{ city: string; price: number }[]>([]);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", city: "",
  });

  useEffect(() => {
    if (items.length === 0) router.push("/cart");
    fetch("/api/settings/payment").then((r) => r.json()).then(setPaySettings).catch(() => {});
    fetch("/api/shipping").then((r) => r.json()).then((z) => Array.isArray(z) && setZones(z)).catch(() => {});
  }, [items, router]);

  const cartTotal = total();
  const discount = promoData?.discount || 0;
  const shippingFee = zones.find((z) => z.city === form.city)?.price ?? 0;
  const finalTotal = Math.max(0, cartTotal - discount) + shippingFee;

  const applyPromo = async () => {
    setPromoError("");
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput, total: cartTotal }),
      });
      const data = await res.json();
      if (!res.ok) { setPromoError(data.error || "Invalid code"); return; }
      setPromoData({ discount: data.discount, code: data.code });
    } catch {
      setPromoError("Failed to apply code");
    }
  };

  const submitOrder = async () => {
    if (!screenshotFile) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("screenshot", screenshotFile);
      fd.append("items", JSON.stringify(items));
      fd.append("discount", String(discount));
      if (promoData) fd.append("promoCode", promoData.code);

      const res = await fetch("/api/orders", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      clearCart();
      router.push(`/orders/${data.orderNumber}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Order failed");
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (field: string): string => {
    if (!touched[field]) return "";
    const v = form[field as keyof typeof form].trim();
    if (!v) return field === "city" ? "Please select your city" : "This field is required";
    if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address";
    if (field === "phone" && !/^\+?[0-9\s-]{10,15}$/.test(v)) return "Enter a valid phone number";
    return "";
  };

  const inputCls =
    "w-full border bg-transparent px-4 py-3 text-sm text-[#1C1711] placeholder:text-[#C4B8A0] outline-none transition-colors";

  const textFields = [
    { field: "name", label: "Full Name", type: "text", placeholder: "Your full name", autoComplete: "name", inputMode: undefined, full: true },
    { field: "email", label: "Email", type: "email", placeholder: "you@example.com", autoComplete: "email", inputMode: "email" as const, full: false },
    { field: "phone", label: "Phone Number", type: "tel", placeholder: "01XXXXXXXXX", autoComplete: "tel", inputMode: "tel" as const, full: false },
    { field: "address", label: "Street Address", type: "text", placeholder: "Street, building, apartment", autoComplete: "street-address", inputMode: undefined, full: true },
  ] as const;

  if (items.length === 0) return null;

  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-serif text-4xl font-light text-[#1C1711] mb-10">Checkout</h1>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-10 text-xs tracking-widest uppercase">
          {(["details", "payment", "confirm"] as CheckoutStep[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-[#EDE6D4]" />}
              <span className={step === s ? "text-[#A8975E]" : "text-[#C4B07A]"}>{s}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {/* Step 1: Details */}
            {step === "details" && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-serif text-2xl text-[#1C1711]">Shipping Details</h2>
                  <p className="text-xs text-[#8A7E6E] mt-1">Where should we deliver your order?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {textFields.map(({ field, label, type, placeholder, autoComplete, inputMode, full }) => (
                    <div key={field} className={full ? "sm:col-span-2" : ""}>
                      <label htmlFor={field} className="text-xs tracking-widest uppercase text-[#5A5040] mb-1.5 block">
                        {label} <span className="text-[#A8975E]">*</span>
                      </label>
                      <input
                        id={field}
                        type={type}
                        inputMode={inputMode}
                        autoComplete={autoComplete}
                        placeholder={placeholder}
                        value={form[field]}
                        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                        onBlur={() => setTouched((t) => ({ ...t, [field]: true }))}
                        aria-invalid={!!fieldError(field)}
                        className={`${inputCls} ${fieldError(field) ? "border-red-400" : "border-[#EDE6D4] focus:border-[#A8975E]"}`}
                      />
                      {fieldError(field) && <p className="text-[11px] text-red-600 mt-1">{fieldError(field)}</p>}
                    </div>
                  ))}

                  <div className="sm:col-span-2">
                    <label htmlFor="city" className="text-xs tracking-widest uppercase text-[#5A5040] mb-1.5 block">
                      City <span className="text-[#A8975E]">*</span>
                    </label>
                    {zones.length > 0 ? (
                      <div className="relative">
                        <select
                          id="city"
                          value={form.city}
                          autoComplete="address-level2"
                          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                          onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                          className={`${inputCls} appearance-none pr-10 cursor-pointer ${fieldError("city") ? "border-red-400" : "border-[#EDE6D4] focus:border-[#A8975E]"}`}
                        >
                          <option value="">Select your city</option>
                          {zones.map((z) => (
                            <option key={z.city} value={z.city}>
                              {z.city} — {z.price > 0 ? formatPrice(z.price) : "Free shipping"}
                            </option>
                          ))}
                        </select>
                        <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#A8975E]" width="12" height="8" viewBox="0 0 12 8" fill="none">
                          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                      </div>
                    ) : (
                      <input
                        id="city"
                        type="text"
                        autoComplete="address-level2"
                        placeholder="Your city"
                        value={form.city}
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                        className={`${inputCls} border-[#EDE6D4] focus:border-[#A8975E]`}
                      />
                    )}
                    {fieldError("city") && <p className="text-[11px] text-red-600 mt-1">{fieldError("city")}</p>}
                    {form.city && zones.length > 0 && (
                      <p className="text-[11px] text-[#8A7E6E] mt-1.5">
                        Delivery to {form.city}: {shippingFee > 0 ? formatPrice(shippingFee) : "free"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Promo */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo code"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    className="flex-1 border border-[#EDE6D4] bg-transparent px-4 py-3 text-sm"
                  />
                  <button
                    onClick={applyPromo}
                    className="px-6 py-3 bg-[#1C1711] text-[#F5EFE2] text-xs tracking-widest uppercase hover:bg-[#5A5040] transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {promoError && <p className="text-xs text-red-600">{promoError}</p>}
                {promoData && (
                  <p className="text-xs text-green-700">
                    Code applied — {formatPrice(discount)} discount!
                  </p>
                )}

                <button
                  onClick={() => {
                    setTouched({ name: true, email: true, phone: true, address: true, city: true });
                    if (["name", "email", "phone", "address", "city"].some((f) => fieldError(f))) return;
                    setStep("payment");
                  }}
                  className="w-full bg-[#A8975E] text-[#F5EFE2] py-3.5 text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === "payment" && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl text-[#1C1711]">InstaPay Payment</h2>
                <div className="bg-[#EDE6D4] p-6 space-y-3">
                  <p className="text-xs tracking-widest uppercase text-[#A8975E]">Payment Instructions</p>
                  <p className="text-sm text-[#5A5040] leading-relaxed">
                    {paySettings.instructions ||
                      "Transfer the total amount via InstaPay to the details below, then upload your payment screenshot."}
                  </p>
                  {paySettings.instapayId && (
                    <div className="mt-4 p-4 bg-[#F5EFE2] text-center">
                      <p className="text-xs text-[#8A7E6E] mb-1">InstaPay ID</p>
                      <p className="text-lg font-medium text-[#1C1711]">{paySettings.instapayId}</p>
                    </div>
                  )}
                  {paySettings.instapayPhone && (
                    <div className="p-4 bg-[#F5EFE2] text-center">
                      <p className="text-xs text-[#8A7E6E] mb-1">Phone</p>
                      <p className="text-lg font-medium text-[#1C1711]">{paySettings.instapayPhone}</p>
                    </div>
                  )}
                  {(paySettings.extraFields || []).map((f) => (
                    <div key={f.id} className="p-4 bg-[#F5EFE2] text-center">
                      {f.label && <p className="text-xs text-[#8A7E6E] mb-1">{f.label}</p>}
                      {f.type === "qr" && f.value ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.value} alt={f.label || "QR code"} className="mx-auto w-44 h-44 object-contain" />
                      ) : f.type === "link" && f.value ? (
                        <a href={f.value} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#A8975E] underline break-all">
                          {f.value}
                        </a>
                      ) : (
                        <p className="text-lg font-medium text-[#1C1711] break-words">{f.value}</p>
                      )}
                    </div>
                  ))}
                  <div className="mt-4 p-4 bg-[#A8975E] text-center">
                    <p className="text-xs text-[#F5EFE2]/70 mb-1">Amount to Transfer</p>
                    <p className="text-2xl font-serif text-[#F5EFE2]">{formatPrice(finalTotal)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs tracking-widest uppercase text-[#5A5040] mb-2 block">
                    Upload Payment Screenshot *
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 5 * 1024 * 1024) return alert("Max file size is 5MB");
                      setScreenshotFile(f);
                      setScreenshotPreview(URL.createObjectURL(f));
                    }}
                    className="w-full border border-dashed border-[#A8975E] p-6 text-xs text-[#8A7E6E] text-center cursor-pointer hover:border-[#8A7A4A] transition-colors"
                  />
                  {screenshotPreview && (
                    <div className="mt-3 relative w-full h-48">
                      <Image src={screenshotPreview} alt="Screenshot" fill className="object-contain" />
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("details")}
                    className="px-6 py-3 border border-[#EDE6D4] text-xs tracking-widest uppercase text-[#5A5040] hover:border-[#A8975E] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (!screenshotFile) return alert("Please upload your payment screenshot");
                      setStep("confirm");
                    }}
                    className="flex-1 bg-[#A8975E] text-[#F5EFE2] py-3 text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === "confirm" && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl text-[#1C1711]">Review Your Order</h2>
                <div className="bg-[#EDE6D4] p-5 space-y-2 text-sm">
                  <p><span className="text-[#8A7E6E]">Name:</span> {form.name}</p>
                  <p><span className="text-[#8A7E6E]">Email:</span> {form.email}</p>
                  <p><span className="text-[#8A7E6E]">Phone:</span> {form.phone}</p>
                  <p><span className="text-[#8A7E6E]">Address:</span> {form.address}, {form.city}</p>
                </div>
                <div className="space-y-3">
                  {items.map((i) => (
                    <div key={i.id} className="flex justify-between text-sm">
                      <span className="text-[#5A5040]">{i.productName} × {i.quantity}</span>
                      <span>{formatPrice(i.price * i.quantity)}</span>
                    </div>
                  ))}
                  {shippingFee > 0 && (
                    <div className="flex justify-between text-sm text-[#5A5040]">
                      <span>Shipping ({form.city})</span>
                      <span>{formatPrice(shippingFee)}</span>
                    </div>
                  )}
                  {promoData && (
                    <div className="flex justify-between text-sm text-green-700">
                      <span>Discount ({promoData.code})</span>
                      <span>−{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-[#EDE6D4] flex justify-between font-medium">
                    <span>Total</span>
                    <span className="text-[#A8975E]">{formatPrice(finalTotal)}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("payment")}
                    className="px-6 py-3 border border-[#EDE6D4] text-xs tracking-widest uppercase text-[#5A5040] hover:border-[#A8975E] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={submitOrder}
                    disabled={loading}
                    className="flex-1 bg-[#A8975E] text-[#F5EFE2] py-3 text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors disabled:opacity-60"
                  >
                    {loading ? "Placing Order..." : "Place Order"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="bg-[#EDE6D4] p-6 h-fit">
            <h3 className="font-serif text-lg text-[#1C1711] mb-4">Summary</h3>
            <div className="space-y-3 text-sm">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span className="text-[#5A5040] truncate mr-2">{i.productName} ×{i.quantity}</span>
                  <span className="shrink-0">{formatPrice(i.price * i.quantity)}</span>
                </div>
              ))}
              {promoData && (
                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span>−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#5A5040]">
                <span>Shipping</span>
                <span>{!form.city && zones.length > 0 ? "Select city" : shippingFee > 0 ? formatPrice(shippingFee) : "Free"}</span>
              </div>
              <div className="pt-3 border-t border-[#E0D8C4] flex justify-between font-medium">
                <span>Total</span>
                <span className="text-[#A8975E]">{formatPrice(finalTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
