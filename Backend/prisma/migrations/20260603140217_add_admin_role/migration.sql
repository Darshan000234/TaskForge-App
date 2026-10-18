-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'admin';

-- DropForeignKey
ALTER TABLE "task_assignee" DROP CONSTRAINT "task_assignee_user_id_fkey";

-- AddForeignKey
ALTER TABLE "task_assignee" ADD CONSTRAINT "task_assignee_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
