/*
  Warnings:

  - A unique constraint covering the columns `[proj_id,member_id]` on the table `proj_member` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "proj_member_proj_id_idx" ON "proj_member"("proj_id");

-- CreateIndex
CREATE UNIQUE INDEX "proj_member_proj_id_member_id_key" ON "proj_member"("proj_id", "member_id");

-- AddForeignKey
ALTER TABLE "proj_member" ADD CONSTRAINT "proj_member_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
