import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

async function main() {
  // No password is stored in the code (this repository is public).
  // Set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD, or a random password is created and printed once below.
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@urpiece.com";
  const generated = !process.env.SEED_ADMIN_PASSWORD;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || randomBytes(12).toString("base64url");
  const hash = await bcrypt.hash(adminPassword, 10);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hash,
      name: "Admin",
      role: "ADMIN",
    },
  });

  console.log(`✓ Admin user: ${adminEmail}${generated ? ` / password (shown once, save it): ${adminPassword}` : " (password from SEED_ADMIN_PASSWORD)"}`);

  // Seed default payment settings
  const existing = await prisma.paymentSettings.findFirst();
  if (!existing) {
    await prisma.paymentSettings.create({
      data: {
        instapayId: "urpiece",
        instapayPhone: "01000000000",
        instructions: "Send the exact order total to our InstaPay ID, then upload your payment screenshot.",
      },
    });
    console.log("✓ Payment settings created");
  }

  // Seed a default hero section
  const heroSection = await prisma.siteSection.findFirst({ where: { pageSlug: "home", type: "hero" } });
  if (!heroSection) {
    await prisma.siteSection.create({
      data: {
        pageSlug: "home",
        type: "hero",
        isVisible: true,
        sortOrder: 0,
        content: JSON.stringify({
          heading: "Your Glow,\nYour Piece.",
          subheading: "Curated jewelry for the woman who knows her worth.",
          ctaText: "Shop Now",
          ctaLink: "/shop",
        }),
      },
    });
    console.log("✓ Homepage hero section seeded");
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
