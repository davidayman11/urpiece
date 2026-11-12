import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import type { Customer } from "@prisma/client";

/**
 * Customer sessions are fully separate from the admin login (NextAuth):
 * their own cookie, so a customer can never be mistaken for an admin.
 */
const COOKIE = "urpiece_customer";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function createCustomerSession(customer: Pick<Customer, "id" | "sessionVersion">) {
  const token = await new SignJWT({ v: customer.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(customer.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearCustomerSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

/** The signed-in customer, or null. Never exposes the password hash. */
export async function getCustomer() {
  try {
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const c = await prisma.customer.findUnique({ where: { id: payload.sub } });
    if (!c || !c.passwordHash) return null;
    if ((payload.v as number | undefined) !== c.sessionVersion) return null; // password changed / signed out everywhere
    const { passwordHash: _omit, ...safe } = c;
    void _omit;
    return safe;
  } catch {
    return null;
  }
}

export type SessionCustomer = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;

/** Only allow same-site relative redirects like "/checkout". */
export function safeNext(next: string | null | undefined, fallback = "/account") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
