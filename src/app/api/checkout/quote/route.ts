import { NextRequest, NextResponse } from "next/server";
import { quoteOrder, QuoteError } from "@/lib/pricing-engine";
import { getT } from "@/lib/texts/server";
import { getLang } from "@/lib/lang-server";
import { getCustomer } from "@/lib/customer-auth";

export async function POST(req: NextRequest) {
  const t = await getT();
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: t("checkout.msg.invalidCart") }, { status: 400 });
    const { items, promoCode, city, governorate } = body;
    const quote = await quoteOrder({
      items: Array.isArray(items) ? items : [],
      promoCode,
      city,
      governorate,
      signedIn: !!(await getCustomer()),
      lang: await getLang(),
    }, t);
    return NextResponse.json(quote);
  } catch (e) {
    if (e instanceof QuoteError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("Quote error:", e);
    return NextResponse.json({ error: t("checkout.msg.quoteFailed") }, { status: 500 });
  }
}
