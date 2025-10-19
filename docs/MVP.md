# Project Afterglow — MVP Technical Implementation Overview

## Guiding Principles
- **Privacy-first:** All processing happens client-side in the browser or in an isolated local runtime; no dating data leaves the user's device.
- **Lightweight stack:** Favor proven libraries and hosted services with generous free tiers to shorten build time while keeping maintenance low.
- **Explainable insights:** Every surfaced pattern should link to clear evidence and suggestions so users feel supported, not surveilled.
- **Modular data pipeline:** Treat Tinder and Hinge exports as interchangeable inputs that normalize into one schema for downstream analysis.

## System Architecture Snapshot
1. **Frontend (React + TypeScript + Vite):** Handles file upload, parsing, visualization, and reflections. Deployed on a static host (e.g., Netlify or Vercel).
2. **Local Worker Layer (Web Workers + WASM-enabled libs):** Performs CPU-heavy parsing, NLP tagging, and trend detection without blocking the UI.
3. **Optional Secure Sync (Supabase Edge Functions + Postgres):** Opt-in cloud sync for users who want to revisit insights later; defaults to local storage if declined.
4. **Design System:** Tailwind CSS with a custom theme that echoes the brand's calm, affirming tone.

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

## Conversation Analyzer Pipeline
1. **Preprocessing:**
   - Clean message text (strip emojis selectively, preserve sentiment cues, normalize whitespace).
   - Tokenize using `wink-nlp` (compact footprint) with support for sentence boundaries.
   - Detect language; fallback to basic sentiment if not English.
   - Merge `CustomAttribute` metadata (prompt titles, delivery states, reactions) into analyzer-friendly keys so new columns stay actionable without code changes.
2. **Feature Extraction:**
   - Calculate response latency distributions and conversation initiation patterns.
   - Tag tone using rule-based heuristics plus sentiment (e.g., `vader-sentiment` port for JS).
   - Identify thematic keywords via TF-IDF and curated lexicons (affection, logistics, red flags).
   - Annotate user vs. match behaviors (e.g., question rate, empathy statements, compliment frequency).
3. **Pattern Detection Modules:**
   - **Momentum Tracker:** Flags frequent stalls (user sends ≥2 unanswered messages) and successful escalations (conversation moves to date/topic). Links to snippets of pivotal exchanges.
   - **Emotional Climate Monitor:** Highlights stretches with negative or anxious sentiment from either party and pairs them with supportive reframes.
   - **Boundary & Respect Scanner:** Looks for red-flag phrases (e.g., gaslighting, negging) using curated lexicon + contextual rules; surfaces anonymized snippets.
   - **Self-Reflection Mirrors:** Surfaces recurring self-sabotaging patterns (e.g., apologizing excessively) using regex + frequency thresholds.
   - **Reciprocity Gauge:** Compares message counts, initiation rates, and response speed to reveal imbalances.
4. **Snippet Generation:**
   - For each flagged pattern, store 2–3 representative message pairs (one user line + one match line) with timestamps.
   - Redact names/emails and highlight the trigger phrase to keep insights actionable but private.

## Insight Layer & Recommendations
- **Insight Cards:** Each pattern becomes a card with:
  - Title (e.g., "When you keep the conversation alive solo")
  - Metric summary (e.g., "In 35% of matches, you sent three or more unanswered messages")
  - Evidence snippet(s)
  - Reflective prompt and gentle next-step suggestion.
- **Trend Dashboards:** Use `recharts` or `nivo` for accessible visualizations (response time violin plot, conversation arc timeline, positivity heatmap).
- **Reflection Workspace:** Rich-text notes saved locally with optional export (PDF via `react-pdf`).
- **Privacy Nudges:** Inline reminders about local processing; simple toggle to purge data instantly.

## Narcissistic or Harmful Pattern Detection
- Combine lexicon of narcissistic traits ("you're too sensitive", "I never said that") with behavioral signals:
  - High prevalence of blame-shifting or belittling language.
  - Love-bombing followed by sudden withdrawal (detected through sentiment swings + response gaps).
- Provide contextual snippet bundles:
  - **Example:**
    - _Match:_ "I only date people who can keep up with me. Most of my exes were too needy."
    - _You:_ "I just want clear communication."
    - _Match:_ "Sounds like you need to toughen up." (Flagged as dismissive)
- Offer guidance: "If comments like these feel familiar, consider pausing and asking how you want to be treated."
- Emphasize user agency; avoid diagnosing matches but spotlight patterns needing boundaries.

## Data Security & Privacy
- Default to client-side storage; if cloud sync enabled, encrypt exports using user passphrase before upload.
- Leverage Supabase Row Level Security to isolate user data; keys stored in environment variables server-side.
- Provide one-click "Forget Me" that wipes IndexedDB and remote records.

## Analytics & Telemetry
- Track anonymized events only (no message content): onboarding completion, time-to-first insight, cards viewed.
- Use Plausible Analytics self-hosted for privacy-friendly metrics.

## Testing & Quality
- **Unit Tests:** Jest + Testing Library for parsers and insight calculations using fixture exports.
- **Integration Tests:** Cypress component tests for upload-to-insight flow with sample ZIPs.
- **Manual Review:** Involve subject-matter experts (dating coaches, therapists) to vet tone of flagged snippets.

## Roadmap Considerations
- **Near-Term Enhancements:**
  - Expand parser adapters for Bumble/OKCupid using same schema.
  - Add journaling timeline to correlate insights with real-life outcomes.
  - Introduce optional AI coach (GPT-4o mini) for reflective prompts, ensuring on-device processing where possible.
- **Scalability:** Keep architecture modular so heavy NLP modules can be swapped for cloud functions if datasets grow.

