import { ApifyClient } from 'apify-client'

export interface ApifyScrapingResult {
  url: string
  text: string
  title?: string
  metadata?: {
    statusCode?: number
    loadTime: number
    timestamp: Date
    crawlStats: {
      pagesProcessed: number
      requestsTotal: number
      requestsFailed: number
    }
  }
  error?: string
}

export interface ApifyScrapingOptions {
  maxCrawlDepth?: number
  maxCrawlPages?: number
  timeout?: number
  waitForNetworkIdle?: boolean
  respectRobots?: boolean
}

export interface CompetitorUrls {
  companyId: string
  companyName: string
  urls: string[]
}

class ApifyService {
  private client: ApifyClient | null = null
  private readonly WEBSITE_CONTENT_CRAWLER_ID = 'apify/website-content-crawler'

  constructor() {
    if (process.env.APIFY_API_TOKEN) {
      this.client = new ApifyClient({
        token: process.env.APIFY_API_TOKEN,
      })
    }
  }

  private isConfigured(): boolean {
    return this.client !== null && !!process.env.APIFY_API_TOKEN
  }

  async scrapeCompetitorPages(
    competitors: CompetitorUrls[],
    options: ApifyScrapingOptions = {}
  ): Promise<ApifyScrapingResult[]> {
    if (!this.isConfigured()) {
      throw new Error('Apify client not configured. Please set APIFY_API_TOKEN environment variable.')
    }

    // Flatten all URLs from all competitors
    const allUrls = competitors.flatMap(competitor =>
      competitor.urls.map(url => ({
        url,
        userData: {
          companyId: competitor.companyId,
          companyName: competitor.companyName
        }
      }))
    )

    // Configure input for the Website Content Crawler
    const inputAA = {
      startUrls: allUrls,
      maxCrawlDepth: options.maxCrawlDepth ?? 0, // No crawling, just specific pages
      maxCrawlPages: options.maxCrawlPages ?? allUrls.length,
      crawlerType: 'playwright', // Use Playwright for reliable content extraction
      includeUrlGlobs: [],
      excludeUrlGlobs: [],
      ignoreCanonicalUrl: false,
      maxSessionRotations: 10,
      maxRequestRetries: 3,
      requestTimeoutSecs: options.timeout ? Math.floor(options.timeout / 1000) : 60,
      dynamicContentWaitSecs: options.waitForNetworkIdle ? 5 : 2,
      maxScrollHeightPixels: 5000,
      removeElementsCssSelector: 'nav, footer, .cookie-banner, .popup, .modal',
      removeCookieWarnings: true,
      clickElementsCssSelector: '',
      htmlTransformer: 'readabilityMode', // Get clean, readable content
      readabilityMode: 'default',
      respectRobotsTxt: options.respectRobots ?? true,
      maxConcurrency: 10,
      initialConcurrency: 3,
      initialCookies: [],
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ['RESIDENTIAL'],
      },
      additionalMimeTypes: [],
      suggestResponseEncoding: 'utf-8',
      forceResponseEncoding: false,
      httpErrorStatusCodes: [401, 403, 404, 429, 500, 501, 502, 503, 504],
      saveHtml: false,
      saveMarkdown: false,
      saveFiles: false,
      globs: [],
      patterns: [],
      pseudoUrls: [],
      linkSelector: 'a[href]',
      pageFunction: `
        async function pageFunction(context) {
          const { page, request, log } = context;

          // Wait for content to load
          await page.waitForLoadState('domcontentloaded');

          // Get title
          const title = await page.title();

          // Get clean text content
          const text = await page.evaluate(() => {
            // Remove scripts, styles, and other non-content elements
            const elementsToRemove = document.querySelectorAll('script, style, nav, footer, header, .cookie, .banner, .popup, .modal, .advertisement, .ad');
            elementsToRemove.forEach(el => el.remove());

            return document.body.innerText || document.body.textContent || '';
          });

          return {
            url: request.loadedUrl || request.url,
            text: text.trim(),
            title: title,
            userData: request.userData
          };
        }
      `
    }

