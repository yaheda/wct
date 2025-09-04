# LLM Testing Integration

This document explains how to use real LLM providers in the test detection system instead of the mock provider.

## Overview

The test detection system now supports using real LLM providers (OpenAI, Anthropic) for more accurate testing results. This allows you to:

- Test change detection with actual AI analysis
- Compare mock vs real LLM performance
- Validate detection accuracy with production-quality LLM responses

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Choose LLM provider
LLM_PROVIDER=openai  # or "anthropic" or "mock"

# API Keys (only needed if using real LLM)
OPENAI_API_KEY=your-api-key-here
ANTHROPIC_API_KEY=your-api-key-here

# Optional settings
LLM_MODEL=gpt-4o-mini  # or your preferred model
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=500

# Enable real LLM in tests by default
TEST_USE_REAL_LLM=true
```

## Usage

### 1. Via API Endpoints

Test a specific scenario with real LLM:
```bash
curl -X POST /api/test-scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "action": "run",
    "scenarioId": "pricing-increase",
    "options": {
      "useRealLLM": true,
      "llmProvider": {
        "provider": "openai",
        "model": "gpt-4o-mini"
      }
    }
  }'
```

Run all tests with real LLM:
```bash
curl -X POST /api/test-scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "action": "run-all",
    "options": {
      "useRealLLM": true,
      "verbose": true
    }
  }'
```

Run comparative tests (mock vs real LLM):
```bash
curl -X POST /api/test-scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "action": "run-comparative",
    "options": {
      "verbose": true
    }
  }'
```

Test LLM provider connectivity:
```bash
curl -X POST /api/test-scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test-llm",
    "options": {
      "llmProvider": {
        "provider": "openai"
      }
    }
  }'
```

### 2. Programmatic Usage

```typescript
import { testFramework } from '@/lib/test-scenarios'
import { LLMProviderFactory } from '@/lib/llm-providers'

// Run single test with real LLM
const result = await testFramework.runTestScenario('pricing-increase', {
  useRealLLM: true,
  llmProvider: {
    provider: 'openai',
    model: 'gpt-4o-mini'
  }
})

// Run all tests with real LLM
const results = await testFramework.runAllTests({
  useRealLLM: true,
  verbose: true
})

// Run comparative analysis
const comparison = await testFramework.runComparativeTests({
  verbose: true
})

console.log(\`Mock accuracy: \${comparison.mockResults.reduce((sum, r) => sum + r.details.accuracy, 0) / comparison.mockResults.length}\`)
console.log(\`Real LLM accuracy: \${comparison.realLLMResults.reduce((sum, r) => sum + r.details.accuracy, 0) / comparison.realLLMResults.length}\`)
```

### 3. Testing LLM Providers

```typescript
import { LLMProviderFactory } from '@/lib/llm-providers'

// Test OpenAI provider
const openaiTest = await LLMProviderFactory.testProvider(
  LLMProviderFactory.createProvider({ provider: 'openai' })
)

console.log('OpenAI test:', openaiTest)
// { success: true, responseTime: 1250 }

// Test Anthropic provider  
const anthropicTest = await LLMProviderFactory.testProvider(
  LLMProviderFactory.createProvider({ provider: 'anthropic' })
)
```

## Response Format

Test results now include additional fields when using real LLMs:

```typescript
{
  scenarioId: "pricing-increase",
  passed: true,
  actualResult: {
    hasSignificantChange: true,
    changeType: "pricing",
    changeSummary: "Pricing plan updated with new rates",
    // ... other fields
    llmProvider: "openai",        // NEW: Which provider was used
    rawLLMResponse: { ... }       // NEW: Raw LLM response (in test mode)
  },
  expectedResult: { ... },
  details: {
    accuracy: 0.95,
    errors: [],
    llmProvider: "openai",        // NEW: Provider used
    testMode: "real-llm"          // NEW: "mock" or "real-llm"
  }
}
```

## Comparative Testing

The `runComparativeTests` method runs the same scenarios with both mock and real LLM providers, then compares:

```typescript
{
  mockResults: [ /* test results with mock provider */ ],
  realLLMResults: [ /* test results with real LLM */ ],
  comparison: {
    accuracyDifference: 0.15,     // Real LLM - Mock accuracy
    agreementRate: 0.8,           // % of tests where both passed/failed
    detailedComparison: [
      {
        scenarioId: "pricing-increase",
        mockPassed: true,
        realLLMPassed: true,
        accuracyDiff: 0.1,
        agreement: true
      }
      // ... more scenarios
    ]
  }
}
```

## Best Practices

1. **Start with Mock**: Use mock provider for rapid development and basic validation
2. **Validate with Real LLM**: Use real LLM for final validation before production
3. **Compare Results**: Use comparative testing to understand differences
4. **Monitor Costs**: Real LLM calls incur API costs - use judiciously
5. **Environment Separation**: Use mock in development, real LLM in staging/production tests

## Troubleshooting

### Common Issues

1. **API Key Missing**: Ensure environment variables are set correctly
2. **Provider Unavailable**: Check internet connection and API status  
3. **Rate Limiting**: Add delays between test runs if hitting rate limits
4. **Invalid JSON**: LLM responses occasionally malformed - system includes fallbacks

### Debug Mode

Enable verbose logging:

```typescript
const results = await testFramework.runAllTests({
  useRealLLM: true,
  verbose: true  // Enables detailed console logging
})
```

This will log each test scenario execution with timing and result details.