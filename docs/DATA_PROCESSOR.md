# Data Processing Pipeline

## Overview
When a user uploads their dating app data, we process it in two simple phases:
1. **Data Ingestion** - Parse and normalize the raw export files
2. **Metadata Analysis** - Extract basic statistics about their dating history

This initial processing happens **before** any AI analysis begins, giving us a quick overview of what we're working with.

---

## 1. Data Ingestion

**What happens:** Raw export files (Tinder JSON, Hinge ZIP) are parsed into a unified format.

**Where it happens:**
- **Frontend parsing**: [src/lib/parsers/index.ts](../src/lib/parsers/index.ts)
  - `tinderParser()` - [src/lib/parsers/tinder-parser.ts](../src/lib/parsers/tinder-parser.ts)
  - `hingeParser()` - [src/lib/parsers/hinge-parser.ts](../src/lib/parsers/hinge-parser.ts)

**Input:**
- Tinder: `data.json` from exported archive
- Hinge: ZIP file containing `matches.json` and `conversations.json`

**Output:** Normalized data structure
```typescript
{
  messages: Message[]      // All messages across all conversations
  matches: Match[]         // All matches/connections
  participants: Participant[]  // All people the user interacted with
  userId: string          // The user's own ID
}
```

**Key Functions:**
- `parseFile()` - Entry point that detects platform and routes to correct parser
- `tinderParser()` - Extracts Tinder data from JSON
- `hingeParser()` - Unzips and extracts Hinge data
- Data validation and deduplication happens inline during parsing

---

## 2. Metadata Analysis

**What happens:** Calculate basic statistics about the user's dating activity to provide immediate context.

**Where it happens:**
- Currently: Basic counts during parsing
- **TODO**: Create dedicated metadata analyzer ([src/lib/analyzers/metadata-analyzer.ts](../src/lib/analyzers/metadata-analyzer.ts))

**Metrics to Calculate:**

### Volume Metrics
- Total matches count
- Total messages count
- Average messages per conversation
- Active conversation count (conversations with 5+ messages)

### Time Span Analysis
- First activity date (earliest match or message)
- Last activity date (most recent match or message)
- Total time span on platform
- Most active period (month/year with most activity)
- Time since last activity (days ago)

### Activity Distribution
- Matches per month/year breakdown
- Messages per month/year breakdown
- Activity heatmap data (when were they most active?)

**Output Example:**
```typescript
{
  summary: "You were active on Tinder from Jan 2020 to March 2022 (2.2 years)",
  volume: {
    totalMatches: 156,
    totalMessages: 2847,
    activeConversations: 43
  },
  timeline: {
    firstActivity: "2020-01-15T10:23:00Z",
    lastActivity: "2022-03-08T18:45:00Z",
    totalDays: 783,
    daysSinceLastActivity: 1324,
    peakActivityPeriod: "2020-06 to 2020-09"
  },
  assessment: "It appears you haven't used Tinder in a few years, but we found 156 matches to analyze from your most active period around mid-2020."
}
```

---

## 3. Full Processing Flow

### Entry Point: POST /api/analyze

**File:** [server/routes/analyze.ts](../server/routes/analyze.ts)

**Request Flow:**
```
1. Frontend sends parsed data to POST /api/analyze
   ↓
2. Server validates request (server/middleware/validate-request.ts)
   ↓
3. Server calls runTwoStageAnalysis() (server/routes/analyze.ts:80)
   ↓
4. Orchestrator executes analysis pipeline (src/lib/orchestrator/two-stage-orchestrator.ts)
   ↓
5. Results returned to frontend
```

### Current Analysis Pipeline

**File:** [src/lib/orchestrator/two-stage-orchestrator.ts](../src/lib/orchestrator/two-stage-orchestrator.ts)

**Stage 1: Quick Triage** (Always runs)
- Function: `runSafetyScreener()` - [src/lib/analyzers/safety-screener.ts](../src/lib/analyzers/safety-screener.ts)
- Model: GPT-3.5 Turbo
- Purpose: Fast safety check for immediate red flags
- Duration: ~10-30 seconds
- Output: Basic risk level (green/yellow/orange/red)

**Stage 2: Comprehensive Analysis** (Always runs)
- Function: `runStage2Comprehensive()` - [src/lib/analyzers/stage2-comprehensive.ts](../src/lib/analyzers/stage2-comprehensive.ts)
- Model: GPT-5
- Purpose: Deep dive into patterns, attachment, growth trajectory
- Duration: ~30-90 seconds
- Output: Detailed insights, safety analysis, attachment patterns, growth assessment

**Report Generation:**
- Stage 1 Report: `generateStage1Report()` - [src/lib/reports/stage1-report-generator.ts](../src/lib/reports/stage1-report-generator.ts)
- Stage 2 Report: `generateStage2Report()` - [src/lib/reports/stage2-report-generator.ts](../src/lib/reports/stage2-report-generator.ts)

---

## What's Missing (TODO)

The current pipeline jumps straight from data ingestion to AI analysis. We need to add:

1. **Metadata Analyzer** (new file: [src/lib/analyzers/metadata-analyzer.ts](../src/lib/analyzers/metadata-analyzer.ts))
   - Extract volume and timeline statistics
   - Generate human-readable summary
   - Return metadata **before** AI analysis begins

2. **Processing Status Updates**
   - Real-time progress updates during analysis
   - Stream metadata results immediately
   - Show AI analysis progress step-by-step

3. **Separate Results Page**
   - Move from single upload page to multi-page flow
   - Processing page shows progress + metadata
   - Results page shows full AI analysis report

See [TASKS.md Step 7](./TASKS.md) for implementation plan.
