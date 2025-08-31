-- Add new fields to users table for SaaS functionality
ALTER TABLE "public"."users" ADD COLUMN "companyName" TEXT,
ADD COLUMN "role" TEXT,
ADD COLUMN "saasCategory" TEXT;

-- Create new SaaS-focused tables
CREATE TABLE "public"."companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "saasCategory" TEXT,
    "isCompetitor" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."monitored_pages" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "checkInterval" INTEGER NOT NULL DEFAULT 1440,
    "lastChecked" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitored_pages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."saas_changes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "pageId" TEXT,
    "changeType" TEXT NOT NULL,
    "changeSummary" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "impactLevel" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "competitiveAnalysis" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_changes_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "public"."companies" ADD CONSTRAINT "companies_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."monitored_pages" ADD CONSTRAINT "monitored_pages_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."saas_changes" ADD CONSTRAINT "saas_changes_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."saas_changes" ADD CONSTRAINT "saas_changes_pageId_fkey" 
    FOREIGN KEY ("pageId") REFERENCES "public"."monitored_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;