import { PrismaClient } from '@prisma/client'
import { emailService, type NotificationContext } from './email-service'

const db = new PrismaClient()

export interface ChangeEvent {
  id: string
  companyId: string
  pageId?: string
  changeType: string
  changeSummary: string
  oldValue?: string
  newValue?: string
  impactLevel: string
  confidence: string
  competitiveAnalysis?: string
  detectedAt: Date
}

export interface NotificationRule {
  enabled: boolean
  immediate: boolean // Send immediately vs batched
  changeTypes: string[]
  impactLevels: string[]
  frequency: 'immediate' | 'daily' | 'weekly'
}

export class NotificationEngine {
  
  async processChange(changeEvent: ChangeEvent): Promise<{ success: boolean; notifications: number; errors: string[] }> {
    try {
      const errors: string[] = []
      let notifications = 0

      // Get the change details with related data
      const change = await db.saasChange.findUnique({
        where: { id: changeEvent.id },
        include: {
          company: {
            include: {
              user: true
            }
          },
          page: true
        }
      })

      if (!change) {
        return { success: false, notifications: 0, errors: ['Change not found'] }
      }

      const user = change.company.user
      if (!user) {
        return { success: false, notifications: 0, errors: ['User not found for change'] }
      }

      // Create notification context
      const context: NotificationContext = {
        userId: user.id,
        changeId: change.id,
        competitorName: change.company.name,
        changeType: change.changeType,
        changeSummary: change.changeSummary,
        impactLevel: change.impactLevel,
        oldValue: change.oldValue,
        newValue: change.newValue,
        competitiveAnalysis: change.competitiveAnalysis,
        pageUrl: change.page?.url || `https://${change.company.domain}`,
        pageType: change.page?.pageType || 'unknown'
      }

      // Determine notification type based on change
      const notificationType = this.getNotificationTypeForChange(change.changeType)
      
      // Always send notifications for all impact levels (high, medium, low)
      // Determine priority based on impact level
      const priority = this.getPriority(change.impactLevel, change.changeType)
      
      // Queue immediate notification for high impact changes and pricing
      if (change.impactLevel === 'high' || change.changeType === 'pricing') {
        const result = await emailService.queueNotification(
          user.id,
          notificationType,
          context,
          priority
        )

        if (result.success) {
          notifications++
          console.log(`Queued ${notificationType} notification for user ${user.id}, change ${change.id}`)
        } else {
          errors.push(`Failed to queue notification: ${result.error}`)
        }
      } else {
        // Queue with delay for medium/low impact changes
        const delay = this.getNotificationDelay(change.impactLevel, change.changeType)
        const scheduledFor = new Date(Date.now() + delay)
        
        const result = await emailService.queueNotification(
          user.id,
          notificationType,
          context,
          priority,
          scheduledFor
        )

        if (result.success) {
          notifications++
          console.log(`Scheduled ${notificationType} notification for user ${user.id}, change ${change.id} at ${scheduledFor}`)
        } else {
          errors.push(`Failed to schedule notification: ${result.error}`)
        }
      }

      return { success: true, notifications, errors }

    } catch (error) {
      console.error('Notification engine error:', error)
      return { 
        success: false, 
        notifications: 0, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      }
    }
  }

