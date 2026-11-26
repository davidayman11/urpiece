import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import sharp from "sharp";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fd = await req.formData();
  const file = fd.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });

  const folder = (fd.get("folder") as string) || "general";
  let body: Blob | Buffer = file;
  let ext = file.type.split("/")[1].replace("jpeg", "jpg");
  let contentType = file.type;

  // Shrink photos so the site stays fast and inside the free hosting limits:
  // at most 1600px wide (2400 for payment/QR images so they stay sharp), turned upright, saved as WebP.
  // Animated GIFs are kept as they are. If anything goes wrong, or it does not get smaller, the original is used.
  if (file.type !== "image/gif") {
    try {
      const original = Buffer.from(await file.arrayBuffer());
      const max = folder === "payments" ? 2400 : 1600;
      const small = await sharp(original).rotate().resize({ width: max, height: max, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      if (small.length < original.length) {
        body = small;
        ext = "webp";
        contentType = "image/webp";
      } else {
        body = original;
      }
    } catch (e) {
      console.error("image shrink failed, uploading the original", e);
    }
  }
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const blob = await put(filename, body, { access: "public", contentType });

  return NextResponse.json({ url: blob.url });
}
