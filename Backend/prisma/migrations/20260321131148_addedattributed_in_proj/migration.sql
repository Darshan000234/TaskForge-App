/*
  Warnings:

  - You are about to drop the column `userId` on the `project` table. All the data in the column will be lost.
  - Added the required column `Descirption` to the `project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priority` to the `project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "project" DROP COLUMN "userId",
ADD COLUMN     "Descirption" TEXT NOT NULL,
ADD COLUMN     "last_update" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "priority" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "project_org_id_idx" ON "project"("org_id");
