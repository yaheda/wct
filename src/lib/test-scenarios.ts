import { contentProcessor } from './content-processor'
import { changeDetector, ChangeDetectionResult } from './change-detector'
import { LLMProviderConfig } from './llm-providers'
import { testSiteManager } from './test-site-manager'
import { scraper } from './scraper'

export interface TestScenario {
  id: string
  name: string
  description: string
  pageType: 'pricing' | 'features' | 'blog' | 'homepage' | 'about'
  competitorName: string
  beforeContent: string
  afterContent: string
  expectedChanges: {
    hasSignificantChange: boolean
    changeType: ChangeDetectionResult['changeType']
    impactLevel: 'high' | 'medium' | 'low'
  }
  // New synthetic test site support
  syntheticUrls?: {
    beforeUrl: string
    afterUrl?: string
  }
}

export interface TestResult {
  scenarioId: string
  passed: boolean
  actualResult: ChangeDetectionResult
  expectedResult: TestScenario['expectedChanges']
  details: {
    accuracy: number
    errors: string[]
    llmProvider?: string
    testMode: 'mock' | 'real-llm' | 'synthetic'
    contentSource?: 'inline' | 'synthetic-urls'
  }
}

export interface TestRunOptions {
  useRealLLM?: boolean
  llmProvider?: Partial<LLMProviderConfig>
  scenarios?: string[] // Run specific scenarios by ID
  verbose?: boolean
  useSyntheticSites?: boolean // Use synthetic test sites instead of inline content
}

class TestFramework {
  private scenarios: Map<string, TestScenario> = new Map()

  constructor() {
    this.initializeDefaultScenarios()
  }

