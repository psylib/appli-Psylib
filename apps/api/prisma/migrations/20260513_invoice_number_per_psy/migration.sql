-- Make invoice_number unique per psychologist instead of globally unique
-- This allows each psychologist to have their own PSY-YYYY-NNN numbering

-- Drop the global unique constraint on invoice_number
DROP INDEX IF EXISTS "invoices_invoice_number_key";

-- Create composite unique constraint (psychologist_id + invoice_number)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_invoices_psy_number" ON "invoices" ("psychologist_id", "invoice_number");
