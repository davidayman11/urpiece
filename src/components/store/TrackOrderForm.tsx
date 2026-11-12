"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/components/store/TextsProvider";

const input =
  "w-full border border-[#CFC4A6] bg-white px-4 py-3 text-sm text-[#1C1711] placeholder:text-[#A59C88] outline-none hover:border-[#B8AB85] focus:border-[#A8975E] focus:ring-2 focus:ring-[#A8975E]/20 transition-all";
const label = "text-xs tracking-widest uppercase text-[#5A5040] mb-1.5 block";

export default function TrackOrderForm() {
  const t = useT();
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("orders.track.notFound"));
      router.push(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("orders.track.notFound"));
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-md mx-auto px-6">
        <div className="text-center mb-8">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#A8975E] mb-3">{t("orders.track.eyebrow")}</p>
          <h1 className="font-serif text-4xl font-light text-[#1C1711] mb-3">{t("orders.track.title")}</h1>
          <p className="text-sm text-[#8A7E6E]">{t("orders.track.subtitle")}</p>
        </div>

        <form onSubmit={submit} className="space-y-5 bg-[#FBF8F0] border border-[#E0D6BD] p-6 md:p-8">
          <div>
            <label htmlFor="trk-number" className={label}>{t("orders.track.orderNumber")}</label>
            <input id="trk-number" className={input} value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder={t("orders.track.placeholder")} required />
          </div>
          <div>
            <label htmlFor="trk-email" className={label}>{t("orders.track.email")}</label>
            <input id="trk-email" type="email" autoComplete="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#A8975E] text-[#F5EFE2] py-3.5 text-xs tracking-[0.2em] uppercase hover:bg-[#8A7A4A] transition-colors disabled:opacity-60"
          >
            {loading ? t("orders.track.loading") : t("orders.track.button")}
          </button>
        </form>

        <p className="text-center text-sm text-[#8A7E6E] mt-6">
          {t("orders.track.haveAccount")}{" "}
          <Link href="/account/login?next=/orders" className="text-[#A8975E] underline underline-offset-4">{t("orders.track.signIn")}</Link>
        </p>
      </div>
    </div>
  );
}
