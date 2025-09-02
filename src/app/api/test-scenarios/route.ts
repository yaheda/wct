import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { testFramework } from '@/lib/test-scenarios'

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
    const { action, scenarioId } = body

    if (action === 'run' && scenarioId) {
      // Run specific test scenario
      const result = await testFramework.runTestScenario(scenarioId)
      return NextResponse.json(result)
    }

    if (action === 'run-all') {
      // Run all test scenarios
      const results = await testFramework.runAllTests()
      const report = testFramework.generateTestReport(results)
      return NextResponse.json(report)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Test scenarios POST API error:', error)
    return NextResponse.json(
      { error: 'Failed to execute test scenario' },
      { status: 500 }
    )
  }
}