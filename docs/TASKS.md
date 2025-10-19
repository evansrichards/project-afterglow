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

## 4. Simplified Data Model & Storage (MVP Scope)
- [x] 4.1 Implement TypeScript interfaces for normalized data (participants, matches, messages, raw records, field mappings).
- [x] 4.2 Create basic data persistence layer for sanitized entities in both IndexedDB (local) and Supabase (cloud).
- [x] 4.3 Generate simple derived metrics (message counts, basic response times, conversation length) with straightforward calculations.

## 5. Basic Analytics Pipeline (MVP Scope)
- [x] 5.1 Build simple message processing utilities for sanitized data (basic cleanup, timestamp extraction, message counting).
- [x] 5.2 Implement 3 core metrics calculations:
  - Message volume balance (ratio of user to match messages per conversation)
  - Response timing patterns (average response times between exchanges)
  - Conversation length distribution (number of messages per conversation)
- [x] 5.3 Create basic pattern recognition for message imbalances and timing categories.
- [ ] 5.4 Generate simple insights with friendly summaries and sanitized examples.

## 6. Minimal Dashboard (Email-First Approach)
- [ ] 6.1 Design high-level statistics overview (total matches, messages, conversations).
- [ ] 6.2 Create prominent "Email Insights Status" card showing:
  - Next delivery date (First Tuesday)
  - Email preferences toggle
  - Subscription status
- [ ] 6.3 Build 2-3 basic starter insights to demonstrate value immediately.
- [ ] 6.4 Add data management controls (clear data, pause insights).

## 7. Post-MVP: Reflection Workspace & Recap (Phase 3)
- [ ] 7.1 Implement rich-text reflection workspace with guided prompts and local persistence.
- [ ] 7.2 Enable export of recap (PDF via `react-pdf`) summarizing insights and user notes.
- [ ] 7.3 Add gentle wrap-up flow allowing note saving, recap download, and optional future check-ins.

## 7. Email System & Monthly Insights (Core MVP Feature)
- [ ] 7.1 Build email verification system requiring verified email before data upload
- [ ] 7.2 Create email template system for monthly insight delivery
- [ ] 7.3 Implement "First Tuesday" scheduling system for consistent monthly delivery
- [ ] 7.4 Build user email preference management (pause/resume insights)
- [ ] 7.5 Create first 2-3 insight types that can be applied to any user's static data
- [ ] 7.6 Set up email delivery infrastructure (SendGrid/Mailgun integration)

## 8. Privacy & Security (Simplified MVP Strategy)
- [x] 8.1 Update landing page with privacy-focused copy and interactive PII demo component
- [x] 8.2 Implement MVP privacy section with detailed guarantees and technical safeguards
- [ ] 8.3 Build client-side PII sanitization pipeline with regex detection for emails, phones, names, locations
- [ ] 8.4 Create contextual redaction system using typed placeholders ([PERSON], [PLACE], [EMAIL], [WORKPLACE])
- [ ] 8.5 Implement auto-sanitization summary display showing removal counts by type
- [ ] 8.6 Require email verification before allowing data upload
- [ ] 8.7 Build cloud storage for sanitized data linked to verified email accounts
- [ ] 8.8 Provide data purge control that clears cloud records and cancels insight emails

## 9. Email-Linked Data Storage
- [ ] 9.1 Set up Supabase schema for sanitized data linked to verified email accounts
- [ ] 9.2 Implement automatic cloud storage after data sanitization (no opt-in needed)
- [ ] 9.3 Build upload flow: email verification → sanitize → show summary → store for monthly insights
- [ ] 9.4 Implement Row Level Security policies isolating data by email/user ID
- [ ] 9.5 Create data retention policies and user-initiated deletion flows

## 10. Analytics & Telemetry
- [ ] 10.1 Integrate privacy-friendly analytics (self-hosted Plausible) capturing anonymized events only.
- [ ] 10.2 Instrument key funnels: onboarding completion, time-to-first insight, insight card views, reflection note saves.
- [ ] 10.3 Ensure telemetry can be disabled entirely by the user.

## 11. Basic Testing & Quality Assurance (MVP Scope)
- [ ] 11.1 Author basic unit tests for parsers, PII sanitization, and simple metric calculations.
- [ ] 11.2 Create simple integration test that validates upload → sanitize → basic insight flow.
- [ ] 11.3 Test PII detection accuracy with common patterns (names, emails, phones).
- [ ] 11.4 Manual testing of UI flow and error handling.
- [ ] 11.5 Basic deployment validation and smoke tests.

## 12. MVP Launch Preparation
- [ ] 12.1 Create basic documentation for setup and email-first approach.
- [ ] 12.2 Set up deployment pipeline to Netlify or Vercel with email system integration.
- [ ] 12.3 Create privacy policy reflecting email-linked data storage and monthly insights.
- [ ] 12.4 Set up email deliverability monitoring and engagement tracking.
- [ ] 12.5 Prepare first month's insight email template and schedule first delivery.

## Post-MVP: Advanced Features & Quality (Phase 2+)
- [ ] Advanced NLP Pipeline: Add `wink-nlp`, sentiment analysis, and sophisticated pattern detection
- [ ] Enhanced Testing: Comprehensive unit tests, Cypress integration tests, expert review sessions
- [ ] Rich Visualizations: Violin plots, heatmaps, advanced dashboard features
- [ ] Reflection Features: Rich-text workspace, PDF export, guided prompts
- [ ] Advanced Privacy: Full review interface, zero-knowledge encryption, open-source PII detection
- [ ] Platform Expansion: Bumble and OKCupid parser adapters
- [ ] AI Integration: GPT-4o mini coaching and personalized guidance
