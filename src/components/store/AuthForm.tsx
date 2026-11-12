"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const input =
  "w-full border border-[#EDE6D4] bg-[#FBF8F0] px-4 py-3 text-sm text-[#1C1711] placeholder:text-[#C4B8A0] outline-none focus:border-[#A8975E] transition-colors";
const label = "text-xs tracking-widest uppercase text-[#5A5040] mb-1.5 block";

export default function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isRegister && form.password !== form.confirm) return setError("Passwords don't match");
    setLoading(true);
    try {
      const res = await fetch(`/api/account/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister
            ? { name: form.name, email: form.email, phone: form.phone, password: form.password }
            : { email: form.email, password: form.password }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const nextQ = next !== "/account" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-md mx-auto px-6">
        <div className="text-center mb-8">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#A8975E] mb-3">
            {isRegister ? "Join UrPiece" : "Welcome back"}
          </p>
          <h1 className="font-serif text-4xl font-light text-[#1C1711]">
            {isRegister ? "Create account" : "Sign in"}
          </h1>
          {next === "/checkout" && (
            <p className="text-sm text-[#8A7E6E] mt-3">Please {isRegister ? "create an account" : "sign in"} to complete your order.</p>
          )}
        </div>

        <form onSubmit={submit} className="space-y-5 bg-[#FBF8F0] border border-[#EDE6D4] p-6 md:p-8">
          {isRegister && (
            <>
              <div>
                <label htmlFor="name" className={label}>Full name</label>
                <input id="name" autoComplete="name" value={form.name} onChange={set("name")} className={input} required />
              </div>
            </>
          )}
          <div>
            <label htmlFor="email" className={label}>Email</label>
            <input id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} className={input} required />
          </div>
          {isRegister && (
            <div>
              <label htmlFor="phone" className={label}>Phone <span className="normal-case tracking-normal text-[#C4B8A0]">(optional)</span></label>
              <input id="phone" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set("phone")} className={input} />
            </div>
          )}
          <div>
            <label htmlFor="password" className={label}>Password</label>
            <input
              id="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={form.password}
              onChange={set("password")}
              placeholder={isRegister ? "At least 8 characters" : ""}
              className={input}
              required
            />
          </div>
          {isRegister && (
            <div>
              <label htmlFor="confirm" className={label}>Confirm password</label>
              <input id="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} className={input} required />
            </div>
          )}

          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#A8975E] text-[#F5EFE2] py-3.5 text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors disabled:opacity-60"
          >
            {loading ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-[#8A7E6E] mt-6">
          {isRegister ? "Already have an account? " : "New to UrPiece? "}
          <Link href={`/account/${isRegister ? "login" : "register"}${nextQ}`} className="text-[#A8975E] underline">
            {isRegister ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </div>
  );
}
