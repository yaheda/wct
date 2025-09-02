import { NextRequest, NextResponse } from 'next/server'
import { scraper } from '@/lib/scraper'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, respectRobots, ignoreRobots, timeout } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    console.log(`Testing scraper with URL: ${url}`)
    console.log(`Options: respectRobots=${respectRobots}, ignoreRobots=${ignoreRobots}`)

    const result = await scraper.scrapePage(url, {
      respectRobots,
      ignoreRobots,
      timeout: timeout || 15000,
      waitForNetworkIdle: false // Faster for testing
    })

    return NextResponse.json({
      url: result.url,
      robotsBlocked: result.robotsBlocked,
      content: result.content.substring(0, 1000), // Limit content for testing
      textContent: result.textContent.substring(0, 500),
      metadata: {
        title: result.metadata.title,
        statusCode: result.metadata.statusCode,
        loadTime: result.metadata.loadTime,
        timestamp: result.metadata.timestamp,
        userAgent: result.metadata.userAgent,
        browserName: result.metadata.browserName,
        viewport: result.metadata.viewport,
        robotsCompliant: result.metadata.robotsCompliant,
        crawlDelay: result.metadata.crawlDelay,
      },
      error: result.error
    })

  } catch (error) {
    console.error('Test scraper API error:', error)
    return NextResponse.json(
      { 
        error: 'Scraping failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}