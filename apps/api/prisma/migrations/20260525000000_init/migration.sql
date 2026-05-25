-- ============================================================================
-- klopilot.ch — Initiale Datenbank-Migration
-- Stand: P1-Initial · 2026-05-25
--
-- Aufbau:
--   §0  search_path sicherstellen (PostGIS-Types im public-Schema)
--   §1  PostgreSQL-Extensions
--   §2  Enums
--   §3  Tabellen (Prisma-verwalteter Teil)
--   §4  Primary Keys & Unique Constraints
--   §5  Indizes (btree)
--   §6  Foreign Keys
--   §7  PostGIS-Erweiterungsblock (außerhalb Prisma-Verwaltung)
--        7a  geography(Point,4326)-Spalte
--        7b  Hilfsfunktionen + Trigger
--   §8  Check-Constraints (Bewertungslogik)
--
-- Voraussetzung: DATABASE_URL muss auf schema=public zeigen.
-- PostGIS-Types (geography, geometry) liegen stets im public-Schema.
--
-- WICHTIG: §7 und §8 dürfen nie mit `prisma db push` überschrieben werden.
--          Stets `prisma migrate dev` / `prisma migrate deploy` verwenden.
-- ============================================================================


-- ─── §0  search_path ──────────────────────────────────────────────────────────
-- Stellt sicher, dass geography/geometry-Types aus dem public-Schema gefunden
-- werden, auch wenn Prisma mit einem anderen Schema-Präfix arbeitet.
SET search_path TO public;


-- ─── §1  Extensions ──────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ─── §2  Enums ────────────────────────────────────────────────────────────────

CREATE TYPE "UserRole" AS ENUM (
  'anon',
  'user',
  'verified',
  'moderator',
  'admin'
);

CREATE TYPE "ToiletCategory" AS ENUM (
  'public',
  'nette_toilette',
  'gastronomy',
  'transport',
  'mall',
  'event',
  'private'
);

CREATE TYPE "Visibility" AS ENUM (
  'public',
  'nette_toilette',
  'private'
);

CREATE TYPE "ToiletStatus" AS ENUM (
  'active',
  'hidden',
  'removed'
);

CREATE TYPE "ModerationStatus" AS ENUM (
  'pending',
  'approved',
  'rejected'
);

CREATE TYPE "ReportStatus" AS ENUM (
  'open',
  'reviewing',
  'resolved',
  'dismissed'
);

CREATE TYPE "ReportTargetType" AS ENUM (
  'toilet',
  'rating',
  'photo',
  'user'
);


-- ─── §3  Tabellen ─────────────────────────────────────────────────────────────

CREATE TABLE "users" (
  "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
  "handle"         TEXT         NOT NULL,
  "email"          TEXT,
  "passwordHash"   TEXT,
  "role"           "UserRole"   NOT NULL DEFAULT 'user',
  "locale"         TEXT         NOT NULL DEFAULT 'de',
  "expoPushToken"  TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verifiedAt"     TIMESTAMP(3)
);

CREATE TABLE "partners" (
  "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
  "name"          TEXT         NOT NULL,
  "type"          TEXT         NOT NULL DEFAULT 'other',
  "website"       TEXT,
  "contactEmail"  TEXT,
  "logoKey"       TEXT,
  "description"   TEXT,
  "verified"      BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Hinweis: geom wird in §7 nachträglich hinzugefügt (geography-Typ nicht
-- nativ in Prisma darstellbar).
CREATE TABLE "toilets" (
  "id"            UUID             NOT NULL DEFAULT gen_random_uuid(),
  "name"          TEXT             NOT NULL,
  "category"      "ToiletCategory" NOT NULL,
  "address"       TEXT,
  "longitude"     DOUBLE PRECISION NOT NULL,
  "latitude"      DOUBLE PRECISION NOT NULL,
  "visibility"    "Visibility"     NOT NULL DEFAULT 'public',
  "ownerId"       UUID,
  "partnerId"     UUID,
  "openingHours"  JSONB,
  "feeChf"        NUMERIC(6,2),
  "accessibility" JSONB,
  "createdById"   UUID             NOT NULL,
  "verified"      BOOLEAN          NOT NULL DEFAULT false,
  "status"        "ToiletStatus"   NOT NULL DEFAULT 'active',
  "createdAt"     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3)     NOT NULL
);

