/**
 * AI-Powered Conversation Analysis
 *
 * Comprehensive analysis using OpenRouter AI models for:
 * - Attachment style detection (GPT-4)
 * - Manipulation and red flag identification (GPT-4)
 * - Communication strength assessment (GPT-4 Turbo)
 * - Personalized growth opportunities (GPT-4 Turbo)
 */

import type OpenAI from 'openai'
import type { NormalizedMessage } from '@/types/data-model'
import { createOpenRouterClient, selectModelForAnalysis, CostTracker } from './openrouter-client'
import { getOpenRouterApiKey, getOpenRouterSiteUrl, getOpenRouterAppName } from './config'

/**
 * Attachment styles based on attachment theory
 */
export type AttachmentStyle = 'secure' | 'anxious' | 'avoidant' | 'disorganized' | 'unclear'

/**
 * Attachment style analysis result
 */
export interface AttachmentAnalysis {
  /** Primary attachment style detected */
  primaryStyle: AttachmentStyle
  /** Confidence level (0-1) */
  confidence: number
  /** Supporting evidence from conversation */
  evidence: string[]
  /** Detailed explanation */
  explanation: string
  /** Behavioral patterns observed */
  patterns: {
    /** Seeking reassurance or validation */
    reassuranceSeeking: boolean
    /** Emotional availability and openness */
    emotionalOpenness: boolean
    /** Comfort with intimacy and closeness */
    intimacyComfort: boolean
    /** Fear of abandonment indicators */
    abandonmentFears: boolean
    /** Independence vs. connection balance */
    independenceBalance: 'healthy' | 'too-independent' | 'too-dependent'
  }
}

/**
 * Red flag severity levels
 */
export type RedFlagSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Red flag category
 */
export type RedFlagCategory =
  | 'manipulation'
  | 'emotional-abuse'
  | 'control'
  | 'gaslighting'
  | 'love-bombing'
  | 'boundary-violation'
  | 'disrespect'
  | 'inconsistency'

/**
 * Manipulation and red flag detection
 */
export interface RedFlagAnalysis {
  /** Whether any red flags were detected */
  flagsDetected: boolean
  /** Overall safety assessment */
  overallSafety: 'safe' | 'cautious' | 'concerning' | 'unsafe'
  /** Detected red flags */
  flags: Array<{
    /** Type of red flag */
    category: RedFlagCategory
    /** Severity level */
    severity: RedFlagSeverity
    /** Description of the concerning behavior */
    description: string
    /** Specific examples from conversation */
    examples: string[]
    /** Recommendation for user */
    recommendation: string
  }>
  /** Positive indicators (green flags) */
  positiveIndicators: string[]
  /** Overall assessment */
  summary: string
}

/**
 * Communication quality dimensions
 */
export interface CommunicationStrength {
  /** Overall communication quality score (0-100) */
  overallScore: number
  /** Breakdown by dimension */
  dimensions: {
    /** Clarity and directness (0-100) */
    clarity: number
    /** Emotional intelligence (0-100) */
    emotionalIntelligence: number
    /** Active listening indicators (0-100) */
    activeListening: number
    /** Authenticity and honesty (0-100) */
    authenticity: number
    /** Respectfulness (0-100) */
    respect: number
    /** Vulnerability and openness (0-100) */
    vulnerability: number
  }
  /** Strengths identified */
  strengths: string[]
  /** Areas for improvement */
  areasForGrowth: string[]
  /** Specific patterns observed */
  patterns: {
    /** Uses "I" statements effectively */
    usesIStatements: boolean
    /** Asks thoughtful questions */
    asksQuestions: boolean
    /** Shares feelings openly */
    sharesFeelings: boolean
    /** Acknowledges other's perspective */
    acknowledgesOther: boolean
    /** Sets clear boundaries */
    setsBoundaries: boolean
  }
}

/**
 * Growth opportunity recommendation
 */
