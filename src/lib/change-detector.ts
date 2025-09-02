import { ProcessedContent } from './content-processor'

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
}

export interface LLMProvider {
  name: string
  analyzeChange(prompt: string): Promise<Record<string, unknown>>
}

// Mock LLM Provider for testing
class MockLLMProvider implements LLMProvider {
  name = 'mock'

  async analyzeChange(prompt: string): Promise<Record<string, unknown>> {
    // Simulate LLM processing delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Basic mock responses based on content
    if (prompt.includes('$') && prompt.includes('price')) {
      return {
        hasSignificantChange: true,
        changeType: 'pricing',
        changeSummary: 'Pricing plan updated with new rates',
        details: {
          oldValue: '$99/month',
          newValue: '$79/month',
          impactLevel: 'high'
        },
        confidence: 'high',
        competitiveAnalysis: 'Competitor has reduced pricing by 20%, potentially increasing market competitiveness'
      }
    }

    if (prompt.includes('feature') || prompt.includes('capability')) {
      return {
        hasSignificantChange: true,
        changeType: 'features',
        changeSummary: 'New features announced in product offering',
        details: {
          impactLevel: 'medium'
        },
        confidence: 'medium'
      }
    }

    return {
      hasSignificantChange: false,
      changeType: 'other',
      changeSummary: 'Minor content updates detected',
      details: {
        impactLevel: 'low'
      },
      confidence: 'low'
    }
  }
}

class ChangeDetector {
  private llmProvider: LLMProvider
  private testMode: boolean = false

  constructor(llmProvider?: LLMProvider) {
    this.llmProvider = llmProvider || new MockLLMProvider()
  }

  setTestMode(enabled: boolean) {
    this.testMode = enabled
  }

  setLLMProvider(provider: LLMProvider) {
    this.llmProvider = provider
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

IGNORE:
- Blog post dates and timestamps
- Customer testimonials and case studies
- Job postings and team updates
- Legal/privacy policy changes
- Social media feeds and view counts
- Cookie banners and UI elements

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

    // If similarity is very high (>95%), likely minor changes
    const textSimilarity = this.calculateTextSimilarity(oldContent.cleanedText, newContent.cleanedText)
    if (textSimilarity > 0.95) {
      return {
        hasSignificantChange: false,
        changeType: 'other',
        changeSummary: 'Minor content updates detected',
        details: {
          impactLevel: 'low'
        },
        confidence: 'medium'
      }
    }

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
            hasSignificantChange: textSimilarity < 0.8,
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
        hasSignificantChange: analysisResult.hasSignificantChange || false,
        changeType: analysisResult.changeType || 'other',
        changeSummary: analysisResult.changeSummary || 'Changes detected',
        details: {
          oldValue: analysisResult.details?.oldValue,
          newValue: analysisResult.details?.newValue,
          impactLevel: analysisResult.details?.impactLevel || 'medium'
        },
        confidence: analysisResult.confidence || 'medium',
        competitiveAnalysis: analysisResult.competitiveAnalysis,
        rawLLMResponse: this.testMode ? llmResponse : undefined
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
    const hasSignificantChange = textSimilarity < 0.7
    
    let changeSummary = 'Content changes detected'
    let impactLevel: 'high' | 'medium' | 'low' = 'medium'

    if (changeType === 'pricing') {
      changeSummary = 'Pricing page updates detected'
      impactLevel = 'high'
    } else if (changeType === 'features') {
      changeSummary = 'Feature page modifications found'
      impactLevel = 'medium'
    } else if (textSimilarity < 0.5) {
      changeSummary = 'Major content restructuring detected'
      impactLevel = 'high'
    }

    return {
      hasSignificantChange,
      changeType,
      changeSummary,
      details: { impactLevel },
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
          hasSignificantChange: false,
          changeType: 'other',
          changeSummary: 'Analysis failed',
          details: { impactLevel: 'low' },
          confidence: 'low'
        })
      }
    }

    return results
  }
}

export const changeDetector = new ChangeDetector()

// Example of how to integrate with OpenAI (when needed)
export class OpenAIProvider implements LLMProvider {
  name = 'openai'
  private apiKey: string
  private model: string = 'gpt-4o-mini'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async analyzeChange(prompt: string): Promise<Record<string, unknown>> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a SaaS competitive intelligence expert. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return JSON.parse(content)
  }
}