# MVP TODOs

---
## 🎯 DEMO FOCUS - Essential Tasks to Process First Dataset

**Goal:** Get the two-stage AI analysis pipeline working end-to-end with your first dataset.

**What's Working:**
- ✅ Data ingestion & normalization (Sections 1-4)
- ✅ Stage 1: Quick Triage (Safety Screener + Report Generator)
- ✅ OpenRouter integration
- ✅ All unit tests passing (32 tests total)

**What's Needed for Demo:**
1. **Task 5.3.1:** Build Stage 2 Comprehensive Analyzer (GPT-4 Turbo)
2. **Task 5.3.2:** Create Stage 2 Report Generator
3. **Task 5.4.1:** Build Basic Orchestrator (run Stage 1 → Stage 2 if needed)
4. **Task 6.1.1:** Simple console output to view reports

**What's Deferred:**
- All UI/dashboard features (Section 6.2-6.4)
- Email notifications & authentication (Section 7)
- Privacy & security (Section 8)
- Data storage (Section 9)
- Cost monitoring & analytics (Section 10)
- Integration testing (Section 11.2-11.5)
- Launch preparation (Section 12)

---

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

## 5. Two-Stage AI Analysis Pipeline (DEMO FOCUS)

### 5.1 Foundation Components (Reusable Infrastructure) ✅
- [x] 5.1.1 Build message processing utilities for sanitized data preparation for AI analysis
- [x] 5.1.2 Implement basic metrics calculations as foundation for AI context
- [x] 5.1.3 Integrate OpenRouter for dynamic AI model selection and cost optimization
- [x] 5.1.4 Build analyzer/evaluator type system and infrastructure (reference implementations)

### 5.2 Stage 1: Quick Triage ✅
- [x] 5.2.1 Build Quick Triage Analyzer using GPT-3.5 Turbo
- [x] 5.2.2 Create Stage 1 Report Generator

### 5.3 Stage 2: Comprehensive Deep Analysis (ESSENTIAL FOR DEMO)
- [ ] 5.3.1 Build Comprehensive Analyzer using GPT-4 Turbo:
  - Safety deep dive (manipulation tactics, coercive control)
  - Attachment analysis (style determination, triggers, dynamics)
  - Growth trajectory (if 18+ months data)
  - Coherent narrative synthesis
  - Output: Complete analysis report in ONE API call
- [ ] 5.3.2 Create Stage 2 Report Generator:
  - Format comprehensive results into detailed report sections
  - Include safety analysis with examples
  - Present attachment insights
  - Show growth trajectory if applicable

### 5.4 Simple Orchestration (ESSENTIAL FOR DEMO)
- [ ] 5.4.1 Build Basic Two-Stage Orchestrator:
  - Run Stage 1 on input data
  - If orange/red risk: Run Stage 2
  - Generate appropriate report
  - Simple console logging for status

<!-- DEFERRED: Cost tracking, budget protection, advanced configuration -->
<!--
- [ ] 5.4.2 Cost tracking and budget protection (DEFERRED)
- [ ] 5.4.3 Processing configuration system (DEFERRED)
-->

## 6. Basic Report Display (DEMO FOCUS)

### 6.1 Simple Console/File Output (ESSENTIAL FOR DEMO)
- [ ] 6.1.1 Display analysis results in console:
  - Print Stage 1 report (markdown or text format)
  - Print Stage 2 report if triggered (markdown or text format)
  - Show which stage completed

<!-- DEFERRED: Full dashboard UI, authentication, real-time status -->
<!--
### 6.2 Upload Dashboard (DEFERRED)
- [ ] Basic stats overview
- [ ] Instant insights

### 6.3 Processing Status Display (DEFERRED)
- [ ] Real-time status card
- [ ] Stage transition messaging

### 6.4 Authenticated Report Dashboard (DEFERRED)
- [ ] Secure report viewing interface
- [ ] Processing metadata display
- [ ] Data management controls
-->

<!-- DEFERRED: Email system, authentication, report delivery -->
<!--
## 7. Email Notification & Report Access System (DEFERRED)

### 7.1 Email Verification & User Accounts (DEFERRED)
- [ ] Magic link authentication
- [ ] Link data to verified accounts

### 7.2 Analysis Completion Notification (DEFERRED)
- [ ] Stage-specific email templates
- [ ] Email delivery infrastructure

### 7.3 Secure Report Access (DEFERRED)
- [ ] Token-based report access
- [ ] Report access analytics

### 7.4 Report Delivery & Management (DEFERRED)
- [ ] PDF export functionality
- [ ] Feedback collection system
-->

<!-- DEFERRED: Privacy, security, data storage, cost monitoring -->
<!--
## 8. Privacy & Security (DEFERRED FOR DEMO)
- [x] 8.1 Landing page privacy copy
- [x] 8.2 MVP privacy section
- [ ] 8.3-8.9 PII sanitization, cloud storage, authentication (DEFERRED)

## 9. Data Storage (DEFERRED FOR DEMO)
- [ ] 9.1-9.6 Supabase setup, RLS policies, data retention (DEFERRED)

## 10. Cost Monitoring & Analytics (DEFERRED FOR DEMO)
- [ ] 10.1 Two-Stage Cost Tracking (DEFERRED)
- [ ] 10.2 Budget Protection & Capacity Management (DEFERRED)
- [ ] 10.3 Quality & Optimization Metrics (DEFERRED)
- [ ] 10.4 Cost Optimization Insights (DEFERRED)
-->

<!-- DEFERRED: Most testing until core pipeline works -->
<!--
## 11. Testing & Quality Assurance (MOSTLY DEFERRED)

### 11.1 Unit Testing (DONE FOR INDIVIDUAL COMPONENTS)
- [x] 11.1.1 Test data parsers and normalization
- [x] Stage 1 analyzer tests (18 tests passing)
- [x] Stage 1 report generator tests (14 tests passing)
- [ ] 11.1.2 Stage 2 analyzer tests (AFTER 5.3.1)
- [ ] 11.1.3 Stage 2 report generator tests (AFTER 5.3.2)

### 11.2-11.5 Integration Testing, AI Quality Testing, Performance Testing, Manual QA (DEFERRED)
-->

<!-- DEFERRED: Launch preparation, deployment, legal -->
<!--
## 12. MVP Launch Preparation (DEFERRED)

### 12.1 Documentation & Configuration (DEFERRED)
### 12.2 Deployment Pipeline (DEFERRED)
### 12.3 Privacy & Legal (DEFERRED)
### 12.4 Launch Readiness Checklist (DEFERRED)

## Post-MVP: Enhancement Roadmap (FUTURE)
- Phase 2: Two-Stage Refinement
- Phase 3: Advanced Features
- Phase 4: Scale & Optimize
-->
