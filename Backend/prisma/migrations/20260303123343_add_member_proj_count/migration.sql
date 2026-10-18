/*
  Warnings:

  - Added the required column `member_count` to the `org` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proj_count` to the `org` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('pending', 'accepted', 'rejected');

-- AlterTable
ALTER TABLE "org" ADD COLUMN     "member_count" INTEGER NOT NULL,
ADD COLUMN     "proj_count" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "teaminvitation" (
    "id" SERIAL NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "org_id" INTEGER NOT NULL,

    CONSTRAINT "teaminvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teaminvitation_sender_id_receiver_id_key" ON "teaminvitation"("sender_id", "receiver_id");
