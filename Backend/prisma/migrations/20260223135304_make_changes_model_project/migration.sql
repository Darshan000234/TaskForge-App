/*
  Warnings:

  - Added the required column `name` to the `project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `org_id` to the `task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "project" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "task" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "org_id" INTEGER NOT NULL;
