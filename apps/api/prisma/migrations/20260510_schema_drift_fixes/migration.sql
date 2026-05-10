-- =============================================================================
-- Migration: 20260510_schema_drift_fixes
-- Purpose: Fix critical schema drift between schema.prisma and migrations
-- Date: 2026-05-10
-- All operations are fully idempotent (IF NOT EXISTS, IF EXISTS, DO $$ patterns)
-- =============================================================================

-- 1. UserRole enum: add 'guardian' value if missing
DO $$ BEGIN
  ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'guardian';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. PaymentStatus enum: add 'refunded' value if missing
DO $$ BEGIN
  ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'refunded';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. BookingPaymentStatus enum: add 'refunded' value if missing
DO $$ BEGIN
  ALTER TYPE "BookingPaymentStatus" ADD VALUE IF NOT EXISTS 'refunded';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Create referral_invite_status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "referral_invite_status" AS ENUM ('pending', 'used', 'rewarded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Create referral_invites table (was never migrated)
CREATE TABLE IF NOT EXISTS "referral_invites" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "code" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referred_id" TEXT,
    "status" "referral_invite_status" NOT NULL DEFAULT 'pending',
    "reward_given_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "referral_invites_pkey" PRIMARY KEY ("id")
);

-- 5a. Referral invites: add unique constraints and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "referral_invites_code_key" ON "referral_invites"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "referral_invites_referred_id_key" ON "referral_invites"("referred_id");
CREATE INDEX IF NOT EXISTS "referral_invites_referrer_id_idx" ON "referral_invites"("referrer_id");

-- 5b. Referral invites: add foreign keys
DO $$ BEGIN
  ALTER TABLE "referral_invites" ADD CONSTRAINT "referral_invites_referrer_id_fkey"
    FOREIGN KEY ("referrer_id") REFERENCES "psychologists"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "referral_invites" ADD CONSTRAINT "referral_invites_referred_id_fkey"
    FOREIGN KEY ("referred_id") REFERENCES "psychologists"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Users table: add mobile push and notification preference fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "push_token" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "push_platform" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notification_preferences" JSONB;

-- 7. Appointments table: add sms_reminder_sent_at
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "sms_reminder_sent_at" TIMESTAMP(3);

-- 8. Payments table: add stripe_checkout_session_id with unique constraint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "stripe_checkout_session_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "payments_stripe_checkout_session_id_key"
  ON "payments"("stripe_checkout_session_id");

-- 9. PsyNetworkProfiles: add accepts_mon_soutien_psy and offers_visio if missing
ALTER TABLE "psy_network_profiles" ADD COLUMN IF NOT EXISTS "accepts_mon_soutien_psy" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "psy_network_profiles" ADD COLUMN IF NOT EXISTS "offers_visio" BOOLEAN NOT NULL DEFAULT false;

-- 10. Add missing indexes from schema @@index directives
CREATE INDEX IF NOT EXISTS "idx_notifications_user_read" ON "notifications"("user_id", "read_at");
CREATE INDEX IF NOT EXISTS "idx_messages_conv_created" ON "messages"("conversation_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_messages_sender" ON "messages"("sender_id");
CREATE INDEX IF NOT EXISTS "idx_appointments_patient" ON "appointments"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_appointments_google_event" ON "appointments"("psychologist_id", "google_event_id");
CREATE INDEX IF NOT EXISTS "idx_network_group_members_psy" ON "network_group_members"("psy_id");

-- 11. Subscriptions: add created_at if missing
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT now();

-- 12. Data integrity: mood range check constraints
ALTER TABLE "mood_tracking" DROP CONSTRAINT IF EXISTS "mood_tracking_mood_range";
ALTER TABLE "mood_tracking" ADD CONSTRAINT "mood_tracking_mood_range" CHECK (mood >= 1 AND mood <= 10);

ALTER TABLE "journal_entries" DROP CONSTRAINT IF EXISTS "journal_entries_mood_range";
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_mood_range" CHECK (mood IS NULL OR (mood >= 1 AND mood <= 10));

-- 13. FEC ecriture uniqueness constraint for accounting entries
CREATE UNIQUE INDEX IF NOT EXISTS "accounting_entries_psy_year_num_key"
  ON "accounting_entries"("psychologist_id", "fiscal_year", "ecriture_num")
  WHERE "ecriture_num" IS NOT NULL;

-- 14. Patient status composite index for dashboard queries
CREATE INDEX IF NOT EXISTS "idx_patients_psy_status" ON "patients"("psychologist_id", "status");

-- 15. StripeEvent indexes for webhook processing
CREATE INDEX IF NOT EXISTS "idx_stripe_events_type" ON "stripe_events"("type");
CREATE INDEX IF NOT EXISTS "idx_stripe_events_processed" ON "stripe_events"("processed_at" DESC);
