-- AddForeignKey
ALTER TABLE "task_assignee" ADD CONSTRAINT "task_assignee_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