CREATE TABLE "ratings" (
  "id"                    UUID         NOT NULL DEFAULT gen_random_uuid(),
  "toiletId"              UUID         NOT NULL,
  "userId"                UUID         NOT NULL,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Bewertungsfelder: je Kriterium entweder Blümchen 🌸 ODER Fliegen 🪰 (0–5)
  "flowersAccessibility"  INTEGER      NOT NULL DEFAULT 0,
  "fliesAccessibility"    INTEGER      NOT NULL DEFAULT 0,
  "flowersCleanliness"    INTEGER      NOT NULL DEFAULT 0,
  "fliesCleanliness"      INTEGER      NOT NULL DEFAULT 0,
  "flowersHygiene"        INTEGER      NOT NULL DEFAULT 0,
  "fliesHygiene"          INTEGER      NOT NULL DEFAULT 0,
  "flowersStyle"          INTEGER      NOT NULL DEFAULT 0,
  "fliesStyle"            INTEGER      NOT NULL DEFAULT 0,
  "flowersAmenities"      INTEGER      NOT NULL DEFAULT 0,
  "fliesAmenities"        INTEGER      NOT NULL DEFAULT 0,
  "flowersSafety"         INTEGER      NOT NULL DEFAULT 0,
  "fliesSafety"           INTEGER      NOT NULL DEFAULT 0,
  "flowersInclusivity"    INTEGER      NOT NULL DEFAULT 0,
  "fliesInclusivity"      INTEGER      NOT NULL DEFAULT 0,
  "flowersCost"           INTEGER      NOT NULL DEFAULT 0,
  "fliesCost"             INTEGER      NOT NULL DEFAULT 0,
  "flowersWait"           INTEGER      NOT NULL DEFAULT 0,
  "fliesWait"             INTEGER      NOT NULL DEFAULT 0,
  "flowersKids"           INTEGER      NOT NULL DEFAULT 0,
  "fliesKids"             INTEGER      NOT NULL DEFAULT 0,
  "comment"               TEXT,
  "language"              TEXT         NOT NULL DEFAULT 'de',
  "helpfulCount"          INTEGER      NOT NULL DEFAULT 0
);

