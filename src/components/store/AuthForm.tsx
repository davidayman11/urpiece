"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type FieldKey = "name" | "email" | "phone" | "password" | "confirm";

const ICONS: Record<string, React.ReactNode> = {
  name: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>),
  email: (<><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="M3 7l9 6 9-6" /></>),
  phone: (<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />),
  password: (<><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V8a4 4 0 018 0v3" /></>),
};

const BENEFITS = [
  ["Faster checkout", "Your details and addresses, ready when you are."],
  ["Saved addresses", "Keep home, work and gifts one tap away."],
  ["Track every order", "See the status of each piece, start to finish."],
];

function strength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const level = pw.length === 0 ? 0 : Math.min(4, Math.max(1, score));
  return { level, label: ["", "Weak", "Fair", "Good", "Strong"][level] };
}

const STRENGTH_COLORS = ["", "#C4584A", "#D49A3A", "#A8975E", "#4F8A5B"];

export default function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const router = useRouter();
  const uid = useId();
  const isRegister = mode === "register";

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: FieldKey) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Pure check: returns a message, or "" when the field is fine
  const invalid = (k: FieldKey): string => {
    const v = form[k].trim();
    switch (k) {
      case "name": return v.length < 2 ? "Please enter your full name" : "";
      case "email": return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email address";
      case "phone": return v && !/^\+?[0-9\s-]{8,15}$/.test(v) ? "Enter a valid phone number" : "";
      case "password":
        if (!form.password) return "Enter your password";
        return isRegister && form.password.length < 8 ? "Use at least 8 characters" : "";
      case "confirm": return form.confirm !== form.password ? "Passwords don't match" : "";
    }
  };
  const fieldError = (k: FieldKey) => (touched[k] ? invalid(k) : "");

  const fields: FieldKey[] = isRegister ? ["name", "email", "phone", "password", "confirm"] : ["email", "password"];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTouched(Object.fromEntries(fields.map((f) => [f, true])));
    if (fields.some((f) => invalid(f))) return;

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
  const st = strength(form.password);

  const renderField = ({
    k, label, type = "text", autoComplete, placeholder, optional, inputMode, icon, autoFocus, trailing,
  }: {
    k: FieldKey; label: string; type?: string; autoComplete?: string; placeholder?: string;
    optional?: boolean; inputMode?: "tel" | "email"; icon: string; autoFocus?: boolean; trailing?: React.ReactNode;
  }) => {
    const err = fieldError(k);
    const id = `${uid}-${k}`;
    return (
      <div>
        <label htmlFor={id} className="text-[11px] tracking-[0.18em] uppercase text-[#5A5040] mb-1.5 block">
          {label}
          {optional && <span className="normal-case tracking-normal text-[#B5AA92]"> · optional</span>}
        </label>
        <div className="relative">
          <svg
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${err ? "text-red-400" : "text-[#B5AA92]"}`}
            width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden
          >
            {ICONS[icon]}
          </svg>
          <input
            id={id}
            type={type}
            inputMode={inputMode}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            placeholder={placeholder}
            value={form[k]}
            onChange={set(k)}
            onBlur={() => setTouched((t) => ({ ...t, [k]: true }))}
            aria-invalid={!!err}
            aria-describedby={err ? `${id}-err` : undefined}
            className={`w-full bg-white/70 border pl-10 ${trailing ? "pr-11" : "pr-4"} py-3 text-sm text-[#1C1711] placeholder:text-[#C4B8A0] outline-none transition-all
              ${err ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-[#E3DBC8] focus:border-[#A8975E] focus:ring-2 focus:ring-[#A8975E]/15"}`}
          />
          {trailing}
        </div>
        {err && <p id={`${id}-err`} className="text-[11px] text-red-600 mt-1.5">{err}</p>}
      </div>
    );
  };

  const eye = (
    <button
      type="button"
      onClick={() => setShowPw((s) => !s)}
      aria-label={showPw ? "Hide password" : "Show password"}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#B5AA92] hover:text-[#A8975E] transition-colors"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {showPw ? (
          <><path d="M3 3l18 18" /><path d="M10.6 6.2A9.8 9.8 0 0112 6c5 0 8.5 4.2 9.5 6-.4.8-1.3 2-2.6 3.2M6.5 7.6C4.6 8.9 3.4 10.7 2.5 12c1 1.8 4.5 6 9.5 6 1.3 0 2.5-.3 3.6-.8" /><path d="M9.9 10a3 3 0 004.1 4.1" /></>
        ) : (
          <><path d="M2.5 12C3.5 10.2 7 6 12 6s8.5 4.2 9.5 6c-1 1.8-4.5 6-9.5 6s-8.5-4.2-9.5-6z" /><circle cx="12" cy="12" r="3" /></>
        )}
      </svg>
    </button>
  );

  return (
    <div className="pt-28 pb-20 min-h-screen px-4 md:px-6">
      <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr_1.15fr] bg-[#FBF8F0] border border-[#EDE6D4] shadow-[0_20px_60px_-30px_rgba(28,23,17,0.35)]">
        {/* Brand panel */}
        <aside className="hidden md:flex flex-col justify-between bg-[#1C1711] text-[#F5EFE2] p-10 relative overflow-hidden">
          <svg className="absolute -right-16 -bottom-16 opacity-[0.07]" width="320" height="320" viewBox="0 0 52 52" fill="none" aria-hidden>
            <circle cx="26" cy="26" r="16" stroke="#C4B07A" strokeWidth="0.6" />
            <circle cx="26" cy="26" r="3" fill="#C4B07A" />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * 30 * Math.PI) / 180;
              return <line key={i} x1={26 + Math.cos(a) * 19} y1={26 + Math.sin(a) * 19} x2={26 + Math.cos(a) * 25} y2={26 + Math.sin(a) * 25} stroke="#C4B07A" strokeWidth="0.6" />;
            })}
          </svg>
          <div className="relative">
            <p className="font-serif text-2xl tracking-[0.3em] uppercase text-[#C4B07A]">UrPiece</p>
            <p className="mt-10 font-serif text-3xl font-light leading-snug">
              {isRegister ? "Your glow, your piece." : "Good to see you again."}
            </p>
          </div>
          <ul className="relative space-y-5 mt-10">
            {BENEFITS.map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4B07A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
                <span>
                  <span className="block text-sm">{t}</span>
                  <span className="block text-xs text-[#F5EFE2]/55 mt-0.5 leading-relaxed">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Form */}
        <div className="p-6 sm:p-10">
          <div className="mb-7">
            <h1 className="font-serif text-3xl sm:text-4xl font-light text-[#1C1711]">
              {isRegister ? "Create your account" : "Sign in"}
            </h1>
            <p className="text-sm text-[#8A7E6E] mt-2">
              {next === "/checkout"
                ? `${isRegister ? "Create an account" : "Sign in"} to complete your order.`
                : isRegister ? "It only takes a moment." : "Welcome back to UrPiece."}
            </p>
          </div>

          <form onSubmit={submit} noValidate className="space-y-5">
            {isRegister && renderField({ k: "name", label: "Full name", autoComplete: "name", placeholder: "Your full name", icon: "name", autoFocus: true })}
            {renderField({ k: "email", label: "Email", type: "email", inputMode: "email", autoComplete: "email", placeholder: "you@example.com", icon: "email", autoFocus: !isRegister })}
            {isRegister && renderField({ k: "phone", label: "Phone", type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "01XXXXXXXXX", icon: "phone", optional: true })}
            <div>
              {renderField({
                k: "password",
                label: "Password",
                type: showPw ? "text" : "password",
                autoComplete: isRegister ? "new-password" : "current-password",
                placeholder: isRegister ? "At least 8 characters" : "Your password",
                icon: "password",
                trailing: eye,
              })}
              {isRegister && form.password && (
                <div className="mt-2.5" aria-live="polite">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className="h-1 flex-1 rounded-full transition-colors duration-300"
                        style={{ backgroundColor: i <= st.level ? STRENGTH_COLORS[st.level] : "#E3DBC8" }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] mt-1.5" style={{ color: STRENGTH_COLORS[st.level] }}>
                    {st.label}
                    {st.level < 3 && <span className="text-[#8A7E6E]"> — try a longer password with numbers or symbols</span>}
                  </p>
                </div>
              )}
            </div>
            {isRegister && renderField({ k: "confirm", label: "Confirm password", type: showPw ? "text" : "password", autoComplete: "new-password", placeholder: "Repeat your password", icon: "password" })}

            {error && (
              <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5">
                <svg className="mt-px shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#A8975E] text-[#F5EFE2] py-3.5 text-xs tracking-[0.2em] uppercase hover:bg-[#8A7A4A] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                  <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {loading ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-[#8A7E6E] mt-7">
            {isRegister ? "Already have an account? " : "New to UrPiece? "}
            <Link href={`/account/${isRegister ? "login" : "register"}${nextQ}`} className="text-[#A8975E] underline underline-offset-4 hover:text-[#8A7A4A]">
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
