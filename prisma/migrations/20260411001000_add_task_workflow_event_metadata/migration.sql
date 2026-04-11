CREATE TYPE "TaskWorkflowEventKind" AS ENUM (
    'application',
    'interview',
    'assessment'
);

ALTER TABLE "Task"
ADD COLUMN "workflowEventKind" "TaskWorkflowEventKind",
ADD COLUMN "workflowEventAt" TIMESTAMP(3);

UPDATE "Task"
SET
    "workflowEventKind" = 'application',
    "workflowEventAt" = COALESCE("dueDate" - INTERVAL '21 days', "createdAt")
WHERE "origin" = 'auto_followup'
  AND "workflowEventKind" IS NULL;
