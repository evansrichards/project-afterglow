/**
 * Demo script for metadata analyzer
 * Run with: npx tsx scripts/demo-metadata.ts
 */

import { analyzeMetadata } from '../src/lib/analyzers/metadata-analyzer'
import type { AnalyzerInput } from '../src/lib/analyzers/types'

// Sample data representing ~2 years of Tinder activity
const sampleData: AnalyzerInput = {
  matches: [
    {
      id: 'match-1',
      platform: 'tinder',
      createdAt: '2020-01-15T10:00:00Z',
      status: 'active',
      participants: ['user-1', 'match-1'],
      attributes: {},
    },
    {
      id: 'match-2',
      platform: 'tinder',
      createdAt: '2020-06-20T14:30:00Z',
      status: 'active',
      participants: ['user-1', 'match-2'],
      attributes: {},
    },
    {
      id: 'match-3',
      platform: 'tinder',
      createdAt: '2020-07-10T09:15:00Z',
      status: 'active',
      participants: ['user-1', 'match-3'],
      attributes: {},
    },
    {
      id: 'match-4',
      platform: 'tinder',
      createdAt: '2020-08-05T16:45:00Z',
      status: 'active',
      participants: ['user-1', 'match-4'],
      attributes: {},
    },
    {
      id: 'match-5',
      platform: 'tinder',
      createdAt: '2022-03-08T11:20:00Z',
      status: 'active',
      participants: ['user-1', 'match-5'],
      attributes: {},
    },
  ],
  messages: [
    // Match 1: Short conversation (3 messages)
    {
      id: 'msg-1',
      matchId: 'match-1',
      senderId: 'user-1',
      sentAt: '2020-01-15T11:00:00Z',
      body: 'Hey! How are you?',
      direction: 'user',
    },
    {
      id: 'msg-2',
      matchId: 'match-1',
      senderId: 'match-1',
      sentAt: '2020-01-15T12:30:00Z',
      body: "I'm good, thanks!",
      direction: 'match',
    },
    {
      id: 'msg-3',
      matchId: 'match-1',
      senderId: 'user-1',
      sentAt: '2020-01-15T13:00:00Z',
      body: "That's great!",
      direction: 'user',
    },
    // Match 2: Active conversation (10 messages)
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `msg-match2-${i}`,
      matchId: 'match-2',
      senderId: i % 2 === 0 ? 'user-1' : 'match-2',
      sentAt: `2020-06-20T${14 + Math.floor(i / 2)}:${(i % 2) * 30}:00Z`,
      body: `Message ${i + 1}`,
      direction: (i % 2 === 0 ? 'user' : 'match') as 'user' | 'match',
    })),
    // Match 3: Active conversation (8 messages)
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `msg-match3-${i}`,
      matchId: 'match-3',
      senderId: i % 2 === 0 ? 'user-1' : 'match-3',
      sentAt: `2020-07-10T${10 + Math.floor(i / 2)}:${(i % 2) * 30}:00Z`,
      body: `Message ${i + 1}`,
      direction: (i % 2 === 0 ? 'user' : 'match') as 'user' | 'match',
    })),
    // Match 4: Just 2 messages
    {
      id: 'msg-match4-1',
      matchId: 'match-4',
      senderId: 'user-1',
      sentAt: '2020-08-05T17:00:00Z',
      body: 'Hi!',
      direction: 'user',
    },
    {
      id: 'msg-match4-2',
      matchId: 'match-4',
      senderId: 'match-4',
      sentAt: '2020-08-05T18:00:00Z',
      body: 'Hello',
      direction: 'match',
    },
    // Match 5: Most recent, active conversation (12 messages)
    ...Array.from({ length: 12 }, (_, i) => ({
      id: `msg-match5-${i}`,
      matchId: 'match-5',
      senderId: i % 2 === 0 ? 'user-1' : 'match-5',
      sentAt: `2022-03-08T${11 + Math.floor(i / 2)}:${(i % 2) * 30}:00Z`,
      body: `Message ${i + 1}`,
      direction: (i % 2 === 0 ? 'user' : 'match') as 'user' | 'match',
    })),
  ],
  participants: [
    {
      id: 'user-1',
      platform: 'tinder',
      name: 'Test User',
      isUser: true,
    },
  ],
  userId: 'user-1',
}

// Run metadata analysis
const metadata = await analyzeMetadata(sampleData, 'Tinder')

// Display results
console.log('\n' + '='.repeat(80))
console.log('METADATA ANALYSIS RESULTS')
console.log('='.repeat(80))

console.log('\n📊 SUMMARY')
console.log(metadata.summary)

console.log('\n💡 ASSESSMENT')
console.log(metadata.assessment)

console.log('\n📈 VOLUME METRICS')
console.log(`  Total Matches: ${metadata.volume.totalMatches}`)
console.log(`  Total Messages: ${metadata.volume.totalMessages}`)
console.log(`  Active Conversations (5+ messages): ${metadata.volume.activeConversations}`)
console.log(`  Avg Messages/Conversation: ${metadata.volume.averageMessagesPerConversation}`)
console.log(`  Messages Sent: ${metadata.volume.messagesSentByUser}`)
console.log(`  Messages Received: ${metadata.volume.messagesReceived}`)

console.log('\n📅 TIMELINE METRICS')
console.log(`  First Activity: ${metadata.timeline.firstActivity}`)
console.log(`  Last Activity: ${metadata.timeline.lastActivity}`)
console.log(`  Total Days Active: ${metadata.timeline.totalDays}`)
console.log(`  Days Since Last Activity: ${metadata.timeline.daysSinceLastActivity}`)
console.log(`  Peak Activity Period: ${metadata.timeline.peakActivityPeriod || 'N/A'}`)

console.log('\n📊 ACTIVITY DISTRIBUTION')
console.log('  Matches by Month:')
metadata.distribution.matchesByMonth.forEach(({ month, count }) => {
  console.log(`    ${month}: ${count} match${count === 1 ? '' : 'es'}`)
})

console.log('\n  Messages by Month:')
metadata.distribution.messagesByMonth.forEach(({ month, count }) => {
  console.log(`    ${month}: ${count} message${count === 1 ? '' : 's'}`)
})

console.log('\n' + '='.repeat(80))
console.log('✅ Metadata analysis complete!')
console.log('='.repeat(80) + '\n')
