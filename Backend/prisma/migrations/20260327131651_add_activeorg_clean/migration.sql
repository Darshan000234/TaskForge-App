-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeorg" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeorg_fkey" FOREIGN KEY ("activeorg") REFERENCES "org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
