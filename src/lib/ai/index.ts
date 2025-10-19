/**
 * AI Integration Module
 *
 * Provides OpenRouter client configuration, model selection,
 * cost tracking, comprehensive conversation analysis, and
 * AI-powered insight generation.
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

export {
  prepareConversationContext,
  analyzeAttachmentStyle,
  analyzeRedFlags,
  analyzeCommunicationStrength,
  generateGrowthOpportunities,
  analyzeConversation,
  type AttachmentStyle,
  type AttachmentAnalysis,
  type RedFlagSeverity,
  type RedFlagCategory,
  type RedFlagAnalysis,
  type CommunicationStrength,
  type GrowthOpportunity,
  type ConversationAnalysis,
  type ConversationContext,
} from './conversation-analysis'

export {
  generateAttachmentInsight,
  generateSafetyInsight,
  generateCommunicationInsight,
  generateGrowthInsights,
  generateAIInsights,
  generateInsightSummary,
  filterInsightsBySeverity,
  filterInsightsByCategory,
  sortInsightsByPriority,
} from './ai-insights'
