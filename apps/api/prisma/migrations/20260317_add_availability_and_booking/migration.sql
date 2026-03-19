-- CreateTable: Availability
CREATE TABLE "availability" (
    "id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "availability" ADD CONSTRAINT "availability_psychologist_id_fkey"
    FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Appointment — add new columns
ALTER TABLE "appointments"
    ADD COLUMN IF NOT EXISTS "reason" TEXT,
    ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'internal',
    ADD COLUMN IF NOT EXISTS "cancel_token" TEXT;

-- CreateIndex: cancel_token unique
CREATE UNIQUE INDEX IF NOT EXISTS "appointments_cancel_token_key"
    ON "appointments"("cancel_token");
