import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email-service'
import { notificationEngine } from '@/lib/notification-engine'

export async function POST(request: NextRequest) {
  try {
    const { limit = 10, processWeekly = false } = await request.json()

    let results = {
      emailsProcessed: 0,
      weeklySummariesProcessed: 0,
      errors: [] as string[]
    }

    // Process email queue
    const emailResult = await emailService.processQueue(limit)
    results.emailsProcessed = emailResult.processed
    results.errors.push(...emailResult.errors)

    // Process weekly summaries if requested
    if (processWeekly) {
      const weeklyResult = await notificationEngine.processWeeklySummary()
      results.weeklySummariesProcessed = weeklyResult.summaries
      results.errors.push(...weeklyResult.errors)
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error) {
    console.error('Process queue error:', error)
    return NextResponse.json(
      { error: 'Failed to process notification queue' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('includeStats') === 'true'

    let response: any = {
      message: 'Notification queue processor is available'
    }

    if (includeStats) {
      const [queueStats, notificationStats] = await Promise.all([
        emailService.getQueueStats(),
        notificationEngine.getNotificationStats()
      ])

      response.stats = {
        queue: queueStats,
        notifications: notificationStats
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Get queue status error:', error)
    return NextResponse.json(
      { error: 'Failed to get queue status' },
      { status: 500 }
    )
  }
}