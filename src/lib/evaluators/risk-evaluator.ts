/**
 * Risk Evaluator
 *
 * Conditional evaluator triggered by yellow/orange/red safety flags.
 * Uses GPT-4 for advanced manipulation tactic detection and safety analysis.
 * Escalates to Crisis Evaluator if orange/red risk detected.
 */

import type OpenAI from 'openai'
import type { EvaluatorInput, RiskEvaluatorOutput } from './types'
import { createOpenRouterClient } from '../ai/openrouter-client'
import { getOpenRouterApiKey, getOpenRouterSiteUrl, getOpenRouterAppName } from '../ai/config'

/**
 * Risk evaluator configuration
 */
const RISK_EVALUATOR_CONFIG = {
  /** Model to use for risk evaluation */
  model: 'openai/gpt-4',
  /** Temperature for focused safety analysis */
  temperature: 0.2,
  /** Maximum messages to analyze */
  maxMessages: 300,
}

/**
 * Sample messages for detailed risk analysis
 */
function sampleMessagesForRiskAnalysis(input: EvaluatorInput): string[] {
  // Filter to past 90 days
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
  const recentMessages = input.messages.filter((m) => {
    return new Date(m.sentAt).getTime() >= ninetyDaysAgo
  })

  // Sort by most recent first
  const messages = [...recentMessages].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  )

  // Take up to maxMessages
  const sampled = messages.slice(0, RISK_EVALUATOR_CONFIG.maxMessages)

  return sampled.map((m) => {
    const sender = m.direction === 'user' ? 'User' : 'Match'
    const timestamp = new Date(m.sentAt).toISOString().split('T')[0]
    return `[${timestamp}] ${sender}: ${m.body}`
  })
}

/**
 * Determine trigger reason based on Safety Screener output
 */
function getTriggerReason(input: EvaluatorInput): string {
  const { safetyScreener } = input
  const reasons: string[] = []

  if (safetyScreener.riskLevel === 'red') {
    reasons.push('Critical safety risk detected')
  } else if (safetyScreener.riskLevel === 'orange') {
    reasons.push('Moderate safety concerns detected')
  } else if (safetyScreener.riskLevel === 'yellow') {
    reasons.push('Minor safety concerns detected')
  }

  if (safetyScreener.redFlags.length > 0) {
    const flagTypes = safetyScreener.redFlags.map((f) => f.type).join(', ')
    reasons.push(`Red flags: ${flagTypes}`)
  }

  return reasons.join('; ') || 'Safety screening escalation'
}

/**
 * Analyze risk using GPT-4
 */
async function analyzeRisk(
  client: OpenAI,
  sampledMessages: string[],
  safetyScreener: EvaluatorInput['safetyScreener']
): Promise<{
  manipulationTactics: RiskEvaluatorOutput['manipulationTactics']
  coerciveControl: RiskEvaluatorOutput['coerciveControl']
  traumaBonding: RiskEvaluatorOutput['traumaBonding']
  summary: string
  recommendations: string[]
}> {
  const prompt = `You are a relationship safety expert specializing in identifying manipulation, abuse patterns, and coercive control. Conduct a deep safety analysis of these dating conversations.

SAFETY SCREENING CONTEXT:
- Risk Level: ${safetyScreener.riskLevel}
- Red Flags Detected: ${safetyScreener.redFlags.length > 0 ? safetyScreener.redFlags.map((f) => `${f.type} (${f.severity})`).join(', ') : 'None'}
- Initial Summary: ${safetyScreener.summary}

MESSAGES TO ANALYZE (most recent first):
${sampledMessages.join('\n')}

Conduct an advanced risk assessment focusing on:

1. ADVANCED MANIPULATION TACTICS:
   - DARVO (Deny, Attack, Reverse Victim & Offender)
   - Gaslighting (making someone doubt their reality)
   - Love bombing (excessive early affection to create dependence)
   - Triangulation (involving third parties to create jealousy/insecurity)
   - Projection (attributing one's own negative behaviors to the other)
   - Isolation (cutting off from friends, family, support)
   - Financial control (controlling money access, creating dependence)

For each tactic found:
- Assess severity (medium, high, critical)
- Identify pattern frequency (isolated, occasional, frequent, consistent)
- Provide specific examples from messages
- Describe the pattern in detail

2. COERCIVE CONTROL PATTERNS:
   - Does the match attempt to control the user's behavior, choices, or life?
   - Tactics: monitoring, restricting activities, controlling decisions, creating dependence
   - Severity: low, medium, high, critical
   - Provide evidence

3. TRAUMA BONDING INDICATORS:
   - Cycle of idealization → devaluation → discard present?
   - Intermittent reinforcement (inconsistent affection creating dependence)?
   - Evidence of trauma bond forming?
   - Specific indicators

4. SAFETY RECOMMENDATIONS:
   - Specific, actionable steps for the user
   - Resources or considerations
   - What to watch for

IMPORTANT:
- Only flag tactics that have clear evidence in the messages
- Consider context - isolated incidents vs consistent patterns
- Focus on the match's behavior toward the user, not the user's responses
- Be specific with examples and patterns
- Err on the side of caution for safety

Respond in JSON format:
{
  "manipulationTactics": [
    {
      "type": "DARVO|gaslighting|love-bombing|triangulation|projection|isolation|financial-control",
      "severity": "medium|high|critical",
      "description": "detailed description of the tactic",
      "examples": ["specific example 1", "specific example 2"],
      "pattern": "isolated|occasional|frequent|consistent"
    }
  ],
  "coerciveControl": {
    "detected": true|false,
    "tactics": ["specific tactic 1", "specific tactic 2"],
    "severity": "low|medium|high|critical",
    "evidence": ["evidence 1", "evidence 2"]
  },
  "traumaBonding": {
    "detected": true|false,
    "indicators": ["indicator 1", "indicator 2"],
    "cycleDetected": true|false,
    "evidence": ["evidence 1", "evidence 2"]
  },
  "summary": "detailed safety analysis summary with key concerns",
  "recommendations": ["specific recommendation 1", "specific recommendation 2"]
}`

  const response = await client.chat.completions.create({
    model: RISK_EVALUATOR_CONFIG.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: RISK_EVALUATOR_CONFIG.temperature,
    response_format: { type: 'json_object' },
    stream: false,
  })

  const content = response.choices[0].message.content || '{}'
  const result = JSON.parse(content)

  return {
    manipulationTactics: result.manipulationTactics || [],
    coerciveControl: result.coerciveControl || {
      detected: false,
      tactics: [],
      severity: 'low',
      evidence: [],
    },
    traumaBonding: result.traumaBonding || {
      detected: false,
      indicators: [],
      cycleDetected: false,
      evidence: [],
    },
    summary: result.summary || 'Risk analysis completed',
    recommendations: result.recommendations || [],
  }
}

