"use client"

import * as React from "react"
import { Plus, Search, Globe, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { detectSaasPages, validateSaasDomain, extractDomainFromUrl, type SaasPageType } from "@/lib/saas-detection"

interface AddCompetitorFormProps {
  onCompetitorAdded?: () => void
}

export function AddCompetitorForm({ onCompetitorAdded }: AddCompetitorFormProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    domain: "",
    name: "",
    selectedPages: [] as string[]
  })
  const [detectedPages, setDetectedPages] = React.useState<SaasPageType[]>([])
  const [isDetecting, setIsDetecting] = React.useState(false)
  const [detectionComplete, setDetectionComplete] = React.useState(false)
  const [error, setError] = React.useState("")


  const handleDomainDetection = async () => {
    if (!formData.domain.trim()) return
    
    const validation = validateSaasDomain(formData.domain)
    if (!validation.isValid) {
      setError(validation.error || "Invalid domain")
      return
    }

    setIsDetecting(true)
    setError("")
    
    try {
      const cleanDomain = extractDomainFromUrl(formData.domain)
      const result = await detectSaasPages(cleanDomain)
      
      setDetectedPages(result.pages)
      setDetectionComplete(true)
      
      // Auto-select high priority pages
      const autoSelected = result.pages
        .filter(page => page.priority === 1)
        .map(page => `${page.type}:${page.url}`)
      
      setFormData(prev => ({
        ...prev,
        selectedPages: autoSelected,
        name: prev.name || cleanDomain.split('.')[0]
      }))
    } catch {
      setError("Failed to detect SaaS pages. Please check the domain and try again.")
    } finally {
      setIsDetecting(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.domain.trim()) {
      setError("Please enter a competitor domain")
      return
    }

    const validation = validateSaasDomain(formData.domain)
    if (!validation.isValid) {
      setError(validation.error || "Invalid domain")
      return
    }

    if (!formData.name.trim()) {
      setError("Please enter a name for this competitor")
      return
    }


    if (formData.selectedPages.length === 0) {
      setError("Please select at least one page to monitor")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/competitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: extractDomainFromUrl(formData.domain),
          name: formData.name,
          selectedPages: formData.selectedPages,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add competitor")
      }

      // Reset form and close dialog
      setFormData({ domain: "", name: "", selectedPages: [] })
      setDetectedPages([])
      setDetectionComplete(false)
      setIsOpen(false)
      onCompetitorAdded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  const togglePageSelection = (pageKey: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPages: prev.selectedPages.includes(pageKey)
        ? prev.selectedPages.filter(p => p !== pageKey)
        : [...prev.selectedPages, pageKey]
    }))
  }


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
        <Plus className="mr-2 h-4 w-4" />
        Add Competitor
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add SaaS Competitor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Domain Input */}
          <div className="space-y-2">
            <Label htmlFor="domain">Competitor Domain</Label>
            <div className="flex space-x-2">
              <Input
                id="domain"
                placeholder="competitor.com"
                value={formData.domain}
                onChange={(e) => handleInputChange("domain", e.target.value)}
                disabled={isLoading || isDetecting}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleDomainDetection}
                disabled={isLoading || isDetecting || !formData.domain.trim()}
              >
                {isDetecting ? (
                  <Search className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Detected Pages */}
          {detectionComplete && detectedPages.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <Label>Detected SaaS Pages ({detectedPages.length} found)</Label>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {detectedPages.map((page, index) => {
                  const pageKey = `${page.type}:${page.url}`
                  const isSelected = formData.selectedPages.includes(pageKey)
                  const priorityColor = page.priority === 1 ? 'text-green-600' : page.priority === 2 ? 'text-yellow-600' : 'text-gray-500'
                  
                  return (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 p-2 rounded border ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={`page-${index}`}
                        checked={isSelected}
                        onChange={() => togglePageSelection(pageKey)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium capitalize">{page.type}</span>
                          <span className={`text-xs ${priorityColor}`}>
                            {page.priority === 1 ? 'High' : page.priority === 2 ? 'Medium' : 'Low'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{page.url}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Competitor Name</Label>
            <Input
              id="name"
              placeholder="Competitor Inc."
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isDetecting}>
              {isLoading ? "Adding Competitor..." : "Add Competitor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}