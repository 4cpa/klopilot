-- klopilot.ch — PostGIS- und Constraint-Migration
-- Wird nach `prisma migrate dev` ausgeführt:
--   psql $DATABASE_URL -f infra/migrations/001_postgis.sql

-- 1) Geometrie-Spalte ergänzen (zusätzlich zu lng/lat als Mirror)
ALTER TABLE toilets
  ADD COLUMN IF NOT EXISTS geom geography(Point, 4326);

-- 2) Trigger: geom aus longitude/latitude synchron halten
CREATE OR REPLACE FUNCTION sync_toilet_geom() RETURNS TRIGGER AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_toilet_geom ON toilets;
CREATE TRIGGER trg_toilet_geom
  BEFORE INSERT OR UPDATE OF longitude, latitude ON toilets
  FOR EACH ROW EXECUTE FUNCTION sync_toilet_geom();

-- 3) GiST-Index für Geo-Queries
CREATE INDEX IF NOT EXISTS idx_toilets_geom ON toilets USING GIST (geom);

-- 4) Check-Constraints: flowers UND flies dürfen nicht gleichzeitig > 0 sein
ALTER TABLE ratings
  ADD CONSTRAINT chk_xor_accessibility
    CHECK (NOT (flowers_accessibility > 0 AND flies_accessibility > 0)),
  ADD CONSTRAINT chk_xor_cleanliness
    CHECK (NOT (flowers_cleanliness > 0 AND flies_cleanliness > 0)),
  ADD CONSTRAINT chk_xor_hygiene
    CHECK (NOT (flowers_hygiene > 0 AND flies_hygiene > 0)),
  ADD CONSTRAINT chk_xor_style
    CHECK (NOT (flowers_style > 0 AND flies_style > 0)),
  ADD CONSTRAINT chk_xor_amenities
    CHECK (NOT (flowers_amenities > 0 AND flies_amenities > 0)),
  ADD CONSTRAINT chk_xor_safety
    CHECK (NOT (flowers_safety > 0 AND flies_safety > 0)),
  ADD CONSTRAINT chk_xor_inclusivity
    CHECK (NOT (flowers_inclusivity > 0 AND flies_inclusivity > 0)),
  ADD CONSTRAINT chk_xor_cost
    CHECK (NOT (flowers_cost > 0 AND flies_cost > 0)),
  ADD CONSTRAINT chk_xor_wait
    CHECK (NOT (flowers_wait > 0 AND flies_wait > 0)),
  ADD CONSTRAINT chk_xor_kids
    CHECK (NOT (flowers_kids > 0 AND flies_kids > 0));

-- 5) Range-Checks 0..5
ALTER TABLE ratings
  ADD CONSTRAINT chk_range_flowers_accessibility CHECK (flowers_accessibility BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_accessibility   CHECK (flies_accessibility   BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_cleanliness   CHECK (flowers_cleanliness   BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_cleanliness     CHECK (flies_cleanliness     BETWEEN 0 AND 5);
-- (für Kürze restliche Range-Checks analog ergänzen)

-- 6) Trigger: Privat-Toiletten-Adresse vor Speicherung auf 100m-Raster runden
CREATE OR REPLACE FUNCTION blur_private_location() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.visibility = 'private' THEN
    -- ~0.001 Grad ≈ 100m am Äquator (gute Näherung für CH/EU)
    NEW.longitude := ROUND(NEW.longitude::numeric, 3)::float;
    NEW.latitude  := ROUND(NEW.latitude::numeric, 3)::float;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blur_private ON toilets;
CREATE TRIGGER trg_blur_private
  BEFORE INSERT OR UPDATE OF longitude, latitude, visibility ON toilets
  FOR EACH ROW EXECUTE FUNCTION blur_private_location();
