-- CreateEnum
CREATE TYPE "CallUpStatus" AS ENUM ('PLANNED', 'DONE', 'MISSED');

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_applicationId_fkey";

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "userId" TEXT,
ALTER COLUMN "applicationId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CallUp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "status" "CallUpStatus" NOT NULL DEFAULT 'PLANNED',
    "contactName" TEXT,
    "contactCompany" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallUp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CallUp_userId_idx" ON "CallUp"("userId");

-- CreateIndex
CREATE INDEX "CallUp_applicationId_idx" ON "CallUp"("applicationId");

-- CreateIndex
CREATE INDEX "CallUp_userId_status_idx" ON "CallUp"("userId", "status");

-- CreateIndex
CREATE INDEX "CallUp_userId_scheduledAt_idx" ON "CallUp"("userId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Task_userId_idx" ON "Task"("userId");

-- CreateIndex
CREATE INDEX "Task_completed_idx" ON "Task"("completed");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallUp" ADD CONSTRAINT "CallUp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallUp" ADD CONSTRAINT "CallUp_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
