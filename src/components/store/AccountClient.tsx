"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT, useLang, Txt } from "@/components/store/TextsProvider";
import { L } from "@/lib/localize";
import { EGYPT_GOVERNORATES } from "@/lib/checkout-fields";
import type { Address } from "@prisma/client";
import type { ShippingConfig } from "@/lib/shipping";

const input =
  "w-full border border-[#CFC4A6] bg-white px-4 py-2.5 text-sm text-[#1C1711] placeholder:text-[#A59C88] outline-none hover:border-[#B8AB85] focus:border-[#A8975E] focus:ring-2 focus:ring-[#A8975E]/20 transition-all disabled:bg-[#EFE8D6] disabled:text-[#7A705E] disabled:cursor-not-allowed";
const lbl = "text-[11px] tracking-widest uppercase text-[#5A5040] mb-1 block";
const card = "bg-[#FBF8F0] border border-[#EDE6D4] p-6";
const btn =
  "bg-[#A8975E] text-[#F5EFE2] px-6 py-2.5 text-[11px] tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors disabled:opacity-60";

interface AddrForm {
  label: string; fullName: string; phone: string; governorate: string; city: string;
  building: string; street: string; notes: string; isDefault: boolean;
}
const emptyAddr = (name = "", phone = ""): AddrForm => ({
  label: "", fullName: name, phone, governorate: "", city: "", building: "", street: "", notes: "", isDefault: false,
});

