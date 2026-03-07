-- CreateEnum
CREATE TYPE "ApplyMode" AS ENUM ('always', 'auto', 'glob', 'manual');

-- AlterTable
ALTER TABLE "Item" ADD COLUMN "apply_mode" "ApplyMode" NOT NULL DEFAULT 'auto',
ADD COLUMN "globs" TEXT;
