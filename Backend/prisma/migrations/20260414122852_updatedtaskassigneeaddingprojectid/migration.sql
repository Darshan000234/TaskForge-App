/*
  Warnings:

  - Added the required column `proj_id` to the `task_assignee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "task_assignee" ADD COLUMN     "proj_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "task_assignee" ADD CONSTRAINT "task_assignee_proj_id_fkey" FOREIGN KEY ("proj_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
