/**
 * Safety Screener Analyzer
 *
 * Foundation analyzer that always runs to assess basic safety and detect red flags.
 * Uses GPT-5 for high-quality safety assessment.
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
  /** Model to use for safety screening */
  model: 'openai/gpt-5',
  /** Temperature for consistent safety assessment */
  temperature: 0.2,
  /** Maximum conversations/matches to analyze (for cost control) */
  maxConversations: 200,
  /** Maximum messages per conversation to include */
  maxMessagesPerConversation: 50,
  /** Sample recent conversations more heavily */
  recentConversationWeight: 0.7,
  /** Maximum tokens per chunk (leave room for system prompt + response) */
  maxTokensPerChunk: 100000, // GPT-5 has large context, leave plenty for system prompt + response
  /** Rough estimate: 4 characters per token */
  charsPerToken: 4,
}

/**
 * Get the most recent message timestamp for a match/conversation
 */
function getConversationLastMessageTime(matchId: string, messages: AnalyzerInput['messages']): number {
  const conversationMessages = messages.filter(m => m.matchId === matchId)
  if (conversationMessages.length === 0) return 0

  const timestamps = conversationMessages.map(m => new Date(m.sentAt).getTime())
  return Math.max(...timestamps)
}

/**
 * Sample conversations for analysis, prioritizing recent ones
 * Analyzes up to maxConversations most recent conversations
 */
function sampleConversations(input: AnalyzerInput, maxConversations: number): {
  sampledMessages: string[]
  conversationCount: number
  totalMessageCount: number
} {
  // Group messages by match/conversation
  const messagesByMatch = new Map<string, AnalyzerInput['messages']>()

  for (const message of input.messages) {
    const matchId = message.matchId
    if (!messagesByMatch.has(matchId)) {
      messagesByMatch.set(matchId, [])
    }
    messagesByMatch.get(matchId)!.push(message)
  }

  // Sort conversations by most recent activity
  const sortedConversations = Array.from(messagesByMatch.entries())
    .map(([matchId, messages]) => ({
      matchId,
      messages,
      lastMessageTime: getConversationLastMessageTime(matchId, messages),
      messageCount: messages.length,
    }))
    .sort((a, b) => b.lastMessageTime - a.lastMessageTime)

  // Take the most recent conversations
  const conversationsToAnalyze = sortedConversations.slice(0, maxConversations)

  // Sample messages from each conversation
  const sampledMessages: string[] = []
  let totalMessageCount = 0

  for (const conversation of conversationsToAnalyze) {
    // Sort messages in this conversation by time
    const sortedMessages = [...conversation.messages].sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    )

    // Take up to maxMessagesPerConversation, prioritizing recent ones
    const messagesToInclude = sortedMessages.slice(-SAFETY_SCREENER_CONFIG.maxMessagesPerConversation)
    totalMessageCount += messagesToInclude.length

    // Add conversation header
    sampledMessages.push(`\n--- Conversation ${conversationsToAnalyze.indexOf(conversation) + 1} (${messagesToInclude.length} messages) ---`)

    // Add messages
    for (const message of messagesToInclude) {
      const sender = message.direction === 'user' ? 'User' : 'Match'
      sampledMessages.push(`${sender}: ${message.body}`)
    }
  }

  return {
    sampledMessages,
    conversationCount: conversationsToAnalyze.length,
    totalMessageCount,
  }
}

/**
 * Split messages into chunks that fit within token limits
 */
function chunkMessages(
  messages: string[],
  maxTokens: number
): string[][] {
  const chunks: string[][] = []
  let currentChunk: string[] = []
  let currentTokenCount = 0

  for (const message of messages) {
    const messageTokens = Math.ceil(message.length / SAFETY_SCREENER_CONFIG.charsPerToken)

    // If adding this message would exceed the limit, start a new chunk
    if (currentTokenCount + messageTokens > maxTokens && currentChunk.length > 0) {
      chunks.push(currentChunk)
      currentChunk = []
      currentTokenCount = 0
    }

    currentChunk.push(message)
    currentTokenCount += messageTokens
  }

  // Add the last chunk if it has messages
  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  return chunks
}

/**
 * Format messages for AI prompt
 */
function formatMessagesForPrompt(sampledMessages: string[]): string {
  return sampledMessages.join('\n')
}

