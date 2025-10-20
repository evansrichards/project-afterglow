/**
 * Pattern Recognizer Analyzer
 *
 * Foundation analyzer that identifies core behavioral and communication patterns.
 * Uses GPT-4 Turbo for sophisticated pattern recognition.
 * Escalates to Attachment Evaluator if mixed signals or high complexity detected.
 */

import type OpenAI from 'openai'
import type { AnalyzerInput, PatternRecognizerOutput } from './types'
import { createOpenRouterClient } from '../ai/openrouter-client'
import { getOpenRouterApiKey, getOpenRouterSiteUrl, getOpenRouterAppName } from '../ai/config'

/**
 * Pattern recognition configuration
 */
const PATTERN_RECOGNIZER_CONFIG = {
  /** Model to use for pattern recognition */
  model: 'openai/gpt-5',
  /** Temperature for nuanced analysis */
  temperature: 0.4,
  /** Maximum messages to analyze */
  maxMessages: 300,
  /** Complexity threshold for triggering Attachment Evaluator (0-1) */
  complexityThreshold: 0.3,
}

/**
 * Filter messages to only include those from the past 90 days
 */
function filterRecentMessages(input: AnalyzerInput): AnalyzerInput['messages'] {
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000

  return input.messages.filter((msg) => {
    const messageTime = new Date(msg.sentAt).getTime()
    return messageTime >= ninetyDaysAgo
  })
}

/**
 * Sample messages for analysis
 */
function sampleMessages(input: AnalyzerInput, maxMessages: number): string[] {
  const recentMessages = filterRecentMessages(input)

  // Sort by most recent first
  const messages = [...recentMessages].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  )

  // Take up to maxMessages
  const sampled = messages.slice(0, maxMessages)

  return sampled.map((m) => {
    const sender = m.direction === 'user' ? 'User' : 'Match'
    const timestamp = new Date(m.sentAt).toISOString().split('T')[0] // Just the date
    return `[${timestamp}] ${sender}: ${m.body}`
  })
}

/**
 * Format messages for AI prompt
 */
function formatMessagesForPrompt(sampledMessages: string[]): string {
  return sampledMessages.join('\n')
}

/**
 * Analyze patterns using GPT-4 Turbo
 */
async function analyzePatterns(
  client: OpenAI,
  sampledMessages: string[]
): Promise<{
  communicationStyle: PatternRecognizerOutput['communicationStyle']
  attachmentMarkers: PatternRecognizerOutput['attachmentMarkers']
  authenticity: PatternRecognizerOutput['authenticity']
  boundaries: PatternRecognizerOutput['boundaries']
  complexityScore: number
  summary: string
}> {
  const prompt = `You are a relationship psychology expert specializing in communication patterns and attachment theory. Analyze these dating app messages to identify the user's behavioral and communication patterns.

Messages to analyze (most recent first):
${formatMessagesForPrompt(sampledMessages)}

Conduct a comprehensive pattern analysis focusing on:

1. COMMUNICATION STYLE:
   - Consistency: How consistent is their communication style (very-consistent, mostly-consistent, mixed, inconsistent)?
   - Emotional expressiveness: Level of emotional sharing (high, medium, low)
   - Initiation pattern: Who typically starts conversations (proactive, responsive, balanced)

2. ATTACHMENT BEHAVIORAL MARKERS:
   - Anxiety markers: Reassurance-seeking, fear of abandonment, overthinking, excessive check-ins
   - Avoidance markers: Emotional distance, difficulty with vulnerability, pulling away when close
   - Secure markers: Balanced communication, healthy vulnerability, comfortable with closeness

3. AUTHENTICITY & VULNERABILITY:
   - Overall authenticity score (0.0-1.0): How genuine and authentic do they seem?
   - Vulnerability shown: Do they share genuine feelings and struggles?
   - Genuine interest: Do they show authentic interest in the other person?

4. BOUNDARY PATTERNS:
   - Does the user set clear boundaries?
   - Does the user respect others' boundaries?
   - Provide specific examples of boundary setting or respecting

5. COMPLEXITY ASSESSMENT:
   - Calculate complexity score (0.0-1.0) based on:
     - Mixed or contradictory signals in communication
     - Complex attachment patterns (mix of anxious and avoidant)
     - Inconsistent emotional availability
     - Difficult-to-categorize behaviors
   - Higher score = more complex patterns requiring deeper evaluation

Respond in JSON format:
{
  "communicationStyle": {
    "consistency": "very-consistent|mostly-consistent|mixed|inconsistent",
    "emotionalExpressiveness": "high|medium|low",
    "initiationPattern": "proactive|responsive|balanced"
  },
  "attachmentMarkers": {
    "anxietyMarkers": ["specific marker 1", "specific marker 2"],
    "avoidanceMarkers": ["specific marker 1", "specific marker 2"],
    "secureMarkers": ["specific marker 1", "specific marker 2"]
  },
  "authenticity": {
    "score": 0.0-1.0,
    "vulnerabilityShown": true|false,
    "genuineInterest": true|false
  },
  "boundaries": {
    "userSetsBoundaries": true|false,
    "userRespectsBoundaries": true|false,
    "examples": ["example 1", "example 2"]
  },
  "complexityScore": 0.0-1.0,
  "summary": "brief pattern summary with key insights"
}

Important:
- Base all assessments on actual message content and patterns
- Look for patterns over time, not isolated incidents
- Consider context and relationship stage when evaluating patterns
- Complexity score should reflect how straightforward vs nuanced the patterns are`

  const response = await client.chat.completions.create({
    model: PATTERN_RECOGNIZER_CONFIG.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: PATTERN_RECOGNIZER_CONFIG.temperature,
    response_format: { type: 'json_object' },
    stream: false,
  })

  const content = response.choices[0].message.content || '{}'
  const result = JSON.parse(content)

  return {
    communicationStyle: result.communicationStyle || {
      consistency: 'mixed',
      emotionalExpressiveness: 'medium',
      initiationPattern: 'balanced',
    },
    attachmentMarkers: result.attachmentMarkers || {
      anxietyMarkers: [],
      avoidanceMarkers: [],
      secureMarkers: [],
    },
    authenticity: result.authenticity || {
      score: 0.5,
      vulnerabilityShown: false,
      genuineInterest: false,
    },
    boundaries: result.boundaries || {
      userSetsBoundaries: false,
      userRespectsBoundaries: false,
      examples: [],
    },
    complexityScore: result.complexityScore || 0.0,
    summary: result.summary || 'Pattern recognition completed',
  }
}

