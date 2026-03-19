-- CreateEnum
CREATE TYPE "supervision_group_type" AS ENUM ('supervision', 'intervision');

-- CreateEnum
CREATE TYPE "supervision_session_status" AS ENUM ('planned', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "supervision_groups" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "type" "supervision_group_type" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "max_members" INTEGER NOT NULL DEFAULT 12,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supervision_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervision_members" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "psy_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supervision_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervision_sessions" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 90,
    "location" TEXT,
    "status" "supervision_session_status" NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supervision_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_studies" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "presenter_id" TEXT NOT NULL,
    "initials" TEXT,
    "age_range" TEXT,
    "problematic" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_studies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supervision_groups_owner_id_idx" ON "supervision_groups"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "supervision_members_group_id_psy_id_key" ON "supervision_members"("group_id", "psy_id");

-- CreateIndex
CREATE INDEX "supervision_members_psy_id_idx" ON "supervision_members"("psy_id");

-- CreateIndex
CREATE INDEX "supervision_sessions_group_id_idx" ON "supervision_sessions"("group_id");

-- CreateIndex
CREATE INDEX "case_studies_session_id_idx" ON "case_studies"("session_id");

-- AddForeignKey
ALTER TABLE "supervision_groups" ADD CONSTRAINT "supervision_groups_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervision_members" ADD CONSTRAINT "supervision_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "supervision_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervision_members" ADD CONSTRAINT "supervision_members_psy_id_fkey" FOREIGN KEY ("psy_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervision_sessions" ADD CONSTRAINT "supervision_sessions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "supervision_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "supervision_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_presenter_id_fkey" FOREIGN KEY ("presenter_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
