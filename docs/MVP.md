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

## AI-Heavy Analytics Pipeline (One-Time Analysis MVP)
1. **Comprehensive One-Time Analysis ($3-5 per user):**
   - **Deep Conversation Analysis:** GPT-4 analysis of entire dating history for attachment styles, red flags, and communication patterns
   - **Personalized Insight Generation:** AI-crafted insights tailored to individual patterns and growth opportunities
   - **Safety Pattern Detection:** Sophisticated manipulation and emotional abuse identification
   - **Authentic Voice Analysis:** Recognition of when users are most genuine vs. performative
2. **Tiered Analysis System:**
   - **Tier 1 (80% of users):** Foundational safety analysis using GPT-3.5 and Claude Haiku ($0.50)
   - **Tier 2 (15% of users):** Deep dive analysis for complex patterns using GPT-4 ($2.00)
   - **Tier 3 (5% of users):** Crisis intervention for high-risk situations ($5.00)
3. **Processing Pipeline:**
   - **Immediate Upload Processing:** Basic validation and sanitization feedback
   - **Background Analysis:** Asynchronous AI processing with status updates
   - **Email Notification:** Summary notification when complete with report access link
4. **Cost Framework:**
   - **Budget:** $2,000 over 6 months (75% for AI analysis)
   - **Capacity:** 400-500 users with full AI treatment
   - **Average Cost:** ~$1.00 per user across all tiers

## Processing Dashboard & Report System

### Initial Upload Dashboard
- **High-Level Statistics:** Basic data overview for immediate validation:
  - Total matches analyzed
  - Total messages processed
  - Average conversation length
  - Data upload date and sanitization summary
- **Processing Status Card:** Shows analysis progress:
  - "🔍 Analysis Status: [In Progress/Complete]"
  - "📧 Report notification sent to: [user email]"
  - "⏱️ Processing started: [timestamp]"
  - "📊 Analysis tier assigned: [Tier 1/2/3]"
- **Immediate Insights:** 2-3 basic patterns available instantly:
  - Conversation balance overview
  - Response timing patterns
  - Most active conversation periods

### Authenticated Report Dashboard
- **Comprehensive Analysis Results:** Full AI-generated insights accessible only when authenticated:
  - Attachment style analysis with detailed explanations
  - Safety assessment with specific examples (when relevant)
  - Communication strengths and growth opportunities
  - Personalized recommendations based on patterns
- **Report Sections:** Organized by analysis type for easy navigation
- **Data Management:** Options to download report or delete all data


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

## 2-Week MVP Timeline (One-Time Analysis)

### Week 1: Core Infrastructure + Analysis Pipeline
- **Days 1-2:** Email verification system, user accounts, and OpenRouter API integration
- **Days 3-4:** PII sanitization pipeline with typed placeholders
- **Days 5-7:** Cloud storage setup and tiered AI analysis pipeline foundation

### Week 2: AI Processing + Report System
- **Days 8-10:** Implement tiered AI analysis system with OpenRouter model selection
- **Days 11-12:** Email notification system and authenticated report dashboard
- **Days 13-14:** Processing status display, report viewing, and deployment

### Post-Launch: One-Time Analysis Flow
- **User Upload:** Data processing and immediate basic insights
- **Background Analysis:** Asynchronous AI processing with email notification
- **Report Access:** Users access full analysis through authenticated dashboard
- **Future Enhancement:** Optional monthly re-analysis with new frameworks

### Budget Management
- **Per-analysis cost tracking:** Monitor AI usage per user analysis
- **Tiered cost optimization:** Balance analysis depth with cost efficiency
- **Quality metrics:** Track user satisfaction and report engagement

## Post-MVP Roadmap (One-Time to Recurring Evolution)
- **Phase 2 (Month 1-3):** Enhanced One-Time Analysis
  - Improve tiered analysis accuracy and user satisfaction
  - Add expert review integration for high-risk cases
  - Implement user feedback collection and analysis quality improvement
  - Optional premium deep-dive analysis tier
- **Phase 3 (Month 4-6):** Recurring Analysis Option
  - Introduce optional monthly re-analysis with new frameworks
  - AI-generated monthly themes based on evolving research
  - User choice between one-time and recurring analysis models
  - Cost optimization through hybrid AI/rule-based approach
- **Phase 4 (Month 7-9):** Full Service Expansion
  - Multi-platform support (Bumble, OKCupid) with platform-specific analysis
  - Expert partnership integration (therapists, dating coaches)
  - Template-based analysis for common patterns
  - Target cost reduction while maintaining quality
- **Future Releases:**
  - Interactive report features and progress tracking
  - Community features and anonymized insights sharing
  - International expansion with culturally-aware AI analysis
  - Enterprise partnerships and B2B insight offerings

