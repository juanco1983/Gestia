-- Data migration: populate equipoId for legacy single-equipo TechnicalReport records.
-- For reports where equipoId is NULL, try to inherit from the OT's equipoId field.
-- If the OT has no equipoId, the report stays NULL (PostgreSQL composite unique allows this).

-- Step 1: Populate equipoId from OT for records with a single-equipo OT
UPDATE "TechnicalReport" AS tr
SET "equipoId" = ot."equipoId"
FROM "OT" AS ot
WHERE tr."otId" = ot.id
  AND tr."equipoId" IS NULL
  AND ot."equipoId" IS NOT NULL
  AND POSITION(',' IN ot."equipoId") = 0;

-- Step 2: For multi-equipo OTs, populate equipoId with the first equipo
UPDATE "TechnicalReport" AS tr
SET "equipoId" = SPLIT_PART(ot."equipoId", ',', 1)
FROM "OT" AS ot
WHERE tr."otId" = ot.id
  AND tr."equipoId" IS NULL
  AND ot."equipoId" IS NOT NULL
  AND POSITION(',' IN ot."equipoId") > 0;

-- Step 3: Delete orphan TechnicalReport records (no linked OT)
DELETE FROM "TechnicalReport" AS tr
WHERE NOT EXISTS (
  SELECT 1 FROM "OT" AS ot WHERE ot.id = tr."otId"
);
