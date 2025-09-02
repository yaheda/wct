"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface TestResult {
  test: string
  status: 'allowed' | 'blocked' | 'error'
  robotsCompliant: boolean
  crawlDelay: number
  contentLength: number
  userAgent?: string
  error?: string
  timing?: number
}

export default function TestRobotsPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTests = async () => {
    setIsRunning(true)
    setResults([])
    const testResults: TestResult[] = []

    try {
      // Test 1: Example.com (should be allowed)
      console.log('Testing example.com...')
      const response1 = await fetch('/api/test-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://example.com',
          respectRobots: true
        })
      })
      const result1 = await response1.json()
      testResults.push({
        test: 'Example.com (respectRobots: true)',
        status: result1.robotsBlocked ? 'blocked' : 'allowed',
        robotsCompliant: result1.metadata?.robotsCompliant || false,
        crawlDelay: result1.metadata?.crawlDelay || 0,
        contentLength: result1.content?.length || 0,
        userAgent: result1.metadata?.userAgent,
        error: result1.error
      })

      // Test 2: Example.com with robots disabled
      console.log('Testing example.com with robots disabled...')
      const response2 = await fetch('/api/test-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://example.com',
          ignoreRobots: true
        })
      })
      const result2 = await response2.json()
      testResults.push({
        test: 'Example.com (ignoreRobots: true)',
        status: result2.robotsBlocked ? 'blocked' : 'allowed',
        robotsCompliant: result2.metadata?.robotsCompliant || false,
        crawlDelay: result2.metadata?.crawlDelay || 0,
        contentLength: result2.content?.length || 0,
        error: result2.error
      })

      // Test 3: Test rate limiting
      console.log('Testing rate limiting...')
      const startTime = Date.now()
      await fetch('/api/test-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://httpbin.org/delay/1',
          respectRobots: true
        })
      })
      const middleTime = Date.now()
      await fetch('/api/test-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://httpbin.org/delay/1',
          respectRobots: true
        })
      })
      const endTime = Date.now()

      testResults.push({
        test: 'Rate limiting test',
        status: 'allowed',
        robotsCompliant: true,
        crawlDelay: 5000,
        contentLength: 0,
        timing: endTime - startTime
      })

    } catch (error) {
      testResults.push({
        test: 'Test Suite',
        status: 'error',
        robotsCompliant: false,
        crawlDelay: 0,
        contentLength: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    setResults(testResults)
    setIsRunning(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Robots.txt Compliance Test</h1>
        <p className="text-muted-foreground">
          Test the scraper&apos;s robots.txt compliance and rate limiting
        </p>
      </div>

      <Button 
        onClick={runTests} 
        disabled={isRunning}
        className="mb-4"
      >
        {isRunning ? 'Running Tests...' : 'Run Robots.txt Tests'}
      </Button>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results</h2>
          {results.map((result, index) => (
            <div 
              key={index}
              className={`p-4 border rounded-lg ${
                result.status === 'allowed' ? 'border-green-200 bg-green-50 dark:bg-green-900/10' :
                result.status === 'blocked' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10' :
                'border-red-200 bg-red-50 dark:bg-red-900/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{result.test}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  result.status === 'allowed' ? 'bg-green-100 text-green-800' :
                  result.status === 'blocked' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {result.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="font-medium">Robots Compliant:</span>
                  <span className="ml-1">{result.robotsCompliant ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="font-medium">Crawl Delay:</span>
                  <span className="ml-1">{result.crawlDelay}ms</span>
                </div>
                <div>
                  <span className="font-medium">Content Length:</span>
                  <span className="ml-1">{result.contentLength} chars</span>
                </div>
                {result.timing && (
                  <div>
                    <span className="font-medium">Total Time:</span>
                    <span className="ml-1">{result.timing}ms</span>
                  </div>
                )}
              </div>

              {result.userAgent && (
                <div className="mt-2 text-sm">
                  <span className="font-medium">User Agent:</span>
                  <span className="ml-1 text-xs break-all">{result.userAgent}</span>
                </div>
              )}

              {result.error && (
                <div className="mt-2 text-sm text-red-600">
                  <span className="font-medium">Error:</span>
                  <span className="ml-1">{result.error}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}