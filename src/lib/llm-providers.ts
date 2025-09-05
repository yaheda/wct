import { LLMProvider } from './change-detector'

// Utility function to clean JSON responses from LLMs
function cleanJsonResponse(content: string): string {
  // Remove markdown code block markers
  let cleaned = content.trim()
  
  // Handle various markdown code block formats
  cleaned = cleaned.replace(/^```json\s*/i, '') // Remove opening ```json
  cleaned = cleaned.replace(/^```\s*/i, '') // Remove opening ```
  cleaned = cleaned.replace(/\s*```$/i, '') // Remove closing ```
  
  // Trim any remaining whitespace
  return cleaned.trim()
}

// Configuration interface for LLM providers
export interface LLMProviderConfig {
  provider: 'openai' | 'anthropic' | 'mock'
  apiKey?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

// Extended OpenAI Provider with better error handling
export class OpenAIProvider implements LLMProvider {
  name = 'openai'
  private apiKey: string
  private model: string
  private temperature: number
  private maxTokens: number

  constructor(config: { apiKey: string; model?: string; temperature?: number; maxTokens?: number }) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required')
    }
    this.apiKey = config.apiKey
    this.model = config.model || 'gpt-4o-mini'
    this.temperature = config.temperature || 0.3
    this.maxTokens = config.maxTokens || 500
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
            content: 'You are a SaaS competitive intelligence expert. Respond only with raw JSON - no markdown formatting, no code blocks, no explanations. Return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No response content from OpenAI')
    }

    try {
      const cleanedContent = cleanJsonResponse(content)
      return JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content)
      console.error('Cleaned content:', cleanJsonResponse(content))
      throw new Error(`Invalid JSON response from OpenAI: ${parseError}`)
    }
  }
}

// Anthropic Claude Provider
export class AnthropicProvider implements LLMProvider {
  name = 'anthropic'
  private apiKey: string
  private model: string
  private maxTokens: number

  constructor(config: { apiKey: string; model?: string; maxTokens?: number }) {
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required')
    }
    this.apiKey = config.apiKey
    this.model = config.model || 'claude-3-haiku-20240307'
    this.maxTokens = config.maxTokens || 500
  }

  async analyzeChange(prompt: string): Promise<Record<string, unknown>> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'user',
            content: `You are a SaaS competitive intelligence expert. Respond only with raw JSON - no markdown formatting, no code blocks, no explanations. Return valid JSON only.\n\n${prompt}`
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text

    if (!content) {
      throw new Error('No response content from Anthropic')
    }

    try {
      const cleanedContent = cleanJsonResponse(content)
      return JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('Failed to parse Anthropic response as JSON:', content)
      console.error('Cleaned content:', cleanJsonResponse(content))
      throw new Error(`Invalid JSON response from Anthropic: ${parseError}`)
    }
  }
}

// Enhanced Mock Provider with better simulation
export class MockLLMProvider implements LLMProvider {
  name = 'mock'
  private simulateDelay: boolean
  private delayMs: number

  constructor(config?: { simulateDelay?: boolean; delayMs?: number }) {
    this.simulateDelay = config?.simulateDelay !== false
    this.delayMs = config?.delayMs || 500
  }

