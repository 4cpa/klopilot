-- Migration: Admin-Benutzerverwaltung — Sperren (Ban) und DSGVO-Anonymisierung

DO $$ BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('active', 'banned');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'active';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bannedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bannedReason" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users"("status");
