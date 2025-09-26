"use client"

import * as React from "react"
import { Play, Square, Activity, AlertCircle, CheckCircle2, Clock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InstagramDetection } from "./InstagramDetection"

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
  timestamp?: string
}


export function ChangeDetectionPanel() {
  const [systemHealth, setSystemHealth] = React.useState<SystemHealth | null>(null)
  const [isRunning, setIsRunning] = React.useState(false)
  const [lastRun, setLastRun] = React.useState<DetectionRun | null>(null)
  const [companies, setCompanies] = React.useState<Array<{ id: string; name: string }>>([])

  // Fetch companies for Instagram detection
  React.useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/competitors")
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.map((company: { id: string; name: string }) => ({ id: company.id, name: company.name })))
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    }
  }

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

  const runChangeDetection = async () => {
    setIsRunning(true)

    try {
      const response = await fetch('/api/change-detection/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          runType: 'manual'
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
        timestamp: new Date().toISOString()
      })

      // Refresh system health after run
      await fetchSystemHealth()

    } catch (error) {
      console.error('Change detection failed:', error)
      setLastRun({
        runId: 'failed-' + Date.now(),
        status: 'failed',
        summary: { pagesChecked: 0, changesFound: 0, errors: 1 },
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsRunning(false)
    }
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
        
        <div className="space-y-4">
          <h4 className="text-base font-medium text-foreground">Manual Detection</h4>
          <p className="text-sm text-muted-foreground">
            Run change detection across all active competitor pages
          </p>
          <Button
            onClick={runChangeDetection}
            disabled={isRunning}
            className="w-full max-w-sm"
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
      </div>

      {/* Instagram Detection */}
      <InstagramDetection companies={companies} />

      {/* Last Run Results */}
      {lastRun && (
        <div className="rounded-lg border border-border bg-background p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Last Run Results</h3>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {getRunStatusIcon(lastRun.status)}
              <span className="font-medium capitalize">{lastRun.status}</span>
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

    </div>
  )
}