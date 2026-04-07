-- CreateEnum (if not exists)
DO $$ BEGIN
  CREATE TYPE "PaymentMode" AS ENUM ('prepaid', 'postpaid', 'both');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable (only add missing columns)
ALTER TABLE "psychologists" ADD COLUMN IF NOT EXISTS "stripe_onboarding_complete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "psychologists" ADD COLUMN IF NOT EXISTS "payment_mode" "PaymentMode" NOT NULL DEFAULT 'both';
ALTER TABLE "psychologists" ADD COLUMN IF NOT EXISTS "cancellation_delay" INTEGER NOT NULL DEFAULT 24;
ALTER TABLE "psychologists" ADD COLUMN IF NOT EXISTS "auto_refund" BOOLEAN NOT NULL DEFAULT true;
