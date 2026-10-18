-- DropForeignKey
ALTER TABLE "proj_member" DROP CONSTRAINT "proj_member_member_id_fkey";

-- DropForeignKey
ALTER TABLE "task_assignee" DROP CONSTRAINT "task_assignee_user_id_fkey";

-- AlterTable
ALTER TABLE "message" ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "project" ALTER COLUMN "assigned_to" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "AuditLog_proj_id_idx" ON "AuditLog"("proj_id");

-- CreateIndex
CREATE INDEX "AuditLog_proj_id_createdAt_idx" ON "AuditLog"("proj_id", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "task_org_id_idx" ON "task"("org_id");

-- CreateIndex
CREATE INDEX "task_org_id_Status_idx" ON "task"("org_id", "Status");

-- CreateIndex
CREATE INDEX "task_org_id_dueDate_idx" ON "task"("org_id", "dueDate");

-- CreateIndex
CREATE INDEX "task_assignee_user_id_org_id_idx" ON "task_assignee"("user_id", "org_id");

-- CreateIndex
CREATE INDEX "task_assignee_task_id_idx" ON "task_assignee"("task_id");

-- CreateIndex
CREATE INDEX "teaminvitation_sender_id_idx" ON "teaminvitation"("sender_id");

-- CreateIndex
CREATE INDEX "teaminvitation_org_id_idx" ON "teaminvitation"("org_id");

-- AddForeignKey
ALTER TABLE "proj_member" ADD CONSTRAINT "proj_member_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignee" ADD CONSTRAINT "task_assignee_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
