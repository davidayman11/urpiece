"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/store/cart";

/** Mirrors the browser cart to the server for signed-in customers (so the admin can see abandoned carts). */
export default function CartSync({ signedIn }: { signedIn: boolean }) {
  useEffect(() => {
    if (!signedIn) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let last = "";

    const push = async () => {
      if (stopped) return;
      const items = useCartStore.getState().items;
      const body = JSON.stringify({ items });
      if (body === last) return;
      try {
        const res = await fetch("/api/cart/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body });
        if (res.status === 401) stopped = true;
        else if (res.ok) last = body;
      } catch {
        /* offline: try again on next change */
      }
    };
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(push, 1500);
    };

    schedule();
    const unsub = useCartStore.subscribe(schedule);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, [signedIn]);
  return null;
}
