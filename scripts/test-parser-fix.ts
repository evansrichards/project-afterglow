/**
 * Test parser fix for nested Tinder Messages structure
 */

import { tinderParser } from '../src/lib/parsers/tinder-parser'
import fs from 'fs'

// Sample nested structure matching the new Tinder export format
const nestedTinderData = {
  Messages: [
    {
      match_id: 'Match 1',
      messages: [
        {
          to: 123,
          from: 'You',
          message: 'Hello!',
          sent_date: 'Wed, 01 Jan 2020 10:00:00 GMT',
        },
        {
          to: 'You',
          from: 123,
          message: 'Hi!',
          sent_date: 'Wed, 01 Jan 2020 11:00:00 GMT',
        },
      ],
    },
    {
      match_id: 'Match 2',
      messages: [
        {
          to: 456,
          from: 'You',
          message: 'Hey there',
          sent_date: 'Thu, 02 Jan 2020 10:00:00 GMT',
        },
      ],
    },
  ],
  User: {
    _id: 'user123',
  },
}

async function testParserFix() {
  console.log('🧪 Testing Parser Fix for Nested Messages Structure\n')

  const jsonString = JSON.stringify(nestedTinderData)
  const result = await tinderParser.parse(jsonString, 'test.json')

  if (result.success && result.data) {
    console.log('✅ Parse successful!\n')
    console.log('📊 Counts:')
    console.log('  Matches:', result.metadata.matchCount)
    console.log('  Messages:', result.metadata.messageCount)
    console.log('')

    if (result.metadata.matchCount === 0 && result.metadata.messageCount > 0) {
      console.log('❌ BUG: Messages without matches!')
      console.log('This means the parser did not create synthetic match objects.')
    } else if (result.metadata.matchCount === 2 && result.metadata.messageCount === 3) {
      console.log('✅ CORRECT: 2 matches and 3 messages')
      console.log('Synthetic matches were created successfully!')
    } else {
      console.log('⚠️  Unexpected counts')
    }

    console.log('\n🔍 Match IDs:')
    result.data.matches.forEach((match) => {
      console.log(`  - ${match.id}`)
    })
  } else {
    console.log('❌ Parse failed!')
    if (result.errors) {
      result.errors.forEach((err) => console.log(`  - ${err.message}`))
    }
  }
}

testParserFix().catch(console.error)
