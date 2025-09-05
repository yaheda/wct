import { ProcessedContent } from './content-processor'
import { LLMProviderFactory, LLMProviderConfig } from './llm-providers'

export interface ChangeDetectionResult {
  hasSignificantChange: boolean
  changeType: 'pricing' | 'features' | 'messaging' | 'product' | 'integration' | 'other'
  changeSummary: string
  details: {
    oldValue?: string
    newValue?: string
    impactLevel: 'high' | 'medium' | 'low'
  }
  confidence: 'high' | 'medium' | 'low'
  competitiveAnalysis?: string
  rawLLMResponse?: Record<string, unknown>
  llmProvider?: string
}

export interface LLMProvider {
  name: string
  analyzeChange(prompt: string): Promise<Record<string, unknown>>
}

export interface TestModeOptions {
  enabled: boolean
  llmProvider?: Partial<LLMProviderConfig>
  useRealLLM?: boolean
}


class ChangeDetector {
  private llmProvider: LLMProvider
  private testModeOptions: TestModeOptions = { enabled: false }

  constructor(llmProvider?: LLMProvider) {
    this.llmProvider = llmProvider || LLMProviderFactory.createProvider()
  }

  setTestMode(enabled: boolean, options?: Omit<TestModeOptions, 'enabled'>) {
    this.testModeOptions = {
      enabled,
      ...options
    }
    
    // If test mode is enabled and options specify using real LLM or custom provider
    if (enabled && (options?.useRealLLM || options?.llmProvider)) {
      try {
        const provider = LLMProviderFactory.createProvider(options?.llmProvider)
        this.llmProvider = provider
        console.log(`Test mode enabled with ${provider.name} provider`)
      } catch (error) {
        console.warn(`Failed to create test LLM provider, falling back to default:`, error)
      }
    } else if (enabled && !options?.useRealLLM) {
      // Use enhanced mock provider for traditional test mode
      this.llmProvider = LLMProviderFactory.createProvider({ provider: 'mock' })
    }
  }

  setLLMProvider(provider: LLMProvider) {
    this.llmProvider = provider
  }

  getTestModeOptions(): TestModeOptions {
    return this.testModeOptions
  }

  private generateSaaSPrompt(
    competitorName: string,
    pageType: string,
    oldContent: ProcessedContent,
    newContent: ProcessedContent
  ): string {
    return `You are a SaaS competitive intelligence expert. Analyze these webpage contents for meaningful business changes.

COMPETITOR: ${competitorName}
PAGE TYPE: ${pageType}
TEXT SIMILARITY: ${(oldContent.extractedData.metadata.wordCount / newContent.extractedData.metadata.wordCount * 100).toFixed(1)}%

OLD CONTENT SNAPSHOT:
Headlines: ${oldContent.extractedData.headlines?.slice(0, 3).join(', ') || 'None'}
Pricing: ${oldContent.extractedData.pricing?.map(p => `${p.plan}: ${p.price}/${p.billing}`).join(', ') || 'None detected'}
Features: ${oldContent.extractedData.features?.slice(0, 5).map(f => f.title).join(', ') || 'None detected'}
Content Preview: ${oldContent.cleanedText.substring(0, 500)}...

NEW CONTENT SNAPSHOT:
Headlines: ${newContent.extractedData.headlines?.slice(0, 3).join(', ') || 'None'}
Pricing: ${newContent.extractedData.pricing?.map(p => `${p.plan}: ${p.price}/${p.billing}`).join(', ') || 'None detected'}
Features: ${newContent.extractedData.features?.slice(0, 5).map(f => f.title).join(', ') || 'None detected'}
Content Preview: ${newContent.cleanedText.substring(0, 500)}...

ANALYSIS FOCUS:
- Pricing changes (plans, amounts, billing terms, feature inclusions)
- New feature announcements or removals
- Product positioning and messaging changes
- Integration announcements
- Security/compliance updates

Respond with JSON:
{
  "hasSignificantChange": boolean,
  "changeType": "pricing|features|messaging|product|integration|other",
  "changeSummary": "specific, actionable summary under 80 chars",
  "details": {
    "oldValue": "before state if applicable",
    "newValue": "after state if applicable", 
    "impactLevel": "high|medium|low"
  },
  "confidence": "high|medium|low",
  "competitiveAnalysis": "brief competitive implications (optional)"
}`
  }

