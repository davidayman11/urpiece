import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { put } from "@vercel/blob";
import { productSalePrice } from "@/lib/pricing";
import { parseFieldModes, parseCustomFields } from "@/lib/checkout-fields";

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();
    const name = fd.get("name") as string;
    const email = fd.get("email") as string;
    const phone = fd.get("phone") as string | null;
    const address = fd.get("address") as string;
    const city = fd.get("city") as string | null;
    const itemsJson = fd.get("items") as string;
    const discount = Math.max(0, parseFloat((fd.get("discount") as string) || "0") || 0);
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
    if (modes.address === "required" && !address?.trim()) return bad("Street address is required");
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

    const items: { productId: string; variantId: string; productName: string; variantName: string; price: number; quantity: number }[] =
      JSON.parse(itemsJson);

    // Validate variants and get cost prices
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const variant = await prisma.variant.findUnique({
          where: { id: item.variantId },
          include: { product: { select: { salePercent: true, saleType: true, saleStartsAt: true, saleEndsAt: true } } },
        });
        if (!variant) throw new Error(`Variant ${item.variantId} not found`);
        if (variant.inventory < item.quantity) throw new Error(`Insufficient stock for ${item.productName}`);
        return { ...item, price: productSalePrice(variant.price, variant.product), costPrice: variant.costPrice };
      })
    );

    // Prices and shipping are computed on the server
    const subtotal = enrichedItems.reduce((s, i) => s + i.price * i.quantity, 0);
    let shippingFee = 0;
    if (activeZones > 0) {
      const zone = city ? await prisma.shippingZone.findFirst({ where: { city, isActive: true } }) : null;
      if (!zone) {
        return NextResponse.json({ error: "Please select a valid city" }, { status: 400 });
      }
      shippingFee = zone.price;
    }
    const afterDiscount = Math.max(0, subtotal - discount);
    if (settings?.freeShippingMin && afterDiscount >= settings.freeShippingMin) shippingFee = 0;
    const total = afterDiscount + shippingFee;

    // Handle screenshot upload
    let screenshotPath: string | null = null;
    if (screenshot) {
      const ext = screenshot.type === "image/png" ? "png" : "jpg";
      const filename = `payments/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const blob = await put(filename, screenshot, { access: "public" });
      screenshotPath = blob.url;
    }

    // Find or create customer
    const orderName = name?.trim() || "Guest";
    const orderEmail = email?.trim() || "";
    let customer: { id: string } | null = null;
    if (orderEmail) {
      customer = await prisma.customer.findUnique({ where: { email: orderEmail } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: { email: orderEmail, name: orderName, phone: phone || undefined, address: address || undefined, city: city || undefined },
        });
      }
    }

    // Validate promo code if provided
    let promoCodeRecord = null;
    if (promoCode) {
      promoCodeRecord = await prisma.promoCode.findUnique({ where: { code: promoCode } });
    }

    const orderNumber = generateOrderNumber();

    // Create order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer?.id,
          customerName: orderName,
          customerEmail: orderEmail,
          customerPhone: phone || undefined,
          shippingAddress: JSON.stringify({ address: address || "", city: city || "" }),
          subtotal,
          discount,
          shippingFee,
          customData: JSON.stringify(customData),
          total,
          promoCodeId: promoCodeRecord?.id,
          promoCodeUsed: promoCode || undefined,
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
      if (promoCodeRecord) {
        await tx.promoCode.update({
          where: { id: promoCodeRecord.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return o;
    });

    return NextResponse.json({ orderNumber: order.orderNumber }, { status: 201 });
  } catch (error) {
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
