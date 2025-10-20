/**
 * Stage 2 Comprehensive Analyzer
 *
 * Deep analysis for orange/red risk cases identified by Stage 1.
 * Combines safety deep dive, attachment analysis, and growth trajectory
 * in ONE comprehensive API call using GPT-4 Turbo.
 *
 * This analyzer runs for ~20% of users who need detailed insights.
 */

import type OpenAI from 'openai'
import type { Stage2Input, Stage2ComprehensiveOutput } from './stage2-types'
import { createOpenRouterClient } from '../ai/openrouter-client'
import { getOpenRouterApiKey, getOpenRouterSiteUrl, getOpenRouterAppName } from '../ai/config'

/**
 * Stage 2 analyzer configuration
 */
const STAGE2_CONFIG = {
  /** Model for comprehensive analysis */
  model: 'openai/gpt-5',
  /** Temperature for balanced creativity and accuracy */
  temperature: 0.3,
  /** Maximum messages to analyze */
  maxMessages: 500,
  /** Minimum months for growth trajectory analysis */
  minMonthsForGrowth: 18,
}

/**
 * Sample messages for comprehensive analysis
 * Takes more messages than Stage 1 for deeper context
 */
function sampleMessagesForStage2(input: Stage2Input): string[] {
  // Sort by most recent first
  const messages = [...input.messages].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  )

  // Take up to maxMessages
  const sampled = messages.slice(0, STAGE2_CONFIG.maxMessages)

  return sampled.map((m) => {
    const sender = m.direction === 'user' ? 'User' : 'Match'
    const timestamp = new Date(m.sentAt).toISOString().split('T')[0] // YYYY-MM-DD
    return `[${timestamp}] ${sender}: ${m.body}`
  })
}

/**
 * Calculate time range in months
 */
function calculateTimeRangeMonths(input: Stage2Input): number {
  if (input.messages.length === 0) return 0

  const timestamps = input.messages.map((m) => new Date(m.sentAt).getTime())
  const earliest = Math.min(...timestamps)
  const latest = Math.max(...timestamps)
  const diffMs = latest - earliest
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44) // Average month length

  return Math.round(diffMonths)
}

/**
 * Build comprehensive analysis prompt
 */
