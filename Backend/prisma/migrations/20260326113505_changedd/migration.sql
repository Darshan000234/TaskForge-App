-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
