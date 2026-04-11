CREATE TYPE "TaskOrigin" AS ENUM (
    'manual',
    'auto_followup',
    'auto_prep',
    'auto_deadline',
    'auto_review'
);

ALTER TABLE "Task"
ADD COLUMN "origin" "TaskOrigin" NOT NULL DEFAULT 'manual';

UPDATE "Task"
SET "origin" = 'auto_followup'
WHERE "description" LIKE 'Automatically scheduled by workflow.%';
