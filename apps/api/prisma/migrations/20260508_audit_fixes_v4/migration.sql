-- Audit fixes 2026-05-08 v4
-- Adds missing indexes, onDelete rules, fixes subscription default

-- 1. Missing indexes
CREATE INDEX IF NOT EXISTS "idx_payment_stripe_intent" ON "payments"("stripe_payment_intent_id");
CREATE INDEX IF NOT EXISTS "idx_audit_actor_action" ON "audit_logs"("actor_id", "action", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_invoices_psy_date" ON "invoices"("psychologist_id", "issued_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_expenses_psy_active_date" ON "expenses"("psychologist_id", "deleted_at", "date" DESC);
CREATE INDEX IF NOT EXISTS "idx_accounting_psy_active_date" ON "accounting_entries"("psychologist_id", "deleted_at", "date" DESC);

-- 2. Fix subscription default status from 'trialing' to 'active'
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'active';
