/*
  Warnings:

  - Added the required column `assigned_to` to the `project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assigned_to` to the `task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "project" ADD COLUMN     "assigned_to" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "task" ADD COLUMN     "assigned_to" INTEGER NOT NULL;
