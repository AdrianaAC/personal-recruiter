-- CreateIndex
CREATE INDEX "CallUp_userId_archivedAt_updatedAt_idx" ON "CallUp"("userId", "archivedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "CallUp_userId_archivedAt_status_scheduledAt_idx" ON "CallUp"("userId", "archivedAt", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "JobApplication_userId_archivedAt_updatedAt_idx" ON "JobApplication"("userId", "archivedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "Task_userId_archivedAt_completed_updatedAt_idx" ON "Task"("userId", "archivedAt", "completed", "updatedAt");

-- CreateIndex
CREATE INDEX "Task_userId_archivedAt_completed_dueDate_idx" ON "Task"("userId", "archivedAt", "completed", "dueDate");
