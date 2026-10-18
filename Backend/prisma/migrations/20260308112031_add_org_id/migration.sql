/*
  Warnings:

  - Added the required column `org_id` to the `teaminvitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "teaminvitation" ADD COLUMN     "org_id" INTEGER NOT NULL;
