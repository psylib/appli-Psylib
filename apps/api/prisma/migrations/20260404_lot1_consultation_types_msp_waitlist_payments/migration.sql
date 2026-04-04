-- CreateEnum
CREATE TYPE "ConsultationCategory" AS ENUM ('standard', 'mon_soutien_psy');

-- CreateEnum
CREATE TYPE "BookingPaymentStatus" AS ENUM ('none', 'pending_payment', 'paid', 'payment_failed');

-- CreateEnum
CREATE TYPE "WaitlistUrgency" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('waiting', 'contacted', 'scheduled', 'removed');

-- AlterTable: psychologists — add new columns
ALTER TABLE "psychologists" ADD COLUMN "allow_online_payment" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "psychologists" ADD COLUMN "stripe_account_id" TEXT;
ALTER TABLE "psychologists" ADD COLUMN "stripe_onboarding_complete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "psychologists" ADD COLUMN "reminder_delay" INTEGER NOT NULL DEFAULT 24;
ALTER TABLE "psychologists" ADD COLUMN "reminder_sms_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "psychologists" ADD COLUMN "reminder_email_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "psychologists" ADD COLUMN "reminder_template" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "psychologists_stripe_account_id_key" ON "psychologists"("stripe_account_id");

-- AlterTable: appointments — add new columns
ALTER TABLE "appointments" ADD COLUMN "consultation_type_id" TEXT;
ALTER TABLE "appointments" ADD COLUMN "payment_intent_id" TEXT;
ALTER TABLE "appointments" ADD COLUMN "paid_online" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "appointments" ADD COLUMN "booking_payment_status" "BookingPaymentStatus" NOT NULL DEFAULT 'none';
ALTER TABLE "appointments" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- RenameColumn: psy_network_profiles.accepts_mon_psy -> accepts_mon_soutien_psy
ALTER TABLE "psy_network_profiles" RENAME COLUMN "accepts_mon_psy" TO "accepts_mon_soutien_psy";

-- CreateTable: consultation_types
CREATE TABLE "consultation_types" (
    "id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3D52A0',
    "category" "ConsultationCategory" NOT NULL DEFAULT 'standard',
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable: mon_soutien_psy_tracking
CREATE TABLE "mon_soutien_psy_tracking" (
    "id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sessions_used" INTEGER NOT NULL DEFAULT 0,
    "max_sessions" INTEGER NOT NULL DEFAULT 12,
    "first_session_at" TIMESTAMP(3),
    "last_session_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mon_soutien_psy_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable: waitlist_entries
CREATE TABLE "waitlist_entries" (
    "id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "patient_email" TEXT NOT NULL,
    "patient_phone" TEXT,
    "consultation_type_id" TEXT,
    "urgency" "WaitlistUrgency" NOT NULL DEFAULT 'low',
    "preferred_slots" JSONB,
    "note" TEXT,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'waiting',
    "contacted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_consultation_types_psy" ON "consultation_types"("psychologist_id");

-- CreateIndex
CREATE UNIQUE INDEX "mon_soutien_psy_tracking_psychologist_id_patient_id_year_key" ON "mon_soutien_psy_tracking"("psychologist_id", "patient_id", "year");

-- CreateIndex
CREATE INDEX "idx_msp_psy_year" ON "mon_soutien_psy_tracking"("psychologist_id", "year");

-- CreateIndex
CREATE INDEX "idx_waitlist_psy_status" ON "waitlist_entries"("psychologist_id", "status");

-- CreateIndex
CREATE INDEX "idx_appointments_consultation_type" ON "appointments"("consultation_type_id");

-- AddForeignKey
ALTER TABLE "consultation_types" ADD CONSTRAINT "consultation_types_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mon_soutien_psy_tracking" ADD CONSTRAINT "mon_soutien_psy_tracking_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mon_soutien_psy_tracking" ADD CONSTRAINT "mon_soutien_psy_tracking_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_consultation_type_id_fkey" FOREIGN KEY ("consultation_type_id") REFERENCES "consultation_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_consultation_type_id_fkey" FOREIGN KEY ("consultation_type_id") REFERENCES "consultation_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
