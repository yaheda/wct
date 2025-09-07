import { PrismaClient } from '@prisma/client'
import { scraper } from './scraper'
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

      // Process each page
      for (const page of pages) {
        try {
          console.log(`Processing page: ${page.url}`)
          
          // Get the latest snapshot for comparison
          const latestSnapshot = await db.pageSnapshot.findFirst({
            where: { pageId: page.id, status: 'active' },
            orderBy: { createdAt: 'desc' }
          })

          // Scrape current content
          const scrapingResult = await scraper.scrapePage(page.url, {
            timeout: 30000,
            waitForNetworkIdle: true
          })

          if (scrapingResult.error) {
            results.errors.push(`Failed to scrape ${page.url}: ${scrapingResult.error}`)
            results.summary.errors++
            continue
          }

          // Process the new content
          const newProcessedContent = await contentProcessor.processContent(
            scrapingResult.content,
            scrapingResult.textContent
          )

          // Create new snapshot
          const newSnapshot = await db.pageSnapshot.create({
            data: {
              pageId: page.id,
              content: scrapingResult.content,
              contentHash: newProcessedContent.contentHash,
              textContent: scrapingResult.textContent,
              metadata: {
                ...scrapingResult.metadata,
                extractedData: JSON.parse(JSON.stringify(newProcessedContent.extractedData))
              }
            }
          })

          results.summary.pagesChecked++

          // If we have a previous snapshot, compare for changes
          if (latestSnapshot) {
            const oldProcessedContent = await contentProcessor.processContent(
              latestSnapshot.content,
              latestSnapshot.textContent || ''
            )

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
          console.error(`Error processing page ${page.url}:`, error)
          results.errors.push(`Error processing ${page.url}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          results.summary.errors++
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
        scraperStats: scraper.getStats()
      },
      status: failedRuns / Math.max(recentRuns, 1) < 0.1 ? 'healthy' : 'degraded'
    }
  }
}

export const changeDetectionService = new ChangeDetectionService()