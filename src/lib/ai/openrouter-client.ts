/**
 * OpenRouter Client Configuration
 *
 * Provides dynamic AI model selection and cost optimization through OpenRouter API.
 * Uses the OpenAI SDK with OpenRouter's endpoint for unified model access.
 */

import OpenAI from 'openai'

/**
 * Analysis types that determine which AI model to use
 */
export type AnalysisType =
  | 'attachment-style'      // Deep psychological analysis (GPT-4)
  | 'manipulation-detection' // Red flag and manipulation patterns (GPT-4)
  | 'conversation-analysis' // Comprehensive conversation insights (GPT-4 Turbo)
  | 'insight-generation'    // Personalized recommendations (GPT-4 Turbo)
  | 'summary-generation'    // Brief summaries (GPT-3.5 Turbo)
  | 'pattern-description'   // Simple pattern explanations (GPT-3.5 Turbo)
  | 'data-validation'       // Basic validation and categorization (Claude-3 Haiku)

/**
 * Model configuration with pricing and capabilities
 */
export interface ModelConfig {
  /** OpenRouter model identifier */
  id: string
  /** Model display name */
  name: string
  /** Provider (openai, anthropic, etc.) */
  provider: string
  /** Cost per 1M input tokens in USD */
  inputCostPer1M: number
  /** Cost per 1M output tokens in USD */
  outputCostPer1M: number
  /** Maximum context window in tokens */
  contextWindow: number
  /** Use cases this model is optimized for */
  useCases: AnalysisType[]
}

/**
 * Model selection strategy based on analysis type and cost optimization
 */
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'gpt-4-turbo': {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    inputCostPer1M: 10.0,
    outputCostPer1M: 30.0,
    contextWindow: 128000,
    useCases: ['conversation-analysis', 'insight-generation'],
  },
  'gpt-4': {
    id: 'openai/gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    inputCostPer1M: 30.0,
    outputCostPer1M: 60.0,
    contextWindow: 8192,
    useCases: ['attachment-style', 'manipulation-detection'],
  },
  'gpt-3.5-turbo': {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    inputCostPer1M: 0.5,
    outputCostPer1M: 1.5,
    contextWindow: 16385,
    useCases: ['summary-generation', 'pattern-description'],
  },
  'claude-3-haiku': {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    contextWindow: 200000,
    useCases: ['data-validation'],
  },
}

/**
 * Fallback hierarchy for model availability
 * If primary model fails, try fallbacks in order
 */
export const MODEL_FALLBACKS: Record<string, string[]> = {
  'gpt-4-turbo': ['gpt-4', 'gpt-3.5-turbo'],
  'gpt-4': ['gpt-4-turbo', 'gpt-3.5-turbo'],
  'gpt-3.5-turbo': ['gpt-4-turbo'],
  'claude-3-haiku': ['gpt-3.5-turbo'],
}

/**
 * Select the best model for a given analysis type
 */
export function selectModelForAnalysis(analysisType: AnalysisType): ModelConfig {
  // Find the first model that supports this analysis type
  const modelKey = Object.keys(MODEL_CONFIGS).find((key) =>
    MODEL_CONFIGS[key].useCases.includes(analysisType)
  )

  if (!modelKey) {
    // Default to GPT-3.5 Turbo as fallback
    return MODEL_CONFIGS['gpt-3.5-turbo']
  }

  return MODEL_CONFIGS[modelKey]
}

/**
 * Cost tracking for AI usage
 */
export interface CostEstimate {
  /** Model used */
  model: string
  /** Estimated input tokens */
  inputTokens: number
  /** Estimated output tokens */
  outputTokens: number
  /** Total cost in USD */
  totalCost: number
  /** Breakdown by token type */
  breakdown: {
    inputCost: number
    outputCost: number
  }
}

/**
 * Calculate cost estimate for a given model and token usage
 */
