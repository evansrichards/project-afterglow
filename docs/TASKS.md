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

## 5. Data Processor Pipeline (Analyzer/Evaluator Architecture)

### 5.1 Foundation Analyzers (Always Execute)
- [x] 5.1.1 Build message processing utilities for sanitized data preparation for AI analysis (Data Ingestion Analyzer foundation)
- [x] 5.1.2 Implement basic metrics calculations as foundation for AI context
- [x] 5.1.3 Create Safety Screener Analyzer:
  - Basic red flag detection (threats, financial requests, explicit manipulation)
  - Risk level assessment (green/yellow/orange/red)
  - Generate escalation flags for Risk Evaluator triggering
  - Output: Safety baseline + risk level
- [x] 5.1.4 Build Pattern Recognizer Analyzer:
  - Communication style and consistency analysis
  - Attachment behavioral marker identification
  - Authenticity and vulnerability pattern detection
  - Boundary setting and respect evaluation
  - Output: Core behavioral patterns + complexity flags
- [ ] 5.1.5 Implement Chronology Mapper Analyzer:
  - Time-based conversation segmentation
  - Recent pattern weighting (last 6 months heavier)
  - Growth trajectory and transition detection
  - Life stage context mapping
  - Output: Time-weighted evolution data + growth flags

### 5.2 Conditional Evaluators (Triggered by Analysis)
- [ ] 5.2.1 Build Risk Evaluator (triggered by yellow/orange/red safety flags):
  - Advanced manipulation tactic detection
  - Coercive control pattern analysis
  - Trauma bonding indicator assessment
  - Output: Detailed safety analysis + crisis flags
  - AI Model: GPT-4 with specialized safety prompts
- [ ] 5.2.2 Create Attachment Evaluator (triggered by mixed signals or rich data):
  - Sophisticated attachment style determination
  - Trigger and coping mechanism identification
  - Relationship dynamic analysis
  - Output: Nuanced attachment insights
  - AI Model: GPT-4 with attachment theory expertise
- [ ] 5.2.3 Implement Growth Evaluator (triggered by 18+ months + evolution):
  - Detailed skill progression tracking
  - Personal development opportunity identification
  - Customized growth recommendation generation
  - Output: Personalized development roadmap
  - AI Model: GPT-4 Turbo for comprehensive analysis
- [ ] 5.2.4 Build Crisis Evaluator (triggered by high-risk patterns):
  - Comprehensive threat assessment
  - Professional resource identification
  - Safety planning and support system analysis
  - Output: Crisis intervention recommendations
  - AI Model: GPT-4 with maximum safety focus

### 5.3 Synthesis & Orchestration
- [x] 5.3.1 Build Insight Synthesizer foundation (combines analyzer outputs into coherent insights)
- [ ] 5.3.2 Complete Insight Synthesizer:
  - Combine all analyzer and evaluator outputs
  - Generate coherent narrative insights
  - Prioritize findings by importance and actionability
  - Create user-friendly report sections
  - Output: Complete analysis report
- [ ] 5.3.3 Implement Data Processor Orchestrator:
  - Sequential analyzer execution (Ingestion → Safety → Pattern → Chronology)
  - Parallel evaluator triggering based on analyzer outputs
  - Processing status tracking and user-visible updates
  - Error handling and fallback management
  - Processing metadata collection (duration, tokens, quality scores)

### 5.4 Infrastructure & Cost Management
- [x] 5.4.1 Integrate OpenRouter for dynamic AI model selection and cost optimization
- [ ] 5.4.2 Build evaluator trigger logic:
  - Risk Evaluator: yellow/orange/red safety flags OR manipulation patterns
  - Attachment Evaluator: mixed signals OR complexity threshold > 0.3
  - Growth Evaluator: 18+ months data AND evolution detected
  - Crisis Evaluator: orange/red risk level from Risk Evaluator
- [ ] 5.4.3 Implement cost tracking per component:
  - Track analyzer costs (minimal - GPT-3.5 Turbo level)
  - Track evaluator costs (high - GPT-4 level)
  - Total cost per analysis with component breakdown
  - Budget protection with alert thresholds
