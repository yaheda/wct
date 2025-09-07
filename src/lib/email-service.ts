import { Resend } from 'resend'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

export interface TemplateVariables {
  [key: string]: string | number | boolean | object
}

export interface NotificationContext {
  userId: string
  changeId?: string
  competitorName: string
  changeType: string
  changeSummary: string
  impactLevel: string
  oldValue?: string
  newValue?: string
  competitiveAnalysis?: string
  pageUrl: string
  pageType: string
}

export class EmailService {
  private readonly fromEmail: string

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev'
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!resend || !process.env.RESEND_API_KEY) {
        console.log('Email service disabled - RESEND_API_KEY not configured')
        return { success: false, error: 'Email service not configured' }
      }

      const result = await resend.emails.send({
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      })

      if (result.error) {
        console.error('Email send error:', result.error)
        return { success: false, error: result.error.message }
      }

      return { success: true, messageId: result.data?.id }

    } catch (error) {
      console.error('Email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async sendTemplatedEmail(
    templateId: string, 
    recipientEmail: string, 
    variables: TemplateVariables
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Get template from database
      const template = await db.emailTemplate.findUnique({
        where: { id: templateId, isActive: true }
      })

      if (!template) {
        return { success: false, error: 'Template not found or inactive' }
      }

      // Replace variables in template
      const processedHtml = this.processTemplate(template.htmlContent, variables)
      const processedText = this.processTemplate(template.textContent, variables)
      const processedSubject = this.processTemplate(template.subject, variables)

      return await this.sendEmail({
        to: recipientEmail,
        subject: processedSubject,
        html: processedHtml,
        text: processedText
      })

    } catch (error) {
      console.error('Templated email error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async queueNotification(
    userId: string,
    templateType: 'pricing_alert' | 'feature_alert' | 'weekly_summary',
    context: NotificationContext,
    priority: 1 | 2 | 3 = 1,
    scheduledFor?: Date
  ): Promise<{ success: boolean; queueId?: string; error?: string }> {
    try {
      // Get user email
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      })

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // Get appropriate template
      const template = await db.emailTemplate.findFirst({
        where: { 
          templateType,
          isActive: true 
        }
      })

      if (!template) {
        return { success: false, error: `Template not found for type: ${templateType}` }
      }

      // Prepare template variables
      const variables = {
        userName: user.name || 'there',
        userEmail: user.email,
        competitorName: context.competitorName,
        changeType: context.changeType,
        changeSummary: context.changeSummary,
        impactLevel: context.impactLevel,
        oldValue: context.oldValue || '',
        newValue: context.newValue || '',
        competitiveAnalysis: context.competitiveAnalysis || '',
        pageUrl: context.pageUrl,
        pageType: context.pageType,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}/dashboard`,
        viewChangeUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}/dashboard/changes?changeId=${context.changeId}`
      }

      // Process templates
      const processedHtml = this.processTemplate(template.htmlContent, variables)
      const processedText = this.processTemplate(template.textContent, variables)
      const processedSubject = this.processTemplate(template.subject, variables)

      // Queue the notification
      const queueItem = await db.notificationQueue.create({
        data: {
          userId,
          changeId: context.changeId,
          templateId: template.id,
          recipientEmail: user.email,
          subject: processedSubject,
          htmlContent: processedHtml,
          textContent: processedText,
          priority,
          scheduledFor: scheduledFor || new Date(),
          metadata: {
            context: JSON.parse(JSON.stringify(context)),
            templateType,
            processedAt: new Date().toISOString()
          }
        }
      })

      return { success: true, queueId: queueItem.id }

    } catch (error) {
      console.error('Queue notification error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async processQueue(limit: number = 10): Promise<{ processed: number; errors: string[] }> {
    try {
      // Get pending notifications ordered by priority and scheduled time
      const pendingNotifications = await db.notificationQueue.findMany({
        where: {
          status: 'pending',
          scheduledFor: {
            lte: new Date()
          }
        },
        orderBy: [
          { priority: 'asc' },
          { scheduledFor: 'asc' }
        ],
        take: limit
      })

      const errors: string[] = []
      let processed = 0

      for (const notification of pendingNotifications) {
        try {
          // Send the email
          const result = await this.sendEmail({
            to: notification.recipientEmail,
            subject: notification.subject,
            html: notification.htmlContent,
            text: notification.textContent
          })

          if (result.success) {
            // Update queue item as sent
            await db.notificationQueue.update({
              where: { id: notification.id },
              data: {
                status: 'sent',
                sentAt: new Date(),
                metadata: {
                  ...notification.metadata as object,
                  messageId: result.messageId,
                  sentAt: new Date().toISOString()
                }
              }
            })

            // Create notification history record
            await db.notification.create({
              data: {
                userId: notification.userId,
                changeId: notification.changeId,
                templateId: notification.templateId,
                notificationType: (notification.metadata as any)?.templateType || 'unknown',
                status: 'sent',
                metadata: {
                  messageId: result.messageId,
                  subject: notification.subject,
                  sentTo: notification.recipientEmail
                }
              }
            })

            processed++
          } else {
            // Handle failure
            const newRetryCount = notification.retryCount + 1
            
            if (newRetryCount >= notification.maxRetries) {
              // Mark as failed
              await db.notificationQueue.update({
                where: { id: notification.id },
                data: {
                  status: 'failed',
                  errorMessage: result.error,
                  retryCount: newRetryCount
                }
              })
              errors.push(`Failed to send email (${notification.id}): ${result.error}`)
            } else {
              // Schedule retry
              const retryDelay = Math.min(300000 * Math.pow(2, newRetryCount), 3600000) // Exponential backoff, max 1 hour
              await db.notificationQueue.update({
                where: { id: notification.id },
                data: {
                  retryCount: newRetryCount,
                  scheduledFor: new Date(Date.now() + retryDelay),
                  errorMessage: result.error
                }
              })
            }
          }

        } catch (error) {
          const errorMsg = `Error processing notification ${notification.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(errorMsg)
          errors.push(errorMsg)

          // Update retry count
          const newRetryCount = notification.retryCount + 1
          await db.notificationQueue.update({
            where: { id: notification.id },
            data: {
              retryCount: newRetryCount,
              errorMessage: errorMsg,
              status: newRetryCount >= notification.maxRetries ? 'failed' : 'pending'
            }
          })
        }
      }

      return { processed, errors }

    } catch (error) {
      console.error('Process queue error:', error)
      return { 
        processed: 0, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      }
    }
  }

  private processTemplate(template: string, variables: TemplateVariables): string {
    let processed = template

    // Replace template variables in format {{variableName}}
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      processed = processed.replace(placeholder, String(value))
    }

    // Clean up any remaining unreplaced variables
    processed = processed.replace(/{{.*?}}/g, '')

    return processed
  }

  async getQueueStats(): Promise<{
    pending: number
    sent: number
    failed: number
    retrying: number
    oldestPending?: Date
  }> {
    const [pending, sent, failed, retrying, oldestPendingResult] = await Promise.all([
      db.notificationQueue.count({ where: { status: 'pending' } }),
      db.notificationQueue.count({ where: { status: 'sent' } }),
      db.notificationQueue.count({ where: { status: 'failed' } }),
      db.notificationQueue.count({ 
        where: { 
          status: 'pending',
          retryCount: { gt: 0 }
        } 
      }),
      db.notificationQueue.findFirst({
        where: { status: 'pending' },
        orderBy: { scheduledFor: 'asc' },
        select: { scheduledFor: true }
      })
    ])

    return {
      pending,
      sent,
      failed,
      retrying,
      oldestPending: oldestPendingResult?.scheduledFor
    }
  }
}

export const emailService = new EmailService()