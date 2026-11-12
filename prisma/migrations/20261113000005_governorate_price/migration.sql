-- Shipping is now priced per governorate (cities are just a list to choose from)
ALTER TABLE "Governorate" ADD COLUMN "shippingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Keep today's prices: a governorate takes the highest price of its existing cities (so nobody is under-charged)
UPDATE "Governorate" g
SET "shippingPrice" = COALESCE((SELECT MAX(z."price") FROM "ShippingZone" z WHERE z."governorateId" = g."id"), 0);
