import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { notificationEngine } from '@/lib/notification-engine'

const db = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action = 'test_change_notification', userId } = body

    switch (action) {
      case 'test_change_notification':
        return await testChangeNotification(userId)
      
      case 'test_weekly_summary':
        return await testWeeklySummary()
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Test notification error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function testChangeNotification(userId?: string) {
  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required for this test' },
      { status: 400 }
    )
  }

  // Find or create a test user
  let user = await db.user.findUnique({
    where: { id: userId },
    include: {
      companies: {
        include: {
          pages: true,
          changes: {
            take: 1,
            orderBy: { detectedAt: 'desc' }
          }
        }
      }
    }
  })

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    )
  }

  // Create a test change if none exist
  let testChange
  if (user.companies.length > 0 && user.companies[0].changes.length === 0) {
    const company = user.companies[0]
    const page = company.pages[0]

    if (page) {
      testChange = await db.saasChange.create({
        data: {
          companyId: company.id,
          pageId: page.id,
          changeType: 'pricing',
          changeSummary: 'Test pricing change - reduced Pro plan by 20%',
          oldValue: '$99/month',
          newValue: '$79/month',
          impactLevel: 'high',
          confidence: 'high',
          competitiveAnalysis: 'This pricing reduction makes your competitor significantly more competitive in the mid-market segment.',
          detectedAt: new Date()
        }
      })
    }
  } else if (user.companies.length > 0) {
    testChange = user.companies[0].changes[0]
  }

  if (!testChange) {
    return NextResponse.json(
      { error: 'No test change available. Please add a competitor first.' },
      { status: 400 }
    )
  }

  // Test notification processing
  const result = await notificationEngine.processChange({
    id: testChange.id,
    companyId: testChange.companyId,
    pageId: testChange.pageId,
    changeType: testChange.changeType,
    changeSummary: testChange.changeSummary,
    oldValue: testChange.oldValue,
    newValue: testChange.newValue,
    impactLevel: testChange.impactLevel,
    confidence: testChange.confidence,
    competitiveAnalysis: testChange.competitiveAnalysis,
    detectedAt: testChange.detectedAt
  })

  return NextResponse.json({
    success: true,
    message: 'Test change notification processed',
    testChange: {
      id: testChange.id,
      changeType: testChange.changeType,
      changeSummary: testChange.changeSummary,
      impactLevel: testChange.impactLevel
    },
    notificationResult: result
  })
}

// Removed createDefaultPreferences function since we no longer use preferences

async function testWeeklySummary() {
  const result = await notificationEngine.processWeeklySummary()

  return NextResponse.json({
    success: true,
    message: 'Weekly summary processing tested',
    result
  })
}

export async function GET() {
  try {
    // Get notification system stats
    const stats = await notificationEngine.getNotificationStats()
    
    // Get queue stats (without requiring Resend)
    const queueCount = await db.notificationQueue.count()
    const pendingCount = await db.notificationQueue.count({
      where: { status: 'pending' }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Notification system test endpoint',
      stats,
      queueStats: {
        total: queueCount,
        pending: pendingCount
      },
      availableTests: [
        'test_change_notification (requires userId)',
        'test_weekly_summary'
      ]
    })

  } catch (error) {
    console.error('Test stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get test stats' },
      { status: 500 }
    )
  }
}