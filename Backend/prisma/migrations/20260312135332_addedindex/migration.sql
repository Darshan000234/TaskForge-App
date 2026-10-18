/*
  Warnings:

  - A unique constraint covering the columns `[receiver_email]` on the table `teaminvitation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "teaminvitation_receiver_email_key" ON "teaminvitation"("receiver_email");
