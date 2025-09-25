import { PrismaClient } from '@prisma/client'
import { apifyService, CompetitorUrls } from './apify-service'
import { contentProcessor } from './content-processor'
import { changeDetector } from './change-detector'
import { notificationEngine } from './notification-engine'

const db = new PrismaClient()

export interface ChangeDetectionOptions {
  pageId?: string
  companyId?: string
  runType: 'manual' | 'scheduled' | 'test'
  testMode?: boolean
}

export interface ChangeDetectionServiceResult {
  runId: string
  status: 'completed' | 'failed' | 'partial'
  summary: {
    pagesChecked: number
    changesFound: number
    errors: number
  }
  changes: Array<{
    pageId: string
    url: string
    changeType: string
    changeSummary: string
    impactLevel: string
  }>
  errors: string[]
}

class ChangeDetectionService {
  async runDetection(options: ChangeDetectionOptions): Promise<ChangeDetectionServiceResult> {
    const runId = await this.createDetectionRun(options)
    
    try {
      // Get pages to check
      const pages = await this.getPagesToCheck(options)
      
      if (pages.length === 0) {
        await this.completeDetectionRun(runId, 'completed', 0, [])
        return {
          runId,
          status: 'completed',
          summary: { pagesChecked: 0, changesFound: 0, errors: 0 },
          changes: [],
          errors: ['No active pages found to monitor']
        }
      }

      const results: ChangeDetectionServiceResult = {
        runId,
        status: 'completed',
        summary: { pagesChecked: 0, changesFound: 0, errors: 0 },
        changes: [],
        errors: []
      }

      // Group pages by company for efficient batch processing
      const competitorGroups = this.groupPagesByCompany(pages)
      console.log(`Processing ${competitorGroups.length} companies with ${pages.length} total pages`)

      // Process each competitor's pages using Apify
      for (const competitorGroup of competitorGroups) {
        try {
          console.log(`Processing competitor: ${competitorGroup.companyName} (${competitorGroup.urls.length} pages)`)

          // Get latest snapshots for comparison
          const pageSnapshots = new Map()
          for (const url of competitorGroup.urls) {
            const page = pages.find(p => p.url === url)
            if (page) {
              const latestSnapshot = await db.pageSnapshot.findFirst({
                where: { pageId: page.id, status: 'active' },
                orderBy: { createdAt: 'desc' }
              })
              pageSnapshots.set(url, { page, snapshot: latestSnapshot })
            }
          }

          // Scrape all pages for this competitor using Apify
          const scrapingResults = await apifyService.scrapeCompetitorPages([competitorGroup], {
            maxCrawlDepth: 0,
            maxCrawlPages: competitorGroup.urls.length,
            timeout: 60000,
            waitForNetworkIdle: true,
            respectRobots: true
          })

          // Process each scraped page
          for (const scrapingResult of scrapingResults) {
            const pageData = pageSnapshots.get(scrapingResult.url)
            if (!pageData) continue

            const { page, snapshot } = pageData

            try {
              if (scrapingResult.error) {
                results.errors.push(`Failed to scrape ${scrapingResult.url}: ${scrapingResult.error}`)
                results.summary.errors++
                continue
              }

              // Process the new content using the text-only method
              const newProcessedContent = await contentProcessor.processTextOnlyContent(
                scrapingResult.text,
                scrapingResult.title
              )

              // Create new snapshot
              await db.pageSnapshot.create({
                data: {
                  pageId: page.id,
                  content: scrapingResult.text, // Store the text content as HTML content for now
                  contentHash: newProcessedContent.contentHash,
                  textContent: scrapingResult.text,
                  metadata: {
                    ...scrapingResult.metadata,
                    extractedData: JSON.parse(JSON.stringify(newProcessedContent.extractedData)),
                    source: 'apify',
                    title: scrapingResult.title
                  }
                }
              })

              results.summary.pagesChecked++

              // If we have a previous snapshot, compare for changes
              if (snapshot) {
                // Process old content based on its source
                let oldProcessedContent
                if (snapshot.metadata && (snapshot.metadata as Record<string, unknown>).source === 'apify') {
                  // Old content was from Apify
                  oldProcessedContent = await contentProcessor.processTextOnlyContent(
                    snapshot.textContent || '',
                    (snapshot.metadata as Record<string, unknown>)?.title as string
                  )
                } else {
                  // Old content was from Playwright scraper
                  oldProcessedContent = await contentProcessor.processContent(
                    snapshot.content,
                    snapshot.textContent || ''
                  )
                }

                // Detect changes
                const changeResult = await changeDetector.detectChanges(
                  page.company.name,
                  page.pageType,
                  oldProcessedContent,
                  newProcessedContent
                )

                // If significant change detected, record it
                if (changeResult.hasSignificantChange) {
                  const change = await db.saasChange.create({
                    data: {
                      companyId: page.companyId,
                      pageId: page.id,
                      detectionRunId: runId,
                      changeType: changeResult.changeType,
                      changeSummary: changeResult.changeSummary,
                      oldValue: changeResult.details.oldValue,
                      newValue: changeResult.details.newValue,
                      impactLevel: changeResult.details.impactLevel,
                      confidence: changeResult.confidence,
                      competitiveAnalysis: changeResult.competitiveAnalysis
                    }
                  })

                  results.changes.push({
                    pageId: page.id,
                    url: page.url,
                    changeType: changeResult.changeType,
                    changeSummary: changeResult.changeSummary,
                    impactLevel: changeResult.details.impactLevel
                  })

                  results.summary.changesFound++

                  console.log(`Change detected for ${page.url}: ${changeResult.changeSummary}`)

                  // Trigger notification processing
                  try {
                    const notificationResult = await notificationEngine.processChange({
                      id: change.id,
                      companyId: page.companyId,
                      pageId: page.id,
                      changeType: changeResult.changeType,
                      changeSummary: changeResult.changeSummary,
                      oldValue: changeResult.details.oldValue,
                      newValue: changeResult.details.newValue,
                      impactLevel: changeResult.details.impactLevel,
                      confidence: changeResult.confidence,
                      competitiveAnalysis: changeResult.competitiveAnalysis,
                      detectedAt: new Date()
                    })

                    if (notificationResult.success && notificationResult.notifications > 0) {
                      console.log(`Queued ${notificationResult.notifications} notification(s) for change ${change.id}`)
                    } else if (!notificationResult.success) {
                      console.error(`Notification processing failed for change ${change.id}:`, notificationResult.errors)
                    }
                  } catch (notificationError) {
                    console.error(`Error triggering notifications for change ${change.id}:`, notificationError)
                  }
                }
              }

              // Update page's lastChecked timestamp
              await db.monitoredPage.update({
                where: { id: page.id },
                data: { lastChecked: new Date() }
              })

            } catch (error) {
              console.error(`Error processing page ${scrapingResult.url}:`, error)
              results.errors.push(`Error processing ${scrapingResult.url}: ${error instanceof Error ? error.message : 'Unknown error'}`)
              results.summary.errors++
            }
          }

        } catch (error) {
          console.error(`Error processing competitor ${competitorGroup.companyName}:`, error)
          // Add errors for all URLs in this competitor group
          competitorGroup.urls.forEach(url => {
            results.errors.push(`Error processing ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            results.summary.errors++
          })
        }
      }

      // Update run status
      const finalStatus = results.summary.errors > 0 ? 'partial' : 'completed'
      await this.completeDetectionRun(runId, finalStatus, results.summary.changesFound, results.errors)
      
      results.status = finalStatus
      return results

    } catch (error) {
      console.error('Change detection run failed:', error)
      await this.completeDetectionRun(runId, 'failed', 0, [error instanceof Error ? error.message : 'Unknown error'])
      
      return {
        runId,
        status: 'failed',
        summary: { pagesChecked: 0, changesFound: 0, errors: 1 },
        changes: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async createDetectionRun(options: ChangeDetectionOptions): Promise<string> {
    const run = await db.changeDetectionRun.create({
      data: {
        pageId: options.pageId || null,
        runType: options.runType,
        status: 'running',
        metadata: {
          options: JSON.parse(JSON.stringify(options)),
          startedAt: new Date().toISOString()
        }
      }
    })

    return run.id
  }

  private async completeDetectionRun(
    runId: string, 
    status: 'completed' | 'failed' | 'partial', 
    changesFound: number, 
    errors: string[]
  ): Promise<void> {
    await db.changeDetectionRun.update({
      where: { id: runId },
      data: {
        status,
        endTime: new Date(),
        changesFound,
        errorMessage: errors.length > 0 ? errors.join('; ') : null,
        metadata: {
          completedAt: new Date().toISOString(),
          errors: JSON.parse(JSON.stringify(errors))
        }
      }
    })
  }

  private async getPagesToCheck(options: ChangeDetectionOptions) {
    if (options.pageId) {
      // Check specific page
      return await db.monitoredPage.findMany({
        where: {
          id: options.pageId,
          isActive: true
        },
        include: {
          company: true
        }
      })
    }

    if (options.companyId) {
      // Check all pages for specific company
      return await db.monitoredPage.findMany({
        where: {
          companyId: options.companyId,
          isActive: true
        },
        include: {
          company: true
        }
      })
    }

    // Check all active pages
    return await db.monitoredPage.findMany({
      where: {
        isActive: true
      },
      include: {
        company: true
      }
    })
  }

  async getRecentRuns(limit: number = 10) {
    return await db.changeDetectionRun.findMany({
      orderBy: { startTime: 'desc' },
      take: limit,
      include: {
        page: {
          include: {
            company: true
          }
        },
        changes: {
          take: 5 // Limit changes per run for overview
        }
      }
    })
  }

  async getRunStatus(runId: string) {
    return await db.changeDetectionRun.findUnique({
      where: { id: runId },
      include: {
        page: {
          include: {
            company: true
          }
        },
        changes: true
      }
    })
  }

  private groupPagesByCompany(pages: Array<{ companyId: string; company: { name: string }; url: string }>): CompetitorUrls[] {
    const companyGroups = new Map<string, CompetitorUrls>()

    for (const page of pages) {
      const companyId = page.companyId
      const companyName = page.company.name

      if (!companyGroups.has(companyId)) {
        companyGroups.set(companyId, {
          companyId,
          companyName,
          urls: []
        })
      }

      companyGroups.get(companyId)!.urls.push(page.url)
    }

    return Array.from(companyGroups.values())
  }

  async getSystemHealth() {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [
      totalActivePages,
      recentRuns,
      recentChanges,
      failedRuns,
      avgRunTime
    ] = await Promise.all([
      db.monitoredPage.count({
        where: { isActive: true }
      }),
      
      db.changeDetectionRun.count({
        where: {
          startTime: {
            gte: oneDayAgo
          }
        }
      }),

      db.saasChange.count({
        where: {
          detectedAt: {
            gte: oneDayAgo
          }
        }
      }),

      db.changeDetectionRun.count({
        where: {
          status: 'failed',
          startTime: {
            gte: oneDayAgo
          }
        }
      }),

      db.changeDetectionRun.findMany({
        where: {
          status: 'completed',
          startTime: {
            gte: oneDayAgo
          },
          endTime: {
            not: null
          }
        },
        select: {
          startTime: true,
          endTime: true
        }
      })
    ])

    const averageRunTimeMs = avgRunTime.length > 0 
      ? avgRunTime.reduce((sum, run) => {
          const duration = run.endTime!.getTime() - run.startTime.getTime()
          return sum + duration
        }, 0) / avgRunTime.length
      : 0

    return {
      totalActivePages,
      last24Hours: {
        runs: recentRuns,
        changes: recentChanges,
        failures: failedRuns,
        successRate: recentRuns > 0 ? ((recentRuns - failedRuns) / recentRuns * 100).toFixed(1) + '%' : 'N/A'
      },
      performance: {
        averageRunTimeSeconds: Math.round(averageRunTimeMs / 1000),
        scraperStats: apifyService.getStats()
      },
      status: failedRuns / Math.max(recentRuns, 1) < 0.1 ? 'healthy' : 'degraded'
    }
  }
}

export const changeDetectionService = new ChangeDetectionService()