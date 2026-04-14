-- Add missing indexes identified in audit (2026-04-13)
-- All CREATE INDEX IF NOT EXISTS for idempotency

-- Payment: query by psychologist + status (billing dashboard)
CREATE INDEX IF NOT EXISTS "idx_payments_psy_status" ON "payments"("psychologist_id", "status");

-- Message: query unread messages per conversation
CREATE INDEX IF NOT EXISTS "idx_messages_conv_read" ON "messages"("conversation_id", "read_at");

-- Invoice: lookup by session (auto-invoice dedup)
CREATE INDEX IF NOT EXISTS "idx_invoices_session" ON "invoices"("session_id");

-- AiUsage: usage tracking per psychologist sorted by date
CREATE INDEX IF NOT EXISTS "idx_ai_usage_psy_date" ON "ai_usage"("psychologist_id", "created_at" DESC);
