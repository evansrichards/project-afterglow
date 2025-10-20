# Two-Stage Analysis Demo

This demo script shows the complete two-stage AI analysis pipeline working end-to-end with real dating app data.

## Quick Start

```bash
# Run the demo with Tinder data (default)
npm run demo

# Or explicitly choose Tinder
npm run demo -- tinder

# Or use Hinge data
npm run demo -- hinge
```

## What It Does

1. **Loads real conversation data** - Parses actual Tinder/Hinge exports from `examples/` folder
2. **Runs Stage 1: Quick Triage** - Fast safety screening with GPT-3.5 Turbo (~$0.50)
3. **Makes escalation decision** - Green/Yellow = done, Orange/Red = continue to Stage 2
4. **Runs Stage 2 if needed** - Comprehensive analysis with GPT-4 Turbo (~$1.50-2.00)
5. **Displays complete report** - Shows results in both text and markdown formats

## Expected Output

### Stage 1 Only (Green/Yellow)

```
================================================================================
TWO-STAGE DATING APP CONVERSATION ANALYSIS - DEMO
================================================================================

Platform: TINDER

📦 Loading Tinder data from examples/tinder-data.zip...
   ✓ Parsed 1,847 messages
   ✓ Parsed 43 matches
   ✓ Parsed 44 participants

🚀 Starting two-stage analysis pipeline...

🔍 Starting Stage 1: Quick Triage...
   Analyzing 3 messages
✅ Stage 1 complete in 12s
   Risk Level: GREEN
   Cost: $0.50

✨ Analysis complete at Stage 1
   No escalation needed (green risk level)

================================================================================
ANALYSIS COMPLETE
================================================================================
Completed Stage: STAGE1
Risk Level: GREEN
Total Cost: $0.50 (Stage 1: $0.50)
Total Duration: 12 seconds
================================================================================

[Full Stage 1 report displayed here...]
```

### Stage 2 (Orange/Red)

```
🔍 Starting Stage 1: Quick Triage...
   Analyzing 342 messages
✅ Stage 1 complete in 15s
   Risk Level: ORANGE
   Cost: $0.55

⚠️  Escalating to Stage 2: Comprehensive Analysis
   Reason: ORANGE risk level detected
   Running deep analysis...
✅ Stage 2 complete in 48s
   Cost: $1.85

✨ Comprehensive analysis complete
   Total duration: 63s
   Total cost: $2.40
   ⚠️  Crisis Level: MODERATE

================================================================================
ANALYSIS COMPLETE
================================================================================
Completed Stage: STAGE2
Risk Level: ORANGE
Total Cost: $2.40 (Stage 1: $0.55, Stage 2: $1.85)
Total Duration: 63 seconds
Crisis Level: MODERATE
================================================================================

[Full Stage 2 report displayed here...]
```

## Using Your Own Data

The demo automatically loads data from the `examples/` folder. To analyze your own conversations:

### Replace Example Files

Simply replace the files in the `examples/` folder:

```bash
# For Tinder data
cp ~/Downloads/tinder-data.zip examples/tinder-data.zip

# For Hinge data
cp ~/Downloads/hinge-data.zip examples/hinge-data.zip

# Then run the demo
npm run demo -- tinder   # or hinge
```

### Programmatic Usage

You can also use the analysis pipeline directly in your code:

```typescript
import { tinderParser, hingeParser } from './lib/parsers'
import { runTwoStageAnalysis } from './lib/orchestrator'

// Parse Tinder export
const parseResult = await tinderParser.parse(fileContent, 'data.json')

// Find user ID
const userId = parseResult.data!.participants.find(p => p.isUser)!.id

// Create analyzer input
const input = {
  messages: parseResult.data!.messages,
  matches: parseResult.data!.matches,
  participants: parseResult.data!.participants,
  userId,
}

// Run analysis
const result = await runTwoStageAnalysis(input, { verbose: true })
```

## Environment Setup

Make sure you have your OpenRouter API key set:

```bash
# Create .env file
echo "VITE_OPENROUTER_API_KEY=your-api-key-here" > .env

# Or export it
export VITE_OPENROUTER_API_KEY=your-api-key-here
```

## Output Formats

The demo displays reports in two formats:

1. **Text Format** - Plain text for console reading
2. **Markdown Format** - Formatted markdown (can be saved to .md file)

### Saving Reports to Files

```bash
# Save complete output to file
npm run demo > analysis-report.txt

# Save Hinge analysis
npm run demo -- hinge > hinge-report.txt

# Or just the markdown sections
npm run demo 2>&1 | grep -A 1000 "MARKDOWN FORMAT" > report.md
```

## Cost Estimation

- **Stage 1 only (80% of users)**: ~$0.50
- **Stage 1 + Stage 2 (20% of users)**: ~$2.00-2.50

The example data contains real conversations and will demonstrate both stages based on the content analyzed.

## Troubleshooting

### API Key Issues

```
Error: OpenRouter API key not found
```

Solution: Set `VITE_OPENROUTER_API_KEY` in your `.env` file

### Import Errors

```
Error: Cannot find module '../lib/orchestrator'
```

Solution: Make sure you're running from the project root directory

### TypeScript Errors

```
Error: Cannot find name 'AnalyzerInput'
```

Solution: Run with `npx tsx` instead of `node`

## Next Steps

1. Parse your actual Tinder/Hinge exports
2. Run the analysis on real conversation data
3. Review the Stage 1 report for basic insights
4. If escalated, review the Stage 2 comprehensive analysis
5. Pay attention to safety recommendations and professional resources

## Architecture

```
Load ZIP file from examples/
    ↓
Extract & Parse (Tinder/Hinge parser)
    ↓
runTwoStageAnalysis()
    ↓
    ├─ Stage 1: Quick Triage (GPT-3.5 Turbo)
    │  ├─ Safety screening
    │  ├─ Risk assessment (green/yellow/orange/red)
    │  └─ Escalation decision
    │
    └─ Stage 2: Comprehensive (GPT-4 Turbo) [if orange/red]
       ├─ Safety deep dive
       ├─ Attachment analysis
       ├─ Growth trajectory (if 18+ months)
       └─ Comprehensive synthesis
    ↓
Display Reports
```

## Learn More

- [Two-Stage Architecture](../../docs/MVP.md#two-stage-ai-analysis-pipeline)
- [Task List](../../docs/TASKS.md)
- [Data Processor Documentation](../../docs/DATA_PROCESSOR.md)
