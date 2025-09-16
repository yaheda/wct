# SaaS Competitor Monitor MVP - Product Requirements Document

## 1. Executive Summary

### Product Vision
A specialized monitoring service that tracks SaaS websites for pricing changes, feature announcements, and competitive updates, delivering intelligent alerts to help SaaS founders and product teams stay ahead of the competition.

### Success Metrics
- **Primary**: 50 active SaaS companies monitoring 500+ competitor websites within 3 months
- **Secondary**: 90%+ accuracy in detecting meaningful SaaS-related changes (pricing, features, headlines)
- **Tertiary**: Average user monitors 8-12 competitor websites actively
- **Social Media**: 30+ companies using Instagram monitoring, average 5+ competitor social profiles per user

### MVP Timeline
**8 weeks** from development start to production launch

---

## 2. Problem Statement

### User Problem
SaaS founders, product managers, and marketing teams spend hours manually checking competitor websites for pricing changes, new feature announcements, and product updates. This manual process is time-consuming, inconsistent, and often misses critical competitive intelligence.

### Market Opportunity
- 30,000+ SaaS companies globally need competitive intelligence
- Average SaaS company monitors 5-15 competitors manually
- Existing solutions are either too generic or too expensive ($200+/month)
- SaaS-specific monitoring doesn't exist - huge white space opportunity

---

## 3. Target Users

### Primary User: SaaS Founder/CEO
- **Profile**: Tech-savvy, 28-45 years old, running early to growth-stage SaaS
- **Use Cases**: Monitor competitor pricing, track feature releases, watch positioning changes
- **Pain Points**: Limited time, needs actionable intelligence, wants competitive advantage
- **Budget**: $20-100/month for competitive intelligence tools

### Secondary User: SaaS Product Manager
- **Profile**: Product leader at Series A-C SaaS companies
- **Use Cases**: Feature gap analysis, pricing strategy, roadmap prioritization
- **Pain Points**: Needs data-driven competitive insights, reports to leadership
- **Budget**: Company expense, higher willingness to pay ($50-200/month)

### Tertiary User: SaaS Marketing Manager  
- **Profile**: Marketing leader focused on positioning and messaging
- **Use Cases**: Competitive messaging, positioning analysis, campaign intelligence
- **Pain Points**: Needs to understand competitor marketing strategies
- **Budget**: Part of marketing tools budget ($30-150/month)

---

## 4. Core Features (MVP Scope)

### 4.1 SaaS-Focused User Management
**Epic**: Tailored authentication and onboarding for SaaS professionals

**User Stories:**
- As a SaaS founder, I can create an account and specify my company and industry vertical
- As a user, I can indicate my role (founder, PM, marketer) for personalized experience
- As a user, I can set my competitive monitoring goals and priorities
- As a user, I can invite team members to collaborate (up to 3 users)

**Acceptance Criteria:**
- Registration includes company name, SaaS category, and role
- Onboarding flow suggests relevant competitors to monitor
- Team workspace with shared competitor lists
- Role-based dashboard customization

### 4.2 SaaS Website Discovery & Setup
**Epic**: Intelligent competitor website addition with SaaS-specific focus

**User Stories:**
- As a user, I can add competitor SaaS websites with automatic page detection
- As a user, I can specify what to monitor: pricing pages, feature pages, blog/changelog
- As a user, I can see suggested competitors based on my SaaS category
- As a user, I can set monitoring frequency per competitor (daily/weekly)

**Acceptance Criteria:**
- Automatic detection of key SaaS pages (pricing, features, about, blog)
- Pre-built competitor database for common SaaS categories
- Smart page suggestions: "/pricing", "/features", "/changelog", "/blog"
- Maximum 15 competitors with 3 pages each (45 total pages monitored)

**SaaS Page Types to Auto-Detect:**
```
/pricing, /plans, /billing - Pricing changes
/features, /product, /platform - Feature updates  
/blog, /changelog, /updates, /news - Announcements
/about, /company - Positioning changes
/ (homepage) - Headlines and messaging
```

