import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Site-wide settings (footer / navbar)
  const existingSettings = await prisma.siteSection.findFirst({
    where: { pageSlug: "site", type: "settings" },
  });
  if (!existingSettings) {
    await prisma.siteSection.create({
      data: {
        pageSlug: "site",
        type: "settings",
        isVisible: true,
        sortOrder: 0,
        content: JSON.stringify({
          tagline: "Your Glow, Your Piece",
          brandDescription: "Premium jewelry and accessories curated for the woman who knows her worth.",
          contactEmail: "hello@urpiece.com",
          paymentNote: "Payment via InstaPay",
          shippingNote: "Orders shipped within 2–5 business days",
          copyright: `© ${new Date().getFullYear()} UrPiece. All rights reserved.`,
        }),
      },
    });
    console.log("✓ Created site settings section");
  } else {
    console.log("⟳ Site settings already exists, skipping");
  }

  // About page
  const existingAbout = await prisma.siteSection.findFirst({
    where: { pageSlug: "about", type: "about" },
  });
  if (!existingAbout) {
    await prisma.siteSection.create({
      data: {
        pageSlug: "about",
        type: "about",
        isVisible: true,
        sortOrder: 0,
        content: JSON.stringify({
          eyebrow: "Our Story",
          heading: "About UrPiece",
          body: "UrPiece was born from a belief that every woman deserves pieces that reflect her inner radiance. We curate premium jewelry and accessories designed to celebrate the woman who knows her worth.\n\nEach piece in our collection is chosen with care — for quality, craftsmanship, and the feeling it gives when you wear it. We believe accessories aren't just ornaments; they're expressions.\n\nWe're committed to making premium pieces accessible, with a personal shopping experience and careful attention to every order.",
          quote: "Your Glow, Your Piece.",
        }),
      },
    });
    console.log("✓ Created about page section");
  } else {
    console.log("⟳ About section already exists, skipping");
  }

  // Contact page
  const existingContact = await prisma.siteSection.findFirst({
    where: { pageSlug: "contact", type: "contact" },
  });
  if (!existingContact) {
    await prisma.siteSection.create({
      data: {
        pageSlug: "contact",
        type: "contact",
        isVisible: true,
        sortOrder: 0,
        content: JSON.stringify({
          eyebrow: "Get in Touch",
          heading: "Contact Us",
          supportEmail: "hello@urpiece.com",
          paymentNote: "We accept payment via InstaPay. After placing your order, you'll receive instructions to complete your transfer.",
          shippingNote: "Orders are shipped within 2–5 business days. Delivery times vary by location.",
        }),
      },
    });
    console.log("✓ Created contact page section");
  } else {
    console.log("⟳ Contact section already exists, skipping");
  }

  // Update existing hero section to include tagline + secondaryText/secondaryUrl
  const heroSection = await prisma.siteSection.findFirst({
    where: { pageSlug: "home", type: "hero" },
  });
  if (heroSection) {
    const existing = JSON.parse(heroSection.content || "{}");
    if (!existing.tagline) {
      await prisma.siteSection.update({
        where: { id: heroSection.id },
        data: {
          content: JSON.stringify({
            ...existing,
            tagline: existing.tagline || "Your Glow, Your Piece",
            secondaryText: existing.secondaryText || "Our Story",
            secondaryUrl: existing.secondaryUrl || "/about",
          }),
        },
      });
      console.log("✓ Updated hero section with tagline + secondary link");
    } else {
      console.log("⟳ Hero section already has tagline, skipping");
    }
  } else {
    console.log("⚠ No hero section found — create one in admin");
  }

  console.log("\nAll done!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
