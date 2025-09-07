import { NextRequest, NextResponse } from 'next/server'
import { testSiteManager } from '@/lib/test-site-manager'

export async function POST(request: NextRequest) {
  try {
    console.log('Initializing default test sites...')
    const results = await testSiteManager.initializeDefaultTestSites()
    
    return NextResponse.json({
      success: true,
      message: `Created ${results.length} test sites`,
      testSites: results
    })
    
  } catch (error) {
    console.error('Error initializing test sites:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to initialize test sites',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}