### 4.3 SaaS-Intelligent Change Detection
**Epic**: LLM-powered change detection optimized for SaaS content

**User Stories:**
- As a user, I want to detect pricing changes with exact before/after amounts
- As a user, I want to know when competitors announce new features
- As a user, I want alerts for headline/positioning changes on homepages
- As a user, I want to ignore irrelevant changes (blog dates, testimonials)

**Acceptance Criteria:**
- LLM trained to understand SaaS terminology and context
- Pricing change detection with dollar amounts and percentage changes
- Feature announcement detection with categorization
- Headline/messaging change detection for positioning insights
- Smart filtering of irrelevant content (testimonials, job postings, legal updates)

**LLM Prompt Optimization for SaaS:**
```javascript
const saasPrompt = `
You are a SaaS competitive intelligence expert. Analyze these webpage contents for meaningful business changes:

WEBSITE: ${competitorName} - ${pageType} 
BASELINE CONTENT: ${baselineContent}
CURRENT CONTENT: ${currentContent}

FOCUS ON:
- Pricing changes (plans, amounts, features included)
- New feature announcements or removals
- Product positioning and messaging changes
- Integration announcements
- Security/compliance updates

IGNORE:
- Blog post dates and timestamps
- Customer testimonials and case studies  
- Job postings and team updates
- Legal/privacy policy changes
- Social media feeds and view counts

Respond with JSON:
{
  "hasSignificantChange": boolean,
  "changeType": "pricing|features|messaging|product|integration|other",
  "changeSummary": "specific, actionable summary under 80 chars",
  "details": {
    "oldValue": "before state if applicable",
    "newValue": "after state if applicable", 
    "impact": "high|medium|low"
  },
  "confidence": "high|medium|low"
}
`;
```

### 4.4 SaaS-Focused Email Notifications
**Epic**: Intelligent alerts with SaaS competitive context

**User Stories:**
- As a user, I want email alerts that clearly explain competitive implications
- As a user, I want pricing change alerts with competitive analysis context
- As a user, I want feature announcements with gap analysis suggestions
- As a user, I want daily/weekly summary emails of all competitor activity

**Acceptance Criteria:**
- Immediate alerts for pricing changes (within 2 hours)
- Feature announcement alerts within 6 hours
- Weekly summary email with all competitor activity
- Email templates optimized for SaaS terminology and context

**Email Template Examples:**
```
Subject: 🚨 [Competitor] dropped their Pro plan price by 20%

Hi [Name],

PRICING ALERT: [Competitor] just reduced their Pro plan from $99/mo to $79/mo (20% decrease).

COMPETITIVE IMPACT:
• Your Pro plan ($89/mo) is now 13% higher
• This affects your mid-market positioning  
• Consider: Price adjustment or feature differentiation

WHAT CHANGED:
• Pro Plan: $99/mo → $79/mo
• Enterprise Plan: Unchanged at $199/mo
• No feature changes detected

View full analysis: [link]

---

Subject: 📢 [Competitor] launched AI-powered analytics feature

Hi [Name],

FEATURE ALERT: [Competitor] just announced "AI Analytics" on their features page.

COMPETITIVE IMPACT:
• This addresses a gap in your current offering
• 73% of your target market requests AI features
• Consider: Roadmap prioritization review

WHAT'S NEW:
• AI-powered data insights and recommendations
• Automated report generation
• Predictive analytics dashboard

View competitor page: [link]
Add to roadmap review: [link]
```

### 4.5 SaaS Competitive Intelligence Dashboard
**Epic**: SaaS-specific dashboard with competitive insights

**User Stories:**
- As a user, I can see all my competitors' recent changes in one view
- As a user, I can filter changes by type (pricing, features, messaging)
- As a user, I can see competitive analysis with my own product positioning
- As a user, I can export competitive intelligence reports for my team

