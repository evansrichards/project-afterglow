/**
 * Test script for metadata analysis in API
 * Tests the updated POST /api/analyze endpoint
 */

import type { AnalyzerInput } from '../src/lib/analyzers/types'

// Sample data representing ~2 years of Tinder activity
const sampleData: AnalyzerInput & { platform: string } = {
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
  ],
  messages: [
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
      matchId: 'match-2',
      senderId: 'user-1',
      sentAt: '2020-06-20T15:00:00Z',
      body: 'Hello!',
      direction: 'user',
    },
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
  platform: 'tinder',
}

async function testMetadataAPI() {
  console.log('\n' + '='.repeat(80))
  console.log('TESTING METADATA ANALYSIS IN API')
  console.log('='.repeat(80) + '\n')

  console.log('📤 Sending request to POST /api/analyze...')
  console.log(`   Matches: ${sampleData.matches.length}`)
  console.log(`   Messages: ${sampleData.messages.length}`)
  console.log(`   Platform: ${sampleData.platform}`)

  const startTime = Date.now()

  try {
    const response = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sampleData),
    })

    const requestTime = Date.now() - startTime

    if (!response.ok) {
      const error = await response.json()
      console.error('\n❌ API Error:', error)
      return
    }

    const result = await response.json()

    console.log(`\n✅ Response received in ${requestTime}ms`)
    console.log('\n' + '='.repeat(80))
    console.log('METADATA ANALYSIS RESULTS')
    console.log('='.repeat(80))

    const metadata = result.metadataAnalysis

    console.log('\n📊 SUMMARY')
    console.log(metadata.summary)

    console.log('\n💡 ASSESSMENT')
    console.log(metadata.assessment)

    console.log('\n📈 VOLUME METRICS')
    console.log(`  Total Matches: ${metadata.volume.totalMatches}`)
    console.log(`  Total Messages: ${metadata.volume.totalMessages}`)
    console.log(`  Active Conversations: ${metadata.volume.activeConversations}`)
    console.log(`  Avg Messages/Conversation: ${metadata.volume.averageMessagesPerConversation}`)

    console.log('\n📅 TIMELINE METRICS')
    console.log(`  First Activity: ${metadata.timeline.firstActivity}`)
    console.log(`  Last Activity: ${metadata.timeline.lastActivity}`)
    console.log(`  Total Days: ${metadata.timeline.totalDays}`)
    console.log(`  Days Since Last Activity: ${metadata.timeline.daysSinceLastActivity}`)

    console.log('\n⏱️  TIMING METADATA')
    console.log(`  Metadata Analysis Time: ${result.metadata.metadataTimeMs}ms`)
    console.log(`  Total Processing Time: ${result.metadata.processingTimeMs}ms`)

    console.log('\n🤖 AI ANALYSIS')
    console.log(`  Stage Completed: ${result.result.completedStage}`)
    console.log(`  Risk Level: ${result.result.stage1Report.safetyAssessment.riskLevel}`)

    console.log('\n' + '='.repeat(80))
    console.log('✅ Test completed successfully!')
    console.log('='.repeat(80) + '\n')
  } catch (error) {
    console.error('\n❌ Request failed:', error)
  }
}

// Run the test
testMetadataAPI()
