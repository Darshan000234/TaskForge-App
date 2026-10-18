/*
  Warnings:

  - A unique constraint covering the columns `[sender_email,receiver_email,org_id]` on the table `teaminvitation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "teaminvitation_sender_email_receiver_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "teaminvitation_sender_email_receiver_email_org_id_key" ON "teaminvitation"("sender_email", "receiver_email", "org_id");
