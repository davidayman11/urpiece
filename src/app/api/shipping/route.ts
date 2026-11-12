import { NextResponse } from "next/server";
import { loadShipping } from "@/lib/shipping";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await loadShipping());
}
