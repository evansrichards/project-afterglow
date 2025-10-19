# MVP TODOs

## 1. Product & Experience Foundations
- [x] 1.1 Finalize tone/brand guidelines and copy pillars for warm, validating voice across UI (per PRD).
- [x] 1.2 Draft landing page content covering value proposition, privacy assurances, and upload instructions.
- [x] 1.3 Define MVP success metrics dashboard (onboarding completion, deep-dive engagement, reflection notes, NPS).

## 2. Project Setup & Infrastructure
- [x] 2.1 Scaffold React + TypeScript + Vite frontend with Tailwind CSS theme aligned to brand.
- [x] 2.2 Configure module aliases, linting (ESLint), formatting (Prettier), and Jest + Testing Library base config.
- [x] 2.3 Set up IndexedDB access utilities (using `idb`) and persistent state management strategy.

## 3. Data Ingestion & Normalization
- [x] 3.1 Implement drag-and-drop upload zone with file type/size validation and sample data links.
- [x] 3.2 Integrate `jszip` pipeline to unzip Tinder JSON bundles and Hinge ZIP exports client-side.
- [x] 3.3 Build schema-specific parser adapters for Tinder and Hinge that output unified `Match`, `Message`, `Participant`, `Metadata` structures.
- [x] 3.4 Normalize timestamps to ISO strings with `date-fns-tz` and deduplicate participant identities across files.
- [x] 3.5 Persist raw schema snapshots and run validation checks (required columns, message counts) with friendly error messaging.
- [x] 3.6 Capture unknown fields into `CustomAttribute` metadata and log schema diffs with adapter versioning.

## 4. Unified Data Model & Storage
- [x] 4.1 Implement TypeScript interfaces for normalized data (participants, matches, messages, raw records, field mappings).
- [ ] 4.2 Create data persistence layer saving normalized entities to IndexedDB with efficient query helpers.
- [ ] 4.3 Generate derived metrics (response times, word counts, conversation length) using memoized selectors.

## 5. Conversation Analyzer Pipeline (Updated for Sanitized Data)
- [ ] 5.1 Build preprocessing utilities for sanitized message cleanup, tokenization via `wink-nlp`, language detection, and metadata merging.
- [ ] 5.2 Implement feature extraction modules (response latency, initiation patterns, sentiment, thematic keywords, behavioral annotations) working with tokenized data.
- [ ] 5.3 Develop pattern detection engines adapted for sanitized content: Momentum Tracker, Emotional Climate Monitor, Boundary & Respect Scanner, Self-Reflection Mirrors, Reciprocity Gauge.
- [ ] 5.4 Store representative snippets for flagged patterns using sanitized data with typed placeholders for context.

## 6. Insight Layer & Visualization
- [ ] 6.1 Design insight card component with title, metric summary, evidence snippets, reflective prompts, and suggestions.
- [ ] 6.2 Implement dashboard visualizations (e.g., response time violin plot, conversation arc timeline, positivity heatmap) using `recharts` or `nivo`.
- [ ] 6.3 Build navigation for overview vs. deep-dive sections aligned with user journey.
- [ ] 6.4 Ensure insights link back to underlying data for explainability and user trust.

## 7. Reflection Workspace & Recap
- [ ] 7.1 Implement rich-text reflection workspace with guided prompts and local persistence.
- [ ] 7.2 Enable export of recap (PDF via `react-pdf`) summarizing insights and user notes.
- [ ] 7.3 Add gentle wrap-up flow allowing note saving, recap download, and optional future check-ins.

## 8. Privacy & Security (Simplified MVP Strategy)
- [x] 8.1 Update landing page with privacy-focused copy and interactive PII demo component
- [x] 8.2 Implement MVP privacy section with detailed guarantees and technical safeguards
- [ ] 8.3 Build client-side PII sanitization pipeline with regex detection for emails, phones, names, locations
- [ ] 8.4 Create contextual redaction system using typed placeholders ([PERSON], [PLACE], [EMAIL], [WORKPLACE])
- [ ] 8.5 Implement auto-sanitization summary display showing removal counts by type
- [ ] 8.6 Add simple "Stay local only" vs "Sync sanitized data" toggle
- [ ] 8.7 Create basic manual override: text input for custom words to redact
- [ ] 8.8 Add anonymous authentication options (Sign in with Apple, magic links)
- [ ] 8.9 Build cloud storage for sanitized data only with encryption at rest and automatic expiration
- [ ] 8.10 Provide instant data purge control that clears IndexedDB and remote records
- [ ] 8.11 Open-source PII detection code for user audit and transparency

## 9. Cloud Sync with PII Sanitization
- [ ] 9.1 Set up Supabase Edge Functions and Postgres schema for sanitized data storage
- [ ] 9.2 Implement opt-in cloud sync toggle with clear privacy messaging
- [ ] 9.3 Build upload flow: sanitize → show summary → user toggle → encrypt → upload sanitized data only
- [ ] 9.4 Implement Row Level Security policies and user data isolation
- [ ] 9.5 Add sync orchestration with offline-first approach and conflict handling

## 10. Analytics & Telemetry
- [ ] 10.1 Integrate privacy-friendly analytics (self-hosted Plausible) capturing anonymized events only.
- [ ] 10.2 Instrument key funnels: onboarding completion, time-to-first insight, insight card views, reflection note saves.
- [ ] 10.3 Ensure telemetry can be disabled entirely by the user.

## 11. Testing & Quality Assurance
- [ ] 11.1 Author unit tests for parsers, PII sanitization, normalization utilities, analyzer modules, and derived metric selectors.
- [ ] 11.2 Create Cypress component/integration tests that run sample ZIPs through upload → sanitize → insight flow.
- [ ] 11.3 Test PII detection accuracy with various edge cases and international name patterns.
- [ ] 11.4 Schedule manual review sessions with subject-matter experts to vet tone and sensitive pattern handling.
- [ ] 11.5 Establish regression test checklist and automated CI pipeline including privacy protection tests.

## 12. Launch Preparation
- [ ] 12.1 Prepare documentation for setup, updated privacy promises, PII sanitization process, and troubleshooting common import issues.
- [ ] 12.2 Set up deployment pipeline to Netlify or Vercel with environment configuration for Supabase integration.
- [ ] 12.3 Create privacy policy and terms of service reflecting new data handling approach.
- [ ] 12.4 Craft onboarding emails or in-app copy for optional future check-ins post-MVP launch.
- [ ] 12.5 Prepare open-source repository for PII detection code and documentation.
