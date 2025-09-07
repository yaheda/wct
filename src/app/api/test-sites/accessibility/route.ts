import { NextRequest, NextResponse } from 'next/server'
import { testSiteManager } from '@/lib/test-site-manager'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const competitor = searchParams.get('competitor')
  const pageType = searchParams.get('pageType')

  if (!competitor || !pageType) {
    return NextResponse.json(
      { error: 'competitor and pageType are required' },
      { status: 400 }
    )
  }

  try {
    const accessibility = await testSiteManager.testSiteAccessibility(competitor, pageType)
    return NextResponse.json(accessibility)
    
  } catch (error) {
    console.error('Error testing site accessibility:', error)
    return NextResponse.json(
      { error: 'Failed to test site accessibility' },
      { status: 500 }
    )
  }
}