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
-- Spaltennamen sind camelCase weil Prisma kein @map verwendet
ALTER TABLE ratings
  ADD CONSTRAINT chk_xor_accessibility
    CHECK (NOT ("flowersAccessibility" > 0 AND "fliesAccessibility" > 0)),
  ADD CONSTRAINT chk_xor_cleanliness
    CHECK (NOT ("flowersCleanliness" > 0 AND "fliesCleanliness" > 0)),
  ADD CONSTRAINT chk_xor_hygiene
    CHECK (NOT ("flowersHygiene" > 0 AND "fliesHygiene" > 0)),
  ADD CONSTRAINT chk_xor_style
    CHECK (NOT ("flowersStyle" > 0 AND "fliesStyle" > 0)),
  ADD CONSTRAINT chk_xor_amenities
    CHECK (NOT ("flowersAmenities" > 0 AND "fliesAmenities" > 0)),
  ADD CONSTRAINT chk_xor_safety
    CHECK (NOT ("flowersSafety" > 0 AND "fliesSafety" > 0)),
  ADD CONSTRAINT chk_xor_inclusivity
    CHECK (NOT ("flowersInclusivity" > 0 AND "fliesInclusivity" > 0)),
  ADD CONSTRAINT chk_xor_cost
    CHECK (NOT ("flowersCost" > 0 AND "fliesCost" > 0)),
  ADD CONSTRAINT chk_xor_wait
    CHECK (NOT ("flowersWait" > 0 AND "fliesWait" > 0)),
  ADD CONSTRAINT chk_xor_kids
    CHECK (NOT ("flowersKids" > 0 AND "fliesKids" > 0));

-- 5) Range-Checks 0..5
ALTER TABLE ratings
  ADD CONSTRAINT chk_range_flowers_accessibility CHECK ("flowersAccessibility" BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_accessibility   CHECK ("fliesAccessibility"   BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_cleanliness   CHECK ("flowersCleanliness"   BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_cleanliness     CHECK ("fliesCleanliness"     BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_hygiene       CHECK ("flowersHygiene"       BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_hygiene         CHECK ("fliesHygiene"         BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_style         CHECK ("flowersStyle"         BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_style           CHECK ("fliesStyle"           BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_amenities     CHECK ("flowersAmenities"     BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_amenities       CHECK ("fliesAmenities"       BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_safety        CHECK ("flowersSafety"        BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_safety          CHECK ("fliesSafety"          BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_inclusivity   CHECK ("flowersInclusivity"   BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_inclusivity     CHECK ("fliesInclusivity"     BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_cost          CHECK ("flowersCost"          BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_cost            CHECK ("fliesCost"            BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_wait          CHECK ("flowersWait"          BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_wait            CHECK ("fliesWait"            BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_kids          CHECK ("flowersKids"          BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_kids            CHECK ("fliesKids"            BETWEEN 0 AND 5);

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