**Acceptance Criteria:**
- Dashboard organized by change type and competitor
- Pricing changes highlighted with competitive impact analysis
- Feature gap analysis with suggested actions
- Export functionality for team sharing and presentations

### 4.6 Social Media Profile Monitoring
**Epic**: Monitor competitor social media presence and posting activity

**User Stories:**
- As a user, I can add Instagram handles for my competitors
- As a user, I can manually scrape competitor Instagram posts and engagement metrics
- As a user, I can view recent posts, captions, and comment counts in one dashboard
- As a user, I can track competitor posting frequency and engagement patterns
- As a user, I can batch process multiple competitor social profiles at once

**Acceptance Criteria:**
- Instagram handle setup and validation for each competitor
- Manual and batch scraping of Instagram posts using Apify integration
- Post data collection including captions, timestamps, engagement metrics, and recent comments
- Social media dashboard showing recent activity across all monitored competitors
- Data persistence for historical social media activity tracking

**Current Implementation Status:**
- ✅ Instagram profile setup and management UI
- ✅ Apify-based Instagram scraping infrastructure
- ✅ Database models for social profiles and post snapshots
- ✅ Manual scraping with real-time results display
- 🔄 **Missing**: Scheduled automatic scraping (cron job implementation needed)
- 🔄 **Missing**: Email notifications for new social media activity
- 📋 **Future**: LLM-based social media change detection and analysis

**Technical Implementation:**
```javascript
// Database Models
SocialProfile: {
  platform: 'instagram' | 'twitter' | 'facebook' | 'linkedin',
  handle: string,
  url: string,
  companyId: string,
  isActive: boolean,
  lastChecked: DateTime
}

SocialSnapshot: {
  profileId: string,
  capturedAt: DateTime,
  metrics: {
    postsCount: number,
    posts: InstagramPost[]
  },
  raw: InstagramPost[]
}

InstagramPost: {
  caption: string,
  url: string,
  timestamp: string,
  commentsCount: number,
  latestComments: Comment[]
}
```

---

## 5. SaaS-Specific Technical Requirements

### 5.1 SaaS Website Optimization
**Page Detection Logic:**
```javascript
const saasPageDetection = {
  pricing: ['/pricing', '/plans', '/billing', '/subscribe'],
  features: ['/features', '/product', '/platform', '/capabilities'],
  updates: ['/blog', '/changelog', '/updates', '/news', '/releases'],
  company: ['/about', '/company', '/', '/home'],
  
  autoDetect: async (domain) => {
    const commonPaths = Object.values(saasPageDetection).flat();
    const foundPages = [];
    
    for (const path of commonPaths) {
      const url = `${domain}${path}`;
      const response = await testUrl(url);
      if (response.status === 200) {
        foundPages.push({
          url,
          type: getPageType(path),
          priority: getMonitoringPriority(path)
        });
      }
    }
    return foundPages;
  }
};
```

### 5.2 SaaS Content Processing
**Pricing Extraction:**
```javascript
const pricingExtractor = {
  patterns: [
    /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*\/?\s*(mo|month|yr|year|annually)?/gi,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*dollars?\s*\/?\s*(mo|month|yr|year)?/gi,
    /(free|trial|demo)/gi
  ],
  
  extract: (content) => {
    const prices = [];
    // Extract pricing information with context
    // Return structured pricing data
  }
};
```

