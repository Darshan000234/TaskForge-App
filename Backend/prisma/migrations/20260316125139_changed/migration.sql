/*
  Warnings:

  - You are about to drop the column `user_email` on the `org` table. All the data in the column will be lost.
  - You are about to drop the column `user_email` on the `project` table. All the data in the column will be lost.
  - You are about to drop the column `user_email` on the `task` table. All the data in the column will be lost.
  - You are about to drop the column `receiver_email` on the `teaminvitation` table. All the data in the column will be lost.
  - You are about to drop the column `sender_email` on the `teaminvitation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[receriver_id,org_id]` on the table `teaminvitation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `receriver_id` to the `teaminvitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_id` to the `teaminvitation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "teaminvitation_receiver_email_idx";

-- DropIndex
DROP INDEX "teaminvitation_receiver_email_org_id_key";

-- AlterTable
ALTER TABLE "org" DROP COLUMN "user_email";

-- AlterTable
ALTER TABLE "project" DROP COLUMN "user_email";

-- AlterTable
ALTER TABLE "task" DROP COLUMN "user_email";

-- AlterTable
ALTER TABLE "teaminvitation" DROP COLUMN "receiver_email",
DROP COLUMN "sender_email",
ADD COLUMN     "receriver_id" INTEGER NOT NULL,
ADD COLUMN     "sender_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "teaminvitation_receriver_id_idx" ON "teaminvitation"("receriver_id");

-- CreateIndex
CREATE UNIQUE INDEX "teaminvitation_receriver_id_org_id_key" ON "teaminvitation"("receriver_id", "org_id");
