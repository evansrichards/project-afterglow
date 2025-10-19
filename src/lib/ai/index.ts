/**
 * AI Integration Module
 *
 * Provides OpenRouter client configuration, model selection,
 * cost tracking, and AI request utilities.
 */

export {
  createOpenRouterClient,
  selectModelForAnalysis,
  calculateCost,
  makeAIRequest,
  extractTokenUsage,
  CostTracker,
  MODEL_CONFIGS,
  MODEL_FALLBACKS,
  type AnalysisType,
  type ModelConfig,
  type CostEstimate,
  type OpenRouterConfig,
} from './openrouter-client'

export {
  getOpenRouterApiKey,
  getOpenRouterSiteUrl,
  getOpenRouterAppName,
  isOpenRouterConfigured,
} from './config'
