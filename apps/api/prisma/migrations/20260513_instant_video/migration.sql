-- AlterTable: make patient_id nullable on appointments for instant video rooms
ALTER TABLE "appointments" ALTER COLUMN "patient_id" DROP NOT NULL;