export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): CostEstimate {
  const model = Object.values(MODEL_CONFIGS).find((m) => m.id === modelId)

  if (!model) {
    throw new Error(`Unknown model: ${modelId}`)
  }

  const inputCost = (inputTokens / 1_000_000) * model.inputCostPer1M
  const outputCost = (outputTokens / 1_000_000) * model.outputCostPer1M
  const totalCost = inputCost + outputCost

  return {
    model: model.name,
    inputTokens,
    outputTokens,
    totalCost,
    breakdown: {
      inputCost,
      outputCost,
    },
  }
}

/**
 * OpenRouter client configuration
 */
export interface OpenRouterConfig {
  /** OpenRouter API key */
  apiKey: string
  /** Optional site URL for OpenRouter analytics */
  siteUrl?: string
  /** Optional app name for OpenRouter analytics */
  appName?: string
  /** Allow browser usage (for testing only - do not use in production client-side code) */
  dangerouslyAllowBrowser?: boolean
}

/**
 * Create an OpenAI client configured for OpenRouter
 */
export function createOpenRouterClient(config: OpenRouterConfig): OpenAI {
  const defaultHeaders: Record<string, string> = {}

  if (config.siteUrl) {
    defaultHeaders['HTTP-Referer'] = config.siteUrl
  }

  if (config.appName) {
    defaultHeaders['X-Title'] = config.appName
  }

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders,
    dangerouslyAllowBrowser: config.dangerouslyAllowBrowser || false,
  })
}

/**
 * Make an AI request with automatic fallback handling
 */
export async function makeAIRequest(
  client: OpenAI,
  modelKey: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: Partial<OpenAI.Chat.ChatCompletionCreateParams>
): Promise<OpenAI.Chat.ChatCompletion> {
  const primaryModel = MODEL_CONFIGS[modelKey]

  if (!primaryModel) {
    throw new Error(`Unknown model key: ${modelKey}`)
  }

  const modelsToTry = [primaryModel.id, ...(MODEL_FALLBACKS[modelKey] || []).map(key => MODEL_CONFIGS[key].id)]

  let lastError: Error | null = null

  for (const modelId of modelsToTry) {
    try {
      const response = await client.chat.completions.create({
        model: modelId,
        messages,
        stream: false, // Explicitly disable streaming to ensure correct return type
        ...options,
      })

      return response as OpenAI.Chat.ChatCompletion
    } catch (error) {
      lastError = error as Error
      console.warn(`Model ${modelId} failed, trying fallback...`, error)
      continue
    }
  }

  throw new Error(
    `All model fallbacks failed. Last error: ${lastError?.message || 'Unknown error'}`
  )
}

/**
 * Extract token usage from OpenAI response
 */
export function extractTokenUsage(
  response: OpenAI.Chat.ChatCompletion
): { inputTokens: number; outputTokens: number } {
  return {
    inputTokens: response.usage?.prompt_tokens || 0,
    outputTokens: response.usage?.completion_tokens || 0,
  }
}

/**
 * Track cumulative AI costs across requests
 */
export class CostTracker {
  private costs: CostEstimate[] = []
  private budgetLimit: number

  constructor(budgetLimit: number = 2000) {
    this.budgetLimit = budgetLimit
  }

  /**
   * Add a cost estimate to the tracker
   */
  addCost(estimate: CostEstimate): void {
    this.costs.push(estimate)
  }

  /**
   * Get total costs across all requests
   */
  getTotalCost(): number {
    return this.costs.reduce((sum, cost) => sum + cost.totalCost, 0)
  }

  /**
   * Get remaining budget
   */
  getRemainingBudget(): number {
    return Math.max(0, this.budgetLimit - this.getTotalCost())
  }

  /**
   * Check if budget limit has been exceeded
   */
  isBudgetExceeded(): boolean {
    return this.getTotalCost() >= this.budgetLimit
  }

  /**
   * Get cost breakdown by model
   */
  getCostsByModel(): Record<string, number> {
    const breakdown: Record<string, number> = {}

    for (const cost of this.costs) {
      breakdown[cost.model] = (breakdown[cost.model] || 0) + cost.totalCost
    }

    return breakdown
  }

  /**
   * Get all cost estimates
   */
  getAllCosts(): CostEstimate[] {
    return [...this.costs]
  }

  /**
   * Reset all tracked costs
   */
  reset(): void {
    this.costs = []
  }
}
