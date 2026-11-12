import * as webpush from "web-push";
import { prisma } from "@/lib/prisma";

const KEY = "vapid";

/** VAPID keys are created once and kept in the database, so no environment setup is needed. */
async function getVapid(): Promise<{ publicKey: string; privateKey: string }> {
  const row = await prisma.siteSetting.findUnique({ where: { key: KEY } });
  if (row) {
    try {
      const v = JSON.parse(row.value);
      if (v.publicKey && v.privateKey) return v;
    } catch {}
  }
  const keys = webpush.generateVAPIDKeys();
  await prisma.siteSetting.upsert({
    where: { key: KEY },
    update: { value: JSON.stringify(keys) },
    create: { key: KEY, value: JSON.stringify(keys) },
  });
  return keys;
}

export async function getPublicKey() {
  return (await getVapid()).publicKey;
}

/** Sends a push to every subscribed admin device. Never throws. */
export async function pushToAdmins(payload: { title: string; body: string; url: string }) {
  try {
    const subs = await prisma.pushSubscription.findMany();
    if (subs.length === 0) return;
    const { publicKey, privateKey } = await getVapid();
    webpush.setVapidDetails("mailto:admin@urpiece.local", publicKey, privateKey);
    const data = JSON.stringify(payload);
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, data, { TTL: 86400 });
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          // device unsubscribed or expired: forget it
          if (code === 404 || code === 410) await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
          else console.error("Push failed:", code);
        }
      })
    );
  } catch (e) {
    console.error("Push error:", e);
  }
}