  async analyzeChange(prompt: string): Promise<Record<string, unknown>> {
    // Simulate API delay
    if (this.simulateDelay) {
      await new Promise(resolve => setTimeout(resolve, this.delayMs))
    }

    // Enhanced mock responses based on content analysis
    const lowerPrompt = prompt.toLowerCase()
    
    // Pricing detection - highest priority
    if (lowerPrompt.includes('$') && (lowerPrompt.includes('price') || lowerPrompt.includes('pricing') || lowerPrompt.includes('plan'))) {
      // Look for actual price values in the prompt
      const priceMatches = prompt.match(/\$(\d+)/g)
      const hasMultiplePrices = priceMatches && priceMatches.length >= 2
      
      return {
        hasSignificantChange: hasMultiplePrices,
        changeType: 'pricing',
        changeSummary: hasMultiplePrices ? 'Pricing plan updated with new rates' : 'Pricing content modified',
        details: {
          oldValue: hasMultiplePrices ? priceMatches[0] : undefined,
          newValue: hasMultiplePrices ? priceMatches[1] : undefined,
          impactLevel: hasMultiplePrices ? 'high' : 'medium'
        },
        confidence: hasMultiplePrices ? 'high' : 'medium',
        competitiveAnalysis: hasMultiplePrices ? 'Competitor has adjusted pricing strategy' : undefined
      }
    }

    // Minor content updates - check EARLY for date/number changes without significant content
    if ((lowerPrompt.includes('january') && lowerPrompt.includes('last updated')) ||
        (lowerPrompt.includes('1,000') && lowerPrompt.includes('1,050')) ||
        (lowerPrompt.includes('customers') && !lowerPrompt.includes('feature') && !lowerPrompt.includes('pricing') && !lowerPrompt.includes('announcement'))) {
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

    // Product announcement detection - check for specific announcement patterns
    if ((lowerPrompt.includes('announcing') && (lowerPrompt.includes('2.0') || lowerPrompt.includes('platform') || lowerPrompt.includes('update'))) || 
        lowerPrompt.includes('major platform update') || 
        lowerPrompt.includes('product launch')) {
      return {
        hasSignificantChange: true,
        changeType: 'product',
        changeSummary: 'Major product announcement detected',
        details: {
          impactLevel: 'high'
        },
        confidence: 'high',
        competitiveAnalysis: 'Significant product update may impact competitive landscape'
      }
    }

    // Messaging/positioning detection - check for messaging shift patterns
    if ((lowerPrompt.includes('enterprise') && lowerPrompt.includes('small')) ||
        (lowerPrompt.includes('scaling organizations') && lowerPrompt.includes('small teams')) ||
        (lowerPrompt.includes('100+') && lowerPrompt.includes('2-10'))) {
      return {
        hasSignificantChange: true,
        changeType: 'messaging',
        changeSummary: 'Market positioning shift detected',
        details: {
          impactLevel: 'high'
        },
        confidence: 'high',
        competitiveAnalysis: 'Competitor has shifted target market positioning'
      }
    }

    // Feature detection - look for actual feature-related changes
    if ((lowerPrompt.includes('feature') || lowerPrompt.includes('capability') || lowerPrompt.includes('functionality')) &&
        (lowerPrompt.includes('new') || lowerPrompt.includes('announcing') || lowerPrompt.includes('introducing'))) {
      return {
        hasSignificantChange: true,
        changeType: 'features',
        changeSummary: 'New features announced in product offering',
        details: {
          impactLevel: 'medium'
        },
        confidence: 'high',
        competitiveAnalysis: 'Competitor expanding product capabilities'
      }
    }

    // Default fallback - be more conservative about detecting changes
    const textLength = prompt.length
    const hasSignificantChange = textLength > 3000 // Higher threshold for significant changes
    
    return {
      hasSignificantChange,
      changeType: 'other',
      changeSummary: hasSignificantChange ? 'Content changes detected' : 'Minor content updates',
      details: {
        impactLevel: hasSignificantChange ? 'medium' : 'low'
      },
      confidence: 'low'
    }
  }
}

// LLM Provider Factory
export class LLMProviderFactory {
  private static getConfigFromEnv(): LLMProviderConfig {
    const provider = (process.env.LLM_PROVIDER as 'openai' | 'anthropic' | 'mock') || 'mock'
    let apiKey: string | undefined
    
    // Determine API key based on provider
    if (provider === 'openai') {
      apiKey = process.env.OPENAI_API_KEY
    } else if (provider === 'anthropic') {
      apiKey = process.env.ANTHROPIC_API_KEY
    }

    return {
      provider,
      apiKey,
      model: process.env.LLM_MODEL,
      temperature: process.env.LLM_TEMPERATURE ? parseFloat(process.env.LLM_TEMPERATURE) : undefined,
      maxTokens: process.env.LLM_MAX_TOKENS ? parseInt(process.env.LLM_MAX_TOKENS) : undefined
    }
  }

  static getTestConfig(): { useRealLLM: boolean; provider?: LLMProviderConfig } {
    const useRealLLM = process.env.TEST_USE_REAL_LLM === 'true'
    
    if (!useRealLLM) {
      return { useRealLLM: false }
    }

    return {
      useRealLLM: true,
      provider: this.getConfigFromEnv()
    }
  }

  static createProvider(config?: Partial<LLMProviderConfig>): LLMProvider {
    const envConfig = this.getConfigFromEnv()
    const finalConfig = { ...envConfig, ...config }

    switch (finalConfig.provider) {
      case 'openai':
        if (!finalConfig.apiKey) {
          console.warn('OpenAI API key not found, falling back to mock provider')
          return new MockLLMProvider()
        }
        return new OpenAIProvider({
          apiKey: finalConfig.apiKey,
          model: finalConfig.model,
          temperature: finalConfig.temperature,
          maxTokens: finalConfig.maxTokens
        })

      case 'anthropic':
        if (!finalConfig.apiKey) {
          console.warn('Anthropic API key not found, falling back to mock provider')
          return new MockLLMProvider()
        }
        return new AnthropicProvider({
          apiKey: finalConfig.apiKey,
          model: finalConfig.model,
          maxTokens: finalConfig.maxTokens
        })

      case 'mock':
      default:
        return new MockLLMProvider({
          simulateDelay: finalConfig.provider !== 'mock' // Only simulate delay for fallbacks
        })
    }
  }

  static async testProvider(provider: LLMProvider): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    const testPrompt = `Test prompt for SaaS competitive intelligence analysis.

COMPETITOR: TestSaaS
PAGE TYPE: pricing
TEXT SIMILARITY: 85.0%

OLD CONTENT SNAPSHOT:
Headlines: Basic Plan, Pro Plan
Pricing: Basic: $10/month, Pro: $25/month
Features: Task Management, Time Tracking
Content Preview: Choose your plan. Basic plan includes task management...

NEW CONTENT SNAPSHOT:
Headlines: Basic Plan, Pro Plan
Pricing: Basic: $15/month, Pro: $30/month
Features: Task Management, Time Tracking
Content Preview: Choose your plan. Basic plan includes task management...

Respond with JSON: { "hasSignificantChange": true, "changeType": "pricing", "changeSummary": "Test response", "details": { "impactLevel": "medium" }, "confidence": "high" }`

    const startTime = Date.now()
    
    try {
      const response = await provider.analyzeChange(testPrompt)
      const responseTime = Date.now() - startTime

      // Validate response structure
      if (typeof response !== 'object' || !response.hasOwnProperty('hasSignificantChange')) {
        return {
          success: false,
          error: 'Invalid response structure',
          responseTime
        }
      }

      return {
        success: true,
        responseTime
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      }
    }
  }
}

// Export the enhanced providers
export { MockLLMProvider as EnhancedMockLLMProvider }