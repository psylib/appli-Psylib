-- CreateEnum: DocumentCategory
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DocumentCategory') THEN
    CREATE TYPE "DocumentCategory" AS ENUM ('exercise', 'administrative', 'session_report', 'other');
  END IF;
END $$;

-- CreateTable: shared_documents
CREATE TABLE IF NOT EXISTS "shared_documents" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "psychologist_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "message" TEXT,
    "downloaded_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "shared_documents_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_shared_documents_psy" ON "shared_documents"("psychologist_id");
CREATE INDEX IF NOT EXISTS "idx_shared_documents_patient" ON "shared_documents"("patient_id", "created_at" DESC);

-- Foreign keys
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shared_documents_psychologist_id_fkey') THEN
    ALTER TABLE "shared_documents" ADD CONSTRAINT "shared_documents_psychologist_id_fkey"
        FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shared_documents_patient_id_fkey') THEN
    ALTER TABLE "shared_documents" ADD CONSTRAINT "shared_documents_patient_id_fkey"
        FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE;
  END IF;
END $$;