- [ ] 5.4.4 Create processing configuration system:
  - Configurable trigger thresholds for each evaluator
  - Model assignment per analyzer/evaluator
  - Processing timeout and fallback settings
  - Resource limit enforcement

## 6. Processing Dashboard & Report System

### 6.1 Upload Dashboard (Immediate Feedback)
- [ ] 6.1.1 Design high-level statistics overview:
  - Total matches analyzed
  - Total messages processed
  - Average conversation length
  - Data upload date and sanitization summary
- [ ] 6.1.2 Build 2-3 instant insights (available immediately):
  - Conversation balance overview
  - Response timing patterns
  - Most active conversation periods

### 6.2 Processing Status Display
- [ ] 6.2.1 Create "Analysis Processing Status" card with real-time updates:
  - Current processing phase (Foundation/Analysis/Evaluation/Synthesis)
  - Active analyzer/evaluator names with user-friendly labels:
    - "Analyzing your conversations..." (Data Ingestion)
    - "Running safety assessment..." (Safety Screener)
    - "Identifying communication patterns..." (Pattern Recognizer)
    - "Analyzing growth over time..." (Chronology Mapper)
    - "Running advanced analysis..." (Evaluators triggered)
    - "Generating your insights..." (Insight Synthesizer)
  - Email notification status
  - Processing started timestamp
- [ ] 6.2.2 Show which evaluators were triggered and why:
  - "Deep safety analysis recommended" (Risk Evaluator)
  - "Complex attachment patterns detected" (Attachment Evaluator)
  - "Significant growth trajectory identified" (Growth Evaluator)
  - "Safety planning resources included" (Crisis Evaluator)

### 6.3 Authenticated Report Dashboard
- [ ] 6.3.1 Build secure report viewing interface accessible via email link:
  - Token-based authentication with secure session management
  - Report sections organized by analyzer/evaluator outputs
  - Safety assessment results (always present from Safety Screener)
  - Pattern analysis insights (always present from Pattern Recognizer)
  - Growth trajectory (always present from Chronology Mapper)
  - Conditional sections based on triggered evaluators
- [ ] 6.3.2 Display processing metadata for transparency:
  - Which analyzers completed successfully
  - Which evaluators were triggered and why
  - Processing duration and completion timestamp
  - Quality confidence scores where applicable
- [ ] 6.3.3 Add comprehensive data management controls:
  - View full report with all insights
  - Download report as PDF
  - Delete all data (cloud storage + analysis results)
  - Re-run analysis option (for future iterations)

## 7. Email Notification & Report Access System

### 7.1 Email Verification & User Accounts
- [ ] 7.1.1 Build email verification flow:
  - Magic link authentication (passwordless)
  - Email verification before data upload allowed
  - Supabase auth integration for secure account management
- [ ] 7.1.2 Link uploaded data to verified email accounts:
  - Associate sanitized data with user account
  - Enable report access via authenticated sessions
  - Support data retrieval across sessions

### 7.2 Analysis Completion Notification
- [ ] 7.2.1 Create email notification template:
  - Analysis completion summary with key findings preview
  - Which analyzers completed (always: Safety, Pattern, Chronology)
  - Which evaluators triggered (conditional: Risk, Attachment, Growth, Crisis)
  - Secure token-based link to full report dashboard
  - Clear call-to-action to view complete insights
- [ ] 7.2.2 Set up email delivery infrastructure:
  - SendGrid or Mailgun integration for reliable delivery
  - Email template with branded styling
  - Track delivery status (sent, delivered, opened)

### 7.3 Secure Report Access
- [ ] 7.3.1 Implement token-based report access:
  - Generate secure, expiring access tokens
  - Email link authenticates user and grants report access
  - Session management for authenticated report viewing
- [ ] 7.3.2 Build report access analytics:
  - Track when reports are viewed
  - Monitor report section engagement (which insights viewed)
  - Measure time spent on different analysis sections

