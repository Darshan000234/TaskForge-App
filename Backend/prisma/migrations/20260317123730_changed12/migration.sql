/*
  Warnings:

  - You are about to drop the column `member_count` on the `org_member` table. All the data in the column will be lost.
  - You are about to drop the column `org_created` on the `org_member` table. All the data in the column will be lost.
  - You are about to drop the column `org_name` on the `org_member` table. All the data in the column will be lost.
  - You are about to drop the column `proj_count` on the `org_member` table. All the data in the column will be lost.
  - You are about to drop the column `org_name` on the `teaminvitation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[member_id,org_id]` on the table `org_member` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "org_member" DROP COLUMN "member_count",
DROP COLUMN "org_created",
DROP COLUMN "org_name",
DROP COLUMN "proj_count";

-- AlterTable
ALTER TABLE "teaminvitation" DROP COLUMN "org_name";

-- CreateIndex
CREATE INDEX "org_member_org_id_idx" ON "org_member"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "org_member_member_id_org_id_key" ON "org_member"("member_id", "org_id");

-- AddForeignKey
ALTER TABLE "org_member" ADD CONSTRAINT "org_member_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
