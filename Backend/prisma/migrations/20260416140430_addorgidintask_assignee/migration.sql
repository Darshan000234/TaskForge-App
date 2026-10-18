/*
  Warnings:

  - Added the required column `org_id` to the `task_assignee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "task_assignee" ADD COLUMN     "org_id" INTEGER NOT NULL;