/**
 * Analyze a single chunk of messages
 */
async function analyzeMessageChunk(
  client: OpenAI,
  messages: string[],
  chunkIndex: number,
  totalChunks: number
): Promise<{
  riskLevel: RiskLevel
  redFlags: SafetyScreenerOutput['redFlags']
  greenFlags: string[]
  summary: string
}> {
  const chunkInfo = totalChunks > 1 ? ` (analyzing chunk ${chunkIndex + 1} of ${totalChunks})` : ''
  const prompt = `You are a relationship safety expert analyzing dating app messages. Your goal is to identify SERIOUS safety concerns only - not relationship incompatibilities or minor awkwardness${chunkInfo}.

Messages to analyze:
${formatMessagesForPrompt(messages)}

IMPORTANT: This is a SAFETY screening, NOT relationship advice. You are looking for SERIOUS safety issues that could indicate danger, abuse, or exploitation. Normal dating awkwardness, mild flirting, or typical relationship issues are NOT safety concerns.

ONLY flag these SERIOUS red flags:

1. THREATS: Direct or clear threats of violence, harm, stalking, revenge, blackmail
   - NOT: Frustration, disappointment, or normal conflict
   - YES: "I know where you live and I'm coming over", "I'll ruin your life", "You'll regret this"

2. FINANCIAL SCAMS: Clear patterns of requesting money, investment schemes, financial exploitation
   - NOT: Splitting bills, casual Venmo requests between friends, one-time emergency
   - YES: Multiple requests for money, investment schemes, loan requests, sob stories for cash

3. SEVERE MANIPULATION: Extreme gaslighting, DARVO, emotional abuse patterns, coercive control
   - NOT: Guilt about plans changing, normal persuasion, expressing hurt feelings
   - YES: Systematic denial of reality, blaming victim for abuse, isolating from friends/family

4. SEXUAL COERCION: Pressuring for sex/nudes after clear refusal, ignoring consent, sexual threats
   - NOT: Expressing sexual interest, flirting, asking once respectfully
   - YES: Persistent demands after "no", threats if they don't comply, sending unsolicited explicit content

5. IDENTITY DECEPTION: Major lies about identity, catfishing, scam profiles
   - NOT: White lies about height/age, exaggerated interests, normal dating embellishment
   - YES: Fake photos, lying about marital status, scam artist persona

CRITICAL: Be VERY conservative. When in doubt, do NOT flag it. Most dating conversations are GREEN even if awkward.

Context to consider:
- Is this a PATTERN or one isolated comment?
- Did the person stop when asked?
- Is this dangerous or just uncomfortable/incompatible?
- Could this be cultural differences, humor, or miscommunication?

CRITICAL INSTRUCTIONS FOR EXAMPLES:
- EVERY red flag MUST include at least 2 direct quotes from the actual messages above
- Format examples as: 'Your match said "[exact quote from message]"'
- Use they/them pronouns only (never he/she/his/her) since we don't know the match's gender
- Never use the match's name - always say "your match"
- Examples must be REAL quotes from the messages, not paraphrased or summarized
- If you cannot find real examples in the messages, DO NOT include that red flag

Respond in JSON format:
{
  "riskLevel": "green|yellow|orange|red",
  "redFlags": [
    {
      "type": "threat|financial-request|explicit-manipulation|pressure|inconsistency",
      "severity": "low|medium|high",
      "description": "contextual description of the concerning pattern",
      "examples": [
        "Your match said '[exact quote from actual message]'",
        "Your match said '[another exact quote from actual message]'"
      ]
    }
  ],
  "greenFlags": ["positive pattern 1", "positive pattern 2"],
  "summary": "brief safety assessment"
}

Risk level guidelines (BE CONSERVATIVE):
- GREEN: No serious safety concerns (USE THIS FOR 95% OF CASES - normal dating is GREEN!)
- YELLOW: One potential concern that was addressed/stopped (rare - maybe 4% of cases)
- ORANGE: Multiple concerning patterns that need investigation (very rare - maybe 0.9% of cases)
- RED: Clear safety threat requiring immediate attention (extremely rare - maybe 0.1% of cases)

Remember: This is SAFETY screening, not compatibility screening. Most conversations should be GREEN.`

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
 * Aggregate results from multiple chunks
 */
function aggregateChunkResults(
  chunkResults: Array<{
    riskLevel: RiskLevel
    redFlags: SafetyScreenerOutput['redFlags']
    greenFlags: string[]
    summary: string
  }>
): {
  riskLevel: RiskLevel
  redFlags: SafetyScreenerOutput['redFlags']
  greenFlags: string[]
  summary: string
} {
  // Take the highest risk level
  const riskLevels: RiskLevel[] = ['green', 'yellow', 'orange', 'red']
  const maxRiskLevel = chunkResults.reduce((max, result) => {
    const maxIndex = riskLevels.indexOf(max)
    const currentIndex = riskLevels.indexOf(result.riskLevel)
    return currentIndex > maxIndex ? result.riskLevel : max
  }, 'green' as RiskLevel)

  // Combine all red flags (deduplicate by description)
  const allRedFlags = chunkResults.flatMap((r) => r.redFlags)
  const uniqueRedFlags = allRedFlags.reduce((acc, flag) => {
    const exists = acc.some((f) => f.description === flag.description)
    if (!exists) {
      acc.push(flag)
    }
    return acc
  }, [] as SafetyScreenerOutput['redFlags'])

  // Combine all green flags (deduplicate)
  const allGreenFlags = [...new Set(chunkResults.flatMap((r) => r.greenFlags))]

  // Combine summaries
  const combinedSummary =
    chunkResults.length > 1
      ? `Analyzed ${chunkResults.length} message batches. Overall: ${chunkResults.map((r) => r.summary).join(' ')}`
      : chunkResults[0].summary

  return {
    riskLevel: maxRiskLevel,
    redFlags: uniqueRedFlags,
    greenFlags: allGreenFlags,
    summary: combinedSummary,
  }
}

/**
 * Analyze safety using GPT-3.5 Turbo with automatic chunking
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
  // Split into chunks if needed
  const chunks = chunkMessages(sampledMessages, SAFETY_SCREENER_CONFIG.maxTokensPerChunk)

  console.log(`📊 Analyzing messages in ${chunks.length} chunk(s)`)

  // Analyze each chunk
  const chunkResults = await Promise.all(
    chunks.map((chunk, index) => analyzeMessageChunk(client, chunk, index, chunks.length))
  )

  // Aggregate results
  return aggregateChunkResults(chunkResults)
}

/**
 * Determine if Risk Evaluator should be triggered
 */
function shouldEscalateToRiskEvaluator(
  riskLevel: RiskLevel,
  redFlags: SafetyScreenerOutput['redFlags']
): boolean {
  // Only escalate on ORANGE or RED (yellow is too minor)
  if (riskLevel === 'orange' || riskLevel === 'red') {
    return true
  }

  // Escalate if any HIGH severity flags (even if overall level is yellow/green)
  if (redFlags.some((flag) => flag.severity === 'high')) {
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

  // 1. Sample conversations for analysis
  const { sampledMessages, conversationCount, totalMessageCount } = sampleConversations(
    input,
    SAFETY_SCREENER_CONFIG.maxConversations
  )

  // Log data processing details
  console.log(`📊 Safety Screener Data Processing:`)
  console.log(`   Total messages in dataset: ${input.messages.length}`)
  console.log(`   Conversations analyzed: ${conversationCount} most recent`)
  console.log(`   Messages sampled from those conversations: ${totalMessageCount}`)
  console.log(`   Max messages per conversation: ${SAFETY_SCREENER_CONFIG.maxMessagesPerConversation}`)

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
      conversationsAnalyzed: conversationCount,
      messagesAnalyzed: totalMessageCount,
      // Estimate tokens (rough approximation)
      tokensUsed: {
        input: sampledMessages.join('').length / 4,
        output: 500,
      },
      // Estimate cost for GPT-5 (using GPT-4o pricing as estimate: $2.50/1M input, $10.00/1M output)
      costUsd:
        (sampledMessages.join('').length / 4 / 1000000) * 2.5 + (500 / 1000000) * 10.0,
    },
  }
}

/**
 * Export for testing
 */
export const _testing = {
  sampleConversations,
  chunkMessages,
  shouldEscalateToRiskEvaluator,
}
