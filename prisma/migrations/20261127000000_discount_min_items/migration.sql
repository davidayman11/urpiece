-- Order discounts can also require a minimum number of products in the cart (0 = no minimum)
ALTER TABLE "DiscountRule" ADD COLUMN "minItems" INTEGER NOT NULL DEFAULT 0;
