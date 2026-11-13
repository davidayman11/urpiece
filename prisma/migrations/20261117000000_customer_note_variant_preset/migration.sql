-- Add customer note to orders
ALTER TABLE "Order" ADD COLUMN "customerNote" TEXT;

-- Variant presets
CREATE TABLE "VariantPreset" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "values"    TEXT NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
