-- Promo codes can require the customer to be signed in
ALTER TABLE "PromoCode" ADD COLUMN "requiresLogin" BOOLEAN NOT NULL DEFAULT false;

-- Secret link token so a guest (no account) can open their own order page
ALTER TABLE "Order" ADD COLUMN "accessToken" TEXT;
