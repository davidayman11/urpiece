import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { parseImgs, coverImage } from "@/lib/product-images";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    include: { variants: true, category: true },
    orderBy: { createdAt: "desc" },
  });

  const rows: Record<string, string | number>[] = [];
  for (const p of products) {
    const cover = coverImage(p.images, p.variants) || "";
    if (p.variants.length === 0) {
      rows.push({
        ID: p.id,
        Name: p.name,
        "Name (Arabic)": p.nameAr || "",
        Slug: p.slug,
        Category: p.category?.name || "",
        Active: p.isActive ? "Yes" : "No",
        Featured: p.isFeatured ? "Yes" : "No",
        "Variant Name": "",
        "Variant Name (Arabic)": "",
        SKU: "",
        "Selling Price": "",
        "Cost Price": "",
        Stock: "",
        "Cover Image": cover,
      });
    } else {
      for (const v of p.variants) {
        rows.push({
          ID: p.id,
          Name: p.name,
          "Name (Arabic)": p.nameAr || "",
          Slug: p.slug,
          Category: p.category?.name || "",
          Active: p.isActive ? "Yes" : "No",
          Featured: p.isFeatured ? "Yes" : "No",
          "Variant Name": v.name,
          "Variant Name (Arabic)": v.nameAr || "",
          SKU: v.sku || "",
          "Selling Price": v.price,
          "Cost Price": v.costPrice,
          Stock: v.inventory,
          "Cover Image": coverImage(p.images, p.variants) || "",
        });
      }
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="products-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
