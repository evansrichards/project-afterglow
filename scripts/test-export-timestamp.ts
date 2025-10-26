/**
 * Quick test to demonstrate the export timestamp feature
 */

import { analyzeMetadata } from '../src/lib/analyzers/metadata-analyzer'
import type { AnalyzerInput } from '../src/lib/analyzers/types'

// Sample data with activity from July 2024
const sampleData: AnalyzerInput = {
  matches: [
    {
      id: 'match-1',
      platform: 'tinder',
      createdAt: '2024-07-15T10:00:00Z',
      status: 'active',
      participants: ['user-1', 'match-1'],
      attributes: {},
    },
  ],
  messages: [
    {
      id: 'msg-1',
      matchId: 'match-1',
      senderId: 'user-1',
      sentAt: '2024-07-15T11:00:00Z',
      body: 'Hello',
      direction: 'user',
    },
    {
      id: 'msg-2',
      matchId: 'match-1',
      senderId: 'match-1',
      sentAt: '2024-07-15T12:00:00Z',
      body: 'Hi there',
      direction: 'match',
    },
  ],
  participants: [
    {
      id: 'user-1',
      platform: 'tinder',
      isUser: true,
    },
  ],
  userId: 'user-1',
}

async function testWithExportTimestamp() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST: Export Timestamp Feature')
  console.log('='.repeat(80))

  // Scenario 1: No export timestamp (current behavior)
  console.log('\n📊 Scenario 1: Without export timestamp')
  console.log('Last activity in data: July 2024')
  console.log('Export timestamp: Not provided\n')

  const result1 = await analyzeMetadata(sampleData, 'Tinder')
  console.log('Assessment:', result1.assessment)

  // Scenario 2: With export timestamp from 3 months ago
  console.log('\n' + '-'.repeat(80))
  console.log('\n📊 Scenario 2: With export timestamp (August 2024 - 3 months ago)')
  console.log('Last activity in data: July 2024')
  console.log('Export timestamp: August 1, 2024\n')

  const exportDate = new Date('2024-08-01T00:00:00Z').toISOString()
  const result2 = await analyzeMetadata(sampleData, 'Tinder', exportDate)
  console.log('Assessment:', result2.assessment)

  console.log('\n' + '='.repeat(80))
  console.log('✅ Test complete!')
  console.log('Notice: With export timestamp, the AI should avoid making assumptions')
  console.log('about current activity and instead describe the data snapshot.')
  console.log('='.repeat(80) + '\n')
}

testWithExportTimestamp().catch(console.error)
