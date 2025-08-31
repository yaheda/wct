-- Remove SaaS category fields to simplify MVP
-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "saasCategory";

-- AlterTable  
ALTER TABLE "public"."companies" DROP COLUMN "saasCategory";