ALTER TABLE "Product" ADD COLUMN "packagingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrderItem" ADD COLUMN "packagingName" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "packagingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "packagingTotal" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE "PackagingOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "image" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PackagingOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerCart" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "items" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomerCart_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerCart_customerId_key" ON "CustomerCart"("customerId");
ALTER TABLE "CustomerCart" ADD CONSTRAINT "CustomerCart_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