### 7.4 Report Delivery & Management
- [ ] 7.4.1 Add report export functionality:
  - PDF download with all insights and metadata
  - Include processing transparency (which evaluators ran, why)
  - Privacy-safe export (no PII, sanitized examples only)
- [ ] 7.4.2 Create feedback collection system:
  - In-report feedback prompts for insight quality
  - "Was this insight helpful?" for each section
  - Optional qualitative feedback for improvement
  - Track feedback to improve analyzer/evaluator prompts

## 8. Privacy & Security (One-Time Analysis Strategy)

- [x] 8.1 Update landing page with privacy-focused copy and interactive PII demo component
- [x] 8.2 Implement MVP privacy section with detailed guarantees and technical safeguards
- [ ] 8.3 Build client-side PII sanitization pipeline with regex detection for emails, phones, names, locations
- [ ] 8.4 Create contextual redaction system using typed placeholders ([PERSON], [PLACE], [EMAIL], [WORKPLACE])
- [ ] 8.5 Implement auto-sanitization summary display showing removal counts by type
- [ ] 8.6 Require email verification before allowing data upload
- [ ] 8.7 Build secure cloud storage for sanitized data linked to verified email accounts
- [ ] 8.8 Implement secure report access with token-based authentication
- [ ] 8.9 Provide comprehensive data purge control that clears cloud records and deletes analysis reports

## 9. One-Time Analysis Data Storage

- [ ] 9.1 Set up Supabase schema for sanitized data and analysis results linked to verified email accounts
- [ ] 9.2 Implement automatic cloud storage after data sanitization for analysis processing
- [ ] 9.3 Build upload flow: email verification → sanitize → show summary → trigger analysis → store results
- [ ] 9.4 Implement Row Level Security policies isolating data and reports by email/user ID
- [ ] 9.5 Create data retention policies and user-initiated deletion flows for both raw data and analysis reports
- [ ] 9.6 Build analysis result storage with secure access controls and session management

## 10. AI Cost Monitoring & Analytics

### 10.1 Component-Level Cost Tracking
- [ ] 10.1.1 Track analyzer costs (Foundation Phase):
  - Safety Screener: GPT-3.5 Turbo usage
  - Pattern Recognizer: GPT-4 Turbo usage
  - Chronology Mapper: GPT-4 Turbo usage
  - Per-component token consumption and costs
- [ ] 10.1.2 Track evaluator costs (Evaluation Phase):
  - Risk Evaluator: GPT-4 usage when triggered
  - Attachment Evaluator: GPT-4 usage when triggered
  - Growth Evaluator: GPT-4 Turbo usage when triggered
  - Crisis Evaluator: GPT-4 usage when triggered
  - Track trigger frequency for each evaluator
- [ ] 10.1.3 Calculate total cost per analysis:
  - Sum all analyzer costs (always runs)
  - Sum triggered evaluator costs (conditional)
  - Track average cost across all analyses
  - Monitor cost distribution histogram

### 10.2 Budget Protection & Capacity Management
- [ ] 10.2.1 Implement real-time budget monitoring:
  - Track total spend against $2000 six-month budget
  - Alert at 50%, 75%, 90% budget thresholds
  - Calculate remaining user capacity based on average costs
- [ ] 10.2.2 Build dynamic capacity limits:
  - Estimate users remaining based on current cost averages
  - Display capacity to admin dashboard
  - Soft-stop new uploads at 95% budget consumption
  - Emergency processing pause at 100% budget

### 10.3 Quality & Optimization Metrics
- [ ] 10.3.1 Monitor evaluator trigger rates:
  - Percentage of analyses triggering each evaluator
  - Validate trigger logic accuracy (should match expectations)
  - Track correlation between evaluators (e.g., Risk → Crisis)
- [ ] 10.3.2 Track analysis quality metrics:
  - User feedback ratings per report section
  - Time spent viewing each insight category
  - Report access rate after email notification
  - Feedback on analyzer vs evaluator insights
