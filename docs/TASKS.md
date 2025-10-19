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

## 5. AI-Heavy Analytics Pipeline (Value-Proving MVP)
- [x] 5.1 Build message processing utilities for sanitized data preparation for AI analysis.
- [x] 5.2 Implement basic metrics calculations as foundation for AI context.
- [x] 5.3 Create pattern recognition framework for AI prompt optimization.
- [x] 5.3.1 Build insight generation system with friendly summaries and sanitized examples (foundation for AI insights).
- [ ] 5.4 Integrate OpenRouter for dynamic AI model selection and cost optimization.
- [ ] 5.5 Implement comprehensive AI conversation analysis:
  - Deep attachment style detection using GPT-4
  - Manipulation and red flag pattern identification
  - Communication strength and authenticity analysis
  - Personalized growth opportunity recognition
- [ ] 5.6 Build AI insight generation system with personalized recommendations.
- [ ] 5.7 Create cost tracking and monitoring for AI usage against $2000 budget.
- [ ] 5.8 Implement model selection strategy (GPT-4 for analysis, GPT-3.5 for summaries, etc.).

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

## 7. AI-Powered Email System & Monthly Insights
- [ ] 7.1 Build email verification system requiring verified email before data upload
- [ ] 7.2 Create dynamic email template system for AI-generated insight delivery
- [ ] 7.3 Implement "First Tuesday" scheduling system with AI analysis pipeline
- [ ] 7.4 Build user email preference management (pause/resume insights)
- [ ] 7.5 Create AI-powered monthly theme generation based on user patterns and trends
- [ ] 7.6 Set up email delivery infrastructure (SendGrid/Mailgun integration)
- [ ] 7.7 Implement AI insight personalization system for individual user contexts
- [ ] 7.8 Build feedback collection system to improve AI prompt effectiveness

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

## 10. AI Cost Monitoring & Analytics
- [ ] 10.1 Build AI cost tracking dashboard with real-time budget monitoring against $2000 limit.
- [ ] 10.2 Implement cost alerts and user capacity limits (85 users/month) to prevent budget overruns.
- [ ] 10.3 Track AI model usage and cost per analysis type for optimization insights.
- [ ] 10.4 Monitor AI analysis quality metrics (user ratings, engagement, feedback).
- [ ] 10.5 Integrate privacy-friendly analytics (self-hosted Plausible) for user behavior tracking.
- [ ] 10.6 Instrument AI-specific funnels: upload-to-insight time, AI insight engagement, model effectiveness.
- [ ] 10.7 Create cost optimization recommendations based on usage patterns.
- [ ] 10.8 Build automated budget warnings and emergency cost reduction protocols.

## 11. AI-Focused Testing & Quality Assurance
- [ ] 11.1 Author unit tests for parsers, PII sanitization, and AI integration components.
- [ ] 11.2 Create integration test that validates upload → sanitize → AI analysis → insight generation flow.
- [ ] 11.3 Test AI prompt effectiveness and output quality with sample conversation data.
- [ ] 11.4 Implement AI cost testing with mock data to validate budget projections.
- [ ] 11.5 Test OpenRouter model selection and fallback mechanisms.
- [ ] 11.6 Manual testing of AI insight quality and user experience.
- [ ] 11.7 Validate AI analysis accuracy against expert review for safety-critical insights.
- [ ] 11.8 Test email delivery system with AI-generated content.

## 12. AI-Heavy MVP Launch Preparation
- [ ] 12.1 Create documentation for AI analysis approach and cost optimization strategy.
- [ ] 12.2 Set up deployment pipeline with OpenRouter integration and monitoring.
- [ ] 12.3 Create privacy policy reflecting AI analysis of sanitized data.
- [ ] 12.4 Implement AI cost monitoring dashboard and budget alerts.
- [ ] 12.5 Set up email deliverability monitoring and AI insight engagement tracking.
- [ ] 12.6 Prepare AI-generated first month insight templates and test delivery.
- [ ] 12.7 Implement user capacity limits (85 users/month) to manage AI costs.
- [ ] 12.8 Create AI analysis quality metrics and feedback collection system.

## OpenRouter Model Selection Strategy
- [ ] Set up OpenRouter integration for dynamic model selection and cost optimization
- [ ] Implement model selection logic based on analysis type:
  - **GPT-4 (High Cost, High Quality):** Complex manipulation detection, attachment style analysis
  - **GPT-4 Turbo (Medium Cost):** Comprehensive conversation analysis, personalized insights
  - **GPT-3.5 Turbo (Low Cost):** Summary generation, simple pattern descriptions
  - **Claude-3 Haiku (Ultra Low Cost):** Basic categorization, data validation
- [ ] Create fallback model hierarchy for cost management and availability
- [ ] Implement cost tracking per model to optimize budget allocation
- [ ] Build A/B testing framework for model effectiveness vs. cost

## Post-MVP: AI Optimization & Advanced Features (Phase 2+)
- [ ] Cost Optimization Pipeline: Transition to hybrid AI/rule-based system based on 6 months of data
- [ ] Enhanced AI Testing: Prompt optimization, model comparison studies, expert validation
- [ ] Rich AI Visualizations: AI-generated charts and insights visualization
- [ ] Advanced AI Features: Multi-conversation analysis, trend prediction, behavioral modeling
- [ ] AI Privacy Enhancements: Local AI processing options, differential privacy for aggregate insights
- [ ] Platform Expansion: AI analysis for Bumble and OKCupid with platform-specific prompts
- [ ] Enterprise AI Features: Therapist collaboration tools, research insights, B2B offerings