export default function AccountClient({
  customer, addresses, shipping,
}: { customer: { name: string; email: string; phone: string }; addresses: Address[]; shipping: ShippingConfig }) {
  const govOptions = shipping.adminDriven ? shipping.governorates.map((g) => g.name) : EGYPT_GOVERNORATES;
  const t = useT();
  const lang = useLang();
  const router = useRouter();

  // Profile
  const [profile, setProfile] = useState({ name: customer.name, phone: customer.phone });
  const [profileMsg, setProfileMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const saveProfile = async () => {
    setBusy(true); setProfileMsg("");
    const res = await fetch("/api/account/me", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    setProfileMsg(res.ok ? t("account.profile.saved") : d.error || t("account.profile.saveFailed"));
    if (res.ok) router.refresh();
  };

  // Password
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [pwMsg, setPwMsg] = useState("");
  const changePassword = async () => {
    setBusy(true); setPwMsg("");
    const res = await fetch("/api/account/password", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pw),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    setPwMsg(res.ok ? t("account.pw.changed") : d.error || t("account.pw.failed"));
    if (res.ok) setPw({ currentPassword: "", newPassword: "" });
  };

  // Addresses
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AddrForm>(emptyAddr());
  const [addrError, setAddrError] = useState("");
  const [cityOther, setCityOther] = useState(false);
  const listedCities = shipping.adminDriven
    ? shipping.governorates.find((g) => g.name === form.governorate)?.cities ?? []
    : shipping.zones.map((z) => z.city);
  const otherSelected = shipping.adminDriven && (cityOther || (!!form.city && !listedCities.includes(form.city)));

  const openNew = () => { setForm(emptyAddr(customer.name, customer.phone)); setEditId(null); setAddrError(""); setCityOther(false); setModal(true); };
  const openEdit = (a: Address) => {
    setForm({
      label: a.label, fullName: a.fullName, phone: a.phone, governorate: a.governorate, city: a.city,
      building: a.building, street: a.street, notes: a.notes, isDefault: a.isDefault,
    });
    setEditId(a.id); setAddrError(""); setCityOther(false); setModal(true);
  };
  const saveAddress = async () => {
    setBusy(true); setAddrError("");
    const res = await fetch(editId ? `/api/account/addresses/${editId}` : "/api/account/addresses", {
      method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setAddrError(d.error || t("account.addr.saveFailed"));
    setModal(false); router.refresh();
  };
  const removeAddress = async (a: Address) => {
    if (!confirm(t("account.addr.confirmDelete"))) return;
    await fetch(`/api/account/addresses/${a.id}`, { method: "DELETE" });
    router.refresh();
  };
  const makeDefault = async (a: Address) => {
    await fetch(`/api/account/addresses/${a.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...a, isDefault: true }),
    });
    router.refresh();
  };

  const signOut = async () => {
    await fetch("/api/account/logout", { method: "POST" });
    router.push("/"); router.refresh();
  };

  const line = (a: Address) =>
    [a.building && t("account.addr.building", { building: a.building }), a.street, a.city, a.governorate].filter(Boolean).join(", ");

  return (
    <div className="space-y-8">
      {/* Addresses */}
      <section className={card}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[10px] tracking-[0.3em] uppercase text-[#A8975E]"><Txt k="account.addr.title" /></h2>
          <button onClick={openNew} className="text-[11px] tracking-widest uppercase text-[#5A5040] hover:text-[#A8975E] transition-colors">
            <Txt k="account.addr.add" />
          </button>
        </div>
        {addresses.length === 0 ? (
          <p className="text-sm text-[#8A7E6E]"><Txt k="account.addr.empty" /></p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {addresses.map((a) => (
              <div key={a.id} className={`border p-4 text-sm ${a.isDefault ? "border-[#A8975E]" : "border-[#D8CEB3]"}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[#1C1711] font-medium truncate">{a.label || a.fullName}</p>
                  {a.isDefault && <span className="text-[9px] tracking-[0.2em] uppercase bg-[#A8975E] text-[#F5EFE2] px-2 py-0.5 shrink-0"><Txt k="account.addr.default" /></span>}
                </div>
                <p className="text-[#5A5040]">{a.fullName}</p>
                <p className="text-[#8A7E6E]">{line(a)}</p>
                <p className="text-[#8A7E6E]">{a.phone}</p>
                <div className="mt-3 flex gap-4 text-[11px] tracking-wider">
                  <button onClick={() => openEdit(a)} className="text-[#A8975E] hover:underline"><Txt k="account.addr.edit" /></button>
                  {!a.isDefault && <button onClick={() => makeDefault(a)} className="text-[#5A5040] hover:underline"><Txt k="account.addr.makeDefault" /></button>}
                  <button onClick={() => removeAddress(a)} className="text-red-600 hover:underline"><Txt k="account.addr.delete" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Profile */}
      <section className={card}>
        <h2 className="text-[10px] tracking-[0.3em] uppercase text-[#A8975E] mb-5"><Txt k="account.profile.title" /></h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}><Txt k="account.profile.name" /></label>
            <input className={input} value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className={lbl}><Txt k="account.profile.phone" /></label>
            <input className={input} type="tel" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}><Txt k="account.profile.email" /></label>
            <input className={`${input} !bg-[#EFE8D6] !text-[#7A705E] cursor-not-allowed`} value={customer.email} readOnly />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <button onClick={saveProfile} disabled={busy} className={btn}><Txt k="account.profile.save" /></button>
          {profileMsg && <span className="text-xs text-[#8A7E6E]">{profileMsg}</span>}
        </div>
      </section>

      {/* Password */}
      <section className={card}>
        <h2 className="text-[10px] tracking-[0.3em] uppercase text-[#A8975E] mb-5"><Txt k="account.pw.title" /></h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}><Txt k="account.pw.current" /></label>
            <input className={input} type="password" autoComplete="current-password" value={pw.currentPassword}
              onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} />
          </div>
          <div>
            <label className={lbl}><Txt k="account.pw.new" /></label>
            <input className={input} type="password" autoComplete="new-password" placeholder={t("account.pw.newPlaceholder")} value={pw.newPassword}
              onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <button onClick={changePassword} disabled={busy || !pw.currentPassword || !pw.newPassword} className={btn}><Txt k="account.pw.update" /></button>
          {pwMsg && <span className="text-xs text-[#8A7E6E]">{pwMsg}</span>}
        </div>
      </section>

      <button onClick={signOut} className="text-[11px] tracking-[0.2em] uppercase text-[#8A7E6E] hover:text-red-600 transition-colors">
        <Txt k="account.signOut" />
      </button>

      {/* Address modal */}
      {modal && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center p-4 bg-[#1C1711]/50 overflow-y-auto" onClick={() => setModal(false)}>
          <div className="bg-[#F5EFE2] w-full max-w-lg my-8 p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl text-[#1C1711]">{editId ? <Txt k="account.modal.editTitle" /> : <Txt k="account.modal.newTitle" />}</h3>
              <button onClick={() => setModal(false)} aria-label={t("account.modal.close")} className="text-[#8A7E6E] hover:text-[#1C1711] text-xl">×</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={lbl}><Txt k="account.modal.label" /> <span className="normal-case tracking-normal text-[#C4B8A0]"><Txt k="account.modal.labelHint" /></span></label>
                <input className={input} value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}><Txt k="account.modal.recipient" /></label>
                <input className={input} value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}><Txt k="account.modal.phone" /></label>
                <input className={input} type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}><Txt k="account.modal.governorate" /></label>
                <select className={input} value={form.governorate} onChange={(e) => { setCityOther(false); setForm((f) => ({ ...f, governorate: e.target.value, city: shipping.adminDriven ? "" : f.city })); }}>
                  <option value=""><Txt k="account.modal.select" /></option>
                  {govOptions.map((g) => <option key={g} value={g}>{L(lang, g, shipping.governorates.find((x) => x.name === g)?.nameAr)}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}><Txt k="account.modal.city" /></label>
                {shipping.hasZones ? (
                  <div className="space-y-2">
                    <select
                      className={input}
                      value={otherSelected ? "__other__" : form.city}
                      disabled={shipping.adminDriven && !form.governorate}
                      onChange={(e) => {
                        if (e.target.value === "__other__") { setCityOther(true); setForm((f) => ({ ...f, city: "" })); }
                        else { setCityOther(false); setForm((f) => ({ ...f, city: e.target.value })); }
                      }}
                    >
                      <option value="">{shipping.adminDriven && !form.governorate ? <Txt k="account.modal.chooseGov" /> : <Txt k="account.modal.select" />}</option>
                      {listedCities.map((c) => <option key={c} value={c}>{L(lang, c, shipping.adminDriven ? shipping.governorates.find((g) => g.name === form.governorate)?.citiesAr?.[c] : shipping.zones.find((z) => z.city === c)?.cityAr)}</option>)}
                      {shipping.adminDriven && <option value="__other__"><Txt k="account.modal.cityOther" /></option>}
                    </select>
                    {otherSelected && (
                      <input className={input} placeholder={t("account.modal.cityType")} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                    )}
                  </div>
                ) : (
                  <input className={input} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                )}
              </div>
              <div>
                <label className={lbl}><Txt k="account.modal.building" /></label>
                <input className={input} value={form.building} onChange={(e) => setForm((f) => ({ ...f, building: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}><Txt k="account.modal.street" /></label>
                <input className={input} value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}><Txt k="account.modal.notes" /> <span className="normal-case tracking-normal text-[#C4B8A0]"><Txt k="account.modal.optional" /></span></label>
                <input className={input} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <label className="sm:col-span-2 flex items-center gap-2 text-sm text-[#5A5040] cursor-pointer">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />
                <Txt k="account.modal.isDefault" />
              </label>
            </div>
            {addrError && <p role="alert" className="text-xs text-red-600 mt-4">{addrError}</p>}
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setModal(false)} className="px-6 py-2.5 border border-[#CFC4A6] bg-white/50 text-[11px] tracking-widest uppercase text-[#5A5040] hover:border-[#A8975E] transition-colors"><Txt k="account.modal.cancel" /></button>
              <button onClick={saveAddress} disabled={busy} className={btn}>{busy ? <Txt k="account.modal.saving" /> : <Txt k="account.modal.save" />}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
