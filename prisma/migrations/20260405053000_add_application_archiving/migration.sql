ALTER TABLE "JobApplication"
ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "JobApplication_userId_archivedAt_idx"
ON "JobApplication"("userId", "archivedAt");