    const input = {
        "aggressivePrune": false,
        "blockMedia": true,
        "clickElementsCssSelector": "[aria-expanded=\"false\"]",
        "clientSideMinChangePercentage": 15,
        "crawlerType": "playwright:adaptive",
        "debugLog": false,
        "debugMode": false,
        "expandIframes": true,
        "ignoreCanonicalUrl": false,
        "ignoreHttpsErrors": false,
        "keepUrlFragments": false,
        "maxCrawlDepth": 0,
        "maxCrawlPages": 2,
        "proxyConfiguration": {
            "useApifyProxy": true,
            "apifyProxyGroups": []
        },
        "readableTextCharThreshold": 100,
        "removeCookieWarnings": true,
        "removeElementsCssSelector": "nav, footer, script, style, noscript, svg, img[src^='data:'],\n[role=\"alert\"],\n[role=\"banner\"],\n[role=\"dialog\"],\n[role=\"alertdialog\"],\n[role=\"region\"][aria-label*=\"skip\" i],\n[aria-modal=\"true\"]",
        "renderingTypeDetectionPercentage": 10,
        "respectRobotsTxtFile": true,
        "saveFiles": false,
        "saveHtml": false,
        "saveHtmlAsFile": false,
        "saveMarkdown": true,
        "saveScreenshots": false,
        "startUrls": [
            {
                "url": "https://www.ideabrowser.com/",
                "method": "GET"
            },
            {
                "url": "https://www.ideabrowser.com/pricing",
                "method": "GET"
            }
        ],
        "useSitemaps": false
    }

    const startTime = Date.now()

    try {
      console.log(`Starting Apify crawl for ${allUrls.length} URLs`)

      // Run the Website Content Crawler
      const run = await this.client!.actor(this.WEBSITE_CONTENT_CRAWLER_ID).call(input)
      debugger;
      console.log(`Apify crawl completed. Run ID: ${run.id}`)

      // Get the results from the default dataset
      const { items } = await this.client!.dataset(run.defaultDatasetId).listItems()

      const loadTime = Date.now() - startTime

      // Transform results to our standard format
      const results: ApifyScrapingResult[] = items.map((item: unknown) => {
        const apifyItem = item as { url?: string; text?: string; title?: string }
        return {
        url: apifyItem.url || '',
        text: apifyItem.text || '',
        title: apifyItem.title,
        metadata: {
          loadTime,
          timestamp: new Date(),
          crawlStats: {
            pagesProcessed: items.length,
            requestsTotal: run.stats?.requestsTotal || 0,
            requestsFailed: run.stats?.requestsFailed || 0
          }
        }
      }})

      console.log(`Successfully processed ${results.length} pages in ${loadTime}ms`)

      return results

    } catch (error) {
      console.error('Apify crawl failed:', error)

      // Return empty results with error information
      return competitors.flatMap(competitor =>
        competitor.urls.map(url => ({
          url,
          text: '',
          metadata: {
            loadTime: Date.now() - startTime,
            timestamp: new Date(),
            crawlStats: {
              pagesProcessed: 0,
              requestsTotal: 0,
              requestsFailed: 1
            }
          },
          error: error instanceof Error ? error.message : 'Unknown Apify error'
        }))
      )
    }
  }

  async scrapeSinglePage(url: string, options: ApifyScrapingOptions = {}): Promise<ApifyScrapingResult> {
    const results = await this.scrapeCompetitorPages([{
      companyId: 'single',
      companyName: 'single',
      urls: [url]
    }], options)

    return results[0] || {
      url,
      text: '',
      metadata: {
        loadTime: 0,
        timestamp: new Date(),
        crawlStats: {
          pagesProcessed: 0,
          requestsTotal: 0,
          requestsFailed: 1
        }
      },
      error: 'No results returned from Apify'
    }
  }

  // Utility method to test the Apify service
  async testService(): Promise<{ success: boolean; error?: string; performance: number }> {
    const startTime = Date.now()

    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Apify client not configured',
          performance: Date.now() - startTime
        }
      }

      // Test with a simple, fast-loading page
      const result = await this.scrapeSinglePage('https://example.com', {
        timeout: 10000,
        maxCrawlDepth: 0,
        maxCrawlPages: 1
      })

      const performance = Date.now() - startTime
      const success = !result.error && result.text.length > 0

      return {
        success,
        error: result.error,
        performance
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        performance: Date.now() - startTime
      }
    }
  }

  // Get service statistics
  getStats() {
    return {
      isConfigured: this.isConfigured(),
      serviceName: 'Apify Website Content Crawler',
      actorId: this.WEBSITE_CONTENT_CRAWLER_ID
    }
  }
}

export const apifyService = new ApifyService()