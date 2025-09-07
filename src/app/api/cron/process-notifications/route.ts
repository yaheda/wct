import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email-service'
import { notificationEngine } from '@/lib/notification-engine'

export async function GET(request: NextRequest) {
  try {
    console.log('Cron job: Processing notifications queue started')

    // Get current time info
    const now = new Date()
    const currentHour = now.getHours()
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    let results = {
      timestamp: now.toISOString(),
      emailsProcessed: 0,
      weeklySummariesProcessed: 0,
      errors: [] as string[],
      skipped: [] as string[]
    }

    // Always process the email queue (pending notifications)
    console.log('Processing email queue...')
    const emailResult = await emailService.processQueue(20) // Process up to 20 emails
    results.emailsProcessed = emailResult.processed
    results.errors.push(...emailResult.errors)

    // Process weekly summaries only on Sunday at 9 AM (or any time if forced)
    const forceWeekly = request.nextUrl.searchParams.get('force') === 'weekly'
    const shouldProcessWeekly = currentDay === 0 && currentHour === 9 // Sunday 9 AM
    
    if (shouldProcessWeekly || forceWeekly) {
      console.log('Processing weekly summaries...')
      const weeklyResult = await notificationEngine.processWeeklySummary()
      results.weeklySummariesProcessed = weeklyResult.summaries
      results.errors.push(...weeklyResult.errors)
    } else {
      results.skipped.push('Weekly summaries (not scheduled time)')
    }

    // Clean up old notifications and queue items (older than 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    console.log('Cleaning up old records...')
    
    // This would require additional cleanup methods - for now just log
    console.log(`Would clean up notifications older than ${thirtyDaysAgo.toISOString()}`)

    console.log('Cron job: Processing notifications queue completed', results)

    return NextResponse.json({
      success: true,
      message: 'Notification processing completed',
      results
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Allow manual triggering via POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { force = false, limit = 10 } = body

    console.log('Manual notification processing triggered', { force, limit })

    let results = {
      timestamp: new Date().toISOString(),
      emailsProcessed: 0,
      weeklySummariesProcessed: 0,
      errors: [] as string[]
    }

    // Process email queue
    const emailResult = await emailService.processQueue(limit)
    results.emailsProcessed = emailResult.processed
    results.errors.push(...emailResult.errors)

    // Process weekly summaries if forced or requested
    if (force) {
      const weeklyResult = await notificationEngine.processWeeklySummary()
      results.weeklySummariesProcessed = weeklyResult.summaries
      results.errors.push(...weeklyResult.errors)
    }

    return NextResponse.json({
      success: true,
      message: 'Manual notification processing completed',
      results
    })

  } catch (error) {
    console.error('Manual processing error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Manual processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}