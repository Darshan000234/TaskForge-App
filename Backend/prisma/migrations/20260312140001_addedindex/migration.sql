-- DropIndex
DROP INDEX "teaminvitation_receiver_email_key";

-- CreateIndex
CREATE INDEX "teaminvitation_receiver_email_idx" ON "teaminvitation"("receiver_email");