- [ ] 10.3.3 Integrate privacy-friendly analytics:
  - Self-hosted Plausible for user behavior tracking
  - Upload-to-completion time funnel
  - Report access and engagement metrics
  - No PII or message content tracking

### 10.4 Cost Optimization Insights
- [ ] 10.4.1 Build cost optimization dashboard:
  - Average cost per analyzer/evaluator
  - Most expensive components identified
  - Trigger threshold tuning recommendations
  - Model selection optimization suggestions
- [ ] 10.4.2 Create automated cost reports:
  - Weekly budget consumption summary
  - Projected capacity remaining
  - Evaluator trigger frequency analysis
  - Recommendations for threshold adjustments

## 11. Testing & Quality Assurance

### 11.1 Unit Testing
- [ ] 11.1.1 Test data parsers and normalization (already covered in earlier tasks)
- [ ] 11.1.2 Test PII sanitization pipeline with various PII types
- [ ] 11.1.3 Test analyzer trigger logic independently:
  - Safety Screener risk assessment output
  - Pattern Recognizer complexity scoring
  - Chronology Mapper evolution detection
- [ ] 11.1.4 Test evaluator trigger conditions:
  - Risk Evaluator triggers on correct safety flags
  - Attachment Evaluator triggers on mixed signals
  - Growth Evaluator triggers on timeline + evolution
  - Crisis Evaluator triggers on high-risk patterns

### 11.2 Integration Testing
- [ ] 11.2.1 Test complete processing pipeline:
  - Upload → Sanitize → Analyzers → Evaluators → Synthesis → Report
  - Verify sequential analyzer execution
  - Verify parallel evaluator execution where possible
  - Confirm Insight Synthesizer receives all outputs
- [ ] 11.2.2 Test processing status updates:
  - Verify user-visible status messages appear correctly
  - Confirm processing metadata tracked accurately
  - Validate evaluator trigger transparency in UI
- [ ] 11.2.3 Test email notification and report access flow:
  - Email sent after Insight Synthesizer completes
  - Secure token generation and validation
  - Report dashboard displays all relevant sections
  - Conditional sections only shown when evaluators triggered

### 11.3 AI Analysis Quality Testing
- [ ] 11.3.1 Test with sample conversation datasets:
  - Low-risk conversations (only core analyzers)
  - Medium-risk with manipulation flags (Risk Evaluator triggered)
  - Complex attachment patterns (Attachment Evaluator triggered)
  - Long-term growth trajectory (Growth Evaluator triggered)
  - High-risk crisis scenarios (Crisis Evaluator triggered)
- [ ] 11.3.2 Validate analyzer outputs:
  - Safety Screener correctly identifies red flags
  - Pattern Recognizer detects attachment markers
  - Chronology Mapper weights recent patterns appropriately
- [ ] 11.3.3 Validate evaluator quality:
  - Risk Evaluator provides actionable safety insights
  - Attachment Evaluator offers nuanced psychological analysis
  - Growth Evaluator identifies genuine development opportunities
  - Crisis Evaluator recommends appropriate professional resources

### 11.4 Cost & Performance Testing
- [ ] 11.4.1 Test cost tracking accuracy:
  - Verify analyzer costs calculated correctly
  - Verify evaluator costs tracked only when triggered
  - Confirm total cost per analysis matches expectations
- [ ] 11.4.2 Validate budget protection:
  - Test alerts at budget thresholds
  - Verify capacity calculations accurate
  - Confirm emergency pause mechanisms work
- [ ] 11.4.3 Test OpenRouter integration:
  - Model selection per analyzer/evaluator
  - Fallback mechanisms on API errors
  - Cost tracking per model used

### 11.5 Manual Quality Assurance
- [ ] 11.5.1 Expert review of AI-generated insights:
  - Dating coaches review pattern insights
  - Safety experts review Risk/Crisis Evaluator outputs
  - Therapists review Attachment Evaluator analysis
