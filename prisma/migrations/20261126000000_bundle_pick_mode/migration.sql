-- Build-your-own bundles: the customer picks pickMin..pickMax of the listed products for one fixed price
ALTER TABLE "Bundle" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'FIXED';
ALTER TABLE "Bundle" ADD COLUMN "pickMin" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Bundle" ADD COLUMN "pickMax" INTEGER NOT NULL DEFAULT 0;
