-- Enrichissement Agenda, Types de Consultation & Paiements
-- 2026-05-08

-- 1. New enums
DO $$ BEGIN
  CREATE TYPE "OfflinePaymentMethod" AS ENUM ('cash', 'check', 'card', 'transfer', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ConsultationModality" AS ENUM ('in_person', 'online', 'home_visit', 'any');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CancelledBy" AS ENUM ('patient', 'psychologist', 'system');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Psychologist: pause entre RDV + no-show billing
ALTER TABLE "psychologists" ADD COLUMN IF NOT EXISTS "min_break_minutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "psychologists" ADD COLUMN IF NOT EXISTS "no_show_billing_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "psychologists" ADD COLUMN IF NOT EXISTS "no_show_fee" DECIMAL(10,2);

-- 3. ConsultationType: modality, location, instructions, payment modes, cancellation delay
ALTER TABLE "consultation_types" ADD COLUMN IF NOT EXISTS "modality" "ConsultationModality" NOT NULL DEFAULT 'any';
ALTER TABLE "consultation_types" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "consultation_types" ADD COLUMN IF NOT EXISTS "instructions" TEXT;
ALTER TABLE "consultation_types" ADD COLUMN IF NOT EXISTS "allowed_payment_modes" TEXT;
ALTER TABLE "consultation_types" ADD COLUMN IF NOT EXISTS "cancellation_delay" INTEGER;

-- 4. Appointment: offline payment method + cancellation tracking
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "offline_payment_method" "OfflinePaymentMethod";
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "cancellation_reason" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "cancelled_by" "CancelledBy";
