import { NextRequest, NextResponse } from "next/server";
import { quoteOrder, QuoteError } from "@/lib/pricing-engine";
import { getT } from "@/lib/texts/server";

export async function POST(req: NextRequest) {
  const t = await getT();
  try {
    const { items, promoCode, city, governorate } = await req.json();
    const quote = await quoteOrder({
      items: Array.isArray(items) ? items : [],
      promoCode,
      city,
      governorate,
    }, t);
    return NextResponse.json(quote);
  } catch (e) {
    if (e instanceof QuoteError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("Quote error:", e);
    return NextResponse.json({ error: t("checkout.msg.quoteFailed") }, { status: 500 });
  }
}
