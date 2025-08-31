-- Migrate existing website data to the new companies and monitored_pages structure

-- Step 1: Create companies from existing websites
INSERT INTO "public"."companies" (
    "id", 
    "name", 
    "domain", 
    "saasCategory", 
    "isCompetitor", 
    "userId", 
    "createdAt", 
    "updatedAt"
)
SELECT 
    w."id" as "id",
    w."name" as "name",
    -- Extract domain from URL
    CASE 
        WHEN w."url" LIKE 'http://%' THEN 
            split_part(split_part(w."url", '://', 2), '/', 1)
        WHEN w."url" LIKE 'https://%' THEN 
            split_part(split_part(w."url", '://', 2), '/', 1)
        ELSE 
            split_part(w."url", '/', 1)
    END as "domain",
    NULL as "saasCategory", -- Will need to be filled in manually or via categorization
    true as "isCompetitor",
    w."userId" as "userId",
    w."createdAt" as "createdAt",
    w."updatedAt" as "updatedAt"
FROM "public"."websites" w;

-- Step 2: Create monitored_pages for each company (initially as homepage monitoring)
INSERT INTO "public"."monitored_pages" (
    "id",
    "companyId",
    "url",
    "pageType",
    "priority",
    "isActive",
    "checkInterval",
    "lastChecked",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid() as "id",
    w."id" as "companyId", -- Using same ID as the website/company
    w."url" as "url",
    'homepage' as "pageType", -- Default to homepage
    2 as "priority", -- Medium priority for homepage
    w."isActive" as "isActive",
    w."checkInterval" as "checkInterval",
    NULL as "lastChecked",
    w."createdAt" as "createdAt",
    w."updatedAt" as "updatedAt"
FROM "public"."websites" w;

-- Step 3: Migrate existing website_changes to saas_changes
INSERT INTO "public"."saas_changes" (
    "id",
    "companyId",
    "pageId",
    "changeType",
    "changeSummary",
    "oldValue",
    "newValue",
    "impactLevel",
    "confidence",
    "competitiveAnalysis",
    "detectedAt"
)
SELECT 
    wc."id" as "id",
    wc."websiteId" as "companyId", -- The website ID now maps to company ID
    (SELECT mp."id" FROM "public"."monitored_pages" mp WHERE mp."companyId" = wc."websiteId" LIMIT 1) as "pageId",
    CASE 
        WHEN wc."changeType" = 'content' THEN 'messaging'
        WHEN wc."changeType" = 'structure' THEN 'product'
        ELSE 'other'
    END as "changeType",
    COALESCE(wc."description", 'Legacy website change') as "changeSummary",
    wc."oldValue" as "oldValue",
    wc."newValue" as "newValue",
    'medium' as "impactLevel", -- Default to medium
    'medium' as "confidence", -- Default to medium
    NULL as "competitiveAnalysis",
    wc."detectedAt" as "detectedAt"
FROM "public"."website_changes" wc;

-- Step 4: Add comment to track the migration
COMMENT ON TABLE "public"."companies" IS 'Migrated from websites table';
COMMENT ON TABLE "public"."monitored_pages" IS 'Migrated from websites table';
COMMENT ON TABLE "public"."saas_changes" IS 'Migrated from website_changes table';