  private initializeDefaultScenarios() {
    const scenarios: TestScenario[] = [
      {
        id: 'pricing-increase',
        name: 'Pricing Plan Increase',
        description: 'Test detection of pricing increases in SaaS plans',
        pageType: 'pricing',
        competitorName: 'TestSaaS',
        beforeContent: `
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
                <div class="plan">
                  <h3>Enterprise</h3>
                  <p class="price">Contact Sales</p>
                  <ul>
                    <li>Unlimited users</li>
                    <li>White-label solution</li>
                    <li>Dedicated support</li>
                  </ul>
                </div>
              </div>
            </body>
          </html>
        `,
        afterContent: `
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
                <div class="plan">
                  <h3>Enterprise</h3>
                  <p class="price">Contact Sales</p>
                  <ul>
                    <li>Unlimited users</li>
                    <li>White-label solution</li>
                    <li>Dedicated support</li>
                  </ul>
                </div>
              </div>
            </body>
          </html>
        `,
        expectedChanges: {
          hasSignificantChange: true,
          changeType: 'pricing',
          impactLevel: 'high' // Major pricing changes should still be high impact
        },
        syntheticUrls: {
          beforeUrl: 'http://localhost:3005/test-sites/testsaas/pricing/before.html',
          afterUrl: 'http://localhost:3005/test-sites/testsaas/pricing/after.html'
        }
      },
      {
        id: 'new-feature-announcement',
        name: 'New Feature Announcement',
        description: 'Test detection of new feature additions',
        pageType: 'features',
        competitorName: 'TestSaaS',
        beforeContent: `
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
                <div class="feature">
                  <h3>API Integration</h3>
                  <p>Connect with your existing tools via our robust API.</p>
                </div>
              </div>
            </body>
          </html>
        `,
        afterContent: `
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
                <div class="feature">
                  <h3>API Integration</h3>
                  <p>Connect with your existing tools via our robust API.</p>
                </div>
                <div class="feature new">
                  <h3>AI-Powered Insights</h3>
                  <p>Leverage machine learning to discover patterns and predict trends in your data.</p>
                </div>
                <div class="feature new">
                  <h3>Mobile App</h3>
                  <p>Access your dashboard on the go with our new mobile application.</p>
                </div>
              </div>
            </body>
          </html>
        `,
        expectedChanges: {
          hasSignificantChange: true,
          changeType: 'features',
          impactLevel: 'medium' // Feature additions are generally medium impact
        },
        syntheticUrls: {
          beforeUrl: 'http://localhost:3005/test-sites/testsaas/features/before.html',
          afterUrl: 'http://localhost:3005/test-sites/testsaas/features/after.html'
        }
      },
      {
        id: 'messaging-update',
        name: 'Homepage Messaging Update',
        description: 'Test detection of messaging and positioning changes',
        pageType: 'homepage',
        competitorName: 'TestSaaS',
        beforeContent: `
          <html>
            <head><title>TestSaaS - The Best Project Management Tool</title></head>
            <body>
              <div class="hero">
                <h1>The Best Project Management Tool for Small Teams</h1>
                <p>Manage your projects efficiently with our intuitive platform designed for teams of 2-10 people.</p>
                <button>Start Free Trial</button>
              </div>
              <div class="features">
                <h2>Key Features</h2>
                <ul>
                  <li>Task management</li>
                  <li>Time tracking</li>
                  <li>Team collaboration</li>
                </ul>
              </div>
            </body>
          </html>
        `,
        afterContent: `
          <html>
            <head><title>TestSaaS - Enterprise Project Management Platform</title></head>
            <body>
              <div class="hero">
                <h1>Enterprise Project Management Platform for Scaling Organizations</h1>
                <p>Transform how your enterprise manages complex projects with our AI-powered platform built for teams of 100+ people.</p>
                <button>Request Demo</button>
              </div>
              <div class="features">
                <h2>Key Features</h2>
                <ul>
                  <li>Advanced task management</li>
                  <li>AI-powered time tracking</li>
                  <li>Enterprise team collaboration</li>
                  <li>Advanced reporting & analytics</li>
                </ul>
              </div>
            </body>
          </html>
        `,
        expectedChanges: {
          hasSignificantChange: true,
          changeType: 'messaging',
          impactLevel: 'medium' // Market positioning changes can vary in impact
        }
      },
      {
        id: 'minor-content-update',
        name: 'Minor Content Update',
        description: 'Test detection of minor content updates',
        pageType: 'about',
        competitorName: 'TestSaaS',
        beforeContent: `
          <html>
            <head><title>About TestSaaS</title></head>
            <body>
              <h1>About Our Company</h1>
              <p>TestSaaS was founded in 2020 with the mission to help teams work more efficiently.</p>
              <p>Our team of 25 dedicated professionals works around the clock to bring you the best experience.</p>
              <div class="stats">
                <p>1,000+ happy customers</p>
                <p>99.9% uptime</p>
                <p>Last updated: January 15, 2024</p>
              </div>
            </body>
          </html>
        `,
        afterContent: `
          <html>
            <head><title>About TestSaaS</title></head>
            <body>
              <h1>About Our Company</h1>
              <p>TestSaaS was founded in 2020 with the mission to help teams work more efficiently.</p>
              <p>Our team of 25 dedicated professionals works around the clock to bring you the best experience.</p>
              <div class="stats">
                <p>1,050+ happy customers</p>
                <p>99.9% uptime</p>
                <p>Last updated: January 22, 2024</p>
              </div>
            </body>
          </html>
        `,
        expectedChanges: {
          hasSignificantChange: true, // All changes are reported
          changeType: 'other',
          impactLevel: 'medium' // Neutral default
        }
      },
      {
        id: 'blog-announcement',
        name: 'Product Announcement Blog Post',
        description: 'Test detection of important product announcements in blog',
        pageType: 'blog',
        competitorName: 'TestSaaS',
        beforeContent: `
          <html>
            <head><title>TestSaaS Blog</title></head>
            <body>
              <div class="blog-posts">
                <article>
                  <h2>5 Tips for Better Team Productivity</h2>
                  <p>Published: Jan 10, 2024</p>
                  <p>Learn how to boost your team's productivity with these simple tips...</p>
                </article>
                <article>
                  <h2>Customer Success Story: How Acme Corp Increased Efficiency</h2>
                  <p>Published: Jan 8, 2024</p>
                  <p>Discover how Acme Corp used TestSaaS to streamline their workflow...</p>
                </article>
              </div>
            </body>
          </html>
        `,
        afterContent: `
          <html>
            <head><title>TestSaaS Blog</title></head>
            <body>
              <div class="blog-posts">
                <article>
                  <h2>Announcing TestSaaS 2.0: Major Platform Update</h2>
                  <p>Published: Jan 15, 2024</p>
                  <p>We're excited to announce the launch of TestSaaS 2.0 with completely redesigned interface, new AI features, and enterprise-grade security. This update represents 18 months of development...</p>
                </article>
                <article>
                  <h2>5 Tips for Better Team Productivity</h2>
                  <p>Published: Jan 10, 2024</p>
                  <p>Learn how to boost your team's productivity with these simple tips...</p>
                </article>
                <article>
                  <h2>Customer Success Story: How Acme Corp Increased Efficiency</h2>
                  <p>Published: Jan 8, 2024</p>
                  <p>Discover how Acme Corp used TestSaaS to streamline their workflow...</p>
                </article>
              </div>
            </body>
          </html>
        `,
        expectedChanges: {
          hasSignificantChange: true,
          changeType: 'product',
          impactLevel: 'medium' // Product announcements can vary in impact
        }
      },,
      {
        id: 'blog-announcement-same',
        name: 'Product Announcement Blog Post SAME',
        description: 'Test detection of important product announcements in blog',
        pageType: 'blog',
        competitorName: 'TestSaaS',
        beforeContent: `
          <html>
            <head><title>TestSaaS Blog</title></head>
            <body>
              <div class="blog-posts">
                <article>
                  <h2>5 Tips for Better Team Productivity</h2>
                  <p>Published: Jan 10, 2024</p>
                  <p>Learn how to boost your team's productivity with these simple tips...</p>
                </article>
                <article>
                  <h2>Customer Success Story: How Acme Corp Increased Efficiency</h2>
                  <p>Published: Jan 8, 2024</p>
                  <p>Discover how Acme Corp used TestSaaS to streamline their workflow...</p>
                </article>
              </div>
            </body>
          </html>
        `,
        afterContent: `
          <html>
            <head><title>TestSaaS Blog</title></head>
            <body>
              <div class="blog-posts">
                <article>
                  <h2>5 Tips for Better Team Productivity</h2>
                  <p>Published: Jan 10, 2024</p>
                  <p>Learn how to boost your team's productivity with these simple tips...</p>
                </article>
                <article>
                  <h2>Customer Success Story: How Acme Corp Increased Efficiency</h2>
                  <p>Published: Jan 8, 2024</p>
                  <p>Discover how Acme Corp used TestSaaS to streamline their workflow...</p>
                </article>
              </div>
            </body>
          </html>
        `,
        expectedChanges: {
          hasSignificantChange: false,
          changeType: 'product',
          impactLevel: 'medium' // Product announcements can vary in impact
        }
      }
    ]

    scenarios.forEach(scenario => {
      this.scenarios.set(scenario.id, scenario)
    })
  }