/**
 * Determine if Attachment Evaluator should be triggered
 */
function shouldEscalateToAttachmentEvaluator(
  complexityScore: number,
  communicationStyle: PatternRecognizerOutput['communicationStyle'],
  attachmentMarkers: PatternRecognizerOutput['attachmentMarkers']
): boolean {
  // Trigger if complexity score is above threshold
  if (complexityScore > PATTERN_RECOGNIZER_CONFIG.complexityThreshold) {
    return true
  }

  // Trigger if mixed/inconsistent communication patterns
  if (
    communicationStyle.consistency === 'mixed' ||
    communicationStyle.consistency === 'inconsistent'
  ) {
    return true
  }

  // Trigger if showing both anxiety and avoidance markers (mixed attachment)
  if (
    attachmentMarkers.anxietyMarkers.length > 0 &&
    attachmentMarkers.avoidanceMarkers.length > 0
  ) {
    return true
  }

  return false
}

/**
 * Run Pattern Recognizer Analyzer
 *
 * @param input - Normalized dataset to analyze
 * @returns Pattern recognition results with escalation flags
 */
export async function runPatternRecognizer(
  input: AnalyzerInput
): Promise<PatternRecognizerOutput> {
  const startTime = Date.now()

  // 1. Sample messages for analysis
  const sampledMessages = sampleMessages(input, PATTERN_RECOGNIZER_CONFIG.maxMessages)

  // 2. Create OpenRouter client
  const client = createOpenRouterClient({
    apiKey: getOpenRouterApiKey(),
    siteUrl: getOpenRouterSiteUrl(),
    appName: getOpenRouterAppName(),
  })

  // 3. Analyze patterns with AI
  const aiResult = await analyzePatterns(client, sampledMessages)

  // 4. Determine escalation
  const escalateToAttachmentEvaluator = shouldEscalateToAttachmentEvaluator(
    aiResult.complexityScore,
    aiResult.communicationStyle,
    aiResult.attachmentMarkers
  )

  const endTime = Date.now()

  return {
    analyzer: 'pattern-recognizer',
    communicationStyle: aiResult.communicationStyle,
    attachmentMarkers: aiResult.attachmentMarkers,
    authenticity: aiResult.authenticity,
    boundaries: aiResult.boundaries,
    complexityScore: aiResult.complexityScore,
    escalateToAttachmentEvaluator,
    summary: aiResult.summary,
    metadata: {
      analyzedAt: new Date().toISOString(),
      durationMs: endTime - startTime,
      model: PATTERN_RECOGNIZER_CONFIG.model,
      // Estimate tokens (rough approximation)
      tokensUsed: {
        input: sampledMessages.join('').length / 4,
        output: 800,
      },
      // Estimate cost for GPT-4 Turbo ($0.01/1K input, $0.03/1K output)
      costUsd:
        (sampledMessages.join('').length / 4 / 1000) * 0.01 + (800 / 1000) * 0.03,
    },
  }
}

/**
 * Export for testing
 */
export const _testing = {
  filterRecentMessages,
  sampleMessages,
  shouldEscalateToAttachmentEvaluator,
  PATTERN_RECOGNIZER_CONFIG,
}
