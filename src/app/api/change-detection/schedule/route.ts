import { NextRequest, NextResponse } from 'next/server'
import { changeDetectionService } from '@/lib/change-detection-service'

// This endpoint is intended to be called by cron jobs or schedulers
// In production, you'd want to secure this with a secret token

export async function POST(request: NextRequest) {
  try {
    // Simple authentication for scheduled runs - in production use proper secrets
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.SCHEDULER_SECRET || 'dev-scheduler-secret'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting scheduled change detection run...')

    // Run change detection for all active pages
    const result = await changeDetectionService.runDetection({
      runType: 'scheduled'
    })

    console.log(`Scheduled run completed: ${result.summary.changesFound} changes found across ${result.summary.pagesChecked} pages`)

    return NextResponse.json({
      success: true,
      runId: result.runId,
      summary: result.summary,
      changesFound: result.changes.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Scheduled change detection failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Scheduled detection failed',
        timestamp: new Date().toISOString() 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Health check endpoint for the scheduler
  return NextResponse.json({ 
    status: 'ready',
    timestamp: new Date().toISOString()
  })
}