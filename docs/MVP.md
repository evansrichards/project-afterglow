# Project Afterglow — MVP Technical Implementation Overview

## Guiding Principles
- **Privacy-first:** Client-side PII sanitization with user review before optional cloud sync for enhanced insights and persistence.
- **Lightweight stack:** Favor proven libraries and hosted services with generous free tiers to shorten build time while keeping maintenance low.
- **Explainable insights:** Every surfaced pattern should link to clear evidence and suggestions so users feel supported, not surveilled.
- **Modular data pipeline:** Treat Tinder and Hinge exports as interchangeable inputs that normalize into one schema for downstream analysis.

## System Architecture Snapshot (One-Time Analysis MVP)
1. **Frontend (React + TypeScript + Vite):** Handles file upload, parsing, PII sanitization, and processing status display. Shows basic stats immediately, then guides to wait for analysis completion. Deployed on a static host (e.g., Netlify or Vercel).
2. **Cloud Storage (Supabase + Postgres):** Stores sanitized data with email-linked accounts for one-time analysis processing.
3. **AI Analysis Pipeline:** Processes uploaded data once using tiered analysis system, generates comprehensive insights.
4. **Email Notification System:** Sends summary notification when analysis is complete with link to authenticated report.
5. **Report Dashboard:** Secure, authenticated view of full analysis results accessible only to the user.
6. **Design System:** Tailwind CSS with a custom theme that echoes the brand's calm, affirming tone.

## Data Ingestion & Normalization
- **Supported Inputs:**
  - Tinder "Data Download" JSON bundle (notably `messages.json`, `user.json`).
  - Hinge "Request My Data" ZIP, focusing on CSV/JSON conversation exports.
- **Upload Flow:** Drag-and-drop zone validates file type/size, explains privacy, and provides sample data.
- **Parsing Strategy:**
  - Use `jszip` to unzip archives client-side.
  - Employ schema-specific parsers (pure functions) for each platform, converting raw fields into a shared interface: `Match`, `Message`, `Participant`, `Metadata`.
  - Normalize timestamps to ISO strings and convert time zones using `date-fns-tz`.
  - Deduplicate users by platform IDs and stitch multi-file relationships (e.g., matches ↔ messages) before storing in IndexedDB.
- **Data Validation:** Run lightweight checks (required columns, message counts) and surface friendly errors when exports are incomplete.
- **Observed Export Structures:**
  - **Hinge CSVs** (`examples/hinge/messages_sample.csv`, `examples/hinge/matches_sample.csv`) feature columns for `conversation_id`, sender role, prompt metadata, delivery status, and match origins.
  - **Tinder bundle** (`examples/tinder/messages_sample.json`) nests messages inside a match list with `_id`, `person`, and reaction arrays while storing timestamps in ISO-like strings.
  - Capture first-run schema snapshots (column order, inferred types) in local storage so regressions can be surfaced when new files deviate.
- **Adaptive Schema Detection:**
  - Inspect column headers/JSON keys and build a dynamic `FieldMap` that pairs canonical fields with source variants (`sent_at`, `sent_date`, `timestamp`, etc.).
  - Persist unknown fields as `CustomAttribute` metadata so insights can evolve without dropping context.
  - Version each parser adapter and log schema diffs to the console + telemetry (if enabled) to guide future updates.

## Unified Data Model
Any columns or JSON keys the adapters do not recognize map into `attributes` (match-level) or `raw.data` objects so analysts can
experiment without waiting for a deploy while the UI still renders core insights.
```typescript
type Platform = 'tinder' | 'hinge';

type CustomAttributeValue = string | number | boolean | null | string[] | number[];

interface RawRecord {
  platform: Platform;
  entity: 'match' | 'message' | 'profile';
  source: string;                       // filename or JSON path
  observedAt: string;                   // timestamp capture
  data: Record<string, unknown>;        // untouched payload for audit trail
}

interface ParticipantProfile {
  id: string;
  platform: Platform;
  name?: string;
  age?: number;
  genderLabel?: string;
  location?: string;
  prompts?: Array<{ title: string; response: string }>;
  traits?: string[];                    // derived (e.g., job titles, schools)
  isUser: boolean;
  raw?: RawRecord;                      // optional pointer to source
}

interface MatchContext {
  id: string;
  platform: Platform;
  createdAt: string;
  closedAt?: string;
  origin?: string;                      // like, rose, boost, super-like
  status: 'active' | 'closed' | 'unmatched' | 'expired';
  participants: string[];
  attributes: Record<string, CustomAttributeValue>;
  raw?: RawRecord;
}

interface NormalizedMessage {
  id: string;
  matchId: string;
  senderId: string;
  sentAt: string;
  body: string;
  direction: 'user' | 'match';
  delivery?: 'sent' | 'delivered' | 'read' | 'unknown';
  promptContext?: { title?: string; response?: string };
  reactions?: Array<{ emoji: string; actorId: string; sentAt: string }>;
  attachments?: Array<{ type: 'image' | 'video' | 'voice' | 'link'; url?: string }>;
  raw?: RawRecord;
}

interface SchemaFieldMapping {
  canonical: keyof NormalizedMessage | keyof MatchContext | keyof ParticipantProfile | string;
  aliases: string[];                    // observed variants
  transform?: (value: unknown) => unknown;
}

interface ParserAdapter {
  platform: Platform;
  version: string;
  detect: (fileMeta: { name: string; headers: string[] }) => boolean;
  fieldMappings: SchemaFieldMapping[];
  normalize: (records: RawRecord[]) => {
    participants: ParticipantProfile[];
    matches: MatchContext[];
    messages: NormalizedMessage[];
  };
}
```
- Store normalized data in IndexedDB via `idb` library for snappy offline queries.
- Generate derived metrics (response times, word counts, conversation length) using memoized selectors to avoid recomputation.

