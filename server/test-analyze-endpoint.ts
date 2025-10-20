/**
 * Test script for /api/analyze endpoint
 *
 * Tests endpoint structure without requiring OpenRouter API key
 */

import type { AnalyzeRequest } from './types/api'

const testData: AnalyzeRequest = {
  messages: [
    {
      id: 'msg-1',
      matchId: 'match-1',
      senderId: 'user-1',
      recipientId: 'other-1',
      content: 'Hey, how are you?',
      timestamp: '2024-01-01T10:00:00Z',
      platform: 'tinder',
    },
    {
      id: 'msg-2',
      matchId: 'match-1',
      senderId: 'other-1',
      recipientId: 'user-1',
      content: "Hi! I'm good, thanks for asking!",
      timestamp: '2024-01-01T10:05:00Z',
      platform: 'tinder',
    },
  ],
  matches: [
    {
      id: 'match-1',
      userId: 'user-1',
      matchedParticipantId: 'other-1',
      matchedAt: '2024-01-01T09:00:00Z',
      platform: 'tinder',
    },
  ],
  participants: [
    {
      id: 'user-1',
      name: 'Test User',
      platform: 'tinder',
      isCurrentUser: true,
    },
    {
      id: 'other-1',
      name: 'Other Person',
      platform: 'tinder',
      isCurrentUser: false,
    },
  ],
  userId: 'user-1',
  platform: 'tinder',
}

async function testAnalyzeEndpoint() {
  console.log('🧪 Testing /api/analyze endpoint...\n')

  try {
    console.log('📤 Sending request to http://localhost:3001/api/analyze')
    console.log(`   Messages: ${testData.messages.length}`)
    console.log(`   Matches: ${testData.matches.length}`)
    console.log(`   Participants: ${testData.participants.length}\n`)

    const response = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    })

    console.log(`📥 Response status: ${response.status} ${response.statusText}\n`)

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Error response:')
      console.error(JSON.stringify(data, null, 2))
      process.exit(1)
    }

    console.log('✅ Success! Response:')
    console.log(JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('❌ Request failed:', error)
    process.exit(1)
  }
}

testAnalyzeEndpoint()
