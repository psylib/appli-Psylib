-- AlterTable: Add session preferences to psychologists
ALTER TABLE "psychologists" ADD COLUMN "default_session_duration" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "psychologists" ADD COLUMN "default_session_rate" DECIMAL(10,2);
