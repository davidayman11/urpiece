-- AlterTable
ALTER TABLE "PaymentSettings" ADD COLUMN "customFields" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "customData" TEXT NOT NULL DEFAULT '{}';
