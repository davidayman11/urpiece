"use client";

import { useEffect, useState } from "react";

function b64ToUint8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type State = "loading" | "unsupported" | "blocked" | "off" | "on";

export default function NotificationsButton() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
      if (Notification.permission === "denied") return setState("blocked");
      try {
        const reg = await navigator.serviceWorker.register("/admin-sw.js");
        const sub = await reg.pushManager.getSubscription();
        setState(sub && Notification.permission === "granted" ? "on" : "off");
      } catch { setState("unsupported"); }
    })();
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState(perm === "denied" ? "blocked" : "off"); return; }
      const reg = await navigator.serviceWorker.register("/admin-sw.js");
      const { publicKey } = await fetch("/api/admin/push").then((r) => r.json());
      const sub = (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(publicKey) }));
      const res = await fetch("/api/admin/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      if (!res.ok) throw new Error();
      setState("on");
    } catch { alert("Could not turn on notifications on this device."); }
    setBusy(false);
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/admin-sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/admin/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setState("off");
    } catch {}
    setBusy(false);
  };

  if (state === "loading") return null;
  if (state === "unsupported") return <span className="text-xs text-gray-400" title="On iPhone: add this site to the Home Screen first">Notifications not supported here</span>;
  if (state === "blocked") return <span className="text-xs text-red-500" title="Allow notifications for this site in the browser settings">Notifications blocked</span>;
  return state === "on" ? (
    <button onClick={disable} disabled={busy} className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 disabled:opacity-60">🔔 Order alerts on</button>
  ) : (
    <button onClick={enable} disabled={busy} className="text-xs text-white bg-[#A8975E] rounded-full px-3 py-1 hover:bg-[#8A7A4A] disabled:opacity-60">🔔 Turn on order alerts</button>
  );
}
