import { scraper } from './scraper'
import { promises as fs } from 'fs'
import path from 'path'

export interface TestSiteConfig {
  competitor: string
  pageType: 'pricing' | 'features' | 'blog' | 'homepage' | 'about'
  beforeUrl: string
  afterUrl?: string
  description?: string
}

export interface GeneratedTestSite {
  competitor: string
  pageType: string
  beforePath: string
  afterPath?: string
  createdAt: Date
  size: {
    beforeBytes: number
    afterBytes?: number
  }
}

class TestSiteGenerator {
  private readonly baseDir = path.join(process.cwd(), 'public', 'test-sites')

  async generateTestSite(config: TestSiteConfig): Promise<GeneratedTestSite> {
    const competitorDir = path.join(this.baseDir, config.competitor, config.pageType)
    
    // Ensure directory exists
    await fs.mkdir(competitorDir, { recursive: true })

    // Generate before version
    const beforeContent = await this.extractAndSanitizePage(config.beforeUrl)
    const beforePath = path.join(competitorDir, 'before.html')
    await fs.writeFile(beforePath, beforeContent, 'utf-8')
    const beforeStats = await fs.stat(beforePath)

    let afterPath: string | undefined
    let afterStats: { size: number } | undefined

    // Generate after version if provided
    if (config.afterUrl) {
      const afterContent = await this.extractAndSanitizePage(config.afterUrl)
      afterPath = path.join(competitorDir, 'after.html')
      await fs.writeFile(afterPath, afterContent, 'utf-8')
      afterStats = await fs.stat(afterPath)
    }

    return {
      competitor: config.competitor,
      pageType: config.pageType,
      beforePath: `test-sites/${config.competitor}/${config.pageType}/before.html`,
      afterPath: afterPath ? `test-sites/${config.competitor}/${config.pageType}/after.html` : undefined,
      createdAt: new Date(),
      size: {
        beforeBytes: beforeStats.size,
        afterBytes: afterStats?.size
      }
    }
  }

  private async extractAndSanitizePage(url: string): Promise<string> {
    // Handle data URLs directly without scraping
    if (url.startsWith('data:text/html')) {
      const htmlContent = decodeURIComponent(url.split(',')[1])
      return this.sanitizeHTML(htmlContent, url)
    }

    const scrapingResult = await scraper.scrapePage(url, {
      timeout: 30000,
      waitForNetworkIdle: true,
      screenshot: false,
      ignoreRobots: true, // Ignore robots.txt for test site generation
    })

    if (scrapingResult.error) {
      throw new Error(`Failed to scrape ${url}: ${scrapingResult.error}`)
    }

    return this.sanitizeHTML(scrapingResult.content, url)
  }

  private sanitizeHTML(html: string, originalUrl: string): string {
    // Handle data URLs specially
    let baseUrl: URL
    try {
      baseUrl = new URL(originalUrl)
    } catch {
      // If originalUrl is not a valid URL (e.g., data URL), use a dummy base URL
      baseUrl = new URL('http://localhost:3005')
    }
    
    let sanitized = html
      // Remove external scripts (keep inline scripts for dynamic behavior)
      .replace(/<script[^>]*src[^>]*><\/script>/gi, '')
      // Remove tracking and analytics scripts
      .replace(/<script[^>]*(?:google-analytics|gtag|facebook|twitter|linkedin)[^>]*>[\s\S]*?<\/script>/gi, '')
      // Remove external iframes
      .replace(/<iframe[^>]*src="(?!data:)[^"]*"[^>]*><\/iframe>/gi, '')
      // Remove external forms (to prevent accidental submissions)
      .replace(/action="(?:https?:\/\/[^"]*|\/[^"]*)"/gi, 'action="#"')
      
    // Inline CSS from same domain stylesheets (simplified approach)
    sanitized = sanitized.replace(
      /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']*?)["'][^>]*>/gi,
      (match, href) => {
        // Only inline relative URLs or same-domain URLs for security
        if (href.startsWith('/') || href.startsWith(baseUrl.origin)) {
          return `<!-- Stylesheet inlined: ${href} -->`
        }
        return match
      }
    )