- [ ] 11.5.2 End-to-end user experience testing:
  - Upload flow usability
  - Processing status clarity
  - Email notification quality
  - Report dashboard comprehension
  - Feedback collection workflow

## 12. MVP Launch Preparation

### 12.1 Documentation & Configuration
- [ ] 12.1.1 Document Data Processor architecture:
  - Analyzer vs Evaluator distinction
  - Processing pipeline flow (sequential + parallel)
  - Trigger conditions for each evaluator
  - Model selection per component
  - Cost expectations and budget strategy
- [ ] 12.1.2 Create configuration documentation:
  - Trigger threshold settings and rationale
  - Model assignments (GPT-3.5 for Safety, GPT-4 for evaluators)
  - Processing timeout and fallback settings
  - Budget alert thresholds

### 12.2 Deployment Pipeline
- [ ] 12.2.1 Set up production deployment:
  - Frontend deployment (Netlify/Vercel)
  - Supabase production database with RLS policies
  - OpenRouter API integration with production keys
  - Email delivery service (SendGrid/Mailgun)
- [ ] 12.2.2 Configure environment variables:
  - OpenRouter API keys and model preferences
  - Email service credentials
  - Supabase connection and auth settings
  - Budget monitoring thresholds
- [ ] 12.2.3 Set up monitoring and alerting:
  - AI cost tracking dashboard
  - Budget consumption alerts
  - Processing failure notifications
  - Email delivery monitoring

### 12.3 Privacy & Legal
- [ ] 12.3.1 Create privacy policy:
  - One-time analysis model explained
  - Data sanitization process transparency
  - Email-linked account data storage
  - Report access and deletion controls
  - No data sharing or third-party access
- [ ] 12.3.2 Update terms of service:
  - Analysis provided "as-is" for self-reflection
  - Not professional therapy or medical advice
  - Safety insights are recommendations, not guarantees
  - User responsibility for action on insights

### 12.4 Launch Readiness Checklist
- [ ] 12.4.1 Verify all core components operational:
  - Data upload and sanitization working
  - All analyzers executing successfully
  - Evaluator triggering logic validated
  - Email notifications delivering
  - Report dashboard accessible and secure
- [ ] 12.4.2 Test with real-world sample data:
  - Process 5-10 real dating app exports
  - Verify cost per analysis within budget
  - Confirm evaluator trigger rates reasonable
  - Validate insight quality and helpfulness
- [ ] 12.4.3 Prepare for soft launch:
  - Set initial user capacity limit (50-100 users)
  - Monitor costs closely during beta period
  - Collect detailed user feedback
  - Iterate on trigger thresholds based on results

## Post-MVP: Enhancement Roadmap (Phase 2+)

### Phase 2: Analyzer/Evaluator Refinement (Month 1-3)
- [ ] Optimize evaluator trigger thresholds based on beta user data
- [ ] Refine analyzer prompts for better pattern detection accuracy
- [ ] Improve evaluator output quality with expert feedback integration
- [ ] Add analyzer confidence scores to guide evaluator triggering
- [ ] Implement A/B testing for different prompt strategies

### Phase 3: Advanced Features (Month 4-6)
- [ ] Interactive report features with deeper insight exploration
- [ ] Comparative analysis (track changes if user re-uploads data)
- [ ] Enhanced Growth Evaluator with specific skill development tracking
- [ ] Community-sourced pattern library for faster analysis
- [ ] Expert review integration for high-stakes insights

### Phase 4: Scale & Optimize (Month 7-9)
- [ ] Hybrid AI/rule-based system for common patterns (cost reduction)
- [ ] Template-based insights for frequent attachment styles
- [ ] Batch processing optimization for multiple users
- [ ] Platform expansion (Bumble, OKCupid) with new parsers
- [ ] International support with culturally-aware analysis

### Future Considerations
- [ ] Optional recurring analysis with new psychological frameworks
- [ ] Premium deep-dive analysis tiers for advanced insights
- [ ] Therapist/coach partnership program for follow-up support
- [ ] Anonymized insights sharing for community learning
