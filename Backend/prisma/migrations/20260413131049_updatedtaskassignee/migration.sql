/*
  Warnings:

  - Added the required column `Description` to the `task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Status` to the `task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dueDate` to the `task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priority` to the `task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "task" ADD COLUMN     "Description" TEXT NOT NULL,
ADD COLUMN     "Status" TEXT NOT NULL,
ADD COLUMN     "dueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "priority" TEXT NOT NULL;
