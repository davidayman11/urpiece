"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) { setError("Invalid email or password"); return; }
    router.push("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F5EFE2] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <span className="font-serif text-3xl text-[#A8975E] tracking-[0.2em] uppercase">UrPiece</span>
          <p className="mt-2 text-xs tracking-widest uppercase text-[#8A7E6E]">Admin Dashboard</p>
        </div>

        <form onSubmit={submit} className="bg-white p-8 shadow-sm space-y-5">
          <div>
            <label className="text-xs tracking-widest uppercase text-[#5A5040] mb-1.5 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              className="w-full border border-[#EDE6D4] px-4 py-2.5 text-sm text-[#1C1711] outline-none focus:border-[#A8975E]"
            />
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase text-[#5A5040] mb-1.5 block">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              className="w-full border border-[#EDE6D4] px-4 py-2.5 text-sm text-[#1C1711] outline-none focus:border-[#A8975E]"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#A8975E] text-white py-2.5 text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
