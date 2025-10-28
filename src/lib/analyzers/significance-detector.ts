/**
 * Significance Detector
 *
 * Identifies and flags conversations that are meaningful based on key indicators:
 * 1. Led to a date
 * 2. Contact info exchange
 * 3. Unusually long conversation
 * 4. Emotionally deep or charged
 *
 * Uses AI-powered analysis for accurate detection.
 */

import type OpenAI from 'openai'
import type { NormalizedMessage } from '@/types/data-model'
import { createOpenRouterClient } from '../ai/openrouter-client'
import { getOpenRouterApiKey, getOpenRouterSiteUrl, getOpenRouterAppName } from '../ai/config'

/**
 * Significance flags for a conversation
 */
export interface SignificanceFlags {
  /** Conversation appears to have led to a date */
  ledToDate: boolean
  /** Match provided contact information (phone, social media) */
  contactExchange: boolean
  /** Conversation was unusually long compared to average */
  unusualLength: boolean
  /** Conversation was emotionally deep or charged */
  emotionalDepth: boolean
}

/**
 * Duration information for a conversation
 */
export interface ConversationDuration {
  /** Number of days the conversation spanned */
  days: number
  /** ISO timestamp of first message */
  firstMessage: string
  /** ISO timestamp of last message */
  lastMessage: string
}

/**
 * A conversation grouped by match
 */
export interface Conversation {
  /** Match ID */
  matchId: string
  /** Participant ID (the other person) */
  participantId: string
  /** All messages in this conversation */
  messages: NormalizedMessage[]
}

/**
 * A significant conversation with analysis results
 */
export interface SignificantConversation {
  /** Match ID */
  matchId: string
  /** Participant ID */
  participantId: string
  /** Number of messages in conversation */
  messageCount: number
  /** Conversation duration */
  duration: ConversationDuration
  /** Significance flags */
  significanceFlags: SignificanceFlags
  /** Overall significance score (0-100) */
  significanceScore: number
  /** Key moments or highlights from the conversation */
  highlights: string[]
  /** Brief explanation of why this conversation is significant */
  reasoning: string
}

/**
 * Result of significance analysis
 */
export interface SignificanceAnalysisResult {
  /** All significant conversations found */
  significantConversations: SignificantConversation[]
  /** Statistics about significant conversations */
  statistics: {
    /** Total number of significant conversations */
    totalSignificant: number
    /** Breakdown by significance type */
    breakdown: {
      ledToDate: number
      contactExchange: number
      unusualLength: number
      emotionalDepth: number
    }
    /** Percentage of total conversations that are significant */
    percentageSignificant: number
    /** Average message count for significant conversations */
    avgMessageCount: number
    /** Average message count for all conversations */
    avgMessageCountAll: number
  }
}

/**
 * Calculate conversation duration
 */
function calculateDuration(messages: NormalizedMessage[]): ConversationDuration {
  if (messages.length === 0) {
    return {
      days: 0,
      firstMessage: new Date().toISOString(),
      lastMessage: new Date().toISOString(),
    }
  }

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  )

  const first = new Date(sortedMessages[0].sentAt)
  const last = new Date(sortedMessages[sortedMessages.length - 1].sentAt)
  const days = Math.ceil((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24))

  return {
    days: Math.max(0, days),
    firstMessage: sortedMessages[0].sentAt,
    lastMessage: sortedMessages[sortedMessages.length - 1].sentAt,
  }
}

/**
 * Group messages by match ID into conversations
 */
export function groupMessagesByMatch(
  messages: NormalizedMessage[],
  userId: string
): Conversation[] {
  const conversationMap = new Map<string, NormalizedMessage[]>()

  for (const message of messages) {
    const existing = conversationMap.get(message.matchId) || []
    existing.push(message)
    conversationMap.set(message.matchId, existing)
  }

  const conversations: Conversation[] = []

  for (const [matchId, msgs] of conversationMap.entries()) {
    // Determine participant ID (the person who isn't the user)
    const participantId =
      msgs.find((m) => m.senderId !== userId)?.senderId || `participant_${matchId}`

    conversations.push({
      matchId,
      participantId,
      messages: msgs,
    })
  }

  return conversations
}

/**
 * Analyze a single conversation for significance using AI
 */
