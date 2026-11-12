import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { put } from "@vercel/blob";
import { quoteOrder, QuoteError } from "@/lib/pricing-engine";
import { parseFieldModes, parseCustomFields } from "@/lib/checkout-fields";
import { getCustomer } from "@/lib/customer-auth";
import { loadShipping } from "@/lib/shipping";
import { getT } from "@/lib/texts/server";

export async function POST(req: NextRequest) {
  const t = await getT();
  try {
    // Signed-in customers get the order on their account; guests can order too
    const account = await getCustomer();

    const fd = await req.formData();
    const name = fd.get("name") as string;
    const email = account ? account.email : String(fd.get("email") || "").trim();
    const phone = fd.get("phone") as string | null;
    const address = fd.get("address") as string;
    const city = fd.get("city") as string | null;
    const governorate = fd.get("governorate") as string | null;
    const building = fd.get("building") as string | null;
    const itemsJson = fd.get("items") as string;
    const promoCode = fd.get("promoCode") as string | null;
    const screenshot = fd.get("screenshot") as File | null;

    const settings = await prisma.paymentSettings.findFirst();
    const modes = parseFieldModes(settings?.requiredFields);
    const customDefs = parseCustomFields(settings?.customFields);
    const shipping = await loadShipping();
    const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

    if (!itemsJson) return bad(t("checkout.msg.missingFields"));
    if (modes.name === "required" && !name?.trim()) return bad(t("checkout.msg.nameRequired"));
    if (modes.email === "required" && !email?.trim()) return bad(t("checkout.msg.emailRequired"));
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(t("checkout.msg.emailInvalid"));
    if (modes.phone === "required" && !phone?.trim()) return bad(t("checkout.msg.phoneRequired"));
    if (modes.address === "required" && !address?.trim()) return bad(t("checkout.msg.streetRequired"));
    if ((modes.governorate === "required" || shipping.adminDriven) && !governorate?.trim()) return bad(t("checkout.msg.governorateRequired"));
    if (modes.building === "required" && !building?.trim()) return bad(t("checkout.msg.buildingRequired"));
    if ((modes.city === "required" || shipping.hasZones) && !city?.trim()) return bad(t("checkout.msg.cityRequired"));

    // Admin-defined custom fields: store answers keyed by the label (snapshot)
    let customAnswers: Record<string, string> = {};
    try { customAnswers = JSON.parse((fd.get("custom") as string) || "{}") || {}; } catch { /* ignore */ }
    const customData: Record<string, string> = {};
    for (const f of customDefs) {
      const v = String(customAnswers[f.id] ?? "").trim().slice(0, 1000);
      if (!v) {
        if (f.required) return bad(t("checkout.msg.customRequired", { label: f.label }));
        continue;
      }
      if (f.type === "select" && !(f.options || []).includes(v)) return bad(t("checkout.msg.customInvalid", { label: f.label }));
      customData[f.label] = v;
    }

    // Every price, discount and the shipping fee are computed on the server
    let rawItems: { variantId: string; quantity: number }[] = [];
    try { rawItems = JSON.parse(itemsJson); } catch { return bad(t("checkout.msg.invalidCart")); }
    const quote = await quoteOrder({ items: rawItems, promoCode, city, governorate, strict: true, signedIn: !!account }, t);
    // Stock is checked per variant across ALL lines (a bundle and a normal purchase can share a variant)
    const wanted = new Map<string, { qty: number; stock: number; name: string }>();
    for (const l of quote.lines) {
      const cur = wanted.get(l.variantId) || { qty: 0, stock: l.inventory, name: l.productName };
      cur.qty += l.quantity;
      wanted.set(l.variantId, cur);
    }
    for (const w of wanted.values()) {
      if (w.stock < w.qty) return bad(t("checkout.msg.insufficientStock", { name: w.name }));
    }
    const { subtotal, discount, shippingFee, total } = quote;

    // Deposit: only when a rule applies, and the customer chose it (or full payment isn't allowed)
    const wantsDeposit = fd.get("paymentOption") === "deposit";
    const useDeposit = quote.deposit.enabled && (wantsDeposit || !quote.deposit.allowFull);
    const paymentType = useDeposit ? "DEPOSIT" : "FULL";
    const amountDue = useDeposit ? quote.deposit.amount : total;
    const balanceDue = useDeposit ? quote.deposit.balance : 0;
    const enrichedItems = quote.lines.map((l) => ({
      productId: l.productId,
      variantId: l.variantId,
      productName: l.productName,
      variantName: l.variantName,
      price: l.unitPrice,
      costPrice: l.costPrice,
      quantity: l.quantity,
      bundleName: l.bundleName || null,
    }));

    // Handle screenshot upload
    let screenshotPath: string | null = null;
    if (screenshot) {
      const ext = screenshot.type === "image/png" ? "png" : "jpg";
      const filename = `payments/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const blob = await put(filename, screenshot, { access: "public" });
      screenshotPath = blob.url;
    }

    const orderName = name?.trim() || account?.name || "Guest";
    const orderEmail = email;

    // Which customer record does this order belong to?
    let customerId: string | null = null;
    if (account) {
      customerId = account.id;
    } else if (orderEmail) {
      const existing = await prisma.customer.findFirst({ where: { email: { equals: orderEmail, mode: "insensitive" } } });
      if (!existing) {
        const created = await prisma.customer.create({
          data: { email: orderEmail.toLowerCase(), name: orderName, phone: phone || null, address: [building, address].filter(Boolean).join(", ") || null, city: city || null },
        });
        customerId = created.id;
      } else if (!existing.passwordHash) {
        customerId = existing.id; // an earlier guest record
      }
      // an email that belongs to a registered account is NOT attached to it (anyone could type that email)
    }
    // Secret token so a guest can open their order page from a link
    const accessToken = randomBytes(16).toString("hex");

    const orderNumber = generateOrderNumber();

    // Create order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderNumber,
          customerId: customerId ?? undefined,
          accessToken,
          customerName: orderName,
          customerEmail: orderEmail,
          customerPhone: phone || undefined,
          shippingAddress: JSON.stringify({ address: address || "", city: city || "", governorate: governorate || "", building: building || "" }),
          subtotal,
          discount,
          shippingFee,
          customData: JSON.stringify(customData),
          paymentType,
          amountDue,
          balanceDue,
          total,
          promoCodeId: quote.promoId || undefined,
          promoCodeUsed: quote.promoCode || undefined,
          status: "PENDING",
          paymentStatus: screenshot ? "UPLOADED" : "AWAITING_UPLOAD",
          paymentScreenshot: screenshotPath || undefined,
          items: {
            create: enrichedItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName || "",
              price: item.price,
              costPrice: item.costPrice,
              quantity: item.quantity,
              bundleName: item.bundleName,
            })),
          },
          statusHistory: {
            create: {
              status: "PENDING",
              note: "Order placed",
            },
          },
        },
      });

      // Decrement inventory
      for (const item of enrichedItems) {
        await tx.variant.update({
          where: { id: item.variantId },
          data: { inventory: { decrement: item.quantity } },
        });
      }

      // Increment promo usage
      if (quote.promoId) {
        await tx.promoCode.update({
          where: { id: quote.promoId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return o;
    });

    // Optionally remember this address on the account (best effort, never blocks the order)
    if (account && fd.get("saveAddress") === "1" && (address?.trim() || building?.trim())) {
      try {
        const existing = await prisma.address.findMany({ where: { customerId: account.id } });
        const same = existing.some(
          (a) =>
            a.street === (address || "") && a.building === (building || "") &&
            a.city === (city || "") && a.governorate === (governorate || "")
        );
        if (!same && existing.length < 10) {
          await prisma.address.create({
            data: {
              customerId: account.id,
              fullName: orderName,
              phone: phone || "",
              governorate: governorate || "",
              city: city || "",
              building: building || "",
              street: address || "",
              isDefault: existing.length === 0,
            },
          });
        }
      } catch (e) {
        console.error("Could not save address:", e);
      }
    }

    return NextResponse.json({ orderNumber: order.orderNumber, accessToken }, { status: 201 });
  } catch (error) {
    if (error instanceof QuoteError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : t("checkout.msg.orderFailed") },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Admin only - no public order listing
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
