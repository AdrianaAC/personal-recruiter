-- Alter note metadata so assessments can carry a due date and submission state.
ALTER TABLE "Note"
ADD COLUMN "assessmentDueDate" TIMESTAMP(3),
ADD COLUMN "assessmentSubmittedAt" TIMESTAMP(3);

-- Extend task workflow bookkeeping for assessment deadline reminders.
ALTER TABLE "Task"
ADD COLUMN "workflowSourceId" TEXT;

ALTER TYPE "TaskWorkflowStage" ADD VALUE IF NOT EXISTS 'assessment_due_3d';
ALTER TYPE "TaskWorkflowStage" ADD VALUE IF NOT EXISTS 'assessment_due_1d';
ALTER TYPE "TaskWorkflowStage" ADD VALUE IF NOT EXISTS 'assessment_overdue';
