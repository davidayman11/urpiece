"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { Quote } from "@/lib/pricing-engine";
import type { ShippingConfig } from "@/lib/shipping";
import { formatAddress, EGYPT_GOVERNORATES, DEFAULT_MODES, type FieldModes, type CustomField } from "@/lib/checkout-fields";
import Image from "next/image";
import Link from "next/link";
import { useT, useLang, Txt } from "@/components/store/TextsProvider";
import { L, itemNames } from "@/lib/localize";

interface PaymentSettings {
  instapayId?: string;
  instapayPhone?: string;
  instructions?: string;
  instructionsAr?: string | null;
  freeShippingMin?: number | null;
  fieldOrder?: string[];
  fieldModes?: FieldModes;
  customFields?: CustomField[];
  extraFields?: { id: string; label: string; labelAr?: string; value: string; type: "text" | "link" | "qr" }[];
}

type CheckoutStep = "details" | "payment" | "confirm";

interface SavedAddress {
  id: string; label: string; fullName: string; phone: string; governorate: string;
  city: string; building: string; street: string; isDefault: boolean;
}

export default function CheckoutPage() {
  const t = useT();
  const { items, total, packagingTotal, clearCart } = useCartStore();
  const router = useRouter();
  const [step, setStep] = useState<CheckoutStep>("details");
  const [paySettings, setPaySettings] = useState<PaymentSettings>({});
  const [loading, setLoading] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const lang = useLang();
  const [promoError, setPromoError] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [shotError, setShotError] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [customerNote, setCustomerNote] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<string>("new");
  const [saveAddress, setSaveAddress] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [payOption, setPayOption] = useState<"deposit" | "full">("deposit");
  const [cityOther, setCityOther] = useState(false);
  const [shipping, setShipping] = useState<ShippingConfig>({ adminDriven: false, governorates: [], zones: [], hasZones: false });
  const [form, setForm] = useState({
    name: "", email: "", phone: "", governorate: "", city: "", building: "", address: "",
  });

  // Cities available for a governorate (admin-managed), or the flat list (old setup)
  const cityNames = (cfg: ShippingConfig, gov: string): string[] =>
    cfg.adminDriven ? cfg.governorates.find((g) => g.name === gov)?.cities ?? [] : cfg.zones.map((z) => z.city);
  const adminDriven = shipping.adminDriven;
  const hasZones = shipping.hasZones;
  const cityOptions = cityNames(shipping, form.governorate);
  const govOptions = adminDriven ? shipping.governorates.map((g) => g.name) : EGYPT_GOVERNORATES;
  const govLabel = (name: string) => L(lang, name, shipping.governorates.find((g) => g.name === name)?.nameAr);
  const cityLabel = (name: string) =>
    L(lang, name, adminDriven ? shipping.governorates.find((g) => g.name === form.governorate)?.citiesAr?.[name] : shipping.zones.find((z) => z.city === name)?.cityAr);
  const govPrice = (name: string) => shipping.governorates.find((g) => g.name === name)?.price ?? 0;
  // With governorates, a customer whose city isn't listed picks "Other" and types it
  const otherSelected = adminDriven && (cityOther || (!!form.city && !cityOptions.includes(form.city)));

  // The saved cart is read from the browser a moment after the page opens. Only send an empty cart back to
  // the cart page once it has loaded, otherwise refreshing or opening /checkout directly bounced you away.
  const [cartReady, setCartReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setCartReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (cartReady && items.length === 0) router.push("/cart");
    fetch("/api/settings/payment").then((r) => r.json()).then(setPaySettings).catch(() => {});
    fetch("/api/shipping")
      .then((r) => r.json())
      .then((cfg: ShippingConfig) => {
        if (!cfg || typeof cfg.hasZones !== "boolean") return;
        setShipping(cfg);
        // a saved address may use a place that is no longer in the shipping list
        setForm((f) => {
          if (!cfg.hasZones) return f;
          const govOk = !cfg.adminDriven || cfg.governorates.some((g) => g.name === f.governorate);
          const gov = govOk ? f.governorate : "";
          // governorates accept any typed city; the older flat list only accepts listed cities
          const city = !govOk ? "" : !cfg.adminDriven && !cityNames(cfg, gov).includes(f.city) ? "" : f.city;
          return gov === f.governorate && city === f.city ? f : { ...f, governorate: gov, city };
        });
      })
      .catch(() => {});
  }, [items, router, cartReady]);

  const applyAddress = (a: SavedAddress) => {
    setSelectedAddr(a.id);
    setForm((f) => ({
      ...f, name: a.fullName || f.name, phone: a.phone || f.phone,
      governorate: adminDriven && !shipping.governorates.some((g) => g.name === a.governorate) ? "" : a.governorate,
      city:
        adminDriven
          ? shipping.governorates.some((g) => g.name === a.governorate) ? a.city : ""
          : hasZones && !cityNames(shipping, a.governorate).includes(a.city) ? "" : a.city,
      building: a.building, address: a.street,
    }));
  };
  const useNewAddress = () => {
    setSelectedAddr("new");
    setForm((f) => ({ ...f, governorate: "", city: "", building: "", address: "" }));
  };

  // Signed-in customer: prefill details and load saved addresses (default one is selected)
  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/account/me").then((r) => (r.ok ? r.json() : null));
        if (me?.customer) {
          setSignedIn(true);
          setForm((f) => ({ ...f, name: f.name || me.customer.name, email: me.customer.email, phone: f.phone || me.customer.phone || "" }));
        }
        const res = await fetch("/api/account/addresses").then((r) => (r.ok ? r.json() : null));
        const list: SavedAddress[] = res?.addresses || [];
        setAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) applyAddress(def);
      } catch { /* the form still works without saved data */ }
    })();
  }, []);

  // Prices, discounts and shipping all come from the server so they always match the order
  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) =>
              i.bundleId
                ? { bundleId: i.bundleId, selections: i.selections, quantity: i.quantity }
                : { variantId: i.variantId, quantity: i.quantity, packagingIds: i.packagingIds ?? (i.packagingId ? [i.packagingId] : []) }
            ),
            promoCode: appliedCode,
            city: form.city,
            governorate: form.governorate,
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) { setQuote(data); setPromoError(data.promoMessage || ""); }
        else setPromoError(data.error || "");
      } catch { /* keep the last quote */ }
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [items, appliedCode, form.city, form.governorate]);

  const cartTotal = quote?.subtotal ?? total();
  const discount = quote?.discount ?? 0;
  const promoData = quote?.promoCode ? { code: quote.promoCode, discount: quote.promoDiscount } : null;
  const afterDiscount = Math.max(0, cartTotal - discount);
  const freeMin = paySettings.freeShippingMin || 0;
  const freeShippingApplied = !!quote?.freeShippingApplied;
  const cityFee = adminDriven ? govPrice(form.governorate) : shipping.zones.find((z) => z.city === form.city)?.price ?? 0;
  const shippingFee = quote?.shippingFee ?? 0;
  const finalTotal = quote?.total ?? cartTotal + packagingTotal();
  // Deposit: pay part now, the rest on delivery (rules are set in the admin)
  const dep = quote?.deposit;
  const usingDeposit = !!dep?.enabled && (payOption === "deposit" || !dep.allowFull);
  const payNow = usingDeposit && dep ? dep.amount : finalTotal;
  const dueOnDelivery = usingDeposit && dep ? dep.balance : 0;
  const unit = (i: { variantId: string; price: number }) =>
    quote?.lines.find((l) => l.variantId === i.variantId)?.unitPrice ?? i.price;

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoError("");
    setAppliedCode(code);
  };

  const submitOrder = async () => {
    // a payment screenshot is required: go back to the payment step and say so
    if (!screenshotFile) { setShotError(true); setStep("payment"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("screenshot", screenshotFile);
      fd.append("items", JSON.stringify(items));
      fd.append("custom", JSON.stringify(customValues));
      if (customerNote.trim()) fd.append("customerNote", customerNote.trim());
      if (quote?.promoCode) fd.append("promoCode", quote.promoCode);
      fd.append("saveAddress", saveAddress && selectedAddr === "new" ? "1" : "0");
      fd.append("paymentOption", usingDeposit ? "deposit" : "full");

      const res = await fetch("/api/orders", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      clearCart();
      // Signed-in customers go to their orders list; guests open their order with its private link
      router.push(
        signedIn
          ? `/orders?placed=${encodeURIComponent(data.orderNumber)}`
          : `/orders/${encodeURIComponent(data.orderNumber)}?t=${encodeURIComponent(data.accessToken || "")}`
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : t("checkout.err.orderFailed"));
    } finally {
      setLoading(false);
    }
  };

  const modes = { ...DEFAULT_MODES, ...(paySettings.fieldModes || {}) };
  const customFields = paySettings.customFields || [];
  const isHidden = (field: string) =>
    modes[field as keyof FieldModes] === "hidden" && !((field === "city" && hasZones) || (field === "governorate" && adminDriven));
  const isRequired = (field: string) =>
    (field === "city" && hasZones) || (field === "governorate" && adminDriven) || modes[field as keyof FieldModes] === "required";
  const mark = (required: boolean) =>
    required ? <span className="text-[#A8975E]">*</span> : <span className="normal-case tracking-normal text-[#C4B8A0]"><Txt k="checkout.fields.optional" /></span>;
  const orderOf = (key: string) => {
    const i = (paySettings.fieldOrder || []).indexOf(key);
    return i === -1 ? 999 : i;
  };
  const customError = (f: CustomField) =>
    touched["c_" + f.id] && f.required && !(customValues[f.id] || "").trim() ? t("checkout.err.required") : "";

  const fieldError = (field: string): string => {
    if (!touched[field]) return "";
    const v = form[field as keyof typeof form].trim();
    if (!v) return isRequired(field) ? (field === "city" ? t("checkout.err.selectCity") : t("checkout.err.required")) : "";
    if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return t("checkout.err.email");
    if (field === "phone" && !/^\+?[0-9\s-]{10,15}$/.test(v)) return t("checkout.err.phone");
    return "";
  };

  const inputBase =
    "w-full border px-4 py-3 text-sm text-[#1C1711] placeholder:text-[#A59C88] outline-none transition-all";
  const inputCls = `${inputBase} bg-white`;

  const textFields = ([
    { field: "name", labelKey: "checkout.fields.name", type: "text", placeholder: t("checkout.fields.namePlaceholder"), autoComplete: "name", inputMode: undefined, full: true },
    { field: "email", labelKey: "checkout.fields.email", type: "email", placeholder: t("checkout.fields.emailPlaceholder"), autoComplete: "email", inputMode: "email" as const, full: false },
    { field: "phone", labelKey: "checkout.fields.phone", type: "tel", placeholder: t("checkout.fields.phonePlaceholder"), autoComplete: "tel", inputMode: "tel" as const, full: false },
    { field: "building", labelKey: "checkout.fields.building", type: "text", placeholder: t("checkout.fields.buildingPlaceholder"), autoComplete: "address-line2", inputMode: undefined, full: false },
    { field: "address", labelKey: "checkout.fields.street", type: "text", placeholder: t("checkout.fields.streetPlaceholder"), autoComplete: "address-line1", inputMode: undefined, full: false },
  ] as const).filter((f) => !isHidden(f.field));

  if (items.length === 0) return null;

  return (
    <div data-font-area="checkout" className="pt-28 pb-24 min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-serif text-4xl font-light text-[#1C1711] mb-10"><Txt k="checkout.title" /></h1>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-10 text-xs tracking-widest uppercase">
          {(["details", "payment", "confirm"] as CheckoutStep[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-[#EDE6D4]" />}
              <span
                className={
                  step === s
                    ? "text-[#1C1711] border-b border-[#A8975E] pb-1"
                    : (["details", "payment", "confirm"] as CheckoutStep[]).indexOf(s) < (["details", "payment", "confirm"] as CheckoutStep[]).indexOf(step)
                    ? "text-[#A8975E]"
                    : "text-[#A59C88]"
                }
              >
                <Txt k={`checkout.steps.${s}`} />
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {/* Step 1: Details */}
            {step === "details" && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-serif text-2xl text-[#1C1711]"><Txt k="checkout.details.title" /></h2>
                  <p className="text-xs text-[#8A7E6E] mt-1"><Txt k="checkout.details.subtitle" /></p>
                </div>

                {!signedIn && (
                  <p className="text-xs text-[#5A5040] bg-[#FBF8F0] border border-[#E0D6BD] px-4 py-3">
                    <Txt k="checkout.guest.banner" />{" "}
                    <Link href="/account/login?next=/checkout" className="text-[#A8975E] underline underline-offset-4"><Txt k="checkout.guest.signIn" /></Link>
                  </p>
                )}

                {addresses.length > 0 && (
                  <div>
                    <p className="text-xs tracking-widest uppercase text-[#5A5040] mb-2"><Txt k="checkout.details.deliverTo" /></p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {addresses.map((a) => (
                        <button
                          type="button"
                          key={a.id}
                          onClick={() => applyAddress(a)}
                          className={`text-left p-4 border text-sm transition-colors ${
                            selectedAddr === a.id ? "border-[#A8975E] bg-[#A8975E]/5" : "border-[#D8CEB3] bg-white/60 hover:border-[#C4B07A]"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-[#1C1711] font-medium truncate">{a.label || a.fullName}</span>
                            {a.isDefault && <span className="text-[9px] tracking-[0.2em] uppercase text-[#A8975E] shrink-0"><Txt k="checkout.details.default" /></span>}
                          </span>
                          <span className="block text-[#8A7E6E] mt-1">
                            {[a.building && t("checkout.details.buildingPrefix", { building: a.building }), a.street, a.city, a.governorate].filter(Boolean).join(", ")}
                          </span>
                          <span className="block text-[#8A7E6E]">{a.phone}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={useNewAddress}
                        className={`p-4 border text-sm text-left transition-colors ${
                          selectedAddr === "new" ? "border-[#A8975E] bg-[#A8975E]/5" : "border-dashed border-[#C9BE9F] hover:border-[#A8975E]"
                        }`}
                      >
                        <span className="text-[#A8975E]"><Txt k="checkout.details.useNewAddress" /></span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {textFields.map(({ field, labelKey, type, placeholder, autoComplete, inputMode, full }) => (
                    <div key={field} className={full ? "sm:col-span-2" : ""} style={{ order: orderOf(field) }}>
                      <label htmlFor={field} className="text-xs tracking-widest uppercase text-[#5A5040] mb-1.5 block">
                        <Txt k={labelKey} /> {mark(isRequired(field))}
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
                        readOnly={field === "email" && signedIn}
                        aria-invalid={!!fieldError(field)}
                        className={`${field === "email" && signedIn ? `${inputBase} bg-[#EFE8D6] text-[#7A705E] cursor-not-allowed` : inputCls} ${fieldError(field) ? "border-red-400" : "border-[#CFC4A6] hover:border-[#B8AB85] focus:border-[#A8975E] focus:ring-2 focus:ring-[#A8975E]/20"}`}
                      />
                      {fieldError(field) && <p className="text-[11px] text-red-600 mt-1">{fieldError(field)}</p>}
                    </div>
                  ))}

                  {!isHidden("governorate") && (
                    <div className="sm:col-span-2" style={{ order: orderOf("governorate") }}>
                      <label htmlFor="governorate" className="text-xs tracking-widest uppercase text-[#5A5040] mb-1.5 block">
                        <Txt k="checkout.fields.governorate" /> {mark(isRequired("governorate"))}
                      </label>
                      <div className="relative">
                        <select
                          id="governorate"
                          value={form.governorate}
                          autoComplete="address-level1"
                          onChange={(e) => { setCityOther(false); setForm((f) => ({ ...f, governorate: e.target.value, city: adminDriven ? "" : f.city })); }}
                          onBlur={() => setTouched((t) => ({ ...t, governorate: true }))}
                          className={`${inputCls} appearance-none pr-10 cursor-pointer ${fieldError("governorate") ? "border-red-400" : "border-[#CFC4A6] hover:border-[#B8AB85] focus:border-[#A8975E] focus:ring-2 focus:ring-[#A8975E]/20"}`}
                        >
                          <option value=""><Txt k="checkout.fields.governoratePlaceholder" /></option>
                          {govOptions.map((g) => (
                            <option key={g} value={g}>
                              {adminDriven ? <Txt k="checkout.fields.optionWithFee" vars={{ name: govLabel(g), fee: govPrice(g) > 0 ? formatPrice(govPrice(g)) : t("checkout.fields.freeShipping") }} /> : g}
                            </option>
                          ))}
                        </select>
                        <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#A8975E]" width="12" height="8" viewBox="0 0 12 8" fill="none">
                          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                      </div>
                      {fieldError("governorate") && <p className="text-[11px] text-red-600 mt-1">{fieldError("governorate")}</p>}
                    </div>
                  )}

                  {!isHidden("city") && (
                  <div className="sm:col-span-2" style={{ order: orderOf("city") }}>
                    <label htmlFor="city" className="text-xs tracking-widest uppercase text-[#5A5040] mb-1.5 block">
                      <Txt k="checkout.fields.city" /> {mark(isRequired("city"))}
                    </label>
                    {hasZones ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <select
                            id="city"
                            value={otherSelected ? "__other__" : form.city}
                            autoComplete="address-level2"
                            onChange={(e) => {
                              if (e.target.value === "__other__") { setCityOther(true); setForm((f) => ({ ...f, city: "" })); }
                              else { setCityOther(false); setForm((f) => ({ ...f, city: e.target.value })); }
                            }}
                            onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                            disabled={adminDriven && !form.governorate}
                            className={`${inputCls} appearance-none pr-10 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${fieldError("city") ? "border-red-400" : "border-[#CFC4A6] hover:border-[#B8AB85] focus:border-[#A8975E] focus:ring-2 focus:ring-[#A8975E]/20"}`}
                          >
                            <option value="">{adminDriven && !form.governorate ? <Txt k="checkout.fields.cityNeedGovernorate" /> : <Txt k="checkout.fields.citySelectPlaceholder" />}</option>
                            {cityOptions.map((c) => (
                              <option key={c} value={c}>
                                {adminDriven ? cityLabel(c) : <Txt k="checkout.fields.optionWithFee" vars={{ name: cityLabel(c), fee: (shipping.zones.find((z) => z.city === c)?.price ?? 0) > 0 ? formatPrice(shipping.zones.find((z) => z.city === c)?.price ?? 0) : t("checkout.fields.freeShipping") }} />}
                              </option>
                            ))}
                            {adminDriven && <option value="__other__"><Txt k="checkout.fields.cityOther" /></option>}
                          </select>
                          <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#A8975E]" width="12" height="8" viewBox="0 0 12 8" fill="none">
                            <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                          </svg>
                        </div>
                        {otherSelected && (
                          <input
                            id="city-other"
                            type="text"
                            autoFocus
                            autoComplete="address-level2"
                            placeholder={t("checkout.fields.cityOtherPlaceholder")}
                            value={form.city}
                            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                            onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                            className={`${inputCls} ${fieldError("city") ? "border-red-400" : "border-[#CFC4A6] hover:border-[#B8AB85] focus:border-[#A8975E] focus:ring-2 focus:ring-[#A8975E]/20"}`}
                          />
                        )}
                      </div>
                    ) : (
                      <input
                        id="city"
                        type="text"
                        autoComplete="address-level2"
                        placeholder={t("checkout.fields.cityPlaceholder")}
                        value={form.city}
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                        className={`${inputCls} border-[#CFC4A6] hover:border-[#B8AB85] focus:border-[#A8975E] focus:ring-2 focus:ring-[#A8975E]/20`}
                      />
                    )}
                    {fieldError("city") && <p className="text-[11px] text-red-600 mt-1">{fieldError("city")}</p>}
                    {(adminDriven ? form.governorate : form.city) && hasZones && (
                      <p className="text-[11px] text-[#8A7E6E] mt-1.5">
                        <Txt k="checkout.fields.deliveryTo" vars={{ place: adminDriven ? govLabel(form.governorate) : cityLabel(form.city), fee: shippingFee > 0 ? formatPrice(shippingFee) : t("checkout.fields.deliveryFree") }} />
                        {freeShippingApplied && cityFee > 0 ? " " + t("checkout.fields.freeShippingApplied") : ""}
                      </p>
                    )}
                  </div>
                  )}

                  {customFields.map((f) => (
                    <div key={f.id} className="sm:col-span-2" style={{ order: orderOf(`c:${f.id}`) }}>
                      <label htmlFor={`c_${f.id}`} className="text-xs tracking-widest uppercase text-[#5A5040] mb-1.5 block">
                        {L(lang, f.label, f.labelAr)} {mark(f.required)}
                      </label>
                      {f.type === "textarea" ? (
                        <textarea
                          id={`c_${f.id}`}
                          rows={3}
                          placeholder={L(lang, f.placeholder, f.placeholderAr)}
                          value={customValues[f.id] || ""}
                          onChange={(e) => setCustomValues((v) => ({ ...v, [f.id]: e.target.value }))}
                          onBlur={() => setTouched((t) => ({ ...t, ["c_" + f.id]: true }))}
                          className={`${inputCls} ${customError(f) ? "border-red-400" : "border-[#CFC4A6] hover:border-[#B8AB85] focus:border-[#A8975E] focus:ring-2 focus:ring-[#A8975E]/20"}`}
                        />
                      ) : f.type === "select" ? (
                        <div className="relative">
                          <select
                            id={`c_${f.id}`}
                            value={customValues[f.id] || ""}
                            onChange={(e) => setCustomValues((v) => ({ ...v, [f.id]: e.target.value }))}
                            onBlur={() => setTouched((t) => ({ ...t, ["c_" + f.id]: true }))}
                            className={`${inputCls} appearance-none pr-10 cursor-pointer ${customError(f) ? "border-red-400" : "border-[#CFC4A6] hover:border-[#B8AB85] focus:border-[#A8975E] focus:ring-2 focus:ring-[#A8975E]/20"}`}
                          >
                            <option value=""><Txt k="checkout.fields.selectPlaceholder" /></option>
                            {(f.options || []).map((o, oi) => <option key={o} value={o}>{L(lang, o, f.optionsAr?.[oi])}</option>)}
                          </select>
                          <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#A8975E]" width="12" height="8" viewBox="0 0 12 8" fill="none">
                            <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                          </svg>
                        </div>
                      ) : (
                        <input
                          id={`c_${f.id}`}
                          type="text"
                          placeholder={f.placeholder}
                          value={customValues[f.id] || ""}
                          onChange={(e) => setCustomValues((v) => ({ ...v, [f.id]: e.target.value }))}
                          onBlur={() => setTouched((t) => ({ ...t, ["c_" + f.id]: true }))}
                          className={`${inputCls} ${customError(f) ? "border-red-400" : "border-[#CFC4A6] hover:border-[#B8AB85] focus:border-[#A8975E] focus:ring-2 focus:ring-[#A8975E]/20"}`}
                        />
                      )}
                      {customError(f) && <p className="text-[11px] text-red-600 mt-1">{customError(f)}</p>}
                    </div>
                  ))}
                </div>

                {signedIn && selectedAddr === "new" && (
                  <label className="flex items-center gap-2 text-sm text-[#5A5040] cursor-pointer">
                    <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                    <Txt k="checkout.fields.saveAddress" />
                  </label>
                )}

                {/* Order note */}
                <div>
                  <label className="block text-xs tracking-widest uppercase text-[#A8975E] mb-2">
                    <Txt k="checkout.note.label" /> <span className="normal-case tracking-normal text-[#C4B8A0]"><Txt k="checkout.fields.optional" /></span>
                  </label>
                  <textarea
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder={t("checkout.note.placeholder")}
                    className="w-full border border-[#CFC4A6] bg-white px-4 py-3 text-sm text-[#1C1711] placeholder:text-[#A59C88] outline-none hover:border-[#B8AB85] focus:border-[#A8975E] focus:ring-2 focus:ring-[#A8975E]/20 transition-all resize-none"
                  />
                </div>

                {/* Promo */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t("checkout.promo.placeholder")}
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    className="flex-1 border border-[#CFC4A6] bg-white px-4 py-3 text-sm text-[#1C1711] placeholder:text-[#A59C88] outline-none hover:border-[#B8AB85] focus:border-[#A8975E] focus:ring-2 focus:ring-[#A8975E]/20 transition-all"
                  />
                  <button
                    onClick={applyPromo}
                    className="px-6 py-3 bg-[#1C1711] text-[#F5EFE2] text-xs tracking-widest uppercase hover:bg-[#5A5040] transition-colors"
                  >
                    <Txt k="checkout.promo.apply" />
                  </button>
                </div>
                {promoError && <p className="text-xs text-red-600">{promoError}</p>}
                {quote?.promoNeedsLogin && !signedIn && (
                  <p className="text-xs">
                    <Link href="/account/login?next=/checkout" className="text-[#A8975E] underline underline-offset-4"><Txt k="checkout.promo.signIn" /></Link>{" "}
                    <Txt k="checkout.promo.or" />{" "}
                    <Link href="/account/register?next=/checkout" className="text-[#A8975E] underline underline-offset-4"><Txt k="checkout.promo.createAccount" /></Link>
                  </p>
                )}
                {promoData && (
                  <p className="text-xs text-green-700">
                    <Txt k="checkout.promo.applied" vars={{ amount: formatPrice(promoData.discount) }} />
                  </p>
                )}

                <button
                  onClick={() => {
                    const all: Record<string, boolean> = { name: true, email: true, phone: true, governorate: true, city: true, building: true, address: true };
                    customFields.forEach((f) => { all["c_" + f.id] = true; });
                    setTouched(all);
                    if (["name", "email", "phone", "governorate", "city", "building", "address"].some((f) => !isHidden(f) && fieldError(f))) return;
                    if (customFields.some((f) => customError({ ...f }) || (f.required && !(customValues[f.id] || "").trim()))) return;
                    setStep("payment");
                  }}
                  className="w-full bg-[#A8975E] text-[#F5EFE2] py-3.5 text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors"
                >
                  <Txt k="checkout.details.continueButton" />
                </button>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === "payment" && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl text-[#1C1711]"><Txt k="checkout.payment.title" /></h2>
                <div className="bg-[#EDE6D4] p-6 space-y-3">
                  <p className="text-xs tracking-widest uppercase text-[#A8975E]"><Txt k="checkout.payment.instructionsTitle" /></p>
                  <p className="text-sm text-[#5A5040] leading-relaxed">
                    {L(lang, paySettings.instructions, paySettings.instructionsAr) ||
                      <Txt k="checkout.payment.instructionsDefault" />}
                  </p>
                  {paySettings.instapayId && (
                    <div className="mt-4 p-4 bg-[#F5EFE2] text-center">
                      <p className="text-xs text-[#8A7E6E] mb-1"><Txt k="checkout.payment.instapayId" /></p>
                      <p className="text-lg font-medium text-[#1C1711]">{paySettings.instapayId}</p>
                    </div>
                  )}
                  {paySettings.instapayPhone && (
                    <div className="p-4 bg-[#F5EFE2] text-center">
                      <p className="text-xs text-[#8A7E6E] mb-1"><Txt k="checkout.payment.phone" /></p>
                      <p className="text-lg font-medium text-[#1C1711]">{paySettings.instapayPhone}</p>
                    </div>
                  )}
                  {(paySettings.extraFields || []).map((f) => (
                    <div key={f.id} className="p-4 bg-[#F5EFE2] text-center">
                      {f.label && <p className="text-xs text-[#8A7E6E] mb-1">{L(lang, f.label, f.labelAr)}</p>}
                      {f.type === "qr" && f.value ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.value} alt={L(lang, f.label, f.labelAr) || t("checkout.payment.qrAlt")} className="mx-auto w-44 h-44 object-contain" />
                      ) : f.type === "link" && f.value ? (
                        <a href={f.value} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#A8975E] underline break-all">
                          {f.value}
                        </a>
                      ) : (
                        <p className="text-lg font-medium text-[#1C1711] break-words">{f.value}</p>
                      )}
                    </div>
                  ))}
                  {dep?.enabled && (
                    <fieldset className="mt-4 space-y-2">
                      <legend className="text-xs tracking-widest uppercase text-[#A8975E] mb-2"><Txt k="checkout.payment.howToPay" /></legend>
                      <label className={`flex items-start gap-3 p-4 bg-[#F5EFE2] border cursor-pointer ${usingDeposit ? "border-[#A8975E]" : "border-transparent"}`}>
                        <input type="radio" name="payOption" className="mt-1" checked={usingDeposit} onChange={() => setPayOption("deposit")} />
                        <span className="text-sm">
                          <span className="block text-[#1C1711] font-medium"><Txt k="checkout.payment.depositOption" vars={{ amount: formatPrice(dep.amount) }} /></span>
                          <span className="block text-[#8A7E6E] mt-0.5"><Txt k="checkout.payment.depositRemaining" vars={{ amount: formatPrice(dep.balance) }} /></span>
                        </span>
                      </label>
                      {dep.allowFull && (
                        <label className={`flex items-start gap-3 p-4 bg-[#F5EFE2] border cursor-pointer ${!usingDeposit ? "border-[#A8975E]" : "border-transparent"}`}>
                          <input type="radio" name="payOption" className="mt-1" checked={!usingDeposit} onChange={() => setPayOption("full")} />
                          <span className="text-sm">
                            <span className="block text-[#1C1711] font-medium"><Txt k="checkout.payment.fullOption" vars={{ amount: formatPrice(finalTotal) }} /></span>
                            <span className="block text-[#8A7E6E] mt-0.5"><Txt k="checkout.payment.fullNote" /></span>
                          </span>
                        </label>
                      )}
                    </fieldset>
                  )}
                  <div className="mt-4 p-4 bg-[#A8975E] text-center">
                    <p className="text-xs text-[#F5EFE2]/70 mb-1">{usingDeposit ? <Txt k="checkout.payment.depositToTransfer" /> : <Txt k="checkout.payment.amountToTransfer" />}</p>
                    <p className="text-2xl font-serif text-[#F5EFE2]">{formatPrice(payNow)}</p>
                    {usingDeposit && <p className="text-xs text-[#F5EFE2]/80 mt-1"><Txt k="checkout.payment.onDeliveryPlus" vars={{ amount: formatPrice(dueOnDelivery) }} /></p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs tracking-widest uppercase text-[#5A5040] mb-1 block">
                    <Txt k="checkout.payment.uploadLabel" /> <span className="text-[#B23A3A]" aria-hidden="true">*</span>
                  </label>
                  <p className="text-[11px] text-[#8A7E6E] mb-2"><Txt k="checkout.payment.uploadRequired" /></p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 5 * 1024 * 1024) return alert(t("checkout.err.maxFileSize"));
                      setScreenshotFile(f);
                      setShotError(false);
                      setScreenshotPreview(URL.createObjectURL(f));
                    }}
                    aria-required="true"
                    aria-invalid={shotError}
                    className={`w-full border border-dashed ${shotError ? "border-[#B23A3A] bg-[#B23A3A]/5" : "border-[#A8975E] bg-white/60"} p-5 text-xs text-[#5A5040] cursor-pointer hover:border-[#8A7A4A] transition-colors file:mr-4 file:border-0 file:bg-[#1C1711] file:text-[#F5EFE2] file:px-4 file:py-2 file:text-[10px] file:tracking-[0.2em] file:uppercase file:cursor-pointer hover:file:bg-[#5A5040]`}
                  />
                  {shotError && <p role="alert" className="mt-2 text-xs text-[#B23A3A]"><Txt k="checkout.err.uploadScreenshot" /></p>}
                  {screenshotPreview && (
                    <div className="mt-3 relative w-full h-48">
                      <Image src={screenshotPreview} alt={t("checkout.payment.screenshotAlt")} fill className="object-contain" />
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("details")}
                    className="px-6 py-3 border border-[#CFC4A6] bg-white/50 text-xs tracking-widest uppercase text-[#5A5040] hover:border-[#A8975E] transition-colors"
                  >
                    <Txt k="checkout.payment.back" />
                  </button>
                  <button
                    onClick={() => {
                      if (!screenshotFile) { setShotError(true); return; }
                      setStep("confirm");
                    }}
                    aria-disabled={!screenshotFile}
                    className={`flex-1 bg-[#A8975E] text-[#F5EFE2] py-3 text-xs tracking-widest uppercase transition-colors ${screenshotFile ? "hover:bg-[#8A7A4A]" : "opacity-50 cursor-not-allowed"}`}
                  >
                    <Txt k="checkout.payment.reviewButton" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === "confirm" && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl text-[#1C1711]"><Txt k="checkout.confirm.title" /></h2>
                <div className="bg-[#EDE6D4] p-5 space-y-2 text-sm">
                  {form.name && <p><span className="text-[#8A7E6E]"><Txt k="checkout.confirm.name" /></span> {form.name}</p>}
                  {form.email && <p><span className="text-[#8A7E6E]"><Txt k="checkout.confirm.email" /></span> {form.email}</p>}
                  {form.phone && <p><span className="text-[#8A7E6E]"><Txt k="checkout.confirm.phone" /></span> {form.phone}</p>}
                  {(form.address || form.city || form.governorate || form.building) && (
                    <p><span className="text-[#8A7E6E]"><Txt k="checkout.confirm.address" /></span> {formatAddress(form)}</p>
                  )}
                  {customFields.filter((f) => (customValues[f.id] || "").trim()).map((f) => (
                    <p key={f.id}><span className="text-[#8A7E6E]">{L(lang, f.label, f.labelAr)}:</span> {customValues[f.id]}</p>
                  ))}
                </div>
                <div className="space-y-3">
                  {items.map((i) => (
                    <div key={i.id} className="flex justify-between text-sm">
                      <span className="text-[#5A5040]">{itemNames(i, lang).product} × {i.quantity}</span>
                      <span>{formatPrice(unit(i) * i.quantity)}</span>
                    </div>
                  ))}
                  {quote && quote.packagingTotal > 0 && (
                    <div className="flex justify-between text-sm text-[#5A5040]">
                      <span><Txt k="checkout.summary.packaging" /></span>
                      <span>{formatPrice(quote.packagingTotal)}</span>
                    </div>
                  )}
                  {shippingFee > 0 && (
                    <div className="flex justify-between text-sm text-[#5A5040]">
                      <span><Txt k="checkout.confirm.shippingTo" vars={{ city: form.city }} /></span>
                      <span>{formatPrice(shippingFee)}</span>
                    </div>
                  )}
                  {quote && quote.ruleDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-700">
                      <span>{quote.ruleName || <Txt k="checkout.confirm.discount" />}</span>
                      <span>−{formatPrice(quote.ruleDiscount)}</span>
                    </div>
                  )}
                  {promoData && (
                    <div className="flex justify-between text-sm text-green-700">
                      <span><Txt k="checkout.confirm.promo" vars={{ code: promoData.code }} /></span>
                      <span>−{formatPrice(promoData.discount)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-[#EDE6D4] flex justify-between font-medium">
                    <span><Txt k="checkout.confirm.total" /></span>
                    <span className="text-[#A8975E]">{formatPrice(finalTotal)}</span>
                  </div>
                  {usingDeposit && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#5A5040]"><Txt k="checkout.confirm.depositNow" /></span>
                        <span>{formatPrice(payNow)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#5A5040]"><Txt k="checkout.confirm.dueOnDelivery" /></span>
                        <span>{formatPrice(dueOnDelivery)}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("payment")}
                    className="px-6 py-3 border border-[#CFC4A6] bg-white/50 text-xs tracking-widest uppercase text-[#5A5040] hover:border-[#A8975E] transition-colors"
                  >
                    <Txt k="checkout.confirm.back" />
                  </button>
                  <button
                    onClick={submitOrder}
                    disabled={loading}
                    className="flex-1 bg-[#A8975E] text-[#F5EFE2] py-3 text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors disabled:opacity-60"
                  >
                    {loading ? <Txt k="checkout.confirm.placingOrder" /> : <Txt k="checkout.confirm.placeOrder" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="bg-[#EDE6D4] p-6 h-fit">
            <h3 className="font-serif text-lg text-[#1C1711] mb-4"><Txt k="checkout.summary.title" /></h3>
            {freeMin > 0 && (
              <p className={`text-xs mb-4 ${freeShippingApplied ? "text-green-700" : "text-[#8A7E6E]"}`}>
                {freeShippingApplied
                  ? <Txt k="checkout.summary.freeUnlocked" />
                  : <Txt k="checkout.summary.addMoreForFree" vars={{ amount: formatPrice(freeMin - afterDiscount) }} />}
              </p>
            )}
            <div className="space-y-3 text-sm">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span className="text-[#5A5040] truncate mr-2">{itemNames(i, lang).product} ×{i.quantity}</span>
                  <span className="shrink-0">{formatPrice(unit(i) * i.quantity)}</span>
                </div>
              ))}
              {quote && quote.saleSavings > 0 && (
                <div className="flex justify-between text-xs text-[#8A7E6E]">
                  <span><Txt k="checkout.summary.saleSavings" /></span>
                  <span>{formatPrice(quote.saleSavings)}</span>
                </div>
              )}
              {quote && quote.ruleDiscount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span className="truncate mr-2">{quote.ruleName || <Txt k="checkout.confirm.discount" />}</span>
                  <span className="shrink-0">−{formatPrice(quote.ruleDiscount)}</span>
                </div>
              )}
              {promoData && (
                <div className="flex justify-between text-green-700">
                  <span><Txt k="checkout.confirm.promo" vars={{ code: promoData.code }} /></span>
                  <span>−{formatPrice(promoData.discount)}</span>
                </div>
              )}
              {quote && quote.packagingTotal > 0 && (
                <div className="flex justify-between text-[#5A5040]">
                  <span><Txt k="checkout.summary.packaging" /></span>
                  <span>{formatPrice(quote.packagingTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#5A5040]">
                <span><Txt k="checkout.summary.shipping" /></span>
                <span>{freeShippingApplied ? <Txt k="checkout.summary.free" /> : !(adminDriven ? form.governorate : form.city) && hasZones ? (adminDriven ? <Txt k="checkout.summary.selectGovernorate" /> : <Txt k="checkout.summary.selectCity" />) : shippingFee > 0 ? formatPrice(shippingFee) : <Txt k="checkout.summary.free" />}</span>
              </div>
              <div className="pt-3 border-t border-[#E0D8C4] flex justify-between font-medium">
                <span><Txt k="checkout.summary.total" /></span>
                <span className="text-[#A8975E]">{formatPrice(finalTotal)}</span>
              </div>
              {usingDeposit && step !== "details" && (
                <div className="text-xs space-y-1 pt-1">
                  <div className="flex justify-between"><span className="text-[#5A5040]"><Txt k="checkout.summary.payNow" /></span><span>{formatPrice(payNow)}</span></div>
                  <div className="flex justify-between"><span className="text-[#5A5040]"><Txt k="checkout.summary.onDelivery" /></span><span>{formatPrice(dueOnDelivery)}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
