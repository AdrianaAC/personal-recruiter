/*
  Warnings:

  - You are about to drop the column `contactCompany` on the `CallUp` table. All the data in the column will be lost.
  - You are about to drop the column `contactName` on the `CallUp` table. All the data in the column will be lost.
  - Made the column `userId` on table `Task` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CallUp" DROP COLUMN "contactCompany",
DROP COLUMN "contactName",
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "contactId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "CallUp_contactId_idx" ON "CallUp"("contactId");

-- AddForeignKey
ALTER TABLE "CallUp" ADD CONSTRAINT "CallUp_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
