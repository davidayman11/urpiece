"use client";

import { createContext, useContext } from "react";

const Ctx = createContext(0);

/** Number of low-stock variants, shown as a badge in the admin sidebar. */
export function StockProvider({ count, children }: { count: number; children: React.ReactNode }) {
  return <Ctx.Provider value={count}>{children}</Ctx.Provider>;
}
export const useLowStockCount = () => useContext(Ctx);
