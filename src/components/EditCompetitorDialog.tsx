"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, Pause, Play, ExternalLink } from "lucide-react"

interface MonitoredPage {
  id: string
  url: string
  pageType: string
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

interface EditCompetitorDialogProps {
  company: Company | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompetitorUpdated: () => void
}

const pageTypeOptions = [
  { value: "pricing", label: "Pricing" },
  { value: "features", label: "Features" },
  { value: "homepage", label: "Homepage" },
  { value: "about", label: "About" },
  { value: "blog", label: "Blog" },
  { value: "custom", label: "Custom" },
]


export function EditCompetitorDialog({ 
  company, 
  open, 
  onOpenChange, 
  onCompetitorUpdated 
}: EditCompetitorDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [name, setName] = React.useState("")
  const [isMonitoringActive, setIsMonitoringActive] = React.useState(true)
  const [pages, setPages] = React.useState<MonitoredPage[]>([])
  const [newPageUrl, setNewPageUrl] = React.useState("")
  const [newPageType, setNewPageType] = React.useState("")
  const [isAddingPage, setIsAddingPage] = React.useState(false)

  React.useEffect(() => {
    if (company) {
      setName(company.name)
      setPages(company.pages)
      // Determine if monitoring is active based on whether any pages are active
      setIsMonitoringActive(company.pages.some(page => page.isActive))
    }
  }, [company])

  const handleSaveBasicInfo = async () => {
    if (!company) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/competitors/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name,
          isMonitoringActive 
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update competitor")
      }

      onCompetitorUpdated()
    } catch (error) {
      console.error("Error updating competitor:", error)
      alert("Failed to update competitor. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddPage = async () => {
    if (!company || !newPageUrl || !newPageType) return

    setIsAddingPage(true)
    try {
      const response = await fetch(`/api/competitors/${company.id}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newPageUrl,
          pageType: newPageType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add page")
      }

      const newPage = await response.json()
      setPages(prev => [...prev, newPage])
      setNewPageUrl("")
      setNewPageType("")
      onCompetitorUpdated()
    } catch (error) {
      console.error("Error adding page:", error)
      alert(error instanceof Error ? error.message : "Failed to add page. Please try again.")
    } finally {
      setIsAddingPage(false)
    }
  }

  const handleDeletePage = async (pageId: string) => {
    if (!company) return

    try {
      const response = await fetch(`/api/competitors/${company.id}/pages/${pageId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete page")
      }

      setPages(prev => prev.filter(page => page.id !== pageId))
      onCompetitorUpdated()
    } catch (error) {
      console.error("Error deleting page:", error)
      alert("Failed to delete page. Please try again.")
    }
  }



  if (!company) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Competitor</DialogTitle>
          <DialogDescription>
            Modify competitor details and manage monitored pages
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Competitor Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={company.domain}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant={isMonitoringActive ? "destructive" : "default"}
                size="sm"
                onClick={() => setIsMonitoringActive(!isMonitoringActive)}
                className="flex items-center space-x-2"
              >
                {isMonitoringActive ? (
                  <>
                    <Pause className="h-4 w-4" />
                    <span>Pause Monitoring</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>Resume Monitoring</span>
                  </>
                )}
              </Button>
              
              <span className="text-sm text-muted-foreground">
                {isMonitoringActive ? "Currently monitoring" : "Monitoring paused"}
              </span>
            </div>

            <Button onClick={handleSaveBasicInfo} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {/* Pages Management Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Monitored Pages ({pages.length})</h3>
            
            {/* Add New Page */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Add New Page</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Enter page URL"
                  value={newPageUrl}
                  onChange={(e) => setNewPageUrl(e.target.value)}
                />
                
                <Select value={newPageType} onValueChange={setNewPageType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Page type" />
                  </SelectTrigger>
                  <SelectContent>
                    {pageTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={handleAddPage} 
                  disabled={!newPageUrl || !newPageType || isAddingPage}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isAddingPage ? "Adding..." : "Add Page"}</span>
                </Button>
              </div>
            </div>

            {/* Existing Pages */}
            <div className="space-y-2">
              {pages.map((page) => (
                <div key={page.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-sm">{page.pageType}</span>
                      {!page.isActive && (
                        <span className="text-xs px-2 py-1 rounded-full font-medium text-gray-500 bg-gray-100 dark:bg-gray-800">
                          Paused
                        </span>
                      )}
                    </div>
                    
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-1 truncate"
                    >
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{page.url}</span>
                    </a>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePage(page.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {pages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No pages are currently being monitored for this competitor.
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}