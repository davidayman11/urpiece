-- AlterTable
ALTER TABLE "PaymentSettings" ADD COLUMN "requiredFields" TEXT NOT NULL DEFAULT '{"phone":true,"address":true,"city":true}';
