import CryptoJS from 'crypto-js'

export interface ProcessedContent {
  contentHash: string
  cleanedText: string
  extractedData: {
    pricing?: PricingData[]
    features?: FeatureData[]
    headlines?: string[]
    metadata: {
      wordCount: number
      lastModified?: string
      language: string
    }
  }
}

export interface PricingData {
  plan: string
  price: string
  billing: string // monthly, yearly, one-time
  currency: string
  features: string[]
}

export interface FeatureData {
  title: string
  description: string
  category?: string
}

class ContentProcessor {
  
  generateContentHash(content: string): string {
    return CryptoJS.SHA256(content).toString()
  }

  cleanTextContent(textContent: string): string {
    return textContent
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove timestamp patterns
      .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '')
      .replace(/\b\d{1,2}-\d{1,2}-\d{2,4}\b/g, '')
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
      // Remove time patterns
      .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\b/gi, '')
      // Remove view counts and social metrics
      .replace(/\b\d+(?:,\d{3})*\s*(?:views?|likes?|shares?|followers?)\b/gi, '')
      // Remove "updated" or "posted" timestamps
      .replace(/(?:updated|posted|published|modified|last\s+updated)[\s:]*\d+/gi, '')
      // Remove cookie and privacy notices (common patterns)
      .replace(/(?:this\s+site\s+uses?\s+cookies?|accept\s+(?:all\s+)?cookies?|privacy\s+policy|cookie\s+settings)/gi, '')
      // Remove loading states and temporary messages
      .replace(/\b(?:loading\.{3}|please\s+wait\.{3}|loading\s+content)\b/gi, '')
      .trim()
  }

  extractPricingData(textContent: string): PricingData[] {
    const pricing: PricingData[] = []
    
    // Regex patterns for pricing
    const pricePatterns = [
      // $99/mo, $99/month, $999/year
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*\/\s*(mo|month|yr|year|annually|monthly)/gi,
      // $99 per month, $99 per year
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s+per\s+(month|year)/gi,
      // Free, Trial, Demo
      /(free|trial|demo|contact\s+(?:us|sales)|custom|enterprise)/gi
    ]

    // Note: Plan pattern matching could be added here in the future

    // Extract pricing information
    let match
    for (const pattern of pricePatterns) {
      pattern.lastIndex = 0 // Reset regex
      while ((match = pattern.exec(textContent)) !== null) {
        const price = match[1] || match[0]
        const billing = match[2] || 'unknown'
        
        pricing.push({
          plan: 'Unknown Plan',
          price: price,
          billing: billing.toLowerCase(),
          currency: 'USD', // Default, could be enhanced
          features: []
        })
      }
    }

    return pricing
  }

  extractFeatureData(textContent: string): FeatureData[] {
    const features: FeatureData[] = []
    
    // Look for common feature list patterns
    const featurePatterns = [
      // Bullet points or lists
      /^[\s]*[•·▪▫◦‣⁃]\s*(.+)$/gm,
      /^[\s]*[-*]\s*(.+)$/gm,
      // Numbered lists
      /^\d+\.\s*(.+)$/gm,
      // Feature: Description patterns
      /([A-Z][^:]+):\s*([^.\n]+)/g
    ]

    let match
    for (const pattern of featurePatterns) {
      pattern.lastIndex = 0
      while ((match = pattern.exec(textContent)) !== null) {
        const text = match[1]?.trim()
        if (text && text.length > 10 && text.length < 200) {
          features.push({
            title: text.split(':')[0]?.trim() || text,
            description: text.includes(':') ? text.split(':')[1]?.trim() || '' : text,
          })
        }
      }
    }

    return features.slice(0, 20) // Limit to avoid noise
  }

  extractHeadlines(content: string, textContent: string): string[] {
    const headlines: string[] = []
    
    // Extract from HTML headers
    const headerMatches = content.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi)
    if (headerMatches) {
      for (const match of headerMatches) {
        const text = match.replace(/<[^>]+>/g, '').trim()
        if (text.length > 5 && text.length < 200) {
          headlines.push(text)
        }
      }
    }

    // Extract potential headlines from text (lines that look like titles)
    const textLines = textContent.split('\n')
    for (const line of textLines.slice(0, 50)) { // Only check first 50 lines
      const trimmed = line.trim()
      // Look for title-like patterns: not too long, proper case, not too short
      if (trimmed.length > 10 && trimmed.length < 100 && 
          /^[A-Z]/.test(trimmed) && 
          !trimmed.includes('.') &&
          trimmed.split(' ').length < 15) {
        headlines.push(trimmed)
      }
    }

    return [...new Set(headlines)].slice(0, 10) // Remove duplicates and limit
  }

  extractMetadata(textContent: string): { wordCount: number; language: string } {
    const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length
    
    // Simple language detection (could be enhanced)
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as']
    const words = textContent.toLowerCase().split(/\s+/)
    const englishWordCount = words.filter(word => englishWords.includes(word)).length
    const englishRatio = englishWordCount / Math.min(words.length, 100) // Check first 100 words

    const language = englishRatio > 0.1 ? 'en' : 'unknown'

    return { wordCount, language }
  }

  async processContent(content: string, textContent: string): Promise<ProcessedContent> {
    const contentHash = this.generateContentHash(content)
    const cleanedText = this.cleanTextContent(textContent)
    
    // Extract structured data
    const pricing = this.extractPricingData(cleanedText)
    const features = this.extractFeatureData(cleanedText)
    const headlines = this.extractHeadlines(content, cleanedText)
    const metadata = this.extractMetadata(cleanedText)

    return {
      contentHash,
      cleanedText,
      extractedData: {
        pricing,
        features,
        headlines,
        metadata
      }
    }
  }

  // Compare two processed contents to identify what changed
  compareContent(oldContent: ProcessedContent, newContent: ProcessedContent): {
    hasChanged: boolean
    changes: {
      pricing?: { added: PricingData[], removed: PricingData[], modified: PricingData[] }
      features?: { added: FeatureData[], removed: FeatureData[] }
      headlines?: { added: string[], removed: string[] }
      textSimilarity: number
    }
  } {
    const hasChanged = oldContent.contentHash !== newContent.contentHash

    if (!hasChanged) {
      return {
        hasChanged: false,
        changes: { textSimilarity: 1.0 }
      }
    }

    // Calculate text similarity (simple approach)
    const textSimilarity = this.calculateTextSimilarity(
      oldContent.cleanedText, 
      newContent.cleanedText
    )

    // Compare pricing
    const pricingChanges = this.comparePricing(
      oldContent.extractedData.pricing || [],
      newContent.extractedData.pricing || []
    )

    // Compare features
    const featureChanges = this.compareFeatures(
      oldContent.extractedData.features || [],
      newContent.extractedData.features || []
    )

    // Compare headlines
    const headlineChanges = this.compareHeadlines(
      oldContent.extractedData.headlines || [],
      newContent.extractedData.headlines || []
    )

    return {
      hasChanged: true,
      changes: {
        pricing: pricingChanges,
        features: featureChanges,
        headlines: headlineChanges,
        textSimilarity
      }
    }
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple word-based similarity calculation
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return union.size > 0 ? intersection.size / union.size : 1.0
  }

  private comparePricing(oldPricing: PricingData[], newPricing: PricingData[]): {
    added: PricingData[]
    removed: PricingData[]
    modified: PricingData[]
  } {
    const added = newPricing.filter(newPrice => 
      !oldPricing.some(oldPrice => 
        oldPrice.plan === newPrice.plan && oldPrice.price === newPrice.price
      )
    )

    const removed = oldPricing.filter(oldPrice => 
      !newPricing.some(newPrice => 
        oldPrice.plan === newPrice.plan
      )
    )

    const modified = newPricing.filter(newPrice => 
      oldPricing.some(oldPrice => 
        oldPrice.plan === newPrice.plan && oldPrice.price !== newPrice.price
      )
    )

    return { added, removed, modified }
  }

  private compareFeatures(oldFeatures: FeatureData[], newFeatures: FeatureData[]): {
    added: FeatureData[]
    removed: FeatureData[]
  } {
    const added = newFeatures.filter(newFeature =>
      !oldFeatures.some(oldFeature => 
        oldFeature.title.toLowerCase() === newFeature.title.toLowerCase()
      )
    )

    const removed = oldFeatures.filter(oldFeature =>
      !newFeatures.some(newFeature => 
        oldFeature.title.toLowerCase() === newFeature.title.toLowerCase()
      )
    )

    return { added, removed }
  }

  private compareHeadlines(oldHeadlines: string[], newHeadlines: string[]): {
    added: string[]
    removed: string[]
  } {
    const added = newHeadlines.filter(newHeadline =>
      !oldHeadlines.some(oldHeadline => 
        oldHeadline.toLowerCase() === newHeadline.toLowerCase()
      )
    )

    const removed = oldHeadlines.filter(oldHeadline =>
      !newHeadlines.some(newHeadline => 
        oldHeadline.toLowerCase() === newHeadline.toLowerCase()
      )
    )

    return { added, removed }
  }
}

export const contentProcessor = new ContentProcessor()