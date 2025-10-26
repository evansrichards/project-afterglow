/**
 * Test the Tinder parser with actual data
 */

import { tinderParser } from '../src/lib/parsers/tinder-parser'
import { execSync } from 'child_process'

async function testParser() {
  console.log('🧪 Testing Tinder Parser\n')

  // Extract Tinder data
  console.log('📦 Extracting Tinder data...')
  const zipOutput = execSync('unzip -p examples/tinder-data.zip "*/data.json"', {
    encoding: 'utf-8',
  })

  // Parse the data
  console.log('🔍 Parsing data...\n')
  const result = await tinderParser.parse(zipOutput, 'data.json')

  if (result.success && result.data) {
    console.log('✅ Parse successful!\n')
    console.log('📊 Results:')
    console.log('  Matches:', result.metadata.matchCount)
    console.log('  Messages:', result.metadata.messageCount)
    console.log('  Participants:', result.metadata.participantCount)
    console.log('')
    console.log('🔢 First 5 match IDs:', result.data.matches.slice(0, 5).map((m) => m.id))
    console.log('')

    // Show match/message ratio
    const messagesPerMatch =
      result.metadata.matchCount > 0
        ? (result.metadata.messageCount / result.metadata.matchCount).toFixed(1)
        : 0
    console.log(`📈 Average messages per match: ${messagesPerMatch}`)
  } else {
    console.log('❌ Parse failed!')
    console.log('Errors:', result.errors)
  }
}

testParser().catch(console.error)
