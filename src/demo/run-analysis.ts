/**
 * Demo Script: Run Two-Stage Analysis
 *
 * This script demonstrates the complete two-stage analysis pipeline:
 * 1. Loads data from examples folder (Tinder or Hinge)
 * 2. Runs Stage 1 Quick Triage
 * 3. Escalates to Stage 2 if needed
 * 4. Displays the complete report
 *
 * Usage:
 *   npm run demo                           # Uses Tinder data by default
 *   npm run demo -- tinder                 # Explicitly use Tinder data
 *   npm run demo -- hinge                  # Use Hinge data
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { runTwoStageAnalysis, printResultSummary } from '../lib/orchestrator'
import {
  formatStage1ReportAsText,
  formatStage1ReportAsMarkdown,
} from '../lib/reports/stage1-report-generator'
import {
  formatStage2ReportAsText,
  formatStage2ReportAsMarkdown,
} from '../lib/reports/stage2-report-generator'
import { extractZipFile } from '../lib/upload/zip-extractor'
import { tinderParser } from '../lib/parsers/tinder-parser'
import { hingeParser } from '../lib/parsers/hinge-parser'
import type { AnalyzerInput } from '../lib/analyzers/types'

/**
 * Load data from examples folder
 */
async function loadExampleData(platform: 'tinder' | 'hinge'): Promise<AnalyzerInput> {
  const examplesDir = join(process.cwd(), 'examples')

  if (platform === 'tinder') {
    console.log('📦 Loading Tinder data from examples/tinder-data.zip...')

    // Read the zip file
    const zipPath = join(examplesDir, 'tinder-data.zip')
    const zipBuffer = readFileSync(zipPath)

    // Create File object from buffer
    const file = new File([zipBuffer], 'tinder-data.zip', { type: 'application/zip' })

    // Extract zip contents
    const extractedFiles = await extractZipFile(file, {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedExtensions: ['json', 'csv'],
    })

    // Find data.json
    const dataFile = extractedFiles.files.find(f => f.filename.endsWith('data.json'))
    if (!dataFile) {
      throw new Error('Could not find data.json in Tinder export')
    }

    // Parse Tinder data
    const parseResult = await tinderParser.parse(dataFile.content, dataFile.filename)

    if (!parseResult.success || !parseResult.data) {
      const errorMsg = parseResult.errors?.map(e => e.message).join(', ') || 'Unknown error'
      throw new Error(`Failed to parse Tinder data: ${errorMsg}`)
    }

    // Find the user ID (participant with isUser: true)
    const userParticipant = parseResult.data.participants.find(p => p.isUser)
    if (!userParticipant) {
      throw new Error('Could not find user participant in Tinder data')
    }

    console.log(`   ✓ Parsed ${parseResult.data.messages.length} messages`)
    console.log(`   ✓ Parsed ${parseResult.data.matches.length} matches`)
    console.log(`   ✓ Parsed ${parseResult.data.participants.length} participants\n`)

    return {
      messages: parseResult.data.messages,
      matches: parseResult.data.matches,
      participants: parseResult.data.participants,
      userId: userParticipant.id,
    }
  } else {
    console.log('📦 Loading Hinge data from examples/hinge-data.zip...')

    // Read the zip file
    const zipPath = join(examplesDir, 'hinge-data.zip')
    const zipBuffer = readFileSync(zipPath)

    // Create File object from buffer
    const file = new File([zipBuffer], 'hinge-data.zip', { type: 'application/zip' })

    // Extract zip contents
    const extractedFiles = await extractZipFile(file, {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedExtensions: ['json', 'csv'],
    })

    // Find matches.json
    const matchesFile = extractedFiles.files.find(f => f.filename.endsWith('matches.json'))
    if (!matchesFile) {
      throw new Error('Could not find matches.json in Hinge export')
    }

    // Parse Hinge data
    const parseResult = await hingeParser.parse(matchesFile.content, matchesFile.filename)

    if (!parseResult.success || !parseResult.data) {
      const errorMsg = parseResult.errors?.map(e => e.message).join(', ') || 'Unknown error'
      throw new Error(`Failed to parse Hinge data: ${errorMsg}`)
    }

    // Find the user ID (participant with isUser: true)
    const userParticipant = parseResult.data.participants.find(p => p.isUser)
    if (!userParticipant) {
      throw new Error('Could not find user participant in Hinge data')
    }

    console.log(`   ✓ Parsed ${parseResult.data.messages.length} messages`)
    console.log(`   ✓ Parsed ${parseResult.data.matches.length} matches`)
    console.log(`   ✓ Parsed ${parseResult.data.participants.length} participants\n`)

    return {
      messages: parseResult.data.messages,
      matches: parseResult.data.matches,
      participants: parseResult.data.participants,
      userId: userParticipant.id,
    }
  }
}

