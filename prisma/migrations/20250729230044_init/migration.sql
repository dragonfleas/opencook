-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "shipping_first_name" TEXT NOT NULL,
    "shipping_last_name" TEXT NOT NULL,
    "shipping_address_line1" TEXT NOT NULL,
    "shipping_address_line2" TEXT,
    "shipping_city" TEXT NOT NULL,
    "shipping_state" TEXT NOT NULL,
    "shipping_postal_code" TEXT NOT NULL,
    "shipping_country" TEXT NOT NULL,
    "billing_first_name" TEXT,
    "billing_last_name" TEXT,
    "billing_address_line1" TEXT,
    "billing_address_line2" TEXT,
    "billing_city" TEXT,
    "billing_state" TEXT,
    "billing_postal_code" TEXT,
    "billing_country" TEXT,
    "payment_method_type" TEXT NOT NULL,
    "payment_method_encrypted_data" TEXT NOT NULL,
    "payment_holder_name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_used_at" DATETIME,
    "purchase_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "daily_purchases" TEXT NOT NULL DEFAULT '{}'
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_name_key" ON "profiles"("name");

-- CreateIndex
CREATE INDEX "profiles_name_idx" ON "profiles"("name");

-- CreateIndex
CREATE INDEX "profiles_email_idx" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "profiles_is_active_idx" ON "profiles"("is_active");

-- CreateIndex
CREATE INDEX "profiles_created_at_idx" ON "profiles"("created_at");
