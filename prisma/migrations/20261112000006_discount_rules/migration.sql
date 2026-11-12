-- AlterTable
ALTER TABLE "PaymentSettings" ADD COLUMN "discountMode" TEXT NOT NULL DEFAULT 'STACK',
ADD COLUMN "salesEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "promosEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "DiscountRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'PERCENT',
    "value" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountRule_pkey" PRIMARY KEY ("id")
);
