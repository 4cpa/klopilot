-- klopilot.ch — Postgres Initialisierung
-- Wird einmalig beim ersten Start des Containers ausgeführt.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS pg_trgm;        -- Fuzzy-Search
CREATE EXTENSION IF NOT EXISTS unaccent;       -- Sprach-unabhängige Suche
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- UUID-Generierung

-- Sanity-Check
DO $$
BEGIN
  RAISE NOTICE 'klopilot init done. PostGIS version: %', PostGIS_Version();
END $$;
