/*
  Warnings:

  - Added the required column `member_email` to the `org_member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiver_email` to the `teaminvitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "org_member" ADD COLUMN     "member_email" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "teaminvitation" ADD COLUMN     "receiver_email" TEXT NOT NULL;
