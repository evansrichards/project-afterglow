# MVP TODOs

## 1. Product & Experience Foundations
- [x] 1.1 Finalize tone/brand guidelines and copy pillars for warm, validating voice across UI (per PRD).
- [x] 1.2 Draft landing page content covering value proposition, privacy assurances, and upload instructions.
- [x] 1.3 Define MVP success metrics dashboard (onboarding completion, deep-dive engagement, reflection notes, NPS).

## 2. Project Setup & Infrastructure
- [ ] 2.1 Scaffold React + TypeScript + Vite frontend with Tailwind CSS theme aligned to brand.
- [ ] 2.2 Configure module aliases, linting (ESLint), formatting (Prettier), and Jest + Testing Library base config.
- [ ] 2.3 Set up IndexedDB access utilities (using `idb`) and persistent state management strategy.

## 3. Data Ingestion & Normalization
- [ ] 3.1 Implement drag-and-drop upload zone with file type/size validation and sample data links.
- [ ] 3.2 Integrate `jszip` pipeline to unzip Tinder JSON bundles and Hinge ZIP exports client-side.
- [ ] 3.3 Build schema-specific parser adapters for Tinder and Hinge that output unified `Match`, `Message`, `Participant`, `Metadata` structures.
- [ ] 3.4 Normalize timestamps to ISO strings with `date-fns-tz` and deduplicate participant identities across files.
- [ ] 3.5 Persist raw schema snapshots and run validation checks (required columns, message counts) with friendly error messaging.
- [ ] 3.6 Capture unknown fields into `CustomAttribute` metadata and log schema diffs with adapter versioning.

## 4. Unified Data Model & Storage
- [ ] 4.1 Implement TypeScript interfaces for normalized data (participants, matches, messages, raw records, field mappings).
- [ ] 4.2 Create data persistence layer saving normalized entities to IndexedDB with efficient query helpers.
- [ ] 4.3 Generate derived metrics (response times, word counts, conversation length) using memoized selectors.

## 5. Conversation Analyzer Pipeline
- [ ] 5.1 Build preprocessing utilities for message cleanup, tokenization via `wink-nlp`, language detection, and metadata merging.
- [ ] 5.2 Implement feature extraction modules (response latency, initiation patterns, sentiment, thematic keywords, behavioral annotations).
- [ ] 5.3 Develop pattern detection engines: Momentum Tracker, Emotional Climate Monitor, Boundary & Respect Scanner, Self-Reflection Mirrors, Reciprocity Gauge.
- [ ] 5.4 Store representative snippets for flagged patterns with redaction utilities for personal data.

## 6. Insight Layer & Visualization
- [ ] 6.1 Design insight card component with title, metric summary, evidence snippets, reflective prompts, and suggestions.
- [ ] 6.2 Implement dashboard visualizations (e.g., response time violin plot, conversation arc timeline, positivity heatmap) using `recharts` or `nivo`.
- [ ] 6.3 Build navigation for overview vs. deep-dive sections aligned with user journey.
- [ ] 6.4 Ensure insights link back to underlying data for explainability and user trust.

## 7. Reflection Workspace & Recap
- [ ] 7.1 Implement rich-text reflection workspace with guided prompts and local persistence.
- [ ] 7.2 Enable export of recap (PDF via `react-pdf`) summarizing insights and user notes.
- [ ] 7.3 Add gentle wrap-up flow allowing note saving, recap download, and optional future check-ins.

## 8. Privacy & Security
- [ ] 8.1 Display inline privacy nudges and clear language that processing happens locally.
- [ ] 8.2 Provide instant data purge control that clears IndexedDB and any cached files.
- [ ] 8.3 If sync is enabled, encrypt exports with user-supplied passphrase before Supabase upload and enforce RLS policies.

## 9. Optional Secure Sync (Stretch)
- [ ] 9.1 Prototype Supabase Edge Function endpoints and Postgres schema for storing encrypted user datasets.
- [ ] 9.2 Implement opt-in toggle and onboarding messaging that explains benefits and risks.
- [ ] 9.3 Build sync orchestration (upload/download, conflict handling) respecting offline-first defaults.

## 10. Analytics & Telemetry
- [ ] 10.1 Integrate privacy-friendly analytics (self-hosted Plausible) capturing anonymized events only.
- [ ] 10.2 Instrument key funnels: onboarding completion, time-to-first insight, insight card views, reflection note saves.
- [ ] 10.3 Ensure telemetry can be disabled entirely by the user.

## 11. Testing & Quality Assurance
- [ ] 11.1 Author unit tests for parsers, normalization utilities, analyzer modules, and derived metric selectors.
- [ ] 11.2 Create Cypress component/integration tests that run sample ZIPs through upload-to-insight flow.
- [ ] 11.3 Schedule manual review sessions with subject-matter experts to vet tone and sensitive pattern handling.
- [ ] 11.4 Establish regression test checklist and automated CI pipeline.

## 12. Launch Preparation
- [ ] 12.1 Prepare documentation for setup, privacy promises, and troubleshooting common import issues.
- [ ] 12.2 Set up deployment pipeline to Netlify or Vercel with environment configuration guidelines.
- [ ] 12.3 Craft onboarding emails or in-app copy for optional future check-ins post-MVP launch.
