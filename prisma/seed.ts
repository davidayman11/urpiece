import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("admin123", 10);

  await prisma.adminUser.upsert({
    where: { email: "admin@urpiece.com" },
    update: {},
    create: {
      email: "admin@urpiece.com",
      password: hash,
      name: "Admin",
      role: "ADMIN",
    },
  });

  console.log("✓ Admin user: admin@urpiece.com / admin123");

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
