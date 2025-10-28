/**
 * Test script to verify anonymization works end-to-end through the API
 */

import { analyzeData } from '../server/routes/analyze'
import type { AnalyzeRequest } from '../server/types/api'
import type { NormalizedMessage } from '../src/types/data-model'

console.log('🧪 Testing Anonymization Integration\n')

// Create test messages with PII that should be anonymized
const testMessages: NormalizedMessage[] = [
  // Conversation 1: Contains phone number and name
  {
    id: 'msg1',
    matchId: 'match1',
    from: 'user123',
    to: 'other1',
    body: 'Hey! Want to grab coffee?',
    sentAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'msg2',
    matchId: 'match1',
    from: 'other1',
    to: 'user123',
    body: "Sure! I'm Sarah by the way",
    sentAt: '2024-01-15T10:05:00Z',
  },
  {
    id: 'msg3',
    matchId: 'match1',
    from: 'user123',
    to: 'other1',
    body: 'Nice to meet you! How about Saturday?',
    sentAt: '2024-01-15T10:10:00Z',
  },
  {
    id: 'msg4',
    matchId: 'match1',
    from: 'other1',
    to: 'user123',
    body: 'Perfect! Here is my number: 555-123-4567',
    sentAt: '2024-01-15T10:15:00Z',
  },
  {
    id: 'msg5',
    matchId: 'match1',
    from: 'user123',
    to: 'other1',
    body: "Great! I'll text you. You can also reach me at john@example.com or @instagram",
    sentAt: '2024-01-15T10:20:00Z',
  },

  // Conversation 2: Contains address and social handles
  {
    id: 'msg6',
    matchId: 'match2',
    from: 'user123',
    to: 'other2',
    body: 'Would love to meet up!',
    sentAt: '2024-01-16T14:00:00Z',
  },
  {
    id: 'msg7',
    matchId: 'match2',
    from: 'other2',
    to: 'user123',
    body: 'Yes! My name is Michael. Find me on instagram.com/mike_cool_guy',
    sentAt: '2024-01-16T14:05:00Z',
  },
  {
    id: 'msg8',
    matchId: 'match2',
    from: 'user123',
    to: 'other2',
    body: 'Cool! Want to meet at 123 Main Street, Apt 5B on Friday?',
    sentAt: '2024-01-16T14:10:00Z',
  },
  {
    id: 'msg9',
    matchId: 'match2',
    from: 'other2',
    to: 'user123',
    body: 'Sounds good! Call me at (555) 987-6543',
    sentAt: '2024-01-16T14:15:00Z',
  },
]

const request: AnalyzeRequest = {
  messages: testMessages,
  matches: [
    { id: 'match1', participants: ['user123', 'other1'], createdAt: '2024-01-15T09:00:00Z' },
    { id: 'match2', participants: ['user123', 'other2'], createdAt: '2024-01-16T13:00:00Z' },
  ],
  participants: [
    { id: 'user123', name: 'User' },
    { id: 'other1', name: 'Other1' },
    { id: 'other2', name: 'Other2' },
  ],
  userId: 'user123',
  platform: 'test',
}

async function runTest() {
  try {
    console.log('📤 Sending test data with PII...\n')
    console.log('Original PII in messages:')
    console.log('  - Phone: 555-123-4567')
    console.log('  - Phone: (555) 987-6543')
    console.log('  - Email: john@example.com')
    console.log('  - Name: Sarah')
    console.log('  - Name: Michael')
    console.log('  - Social: @instagram')
    console.log('  - Social: instagram.com/mike_cool_guy')
    console.log('  - Address: 123 Main Street, Apt 5B')
    console.log('')

    // Mock the analyze endpoint (in real scenario this would be HTTP request)
    // For this test, we'll directly call the significance detector
    const { detectSignificantConversations } = await import(
      '../src/lib/analyzers/significance-detector'
    )

    const result = await detectSignificantConversations(testMessages, 'user123')

    console.log('✅ Significance detection complete!\n')
    console.log(`Found ${result.statistics.totalSignificant} significant conversations\n`)

    // Check each significant conversation for proper anonymization
    let allProperlyAnonymized = true

    for (const conv of result.significantConversations) {
      console.log(`\n📋 Conversation ${conv.matchId}:`)
      console.log(`   Score: ${conv.significanceScore}/100`)
      console.log(`   Flags: ${Object.entries(conv.significanceFlags)
        .filter(([_, v]) => v)
        .map(([k]) => k)
        .join(', ')}`)
      console.log(`   Highlights:`)

      for (const highlight of conv.highlights) {
        console.log(`     • ${highlight}`)

        // Check for PII leakage
        const piiTests = [
          { pattern: /555-123-4567/, name: 'full phone 555-123-4567' },
          { pattern: /\(555\)\s*987-6543/, name: 'full phone (555) 987-6543' },
          { pattern: /john@example\.com/, name: 'full email john@example.com' },
          { pattern: /123 Main Street/, name: 'full address' },
          { pattern: /mike_cool_guy/, name: 'full social handle' },
        ]

        for (const test of piiTests) {
          if (test.pattern.test(highlight)) {
            console.log(`       ❌ ERROR: Found non-anonymized ${test.name}`)
            allProperlyAnonymized = false
          }
        }

        // Check for proper anonymization markers
        const anonymizationMarkers = [
          { pattern: /\*\*\*-\*\*\*-\d{4}/, name: 'phone anonymization' },
          { pattern: /\(\*\*\*\)\s*\*\*\*-\d{4}/, name: 'phone with parens anonymization' },
          { pattern: /[a-z]\*\*\*@/, name: 'email anonymization' },
          { pattern: /\[Name\]/, name: 'name anonymization' },
          { pattern: /\[Address\]/, name: 'address anonymization' },
          { pattern: /@[a-z]{3}\*\*\*/, name: 'social handle anonymization' },
        ]

        for (const marker of anonymizationMarkers) {
          if (marker.pattern.test(highlight)) {
            console.log(`       ✅ Found ${marker.name}`)
          }
        }
      }
    }

    console.log('\n')
    console.log('================================================================================')

    if (allProperlyAnonymized) {
      console.log('✅ PASS: All PII properly anonymized!')
    } else {
      console.log('❌ FAIL: Some PII was not properly anonymized')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error)
    process.exit(1)
  }
}

runTest()
