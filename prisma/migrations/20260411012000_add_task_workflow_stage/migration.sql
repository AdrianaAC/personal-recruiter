-- CreateEnum
CREATE TYPE "TaskWorkflowStage" AS ENUM ('initial', 'final');

-- AlterTable
ALTER TABLE "Task"
ADD COLUMN "workflowStage" "TaskWorkflowStage";

-- Backfill existing auto follow-up tasks as the initial reminder stage.
UPDATE "Task"
SET "workflowStage" = 'initial'
WHERE "origin" = 'auto_followup'
  AND "workflowStage" IS NULL;
