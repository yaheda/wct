import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { testFramework, TestRunOptions } from '@/lib/test-scenarios'
import { testLLMProvider } from '@/lib/change-detector'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const scenarios = testFramework.getAllTestScenarios()
    
    return NextResponse.json({
      scenarios: scenarios.map(scenario => ({
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        pageType: scenario.pageType,
        competitorName: scenario.competitorName,
        expectedChanges: scenario.expectedChanges
      }))
    })

  } catch (error) {
    console.error('Test scenarios API error:', error)
    return NextResponse.json(
      { error: 'Failed to get test scenarios' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, scenarioId, options = {} } = body

    // Parse test run options
    const testOptions: TestRunOptions = {
      useRealLLM: options.useRealLLM || false,
      llmProvider: options.llmProvider,
      scenarios: options.scenarios,
      verbose: options.verbose || false,
      useSyntheticSites: options.useSyntheticSites || false
    }

    if (action === 'test-llm') {
      // Test LLM provider connection
      const testResult = await testLLMProvider(testOptions.llmProvider)
      return NextResponse.json(testResult)
    }

    if (action === 'run' && scenarioId) {
      // Run specific test scenario
      const result = await testFramework.runTestScenario(scenarioId, testOptions)
      return NextResponse.json(result)
    }

    if (action === 'run-all') {
      // Run all test scenarios
      const results = await testFramework.runAllTests(testOptions)
      const report = testFramework.generateTestReport(results)
      return NextResponse.json({
        ...report,
        testOptions
      })
    }

    if (action === 'run-comparative') {
      // Run comparative tests (mock vs real LLM)
      const comparison = await testFramework.runComparativeTests({
        scenarios: testOptions.scenarios,
        verbose: testOptions.verbose,
        useSyntheticSites: testOptions.useSyntheticSites
      })
      return NextResponse.json(comparison)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Test scenarios POST API error:', error)
    return NextResponse.json(
      { error: 'Failed to execute test scenario', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}