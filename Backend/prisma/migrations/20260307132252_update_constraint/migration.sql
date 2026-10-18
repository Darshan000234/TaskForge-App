/*
  Warnings:

  - You are about to drop the column `receiver_id` on the `teaminvitation` table. All the data in the column will be lost.
  - You are about to drop the column `sender_id` on the `teaminvitation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sender_email,receiver_email]` on the table `teaminvitation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `receiver_email` to the `teaminvitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_email` to the `teaminvitation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "teaminvitation_sender_id_receiver_id_key";

-- AlterTable
ALTER TABLE "teaminvitation" DROP COLUMN "receiver_id",
DROP COLUMN "sender_id",
ADD COLUMN     "receiver_email" TEXT NOT NULL,
ADD COLUMN     "sender_email" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "teaminvitation_sender_email_receiver_email_key" ON "teaminvitation"("sender_email", "receiver_email");
