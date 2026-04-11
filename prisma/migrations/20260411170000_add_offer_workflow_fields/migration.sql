ALTER TABLE "JobApplication"
ADD COLUMN IF NOT EXISTS "offerReceivedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "offerExpiresAt" TIMESTAMP(3);

UPDATE "JobApplication"
SET "offerReceivedAt" = COALESCE("offerReceivedAt", "updatedAt")
WHERE "status" = 'OFFER' AND "offerReceivedAt" IS NULL;

ALTER TYPE "TaskWorkflowEventKind" ADD VALUE IF NOT EXISTS 'offer';
ALTER TYPE "TaskWorkflowStage" ADD VALUE IF NOT EXISTS 'offer_review';
ALTER TYPE "TaskWorkflowStage" ADD VALUE IF NOT EXISTS 'offer_expiration_3d';
ALTER TYPE "TaskWorkflowStage" ADD VALUE IF NOT EXISTS 'offer_expiration_1d';
ALTER TYPE "TaskWorkflowStage" ADD VALUE IF NOT EXISTS 'offer_expired';