### 5.3 Database Schema (SaaS-Optimized)
```sql
-- Companies table (SaaS-specific)
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  saas_category VARCHAR(100), -- CRM, Analytics, Marketing, etc.
  is_competitor BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Monitored pages with SaaS context
CREATE TABLE monitored_pages (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  url TEXT NOT NULL,
  page_type VARCHAR(50), -- pricing, features, blog, homepage
  priority INTEGER DEFAULT 1, -- 1=high, 2=medium, 3=low
  last_checked TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active'
);

-- SaaS-specific change alerts
CREATE TABLE saas_changes (
  id SERIAL PRIMARY KEY,
  page_id INTEGER REFERENCES monitored_pages(id),
  change_type VARCHAR(50), -- pricing, features, messaging, etc.
  old_value TEXT,
  new_value TEXT,
  impact_level VARCHAR(20), -- high, medium, low
  competitive_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Social media profiles for competitors
CREATE TABLE social_profiles (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  platform VARCHAR(50) NOT NULL, -- instagram, twitter, facebook, linkedin, tiktok, youtube
  handle VARCHAR(255) NOT NULL,
  url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_checked TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, platform)
);

-- Social media data snapshots
CREATE TABLE social_snapshots (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER REFERENCES social_profiles(id),
  captured_at TIMESTAMP DEFAULT NOW(),
  metrics JSONB, -- Post counts, engagement metrics, etc.
  raw JSONB, -- Raw scraped data (posts, comments, etc.)
  run_id VARCHAR(255), -- Reference to scraping run
  dataset_id VARCHAR(255), -- Apify dataset ID
  actor_id VARCHAR(255), -- Apify actor ID
  notes TEXT
);
```

---

## 6. Go-to-Market Strategy

### 6.1 Target SaaS Communities
**Primary Channels:**
- **Indie Hackers**: Solo SaaS founders (perfect fit)
- **Reddit**: r/SaaS (40K), r/EntrepreneurRideAlong, r/startups
- **Twitter**: #SaaS, #BuildInPublic, #SaaSFounder hashtags
- **SaaS-specific Slack/Discord communities**
- **Product Hunt**: SaaS maker community

### 6.2 Content Marketing (SaaS-Focused)
**Blog Content:**
1. "How [Successful SaaS] Uses Competitive Intelligence to Stay Ahead"
2. "15 SaaS Pricing Changes That Changed Everything (2024)"
3. "The SaaS Founder's Guide to Competitive Monitoring"
4. "Feature Gap Analysis: How to Prioritize Based on Competitor Moves"

**Lead Magnets:**
1. "The Ultimate SaaS Competitive Analysis Template"
2. "50 SaaS Competitors You Should Be Monitoring (by Category)"
3. "SaaS Pricing Strategy Playbook with Competitor Examples"

### 6.3 SaaS Partnerships
**Integration Opportunities:**
- **Product management tools**: Roadmapping tools, user feedback platforms
- **Analytics platforms**: Mixpanel, Amplitude (competitive insights)
- **CRM systems**: Hubspot, Pipedrive (competitive sales intelligence)
- **Slack apps**: Competitive alerts in team channels

---

## 7. Pricing Strategy

### 7.1 MVP Pricing Tiers
```
STARTER (Free)
- 3 competitors
- 9 pages total (3 pages per competitor)
- Weekly email summaries
- Basic change detection

GROWTH ($29/month)
- 10 competitors  
- 30 pages total
- Daily alerts + weekly summaries
- Advanced SaaS change detection
- Team sharing (3 users)
- Export reports

PRO ($79/month)
- 25 competitors
- 75 pages total
- Real-time alerts (2-hour max)
- Competitive analysis insights
- Unlimited team members
- API access
- Custom integrations
```

### 7.2 Value Proposition
**ROI Calculation for SaaS founders:**
- Manual monitoring: 5 hours/week × $100/hour = $500/week = $2,000/month
- Our tool: $29-79/month
- **ROI: 25-70x return on investment**

---

## 8. Success Criteria & KPIs

### 8.1 Product-Market Fit Indicators
- [ ] 40+ active SaaS companies using the tool regularly
- [ ] Average 8+ competitors monitored per user
- [ ] 80%+ user retention after first month
- [ ] Users upgrading from free to paid (20%+ conversion rate)

### 8.2 Feature Effectiveness
- [ ] 90%+ accuracy in detecting SaaS pricing changes
- [ ] 85%+ accuracy in detecting feature announcements
- [ ] <10% false positive rate for meaningful changes
- [ ] Users act on 60%+ of alerts (engagement tracking)
- [ ] Social media data collection success rate >95% (Instagram scraping reliability)
- [ ] Average 20+ posts collected per competitor social profile monthly

