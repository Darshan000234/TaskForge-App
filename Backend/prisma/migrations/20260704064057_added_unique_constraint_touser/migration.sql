/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "task_assignee_proj_id_user_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE INDEX "proj_member_proj_id_member_id_idx" ON "proj_member"("proj_id", "member_id");

-- CreateIndex
CREATE INDEX "task_assignee_proj_id_idx" ON "task_assignee"("proj_id");
