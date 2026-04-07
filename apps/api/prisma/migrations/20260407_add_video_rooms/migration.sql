-- Migration: add-video-rooms
-- Adds video consultation support: VideoRoom model and Appointment online fields

-- CreateEnum
CREATE TYPE "VideoRoomStatus" AS ENUM ('waiting', 'active', 'ended');

-- AlterTable: add online video fields to appointments
ALTER TABLE "appointments"
  ADD COLUMN "is_online" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "video_join_token" TEXT,
  ADD COLUMN "video_link_sent_at" TIMESTAMP(3);

-- CreateIndex for unique video_join_token
CREATE UNIQUE INDEX "appointments_video_join_token_key" ON "appointments"("video_join_token");

-- CreateTable: video_rooms
CREATE TABLE "video_rooms" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "room_name" TEXT NOT NULL,
    "status" "VideoRoomStatus" NOT NULL DEFAULT 'waiting',
    "psy_joined_at" TIMESTAMP(3),
    "patient_joined_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_rooms_appointment_id_key" ON "video_rooms"("appointment_id");

-- CreateIndex
CREATE UNIQUE INDEX "video_rooms_room_name_key" ON "video_rooms"("room_name");

-- CreateIndex
CREATE INDEX "video_rooms_psychologist_id_status_idx" ON "video_rooms"("psychologist_id", "status");

-- CreateIndex
CREATE INDEX "video_rooms_appointment_id_idx" ON "video_rooms"("appointment_id");

-- AddForeignKey
ALTER TABLE "video_rooms" ADD CONSTRAINT "video_rooms_appointment_id_fkey"
  FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_rooms" ADD CONSTRAINT "video_rooms_psychologist_id_fkey"
  FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