### 8.3 Business Metrics
- [ ] $5,000 MRR within 3 months of launch
- [ ] Average revenue per user (ARPU) of $45/month
- [ ] Customer acquisition cost (CAC) under $150
- [ ] Net Promoter Score (NPS) above 50

---

## 9. Competitive Landscape Analysis

### 9.1 Current Solutions (Gaps to Exploit)
**ChangeTower** ($49-199/month)
- ❌ Generic, not SaaS-focused
- ❌ Expensive for early-stage SaaS
- ❌ No competitive analysis context

**Visualping** ($19-99/month)  
- ❌ Basic visual monitoring only
- ❌ No SaaS intelligence features
- ❌ High false positive rates

**Klenty Compete** (Discontinued)
- ✅ Was SaaS-focused (validation!)
- ❌ No longer available (opportunity!)

### 9.2 Our Competitive Advantages
- ✅ **SaaS-native**: Built specifically for SaaS competitive intelligence
- ✅ **Intelligent alerts**: LLM-powered, context-aware notifications
- ✅ **Affordable**: Priced for early-stage SaaS companies
- ✅ **Actionable insights**: Not just alerts, but competitive analysis

---

## 10. Risk Assessment & Mitigation

### 10.1 Technical Risks
**Risk**: SaaS websites implementing anti-scraping measures
**Mitigation**: Respectful scraping practices, rate limiting, fallback strategies

**Risk**: LLM costs scaling faster than revenue
**Mitigation**: Cost monitoring, traditional fallback, pricing optimization

### 10.2 Market Risks  
**Risk**: Low adoption among target SaaS audience
**Mitigation**: Extensive user interviews, freemium model, community building

**Risk**: Incumbents adding SaaS-specific features
**Mitigation**: Speed to market, specialized expertise, community moat

---

## 11. Development Phases (SaaS-Optimized)

### Phase 1: Foundation (Weeks 1-2)
- [ ] SaaS-focused user onboarding and company profiles
- [ ] Competitor database with common SaaS companies
- [ ] Basic SaaS page detection (pricing, features, blog)

### Phase 2: Core SaaS Monitoring (Weeks 3-4)  
- [ ] SaaS-optimized web scraping (pricing pages, feature pages)
- [ ] LLM integration with SaaS-specific prompts
- [ ] Pricing change detection with dollar amount extraction

### Phase 3: Intelligent Notifications (Weeks 5-6)
- [ ] SaaS-focused email templates with competitive context
- [ ] Feature announcement detection and categorization
- [ ] Messaging/positioning change detection for homepages

### Phase 4: SaaS Dashboard & Launch (Weeks 7-8)
- [ ] Competitive intelligence dashboard with SaaS insights
- [ ] Export functionality for team sharing
- [ ] Social media profile monitoring (Instagram setup and manual scraping)
- [ ] Beta launch in SaaS communities
- [ ] User feedback collection and iteration

---

## 12. Post-MVP SaaS Roadmap

### Immediate Enhancements (Months 2-3)
- Advanced pricing analysis (plan comparisons, feature matrices)
- Integration announcements and partnership tracking
- Funding/acquisition news monitoring
- **Scheduled social media scraping** (automated Instagram monitoring with cron jobs)
- **Social media email notifications** (alerts for new posts and engagement spikes)
- Slack/Teams integrations for team alerts

### Advanced Features (Months 4-6)
- Feature gap analysis with recommendations
- Competitive positioning maps and insights
- API for product management tool integrations
- Custom competitor categories and tagging
- Automated competitive analysis reports
- **Multi-platform social media monitoring** (Twitter, LinkedIn, Facebook expansion)
- **Social media change detection** (LLM analysis of posts for announcements and campaigns)
- **Social media competitive insights** (engagement pattern analysis and posting strategy recommendations)

This SaaS-focused approach creates a specialized, valuable tool for a well-defined market with clear willingness to pay and strong network effects within the SaaS community.