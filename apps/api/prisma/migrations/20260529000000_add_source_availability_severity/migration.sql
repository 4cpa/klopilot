-- Migration: Add source, isAvailable, osmId to toilets; add severity to reports

-- Toilet: Herkunft / Quelle
ALTER TABLE "toilets" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'user';

-- Toilet: Verfügbarkeit (true = offen, false = vorübergehend geschlossen)
ALTER TABLE "toilets" ADD COLUMN IF NOT EXISTS "is_available" BOOLEAN NOT NULL DEFAULT true;

-- Toilet: OSM-ID für Deduplizierung
ALTER TABLE "toilets" ADD COLUMN IF NOT EXISTS "osm_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "toilets_osm_id_key" ON "toilets"("osm_id") WHERE "osm_id" IS NOT NULL;

-- Report: Schweregrad
DO $$ BEGIN
  CREATE TYPE "ReportSeverity" AS ENUM ('normal', 'critical');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "severity" "ReportSeverity" NOT NULL DEFAULT 'normal';
CREATE INDEX IF NOT EXISTS "reports_severity_idx" ON "reports"("severity");
