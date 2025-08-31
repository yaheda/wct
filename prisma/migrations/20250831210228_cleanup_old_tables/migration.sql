-- Remove old tables after successful data migration
-- Data has been safely migrated to the new SaaS-focused structure

-- Drop foreign key constraints first
ALTER TABLE "public"."website_changes" DROP CONSTRAINT "website_changes_websiteId_fkey";
ALTER TABLE "public"."websites" DROP CONSTRAINT "websites_userId_fkey";

-- Drop old tables
DROP TABLE "public"."website_changes";
DROP TABLE "public"."websites";

-- Add comment to document the cleanup
COMMENT ON TABLE "public"."companies" IS 'SaaS competitor tracking - migrated from old websites table';
COMMENT ON TABLE "public"."monitored_pages" IS 'SaaS page monitoring - enhanced from old website monitoring';
COMMENT ON TABLE "public"."saas_changes" IS 'SaaS change tracking - migrated from old website_changes table';