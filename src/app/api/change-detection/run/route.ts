import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { changeDetectionService } from '@/lib/change-detection-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { pageId, companyId, runType = 'manual' } = body

    // Validate runType
    if (!['manual', 'scheduled'].includes(runType)) {
      return NextResponse.json({ error: 'Invalid run type' }, { status: 400 })
    }


    // Run change detection
    const result = await changeDetectionService.runDetection({
      pageId,
      companyId,
      runType
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Change detection API error:', error)
    return NextResponse.json(
      { error: 'Failed to run change detection' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const runId = searchParams.get('runId')

    if (runId) {
      // Get specific run status
      const runStatus = await changeDetectionService.getRunStatus(runId)
      if (!runStatus) {
        return NextResponse.json({ error: 'Run not found' }, { status: 404 })
      }
      return NextResponse.json(runStatus)
    }

    // Get recent runs
    const limit = parseInt(searchParams.get('limit') || '10')
    const recentRuns = await changeDetectionService.getRecentRuns(limit)
    
    return NextResponse.json(recentRuns)

  } catch (error) {
    console.error('Change detection status API error:', error)
    return NextResponse.json(
      { error: 'Failed to get change detection status' },
      { status: 500 }
    )
  }
}