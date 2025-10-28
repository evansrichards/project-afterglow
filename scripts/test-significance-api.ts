/**
 * Test script to verify significance detection API integration
 */

import type { NormalizedMessage } from '../src/types/data-model'

async function testSignificanceAPI() {
  console.log('🧪 Testing Significance Detection API Integration\n')

  // Create sample data with a few significant conversations
  const messages: NormalizedMessage[] = []

  // Conversation 1: Led to date (significant)
  const dateConvo = [
    { body: "Hey! Love your profile", from: 'user', to: 'match1' },
    { body: "Thanks! You seem cool too", from: 'match1', to: 'user' },
    { body: "Want to grab coffee sometime?", from: 'user', to: 'match1' },
    { body: "Yes! How about Saturday at 2pm?", from: 'match1', to: 'user' },
    { body: "Perfect, let's meet at Starbucks downtown", from: 'user', to: 'match1' },
  ]
  dateConvo.forEach((msg, i) => {
    messages.push({
      id: `date_${i}`,
      matchId: 'match1',
      senderId: msg.from === 'user' ? 'user123' : 'match1',
      sentAt: `2024-01-0${i + 1}T10:00:00Z`,
      body: msg.body,
      direction: msg.from === 'user' ? 'user' : 'match',
    })
  })

  // Conversation 2: Contact exchange (significant)
  const contactConvo = [
    { body: "This app keeps crashing on me", from: 'user', to: 'match2' },
    { body: "Same! Here's my number: 555-1234", from: 'match2', to: 'user' },
    { body: "Great, I'll text you", from: 'user', to: 'match2' },
  ]
  contactConvo.forEach((msg, i) => {
    messages.push({
      id: `contact_${i}`,
      matchId: 'match2',
      senderId: msg.from === 'user' ? 'user123' : 'match2',
      sentAt: `2024-01-10T${10 + i}:00:00Z`,
      body: msg.body,
      direction: msg.from === 'user' ? 'user' : 'match',
    })
  })

  // Conversation 3: Short, not significant
  messages.push({
    id: 'short_1',
    matchId: 'match3',
    senderId: 'user123',
    sentAt: '2024-01-15T10:00:00Z',
    body: 'Hey',
    direction: 'user',
  })
  messages.push({
    id: 'short_2',
    matchId: 'match3',
    senderId: 'match3',
    sentAt: '2024-01-15T11:00:00Z',
    body: 'Hi',
    direction: 'match',
  })

  // Make API request
  const requestBody = {
    messages,
    matches: [
      {
        id: 'match1',
        platform: 'tinder' as const,
        createdAt: '2024-01-01T00:00:00Z',
        status: 'active' as const,
        participants: ['user123', 'match1'],
        attributes: {},
      },
      {
        id: 'match2',
        platform: 'tinder' as const,
        createdAt: '2024-01-10T00:00:00Z',
        status: 'active' as const,
        participants: ['user123', 'match2'],
        attributes: {},
      },
      {
        id: 'match3',
        platform: 'tinder' as const,
        createdAt: '2024-01-15T00:00:00Z',
        status: 'active' as const,
        participants: ['user123', 'match3'],
        attributes: {},
      },
    ],
    participants: [
      { id: 'user123', platform: 'tinder' as const, isUser: true },
      { id: 'match1', platform: 'tinder' as const, isUser: false },
      { id: 'match2', platform: 'tinder' as const, isUser: false },
      { id: 'match3', platform: 'tinder' as const, isUser: false },
    ],
    userId: 'user123',
    platform: 'tinder' as const,
  }

  console.log('📤 Sending request to API...')
  console.log(`   Total conversations: 3`)
  console.log(`   Expected significant: 2 (1 date, 1 contact exchange)`)
  console.log('')

  try {
    const response = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ API Error:', error)
      return
    }

    const data = await response.json()

    console.log('✅ Response received!\n')

    // Check significance analysis
    if (data.significanceAnalysis) {
      const { statistics, significantConversations } = data.significanceAnalysis

      console.log('📊 Significance Analysis Results:')
      console.log(`   Total Significant: ${statistics.totalSignificant}`)
      console.log(`   Percentage: ${statistics.percentageSignificant.toFixed(1)}%`)
      console.log('')
      console.log('   Breakdown:')
      console.log(`     - Led to Date: ${statistics.breakdown.ledToDate}`)
      console.log(`     - Contact Exchange: ${statistics.breakdown.contactExchange}`)
      console.log(`     - Unusual Length: ${statistics.breakdown.unusualLength}`)
      console.log(`     - Emotional Depth: ${statistics.breakdown.emotionalDepth}`)
      console.log('')

      if (significantConversations.length > 0) {
        console.log('🔍 Significant Conversations:')
        significantConversations.forEach((conv, i) => {
          console.log(`\n   ${i + 1}. Match ${conv.matchId}:`)
          console.log(`      - Messages: ${conv.messageCount}`)
          console.log(`      - Score: ${conv.significanceScore}/100`)
          console.log(`      - Flags: ${Object.entries(conv.significanceFlags)
            .filter(([_, v]) => v)
            .map(([k]) => k)
            .join(', ')}`)
          console.log(`      - Reasoning: ${conv.reasoning}`)
          if (conv.highlights.length > 0) {
            console.log(`      - Highlights:`)
            conv.highlights.forEach((h) => console.log(`        • ${h}`))
          }
        })
      }

      console.log('\n' + '='.repeat(80))
      console.log('✅ Test Complete!')

      if (statistics.totalSignificant === 2) {
        console.log('✅ PASS: Found expected 2 significant conversations')
      } else {
        console.log(`⚠️  UNEXPECTED: Found ${statistics.totalSignificant} significant conversations (expected 2)`)
      }
    } else {
      console.log('❌ No significance analysis in response')
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testSignificanceAPI().catch(console.error)
