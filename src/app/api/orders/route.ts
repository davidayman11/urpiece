import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { put } from "@vercel/blob";
import { quoteOrder, QuoteError } from "@/lib/pricing-engine";
import { parseFieldModes, parseCustomFields } from "@/lib/checkout-fields";
import { getCustomer } from "@/lib/customer-auth";

export async function POST(req: NextRequest) {
  try {
    // Orders need a signed-in customer account
    const account = await getCustomer();
    if (!account) {
      return NextResponse.json({ error: "Please sign in to place an order" }, { status: 401 });
    }

    const fd = await req.formData();
    const name = fd.get("name") as string;
    const email = account.email; // always the account email
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
    const activeZones = await prisma.shippingZone.count({ where: { isActive: true } });
    const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

    if (!itemsJson) return bad("Missing required fields");
    if (modes.name === "required" && !name?.trim()) return bad("Name is required");
    if (modes.email === "required" && !email?.trim()) return bad("Email is required");
    if (modes.phone === "required" && !phone?.trim()) return bad("Phone number is required");
    if (modes.address === "required" && !address?.trim()) return bad("Street is required");
    if (modes.governorate === "required" && !governorate?.trim()) return bad("Governorate is required");
    if (modes.building === "required" && !building?.trim()) return bad("Building is required");
    if ((modes.city === "required" || activeZones > 0) && !city?.trim()) return bad("City is required");

    // Admin-defined custom fields: store answers keyed by the label (snapshot)
    let customAnswers: Record<string, string> = {};
    try { customAnswers = JSON.parse((fd.get("custom") as string) || "{}") || {}; } catch { /* ignore */ }
    const customData: Record<string, string> = {};
    for (const f of customDefs) {
      const v = String(customAnswers[f.id] ?? "").trim().slice(0, 1000);
      if (!v) {
        if (f.required) return bad(`${f.label} is required`);
        continue;
      }
      if (f.type === "select" && !(f.options || []).includes(v)) return bad(`Invalid choice for ${f.label}`);
      customData[f.label] = v;
    }

    // Every price, discount and the shipping fee are computed on the server
    let rawItems: { variantId: string; quantity: number }[] = [];
    try { rawItems = JSON.parse(itemsJson); } catch { return bad("Invalid cart"); }
    const quote = await quoteOrder({ items: rawItems, promoCode, city, strict: true });
    for (const l of quote.lines) {
      if (l.inventory < l.quantity) return bad(`Insufficient stock for ${l.productName}`);
    }
    const { subtotal, discount, shippingFee, total } = quote;
    const enrichedItems = quote.lines.map((l) => ({
      productId: l.productId,
      variantId: l.variantId,
      productName: l.productName,
      variantName: l.variantName,
      price: l.unitPrice,
      costPrice: l.costPrice,
      quantity: l.quantity,
    }));

    // Handle screenshot upload
    let screenshotPath: string | null = null;
    if (screenshot) {
      const ext = screenshot.type === "image/png" ? "png" : "jpg";
      const filename = `payments/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const blob = await put(filename, screenshot, { access: "public" });
      screenshotPath = blob.url;
    }

    // Order belongs to the signed-in account
    const orderName = name?.trim() || account.name || "Guest";
    const orderEmail = account.email;
    const customer = { id: account.id };

    const orderNumber = generateOrderNumber();

    // Create order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          customerName: orderName,
          customerEmail: orderEmail,
          customerPhone: phone || undefined,
          shippingAddress: JSON.stringify({ address: address || "", city: city || "", governorate: governorate || "", building: building || "" }),
          subtotal,
          discount,
          shippingFee,
          customData: JSON.stringify(customData),
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
    if (fd.get("saveAddress") === "1" && (address?.trim() || building?.trim())) {
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

    return NextResponse.json({ orderNumber: order.orderNumber }, { status: 201 });
  } catch (error) {
    if (error instanceof QuoteError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Admin only - no public order listing
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