CREATE TABLE "photos" (
  "id"               UUID               NOT NULL DEFAULT gen_random_uuid(),
  "toiletId"         UUID               NOT NULL,
  "ratingId"         UUID,
  "userId"           UUID               NOT NULL,
  "s3Key"            TEXT               NOT NULL,
  "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'pending',
  "createdAt"        TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "reports" (
  "id"          UUID               NOT NULL DEFAULT gen_random_uuid(),
  "targetType"  "ReportTargetType" NOT NULL,
  "targetId"    UUID               NOT NULL,
  "reason"      TEXT               NOT NULL,
  "reporterId"  UUID               NOT NULL,
  "status"      "ReportStatus"     NOT NULL DEFAULT 'open',
  "createdAt"   TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "api_keys" (
  "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
  "key"         TEXT         NOT NULL,
  "name"        TEXT         NOT NULL,
  "userId"      UUID,
  "revoked"     BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt"  TIMESTAMP(3)
);

CREATE TABLE "private_invites" (
  "toiletId"      UUID         NOT NULL,
  "inviteeUserId" UUID         NOT NULL,
  "grantedById"   UUID         NOT NULL,
  "grantedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ─── §4  Primary Keys & Unique Constraints ────────────────────────────────────

ALTER TABLE "users"           ADD CONSTRAINT "users_pkey"           PRIMARY KEY ("id");
ALTER TABLE "partners"        ADD CONSTRAINT "partners_pkey"         PRIMARY KEY ("id");
ALTER TABLE "toilets"         ADD CONSTRAINT "toilets_pkey"          PRIMARY KEY ("id");
ALTER TABLE "ratings"         ADD CONSTRAINT "ratings_pkey"          PRIMARY KEY ("id");
ALTER TABLE "photos"          ADD CONSTRAINT "photos_pkey"           PRIMARY KEY ("id");
ALTER TABLE "reports"         ADD CONSTRAINT "reports_pkey"          PRIMARY KEY ("id");
ALTER TABLE "api_keys"        ADD CONSTRAINT "api_keys_pkey"         PRIMARY KEY ("id");
ALTER TABLE "private_invites" ADD CONSTRAINT "private_invites_pkey"  PRIMARY KEY ("toiletId", "inviteeUserId");

ALTER TABLE "users"    ADD CONSTRAINT "users_email_key"   UNIQUE ("email");
ALTER TABLE "users"    ADD CONSTRAINT "users_handle_key"  UNIQUE ("handle");
ALTER TABLE "ratings"  ADD CONSTRAINT "ratings_toiletId_userId_key" UNIQUE ("toiletId", "userId");
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_key_key"  UNIQUE ("key");


-- ─── §5  Indizes (btree) ──────────────────────────────────────────────────────

CREATE INDEX "users_handle_idx"              ON "users"    ("handle");
CREATE INDEX "toilets_category_idx"          ON "toilets"  ("category");
CREATE INDEX "toilets_visibility_idx"        ON "toilets"  ("visibility");
CREATE INDEX "toilets_status_idx"            ON "toilets"  ("status");
CREATE INDEX "ratings_toiletId_idx"          ON "ratings"  ("toiletId");
CREATE INDEX "photos_toiletId_idx"           ON "photos"   ("toiletId");
CREATE INDEX "photos_moderationStatus_idx"   ON "photos"   ("moderationStatus");
CREATE INDEX "reports_status_idx"            ON "reports"  ("status");
CREATE INDEX "api_keys_key_idx"              ON "api_keys" ("key");


-- ─── §6  Foreign Keys ─────────────────────────────────────────────────────────

ALTER TABLE "toilets" ADD CONSTRAINT "toilets_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "toilets" ADD CONSTRAINT "toilets_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "users"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "toilets" ADD CONSTRAINT "toilets_partnerId_fkey"
  FOREIGN KEY ("partnerId") REFERENCES "partners"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "ratings" ADD CONSTRAINT "ratings_toiletId_fkey"
  FOREIGN KEY ("toiletId") REFERENCES "toilets"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "ratings" ADD CONSTRAINT "ratings_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "photos" ADD CONSTRAINT "photos_toiletId_fkey"
  FOREIGN KEY ("toiletId") REFERENCES "toilets"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "photos" ADD CONSTRAINT "photos_ratingId_fkey"
  FOREIGN KEY ("ratingId") REFERENCES "ratings"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "photos" ADD CONSTRAINT "photos_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "users"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "private_invites" ADD CONSTRAINT "private_invites_toiletId_fkey"
  FOREIGN KEY ("toiletId") REFERENCES "toilets"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "private_invites" ADD CONSTRAINT "private_invites_inviteeUserId_fkey"
  FOREIGN KEY ("inviteeUserId") REFERENCES "users"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "private_invites" ADD CONSTRAINT "private_invites_grantedById_fkey"
  FOREIGN KEY ("grantedById") REFERENCES "users"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;


-- ─── §7  PostGIS-Erweiterungsblock ───────────────────────────────────────────
-- Dieser Block wird NICHT von Prisma verwaltet.
-- Neue Migrationen dürfen diesen Block nicht entfernen oder verändern,
-- ohne eine explizite PostGIS-Migration anzulegen.

-- 7a: geography(Point,4326)-Spalte
--     Koordinaten-Spiegel longitude/latitude bleiben für einfache Reads;
--     geom ist der performante Suchindex (ST_DWithin, ST_Distance).
ALTER TABLE "toilets"
  ADD COLUMN "geom" geography(Point, 4326);

-- GiST-Index für räumliche Abfragen (ST_DWithin, Nearest-Neighbor)
CREATE INDEX "toilets_geom_gist" ON "toilets" USING GIST ("geom");

-- 7b: Trigger-Funktion — geom automatisch aus longitude/latitude befüllen
CREATE OR REPLACE FUNCTION sync_toilet_geom()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_toilet_geom
  BEFORE INSERT OR UPDATE OF longitude, latitude
  ON "toilets"
  FOR EACH ROW EXECUTE FUNCTION sync_toilet_geom();

-- 7c: Trigger-Funktion — Privattoiletten-Koordinaten auf ~100 m runden
--     (DSGVO/revDSG: Standortschutz, CLAUDE.md §4 und §9)
CREATE OR REPLACE FUNCTION blur_private_location()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.visibility = 'private' THEN
    -- 3 Dezimalstellen ≈ ~100 m Genauigkeit (WGS-84)
    NEW.longitude := ROUND(NEW.longitude::numeric, 3)::float8;
    NEW.latitude  := ROUND(NEW.latitude::numeric,  3)::float8;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_blur_private
  BEFORE INSERT OR UPDATE OF longitude, latitude, visibility
  ON "toilets"
  FOR EACH ROW EXECUTE FUNCTION blur_private_location();


-- ─── §8  Check-Constraints (Bewertungslogik) ─────────────────────────────────
-- Domänenregel: pro Kriterium entweder Blümchen 🌸 ODER Fliegen 🪰 (nie beide > 0)
-- Wertebereich: 0–5

-- Wertebereich-Checks
ALTER TABLE "ratings"
  ADD CONSTRAINT chk_range_flowers_accessibility  CHECK ("flowersAccessibility"  BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_accessibility    CHECK ("fliesAccessibility"    BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_cleanliness    CHECK ("flowersCleanliness"    BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_cleanliness      CHECK ("fliesCleanliness"      BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_hygiene        CHECK ("flowersHygiene"        BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_hygiene          CHECK ("fliesHygiene"          BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_style          CHECK ("flowersStyle"          BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_style            CHECK ("fliesStyle"            BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_amenities      CHECK ("flowersAmenities"      BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_amenities        CHECK ("fliesAmenities"        BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_safety         CHECK ("flowersSafety"         BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_safety           CHECK ("fliesSafety"           BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_inclusivity    CHECK ("flowersInclusivity"    BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_inclusivity      CHECK ("fliesInclusivity"      BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_cost           CHECK ("flowersCost"           BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_cost             CHECK ("fliesCost"             BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_wait           CHECK ("flowersWait"           BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_wait             CHECK ("fliesWait"             BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flowers_kids           CHECK ("flowersKids"           BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_range_flies_kids             CHECK ("fliesKids"             BETWEEN 0 AND 5);

-- XOR-Checks (Blümchen 🌸 XOR Fliegen 🪰)
ALTER TABLE "ratings"
  ADD CONSTRAINT chk_xor_accessibility  CHECK (NOT ("flowersAccessibility" > 0 AND "fliesAccessibility" > 0)),
  ADD CONSTRAINT chk_xor_cleanliness    CHECK (NOT ("flowersCleanliness"   > 0 AND "fliesCleanliness"   > 0)),
  ADD CONSTRAINT chk_xor_hygiene        CHECK (NOT ("flowersHygiene"       > 0 AND "fliesHygiene"       > 0)),
  ADD CONSTRAINT chk_xor_style          CHECK (NOT ("flowersStyle"         > 0 AND "fliesStyle"         > 0)),
  ADD CONSTRAINT chk_xor_amenities      CHECK (NOT ("flowersAmenities"     > 0 AND "fliesAmenities"     > 0)),
  ADD CONSTRAINT chk_xor_safety         CHECK (NOT ("flowersSafety"        > 0 AND "fliesSafety"        > 0)),
  ADD CONSTRAINT chk_xor_inclusivity    CHECK (NOT ("flowersInclusivity"   > 0 AND "fliesInclusivity"   > 0)),
  ADD CONSTRAINT chk_xor_cost           CHECK (NOT ("flowersCost"          > 0 AND "fliesCost"          > 0)),
  ADD CONSTRAINT chk_xor_wait           CHECK (NOT ("flowersWait"          > 0 AND "fliesWait"          > 0)),
  ADD CONSTRAINT chk_xor_kids           CHECK (NOT ("flowersKids"          > 0 AND "fliesKids"          > 0));
