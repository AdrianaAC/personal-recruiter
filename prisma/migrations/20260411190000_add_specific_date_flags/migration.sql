ALTER TABLE "Task"
ADD COLUMN "isSpecificDate" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "CallUp"
ADD COLUMN "isSpecificDate" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Task"
SET "isSpecificDate" = true
WHERE "dueDate" IS NOT NULL;

UPDATE "CallUp"
SET "isSpecificDate" = true
WHERE "scheduledAt" IS NOT NULL;
