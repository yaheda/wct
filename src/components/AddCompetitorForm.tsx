"use client"

import * as React from "react"
import { Plus, Search, Globe, CheckCircle2, X, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SimpleSelect as Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { detectSaasPages, validateSaasDomain, extractDomainFromUrl, validateCustomPageUrl, createCustomPage, type SaasPageType, type CustomPageInput } from "@/lib/saas-detection"

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
  const [customPages, setCustomPages] = React.useState<SaasPageType[]>([])
  const [isDetecting, setIsDetecting] = React.useState(false)
  const [detectionComplete, setDetectionComplete] = React.useState(false)
  const [customPageInput, setCustomPageInput] = React.useState<CustomPageInput>({
    url: '',
    type: 'custom',
    label: ''
  })
  const [customPageError, setCustomPageError] = React.useState('')
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
      
      // Auto-select all detected pages
      const autoSelected = result.pages
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
      setCustomPages([])
      setDetectionComplete(false)
      setCustomPageInput({ url: '', type: 'custom', label: '' })
      setCustomPageError('')
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

  const handleAddCustomPage = () => {
    if (!formData.domain) {
      setCustomPageError('Please enter a domain first')
      return
    }

    const validation = validateCustomPageUrl(customPageInput.url, formData.domain)
    if (!validation.isValid) {
      setCustomPageError(validation.error || 'Invalid URL')
      return
    }

    // Check if this URL is already added
    const allPages = [...detectedPages, ...customPages]
    const customPageUrl = createCustomPage(customPageInput, formData.domain).url
    const isDuplicate = allPages.some(page => page.url === customPageUrl)
    
    if (isDuplicate) {
      setCustomPageError('This URL is already being monitored')
      return
    }

    // Create and add the custom page
    const newCustomPage = createCustomPage(customPageInput, formData.domain)
    setCustomPages(prev => [...prev, newCustomPage])
    
    // Auto-select the newly added page
    const pageKey = `${newCustomPage.type}:${newCustomPage.url}`
    setFormData(prev => ({
      ...prev,
      selectedPages: [...prev.selectedPages, pageKey]
    }))

    // Reset custom page input
    setCustomPageInput({ url: '', type: 'custom', label: '' })
    setCustomPageError('')
  }

  const handleRemoveCustomPage = (pageToRemove: SaasPageType) => {
    setCustomPages(prev => prev.filter(page => page.url !== pageToRemove.url))
    
    // Also remove from selected pages
    const pageKey = `${pageToRemove.type}:${pageToRemove.url}`
    setFormData(prev => ({
      ...prev,
      selectedPages: prev.selectedPages.filter(p => p !== pageKey)
    }))
  }

  const handleCustomPageInputChange = (field: keyof CustomPageInput, value: string) => {
    setCustomPageInput(prev => ({ ...prev, [field]: value }))
    if (customPageError) setCustomPageError('')
  }


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
        <Plus className="mr-2 h-4 w-4" />
        Add Competitor
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full mx-4">
        <DialogHeader>
          <DialogTitle>Add SaaS Competitor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Core Form Elements */}
            <div className="space-y-6">
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
            </div>

            {/* Right Column - Custom Pages Management */}
            <div className="space-y-6 lg:pl-6 lg:border-l border-border">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-lg font-medium">Custom Pages</Label>
                  <span className="text-sm text-muted-foreground">
                    ({customPages.length} added)
                  </span>
                </div>
                
                {/* Custom Pages Display */}
                {customPages.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {customPages.map((page, index) => {
                      const pageKey = `${page.type}:${page.url}`
                      const isSelected = formData.selectedPages.includes(pageKey)
                      
                      return (
                        <div
                          key={`custom-${index}`}
                          className={`flex items-center space-x-3 p-2 rounded border-2 border-dashed ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-muted'
                          }`}
                        >
                          <input
                            type="checkbox"
                            id={`custom-page-${index}`}
                            checked={isSelected}
                            onChange={() => togglePageSelection(pageKey)}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium capitalize">{page.label || page.type}</span>
                              <span className="text-xs text-muted-foreground">(Custom)</span>
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{page.url}</div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCustomPage(page)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Manual Page Addition */}
                {formData.domain && (
                  <div className="space-y-3">
                    <Label>Add Custom Page</Label>
                    <div className="space-y-3 p-4 border rounded-md bg-muted/10">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="custom-url" className="text-xs">Page URL</Label>
                          <Input
                            id="custom-url"
                            placeholder="/custom-page or full URL"
                            value={customPageInput.url}
                            onChange={(e) => handleCustomPageInputChange('url', e.target.value)}
                            disabled={isLoading}
                            className="h-8"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor="custom-type" className="text-xs">Page Type</Label>
                            <Select
                              value={customPageInput.type}
                              onChange={(e) => handleCustomPageInputChange('type', e.target.value)}
                              disabled={isLoading}
                            >
                              <option value="pricing">Pricing</option>
                              <option value="features">Features</option>
                              <option value="blog">Blog</option>
                              <option value="about">About</option>
                              <option value="homepage">Homepage</option>
                              <option value="custom">Custom</option>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="custom-label" className="text-xs">Custom Label</Label>
                            <Input
                              id="custom-label"
                              placeholder="Optional label"
                              value={customPageInput.label}
                              onChange={(e) => handleCustomPageInputChange('label', e.target.value)}
                              disabled={isLoading}
                              className="h-8"
                            />
                          </div>
                        </div>
                      </div>

                      {customPageError && (
                        <div className="text-xs text-destructive">{customPageError}</div>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCustomPage}
                        disabled={isLoading || !customPageInput.url.trim()}
                        className="w-full"
                      >
                        <Link className="h-3 w-3 mr-1" />
                        Add Page
                      </Button>
                    </div>
                  </div>
                )}

                {!formData.domain && (
                  <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed border-muted rounded-md">
                    Enter a domain above to add custom pages
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message and Actions - Full Width */}
          <div className="space-y-4 pt-4 border-t border-border">
            {error && (
              <div className="text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2">
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}