import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // ── Categories ──────────────────────────────────────────────
  const categories = [
    {
      name: "Necklaces",
      slug: "necklaces",
      description: "Delicate chains and statement pendants for every occasion.",
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
      sortOrder: 0,
    },
    {
      name: "Earrings",
      slug: "earrings",
      description: "From subtle studs to cascading drops.",
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
      sortOrder: 1,
    },
    {
      name: "Rings",
      slug: "rings",
      description: "Stack them, layer them, make them yours.",
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80",
      sortOrder: 2,
    },
    {
      name: "Bracelets",
      slug: "bracelets",
      description: "Wrap your wrist in gold and intention.",
      image: "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=800&q=80",
      sortOrder: 3,
    },
  ];

  const catMap: Record<string, string> = {};
  for (const c of categories) {
    const existing = await prisma.category.findUnique({ where: { slug: c.slug } });
    if (existing) {
      catMap[c.slug] = existing.id;
      console.log(`Category exists: ${c.name}`);
    } else {
      const created = await prisma.category.create({ data: { ...c, isActive: true } });
      catMap[c.slug] = created.id;
      console.log(`✓ Category: ${c.name}`);
    }
  }

  // ── Products ─────────────────────────────────────────────────
  const products = [
    // NECKLACES
    {
      name: "Gold Crescent Necklace",
      slug: "gold-crescent-necklace",
      description: "A delicate crescent moon pendant on a fine 18k gold-plated chain. Lightweight and elegant, perfect for everyday wear.",
      categorySlug: "necklaces",
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
      ],
      variants: [
        { name: "Gold / 40cm", price: 450, costPrice: 180, inventory: 12, sku: "GCN-G-40" },
        { name: "Gold / 45cm", price: 480, costPrice: 190, inventory: 8, sku: "GCN-G-45" },
        { name: "Rose Gold / 40cm", price: 490, costPrice: 195, inventory: 6, sku: "GCN-RG-40" },
      ],
    },
    {
      name: "Layered Coin Necklace",
      slug: "layered-coin-necklace",
      description: "Three delicate chains of varying lengths, each holding a hammered gold coin. Effortlessly layered.",
      categorySlug: "necklaces",
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80",
        "https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=800&q=80",
      ],
      variants: [
        { name: "Gold", price: 680, costPrice: 260, inventory: 7, sku: "LCN-G" },
        { name: "Silver", price: 620, costPrice: 240, inventory: 5, sku: "LCN-S" },
      ],
    },
    {
      name: "Twisted Rope Necklace",
      slug: "twisted-rope-necklace",
      description: "A timeless rope-twist chain in 18k gold vermeil. Pairs beautifully alone or with pendants.",
      categorySlug: "necklaces",
      isFeatured: false,
      images: [
        "https://images.unsplash.com/photo-1620503374956-c942862f0372?w=800&q=80",
        "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80",
      ],
      variants: [
        { name: "Gold / 40cm", price: 520, costPrice: 200, inventory: 10, sku: "TRN-G-40" },
        { name: "Gold / 50cm", price: 580, costPrice: 220, inventory: 6, sku: "TRN-G-50" },
      ],
    },
    // EARRINGS
    {
      name: "Pearl Drop Earrings",
      slug: "pearl-drop-earrings",
      description: "Freshwater pearl drops framed in brushed gold. Minimal, refined, and effortlessly timeless.",
      categorySlug: "earrings",
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&q=80",
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
      ],
      variants: [
        { name: "White Pearl", price: 320, costPrice: 120, inventory: 15, sku: "PDE-W" },
        { name: "Blush Pearl", price: 350, costPrice: 130, inventory: 9, sku: "PDE-B" },
      ],
    },
    {
      name: "Gold Hoop Earrings",
      slug: "gold-hoop-earrings",
      description: "Classic gold hoops with a modern thin profile. Lightweight enough to wear all day.",
      categorySlug: "earrings",
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80",
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
      ],
      variants: [
        { name: "Small 20mm", price: 280, costPrice: 100, inventory: 20, sku: "GHE-S" },
        { name: "Medium 30mm", price: 320, costPrice: 120, inventory: 14, sku: "GHE-M" },
        { name: "Large 40mm", price: 380, costPrice: 140, inventory: 8, sku: "GHE-L" },
      ],
    },
    {
      name: "Crystal Stud Earrings",
      slug: "crystal-stud-earrings",
      description: "Brilliant-cut crystal studs set in 18k gold. Perfect for every occasion, day or night.",
      categorySlug: "earrings",
      isFeatured: false,
      images: [
        "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=800&q=80",
      ],
      variants: [
        { name: "Clear Crystal", price: 240, costPrice: 90, inventory: 18, sku: "CSE-C" },
        { name: "Rose Crystal", price: 260, costPrice: 95, inventory: 12, sku: "CSE-R" },
        { name: "Sapphire Crystal", price: 280, costPrice: 100, inventory: 7, sku: "CSE-S" },
      ],
    },
    // RINGS
    {
      name: "Thin Gold Band Ring",
      slug: "thin-gold-band-ring",
      description: "A slender 18k gold-plated band — the perfect everyday staple. Stack it with everything.",
      categorySlug: "rings",
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80",
        "https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=800&q=80",
      ],
      variants: [
        { name: "Size 5", price: 180, costPrice: 65, inventory: 10, sku: "TGB-5" },
        { name: "Size 6", price: 180, costPrice: 65, inventory: 15, sku: "TGB-6" },
        { name: "Size 7", price: 180, costPrice: 65, inventory: 12, sku: "TGB-7" },
        { name: "Size 8", price: 180, costPrice: 65, inventory: 8, sku: "TGB-8" },
      ],
    },
    {
      name: "Moonstone Signet Ring",
      slug: "moonstone-signet-ring",
      description: "A statement signet ring with a genuine moonstone cabochon. Otherworldly and bold.",
      categorySlug: "rings",
      isFeatured: false,
      images: [
        "https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=800&q=80",
      ],
      variants: [
        { name: "Gold / Size 6", price: 580, costPrice: 220, inventory: 4, sku: "MSR-G-6" },
        { name: "Gold / Size 7", price: 580, costPrice: 220, inventory: 6, sku: "MSR-G-7" },
        { name: "Silver / Size 6", price: 520, costPrice: 200, inventory: 3, sku: "MSR-S-6" },
      ],
    },
    // BRACELETS
    {
      name: "Delicate Chain Bracelet",
      slug: "delicate-chain-bracelet",
      description: "A whisper-thin gold chain bracelet. Understated luxury at its finest.",
      categorySlug: "bracelets",
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=800&q=80",
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80",
      ],
      variants: [
        { name: "Gold / 16cm", price: 290, costPrice: 110, inventory: 11, sku: "DCB-G-16" },
        { name: "Gold / 18cm", price: 310, costPrice: 115, inventory: 9, sku: "DCB-G-18" },
        { name: "Rose Gold / 16cm", price: 310, costPrice: 115, inventory: 7, sku: "DCB-RG-16" },
      ],
    },
    {
      name: "Beaded Gold Bracelet",
      slug: "beaded-gold-bracelet",
      description: "Hand-strung 14k gold-filled beads on an elastic cord. Easy, effortless, forever.",
      categorySlug: "bracelets",
      isFeatured: false,
      images: [
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80",
      ],
      variants: [
        { name: "2mm Beads", price: 220, costPrice: 80, inventory: 16, sku: "BGB-2" },
        { name: "3mm Beads", price: 260, costPrice: 95, inventory: 12, sku: "BGB-3" },
      ],
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      // Update images and category if already exists
      await prisma.product.update({
        where: { slug: p.slug },
        data: {
          images: JSON.stringify(p.images),
          categoryId: catMap[p.categorySlug],
          isFeatured: p.isFeatured,
          description: p.description,
        },
      });
      console.log(`↻ Updated: ${p.name}`);
      continue;
    }
    const { variants, categorySlug, images, ...rest } = p;
    await prisma.product.create({
      data: {
        ...rest,
        isActive: true,
        images: JSON.stringify(images),
        categoryId: catMap[categorySlug],
        variants: {
          create: variants.map((v) => ({ ...v, options: "{}", isActive: true })),
        },
      },
    });
    console.log(`✓ Created: ${p.name}`);
  }

  // ── Homepage Sections ─────────────────────────────────────────
  const sections = [
    {
      pageSlug: "home",
      type: "hero",
      sortOrder: 0,
      content: {
        heading: "Your Glow,\nYour Piece.",
        subheading: "Premium jewelry curated for the woman who knows her worth.",
        buttonText: "Shop Now",
        buttonUrl: "/shop",
        image: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1600&q=90",
      },
    },
    {
      pageSlug: "home",
      type: "editorial",
      sortOrder: 2,
      content: {
        eyebrow: "The Story Behind Every Piece",
        heading: "Crafted with intention,\nworn with purpose.",
        body: "Each piece in our collection is chosen for quality, craftsmanship, and the feeling it gives when you wear it. We believe accessories aren't just ornaments — they're expressions.",
        image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&q=85",
        buttonText: "Our Story",
        buttonUrl: "/about",
        imagePosition: "right",
      },
    },
    {
      pageSlug: "home",
      type: "banner",
      sortOrder: 4,
      content: {
        eyebrow: "New Arrivals",
        heading: "The Collection\nExpands.",
        body: "Fresh pieces added weekly. Shop the latest additions before they're gone.",
        buttonText: "Shop New Arrivals",
        buttonUrl: "/shop?sort=newest",
        image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&q=85",
      },
    },
  ];

  for (const s of sections) {
    const existing = await prisma.siteSection.findFirst({
      where: { pageSlug: s.pageSlug, type: s.type },
    });
    if (existing) {
      await prisma.siteSection.update({
        where: { id: existing.id },
        data: { content: JSON.stringify(s.content), sortOrder: s.sortOrder },
      });
      console.log(`↻ Updated section: ${s.type}`);
    } else {
      await prisma.siteSection.create({
        data: {
          pageSlug: s.pageSlug,
          type: s.type,
          isVisible: true,
          sortOrder: s.sortOrder,
          content: JSON.stringify(s.content),
        },
      });
      console.log(`✓ Section: ${s.type}`);
    }
  }

  console.log("\nDone.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
