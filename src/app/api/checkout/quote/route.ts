import { NextRequest, NextResponse } from "next/server";
import { quoteOrder, QuoteError } from "@/lib/pricing-engine";

export async function POST(req: NextRequest) {
  try {
    const { items, promoCode, city } = await req.json();
    const quote = await quoteOrder({
      items: Array.isArray(items) ? items : [],
      promoCode,
      city,
    });
    return NextResponse.json(quote);
  } catch (e) {
    if (e instanceof QuoteError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("Quote error:", e);
    return NextResponse.json({ error: "Could not calculate your total" }, { status: 500 });
  }
}
