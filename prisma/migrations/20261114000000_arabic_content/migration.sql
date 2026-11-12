-- Arabic versions of everything the admin types (shown when a customer switches the store to Arabic).
-- All optional: when empty the English text is shown.
ALTER TABLE "Product" ADD COLUMN "nameAr" TEXT, ADD COLUMN "descriptionAr" TEXT;
ALTER TABLE "Variant" ADD COLUMN "nameAr" TEXT;
ALTER TABLE "Category" ADD COLUMN "nameAr" TEXT, ADD COLUMN "descriptionAr" TEXT;
ALTER TABLE "Bundle" ADD COLUMN "nameAr" TEXT, ADD COLUMN "descriptionAr" TEXT;
ALTER TABLE "Governorate" ADD COLUMN "nameAr" TEXT;
ALTER TABLE "ShippingZone" ADD COLUMN "cityAr" TEXT;
ALTER TABLE "DiscountRule" ADD COLUMN "nameAr" TEXT;
ALTER TABLE "Popup" ADD COLUMN "headingAr" TEXT, ADD COLUMN "bodyAr" TEXT, ADD COLUMN "buttonTextAr" TEXT;
ALTER TABLE "PaymentSettings" ADD COLUMN "instructionsAr" TEXT;
