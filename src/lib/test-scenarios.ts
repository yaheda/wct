import { contentProcessor, ProcessedContent } from './content-processor'
import { changeDetector, ChangeDetectionResult } from './change-detector'

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
}

export interface TestResult {
  scenarioId: string
  passed: boolean
  actualResult: ChangeDetectionResult
  expectedResult: TestScenario['expectedChanges']
  details: {
    accuracy: number
    errors: string[]
  }
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
          impactLevel: 'high'
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
          impactLevel: 'medium'
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
          impactLevel: 'high'
        }
      },
      {
        id: 'minor-content-update',
        name: 'Minor Content Update',
        description: 'Test that minor updates are not flagged as significant',
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
          hasSignificantChange: false,
          changeType: 'other',
          impactLevel: 'low'
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
          impactLevel: 'high'
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

  async runTestScenario(scenarioId: string): Promise<TestResult> {
    const scenario = this.scenarios.get(scenarioId)
    if (!scenario) {
      throw new Error(`Test scenario '${scenarioId}' not found`)
    }

    try {
      // Process both content versions
      const beforeProcessed = await contentProcessor.processContent(
        scenario.beforeContent,
        this.extractTextFromHTML(scenario.beforeContent)
      )

      const afterProcessed = await contentProcessor.processContent(
        scenario.afterContent,
        this.extractTextFromHTML(scenario.afterContent)
      )

      // Run change detection
      changeDetector.setTestMode(true) // Enable test mode for detailed logging
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

      if (actualResult.changeType !== scenario.expectedChanges.changeType && scenario.expectedChanges.hasSignificantChange) {
        errors.push(`Expected changeType: ${scenario.expectedChanges.changeType}, got: ${actualResult.changeType}`)
      }

      if (actualResult.details.impactLevel !== scenario.expectedChanges.impactLevel && scenario.expectedChanges.hasSignificantChange) {
        errors.push(`Expected impactLevel: ${scenario.expectedChanges.impactLevel}, got: ${actualResult.details.impactLevel}`)
      }

      return {
        scenarioId,
        passed,
        actualResult,
        expectedResult: scenario.expectedChanges,
        details: {
          accuracy,
          errors
        }
      }

    } catch (error) {
      return {
        scenarioId,
        passed: false,
        actualResult: {
          hasSignificantChange: false,
          changeType: 'other',
          changeSummary: 'Test execution failed',
          details: { impactLevel: 'low' },
          confidence: 'low'
        },
        expectedResult: scenario.expectedChanges,
        details: {
          accuracy: 0,
          errors: [`Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }
      }
    }
  }

  async runAllTests(): Promise<TestResult[]> {
    const results: TestResult[] = []
    
    for (const scenarioId of this.scenarios.keys()) {
      console.log(`Running test scenario: ${scenarioId}`)
      try {
        const result = await this.runTestScenario(scenarioId)
        results.push(result)
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
    }
    details: TestResult[]
  } {
    const total = results.length
    const passed = results.filter(r => r.passed).length
    const failed = total - passed
    const averageAccuracy = results.reduce((sum, r) => sum + r.details.accuracy, 0) / total

    return {
      summary: {
        total,
        passed,
        failed,
        averageAccuracy: Math.round(averageAccuracy * 100) / 100
      },
      details: results
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

    // Check hasSignificantChange (weight: 40%)
    maxScore += 40
    if (actual.hasSignificantChange === expected.hasSignificantChange) {
      score += 40
    }

    // Check changeType (weight: 30%, only if change is expected)
    if (expected.hasSignificantChange) {
      maxScore += 30
      if (actual.changeType === expected.changeType) {
        score += 30
      }
    }

    // Check impactLevel (weight: 30%, only if change is expected)
    if (expected.hasSignificantChange) {
      maxScore += 30
      if (actual.details.impactLevel === expected.impactLevel) {
        score += 30
      }
    }

    return maxScore > 0 ? score / maxScore : 1
  }
}

export const testFramework = new TestFramework()