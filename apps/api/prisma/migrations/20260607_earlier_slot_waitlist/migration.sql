ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "notify_earlier_slot" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "earlier_slot_token" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "earlier_slot_notified_at" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "appointments_earlier_slot_token_key" ON "appointments"("earlier_slot_token");
ALTER TABLE "psychologists" ADD COLUMN IF NOT EXISTS "earlier_slot_enabled" BOOLEAN NOT NULL DEFAULT true;
