/*
  Warnings:

  - Added the required column `message` to the `teaminvitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "teaminvitation" ADD COLUMN     "message" TEXT NOT NULL;
