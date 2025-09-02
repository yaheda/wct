import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { changeDetectionService } from '@/lib/change-detection-service'
import { testFramework } from '@/lib/test-scenarios'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { pageId, companyId, runType = 'manual', testMode = false } = body

    // Validate runType
    if (!['manual', 'scheduled', 'test'].includes(runType)) {
      return NextResponse.json({ error: 'Invalid run type' }, { status: 400 })
    }

    // Handle test mode
    if (testMode) {
      console.log('Running in test mode - using mock scenarios')
      const testResults = await testFramework.runAllTests()
      const report = testFramework.generateTestReport(testResults)
      
      return NextResponse.json({
        runId: 'test-run-' + Date.now(),
        status: 'completed',
        testMode: true,
        summary: {
          pagesChecked: report.summary.total,
          changesFound: report.summary.passed,
          errors: report.summary.failed
        },
        testReport: report,
        changes: [],
        errors: []
      })
    }

    // Run actual change detection
    const result = await changeDetectionService.runDetection({
      pageId,
      companyId,
      runType,
      testMode: false
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