function buildComprehensivePrompt(
  input: Stage2Input,
  sampledMessages: string[],
  timeRangeMonths: number
): string {
  const { stage1Results } = input

  return `You are a highly experienced relationship psychologist and safety expert with deep knowledge of attachment theory, manipulation tactics, and healthy relationship dynamics. You are conducting a comprehensive analysis of dating app conversations.

STAGE 1 CONTEXT:
The initial safety screening identified: ${stage1Results.riskLevel.toUpperCase()} RISK LEVEL
Stage 1 Summary: ${stage1Results.summary}
Red Flags Detected: ${stage1Results.redFlags.length > 0 ? stage1Results.redFlags.map((f) => f.type).join(', ') : 'None'}

CONVERSATION DATA (${sampledMessages.length} messages over ${timeRangeMonths} months):
${sampledMessages.join('\n')}

Conduct a COMPREHENSIVE analysis covering three key areas:

1. SAFETY DEEP DIVE
Analyze for advanced manipulation tactics and concerning patterns:
- DARVO (Deny, Attack, Reverse Victim & Offender)
- Gaslighting (reality distortion, making User question their perception)
- Love-bombing (excessive affection followed by withdrawal)
- Triangulation (involving third parties to create jealousy/insecurity)
- Projection (attributing own negative traits to User)
- Isolation tactics (separating User from support systems)
- Financial control (requests, pressure, or manipulation involving money)
- Emotional blackmail (threats to harm self or relationship unless demands met)

Assess coercive control patterns:
- Controlling behavior escalation
- Boundary violations
- Demands for compliance
- Punishment for independence

Identify trauma bonding:
- Cycle of tension → incident → reconciliation → calm
- Intermittent reinforcement patterns
- User defending Match despite concerning behavior

Determine crisis level and recommend professional resources if needed.

2. ATTACHMENT ANALYSIS
Determine User's attachment style based on conversation patterns:
- Secure: Comfortable with intimacy and independence, clear boundaries, effective communication
- Anxious: Fear of abandonment, seeks constant reassurance, struggles with trust
- Avoidant: Discomfort with closeness, values independence highly, emotional distance
- Fearful-Avoidant: Desires intimacy but fears vulnerability, push-pull dynamics
- Mixed: Shows characteristics of multiple styles

Identify specific triggers and coping mechanisms:
- What situations activate attachment responses?
- How does User respond (healthy vs unhealthy coping)?
- Patterns in relationship dynamics

Assess relationship dynamics for both healthy and concerning aspects.

3. GROWTH TRAJECTORY ${timeRangeMonths >= STAGE2_CONFIG.minMonthsForGrowth ? '(ANALYZE)' : '(SKIP - insufficient data)'}
${
  timeRangeMonths >= STAGE2_CONFIG.minMonthsForGrowth
    ? `Analyze personal development over ${timeRangeMonths} months:
- Communication skills progression
- Boundary-setting evolution
- Emotional regulation improvements
- Self-awareness development
- Relationship pattern changes

Identify specific areas for continued growth and provide personalized recommendations.`
    : 'Skip growth trajectory analysis - less than 18 months of data available.'
}

4. COMPREHENSIVE SYNTHESIS
Weave all insights into a coherent narrative:
- Overall assessment connecting safety, attachment, and growth themes
- Key themes that emerge across all areas of analysis
- Prioritized insights by importance and actionability
- Evidence-based recommendations with clear rationale
- Professional support resources if safety concerns exist

Respond in JSON format with this structure:
{
  "safetyDeepDive": {
    "manipulationTactics": [
      {
        "type": "DARVO|gaslighting|love-bombing|triangulation|projection|isolation|financial-control|emotional-blackmail",
        "severity": "low|medium|high",
        "description": "detailed description of the tactic",
        "examples": ["specific example 1", "specific example 2"],
        "pattern": "how it manifests over time"
      }
    ],
    "coerciveControl": {
      "detected": boolean,
      "patterns": ["pattern 1", "pattern 2"],
      "examples": ["example 1", "example 2"],
      "escalation": "none|gradual|rapid"
    },
    "traumaBonding": {
      "detected": boolean,
      "indicators": ["indicator 1", "indicator 2"],
      "cyclePhases": [
        {
          "phase": "tension-building|incident|reconciliation|calm",
          "description": "description of this phase",
          "examples": ["example 1", "example 2"]
        }
      ]
    },
    "crisisLevel": "none|low|moderate|high|critical",
    "recommendedResources": [
      {
        "type": "therapist|domestic-violence-advocate|crisis-hotline|legal-aid",
        "priority": "immediate|high|medium",
        "rationale": "why this resource is recommended"
      }
    ]
  },
  "attachmentAnalysis": {
    "primaryStyle": "secure|anxious|avoidant|fearful-avoidant|mixed",
    "confidence": 0.0-1.0,
    "evidence": ["evidence 1", "evidence 2", "evidence 3"],
    "triggers": [
      {
        "trigger": "what triggers the attachment response",
        "response": "how User responds",
        "healthiness": "healthy|neutral|concerning",
        "examples": ["example 1", "example 2"]
      }
    ],
    "copingMechanisms": [
      {
        "mechanism": "the coping mechanism",
        "effectiveness": "helpful|neutral|harmful",
        "frequency": "rare|occasional|frequent|constant",
        "examples": ["example 1", "example 2"]
      }
    ],
    "relationshipDynamics": {
      "patterns": ["pattern 1", "pattern 2"],
      "healthyAspects": ["healthy aspect 1", "healthy aspect 2"],
      "concerningAspects": ["concerning aspect 1", "concerning aspect 2"],
      "recommendations": ["recommendation 1", "recommendation 2"]
    }
  },
  ${
    timeRangeMonths >= STAGE2_CONFIG.minMonthsForGrowth
      ? `"growthTrajectory": {
    "detected": boolean,
    "timeRangeMonths": ${timeRangeMonths},
    "direction": "improving|declining|stable|fluctuating",
    "skillsImproved": [
      {
        "skill": "the skill that improved",
        "improvement": "significant|moderate|slight",
        "evidence": ["evidence 1", "evidence 2"]
      }
    ],
    "growthOpportunities": [
      {
        "area": "area for growth",
        "priority": "high|medium|low",
        "recommendations": ["recommendation 1", "recommendation 2"]
      }
    ],
    "developmentInsights": ["insight 1", "insight 2", "insight 3"]
  },`
      : '"growthTrajectory": null,'
  }
  "synthesis": {
    "overallSummary": "comprehensive summary connecting all analysis areas",
    "keyThemes": ["theme 1", "theme 2", "theme 3"],
    "prioritizedInsights": [
      {
        "insight": "the key insight",
        "category": "safety|attachment|growth|general",
        "importance": "critical|high|medium",
        "actionable": boolean
      }
    ],
    "recommendations": [
      {
        "recommendation": "specific recommendation",
        "rationale": "why this is important",
        "priority": "immediate|high|medium|low",
        "category": "safety|personal-growth|relationship-patterns|professional-support"
      }
    ]
  }
}

IMPORTANT:
- Be compassionate but honest in your assessment
- Prioritize safety concerns - if there are serious red flags, say so clearly
- Provide specific, actionable insights with evidence
- Balance validation with constructive growth opportunities
- If recommending professional support, explain why and what type
- Consider cultural and contextual factors in your analysis`
}