async function analyzeConversationSignificance(
  client: OpenAI,
  conversation: Conversation,
  avgMessageCount: number
): Promise<SignificantConversation | null> {
  const { matchId, participantId, messages } = conversation

  // Skip very short conversations (less than 3 messages)
  if (messages.length < 3) {
    return null
  }

  const duration = calculateDuration(messages)

  // Prepare conversation sample for AI analysis
  // Take first 5, middle 5, and last 5 messages for context (max 15 messages)
  const sampleMessages = getSampleMessages(messages, 15)
  const conversationText = sampleMessages
    .map((m, idx) => {
      const sender = m.direction === 'user' ? 'User' : 'Match'
      return `[${idx + 1}] ${sender}: ${m.body}`
    })
    .join('\n')

  const prompt = `You are analyzing a dating app conversation to determine if it's significant. A conversation is significant if it meets any of these criteria:

1. **Led to Date**: The conversation shows clear evidence of planning or agreeing to meet in person
2. **Contact Exchange**: One person shared their phone number, Instagram, Snapchat, or other contact info
3. **Unusual Length**: The conversation is significantly longer than average (this one has ${messages.length} messages, average is ${avgMessageCount.toFixed(1)})
4. **Emotional Depth**: The conversation involves vulnerability, deep questions, personal stories, or emotional intimacy

Analyze this conversation snippet (${sampleMessages.length} of ${messages.length} total messages, spanning ${duration.days} days):

${conversationText}

Respond in JSON format ONLY:
{
  "isSignificant": boolean,
  "flags": {
    "ledToDate": boolean,
    "contactExchange": boolean,
    "unusualLength": boolean,
    "emotionalDepth": boolean
  },
  "score": number (0-100),
  "highlights": string[] (up to 3 key moments, brief quotes or descriptions),
  "reasoning": string (1-2 sentences explaining why this is significant)
}

If the conversation is NOT significant, return:
{
  "isSignificant": false,
  "flags": { "ledToDate": false, "contactExchange": false, "unusualLength": false, "emotionalDepth": false },
  "score": 0,
  "highlights": [],
  "reasoning": "Not significant"
}`

  try {
    const response = await client.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 300,
    })

    const content = response.choices[0].message.content?.trim()
    if (!content) {
      return null
    }

    // Parse JSON response
    const result = JSON.parse(content)

    // If not significant, return null
    if (!result.isSignificant) {
      return null
    }

    return {
      matchId,
      participantId,
      messageCount: messages.length,
      duration,
      significanceFlags: result.flags,
      significanceScore: result.score,
      highlights: result.highlights || [],
      reasoning: result.reasoning || 'Conversation shows significant engagement',
    }
  } catch (error) {
    console.error(`Failed to analyze conversation ${matchId}:`, error)
    // Fallback: Check if unusually long
    const isUnusuallyLong = messages.length >= avgMessageCount * 2 && messages.length >= 20
    if (isUnusuallyLong) {
      return {
        matchId,
        participantId,
        messageCount: messages.length,
        duration,
        significanceFlags: {
          ledToDate: false,
          contactExchange: false,
          unusualLength: true,
          emotionalDepth: false,
        },
        significanceScore: 50,
        highlights: [`Extended conversation with ${messages.length} messages over ${duration.days} days`],
        reasoning: 'Unusually long conversation compared to average',
      }
    }
    return null
  }
}

/**
 * Get a representative sample of messages from a conversation
 * Takes messages from beginning, middle, and end
 */
function getSampleMessages(messages: NormalizedMessage[], maxCount: number): NormalizedMessage[] {
  if (messages.length <= maxCount) {
    return messages
  }

  const sorted = [...messages].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  )

  const perSection = Math.floor(maxCount / 3)
  const beginning = sorted.slice(0, perSection)
  const middleStart = Math.floor(sorted.length / 2) - Math.floor(perSection / 2)
  const middle = sorted.slice(middleStart, middleStart + perSection)
  const end = sorted.slice(-perSection)

  return [...beginning, ...middle, ...end]
}

/**
 * Analyze all conversations and detect significant ones
 *
 * @param messages - All messages from the dataset
 * @param userId - The user's ID
 * @returns Significance analysis result with significant conversations and statistics
 */
export async function detectSignificantConversations(
  messages: NormalizedMessage[],
  userId: string
): Promise<SignificanceAnalysisResult> {
  console.log('\n🔍 Detecting significant conversations...')
  const startTime = Date.now()

  // Group messages into conversations
  const conversations = groupMessagesByMatch(messages, userId)
  console.log(`   Found ${conversations.length} total conversations`)

  // Calculate average message count
  const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0)
  const avgMessageCount = conversations.length > 0 ? totalMessages / conversations.length : 0

  console.log(`   Average messages per conversation: ${avgMessageCount.toFixed(1)}`)

  // Create OpenAI client
  const client = createOpenRouterClient({
    apiKey: getOpenRouterApiKey(),
    siteUrl: getOpenRouterSiteUrl(),
    appName: getOpenRouterAppName(),
  })

  // Analyze conversations in batches to avoid rate limits
  const batchSize = 5
  const significantConversations: SignificantConversation[] = []

  console.log(`   Analyzing conversations in batches of ${batchSize}...`)

  for (let i = 0; i < conversations.length; i += batchSize) {
    const batch = conversations.slice(i, i + batchSize)
    const batchPromises = batch.map((conv) =>
      analyzeConversationSignificance(client, conv, avgMessageCount)
    )

    const batchResults = await Promise.all(batchPromises)
    const validResults = batchResults.filter((r): r is SignificantConversation => r !== null)
    significantConversations.push(...validResults)

    console.log(
      `   Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(conversations.length / batchSize)}: Found ${validResults.length} significant`
    )

    // Small delay to avoid rate limiting
    if (i + batchSize < conversations.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  // Calculate statistics
  const breakdown = {
    ledToDate: significantConversations.filter((c) => c.significanceFlags.ledToDate).length,
    contactExchange: significantConversations.filter((c) => c.significanceFlags.contactExchange)
      .length,
    unusualLength: significantConversations.filter((c) => c.significanceFlags.unusualLength).length,
    emotionalDepth: significantConversations.filter((c) => c.significanceFlags.emotionalDepth)
      .length,
  }

  const avgSignificantMessages =
    significantConversations.length > 0
      ? significantConversations.reduce((sum, c) => sum + c.messageCount, 0) /
        significantConversations.length
      : 0

  const percentageSignificant =
    conversations.length > 0 ? (significantConversations.length / conversations.length) * 100 : 0

  const duration = Date.now() - startTime
  console.log(`✅ Significance detection complete in ${duration}ms`)
  console.log(`   Found ${significantConversations.length} significant conversations`)
  console.log(`   Breakdown: ${breakdown.ledToDate} dates, ${breakdown.contactExchange} contact exchanges, ${breakdown.unusualLength} long, ${breakdown.emotionalDepth} emotional`)

  return {
    significantConversations,
    statistics: {
      totalSignificant: significantConversations.length,
      breakdown,
      percentageSignificant,
      avgMessageCount: avgSignificantMessages,
      avgMessageCountAll: avgMessageCount,
    },
  }
}
