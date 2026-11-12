"use client";

import { createContext, useContext, useState } from "react";

interface Ctx { variantId: string; setVariantId: (id: string) => void }
const VariantCtx = createContext<Ctx | null>(null);

/** Shares the chosen variant between the photo gallery and the buy box on a product page. */
export function VariantSelectionProvider({ initialVariantId, children }: { initialVariantId: string; children: React.ReactNode }) {
  const [variantId, setVariantId] = useState(initialVariantId);
  return <VariantCtx.Provider value={{ variantId, setVariantId }}>{children}</VariantCtx.Provider>;
}

export function useVariantSelection(): Ctx | null {
  return useContext(VariantCtx);
}
