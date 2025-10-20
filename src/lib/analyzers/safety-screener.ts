/**
 * Safety Screener Analyzer
 *
 * Foundation analyzer that always runs to assess basic safety and detect red flags.
 * Uses GPT-3.5 Turbo for cost-effective initial screening.
 * Escalates to Risk Evaluator if yellow/orange/red flags are detected.
 */

import type OpenAI from 'openai'
import type { AnalyzerInput, SafetyScreenerOutput, RiskLevel } from './types'
import { createOpenRouterClient } from '../ai/openrouter-client'
import { getOpenRouterApiKey, getOpenRouterSiteUrl, getOpenRouterAppName } from '../ai/config'

/**
 * Safety screening configuration
 */
const SAFETY_SCREENER_CONFIG = {
  /** Model to use for safety screening (cost-effective) */
  model: 'openai/gpt-3.5-turbo',
  /** Temperature for consistent safety assessment */
  temperature: 0.2,
  /** Maximum messages to analyze (for cost control) */
  maxMessages: 200,
  /** Sample recent messages more heavily */
  recentMessageWeight: 0.7,
}

/**
 * Filter messages to only include those from the past 90 days
 * Older conversations are not relevant for safety screening
 */
function filterRecentMessages(input: AnalyzerInput): AnalyzerInput['messages'] {
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000

  return input.messages.filter((msg) => {
    const messageTime = new Date(msg.sentAt).getTime()
    return messageTime >= ninetyDaysAgo
  })
}

/**
 * Sample messages for analysis, prioritizing recent ones
 * Only analyzes messages from the past 90 days
 */
function sampleMessages(input: AnalyzerInput, maxMessages: number): string[] {
  // First, filter to only recent messages (past 90 days)
  const recentMessages = filterRecentMessages(input)

  // Sort by most recent first
  const messages = [...recentMessages].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  )

  // Take 70% from recent messages, 30% from older (within the 90-day window)
  const recentCount = Math.floor(maxMessages * SAFETY_SCREENER_CONFIG.recentMessageWeight)
  const olderCount = maxMessages - recentCount

  const recent = messages.slice(0, recentCount)
  const older = messages.slice(recentCount, recentCount + olderCount)

  return [...recent, ...older].map((m) => {
    const sender = m.direction === 'user' ? 'User' : 'Match'
    return `${sender}: ${m.body}`
  })
}

/**
 * Format messages for AI prompt
 */
function formatMessagesForPrompt(sampledMessages: string[]): string {
  return sampledMessages.join('\n')
}

/**
 * Analyze safety using GPT-3.5 Turbo
 * Relies on LLM's sophisticated understanding of context and safety patterns
 */