## Two-Stage AI Analysis Pipeline (Cost-Optimized MVP)

### Architecture Overview
Instead of a complex multi-component pipeline (3 analyzers + 4 evaluators = 7 API calls), we use a streamlined two-stage approach that reduces costs by 50-80% while maintaining quality:

1. **Stage 1: Quick Triage (All Users - 80% Complete Here)**
   - **Model:** GPT-3.5 Turbo
   - **Cost:** ~$0.50 per user
   - **Time:** 10-20 seconds
   - **Purpose:** Fast safety screening and basic pattern detection
   - **Outputs:**
     - Safety risk level (green/yellow/orange/red)
     - Basic communication patterns
     - Attachment style indicators
     - Escalation decision (proceed to Stage 2 or complete)
   - **Result:** Green/yellow cases receive actionable insights and complete here

2. **Stage 2: Comprehensive Deep Analysis (20% Who Need It)**
   - **Model:** GPT-4 Turbo
   - **Cost:** ~$1.50-2.00 per escalated user
   - **Time:** 30-60 seconds
   - **Purpose:** ONE comprehensive call combining all deep analysis
   - **Triggers:** Orange/red safety risk from Stage 1
   - **Outputs in Single Call:**
     - **Safety Deep Dive:** Manipulation tactics (DARVO, gaslighting, love-bombing), coercive control, trauma bonding, crisis resources
     - **Attachment Analysis:** Sophisticated style determination, triggers, coping mechanisms, relationship dynamics
     - **Growth Trajectory:** Time-weighted chronology (18+ months), development progression, customized recommendations
     - **Coherent Synthesis:** Narrative combining all insights with prioritized, evidence-based recommendations

### Cost Framework
- **Budget:** $2,000 over 6 months (75% for AI analysis = $1,500)
- **Average Cost:** ~$0.90 per user (80% @ $0.50 + 20% @ $2.50)
- **Capacity:** ~1,650 users (vs 400-500 with original multi-component approach)
- **Efficiency:** 3x more users served with same budget

### Processing Pipeline
1. **Upload & Sanitization:** Immediate PII detection and data validation
2. **Stage 1 Execution:** Quick triage for all users (10-20s)
3. **Decision Point:**
   - Green/Yellow → Stage 1 Report → Email notification → Done
   - Orange/Red → Stage 2 Comprehensive Analysis → Stage 2 Report → Email notification
4. **User Experience:** Clear status updates showing current stage and why Stage 2 triggered (if applicable)

## Processing Dashboard & Report System

### Initial Upload Dashboard
- **High-Level Statistics:** Basic data overview for immediate validation:
  - Total matches analyzed
  - Total messages processed
  - Average conversation length
  - Data upload date and sanitization summary
- **Processing Status Card:** Shows analysis progress with stage awareness:
  - **Stage 1:** "🔍 Running safety assessment and pattern analysis..."
  - **Stage 2 (if triggered):** "🔍 Running comprehensive deep analysis..."
  - Stage-specific completion estimates (10-20s vs 30-60s)
  - "📧 Email notification will be sent when complete"
  - "⏱️ Processing started: [timestamp]"
- **Immediate Insights:** 2-3 basic patterns available instantly while processing:
  - Conversation balance overview
  - Response timing patterns
  - Most active conversation periods

### Authenticated Report Dashboard
- **Stage 1 Report (80% of users):**
  - Safety assessment with risk level (green/yellow)
  - Basic communication patterns and attachment indicators
  - Actionable recommendations for healthy patterns
  - "Your analysis is complete" confirmation
  - Processing metadata (Stage 1 only, ~$0.50)

- **Stage 2 Report (20% of users):**
  - All Stage 1 content PLUS:
  - Detailed safety analysis with manipulation tactics and examples
  - Comprehensive attachment style assessment with triggers and dynamics
  - Growth trajectory visualization (if 18+ months data available)
  - Crisis intervention resources (if relevant)
  - Evidence-based examples from conversations
  - Full processing transparency (both stages, ~$2.00-2.50)

- **Data Management:** Options to download report or delete all data (both stage types)


## Data Security & Privacy

