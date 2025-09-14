import { ApifyClient } from 'apify-client';

interface InstagramPost {
  caption: string;
  url: string;
  timestamp: string;
  commentsCount: number;
  latestComments: Array<{
    text: string;
  }>;
}

interface InstagramScrapingResult {
  success: boolean;
  data?: InstagramPost[];
  error?: string;
}

export class InstagramScraper {
  private client: ApifyClient;

  constructor() {
    if (!process.env.APIFY_API_TOKEN) {
      throw new Error('APIFY_API_TOKEN environment variable is required');
    }
    this.client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });
  }

  async scrapeInstagramProfile(username: string): Promise<InstagramScrapingResult> {
    try {
      const input = {
        //usernames: [username],
        directUrls: [
          `https://www.instagram.com/${username}/`
        ],
        resultsType: "posts",
        resultsLimit: 10,
        addParentData: false
      };

      const run = await this.client.actor('apify/instagram-scraper').call(input);
      
      if (!run.defaultDatasetId) {
        return {
          success: false,
          error: 'No dataset ID returned from Apify run'
        };
      }

      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      
      const processedData = this.processScrapedData(items);

      return {
        success: true,
        data: processedData
      };
    } catch (error) {
      console.error('Instagram scraping failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private processScrapedData(items: Record<string, unknown>[]): InstagramPost[] {
    return items.map((item: Record<string, unknown>) => ({
      caption: (item.caption as string) || '',
      url: (item.url as string) || '',
      timestamp: (item.timestamp as string) || new Date().toISOString(),
      commentsCount: (item.commentsCount as number) || 0,
      latestComments: ((item.latestComments as Record<string, unknown>[]) || []).map((comment: Record<string, unknown>) => ({
        text: (comment.text as string) || (comment.comment as string) || ''
      }))
    }));
  }
}