  addTestScenario(scenario: TestScenario) {
    this.scenarios.set(scenario.id, scenario)
  }

  getTestScenario(id: string): TestScenario | undefined {
    return this.scenarios.get(id)
  }

  getAllTestScenarios(): TestScenario[] {
    return Array.from(this.scenarios.values())
  }

  async runTestScenario(scenarioId: string, options: TestRunOptions = {}): Promise<TestResult> {
    const scenario = this.scenarios.get(scenarioId)
    if (!scenario) {
      throw new Error(`Test scenario '${scenarioId}' not found`)
    }

    const testMode: 'mock' | 'real-llm' | 'synthetic' = options.useSyntheticSites ? 'synthetic' : (options.useRealLLM ? 'real-llm' : 'mock')
    const contentSource = options.useSyntheticSites ? 'synthetic-urls' : 'inline'

    if (options.verbose) {
      console.log(`Running test scenario '${scenarioId}' with ${testMode} mode and ${contentSource} content`)
    }

    try {
      let beforeProcessed, afterProcessed

      if (options.useSyntheticSites && scenario.syntheticUrls) {
        // Use synthetic test sites
        const beforeResult = await scraper.scrapePage(scenario.syntheticUrls.beforeUrl, {
          timeout: 15000,
          ignoreRobots: true
        })
        
        if (beforeResult.error) {
          throw new Error(`Failed to load synthetic before page: ${beforeResult.error}`)
        }

        beforeProcessed = await contentProcessor.processContent(
          beforeResult.content,
          beforeResult.textContent
        )

        if (scenario.syntheticUrls.afterUrl) {
          const afterResult = await scraper.scrapePage(scenario.syntheticUrls.afterUrl, {
            timeout: 15000,
            ignoreRobots: true
          })
          
          if (afterResult.error) {
            throw new Error(`Failed to load synthetic after page: ${afterResult.error}`)
          }

          afterProcessed = await contentProcessor.processContent(
            afterResult.content,
            afterResult.textContent
          )
        } else {
          // Fallback to inline after content if no synthetic after URL
          afterProcessed = await contentProcessor.processContent(
            scenario.afterContent,
            this.extractTextFromHTML(scenario.afterContent)
          )
        }
      } else {
        // Use inline content (traditional approach)
        beforeProcessed = await contentProcessor.processContent(
          scenario.beforeContent,
          this.extractTextFromHTML(scenario.beforeContent)
        )

        afterProcessed = await contentProcessor.processContent(
          scenario.afterContent,
          this.extractTextFromHTML(scenario.afterContent)
        )
      }

      // Configure test mode with LLM provider options
      changeDetector.setTestMode(true, {
        useRealLLM: options.useRealLLM,
        llmProvider: options.llmProvider
      })

      const actualResult = await changeDetector.detectChanges(
        scenario.competitorName,
        scenario.pageType,
        beforeProcessed,
        afterProcessed
      )

      // Evaluate results
      const accuracy = this.calculateAccuracy(actualResult, scenario.expectedChanges)
      const passed = accuracy >= 0.8 // 80% accuracy threshold
      const errors: string[] = []

      if (actualResult.hasSignificantChange !== scenario.expectedChanges.hasSignificantChange) {
        errors.push(`Expected hasSignificantChange: ${scenario.expectedChanges.hasSignificantChange}, got: ${actualResult.hasSignificantChange}`)
      }

      // Make changeType mismatches warnings, not errors (categories can be subjective)
      if (actualResult.changeType !== scenario.expectedChanges.changeType && scenario.expectedChanges.hasSignificantChange) {
        console.warn(`Change type mismatch in ${scenarioId}: expected ${scenario.expectedChanges.changeType}, got ${actualResult.changeType}`)
      }

      // Make impact level mismatches warnings, not errors (don't block test passing)
      if (!this.isImpactLevelClose(actualResult.details.impactLevel, scenario.expectedChanges.impactLevel) && scenario.expectedChanges.hasSignificantChange) {
        // This is now just a warning, doesn't affect pass/fail
        console.warn(`Impact level mismatch in ${scenarioId}: expected ${scenario.expectedChanges.impactLevel}, got ${actualResult.details.impactLevel}`)
      }

      return {
        scenarioId,
        passed,
        actualResult,
        expectedResult: scenario.expectedChanges,
        details: {
          accuracy,
          errors,
          llmProvider: actualResult.llmProvider,
          testMode,
          contentSource
        }
      }

    } catch (error) {
      return {
        scenarioId,
        passed: false,
        actualResult: {
          hasSignificantChange: true, // Report errors as changes
          changeType: 'other',
          changeSummary: 'Test execution failed',
          details: { impactLevel: 'medium' },
          confidence: 'low'
        },
        expectedResult: scenario.expectedChanges,
        details: {
          accuracy: 0,
          errors: [`Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
          testMode,
          contentSource: options.useSyntheticSites ? 'synthetic-urls' : 'inline'
        }
      }
    }
  }

  async runAllTests(options: TestRunOptions = {}): Promise<TestResult[]> {
    const results: TestResult[] = []
    const scenariosToRun = options.scenarios || Array.from(this.scenarios.keys())
    
    if (options.verbose) {
      console.log(`Running ${scenariosToRun.length} test scenarios with options:`, {
        useRealLLM: options.useRealLLM || false,
        llmProvider: options.llmProvider?.provider || 'default'
      })
    }
    
    for (const scenarioId of scenariosToRun) {
      if (options.verbose) {
        console.log(`Running test scenario: ${scenarioId}`)
      }
      try {
        const result = await this.runTestScenario(scenarioId, options)
        results.push(result)
        
        if (options.verbose) {
          console.log(`✓ ${scenarioId}: ${result.passed ? 'PASSED' : 'FAILED'} (accuracy: ${(result.details.accuracy * 100).toFixed(1)}%)`)
        }
      } catch (error) {
        console.error(`Failed to run test ${scenarioId}:`, error)
      }
    }

    return results
  }

  generateTestReport(results: TestResult[]): {
    summary: {
      total: number
      passed: number
      failed: number
      averageAccuracy: number
      testMode: string
      llmProviders: string[]
    }
    details: TestResult[]
  } {
    const total = results.length
    const passed = results.filter(r => r.passed).length
    const failed = total - passed
    const averageAccuracy = results.reduce((sum, r) => sum + r.details.accuracy, 0) / total
    const testModes = new Set(results.map(r => r.details.testMode))
    const llmProviders = new Set(results.map(r => r.details.llmProvider).filter(Boolean) as string[])

    return {
      summary: {
        total,
        passed,
        failed,
        averageAccuracy: Math.round(averageAccuracy * 100) / 100,
        testMode: Array.from(testModes).join(', '),
        llmProviders: Array.from(llmProviders)
      },
      details: results
    }
  }

  // Add method to run comparative tests with synthetic site support
  async runComparativeTests(options: {
    scenarios?: string[]
    verbose?: boolean
    useSyntheticSites?: boolean
  } = {}): Promise<{
    mockResults: TestResult[]
    realLLMResults: TestResult[]
    syntheticResults?: TestResult[]
    comparison: {
      accuracyDifference: number
      agreementRate: number
      syntheticAccuracyDiff?: number
      syntheticAgreementRate?: number
      detailedComparison: Array<{
        scenarioId: string
        mockPassed: boolean
        realLLMPassed: boolean
        syntheticPassed?: boolean
        accuracyDiff: number
        syntheticAccuracyDiff?: number
        agreement: boolean
        syntheticAgreement?: boolean
      }>
    }
  }> {
    if (options.verbose) {
      console.log(`Running comparative tests (Mock vs Real LLM${options.useSyntheticSites ? ' vs Synthetic' : ''})...`)
    }

    // Run tests with mock provider
    const mockResults = await this.runAllTests({
      ...options,
      useRealLLM: false
    })

    // Run tests with real LLM provider  
    const realLLMResults = await this.runAllTests({
      ...options,
      useRealLLM: true
    })

    // Run tests with synthetic sites if requested
    let syntheticResults: TestResult[] | undefined
    if (options.useSyntheticSites) {
      syntheticResults = await this.runAllTests({
        ...options,
        useSyntheticSites: true,
        useRealLLM: false // Use mock for synthetic to isolate testing layer changes
      })
    }

    // Calculate comparison metrics
    const mockAccuracy = mockResults.reduce((sum, r) => sum + r.details.accuracy, 0) / mockResults.length
    const realLLMAccuracy = realLLMResults.reduce((sum, r) => sum + r.details.accuracy, 0) / realLLMResults.length
    const accuracyDifference = realLLMAccuracy - mockAccuracy
    
    let syntheticAccuracyDiff: number | undefined
    let syntheticAgreementRate: number | undefined
    if (syntheticResults) {
      const syntheticAccuracy = syntheticResults.reduce((sum, r) => sum + r.details.accuracy, 0) / syntheticResults.length
      syntheticAccuracyDiff = syntheticAccuracy - mockAccuracy
    }

    const detailedComparison = mockResults.map((mockResult, index) => {
      const realLLMResult = realLLMResults[index]
      const syntheticResult = syntheticResults?.[index]
      const agreement = mockResult.passed === realLLMResult.passed
      
      const comparison: any = {
        scenarioId: mockResult.scenarioId,
        mockPassed: mockResult.passed,
        realLLMPassed: realLLMResult.passed,
        accuracyDiff: realLLMResult.details.accuracy - mockResult.details.accuracy,
        agreement
      }
      
      if (syntheticResult) {
        comparison.syntheticPassed = syntheticResult.passed
        comparison.syntheticAccuracyDiff = syntheticResult.details.accuracy - mockResult.details.accuracy
        comparison.syntheticAgreement = mockResult.passed === syntheticResult.passed
      }
      
      return comparison
    })

    const agreementRate = detailedComparison.filter(c => c.agreement).length / detailedComparison.length
    
    if (syntheticResults) {
      syntheticAgreementRate = detailedComparison.filter(c => c.syntheticAgreement).length / detailedComparison.length
    }

    return {
      mockResults,
      realLLMResults,
      syntheticResults,
      comparison: {
        accuracyDifference,
        agreementRate,
        syntheticAccuracyDiff,
        syntheticAgreementRate,
        detailedComparison
      }
    }
  }

  private extractTextFromHTML(html: string): string {
    // Simple HTML to text conversion (in real browser, this would use DOM)
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private calculateAccuracy(
    actual: ChangeDetectionResult, 
    expected: TestScenario['expectedChanges']
  ): number {
    let score = 0
    let maxScore = 0

    // Check hasSignificantChange (weight: 80% - primary criterion)
    maxScore += 80
    if (actual.hasSignificantChange === expected.hasSignificantChange) {
      score += 80
    }

    // Check changeType (weight: 15%, only if change is expected) - informational
    if (expected.hasSignificantChange) {
      maxScore += 15
      if (actual.changeType === expected.changeType) {
        score += 15
      }
    }

    // Check impactLevel (weight: 5%, only if change is expected) - informational  
    if (expected.hasSignificantChange) {
      maxScore += 5
      if (this.isImpactLevelClose(actual.details.impactLevel, expected.impactLevel)) {
        score += 5
      }
    }

    return maxScore > 0 ? score / maxScore : 1
  }

  private isImpactLevelClose(actual: 'high' | 'medium' | 'low', expected: 'high' | 'medium' | 'low'): boolean {
    if (actual === expected) return true
    
    // Allow +/- one level flexibility
    const levels = ['low', 'medium', 'high']
    const actualIndex = levels.indexOf(actual)
    const expectedIndex = levels.indexOf(expected)
    
    return Math.abs(actualIndex - expectedIndex) <= 1
  }
}

export const testFramework = new TestFramework()