### MVP PII Sanitization Flow
1. **Basic PII Detection:** Use regex patterns to identify emails, phone numbers, URLs, and common name patterns
2. **Contextual Redaction:** Replace detected PII with typed placeholders:
   - Names → `[PERSON]`, `[PERSON_2]` (numbered for multiple people)
   - Locations → `[PLACE]`, `[PLACE_2]`
   - Emails → `[EMAIL]`
   - Phone numbers → `[PHONE]`
   - Organizations → `[WORKPLACE]`, `[SCHOOL]`
3. **Auto-Sanitization Summary:** Show removal counts by type (e.g., "Removed: 15 names, 3 emails, 8 locations")
4. **Simple User Control:**
   - Toggle: "Stay local only" vs "Sync sanitized data to cloud"
   - Basic manual override: text input for custom words to redact
5. **Anonymous Authentication:** Sign in with Apple or magic links for privacy-preserving accounts
6. **Cloud Storage:** Upload only sanitized data with encryption at rest

### Security Features
- Leverage Supabase Row Level Security to isolate user data
- One-click "Forget Me" that wipes IndexedDB and remote records
- Automatic data expiration options (30/60/90 days)
- Open-source PII detection for user audit

## Analytics & Telemetry
- Track anonymized events only (no message content): onboarding completion, time-to-first insight, cards viewed.
- Use Plausible Analytics self-hosted for privacy-friendly metrics.

## Testing & Quality
- **Unit Tests:** Jest + Testing Library for parsers and insight calculations using fixture exports.
- **Integration Tests:** Cypress component tests for upload-to-insight flow with sample ZIPs.
- **Manual Review:** Involve subject-matter experts (dating coaches, therapists) to vet tone of flagged snippets.

## 2-Week MVP Timeline (Two-Stage Analysis)

### Week 1: Core Infrastructure + Stage 1 Quick Triage
- **Days 1-2:** Email verification system, user accounts, and OpenRouter API integration
- **Days 3-4:** PII sanitization pipeline with typed placeholders
- **Days 5-7:** Build Stage 1 Quick Triage analyzer with GPT-3.5 Turbo
  - Safety screening (green/yellow/orange/red)
  - Basic pattern detection
  - Escalation logic to Stage 2
  - Stage 1 report generation

### Week 2: Stage 2 Deep Analysis + Report System
- **Days 8-10:** Build Stage 2 Comprehensive Analyzer with GPT-4 Turbo
  - Single-call deep analysis (safety, attachment, growth)
  - Coherent synthesis and narrative generation
  - Stage 2 report generation
  - Crisis resource inclusion
- **Days 11-12:** Email notification system with stage-specific templates
  - Stage 1 completion emails (green/yellow)
  - Stage 2 completion emails (orange/red)
  - Authenticated report dashboard for both stages
- **Days 13-14:** Processing orchestrator, status display, and deployment
  - Two-stage orchestration logic
  - Stage transition messaging
  - Cost tracking per stage
  - Production deployment

### Post-Launch: Two-Stage Analysis Flow
- **User Upload:** Data processing and immediate basic insights
- **Stage 1 Processing:** Quick triage (10-20s) for all users
- **Decision Point:** 80% complete at Stage 1, 20% escalate to Stage 2
- **Stage 2 Processing (if needed):** Comprehensive analysis (30-60s)
- **Email Notification:** Stage-specific summary with report link
- **Report Access:** Stage-appropriate insights via authenticated dashboard

### Budget Management
- **Stage-based cost tracking:** Monitor Stage 1 vs Stage 2 costs separately
- **Escalation rate monitoring:** Target 20% Stage 2 escalation
- **Quality vs cost optimization:** Balance depth with efficiency
- **Capacity projection:** ~1,650 users with $1,500 AI budget (3x original capacity)

## Post-MVP Roadmap (Two-Stage Evolution)
- **Phase 2 (Month 1-3):** Two-Stage Refinement
  - Optimize Stage 2 escalation thresholds based on user data
  - Improve Stage 1 triage accuracy to reduce unnecessary escalations
  - Enhance Stage 2 comprehensive analysis quality with expert feedback
  - Add confidence scores to guide escalation decisions
  - Fine-tune target escalation rate (currently 20%)
  - Monitor cost efficiency vs original multi-component approach

- **Phase 3 (Month 4-6):** Advanced Features
  - Introduce Stage 1.5: Medium-depth analysis for borderline cases (~$1.00)
  - Interactive report features with deeper Stage 2 insight exploration
  - Comparative analysis (track changes if user re-uploads data)
  - Optional monthly re-analysis with evolving frameworks
  - Expert review integration for Stage 2 high-stakes cases

- **Phase 4 (Month 7-9):** Scale & Optimize
  - Hybrid AI/rule-based Stage 1 for even faster/cheaper triage
  - Template-based Stage 1 insights for common secure patterns
  - Multi-platform support (Bumble, OKCupid) with platform-specific analysis
  - Expert partnership integration (therapists, dating coaches)
  - Target further cost reduction: Stage 1 < $0.30, Stage 2 < $1.50

- **Future Releases:**
  - Interactive report features and progress tracking
  - Community features and anonymized insights sharing
  - International expansion with culturally-aware analysis per stage
  - Enterprise partnerships and B2B insight offerings

