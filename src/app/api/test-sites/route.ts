import { NextRequest, NextResponse } from 'next/server'
import { testSiteManager } from '@/lib/test-site-manager'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const competitor = searchParams.get('competitor')
  const pageType = searchParams.get('pageType')
  const action = searchParams.get('action')

  try {
    if (action === 'report') {
      const report = await testSiteManager.generateTestSiteReport()
      return NextResponse.json(report)
    }

    if (action === 'validate') {
      if (competitor && pageType) {
        const validation = await testSiteManager.validateTestSite(competitor, pageType)
        return NextResponse.json(validation)
      } else {
        const validations = await testSiteManager.validateAllTestSites()
        return NextResponse.json(validations)
      }
    }

    if (competitor) {
      const testSites = await testSiteManager.getTestSitesByCompetitor(competitor)
      return NextResponse.json(testSites)
    }

    if (pageType) {
      const testSites = await testSiteManager.getTestSitesByPageType(pageType)
      return NextResponse.json(testSites)
    }

    const testSites = await testSiteManager.listAllTestSites()
    return NextResponse.json(testSites)
    
  } catch (error) {
    console.error('Error listing test sites:', error)
    return NextResponse.json(
      { error: 'Failed to list test sites' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { competitor, pageType, url, afterUrl, description } = body

    if (!competitor || !pageType || !url) {
      return NextResponse.json(
        { error: 'competitor, pageType, and url are required' },
        { status: 400 }
      )
    }

    let result
    if (afterUrl) {
      result = await testSiteManager.createTestSitePair(
        competitor,
        pageType,
        url,
        afterUrl,
        description
      )
    } else {
      result = await testSiteManager.createTestSiteFromUrl(
        competitor,
        pageType,
        url,
        description
      )
    }

    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error creating test site:', error)
    return NextResponse.json(
      { error: 'Failed to create test site' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const competitor = searchParams.get('competitor')
  const pageType = searchParams.get('pageType')
  const action = searchParams.get('action')

  if (!competitor || !pageType) {
    return NextResponse.json(
      { error: 'competitor and pageType are required' },
      { status: 400 }
    )
  }

  try {
    if (action === 'cleanup') {
      const cleanupResult = await testSiteManager.cleanupInvalidTestSites()
      return NextResponse.json(cleanupResult)
    }

    await testSiteManager.deleteTestSite(competitor, pageType)
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error deleting test site:', error)
    return NextResponse.json(
      { error: 'Failed to delete test site' },
      { status: 500 }
    )
  }
}