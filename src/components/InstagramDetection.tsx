"use client"

import * as React from "react"
import { Instagram, ExternalLink, MessageCircle, Calendar, Play, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface InstagramPost {
  caption: string;
  url: string;
  timestamp: string;
  commentsCount: number;
  latestComments: Array<{
    text: string;
  }>;
}

interface InstagramProfile {
  id: string;
  handle: string;
  url: string;
  companyId: string;
  companyName: string;
  lastChecked: string | null;
}

interface InstagramDetectionProps {
  companies?: Array<{ id: string; name: string }>;
}

export function InstagramDetection({ companies }: InstagramDetectionProps) {
  const [profiles, setProfiles] = React.useState<InstagramProfile[]>([]);
  const [scrapingData, setScrapingData] = React.useState<Record<string, InstagramPost[]>>({});
  const [loadingProfiles, setLoadingProfiles] = React.useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (companies) {
      fetchInstagramProfiles();
    }
  }, [companies]);

  const fetchInstagramProfiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!companies || companies.length === 0) {
        setProfiles([]);
        return;
      }

      const profilePromises = companies.map(async (company) => {
        try {
          const response = await fetch(`/api/instagram/handle/${company.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.handle) {
              return {
                id: `${company.id}-instagram`,
                handle: data.handle,
                url: data.url,
                companyId: company.id,
                companyName: company.name,
                lastChecked: data.lastChecked
              };
            }
          }
        } catch (error) {
          console.error(`Failed to fetch Instagram handle for ${company.name}:`, error);
        }
        return null;
      });

      const results = await Promise.all(profilePromises);
      const validProfiles = results.filter((profile): profile is InstagramProfile => profile !== null);
      setProfiles(validProfiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Instagram profiles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrapeProfile = async (profile: InstagramProfile) => {
    setLoadingProfiles(prev => ({ ...prev, [profile.id]: true }));
    
    try {
      const response = await fetch("/api/instagram/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: profile.companyId,
          instagramHandle: profile.handle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to scrape Instagram profile");
      }

      const result = await response.json();
      setScrapingData(prev => ({
        ...prev,
        [profile.id]: result.data || []
      }));

      // Update lastChecked for this profile
      setProfiles(prev => prev.map(p => 
        p.id === profile.id 
          ? { ...p, lastChecked: new Date().toISOString() }
          : p
      ));
    } catch (err) {
      console.error(`Failed to scrape ${profile.handle}:`, err);
      setError(err instanceof Error ? err.message : "Instagram scraping failed");
    } finally {
      setLoadingProfiles(prev => ({ ...prev, [profile.id]: false }));
    }
  };

  const handleScrapeAll = async () => {
    for (const profile of profiles) {
      await handleScrapeProfile(profile);
      // Add small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Instagram className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-medium text-foreground">Instagram Detection</h3>
        </div>
        <div className="rounded-lg border border-border bg-background p-6 text-center">
          <RefreshCw className="mx-auto h-8 w-8 text-muted-foreground animate-spin" />
          <p className="mt-2 text-sm text-muted-foreground">Loading Instagram profiles...</p>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Instagram className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-medium text-foreground">Instagram Detection</h3>
        </div>
        <div className="rounded-lg border border-dashed border-border bg-background p-6 text-center">
          <Instagram className="mx-auto h-8 w-8 text-muted-foreground" />
          <h4 className="mt-2 text-sm font-medium text-foreground">No Instagram profiles configured</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Go to the Dashboard to add Instagram handles for your competitors
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Instagram className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-medium text-foreground">Instagram Detection</h3>
          <span className="text-sm text-muted-foreground">({profiles.length} configured)</span>
        </div>
        <Button 
          onClick={handleScrapeAll}
          disabled={Object.values(loadingProfiles).some(loading => loading)}
        >
          <Play className="h-4 w-4 mr-2" />
          Scrape All
        </Button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4">
        {profiles.map((profile) => (
          <div key={profile.id} className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Instagram className="h-4 w-4 text-pink-500" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-foreground">@{profile.handle}</span>
                    <span className="text-sm text-muted-foreground">({profile.companyName})</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last checked: {formatDate(profile.lastChecked)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => handleScrapeProfile(profile)}
                  disabled={loadingProfiles[profile.id]}
                  size="sm"
                >
                  <Play className="h-3 w-3 mr-1" />
                  {loadingProfiles[profile.id] ? "Scraping..." : "Scrape Now"}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={profile.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Results */}
            {scrapingData[profile.id] && scrapingData[profile.id].length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">
                  Recent Posts ({scrapingData[profile.id].length})
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {scrapingData[profile.id].map((post, index) => (
                    <div key={index} className="bg-muted/30 rounded p-3 text-sm space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-foreground line-clamp-2 flex-1 mr-2">
                          {post.caption || 'No caption'}
                        </p>
                        {post.url && (
                          <Button variant="ghost" size="sm" asChild className="h-6 w-6 p-0">
                            <a href={post.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex items-center text-xs text-muted-foreground space-x-4">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(post.timestamp)}
                        </div>
                        <div className="flex items-center">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {post.commentsCount} comments
                        </div>
                      </div>
                      
                      {post.latestComments && post.latestComments.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Latest Comments:</p>
                          {post.latestComments.slice(0, 2).map((comment, commentIndex) => (
                            <div key={commentIndex} className="bg-background/50 rounded p-2">
                              <p className="text-xs text-foreground line-clamp-1">
                                {comment.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}