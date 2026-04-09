-- Migration: auto-invoice-generation
-- Adds SessionStatus enum, InvoiceSource enum, new fields on Psychologist, Session, and Invoice

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('draft', 'completed');

-- CreateEnum
CREATE TYPE "InvoiceSource" AS ENUM ('manual', 'auto');

-- AlterTable: Psychologist — add auto invoice toggle fields
ALTER TABLE "psychologists"
  ADD COLUMN IF NOT EXISTS "auto_invoice" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "auto_invoice_email" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: Session — add status field
ALTER TABLE "sessions"
  ADD COLUMN IF NOT EXISTS "status" "SessionStatus" NOT NULL DEFAULT 'draft';

-- AlterTable: Invoice — add sessionId, paymentId, paidAt, source
ALTER TABLE "invoices"
  ADD COLUMN IF NOT EXISTS "session_id" TEXT,
  ADD COLUMN IF NOT EXISTS "payment_id" TEXT,
  ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "source" "InvoiceSource" NOT NULL DEFAULT 'manual';

-- AddForeignKey: Invoice.session_id -> sessions.id
ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "sessions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Invoice.payment_id -> payments.id
ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "payments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
