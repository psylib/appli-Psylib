-- AlterTable: sessions — add ai_metadata column for AI-generated summary metadata
ALTER TABLE "sessions" ADD COLUMN "ai_metadata" JSONB;
