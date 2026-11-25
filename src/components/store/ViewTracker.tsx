"use client";

import { useEffect } from "react";
import { addViewed } from "@/lib/recently-viewed";

/** Invisible: remembers that this product was viewed (for "Recommended for you"). */
export default function ViewTracker({ productId }: { productId: string }) {
  useEffect(() => { addViewed(productId); }, [productId]);
  return null;
}
