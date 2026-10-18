/*
  Warnings:

  - You are about to drop the column `receriver_id` on the `teaminvitation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[receiver_id,org_id]` on the table `teaminvitation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `org_name` to the `org_member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `org_name` to the `teaminvitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiver_id` to the `teaminvitation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "teaminvitation_receriver_id_idx";

-- DropIndex
DROP INDEX "teaminvitation_receriver_id_org_id_key";

-- AlterTable
ALTER TABLE "org" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'admin';

-- AlterTable
ALTER TABLE "org_member" ADD COLUMN     "org_name" TEXT NOT NULL,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'member';

-- AlterTable
ALTER TABLE "teaminvitation" DROP COLUMN "receriver_id",
ADD COLUMN     "org_name" TEXT NOT NULL,
ADD COLUMN     "receiver_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "teaminvitation_receiver_id_idx" ON "teaminvitation"("receiver_id");

-- CreateIndex
CREATE UNIQUE INDEX "teaminvitation_receiver_id_org_id_key" ON "teaminvitation"("receiver_id", "org_id");
