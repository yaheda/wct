"use client"

import * as React from "react"
import { Play, Square, TestTube, Activity, AlertCircle, CheckCircle2, Clock, Zap, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TestResult } from "@/lib/test-scenarios"

interface SystemHealth {
  totalActivePages: number
  last24Hours: {
    runs: number
    changes: number
    failures: number
    successRate: string
  }
  performance: {
    averageRunTimeSeconds: number
    scraperStats: {
      requestCounts: Record<string, number>
      isInitialized: boolean
      browserRunning: boolean
    }
  }
  status: 'healthy' | 'degraded'
}

interface DetectionRun {
  runId: string
  status: 'completed' | 'failed' | 'partial'
  summary: {
    pagesChecked: number
    changesFound: number
    errors: number
  }
  testMode?: boolean
  timestamp?: string
}

interface TestReport {
  summary: {
    total: number
    passed: number
    failed: number
    averageAccuracy: number
    testMode: string
    llmProviders: string[]
  }
  details: TestResult[]
}

export function ChangeDetectionPanel() {
  const [systemHealth, setSystemHealth] = React.useState<SystemHealth | null>(null)
  const [isRunning, setIsRunning] = React.useState(false)
  const [lastRun, setLastRun] = React.useState<DetectionRun | null>(null)
  const [isTestDialogOpen, setIsTestDialogOpen] = React.useState(false)
  const [testResults, setTestResults] = React.useState<TestReport | null>(null)
  const [useSyntheticSites, setUseSyntheticSites] = React.useState(false)
  const [sendTestEmails, setSendTestEmails] = React.useState(false)
  const [testUserEmail, setTestUserEmail] = React.useState('')

  // Fetch system health on component mount
  React.useEffect(() => {
    fetchSystemHealth()
    const interval = setInterval(fetchSystemHealth, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/change-detection/status')
      if (response.ok) {
        const health = await response.json()
        setSystemHealth(health)
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error)
    }
  }

  const runChangeDetection = async (testMode = false) => {
    setIsRunning(true)

    try {
      const response = await fetch('/api/change-detection/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          runType: 'manual',
          testMode,
          options: {
            useSyntheticSites: testMode ? useSyntheticSites : false,
            sendTestEmails: testMode ? sendTestEmails : false,
            testUserEmail: testMode && sendTestEmails ? testUserEmail : undefined
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start change detection')
      }

      const result = await response.json()
      setLastRun({
        runId: result.runId,
        status: result.status,
        summary: result.summary,
        testMode,
        timestamp: new Date().toISOString()
      })

      if (testMode) {
        setTestResults(result.testReport)
      }

      // Refresh system health after run
      await fetchSystemHealth()

    } catch (error) {
      console.error('Change detection failed:', error)
      setLastRun({
        runId: 'failed-' + Date.now(),
        status: 'failed',
        summary: { pagesChecked: 0, changesFound: 0, errors: 1 },
        testMode,
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsRunning(false)
    }
  }

  const runTestScenarios = async () => {
    setIsRunning(true)
    await runChangeDetection(true)
    setIsTestDialogOpen(true)
  }

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getRunStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Change Detection</h2>
          <p className="text-muted-foreground">
            Monitor and analyze competitor website changes
          </p>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {systemHealth && (
          <>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">System Status</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getHealthStatusIcon(systemHealth.status)}
                    <span className="text-lg font-semibold capitalize">{systemHealth.status}</span>
                  </div>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Pages</p>
                  <p className="text-2xl font-bold text-foreground">{systemHealth.totalActivePages}</p>
                </div>
                <Zap className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">24h Changes</p>
                  <p className="text-2xl font-bold text-foreground">{systemHealth.last24Hours.changes}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-foreground">{systemHealth.last24Hours.successRate}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Control Panel */}
      <div className="rounded-lg border border-border bg-background p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Detection Controls</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Manual Detection */}
          <div className="space-y-4">
            <h4 className="text-base font-medium text-foreground">Manual Detection</h4>
            <p className="text-sm text-muted-foreground">
              Run change detection across all active competitor pages
            </p>
            <Button
              onClick={() => runChangeDetection(false)}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Square className="h-4 w-4 mr-2 animate-spin" />
                  Running Detection...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Change Detection
                </>
              )}
            </Button>
          </div>

          {/* Test Detection */}
          <div className="space-y-4">
            <h4 className="text-base font-medium text-foreground">Test Detection</h4>
            <p className="text-sm text-muted-foreground">
              Run detection on test scenarios to validate accuracy
            </p>
            
            {/* Synthetic Sites Toggle */}
            <div className="flex items-center space-x-2 p-3 rounded-md border border-border bg-muted/50">
              <input
                type="checkbox"
                id="useSyntheticSites"
                checked={useSyntheticSites}
                onChange={(e) => setUseSyntheticSites(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="useSyntheticSites" className="flex items-center space-x-2 text-sm font-medium">
                <Globe className="h-4 w-4" />
                <span>Use Synthetic Test Sites</span>
              </label>
            </div>
            
            {/* Send Test Emails Toggle */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-3 rounded-md border border-border bg-muted/50">
                <input
                  type="checkbox"
                  id="sendTestEmails"
                  checked={sendTestEmails}
                  onChange={(e) => setSendTestEmails(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="sendTestEmails" className="flex items-center space-x-2 text-sm font-medium">
                  <span>Send Test Emails</span>
                </label>
              </div>
              
              {sendTestEmails && (
                <input
                  type="email"
                  placeholder="Test email address"
                  value={testUserEmail}
                  onChange={(e) => setTestUserEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
                />
              )}
            </div>
            
            <Button
              onClick={runTestScenarios}
              disabled={isRunning}
              variant="outline"
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Square className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Run Test Scenarios
                  {useSyntheticSites && <Globe className="h-4 w-4 ml-2" />}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Last Run Results */}
      {lastRun && (
        <div className="rounded-lg border border-border bg-background p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Last Run Results</h3>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {getRunStatusIcon(lastRun.status)}
              <span className="font-medium capitalize">{lastRun.status}</span>
              {lastRun.testMode && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  Test Mode
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {lastRun.timestamp && new Date(lastRun.timestamp).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{lastRun.summary.pagesChecked}</p>
              <p className="text-sm text-muted-foreground">Pages Checked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{lastRun.summary.changesFound}</p>
              <p className="text-sm text-muted-foreground">Changes Found</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{lastRun.summary.errors}</p>
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
          </div>
        </div>
      )}

      {/* Test Results Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test Scenario Results</DialogTitle>
            <DialogDescription>
              Results from running change detection test scenarios
            </DialogDescription>
          </DialogHeader>

          {testResults && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{testResults.summary.total}</p>
                  <p className="text-sm text-muted-foreground">Total Tests</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{testResults.summary.passed}</p>
                  <p className="text-sm text-muted-foreground">Passed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{testResults.summary.failed}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{(testResults.summary.averageAccuracy * 100).toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                </div>
              </div>

              {/* Individual Results */}
              <div className="space-y-2">
                {Array.isArray(testResults.details) && testResults.details.map((result, index) => (
                  <div
                    key={result.scenarioId || index}
                    className={`p-4 rounded-lg border ${
                      result.passed 
                        ? 'border-green-200 bg-green-50 dark:bg-green-900/10' 
                        : 'border-red-200 bg-red-50 dark:bg-red-900/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {result.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">{result.scenarioId}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>Accuracy: {(result.details.accuracy * 100).toFixed(1)}%</span>
                        {result.details.contentSource === 'synthetic-urls' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            <Globe className="h-3 w-3 mr-1" />
                            Synthetic
                          </span>
                        )}
                        {result.details.emailSent !== undefined && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            result.details.emailSent 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {result.details.emailSent ? '✉️ Email Sent' : '✉️ Email Failed'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {Array.isArray(result.details.errors) && 
                     result.details.errors.length > 0 && (
                      <div className="mt-2 text-sm text-red-600">
                        {result.details.errors.map((error, errorIndex) => (
                          <p key={errorIndex}>• {error}</p>
                        ))}
                      </div>
                    )}
                    
                    {result.details.emailError && (
                      <div className="mt-2 text-sm text-red-600">
                        <p>• Email Error: {result.details.emailError}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}