/**
 * Analyze with GPT-4 Turbo
 */
async function analyzeWithGPT4Turbo(
  client: OpenAI,
  prompt: string
): Promise<Omit<Stage2ComprehensiveOutput, 'analyzer' | 'metadata'>> {
  const response = await client.chat.completions.create({
    model: STAGE2_CONFIG.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: STAGE2_CONFIG.temperature,
    response_format: { type: 'json_object' },
    stream: false,
  })

  const content = response.choices[0].message.content || '{}'
  const result = JSON.parse(content)

  return {
    safetyDeepDive: result.safetyDeepDive || {
      manipulationTactics: [],
      coerciveControl: { detected: false, patterns: [], examples: [], escalation: 'none' },
      traumaBonding: { detected: false, indicators: [], cyclePhases: [] },
      crisisLevel: 'none',
      recommendedResources: [],
    },
    attachmentAnalysis: result.attachmentAnalysis || {
      primaryStyle: 'mixed',
      confidence: 0,
      evidence: [],
      triggers: [],
      copingMechanisms: [],
      relationshipDynamics: {
        patterns: [],
        healthyAspects: [],
        concerningAspects: [],
        recommendations: [],
      },
    },
    growthTrajectory: result.growthTrajectory || null,
    synthesis: result.synthesis || {
      overallSummary: 'Comprehensive analysis completed',
      keyThemes: [],
      prioritizedInsights: [],
      recommendations: [],
    },
  }
}

/**
 * Run Stage 2 Comprehensive Analyzer
 *
 * @param input - Normalized dataset with Stage 1 results
 * @returns Comprehensive deep analysis
 */
export async function runStage2Comprehensive(
  input: Stage2Input
): Promise<Stage2ComprehensiveOutput> {
  const startTime = Date.now()

  // 1. Sample messages for analysis
  const sampledMessages = sampleMessagesForStage2(input)

  // 2. Calculate time range for growth trajectory
  const timeRangeMonths = calculateTimeRangeMonths(input)

  // 3. Build comprehensive prompt
  const prompt = buildComprehensivePrompt(input, sampledMessages, timeRangeMonths)

  // 4. Create OpenRouter client
  const client = createOpenRouterClient({
    apiKey: getOpenRouterApiKey(),
    siteUrl: getOpenRouterSiteUrl(),
    appName: getOpenRouterAppName(),
  })

  // 5. Analyze with GPT-4 Turbo
  const analysis = await analyzeWithGPT4Turbo(client, prompt)

  const endTime = Date.now()

  // 6. Estimate tokens and cost
  const inputTokens = (prompt.length + sampledMessages.join('').length) / 4
  const outputTokens = JSON.stringify(analysis).length / 4

  return {
    analyzer: 'stage2-comprehensive',
    safetyDeepDive: analysis.safetyDeepDive,
    attachmentAnalysis: analysis.attachmentAnalysis,
    growthTrajectory: analysis.growthTrajectory,
    synthesis: analysis.synthesis,
    metadata: {
      analyzedAt: new Date().toISOString(),
      durationMs: endTime - startTime,
      model: STAGE2_CONFIG.model,
      tokensUsed: {
        input: Math.round(inputTokens),
        output: Math.round(outputTokens),
      },
      // GPT-4 Turbo pricing: $0.01/1K input, $0.03/1K output
      costUsd: (inputTokens / 1000) * 0.01 + (outputTokens / 1000) * 0.03,
    },
  }
}

/**
 * Export for testing
 */
export const _testing = {
  sampleMessagesForStage2,
  calculateTimeRangeMonths,
  buildComprehensivePrompt,
}