/**
 * Determine if Crisis Evaluator should be triggered
 */
function shouldEscalateToCrisisEvaluator(
  safetyScreener: EvaluatorInput['safetyScreener'],
  manipulationTactics: RiskEvaluatorOutput['manipulationTactics'],
  coerciveControl: RiskEvaluatorOutput['coerciveControl']
): boolean {
  // Trigger on orange or red risk from initial screening
  if (safetyScreener.riskLevel === 'orange' || safetyScreener.riskLevel === 'red') {
    return true
  }

  // Trigger if critical severity manipulation tactics found
  if (manipulationTactics.some((t) => t.severity === 'critical')) {
    return true
  }

  // Trigger if high or critical coercive control detected
  if (coerciveControl.detected && (coerciveControl.severity === 'high' || coerciveControl.severity === 'critical')) {
    return true
  }

  // Trigger if consistent manipulation patterns (not isolated)
  const consistentPatterns = manipulationTactics.filter(
    (t) => t.pattern === 'frequent' || t.pattern === 'consistent'
  )
  if (consistentPatterns.length >= 2) {
    return true
  }

  return false
}

/**
 * Run Risk Evaluator
 *
 * @param input - Evaluator input including analyzer results
 * @returns Risk evaluation with manipulation analysis and crisis flags
 */
export async function runRiskEvaluator(
  input: EvaluatorInput
): Promise<RiskEvaluatorOutput> {
  const startTime = Date.now()

  // 1. Get trigger reason
  const triggerReason = getTriggerReason(input)

  // 2. Sample messages for analysis
  const sampledMessages = sampleMessagesForRiskAnalysis(input)

  // 3. Create OpenRouter client
  const client = createOpenRouterClient({
    apiKey: getOpenRouterApiKey(),
    siteUrl: getOpenRouterSiteUrl(),
    appName: getOpenRouterAppName(),
  })

  // 4. Analyze risk with AI
  const aiResult = await analyzeRisk(client, sampledMessages, input.safetyScreener)

  // 5. Determine crisis escalation
  const escalateToCrisisEvaluator = shouldEscalateToCrisisEvaluator(
    input.safetyScreener,
    aiResult.manipulationTactics,
    aiResult.coerciveControl
  )

  const endTime = Date.now()

  // Calculate total message content for cost estimation
  const totalContent = sampledMessages.join('')

  return {
    evaluator: 'risk-evaluator',
    manipulationTactics: aiResult.manipulationTactics,
    coerciveControl: aiResult.coerciveControl,
    traumaBonding: aiResult.traumaBonding,
    escalateToCrisisEvaluator,
    summary: aiResult.summary,
    recommendations: aiResult.recommendations,
    metadata: {
      evaluatedAt: new Date().toISOString(),
      durationMs: endTime - startTime,
      model: RISK_EVALUATOR_CONFIG.model,
      tokensUsed: {
        input: totalContent.length / 4,
        output: 1500,
      },
      // GPT-4 cost: $0.03/1K input, $0.06/1K output
      costUsd: (totalContent.length / 4 / 1000) * 0.03 + (1500 / 1000) * 0.06,
      triggerReason,
    },
  }
}

/**
 * Export for testing
 */
export const _testing = {
  sampleMessagesForRiskAnalysis,
  getTriggerReason,
  shouldEscalateToCrisisEvaluator,
  RISK_EVALUATOR_CONFIG,
}
