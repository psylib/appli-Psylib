-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ExpenseCategory" AS ENUM ('rent', 'insurance', 'equipment', 'it_software', 'phone_internet', 'office_supplies', 'vehicle', 'travel', 'training', 'professional_dues', 'bank_fees', 'accounting', 'advertising', 'maintenance', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExpensePaymentMethod" AS ENUM ('cash', 'check', 'card', 'transfer', 'direct_debit', 'paypal', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RecurringFrequency" AS ENUM ('monthly', 'quarterly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AccountingEntryType" AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable expenses
CREATE TABLE IF NOT EXISTS "expenses" (
    "id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "amount_ht" DECIMAL(10,2),
    "vat_rate" DECIMAL(4,2),
    "category" "ExpenseCategory" NOT NULL,
    "subcategory" TEXT,
    "payment_method" "ExpensePaymentMethod" NOT NULL,
    "supplier" TEXT,
    "receipt_url" TEXT,
    "recurring_expense_id" TEXT,
    "notes" TEXT,
    "is_deductible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable recurring_expenses
CREATE TABLE IF NOT EXISTS "recurring_expenses" (
    "id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "payment_method" "ExpensePaymentMethod" NOT NULL,
    "supplier" TEXT,
    "frequency" "RecurringFrequency" NOT NULL,
    "day_of_month" INTEGER NOT NULL DEFAULT 1,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_generated_at" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable accounting_entries
CREATE TABLE IF NOT EXISTS "accounting_entries" (
    "id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "entry_type" "AccountingEntryType" NOT NULL,
    "label" TEXT NOT NULL,
    "debit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL,
    "payment_method" TEXT,
    "counterpart" TEXT,
    "invoice_id" TEXT,
    "payment_id" TEXT,
    "expense_id" TEXT,
    "account_code" TEXT,
    "piece_ref" TEXT,
    "ecriture_num" INTEGER,
    "fiscal_year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "accounting_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable fec_sequences
CREATE TABLE IF NOT EXISTS "fec_sequences" (
    "id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "fec_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes (idempotent)
CREATE INDEX IF NOT EXISTS "idx_expenses_psy_date" ON "expenses"("psychologist_id", "date" DESC);
CREATE INDEX IF NOT EXISTS "idx_expenses_psy_category" ON "expenses"("psychologist_id", "category");
CREATE INDEX IF NOT EXISTS "idx_recurring_psy" ON "recurring_expenses"("psychologist_id");
CREATE INDEX IF NOT EXISTS "idx_recurring_active" ON "recurring_expenses"("is_active", "last_generated_at");
CREATE INDEX IF NOT EXISTS "idx_accounting_psy_date" ON "accounting_entries"("psychologist_id", "date" DESC);
CREATE INDEX IF NOT EXISTS "idx_accounting_psy_type_date" ON "accounting_entries"("psychologist_id", "entry_type", "date");
CREATE INDEX IF NOT EXISTS "idx_accounting_invoice" ON "accounting_entries"("invoice_id");
CREATE INDEX IF NOT EXISTS "idx_accounting_payment" ON "accounting_entries"("payment_id");
CREATE INDEX IF NOT EXISTS "idx_accounting_expense" ON "accounting_entries"("expense_id");
CREATE INDEX IF NOT EXISTS "idx_accounting_psy_year" ON "accounting_entries"("psychologist_id", "fiscal_year");

-- Unique constraint on fec_sequences
DO $$ BEGIN
  ALTER TABLE "fec_sequences" ADD CONSTRAINT "fec_sequences_psychologist_id_year_key" UNIQUE ("psychologist_id", "year");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- AddForeignKeys
DO $$ BEGIN
  ALTER TABLE "expenses" ADD CONSTRAINT "expenses_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recurring_expense_id_fkey" FOREIGN KEY ("recurring_expense_id") REFERENCES "recurring_expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
