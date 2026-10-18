/*
  Warnings:

  - A unique constraint covering the columns `[receiver_email,org_id]` on the table `teaminvitation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "org_userId_name_key";

-- DropIndex
DROP INDEX "teaminvitation_sender_email_receiver_email_org_id_key";

-- CreateTable
CREATE TABLE "org_member" (
    "id" SERIAL NOT NULL,
    "org_id" INTEGER NOT NULL,
    "member_id" INTEGER NOT NULL,

    CONSTRAINT "org_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "org_member_member_id_idx" ON "org_member"("member_id");

-- CreateIndex
CREATE INDEX "org_userId_idx" ON "org"("userId");

-- CreateIndex
CREATE INDEX "org_id_idx" ON "org"("id");

-- CreateIndex
CREATE UNIQUE INDEX "teaminvitation_receiver_email_org_id_key" ON "teaminvitation"("receiver_email", "org_id");
