"use client"

import * as React from "react"
import { Trash2, ExternalLink, Globe, Target } from "lucide-react"
import { Button } from "@/components/ui/button"

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

interface CompetitorListProps {
  websites: Company[] // Keep as 'websites' for compatibility with parent component
  onWebsiteDeleted?: (id: string) => void
  onRefresh?: () => void
}

export function CompetitorList({ websites: companies, onWebsiteDeleted, onRefresh }: CompetitorListProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to stop monitoring competitor "${name}"?`)) {
      return
    }

    setDeletingId(id)

    try {
      const response = await fetch(`/api/competitors/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete competitor")
      }

      onWebsiteDeleted?.(id)
      onRefresh?.()
    } catch (error) {
      console.error("Error deleting competitor:", error)
      alert("Failed to delete competitor. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1: return { text: "High", color: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400" }
      case 2: return { text: "Medium", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400" }
      case 3: return { text: "Low", color: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400" }
      default: return { text: "Medium", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400" }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (companies.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <Globe className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium text-foreground">No competitors yet</h3>
        <p className="mt-2 text-muted-foreground">
          Get started by adding your first SaaS competitor to monitor.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">
          Tracked Competitors ({companies.length})
        </h2>
      </div>

      <div className="grid gap-4">
        {companies.map((company) => (
          <div
            key={company.id}
            className="rounded-lg border border-border bg-background p-6 transition-colors hover:bg-accent/10"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-base font-medium text-foreground truncate">
                    {company.name}
                  </h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    {company._count.changes} changes
                  </span>
                </div>
                
                <div className="mt-1 flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                  <a
                    href={`https://${company.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    <span className="truncate">{company.domain}</span>
                  </a>
                  
                  <div className="flex items-center">
                    <Target className="mr-1 h-3 w-3" />
                    <span>{company.pages.length} pages monitored</span>
                  </div>
                </div>

                {/* Monitored Pages */}
                <div className="mt-3 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Monitored Pages:</div>
                  <div className="flex flex-wrap gap-1">
                    {company.pages.slice(0, 4).map((page, index) => {
                      const priority = getPriorityText(page.priority)
                      return (
                        <span
                          key={index}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${priority.color}`}
                        >
                          {page.pageType}
                        </span>
                      )
                    })}
                    {company.pages.length > 4 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        +{company.pages.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="mt-2 text-xs text-muted-foreground">
                  Added {formatDate(company.createdAt)}
                </p>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(company.id, company.name)}
                  disabled={deletingId === company.id}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingId === company.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}