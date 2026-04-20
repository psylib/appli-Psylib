-- Add payment_amount and payment_mode to appointments
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "payment_amount" DECIMAL(10,2);
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "payment_mode" TEXT NOT NULL DEFAULT 'none';