  async processWeeklySummary(): Promise<{ success: boolean; summaries: number; errors: string[] }> {
    try {
      const errors: string[] = []
      let summaries = 0

      // Get all users with companies (automatically send weekly summaries to all users)
      const users = await db.user.findMany({
        include: {
          companies: {
            include: {
              changes: {
                where: {
                  detectedAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                  }
                },
                include: {
                  page: true
                },
                orderBy: { detectedAt: 'desc' }
              }
            }
          }
        }
      })

      for (const user of users) {
        try {
          // Skip users with no companies being monitored
          if (user.companies.length === 0) {
            continue
          }

          // Aggregate changes by type
          const allChanges = user.companies.flatMap(company => 
            company.changes.map(change => ({
              ...change,
              competitorName: company.name
            }))
          )

          if (allChanges.length === 0) {
            continue // Skip users with no changes this week
          }

          const pricingChanges = allChanges.filter(c => c.changeType === 'pricing')
          const featureChanges = allChanges.filter(c => c.changeType === 'features')
          const messagingChanges = allChanges.filter(c => c.changeType === 'messaging')
          const highImpactChanges = allChanges.filter(c => c.impactLevel === 'high')

          // Create weekly summary context
          const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          const weekEnd = new Date()
          const weekRange = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`

          const summaryContext = {
            userId: user.id,
            changeId: undefined,
            competitorName: 'Multiple Competitors',
            changeType: 'weekly_summary',
            changeSummary: `Weekly summary of ${allChanges.length} changes across ${user.companies.length} competitors`,
            impactLevel: 'medium',
            pageUrl: '',
            pageType: 'summary',
            
            // Additional context for weekly summary
            weekRange,
            totalChanges: allChanges.length,
            competitorCount: user.companies.length,
            highImpactChanges: highImpactChanges.length,
            pricingChanges: pricingChanges.length > 0 ? {
              changes: pricingChanges.slice(0, 5).map(c => ({
                competitorName: c.competitorName,
                changeSummary: c.changeSummary,
                impactLevel: c.impactLevel
              }))
            } : null,
            featureChanges: featureChanges.length > 0 ? {
              changes: featureChanges.slice(0, 5).map(c => ({
                competitorName: c.competitorName,
                changeSummary: c.changeSummary,
                impactLevel: c.impactLevel
              }))
            } : null,
            messagingChanges: messagingChanges.length > 0 ? {
              changes: messagingChanges.slice(0, 5).map(c => ({
                competitorName: c.competitorName,
                changeSummary: c.changeSummary,
                impactLevel: c.impactLevel
              }))
            } : null
          }

          const result = await emailService.queueNotification(
            user.id,
            'weekly_summary',
            summaryContext as any,
            3 // Low priority
          )

          if (result.success) {
            summaries++
            console.log(`Queued weekly summary for user ${user.id}`)
          } else {
            errors.push(`Failed to queue weekly summary for user ${user.id}: ${result.error}`)
          }

        } catch (error) {
          const errorMsg = `Error processing weekly summary for user ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(errorMsg)
          errors.push(errorMsg)
        }
      }

      return { success: true, summaries, errors }

    } catch (error) {
      console.error('Weekly summary processing error:', error)
      return { 
        success: false, 
        summaries: 0, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      }
    }
  }

  private getNotificationTypeForChange(changeType: string): 'pricing_alert' | 'feature_alert' | 'weekly_summary' {
    switch (changeType) {
      case 'pricing':
        return 'pricing_alert'
      case 'features':
      case 'product':
      case 'integration':
        return 'feature_alert'
      default:
        return 'feature_alert' // Default to feature alert for other changes
    }
  }

  // Removed preference checking methods since we now automatically send all notifications

  private getPriority(impactLevel: string, changeType: string): 1 | 2 | 3 {
    if (impactLevel === 'high' || changeType === 'pricing') {
      return 1 // High priority
    } else if (impactLevel === 'medium') {
      return 2 // Medium priority  
    } else {
      return 3 // Low priority
    }
  }

  private getNotificationDelay(impactLevel: string, changeType: string): number {
    if (impactLevel === 'high' || changeType === 'pricing') {
      return 0 // Immediate
    } else if (impactLevel === 'medium') {
      return 2 * 60 * 60 * 1000 // 2 hours
    } else {
      return 6 * 60 * 60 * 1000 // 6 hours
    }
  }

  // Removed createDefaultNotificationPreferences method since we no longer use preferences

  async getNotificationStats(): Promise<{
    totalProcessed: number
    recentNotifications: number
    queueStats: any
  }> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [totalProcessed, recentNotifications, queueStats] = await Promise.all([
      db.notification.count(),
      db.notification.count({
        where: {
          sentAt: {
            gte: oneDayAgo
          }
        }
      }),
      emailService.getQueueStats()
    ])

    return {
      totalProcessed,
      recentNotifications,
      queueStats
    }
  }
}

export const notificationEngine = new NotificationEngine()