export interface GrowthOpportunity {
  /** Area for growth */
  area: string
  /** Priority level */
  priority: 'high' | 'medium' | 'low'
  /** Current state description */
  currentState: string
  /** Desired state description */
  desiredState: string
  /** Specific, actionable suggestions */
  suggestions: string[]
  /** Resources or practices to explore */
  resources: string[]
  /** How this relates to patterns in the data */
  context: string
}

/**
 * Complete AI conversation analysis
 */
export interface ConversationAnalysis {
  /** Conversation identifier */
  conversationId: string
  /** Timestamp of analysis */
  analyzedAt: string
  /** Attachment style analysis */
  attachment: AttachmentAnalysis
  /** Red flag detection */
  redFlags: RedFlagAnalysis
  /** Communication quality assessment */
  communication: CommunicationStrength
  /** Personalized growth opportunities */
  growthOpportunities: GrowthOpportunity[]
  /** Overall insights summary */
  summary: string
  /** Cost of this analysis */
  cost: {
    totalCost: number
    breakdown: Record<string, number>
  }
}

/**
 * Conversation context for AI analysis
 */
export interface ConversationContext {
  /** Match/conversation ID */
  conversationId: string
  /** Messages in the conversation */
  messages: NormalizedMessage[]
  /** Basic metrics for context */
  metrics?: {
    totalMessages: number
    userMessageCount: number
    matchMessageCount: number
    averageResponseTime?: string
    conversationDuration?: string
  }
}

/**
 * Prepare conversation context for AI analysis
 */
export function prepareConversationContext(
  conversationId: string,
  messages: NormalizedMessage[]
): ConversationContext {
  const userMessages = messages.filter((m) => m.direction === 'user')
  const matchMessages = messages.filter((m) => m.direction === 'match')

  return {
    conversationId,
    messages,
    metrics: {
      totalMessages: messages.length,
      userMessageCount: userMessages.length,
      matchMessageCount: matchMessages.length,
    },
  }
}

/**
 * Format conversation for AI prompt
 */
function formatConversationForPrompt(context: ConversationContext): string {
  const lines: string[] = []

  lines.push(`Conversation ID: ${context.conversationId}`)
  lines.push(`Total Messages: ${context.messages.length}`)
  lines.push('')
  lines.push('Messages (chronological):')
  lines.push('')

  for (const msg of context.messages.slice(0, 100)) {
    // Limit to first 100 messages
    const sender = msg.direction === 'user' ? 'User' : 'Match'
    const timestamp = new Date(msg.sentAt).toLocaleString()
    lines.push(`[${timestamp}] ${sender}: ${msg.body || '[no text]'}`)
  }

  if (context.messages.length > 100) {
    lines.push('')
    lines.push(`... and ${context.messages.length - 100} more messages`)
  }

  return lines.join('\n')
}

/**
 * Analyze attachment style using GPT-4
 */
export async function analyzeAttachmentStyle(
  client: OpenAI,
  context: ConversationContext
): Promise<AttachmentAnalysis> {
  const model = selectModelForAnalysis('attachment-style')

  const prompt = `You are an expert psychologist specializing in attachment theory. Analyze this dating conversation to identify the user's attachment style.

${formatConversationForPrompt(context)}

Analyze the user's messages for:
1. Attachment style indicators (secure, anxious, avoidant, disorganized)
2. Patterns of reassurance-seeking
3. Emotional availability and openness
4. Comfort with intimacy
5. Fear of abandonment
6. Balance between independence and connection

Respond in JSON format:
{
  "primaryStyle": "secure|anxious|avoidant|disorganized|unclear",
  "confidence": 0.0-1.0,
  "evidence": ["specific quote or pattern 1", "specific quote or pattern 2", ...],
  "explanation": "detailed explanation of assessment",
  "patterns": {
    "reassuranceSeeking": boolean,
    "emotionalOpenness": boolean,
    "intimacyComfort": boolean,
    "abandonmentFears": boolean,
    "independenceBalance": "healthy|too-independent|too-dependent"
  }
}`

  const response = await client.chat.completions.create({
    model: model.id,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
    stream: false,
  })

  const content = response.choices[0].message.content || '{}'
  return JSON.parse(content) as AttachmentAnalysis
}

