"use client"

import * as React from "react"
import { Trash2, ExternalLink, Clock, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Website {
  id: string
  url: string
  name: string
  checkInterval: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface WebsiteListProps {
  websites: Website[]
  onWebsiteDeleted?: (id: string) => void
  onRefresh?: () => void
}

export function WebsiteList({ websites, onWebsiteDeleted, onRefresh }: WebsiteListProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to stop monitoring "${name}"?`)) {
      return
    }

    setDeletingId(id)

    try {
      const response = await fetch(`/api/websites/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete website")
      }

      onWebsiteDeleted?.(id)
      onRefresh?.()
    } catch (error) {
      console.error("Error deleting website:", error)
      alert("Failed to delete website. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  const getFrequencyText = (checkInterval: number) => {
    return checkInterval === 1440 ? "Daily" : "Weekly"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (websites.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <Globe className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium text-foreground">No monitors yet</h3>
        <p className="mt-2 text-muted-foreground">
          Get started by creating your first website monitor.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">
          Monitored Websites ({websites.length})
        </h2>
      </div>

      <div className="grid gap-4">
        {websites.map((website) => (
          <div
            key={website.id}
            className="rounded-lg border border-border bg-background p-6 transition-colors hover:bg-accent/10"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-medium text-foreground truncate">
                    {website.name}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      website.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {website.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                
                <div className="mt-1 flex items-center space-x-4 text-sm text-muted-foreground">
                  <a
                    href={website.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    <span className="truncate">{website.url}</span>
                  </a>
                  
                  <div className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>{getFrequencyText(website.checkInterval)}</span>
                  </div>
                </div>
                
                <p className="mt-2 text-xs text-muted-foreground">
                  Added {formatDate(website.createdAt)}
                </p>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(website.id, website.name)}
                  disabled={deletingId === website.id}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingId === website.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}