    // Convert relative URLs to absolute for images and assets
    sanitized = sanitized.replace(
      /(?:src|href)=["'](\/?[^"']*?)["']/gi,
      (match, url) => {
        if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('#')) {
          return match
        }
        if (url.startsWith('/')) {
          return match.replace(`"${url}"`, `"${baseUrl.origin}${url}"`)
        }
        return match.replace(`"${url}"`, `"${new URL(url, originalUrl).href}"`)
      }
    )

    // Add base tag to help with relative URLs
    const baseTag = `<base href="${baseUrl.origin}/">`
    sanitized = sanitized.replace(/<head[^>]*>/i, `$&\n  ${baseTag}`)

    // Add comment header with metadata
    const header = `<!--
Generated test site from: ${originalUrl}
Created: ${new Date().toISOString()}
Purpose: Synthetic testing for change detection system
Note: This is a sanitized local copy for testing purposes only
-->\n`

    return header + sanitized
  }

  async generateFromTestScenarios(): Promise<GeneratedTestSite[]> {
    // Generate test sites based on existing test scenarios
    const testConfigs: TestSiteConfig[] = [
      {
        competitor: 'testsaas',
        pageType: 'pricing',
        beforeUrl: 'data:text/html;charset=utf-8,' + encodeURIComponent(`
          <html>
            <head><title>TestSaaS - Pricing</title></head>
            <body>
              <h1>Choose Your Plan</h1>
              <div class="pricing-plans">
                <div class="plan">
                  <h3>Starter</h3>
                  <p class="price">$29/month</p>
                  <ul>
                    <li>Up to 1,000 users</li>
                    <li>Basic analytics</li>
                    <li>Email support</li>
                  </ul>
                </div>
                <div class="plan">
                  <h3>Professional</h3>
                  <p class="price">$79/month</p>
                  <ul>
                    <li>Up to 10,000 users</li>
                    <li>Advanced analytics</li>
                    <li>Priority support</li>
                    <li>Custom integrations</li>
                  </ul>
                </div>
              </div>
            </body>
          </html>
        `),
        afterUrl: 'data:text/html;charset=utf-8,' + encodeURIComponent(`
          <html>
            <head><title>TestSaaS - Pricing</title></head>
            <body>
              <h1>Choose Your Plan</h1>
              <div class="pricing-plans">
                <div class="plan">
                  <h3>Starter</h3>
                  <p class="price">$39/month</p>
                  <ul>
                    <li>Up to 1,000 users</li>
                    <li>Basic analytics</li>
                    <li>Email support</li>
                  </ul>
                </div>
                <div class="plan">
                  <h3>Professional</h3>
                  <p class="price">$99/month</p>
                  <ul>
                    <li>Up to 10,000 users</li>
                    <li>Advanced analytics</li>
                    <li>Priority support</li>
                    <li>Custom integrations</li>
                  </ul>
                </div>
              </div>
            </body>
          </html>
        `),
        description: 'Pricing increase test scenario'
      },
      {
        competitor: 'testsaas',
        pageType: 'features',
        beforeUrl: 'data:text/html;charset=utf-8,' + encodeURIComponent(`
          <html>
            <head><title>TestSaaS - Features</title></head>
            <body>
              <h1>Powerful Features</h1>
              <div class="features">
                <div class="feature">
                  <h3>Real-time Analytics</h3>
                  <p>Get instant insights into your data with our advanced analytics dashboard.</p>
                </div>
                <div class="feature">
                  <h3>Team Collaboration</h3>
                  <p>Work together seamlessly with built-in collaboration tools.</p>
                </div>
              </div>
            </body>
          </html>
        `),
        afterUrl: 'data:text/html;charset=utf-8,' + encodeURIComponent(`
          <html>
            <head><title>TestSaaS - Features</title></head>
            <body>
              <h1>Powerful Features</h1>
              <div class="features">
                <div class="feature">
                  <h3>Real-time Analytics</h3>
                  <p>Get instant insights into your data with our advanced analytics dashboard.</p>
                </div>
                <div class="feature">
                  <h3>Team Collaboration</h3>
                  <p>Work together seamlessly with built-in collaboration tools.</p>
                </div>
                <div class="feature new">
                  <h3>AI-Powered Insights</h3>
                  <p>Leverage machine learning to discover patterns and predict trends in your data.</p>
                </div>
              </div>
            </body>
          </html>
        `),
        description: 'New feature announcement test'
      }
    ]

    const results: GeneratedTestSite[] = []
    for (const config of testConfigs) {
      try {
        const result = await this.generateTestSite(config)
        results.push(result)
      } catch (error) {
        console.error(`Failed to generate test site for ${config.competitor}/${config.pageType}:`, error)
      }
    }

    return results
  }

  async listTestSites(): Promise<{
    competitor: string
    pageType: string
    hasBeforeVersion: boolean
    hasAfterVersion: boolean
    relativePath: string
  }[]> {
    try {
      const competitors = await fs.readdir(this.baseDir)
      const testSites: {
        competitor: string
        pageType: string
        hasBeforeVersion: boolean
        hasAfterVersion: boolean
        relativePath: string
      }[] = []

      for (const competitor of competitors) {
        if (competitor === 'README.md') continue
        
        const competitorPath = path.join(this.baseDir, competitor)
        const stat = await fs.stat(competitorPath)
        
        if (!stat.isDirectory()) continue

        const pageTypes = await fs.readdir(competitorPath)
        
        for (const pageType of pageTypes) {
          const pageTypePath = path.join(competitorPath, pageType)
          const pageTypeStat = await fs.stat(pageTypePath)
          
          if (!pageTypeStat.isDirectory()) continue

          const files = await fs.readdir(pageTypePath)
          const hasBeforeVersion = files.includes('before.html')
          const hasAfterVersion = files.includes('after.html')

          testSites.push({
            competitor,
            pageType,
            hasBeforeVersion,
            hasAfterVersion,
            relativePath: `test-sites/${competitor}/${pageType}`
          })
        }
      }

      return testSites
    } catch (error) {
      console.error('Error listing test sites:', error)
      return []
    }
  }

  async deleteTestSite(competitor: string, pageType: string): Promise<void> {
    const testSiteDir = path.join(this.baseDir, competitor, pageType)
    try {
      await fs.rm(testSiteDir, { recursive: true, force: true })
    } catch (error) {
      console.error(`Error deleting test site ${competitor}/${pageType}:`, error)
      throw error
    }
  }

  async validateTestSite(competitor: string, pageType: string): Promise<{
    valid: boolean
    beforeExists: boolean
    afterExists: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    const testSiteDir = path.join(this.baseDir, competitor, pageType)
    
    let beforeExists = false
    let afterExists = false

    try {
      const beforePath = path.join(testSiteDir, 'before.html')
      await fs.access(beforePath)
      beforeExists = true
      
      // Validate before.html content
      const beforeContent = await fs.readFile(beforePath, 'utf-8')
      if (beforeContent.length < 100) {
        errors.push('before.html appears to be too small or empty')
      }
    } catch {
      errors.push('before.html is missing or inaccessible')
    }

    try {
      const afterPath = path.join(testSiteDir, 'after.html')
      await fs.access(afterPath)
      afterExists = true
      
      // Validate after.html content
      const afterContent = await fs.readFile(afterPath, 'utf-8')
      if (afterContent.length < 100) {
        errors.push('after.html appears to be too small or empty')
      }
    } catch {
      // after.html is optional
    }

    return {
      valid: errors.length === 0 && beforeExists,
      beforeExists,
      afterExists,
      errors
    }
  }
}

export const testSiteGenerator = new TestSiteGenerator()