/**
 * Main demo function
 */
async function runDemo() {
  console.log('\n' + '='.repeat(80))
  console.log('TWO-STAGE DATING APP CONVERSATION ANALYSIS - DEMO')
  console.log('='.repeat(80) + '\n')

  // Determine which platform to use
  const platform = (process.argv[2]?.toLowerCase() as 'tinder' | 'hinge') || 'tinder'
  console.log(`Platform: ${platform.toUpperCase()}\n`)

  // Load the data
  const input = await loadExampleData(platform)

  // Run the analysis
  console.log('🚀 Starting two-stage analysis pipeline...\n')

  const result = await runTwoStageAnalysis(input, { verbose: true })

  // Print summary
  printResultSummary(result)

  // Display the appropriate report
  if (result.completedStage === 'stage1') {
    // Stage 1 only - Green/Yellow case
    console.log('\n' + '='.repeat(80))
    console.log('STAGE 1 REPORT (TEXT FORMAT)')
    console.log('='.repeat(80) + '\n')
    console.log(formatStage1ReportAsText(result.stage1Report))

    console.log('\n' + '='.repeat(80))
    console.log('STAGE 1 REPORT (MARKDOWN FORMAT)')
    console.log('='.repeat(80) + '\n')
    console.log(formatStage1ReportAsMarkdown(result.stage1Report))
  } else {
    // Stage 2 - Orange/Red case
    console.log('\n' + '='.repeat(80))
    console.log('STAGE 1 SUMMARY')
    console.log('='.repeat(80) + '\n')
    console.log(`Risk Level: ${result.stage1Report.safetyAssessment.riskLevel.toUpperCase()}`)
    console.log(`Summary: ${result.stage1Report.safetyAssessment.summary}`)
    console.log(
      `\nEscalation Reason: ${result.stage1Report.escalation?.reason || 'N/A'}\n`
    )

    console.log('='.repeat(80))
    console.log('STAGE 2 COMPREHENSIVE REPORT (TEXT FORMAT)')
    console.log('='.repeat(80) + '\n')
    console.log(formatStage2ReportAsText(result.stage2Report!))

    console.log('\n' + '='.repeat(80))
    console.log('STAGE 2 COMPREHENSIVE REPORT (MARKDOWN FORMAT)')
    console.log('='.repeat(80) + '\n')
    console.log(formatStage2ReportAsMarkdown(result.stage2Report!))

    // Show crisis warning if applicable
    if (
      result.stage2Report?.safetyDeepDive.crisisLevel === 'high' ||
      result.stage2Report?.safetyDeepDive.crisisLevel === 'critical'
    ) {
      console.log('\n' + '='.repeat(80))
      console.log('⚠️  CRISIS ALERT')
      console.log('='.repeat(80))
      console.log(
        `Crisis Level: ${result.stage2Report.safetyDeepDive.crisisLevel.toUpperCase()}`
      )
      console.log('\nProfessional Support Resources:')
      result.stage2Report.safetyDeepDive.professionalSupport.forEach(
        (support, i) => {
          console.log(
            `\n${i + 1}. ${support.type.toUpperCase()} (${support.priority} priority)`
          )
          console.log(`   ${support.description}`)
        }
      )
      console.log('='.repeat(80) + '\n')
    }
  }

  // Final message
  console.log('\n' + '='.repeat(80))
  console.log('DEMO COMPLETE')
  console.log('='.repeat(80))
  console.log('\n💡 What Just Happened:')
  console.log(`   ✓ Loaded real ${platform} conversation data from examples/`)
  console.log('   ✓ Ran complete two-stage AI analysis pipeline')
  console.log('   ✓ Generated comprehensive insights and recommendations')
  console.log('\n💡 Try It Yourself:')
  console.log('   npm run demo                    # Use Tinder data')
  console.log('   npm run demo -- hinge           # Use Hinge data')
  console.log('\n💡 Use Your Own Data:')
  console.log('   Replace files in examples/ folder with your own exports\n')
}

// Run the demo
runDemo().catch((error) => {
  console.error('\n❌ Error running analysis:')
  console.error(error)
  process.exit(1)
})
