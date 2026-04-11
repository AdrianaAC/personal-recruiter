ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "autoThankYouReminderEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TYPE "TaskWorkflowStage" ADD VALUE IF NOT EXISTS 'interview_thank_you';
