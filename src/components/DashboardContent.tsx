"use client"

import * as React from "react"
import { Monitor, Bell, TrendingUp, Clock } from "lucide-react"
import { AddWebsiteForm } from "@/components/AddWebsiteForm"
import { WebsiteList } from "@/components/WebsiteList"

interface Website {
  id: string
  url: string
  name: string
  checkInterval: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function DashboardContent() {
  const [websites, setWebsites] = React.useState<Website[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchWebsites = React.useCallback(async () => {
    try {
      setError(null)
      const response = await fetch("/api/websites")
      
      if (!response.ok) {
        throw new Error("Failed to fetch websites")
      }
      
      const data = await response.json()
      setWebsites(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchWebsites()
  }, [fetchWebsites])

  const handleWebsiteAdded = () => {
    fetchWebsites()
  }

  const handleWebsiteDeleted = (deletedId: string) => {
    setWebsites(prev => prev.filter(website => website.id !== deletedId))
  }

  const activeMonitors = websites.filter(w => w.isActive).length
  const totalMonitors = websites.length

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="border-b border-border pb-5">
          <h1 className="text-2xl font-bold leading-7 text-foreground sm:truncate sm:text-3xl sm:tracking-tight">
            Dashboard Overview
          </h1>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              Loading your monitors...
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="relative overflow-hidden rounded-lg border border-border bg-background p-6 animate-pulse">
              <div className="absolute rounded-md bg-gray-200 dark:bg-gray-700 p-3 w-12 h-12" />
              <div className="ml-16 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="border-b border-border pb-5">
          <h1 className="text-2xl font-bold leading-7 text-foreground sm:truncate sm:text-3xl sm:tracking-tight">
            Dashboard Overview
          </h1>
        </div>
        
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
          <p className="text-destructive">Error loading dashboard: {error}</p>
          <button
            onClick={fetchWebsites}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold leading-7 text-foreground sm:truncate sm:text-3xl sm:tracking-tight">
          Dashboard Overview
        </h1>
        <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
          <div className="mt-2 flex items-center text-sm text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your monitors.
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-lg border border-border bg-background p-6">
          <dt>
            <div className="absolute rounded-md bg-primary/10 p-3">
              <Monitor className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-muted-foreground">Active Monitors</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-foreground">{activeMonitors}</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-border bg-background p-6">
          <dt>
            <div className="absolute rounded-md bg-orange-500/10 p-3">
              <Bell className="h-6 w-6 text-orange-500" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-muted-foreground">Total Monitors</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-foreground">{totalMonitors}</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-border bg-background p-6">
          <dt>
            <div className="absolute rounded-md bg-green-500/10 p-3">
              <TrendingUp className="h-6 w-6 text-green-500" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-muted-foreground">Changes Detected</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-foreground">0</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-border bg-background p-6">
          <dt>
            <div className="absolute rounded-md bg-blue-500/10 p-3">
              <Clock className="h-6 w-6 text-blue-500" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-muted-foreground">Last Check</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-foreground">--</p>
          </dd>
        </div>
      </div>

      {/* Add Website Form and Website List */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-foreground">Website Monitors</h2>
        <AddWebsiteForm onWebsiteAdded={handleWebsiteAdded} />
      </div>

      <WebsiteList 
        websites={websites}
        onWebsiteDeleted={handleWebsiteDeleted}
        onRefresh={fetchWebsites}
      />

      {/* Recent Activity */}
      <div className="space-y-6">
        <h2 className="text-lg font-medium text-foreground">Recent Activity</h2>
        <div className="rounded-lg border border-border bg-background p-6">
          <div className="text-center">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No activity yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor activity will appear here once you set up your first monitor.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}