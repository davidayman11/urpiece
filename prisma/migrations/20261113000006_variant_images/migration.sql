-- Photos that belong to one specific variant (e.g. Gold vs Silver)
ALTER TABLE "Variant" ADD COLUMN "images" TEXT NOT NULL DEFAULT '[]';
