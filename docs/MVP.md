# Project Afterglow — MVP Technical Implementation Overview

## Guiding Principles
- **Privacy-first:** Client-side PII sanitization with user review before optional cloud sync for enhanced insights and persistence.
- **Lightweight stack:** Favor proven libraries and hosted services with generous free tiers to shorten build time while keeping maintenance low.
- **Explainable insights:** Every surfaced pattern should link to clear evidence and suggestions so users feel supported, not surveilled.
- **Modular data pipeline:** Treat Tinder and Hinge exports as interchangeable inputs that normalize into one schema for downstream analysis.

## System Architecture Snapshot (Email-First MVP)
1. **Frontend (React + TypeScript + Vite):** Handles file upload, parsing, PII sanitization, and minimal dashboard. One-time engagement after upload, then redirects to email. Deployed on a static host (e.g., Netlify or Vercel).
2. **Cloud Storage (Supabase + Postgres):** Stores sanitized data with email-linked accounts for monthly insight generation.
3. **Email System:** Monthly insight delivery system with scheduled analysis of static user data.
4. **Minimal Dashboard:** Basic statistics and email preference management - designed for brief visits, not retention.
5. **Design System:** Tailwind CSS with a custom theme that echoes the brand's calm, affirming tone.

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

## Basic Analytics Pipeline (MVP Scope)
1. **Simple Message Processing:**
   - Basic text cleanup (normalize whitespace, handle empty messages)
   - Extract timestamps and message direction (user vs match)
   - Count total messages per conversation and participant
2. **Core Metrics Calculation:**
   - **Message Volume Balance:** Calculate ratio of user messages to match messages per conversation
   - **Response Timing Patterns:** Compute average response times between message exchanges
   - **Conversation Length Distribution:** Analyze number of messages per conversation to identify engagement patterns
3. **Basic Pattern Recognition:**
   - Flag conversations with significant message imbalances (e.g., user sends >70% of messages)
   - Identify quick vs slow responders based on timing patterns
   - Categorize conversations by length (brief, moderate, extended exchanges)
4. **Simple Insights Generation:**
   - Create friendly summaries of user's messaging patterns with sanitized examples
   - Provide gentle observations about conversation dynamics without complex analysis

## Minimal Dashboard (Email-First Approach)
- **High-Level Statistics:** Basic data overview for immediate validation:
  - Total matches analyzed
  - Total messages processed
  - Average conversation length
  - Data upload date and sanitization summary
- **Email Insight Status Card:** Prominent card showing:
  - "✅ Monthly insights: ON/OFF"
  - "📅 Next insight arrives: [First Tuesday of Month]"
  - "💌 Delivered to: [user email]"
  - Toggle to pause/resume insight emails
- **2-3 Starter Insights:** Simple examples to demonstrate value:
  - Basic conversation balance insight
  - Response timing overview
  - Most common conversation length
- **Data Management:** Simple toggle to clear all data and cancel insights


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

## 2-Week MVP Timeline (Email-First)

### Week 1: Core Infrastructure + Email Foundation
- **Days 1-2:** Email verification system and user account creation
- **Days 3-4:** PII sanitization pipeline with typed placeholders
- **Days 5-7:** Cloud storage setup with email-linked accounts

### Week 2: Minimal Dashboard + Email System
- **Days 8-10:** Basic statistics dashboard with email insight status card
- **Days 11-12:** Email template system and monthly scheduling setup
- **Days 13-14:** 2-3 starter insights, onboarding flow, and deployment

### Post-Launch: Monthly Insight Development
- **First Tuesday After Launch:** Send first insight email to all users
- **Monthly Cadence:** Develop new analytical lenses to apply to static user data
- **Ongoing:** Build library of insight types that can be applied to any user's data

## Post-MVP Roadmap (Email-First Development)
- **Phase 2 (Month 1-2):** Advanced Insight Types
  - Attachment style analysis algorithms
  - Communication pattern sophistication
  - Red flag detection patterns
  - Aggregate comparison insights ("users like you...")
- **Phase 3 (Month 3-4):** Expert Partnerships & Content
  - Therapist and dating expert collaboration
  - Evidence-based insight development
  - Sponsored insight opportunities
  - Community wisdom integration
- **Phase 4 (Month 5-6):** Platform Enhancement
  - Mobile-optimized email templates
  - Advanced email personalization
  - Premium insight tiers
  - Additional platform support (Bumble, OKCupid)
- **Future Releases:**
  - AI-powered insight generation
  - Interactive email elements
  - Community features and anonymous sharing
  - International expansion with localized insights

