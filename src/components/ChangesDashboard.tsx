"use client"

import * as React from "react"
import { TrendingUp, AlertTriangle, Info, CheckCircle2, Clock, Filter, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Change {
  id: string
  changeType: string
  changeSummary: string
  impactLevel: 'high' | 'medium' | 'low'
  confidence: string
  detectedAt: string
  oldValue?: string
  newValue?: string
  competitiveAnalysis?: string
  company: {
    id: string
    name: string
    domain: string
  }
  page: {
    id: string
    url: string
    pageType: string
  }
}

interface ChangesResponse {
  changes: Change[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
  stats: {
    byType: Array<{ type: string; count: number }>
    byImpact: Array<{ level: string; count: number }>
    total: number
  }
}

interface ChangesDashboardProps {
  companyId?: string
}

export function ChangesDashboard({ companyId }: ChangesDashboardProps) {
  const [changes, setChanges] = React.useState<Change[]>([])
  const [stats, setStats] = React.useState<ChangesResponse['stats'] | null>(null)
  const [pagination, setPagination] = React.useState<ChangesResponse['pagination'] | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Filters
  const [selectedType, setSelectedType] = React.useState('')
  const [selectedImpact, setSelectedImpact] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)

  const fetchChanges = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })

      if (companyId) params.append('companyId', companyId)
      if (selectedType) params.append('changeType', selectedType)
      if (selectedImpact) params.append('impactLevel', selectedImpact)

      const response = await fetch(`/api/changes?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch changes')
      }

      const data: ChangesResponse = await response.json()
      setChanges(data.changes)
      setStats(data.stats)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }, [companyId, selectedType, selectedImpact, currentPage])

  React.useEffect(() => {
    fetchChanges()
  }, [fetchChanges])

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'medium': return <Info className="h-4 w-4 text-yellow-500" />
      case 'low': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default: return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800'
      case 'medium': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800'
      case 'low': return 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800'
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-900/10 dark:border-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const resetFilters = () => {
    setSelectedType('')
    setSelectedImpact('')
    setCurrentPage(1)
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
        <p className="text-destructive">Error loading changes: {error}</p>
        <Button
          onClick={fetchChanges}
          variant="outline"
          size="sm"
          className="mt-4"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Detected Changes</h2>
          <p className="text-muted-foreground">
            Track competitor updates and market intelligence
          </p>
        </div>
        <Button onClick={fetchChanges} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Changes</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </div>

          {stats.byImpact.map(impact => (
            <div key={impact.level} className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground capitalize">{impact.level} Impact</p>
                  <p className="text-2xl font-bold text-foreground">{impact.count}</p>
                </div>
                {getImpactIcon(impact.level)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Types</option>
          <option value="pricing">Pricing</option>
          <option value="features">Features</option>
          <option value="messaging">Messaging</option>
          <option value="product">Product</option>
          <option value="integration">Integration</option>
          <option value="other">Other</option>
        </select>

        <select
          value={selectedImpact}
          onChange={(e) => setSelectedImpact(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Impact Levels</option>
          <option value="high">High Impact</option>
          <option value="medium">Medium Impact</option>
          <option value="low">Low Impact</option>
        </select>

        {(selectedType || selectedImpact) && (
          <Button onClick={resetFilters} variant="outline" size="sm">
            Clear Filters
          </Button>
        )}
      </div>

      {/* Changes List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-border bg-background p-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : changes.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No changes detected yet</h3>
          <p className="text-muted-foreground">
            Changes will appear here when competitors update their websites.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {changes.map((change) => (
            <div
              key={change.id}
              className={`rounded-lg border p-6 transition-colors hover:bg-accent/10 ${getImpactColor(change.impactLevel)}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getImpactIcon(change.impactLevel)}
                  <div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {change.changeType}
                    </span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {formatDate(change.detectedAt)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{change.company.name}</p>
                  <p className="text-sm text-muted-foreground">{change.page.pageType}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-foreground">
                  {change.changeSummary}
                </h4>

                {(change.oldValue || change.newValue) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-background/50 rounded-md">
                    {change.oldValue && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Before:</p>
                        <p className="text-sm">{change.oldValue}</p>
                      </div>
                    )}
                    {change.newValue && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">After:</p>
                        <p className="text-sm font-medium">{change.newValue}</p>
                      </div>
                    )}
                  </div>
                )}

                {change.competitiveAnalysis && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-md border-l-4 border-blue-500">
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-400 mb-1">
                      Competitive Analysis
                    </p>
                    <p className="text-sm text-blue-900 dark:text-blue-300">
                      {change.competitiveAnalysis}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Confidence: {change.confidence}</span>
                  <a
                    href={change.page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View Page
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} changes
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.hasPrev}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.hasNext}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}