-- CreateEnum
CREATE TYPE "Role" AS ENUM ('manager', 'member');

-- CreateTable
CREATE TABLE "proj_member" (
    "id" SERIAL NOT NULL,
    "proj_id" INTEGER NOT NULL,
    "org_id" INTEGER NOT NULL,
    "member_id" INTEGER NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "proj_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proj_member_org_id_member_id_idx" ON "proj_member"("org_id", "member_id");

-- AddForeignKey
ALTER TABLE "proj_member" ADD CONSTRAINT "proj_member_proj_id_fkey" FOREIGN KEY ("proj_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
