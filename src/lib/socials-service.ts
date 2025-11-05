import { PrismaClient } from '@prisma/client'
import { InstagramScraper } from './instagram-scraper'
import { emailService } from './email-service'

const db = new PrismaClient()

export interface SocialsDetectionOptions {
  profileId?: string
  companyId?: string
  runType: 'manual' | 'scheduled'
}

export interface SocialsDetectionServiceResult {
  runId: string
  status: 'completed' | 'failed' | 'partial'
  summary: {
    profilesScraped: number
    changesFound: number
    errors: number
  }
  changes: Array<{
    profileId: string
    platform: string
    handle: string
    changeType: string
    changeSummary: string
    impactLevel: string
  }>
  errors: string[]
}

class SocialsDetectionService {
  private instagramScraper: InstagramScraper | null = null

  constructor() {
    try {
      this.instagramScraper = new InstagramScraper()
    } catch (error) {
      console.warn('Instagram scraper initialization warning:', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async runDetection(options: SocialsDetectionOptions): Promise<SocialsDetectionServiceResult> {
    const runId = await this.createDetectionRun(options)

    try {
      // Get social profiles to check
      const profiles = await this.getProfilesToCheck(options)

      if (profiles.length === 0) {
        await this.completeDetectionRun(runId, 'completed', 0, [])
        return {
          runId,
          status: 'completed',
          summary: { profilesScraped: 0, changesFound: 0, errors: 0 },
          changes: [],
          errors: ['No active social profiles found to monitor']
        }
      }

      const results: SocialsDetectionServiceResult = {
        runId,
        status: 'completed',
        summary: { profilesScraped: 0, changesFound: 0, errors: 0 },
        changes: [],
        errors: []
      }

      console.log(`Processing ${profiles.length} social profiles`)

      // Process each social profile
      for (const profile of profiles) {
        try {
          console.log(`Processing ${profile.platform} profile: ${profile.handle}`)

          // Get latest snapshot for comparison
          const latestSnapshot = await db.socialSnapshot.findFirst({
            where: { profileId: profile.id },
            orderBy: { capturedAt: 'desc' }
          })

          let scrapedData: Record<string, unknown> | null = null
          let scrapedCount: number | null = null
          //let scrapedPosts: InstagramPost[] | null = null

          // Scrape based on platform
          if (profile.platform === 'instagram') {
            if (!this.instagramScraper) {
              results.errors.push(`Instagram scraper not initialized for ${profile.handle}`)
              results.summary.errors++
              continue
            }
            const result = await this.instagramScraper.scrapeInstagramProfile(profile.handle, profile.lastChecked)
            if (!result.success) {
              results.errors.push(`Failed to scrape Instagram ${profile.handle}: ${result.error}`)
              results.summary.errors++
              continue
            }
            scrapedData = { posts: result.data }
            scrapedCount = result.data?.length || 0
          } else {
            results.errors.push(`Platform ${profile.platform} not yet supported`)
            results.summary.errors++
            continue
          }

          if (scrapedCount === 0) {
            results.errors.push(`No data scraped for ${profile.handle}`)
          } else {
            // Create new snapshot
            const newSnapshot = await db.socialSnapshot.create({
              data: {
                profileId: profile.id,
                capturedAt: new Date(),
                raw: scrapedData as any,
                runId,
                metrics: this.extractMetrics(scrapedData) as any
              }
            })

            // Queue email notification for successful scrape
            try {
              // Get company owner for notification
              const company = await db.company.findUnique({
                where: { id: profile.companyId },
                include: { user: true }
              })

              if (company && company.user) {
                // Extract latest posts for email
                const posts = scrapedData.posts as Array<{ caption?: string; commentsCount?: number; comments?: string[], latestComments?: string[] }> || []
                const latestPosts = posts.slice(0, 5).map(post => ({
                  caption: post.caption || '',
                  commentsCount: post.commentsCount || 0,
                  comments: post.latestComments || [] //post.comments || []
                }))

                // Queue the notification
                await emailService.queueNotification(
                  company.userId,
                  'instagram_scrape_complete',
                  {
                    userId: company.userId,
                    competitorName: company.name,
                    changeType: 'social_scrape',
                    changeSummary: `Successfully scraped ${scrapedCount} posts from ${profile.platform}`,
                    impactLevel: 'medium',
                    pageUrl: profile.url || `https://${profile.platform}.com/${profile.handle}`,
                    pageType: profile.platform,
                    handle: profile.handle,
                    postCount: scrapedCount,
                    scrapedAt: new Date().toLocaleString(),
                    profileId: profile.id,
                    companyId: profile.companyId,
                    latestPosts
                  },
                  2 // Medium priority
                )

                console.log(`Queued notification for ${profile.handle} scrape completion`)
              }
            } catch (notificationError) {
              // Log but don't fail the scrape if notification fails
              console.error(`Failed to queue notification for ${profile.handle}:`, notificationError)
              results.errors.push(`Notification failed for ${profile.handle}: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`)
            }
          }



          results.summary.profilesScraped++
          results.summary.changesFound += scrapedCount

          // Update profile's lastChecked timestamp
          await db.socialProfile.update({
            where: { id: profile.id },
            data: { lastChecked: new Date() }
          })

          // // If we have a previous snapshot, compare for changes
          // if (latestSnapshot && latestSnapshot.raw) {
          //   const changeResults = await this.detectChanges(
          //     profile,
          //     latestSnapshot.raw as Record<string, unknown>,
          //     scrapedData as Record<string, unknown>,
          //     newSnapshot.id
          //   )

          //   if (changeResults.length > 0) {
          //     results.summary.changesFound += changeResults.length

          //     // Add changes to results
          //     for (const change of changeResults) {
          //       results.changes.push({
          //         profileId: profile.id,
          //         platform: profile.platform,
          //         handle: profile.handle,
          //         changeType: change.changeType,
          //         changeSummary: change.changeSummary,
          //         impactLevel: change.impactLevel
          //       })

          //       console.log(`Detected ${change.changeType} change for ${profile.handle}: ${change.changeSummary}`)
          //     }
          //   }
          // }

          

        } catch (error) {
          console.error(`Error processing profile ${profile.handle}:`, error)
          results.errors.push(`Error processing ${profile.handle}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          results.summary.errors++
        }
      }

      // Update run status
      const finalStatus = results.summary.errors > 0 && results.summary.profilesScraped === 0 ? 'failed' : results.summary.errors > 0 ? 'partial' : 'completed'
      await this.completeDetectionRun(runId, finalStatus, results.summary.changesFound, results.errors)

      results.status = finalStatus
      return results

    } catch (error) {
      console.error('Socials detection run failed:', error)
      await this.completeDetectionRun(runId, 'failed', 0, [error instanceof Error ? error.message : 'Unknown error'])

      return {
        runId,
        status: 'failed',
        summary: { profilesScraped: 0, changesFound: 0, errors: 1 },
        changes: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async createDetectionRun(options: SocialsDetectionOptions): Promise<string> {
    const run = await db.socialDetectionRun.create({
      data: {
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
    await db.socialDetectionRun.update({
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

  private async getProfilesToCheck(options: SocialsDetectionOptions) {
    if (options.profileId) {
      // Check specific profile
      return await db.socialProfile.findMany({
        where: {
          id: options.profileId,
          isActive: true
        },
        include: {
          company: true
        }
      })
    }

    if (options.companyId) {
      // Check all profiles for specific company
      return await db.socialProfile.findMany({
        where: {
          companyId: options.companyId,
          isActive: true
        },
        include: {
          company: true
        }
      })
    }

    // Check all active profiles
    return await db.socialProfile.findMany({
      where: {
        isActive: true
      },
      include: {
        company: true
      }
    })
  }

  private extractMetrics(data: Record<string, unknown>): Record<string, unknown> {
    // Extract useful metrics from scraped data
    // This can be extended based on platform-specific data
    const posts = data.posts as Record<string, unknown>[] | undefined

    if (!posts || !Array.isArray(posts)) {
      return {}
    }

    const totalComments = posts.reduce((sum, post) => {
      const commentsCount = post.commentsCount as number | undefined
      return sum + (commentsCount || 0)
    }, 0)

    return {
      postsCount: posts.length,
      totalComments,
      averageCommentsPerPost: posts.length > 0 ? totalComments / posts.length : 0,
      lastPostDate: posts.length > 0 ? (posts[0] as Record<string, unknown>).timestamp : null
    }
  }

  private async detectChanges(
    profile: { id: string; companyId: string; platform: string; handle: string },
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
    snapshotId: string
  ): Promise<Array<{
    id: string
    changeType: string
    changeSummary: string
    oldValue: string
    newValue: string
    impactLevel: string
    confidence: string
  }>> {
    const changes: Array<{
      id: string
      changeType: string
      changeSummary: string
      oldValue: string
      newValue: string
      impactLevel: string
      confidence: string
    }> = []

    const oldMetrics = this.extractMetrics(oldData)
    const newMetrics = this.extractMetrics(newData)

    // Check for new posts
    const oldPostsCount = (oldMetrics.postsCount as number) || 0
    const newPostsCount = (newMetrics.postsCount as number) || 0

    if (newPostsCount > oldPostsCount) {
      const postsAdded = newPostsCount - oldPostsCount
      const change = await db.socialChange.create({
        data: {
          companyId: profile.companyId,
          profileId: profile.id,
          snapshotId,
          runId: undefined,
          changeType: 'posts_update',
          changeSummary: `${postsAdded} new post(s) added to Instagram`,
          oldValue: JSON.stringify({ postsCount: oldPostsCount }),
          newValue: JSON.stringify({ postsCount: newPostsCount }),
          impactLevel: postsAdded > 3 ? 'high' : 'medium',
          confidence: 'high'
        }
      })

      changes.push({
        id: change.id,
        changeType: change.changeType,
        changeSummary: change.changeSummary,
        oldValue: change.oldValue || '',
        newValue: change.newValue || '',
        impactLevel: change.impactLevel,
        confidence: change.confidence
      })
    }

    // Check for engagement changes
    const oldComments = (oldMetrics.totalComments as number) || 0
    const newComments = (newMetrics.totalComments as number) || 0
    const commentIncrease = newComments - oldComments

    if (commentIncrease > 10) {
      const change = await db.socialChange.create({
        data: {
          companyId: profile.companyId,
          profileId: profile.id,
          snapshotId,
          runId: undefined,
          changeType: 'engagement_change',
          changeSummary: `Engagement increased by ${commentIncrease} comments`,
          oldValue: JSON.stringify({ totalComments: oldComments }),
          newValue: JSON.stringify({ totalComments: newComments }),
          impactLevel: 'medium',
          confidence: 'high'
        }
      })

      changes.push({
        id: change.id,
        changeType: change.changeType,
        changeSummary: change.changeSummary,
        oldValue: change.oldValue || '',
        newValue: change.newValue || '',
        impactLevel: change.impactLevel,
        confidence: change.confidence
      })
    }

    return changes
  }

  async getRecentRuns(limit: number = 10) {
    return await db.socialDetectionRun.findMany({
      orderBy: { startTime: 'desc' },
      take: limit,
      include: {
        changes: {
          include: {
            profile: true
          },
          take: 5 // Limit changes per run for overview
        }
      }
    })
  }

  async getRunStatus(runId: string) {
    return await db.socialDetectionRun.findUnique({
      where: { id: runId },
      include: {
        changes: {
          include: {
            profile: true
          }
        }
      }
    })
  }

  async getSystemHealth() {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [
      totalActiveProfiles,
      recentRuns,
      recentChanges,
      failedRuns,
      avgRunTime
    ] = await Promise.all([
      db.socialProfile.count({
        where: { isActive: true }
      }),

      db.socialDetectionRun.count({
        where: {
          startTime: {
            gte: oneDayAgo
          }
        }
      }),

      db.socialChange.count({
        where: {
          detectedAt: {
            gte: oneDayAgo
          }
        }
      }),

      db.socialDetectionRun.count({
        where: {
          status: 'failed',
          startTime: {
            gte: oneDayAgo
          }
        }
      }),

      db.socialDetectionRun.findMany({
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
      ? avgRunTime.reduce((sum: number, run: any) => {
          const duration = run.endTime!.getTime() - run.startTime.getTime()
          return sum + duration
        }, 0) / avgRunTime.length
      : 0

    return {
      totalActiveProfiles,
      last24Hours: {
        runs: recentRuns,
        changes: recentChanges,
        failures: failedRuns,
        successRate: recentRuns > 0 ? ((recentRuns - failedRuns) / recentRuns * 100).toFixed(1) + '%' : 'N/A'
      },
      performance: {
        averageRunTimeSeconds: Math.round(averageRunTimeMs / 1000)
      },
      status: failedRuns / Math.max(recentRuns, 1) < 0.1 ? 'healthy' : 'degraded'
    }
  }
}

export const socialsDetectionService = new SocialsDetectionService()