/**
 * Detect manipulation and red flags using GPT-4
 */
export async function analyzeRedFlags(
  client: OpenAI,
  context: ConversationContext
): Promise<RedFlagAnalysis> {
  const model = selectModelForAnalysis('manipulation-detection')

  const prompt = `You are a relationship safety expert. Analyze this dating conversation for red flags and concerning patterns.

${formatConversationForPrompt(context)}

Look for:
1. Manipulation tactics
2. Emotional abuse indicators
3. Control and possessiveness
4. Gaslighting
5. Love bombing
6. Boundary violations
7. Disrespectful behavior
8. Inconsistencies and dishonesty

Also note positive indicators (green flags) like respect, healthy boundaries, and genuine interest.

Respond in JSON format:
{
  "flagsDetected": boolean,
  "overallSafety": "safe|cautious|concerning|unsafe",
  "flags": [
    {
      "category": "manipulation|emotional-abuse|control|gaslighting|love-bombing|boundary-violation|disrespect|inconsistency",
      "severity": "low|medium|high|critical",
      "description": "description of the behavior",
      "examples": ["specific example 1", "specific example 2"],
      "recommendation": "what the user should consider"
    }
  ],
  "positiveIndicators": ["green flag 1", "green flag 2", ...],
  "summary": "overall safety assessment"
}`

  const response = await client.chat.completions.create({
    model: model.id,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    response_format: { type: 'json_object' },
    stream: false,
  })

  const content = response.choices[0].message.content || '{}'
  return JSON.parse(content) as RedFlagAnalysis
}

/**
 * Analyze communication strength using GPT-4 Turbo
 */
export async function analyzeCommunicationStrength(
  client: OpenAI,
  context: ConversationContext
): Promise<CommunicationStrength> {
  const model = selectModelForAnalysis('conversation-analysis')

  const prompt = `You are a communication expert. Analyze the quality of communication in this dating conversation.

${formatConversationForPrompt(context)}

Evaluate the user's communication across these dimensions:
1. Clarity and directness
2. Emotional intelligence
3. Active listening
4. Authenticity and honesty
5. Respectfulness
6. Vulnerability and openness

Also identify specific patterns:
- Use of "I" statements
- Asking thoughtful questions
- Sharing feelings
- Acknowledging other's perspective
- Setting boundaries

Respond in JSON format:
{
  "overallScore": 0-100,
  "dimensions": {
    "clarity": 0-100,
    "emotionalIntelligence": 0-100,
    "activeListening": 0-100,
    "authenticity": 0-100,
    "respect": 0-100,
    "vulnerability": 0-100
  },
  "strengths": ["strength 1", "strength 2", ...],
  "areasForGrowth": ["area 1", "area 2", ...],
  "patterns": {
    "usesIStatements": boolean,
    "asksQuestions": boolean,
    "sharesFeelings": boolean,
    "acknowledgesOther": boolean,
    "setsBoundaries": boolean
  }
}`

  const response = await client.chat.completions.create({
    model: model.id,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    response_format: { type: 'json_object' },
    stream: false,
  })

  const content = response.choices[0].message.content || '{}'
  return JSON.parse(content) as CommunicationStrength
}

/**
 * Generate personalized growth opportunities using GPT-4 Turbo
 */
