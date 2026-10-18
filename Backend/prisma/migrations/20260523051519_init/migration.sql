-- AddForeignKey
ALTER TABLE "org_member" ADD CONSTRAINT "org_member_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
