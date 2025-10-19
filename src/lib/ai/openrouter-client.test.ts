/**
 * Tests for OpenRouter Client Configuration
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  selectModelForAnalysis,
  calculateCost,
  createOpenRouterClient,
  CostTracker,
  MODEL_CONFIGS,
  type AnalysisType,
} from './openrouter-client'

describe('OpenRouter Client', () => {
  describe('Model Selection', () => {
    it('selects GPT-4 for attachment style analysis', () => {
      const model = selectModelForAnalysis('attachment-style')
      expect(model.id).toBe('openai/gpt-4')
      expect(model.useCases).toContain('attachment-style')
    })

    it('selects GPT-4 for manipulation detection', () => {
      const model = selectModelForAnalysis('manipulation-detection')
      expect(model.id).toBe('openai/gpt-4')
      expect(model.useCases).toContain('manipulation-detection')
    })

    it('selects GPT-4 Turbo for conversation analysis', () => {
      const model = selectModelForAnalysis('conversation-analysis')
      expect(model.id).toBe('openai/gpt-4-turbo')
      expect(model.useCases).toContain('conversation-analysis')
    })

    it('selects GPT-4 Turbo for insight generation', () => {
      const model = selectModelForAnalysis('insight-generation')
      expect(model.id).toBe('openai/gpt-4-turbo')
      expect(model.useCases).toContain('insight-generation')
    })

    it('selects GPT-3.5 Turbo for summary generation', () => {
      const model = selectModelForAnalysis('summary-generation')
      expect(model.id).toBe('openai/gpt-3.5-turbo')
      expect(model.useCases).toContain('summary-generation')
    })

    it('selects GPT-3.5 Turbo for pattern description', () => {
      const model = selectModelForAnalysis('pattern-description')
      expect(model.id).toBe('openai/gpt-3.5-turbo')
      expect(model.useCases).toContain('pattern-description')
    })

    it('selects Claude 3 Haiku for data validation', () => {
      const model = selectModelForAnalysis('data-validation')
      expect(model.id).toBe('anthropic/claude-3-haiku')
      expect(model.useCases).toContain('data-validation')
    })

    it('defaults to GPT-3.5 Turbo for unknown analysis type', () => {
      const model = selectModelForAnalysis('unknown-type' as AnalysisType)
      expect(model.id).toBe('openai/gpt-3.5-turbo')
    })
  })

  describe('Cost Calculation', () => {
    it('calculates cost for GPT-4 correctly', () => {
      const cost = calculateCost('openai/gpt-4', 1000, 500)

      // Input: 1000 tokens * $30 / 1M = $0.03
      expect(cost.breakdown.inputCost).toBeCloseTo(0.03, 4)

      // Output: 500 tokens * $60 / 1M = $0.03
      expect(cost.breakdown.outputCost).toBeCloseTo(0.03, 4)

      // Total
      expect(cost.totalCost).toBeCloseTo(0.06, 4)
      expect(cost.model).toBe('GPT-4')
    })

    it('calculates cost for GPT-4 Turbo correctly', () => {
      const cost = calculateCost('openai/gpt-4-turbo', 10000, 5000)

      // Input: 10000 tokens * $10 / 1M = $0.10
      expect(cost.breakdown.inputCost).toBeCloseTo(0.10, 4)

      // Output: 5000 tokens * $30 / 1M = $0.15
      expect(cost.breakdown.outputCost).toBeCloseTo(0.15, 4)

      // Total
      expect(cost.totalCost).toBeCloseTo(0.25, 4)
    })

    it('calculates cost for GPT-3.5 Turbo correctly', () => {
      const cost = calculateCost('openai/gpt-3.5-turbo', 100000, 50000)

      // Input: 100000 tokens * $0.5 / 1M = $0.05
      expect(cost.breakdown.inputCost).toBeCloseTo(0.05, 4)

      // Output: 50000 tokens * $1.5 / 1M = $0.075
      expect(cost.breakdown.outputCost).toBeCloseTo(0.075, 4)

      // Total
      expect(cost.totalCost).toBeCloseTo(0.125, 4)
    })

    it('calculates cost for Claude 3 Haiku correctly', () => {
      const cost = calculateCost('anthropic/claude-3-haiku', 100000, 50000)

      // Input: 100000 tokens * $0.25 / 1M = $0.025
      expect(cost.breakdown.inputCost).toBeCloseTo(0.025, 4)

      // Output: 50000 tokens * $1.25 / 1M = $0.0625
      expect(cost.breakdown.outputCost).toBeCloseTo(0.0625, 4)

      // Total
      expect(cost.totalCost).toBeCloseTo(0.0875, 4)
    })

    it('throws error for unknown model', () => {
      expect(() => calculateCost('unknown/model', 1000, 500)).toThrow('Unknown model')
    })
  })

  describe('Client Creation', () => {
    it('creates OpenRouter client with API key', () => {
      const client = createOpenRouterClient({
        apiKey: 'test-api-key',
        dangerouslyAllowBrowser: true, // Required for testing in browser-like environment
      })

      expect(client).toBeDefined()
      expect(client.apiKey).toBe('test-api-key')
      expect(client.baseURL).toBe('https://openrouter.ai/api/v1')
    })

    it('creates client with optional headers', () => {
      const client = createOpenRouterClient({
        apiKey: 'test-api-key',
        siteUrl: 'https://example.com',
        appName: 'TestApp',
        dangerouslyAllowBrowser: true, // Required for testing in browser-like environment
      })

      expect(client).toBeDefined()
      expect(client.apiKey).toBe('test-api-key')
      expect(client.baseURL).toBe('https://openrouter.ai/api/v1')
    })
  })

  describe('Cost Tracker', () => {
    let tracker: CostTracker

    beforeEach(() => {
      tracker = new CostTracker(100)
    })

    it('initializes with zero costs', () => {
      expect(tracker.getTotalCost()).toBe(0)
      expect(tracker.getRemainingBudget()).toBe(100)
      expect(tracker.isBudgetExceeded()).toBe(false)
    })

    it('tracks single cost', () => {
      tracker.addCost({
        model: 'GPT-4',
        inputTokens: 1000,
        outputTokens: 500,
        totalCost: 0.06,
        breakdown: { inputCost: 0.03, outputCost: 0.03 },
      })

      expect(tracker.getTotalCost()).toBeCloseTo(0.06, 4)
      expect(tracker.getRemainingBudget()).toBeCloseTo(99.94, 4)
      expect(tracker.isBudgetExceeded()).toBe(false)
    })

    it('tracks multiple costs', () => {
      tracker.addCost({
        model: 'GPT-4',
        inputTokens: 1000,
        outputTokens: 500,
        totalCost: 0.06,
        breakdown: { inputCost: 0.03, outputCost: 0.03 },
      })

      tracker.addCost({
        model: 'GPT-3.5 Turbo',
        inputTokens: 10000,
        outputTokens: 5000,
        totalCost: 0.0125,
        breakdown: { inputCost: 0.005, outputCost: 0.0075 },
      })

      expect(tracker.getTotalCost()).toBeCloseTo(0.0725, 4)
      expect(tracker.getRemainingBudget()).toBeCloseTo(99.9275, 4)
    })

    it('detects budget exceeded', () => {
      tracker.addCost({
        model: 'GPT-4',
        inputTokens: 1000000,
        outputTokens: 500000,
        totalCost: 120,
        breakdown: { inputCost: 60, outputCost: 60 },
      })

      expect(tracker.isBudgetExceeded()).toBe(true)
      expect(tracker.getRemainingBudget()).toBe(0)
    })

    it('groups costs by model', () => {
      tracker.addCost({
        model: 'GPT-4',
        inputTokens: 1000,
        outputTokens: 500,
        totalCost: 0.06,
        breakdown: { inputCost: 0.03, outputCost: 0.03 },
      })

      tracker.addCost({
        model: 'GPT-4',
        inputTokens: 1000,
        outputTokens: 500,
        totalCost: 0.06,
        breakdown: { inputCost: 0.03, outputCost: 0.03 },
      })

      tracker.addCost({
        model: 'GPT-3.5 Turbo',
        inputTokens: 10000,
        outputTokens: 5000,
        totalCost: 0.0125,
        breakdown: { inputCost: 0.005, outputCost: 0.0075 },
      })

      const breakdown = tracker.getCostsByModel()
      expect(breakdown['GPT-4']).toBeCloseTo(0.12, 4)
      expect(breakdown['GPT-3.5 Turbo']).toBeCloseTo(0.0125, 4)
    })

    it('returns all cost estimates', () => {
      const cost1 = {
        model: 'GPT-4',
        inputTokens: 1000,
        outputTokens: 500,
        totalCost: 0.06,
        breakdown: { inputCost: 0.03, outputCost: 0.03 },
      }

      const cost2 = {
        model: 'GPT-3.5 Turbo',
        inputTokens: 10000,
        outputTokens: 5000,
        totalCost: 0.0125,
        breakdown: { inputCost: 0.005, outputCost: 0.0075 },
      }

      tracker.addCost(cost1)
      tracker.addCost(cost2)

      const allCosts = tracker.getAllCosts()
      expect(allCosts).toHaveLength(2)
      expect(allCosts[0]).toEqual(cost1)
      expect(allCosts[1]).toEqual(cost2)
    })

    it('resets all costs', () => {
      tracker.addCost({
        model: 'GPT-4',
        inputTokens: 1000,
        outputTokens: 500,
        totalCost: 0.06,
        breakdown: { inputCost: 0.03, outputCost: 0.03 },
      })

      expect(tracker.getTotalCost()).toBeGreaterThan(0)

      tracker.reset()

      expect(tracker.getTotalCost()).toBe(0)
      expect(tracker.getAllCosts()).toHaveLength(0)
      expect(tracker.getRemainingBudget()).toBe(100)
    })

    it('uses default budget of 2000', () => {
      const defaultTracker = new CostTracker()
      expect(defaultTracker.getRemainingBudget()).toBe(2000)
    })
  })

  describe('Model Configurations', () => {
    it('all models have valid configurations', () => {
      Object.entries(MODEL_CONFIGS).forEach(([_key, config]) => {
        expect(config.id).toBeTruthy()
        expect(config.name).toBeTruthy()
        expect(config.provider).toBeTruthy()
        expect(config.inputCostPer1M).toBeGreaterThan(0)
        expect(config.outputCostPer1M).toBeGreaterThan(0)
        expect(config.contextWindow).toBeGreaterThan(0)
        expect(config.useCases.length).toBeGreaterThan(0)
      })
    })

    it('GPT-4 is most expensive', () => {
      const gpt4 = MODEL_CONFIGS['gpt-4']
      const gpt35 = MODEL_CONFIGS['gpt-3.5-turbo']
      const haiku = MODEL_CONFIGS['claude-3-haiku']

      expect(gpt4.inputCostPer1M).toBeGreaterThan(gpt35.inputCostPer1M)
      expect(gpt4.inputCostPer1M).toBeGreaterThan(haiku.inputCostPer1M)
    })

    it('Claude 3 Haiku has largest context window', () => {
      const haiku = MODEL_CONFIGS['claude-3-haiku']
      const gpt4Turbo = MODEL_CONFIGS['gpt-4-turbo']
      const gpt4 = MODEL_CONFIGS['gpt-4']

      expect(haiku.contextWindow).toBeGreaterThan(gpt4Turbo.contextWindow)
      expect(haiku.contextWindow).toBeGreaterThan(gpt4.contextWindow)
    })
  })
})
