import { testSiteGenerator, TestSiteConfig, GeneratedTestSite } from './test-site-generator'
import { scraper } from './scraper'

export interface TestSiteMetadata {
  competitor: string
  pageType: string
  relativePath: string
  hasBeforeVersion: boolean
  hasAfterVersion: boolean
  createdAt?: Date
  description?: string
  sourceUrls?: {
    before?: string
    after?: string
  }
}

export interface TestSiteValidationResult {
  competitor: string
  pageType: string
  valid: boolean
  beforeExists: boolean
  afterExists: boolean
  errors: string[]
}

class TestSiteManager {
  async createTestSite(config: TestSiteConfig): Promise<GeneratedTestSite> {
    return await testSiteGenerator.generateTestSite(config)
  }

  async createTestSiteFromUrl(
    competitor: string,
    pageType: 'pricing' | 'features' | 'blog' | 'homepage' | 'about',
    url: string,
    description?: string
  ): Promise<GeneratedTestSite> {
    const config: TestSiteConfig = {
      competitor,
      pageType,
      beforeUrl: url,
      description
    }

    return await this.createTestSite(config)
  }

  async createTestSitePair(
    competitor: string,
    pageType: 'pricing' | 'features' | 'blog' | 'homepage' | 'about',
    beforeUrl: string,
    afterUrl: string,
    description?: string
  ): Promise<GeneratedTestSite> {
    const config: TestSiteConfig = {
      competitor,
      pageType,
      beforeUrl,
      afterUrl,
      description
    }

    return await this.createTestSite(config)
  }

  async listAllTestSites(): Promise<TestSiteMetadata[]> {
    const testSites = await testSiteGenerator.listTestSites()
    return testSites.map(site => ({
      competitor: site.competitor,
      pageType: site.pageType,
      relativePath: site.relativePath,
      hasBeforeVersion: site.hasBeforeVersion,
      hasAfterVersion: site.hasAfterVersion
    }))
  }

  async getTestSitesByCompetitor(competitor: string): Promise<TestSiteMetadata[]> {
    const allSites = await this.listAllTestSites()
    return allSites.filter(site => site.competitor === competitor)
  }

  async getTestSitesByPageType(pageType: string): Promise<TestSiteMetadata[]> {
    const allSites = await this.listAllTestSites()
    return allSites.filter(site => site.pageType === pageType)
  }

  async deleteTestSite(competitor: string, pageType: string): Promise<void> {
    await testSiteGenerator.deleteTestSite(competitor, pageType)
  }

  async validateTestSite(competitor: string, pageType: string): Promise<TestSiteValidationResult> {
    const validation = await testSiteGenerator.validateTestSite(competitor, pageType)
    return {
      competitor,
      pageType,
      ...validation
    }
  }

  async validateAllTestSites(): Promise<TestSiteValidationResult[]> {
    const allSites = await this.listAllTestSites()
    const results: TestSiteValidationResult[] = []

    for (const site of allSites) {
      try {
        const validation = await this.validateTestSite(site.competitor, site.pageType)
        results.push(validation)
      } catch (error) {
        results.push({
          competitor: site.competitor,
          pageType: site.pageType,
          valid: false,
          beforeExists: false,
          afterExists: false,
          errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
        })
      }
    }

    return results
  }

  getTestSiteUrl(competitor: string, pageType: string, version: 'before' | 'after' = 'before'): string {
    // Return localhost URL for accessing test site
    return `http://localhost:3005/test-sites/${competitor}/${pageType}/${version}.html`
  }

  async initializeDefaultTestSites(): Promise<GeneratedTestSite[]> {
    console.log('Initializing default test sites from test scenarios...')
    return await testSiteGenerator.generateFromTestScenarios()
  }

  async testSiteAccessibility(competitor: string, pageType: string): Promise<{
    beforeAccessible: boolean
    afterAccessible: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    let beforeAccessible = false
    let afterAccessible = false

    try {
      const beforeUrl = this.getTestSiteUrl(competitor, pageType, 'before')
      const beforeResult = await scraper.scrapePage(beforeUrl, { 
        timeout: 10000,
        ignoreRobots: true 
      })
      beforeAccessible = !beforeResult.error && beforeResult.content.length > 0
      if (!beforeAccessible) {
        errors.push(`Before version not accessible: ${beforeResult.error || 'Empty content'}`)
      }
    } catch (error) {
      errors.push(`Before version test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      const afterUrl = this.getTestSiteUrl(competitor, pageType, 'after')
      const afterResult = await scraper.scrapePage(afterUrl, { 
        timeout: 10000,
        ignoreRobots: true 
      })
      afterAccessible = !afterResult.error && afterResult.content.length > 0
      if (!afterAccessible) {
        errors.push(`After version not accessible: ${afterResult.error || 'Empty content'}`)
      }
    } catch (error) {
      // After version is optional, so we only warn
      console.warn(`After version test failed for ${competitor}/${pageType}:`, error)
    }

    return {
      beforeAccessible,
      afterAccessible,
      errors
    }
  }

  async generateTestSiteReport(): Promise<{
    summary: {
      totalSites: number
      validSites: number
      invalidSites: number
      competitors: string[]
      pageTypes: string[]
    }
    details: TestSiteValidationResult[]
    accessibility: Array<{
      competitor: string
      pageType: string
      beforeAccessible: boolean
      afterAccessible: boolean
      errors: string[]
    }>
  }> {
    const validations = await this.validateAllTestSites()
    const sites = await this.listAllTestSites()
    
    const competitors = [...new Set(sites.map(s => s.competitor))]
    const pageTypes = [...new Set(sites.map(s => s.pageType))]
    
    const accessibility = []
    for (const site of sites) {
      const access = await this.testSiteAccessibility(site.competitor, site.pageType)
      accessibility.push({
        competitor: site.competitor,
        pageType: site.pageType,
        ...access
      })
    }

    return {
      summary: {
        totalSites: sites.length,
        validSites: validations.filter(v => v.valid).length,
        invalidSites: validations.filter(v => !v.valid).length,
        competitors,
        pageTypes
      },
      details: validations,
      accessibility
    }
  }

  async cleanupInvalidTestSites(): Promise<{
    deleted: Array<{ competitor: string, pageType: string }>
    errors: Array<{ competitor: string, pageType: string, error: string }>
  }> {
    const validations = await this.validateAllTestSites()
    const invalidSites = validations.filter(v => !v.valid)
    
    const deleted: Array<{ competitor: string, pageType: string }> = []
    const errors: Array<{ competitor: string, pageType: string, error: string }> = []

    for (const site of invalidSites) {
      try {
        await this.deleteTestSite(site.competitor, site.pageType)
        deleted.push({ competitor: site.competitor, pageType: site.pageType })
      } catch (error) {
        errors.push({
          competitor: site.competitor,
          pageType: site.pageType,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return { deleted, errors }
  }
}

export const testSiteManager = new TestSiteManager()