async function analyzeSafetyWithAI(
  client: OpenAI,
  sampledMessages: string[]
): Promise<{
  riskLevel: RiskLevel
  redFlags: SafetyScreenerOutput['redFlags']
  greenFlags: string[]
  summary: string
}> {
  const prompt = `You are a relationship safety expert with deep knowledge of abuse patterns, manipulation tactics, and healthy relationship dynamics. Analyze these dating app messages for safety concerns.

Messages to analyze:
${formatMessagesForPrompt(sampledMessages)}

Conduct a nuanced safety assessment looking for:

RED FLAG CATEGORIES (assess context, not just keywords):
1. THREATS: Explicit or implied violence, harm, intimidation, stalking behavior
2. FINANCIAL REQUESTS: Requests for money, investments, loans, or financial help (context matters - emergencies vs patterns)
3. MANIPULATION: Guilt-tripping, gaslighting, DARVO (Deny, Attack, Reverse Victim & Offender), emotional blackmail, love bombing followed by devaluation
4. PRESSURE: Sexual coercion, rushing intimacy, ignoring boundaries, demanding proof of feelings
5. INCONSISTENCY: Significant lies, contradictions suggesting deception, fake personas

Consider the FULL CONTEXT:
- Tone and intent behind messages
- Pattern over time vs isolated incidents
- Power dynamics in the conversation
- Whether behavior escalates or de-escalates
- Cultural and linguistic nuances
- Whether concerning behavior is addressed and changes

GREEN FLAGS to note:
- Respectful communication and active listening
- Healthy boundary setting and respecting others' boundaries
- Genuine interest without pressure
- Consistency between words and actions
- Emotional intelligence and self-awareness
- Appropriate pacing of intimacy
- Taking accountability when appropriate

Respond in JSON format:
{
  "riskLevel": "green|yellow|orange|red",
  "redFlags": [
    {
      "type": "threat|financial-request|explicit-manipulation|pressure|inconsistency",
      "severity": "low|medium|high",
      "description": "contextual description of the concerning pattern",
      "examples": ["specific example showing context", "another example"]
    }
  ],
  "greenFlags": ["specific positive pattern 1", "specific positive pattern 2"],
  "summary": "nuanced overall safety assessment with context"
}

Risk level guidelines:
- GREEN: No significant concerns, healthy communication patterns
- YELLOW: Minor concerns worth monitoring (e.g., one boundary slip that was corrected, minor inconsistencies)
- ORANGE: Moderate concerns with multiple red flags or escalating patterns that warrant deeper analysis
- RED: Serious safety concerns requiring immediate attention (threats, severe manipulation, consistent coercion)`

  const response = await client.chat.completions.create({
    model: SAFETY_SCREENER_CONFIG.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: SAFETY_SCREENER_CONFIG.temperature,
    response_format: { type: 'json_object' },
    stream: false,
  })

  const content = response.choices[0].message.content || '{}'
  const result = JSON.parse(content)

  return {
    riskLevel: result.riskLevel || 'green',
    redFlags: result.redFlags || [],
    greenFlags: result.greenFlags || [],
    summary: result.summary || 'Safety screening completed',
  }
}

/**
 * Determine if Risk Evaluator should be triggered
 */
function shouldEscalateToRiskEvaluator(
  riskLevel: RiskLevel,
  redFlags: SafetyScreenerOutput['redFlags']
): boolean {
  // Escalate if risk level is yellow or higher
  if (riskLevel === 'yellow' || riskLevel === 'orange' || riskLevel === 'red') {
    return true
  }

  // Escalate if any medium or high severity flags
  if (redFlags.some((flag) => flag.severity === 'medium' || flag.severity === 'high')) {
    return true
  }

  return false
}

/**
 * Run Safety Screener Analyzer
 *
 * @param input - Normalized dataset to analyze
 * @returns Safety screening results with escalation flags
 */
export async function runSafetyScreener(input: AnalyzerInput): Promise<SafetyScreenerOutput> {
  const startTime = Date.now()

  // 1. Sample messages for analysis
  const sampledMessages = sampleMessages(input, SAFETY_SCREENER_CONFIG.maxMessages)

  // 2. Create OpenRouter client
  const client = createOpenRouterClient({
    apiKey: getOpenRouterApiKey(),
    siteUrl: getOpenRouterSiteUrl(),
    appName: getOpenRouterAppName(),
  })

  // 3. Analyze with AI (relying on LLM's sophisticated context understanding)
  const aiResult = await analyzeSafetyWithAI(client, sampledMessages)

  // 4. Determine escalation
  const escalateToRiskEvaluator = shouldEscalateToRiskEvaluator(
    aiResult.riskLevel,
    aiResult.redFlags
  )

  const endTime = Date.now()

  return {
    analyzer: 'safety-screener',
    riskLevel: aiResult.riskLevel,
    redFlags: aiResult.redFlags,
    greenFlags: aiResult.greenFlags,
    escalateToRiskEvaluator,
    summary: aiResult.summary,
    metadata: {
      analyzedAt: new Date().toISOString(),
      durationMs: endTime - startTime,
      model: SAFETY_SCREENER_CONFIG.model,
      // Estimate tokens (rough approximation)
      tokensUsed: {
        input: sampledMessages.join('').length / 4,
        output: 500,
      },
      // Estimate cost for GPT-3.5 Turbo ($0.001/1K input, $0.002/1K output)
      costUsd:
        (sampledMessages.join('').length / 4 / 1000) * 0.001 + (500 / 1000) * 0.002,
    },
  }
}

/**
 * Export for testing
 */
export const _testing = {
  filterRecentMessages,
  sampleMessages,
  shouldEscalateToRiskEvaluator,
}
