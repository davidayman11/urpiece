import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { put } from "@vercel/blob";
import { salePrice } from "@/lib/pricing";
import { parseRequired } from "@/lib/checkout-fields";

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
    const required = parseRequired(settings?.requiredFields);
    const activeZones = await prisma.shippingZone.count({ where: { isActive: true } });
    if (!name || !email || !itemsJson) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (required.phone && !phone?.trim()) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }
    if (required.address && !address?.trim()) {
      return NextResponse.json({ error: "Street address is required" }, { status: 400 });
    }
    if ((required.city || activeZones > 0) && !city?.trim()) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }

    const items: { productId: string; variantId: string; productName: string; variantName: string; price: number; quantity: number }[] =
      JSON.parse(itemsJson);

    // Validate variants and get cost prices
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const variant = await prisma.variant.findUnique({
          where: { id: item.variantId },
          include: { product: { select: { salePercent: true, saleType: true } } },
        });
        if (!variant) throw new Error(`Variant ${item.variantId} not found`);
        if (variant.inventory < item.quantity) throw new Error(`Insufficient stock for ${item.productName}`);
        return { ...item, price: salePrice(variant.price, variant.product.salePercent, variant.product.saleType), costPrice: variant.costPrice };
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
    const total = Math.max(0, subtotal - discount) + shippingFee;

    // Handle screenshot upload
    let screenshotPath: string | null = null;
    if (screenshot) {
      const ext = screenshot.type === "image/png" ? "png" : "jpg";
      const filename = `payments/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const blob = await put(filename, screenshot, { access: "public" });
      screenshotPath = blob.url;
    }

    // Find or create customer
    let customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { email, name, phone: phone || undefined, address: address || undefined, city: city || undefined },
      });
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
          customerId: customer!.id,
          customerName: name,
          customerEmail: email,
          customerPhone: phone || undefined,
          shippingAddress: JSON.stringify({ address: address || "", city: city || "" }),
          subtotal,
          discount,
          shippingFee,
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
