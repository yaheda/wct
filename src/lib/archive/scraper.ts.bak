import { chromium, firefox, webkit, Browser, Page } from 'playwright'
import robotsParser from 'robots-parser'

export interface ScrapingResult {
  url: string
  content: string
  textContent: string
  screenshot?: Buffer
  metadata: {
    title: string
    statusCode: number
    loadTime: number
    timestamp: Date
    userAgent: string
    browserName: string
    viewport: { width: number; height: number }
    robotsCompliant: boolean
    crawlDelay: number
  }
  robotsBlocked?: boolean
  error?: string
}

export interface ScrapingOptions {
  timeout?: number
  waitForSelector?: string
  waitForNetworkIdle?: boolean
  userAgent?: string
  viewport?: { width: number; height: number }
  browserType?: 'chromium' | 'firefox' | 'webkit'
  mobile?: boolean
  screenshot?: boolean
  bypassCSP?: boolean
  respectRobots?: boolean
  robotsTimeout?: number
  ignoreRobots?: boolean
}

interface RobotsCache {
  robots: unknown
  fetchedAt: Date
  crawlDelay: number
}

class PlaywrightScraper {
  private browser: Browser | null = null
  private isInitialized = false
  private requestCounts = new Map<string, number>()
  private lastRequestTimes = new Map<string, number>()
  private readonly MIN_REQUEST_INTERVAL = 5000 // 5 seconds between requests per domain
  private robotsCache = new Map<string, RobotsCache>()
  private readonly ROBOTS_CACHE_DURATION = 1000 * 60 * 60 // 1 hour

  async initialize(browserType: 'chromium' | 'firefox' | 'webkit' = 'chromium') {
    if (this.isInitialized && this.browser) {
      return
    }

    try {
      // Select browser based on type
      const browserLauncher = browserType === 'firefox' ? firefox : 
                             browserType === 'webkit' ? webkit : 
                             chromium

      this.browser = await browserLauncher.launch({
        headless: true,
        args: browserType === 'chromium' ? [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-web-security',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
        ] : [], // Firefox and WebKit don't need Chrome-specific args
      })

      this.isInitialized = true
    } catch (error) {
      console.error(`Failed to initialize ${browserType} browser:`, error)
      throw new Error('Browser initialization failed')
    }
  }

