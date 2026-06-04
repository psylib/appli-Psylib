-- CardHoldStatus enum (new type, mapped to "card_hold_status")
DO $$ BEGIN
  CREATE TYPE "card_hold_status" AS ENUM ('none', 'pending', 'secured', 'captured', 'released', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- New value on AppointmentPaymentMode (Postgres type name = "AppointmentPaymentMode", no @@map)
ALTER TYPE "AppointmentPaymentMode" ADD VALUE IF NOT EXISTS 'imprint';

-- ConsultationType.require_imprint
ALTER TABLE "consultation_types" ADD COLUMN IF NOT EXISTS "require_imprint" BOOLEAN NOT NULL DEFAULT false;

-- Appointment imprint columns
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "stripe_payment_method_id" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "card_hold_status" "card_hold_status" NOT NULL DEFAULT 'none';
