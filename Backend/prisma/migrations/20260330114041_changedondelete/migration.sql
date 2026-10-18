-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_activeorg_fkey";

-- DropForeignKey
ALTER TABLE "proj_member" DROP CONSTRAINT "proj_member_member_id_fkey";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeorg_fkey" FOREIGN KEY ("activeorg") REFERENCES "org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proj_member" ADD CONSTRAINT "proj_member_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
