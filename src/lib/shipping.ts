import { prisma } from "@/lib/prisma";

export interface ShippingConfig {
  /** true when governorates are managed in the admin: shipping is priced per governorate */
  adminDriven: boolean;
  /** Active governorates with their shipping price and the cities listed under them (customers can also type another city) */
  governorates: { name: string; price: number; cities: string[] }[];
  /** Flat priced city list, used only when no governorates are set up (older setup) */
  zones: { city: string; price: number }[];
  /** Is there anything to choose from at all? */
  hasZones: boolean;
}

export async function loadShipping(): Promise<ShippingConfig> {
  const govs = await prisma.governorate.findMany({
    where: { isActive: true },
    include: { zones: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { city: "asc" }] } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const governorates = govs.map((g) => ({ name: g.name, price: g.shippingPrice, cities: g.zones.map((z) => z.city) }));
  const adminDriven = governorates.length > 0;

  const legacy = adminDriven
    ? []
    : await prisma.shippingZone.findMany({
        where: { isActive: true, governorateId: null },
        orderBy: [{ sortOrder: "asc" }, { city: "asc" }],
      });

  return {
    adminDriven,
    governorates,
    zones: legacy.map((z) => ({ city: z.city, price: z.price })),
    hasZones: adminDriven || legacy.length > 0,
  };
}

/** Shipping fee for a place, or null if it isn't deliverable. With governorates, the fee depends only on the governorate. */
export function findFee(cfg: ShippingConfig, governorate: string | null | undefined, city: string | null | undefined): number | null {
  if (cfg.adminDriven) {
    const g = cfg.governorates.find((x) => x.name === governorate);
    return g ? g.price : null;
  }
  const z = cfg.zones.find((x) => x.city === city);
  return z ? z.price : null;
}