export async function generateGrowthOpportunities(
  client: OpenAI,
  context: ConversationContext,
  attachment: AttachmentAnalysis,
  communication: CommunicationStrength,
  redFlags: RedFlagAnalysis
): Promise<GrowthOpportunity[]> {
  const model = selectModelForAnalysis('insight-generation')

  const prompt = `You are a dating coach. Based on this conversation analysis, provide personalized growth opportunities.

Conversation: ${context.conversationId}
Messages: ${context.messages.length}

Attachment Style: ${attachment.primaryStyle} (${attachment.confidence} confidence)
Communication Score: ${communication.overallScore}/100
Safety Assessment: ${redFlags.overallSafety}

Weakest Communication Areas:
${Object.entries(communication.dimensions)
  .sort(([, a], [, b]) => a - b)
  .slice(0, 3)
  .map(([area, score]) => `- ${area}: ${score}/100`)
  .join('\n')}

Areas for Growth: ${communication.areasForGrowth.join(', ')}

Provide 3-5 personalized, actionable growth opportunities. Focus on:
1. Communication skills
2. Attachment style awareness
3. Boundary setting
4. Emotional intelligence
5. Self-awareness

Respond in JSON format:
{
  "opportunities": [
    {
      "area": "specific area for growth",
      "priority": "high|medium|low",
      "currentState": "where they are now",
      "desiredState": "where they could be",
      "suggestions": ["specific action 1", "specific action 2", ...],
      "resources": ["practice or resource 1", "practice or resource 2", ...],
      "context": "how this relates to their conversation patterns"
    }
  ]
}`

  const response = await client.chat.completions.create({
    model: model.id,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    response_format: { type: 'json_object' },
    stream: false,
  })

  const content = response.choices[0].message.content || '{}'
  const parsed = JSON.parse(content) as { opportunities: GrowthOpportunity[] }
  return parsed.opportunities || []
}

/**
 * Perform complete AI conversation analysis
 */
export async function analyzeConversation(
  context: ConversationContext,
  costTracker?: CostTracker
): Promise<ConversationAnalysis> {
  // Create OpenRouter client
  const client = createOpenRouterClient({
    apiKey: getOpenRouterApiKey(),
    siteUrl: getOpenRouterSiteUrl(),
    appName: getOpenRouterAppName(),
  })

  const costs: Record<string, number> = {}

  // 1. Analyze attachment style (GPT-4)
  const attachment = await analyzeAttachmentStyle(client, context)
  costs['attachment-analysis'] = 0.15 // Estimated cost

  // 2. Detect red flags (GPT-4)
  const redFlags = await analyzeRedFlags(client, context)
  costs['red-flag-detection'] = 0.15 // Estimated cost

  // 3. Analyze communication (GPT-4 Turbo)
  const communication = await analyzeCommunicationStrength(client, context)
  costs['communication-analysis'] = 0.08 // Estimated cost

  // 4. Generate growth opportunities (GPT-4 Turbo)
  const growthOpportunities = await generateGrowthOpportunities(
    client,
    context,
    attachment,
    communication,
    redFlags
  )
  costs['growth-opportunities'] = 0.08 // Estimated cost

  const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0)

  // Track cost if tracker provided
  if (costTracker) {
    costTracker.addCost({
      model: 'Multiple Models',
      inputTokens: 0, // Would need to calculate from actual responses
      outputTokens: 0,
      totalCost,
      breakdown: { inputCost: totalCost * 0.4, outputCost: totalCost * 0.6 },
    })
  }

  // Generate overall summary
  const summary = `Analyzed ${context.messages.length} messages. Attachment style: ${attachment.primaryStyle}. Communication score: ${communication.overallScore}/100. Safety: ${redFlags.overallSafety}. ${redFlags.flagsDetected ? `⚠️ ${redFlags.flags.length} red flag(s) detected.` : '✓ No major red flags detected.'}`

  return {
    conversationId: context.conversationId,
    analyzedAt: new Date().toISOString(),
    attachment,
    redFlags,
    communication,
    growthOpportunities,
    summary,
    cost: {
      totalCost,
      breakdown: costs,
    },
  }
}