  private async createContext(options: ScrapingOptions = {}) {
    if (!this.browser) {
      throw new Error('Browser not initialized')
    }

    const contextOptions: Record<string, unknown> = {
      viewport: options.viewport || { width: 1920, height: 1080 },
      userAgent: options.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    // Mobile simulation
    if (options.mobile) {
      contextOptions.viewport = { width: 375, height: 812 } // iPhone X dimensions
      contextOptions.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
      contextOptions.isMobile = true
      contextOptions.hasTouch = true
    }

    // Bypass CSP if requested
    if (options.bypassCSP) {
      contextOptions.bypassCSP = true
    }

    return await this.browser.newContext(contextOptions)
  }

  private getDomain(url: string): string {
    try {
      return new URL(url).hostname
    } catch {
      return 'unknown'
    }
  }

  private async fetchRobotsTxt(domain: string, options: ScrapingOptions = {}): Promise<RobotsCache> {
    const robotsUrl = `https://${domain}/robots.txt`
    const timeout = options.robotsTimeout || 5000
    
    try {
      const response = await fetch(robotsUrl, {
        signal: AbortSignal.timeout(timeout),
        headers: {
          'User-Agent': options.userAgent || 'Mozilla/5.0 (compatible; SaaS-Monitor-Bot/1.0)'
        }
      })

      if (!response.ok) {
        // No robots.txt found, create permissive default
        const robots = robotsParser(robotsUrl, '')
        return {
          robots,
          fetchedAt: new Date(),
          crawlDelay: 0
        }
      }

      const robotsText = await response.text()
      const robots = robotsParser(robotsUrl, robotsText)
      
      // Extract crawl delay for our user agent or wildcard
      const userAgent = options.userAgent || '*'
      const crawlDelay = robots.getCrawlDelay(userAgent) || 0

      return {
        robots,
        fetchedAt: new Date(),
        crawlDelay: crawlDelay * 1000 // Convert to milliseconds
      }

    } catch (error) {
      console.warn(`Failed to fetch robots.txt for ${domain}:`, error)
      // Create permissive default on error
      const robots = robotsParser(robotsUrl, '')
      return {
        robots,
        fetchedAt: new Date(),
        crawlDelay: 0
      }
    }
  }

  private async getRobots(domain: string, options: ScrapingOptions = {}): Promise<RobotsCache> {
    const cached = this.robotsCache.get(domain)
    
    // Check if cache is still valid
    if (cached && (Date.now() - cached.fetchedAt.getTime()) < this.ROBOTS_CACHE_DURATION) {
      return cached
    }

    // Fetch fresh robots.txt
    const robotsCache = await this.fetchRobotsTxt(domain, options)
    this.robotsCache.set(domain, robotsCache)
    return robotsCache
  }

  private async checkRobotsPermission(url: string, options: ScrapingOptions = {}): Promise<{
    allowed: boolean
    crawlDelay: number
    robotsCompliant: boolean
  }> {
    // Skip robots.txt check if disabled
    if (options.ignoreRobots || options.respectRobots === false) {
      return {
        allowed: true,
        crawlDelay: 0,
        robotsCompliant: false
      }
    }

    try {
      const domain = this.getDomain(url)
      const robotsCache = await this.getRobots(domain, options)
      const userAgent = options.userAgent || '*'
      
      const allowed = (robotsCache.robots as { isAllowed: (url: string, userAgent: string) => boolean }).isAllowed(url, userAgent)
      const crawlDelay = Math.max(robotsCache.crawlDelay, this.MIN_REQUEST_INTERVAL)

      return {
        allowed,
        crawlDelay,
        robotsCompliant: true
      }
    } catch (error) {
      console.warn(`Error checking robots.txt for ${url}:`, error)
      // Default to allowed with standard rate limiting on error
      return {
        allowed: true,
        crawlDelay: this.MIN_REQUEST_INTERVAL,
        robotsCompliant: false
      }
    }
  }

  private async enforceRateLimit(domain: string, crawlDelay?: number) {
    const now = Date.now()
    const lastRequest = this.lastRequestTimes.get(domain) || 0
    const effectiveDelay = Math.max(crawlDelay || 0, this.MIN_REQUEST_INTERVAL)
    const timeSinceLastRequest = now - lastRequest

    if (timeSinceLastRequest < effectiveDelay) {
      const waitTime = effectiveDelay - timeSinceLastRequest
      console.log(`Rate limiting: waiting ${waitTime}ms for domain ${domain} (robots.txt: ${crawlDelay ? 'yes' : 'no'})`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.lastRequestTimes.set(domain, Date.now())
    this.requestCounts.set(domain, (this.requestCounts.get(domain) || 0) + 1)
  }

  async scrapePage(url: string, options: ScrapingOptions = {}): Promise<ScrapingResult> {
    await this.initialize(options.browserType || 'chromium')

    // Check robots.txt permission first (defaults to respectRobots: true)
    const robotsCheck = await this.checkRobotsPermission(url, { 
      respectRobots: true, 
      ...options 
    })

    // If robots.txt disallows this URL, return blocked result
    if (!robotsCheck.allowed) {
      return {
        url,
        content: '',
        textContent: '',
        robotsBlocked: true,
        metadata: {
          title: '',
          statusCode: 0,
          loadTime: 0,
          timestamp: new Date(),
          userAgent: options.userAgent || '',
          browserName: options.browserType || 'chromium',
          viewport: options.viewport || { width: 1920, height: 1080 },
          robotsCompliant: robotsCheck.robotsCompliant,
          crawlDelay: robotsCheck.crawlDelay,
        },
        error: 'URL blocked by robots.txt',
      }
    }

    const domain = this.getDomain(url)
    await this.enforceRateLimit(domain, robotsCheck.crawlDelay)

    // Create a fresh context for each scrape to avoid state issues
    const context = await this.createContext(options)
    let page: Page | null = null
    const startTime = Date.now()

    try {
      page = await context.newPage()

      // Set timeout
      page.setDefaultTimeout(options.timeout || 30000)

      // Navigate to the page with enhanced Playwright options
      const response = await page.goto(url, {
        waitUntil: options.waitForNetworkIdle ? 'networkidle' : 'domcontentloaded',
        timeout: options.timeout || 30000,
      })

      const statusCode = response?.status() || 0

      // Wait for specific selector if provided
      if (options.waitForSelector) {
        try {
          await page.waitForSelector(options.waitForSelector, { timeout: 10000 })
        } catch {
          console.warn(`Selector ${options.waitForSelector} not found on ${url}`)
        }
      }

      // Smart waiting for dynamic content
      if (options.waitForNetworkIdle) {
        await page.waitForLoadState('networkidle')
      } else {
        // Small delay for SaaS sites with heavy JS
        await page.waitForTimeout(1000)
      }

      // Extract content
      const content = await page.content()
      
      // Extract clean text content using Playwright's evaluation
      const textContent = await page.evaluate(() => {
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style, noscript')
        scripts.forEach(el => el.remove())

        // Remove common noise elements
        const noise = document.querySelectorAll(
          '[class*="cookie"], [class*="banner"], [class*="popup"], ' +
          '[class*="modal"], [id*="cookie"], [id*="banner"]'
        )
        noise.forEach(el => el.remove())

        return document.body.innerText || document.body.textContent || ''
      })

      // Optional screenshot for visual change detection
      let screenshot: Buffer | undefined
      if (options.screenshot) {
        screenshot = await page.screenshot({
          fullPage: true,
          type: 'png'
        })
      }

      const title = await page.title()
      const loadTime = Date.now() - startTime
      const viewport = page.viewportSize() || { width: 1920, height: 1080 }

      return {
        url,
        content,
        textContent: textContent.trim(),
        screenshot,
        metadata: {
          title,
          statusCode,
          loadTime,
          timestamp: new Date(),
          userAgent: options.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          browserName: options.browserType || 'chromium',
          viewport,
          robotsCompliant: robotsCheck.robotsCompliant,
          crawlDelay: robotsCheck.crawlDelay,
        },
      }

    } catch (error) {
      console.error(`Error scraping ${url}:`, error)
      
      return {
        url,
        content: '',
        textContent: '',
        metadata: {
          title: '',
          statusCode: 0,
          loadTime: Date.now() - startTime,
          timestamp: new Date(),
          userAgent: options.userAgent || '',
          browserName: options.browserType || 'chromium',
          viewport: options.viewport || { width: 1920, height: 1080 },
          robotsCompliant: robotsCheck.robotsCompliant,
          crawlDelay: robotsCheck.crawlDelay,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    } finally {
      if (page) {
        await page.close()
      }
      await context.close()
    }
  }

  async scrapeMultiplePages(urls: string[], options: ScrapingOptions = {}): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = []
    
    // Process pages sequentially to respect rate limits
    for (const url of urls) {
      try {
        const result = await this.scrapePage(url, options)
        results.push(result)
      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error)
        results.push({
          url,
          content: '',
          textContent: '',
          metadata: {
            title: '',
            statusCode: 0,
            loadTime: 0,
            timestamp: new Date(),
            userAgent: options.userAgent || '',
            browserName: options.browserType || 'chromium',
            viewport: options.viewport || { width: 1920, height: 1080 },
            robotsCompliant: false,
            crawlDelay: 0,
          },
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.isInitialized = false
    }
  }

  // Get scraping statistics
  getStats() {
    return {
      requestCounts: Object.fromEntries(this.requestCounts),
      isInitialized: this.isInitialized,
      browserRunning: !!this.browser,
    }
  }

  // Test scraper with a simple page
  async testScraper(): Promise<{ success: boolean; error?: string; performance: number }> {
    const startTime = Date.now()
    try {
      // Test with a simple, fast-loading page
      const result = await this.scrapePage('https://example.com', {
        timeout: 10000,
        waitForNetworkIdle: false
      })
      
      const performance = Date.now() - startTime
      const success = !result.error && result.content.length > 0
      
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
}

// Singleton instance
export const scraper = new PlaywrightScraper()

// Cleanup on process exit
process.on('beforeExit', async () => {
  await scraper.close()
})

process.on('SIGTERM', async () => {
  await scraper.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await scraper.close()
  process.exit(0)
})