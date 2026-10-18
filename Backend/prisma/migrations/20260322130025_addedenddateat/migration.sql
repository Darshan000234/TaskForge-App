/*
  Warnings:

  - You are about to drop the column `Descirption` on the `project` table. All the data in the column will be lost.
  - Added the required column `Description` to the `project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "project" DROP COLUMN "Descirption",
ADD COLUMN     "Description" TEXT NOT NULL;
