/*
  Warnings:

  - Added the required column `member_count` to the `org_member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `org_created` to the `org_member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proj_count` to the `org_member` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "org_member" ADD COLUMN     "member_count" INTEGER NOT NULL,
ADD COLUMN     "org_created" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "proj_count" INTEGER NOT NULL;
