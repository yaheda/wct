"use client"

import * as React from "react"
import { Instagram, Check, X, Edit2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CompetitorInstagramSetupProps {
  companyId: string;
  companyName: string;
}

export function CompetitorInstagramSetup({ companyId, companyName }: CompetitorInstagramSetupProps) {
  const [instagramHandle, setInstagramHandle] = React.useState("");
  const [savedHandle, setSavedHandle] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  // Load existing Instagram handle on component mount
  React.useEffect(() => {
    fetchInstagramHandle();
  }, [companyId]);

  const fetchInstagramHandle = async () => {
    try {
      const response = await fetch(`/api/instagram/handle/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.handle) {
          setSavedHandle(data.handle);
        }
      }
    } catch (error) {
      console.error('Failed to fetch Instagram handle:', error);
    }
  };

  const handleSaveHandle = async () => {
    if (!instagramHandle.trim()) {
      setError("Please enter an Instagram handle");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requestData = {
        companyId,
        instagramHandle: instagramHandle.replace("@", "").trim(),
      };
      console.log('Frontend - Sending Instagram handle request:', requestData);

      const response = await fetch("/api/instagram/handle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log('Frontend - Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Frontend - Error response:', errorData);
        throw new Error(errorData.error || "Failed to save Instagram handle");
      }

      const result = await response.json();
      setSavedHandle(result.handle);
      setInstagramHandle("");
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Instagram handle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setInstagramHandle(savedHandle || "");
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setInstagramHandle("");
    setIsEditing(false);
    setError(null);
  };

  const toggleSection = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      {/* Instagram Setup Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <div className="flex items-center space-x-2">
          <Instagram className="h-4 w-4 text-pink-500" />
          <span className="text-sm font-medium text-foreground">Instagram</span>
          {savedHandle && (
            <span className="text-xs text-muted-foreground">
              @{savedHandle}
            </span>
          )}
          {savedHandle && (
            <div className="flex items-center text-xs text-green-600">
              <Check className="h-3 w-3 mr-1" />
              Configured
            </div>
          )}
        </div>
        {isCollapsed ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Instagram Setup Content (collapsible) */}
      {!isCollapsed && (
        <div className="mt-3 space-y-3">
          {!savedHandle && !isEditing && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Add an Instagram handle to monitor social media activity for {companyName}
              </p>
              <Button 
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="outline"
                className="h-8"
              >
                <Instagram className="h-3 w-3 mr-1" />
                Add Instagram Handle
              </Button>
            </div>
          )}

          {savedHandle && !isEditing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-foreground">@{savedHandle}</span>
                  <div className="flex items-center text-xs text-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    Ready for scraping
                  </div>
                </div>
                <Button 
                  onClick={handleEdit}
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Go to Detection page to scrape posts and comments
              </p>
            </div>
          )}

          {isEditing && (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  placeholder="instagram_handle (without @)"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  disabled={isLoading}
                  className="h-8 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveHandle();
                    } else if (e.key === 'Escape') {
                      handleCancel();
                    }
                  }}
                />
                <Button 
                  onClick={handleSaveHandle}
                  disabled={isLoading || !instagramHandle.trim()}
                  size="sm"
                  className="h-8"
                >
                  <Check className="h-3 w-3 mr-1" />
                  {isLoading ? "Saving..." : "Save"}
                </Button>
                <Button 
                  onClick={handleCancel}
                  size="sm"
                  variant="ghost"
                  className="h-8"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {error && (
                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}