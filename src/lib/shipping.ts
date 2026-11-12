import { prisma } from "@/lib/prisma";

export interface ShippingConfig {
  /** true when governorates are managed in the admin (then city depends on governorate) */
  adminDriven: boolean;
  /** Governorates that have at least one active city (admin-managed mode) */
  governorates: { name: string; cities: { city: string; price: number }[] }[];
  /** Flat city list used when no governorates are set up (old behaviour) */
  zones: { city: string; price: number }[];
  /** Is there anything to choose from at all? */
  hasZones: boolean;
}

export async function loadShipping(): Promise<ShippingConfig> {
  const all = await prisma.shippingZone.findMany({
    where: { isActive: true },
    include: { governorate: true },
    orderBy: [{ sortOrder: "asc" }, { city: "asc" }],
  });
  const govOrder = await prisma.governorate.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  const governorates = govOrder
    .map((g) => ({
      name: g.name,
      cities: all.filter((z) => z.governorateId === g.id).map((z) => ({ city: z.city, price: z.price })),
    }))
    .filter((g) => g.cities.length > 0);

  const adminDriven = governorates.length > 0;
  return {
    adminDriven,
    governorates,
    zones: adminDriven ? [] : all.map((z) => ({ city: z.city, price: z.price })),
    hasZones: adminDriven || all.length > 0,
  };
}

/** Shipping fee for a place, or null if it isn't deliverable. */
export function findFee(cfg: ShippingConfig, governorate: string | null | undefined, city: string | null | undefined): number | null {
  if (cfg.adminDriven) {
    const g = cfg.governorates.find((x) => x.name === governorate);
    const c = g?.cities.find((x) => x.city === city);
    return c ? c.price : null;
  }
  const z = cfg.zones.find((x) => x.city === city);
  return z ? z.price : null;
}
