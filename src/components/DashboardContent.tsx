"use client"

import * as React from "react"
import { Monitor, Bell, TrendingUp, Clock } from "lucide-react"
import { AddCompetitorForm } from "@/components/AddCompetitorForm"
import { CompetitorList } from "@/components/CompetitorList"

interface MonitoredPage {
  id: string
  url: string
  pageType: string
  priority: number
  isActive: boolean
  lastChecked: string | null
}

interface Company {
  id: string
  name: string
  domain: string
  isCompetitor: boolean
  createdAt: string
  updatedAt: string
  pages: MonitoredPage[]
  _count: {
    changes: number
  }
}

export function DashboardContent() {
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchCompanies = React.useCallback(async () => {
    try {
      setError(null)
      const response = await fetch("/api/competitors")
      
      if (!response.ok) {
        throw new Error("Failed to fetch competitors")
      }
      
      const data = await response.json()
      setCompanies(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  const handleCompetitorAdded = () => {
    fetchCompanies()
  }

  const handleCompetitorDeleted = (deletedId: string) => {
    setCompanies(prev => prev.filter(company => company.id !== deletedId))
  }

  const activeCompetitors = companies.length
  const totalPages = companies.reduce((acc, company) => acc + company.pages.length, 0)
  const totalChanges = companies.reduce((acc, company) => acc + company._count.changes, 0)
  const highPriorityPages = companies.reduce((acc, company) => 
    acc + company.pages.filter(page => page.priority === 1).length, 0
  )

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="border-b border-border pb-5">
          <h1 className="text-2xl font-bold leading-7 text-foreground sm:truncate sm:text-3xl sm:tracking-tight">
            Competitive Intelligence
          </h1>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              Loading your competitor intelligence...
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
            Competitive Intelligence
          </h1>
        </div>
        
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
          <p className="text-destructive">Error loading dashboard: {error}</p>
          <button
            onClick={fetchCompanies}
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
          Competitive Intelligence
        </h1>
        <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
          <div className="mt-2 flex items-center text-sm text-muted-foreground">
            Welcome back! Here&apos;s your competitive intelligence overview.
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
            <p className="ml-16 truncate text-sm font-medium text-muted-foreground">Tracked Competitors</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-foreground">{activeCompetitors}</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-border bg-background p-6">
          <dt>
            <div className="absolute rounded-md bg-orange-500/10 p-3">
              <Bell className="h-6 w-6 text-orange-500" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-muted-foreground">Monitored Pages</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-foreground">{totalPages}</p>
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
            <p className="text-2xl font-semibold text-foreground">{totalChanges}</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-border bg-background p-6">
          <dt>
            <div className="absolute rounded-md bg-blue-500/10 p-3">
              <Clock className="h-6 w-6 text-blue-500" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-muted-foreground">High Priority Pages</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-foreground">{highPriorityPages}</p>
          </dd>
        </div>
      </div>

      {/* Add Website Form and Website List */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-foreground">Competitor Intelligence</h2>
        <AddCompetitorForm onCompetitorAdded={handleCompetitorAdded} />
      </div>

      <CompetitorList 
        websites={companies}
        onWebsiteDeleted={handleCompetitorDeleted}
        onRefresh={fetchCompanies}
      />

      {/* Recent Activity */}
      <div className="space-y-6">
        <h2 className="text-lg font-medium text-foreground">Recent Activity</h2>
        <div className="rounded-lg border border-border bg-background p-6">
          <div className="text-center">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No activity yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Competitor changes and insights will appear here once you add your first competitor.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}