  async detectChanges(
    competitorName: string,
    pageType: string,
    oldContent: ProcessedContent,
    newContent: ProcessedContent
  ): Promise<ChangeDetectionResult> {
    // Quick hash comparison - if identical, no need for LLM analysis
    if (oldContent.contentHash === newContent.contentHash) {
      return {
        hasSignificantChange: false,
        changeType: 'other',
        changeSummary: 'No changes detected',
        details: {
          impactLevel: 'low'
        },
        confidence: 'high'
      }
    }

    // Calculate similarity for analysis but don't filter based on it
    const textSimilarity = this.calculateTextSimilarity(oldContent.cleanedText, newContent.cleanedText)

    try {
      const prompt = this.generateSaaSPrompt(competitorName, pageType, oldContent, newContent)
      const llmResponse = await this.llmProvider.analyzeChange(prompt)

      // Parse LLM response
      let analysisResult: Record<string, unknown>
      if (typeof llmResponse === 'string') {
        try {
          analysisResult = JSON.parse(llmResponse)
        } catch {
          // If parsing fails, create a basic response
          analysisResult = {
            hasSignificantChange: true, // Always report changes when we detect them
            changeType: this.inferChangeType(pageType, oldContent, newContent),
            changeSummary: 'Content changes detected via text analysis',
            details: { impactLevel: 'medium' },
            confidence: 'low'
          }
        }
      } else {
        analysisResult = llmResponse
      }

      return {
        hasSignificantChange: Boolean(analysisResult.hasSignificantChange),
        changeType: (analysisResult.changeType as ChangeDetectionResult['changeType']) || 'other',
        changeSummary: String(analysisResult.changeSummary || 'Changes detected'),
        details: {
          oldValue: (analysisResult.details as Record<string, unknown>)?.oldValue as string | undefined,
          newValue: (analysisResult.details as Record<string, unknown>)?.newValue as string | undefined,
          impactLevel: ((analysisResult.details as Record<string, unknown>)?.impactLevel as 'high' | 'medium' | 'low') || 'medium'
        },
        confidence: (analysisResult.confidence as ChangeDetectionResult['confidence']) || 'medium',
        competitiveAnalysis: analysisResult.competitiveAnalysis as string,
        rawLLMResponse: this.testModeOptions.enabled ? llmResponse : undefined,
        llmProvider: this.testModeOptions.enabled ? this.llmProvider.name : undefined
      }

    } catch (error) {
      console.error('LLM analysis failed:', error)
      
      // Fallback to rule-based detection
      return this.fallbackDetection(pageType, oldContent, newContent, textSimilarity)
    }
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return union.size > 0 ? intersection.size / union.size : 0
  }

  private inferChangeType(
    pageType: string,
    oldContent: ProcessedContent,
    newContent: ProcessedContent
  ): ChangeDetectionResult['changeType'] {
    // Check for pricing changes
    const oldPricing = oldContent.extractedData.pricing || []
    const newPricing = newContent.extractedData.pricing || []
    if (oldPricing.length !== newPricing.length || 
        !oldPricing.every(op => newPricing.some(np => np.price === op.price))) {
      return 'pricing'
    }

    // Check for feature changes
    const oldFeatures = oldContent.extractedData.features || []
    const newFeatures = newContent.extractedData.features || []
    if (Math.abs(oldFeatures.length - newFeatures.length) > 2) {
      return 'features'
    }

    // Check for headline changes
    const oldHeadlines = oldContent.extractedData.headlines || []
    const newHeadlines = newContent.extractedData.headlines || []
    if (oldHeadlines.length !== newHeadlines.length ||
        !oldHeadlines.every(oh => newHeadlines.some(nh => nh.toLowerCase().includes(oh.toLowerCase())))) {
      return 'messaging'
    }

    // Default based on page type
    switch (pageType) {
      case 'pricing': return 'pricing'
      case 'features': return 'features'
      case 'blog': return 'product'
      default: return 'other'
    }
  }

  private fallbackDetection(
    pageType: string,
    oldContent: ProcessedContent,
    newContent: ProcessedContent,
    textSimilarity: number
  ): ChangeDetectionResult {
    const changeType = this.inferChangeType(pageType, oldContent, newContent)
    
    let changeSummary = 'Content changes detected'

    // Provide neutral descriptions based on change type
    if (changeType === 'pricing') {
      changeSummary = 'Pricing page updates detected'
    } else if (changeType === 'features') {
      changeSummary = 'Feature page modifications found'
    } else if (textSimilarity < 0.5) {
      changeSummary = 'Major content restructuring detected'
    }

    return {
      hasSignificantChange: true, // Always report detected changes
      changeType,
      changeSummary,
      details: { impactLevel: 'medium' }, // Neutral default
      confidence: 'low' // Lower confidence since we're using fallback
    }
  }

  // Batch processing for multiple pages
  async detectMultipleChanges(
    changes: Array<{
      competitorName: string
      pageType: string
      oldContent: ProcessedContent
      newContent: ProcessedContent
    }>
  ): Promise<ChangeDetectionResult[]> {
    const results: ChangeDetectionResult[] = []

    // Process sequentially to avoid overwhelming the LLM API
    for (const change of changes) {
      try {
        const result = await this.detectChanges(
          change.competitorName,
          change.pageType,
          change.oldContent,
          change.newContent
        )
        results.push(result)
        
        // Small delay between requests to be respectful to LLM APIs
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Failed to detect changes for ${change.competitorName}:`, error)
        results.push({
          hasSignificantChange: true, // Report errors as changes for user awareness
          changeType: 'other',
          changeSummary: 'Analysis failed',
          details: { impactLevel: 'medium' },
          confidence: 'low'
        })
      }
    }

    return results
  }
}

export const changeDetector = new ChangeDetector()

// Utility functions for testing LLM providers
export async function testLLMProvider(config?: Partial<LLMProviderConfig>): Promise<{
  success: boolean
  providerName: string
  error?: string
  responseTime?: number
}> {
  try {
    const provider = LLMProviderFactory.createProvider(config)
    const result = await LLMProviderFactory.testProvider(provider)
    
    return {
      ...result,
      providerName: provider.name
    }
  } catch (error) {
    return {
      success: false,
      providerName: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}