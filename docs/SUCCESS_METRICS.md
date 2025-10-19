# Project Afterglow — MVP Success Metrics Dashboard

## Overview
This document defines the success metrics, key performance indicators (KPIs), and instrumentation strategy for Project Afterglow's MVP. Metrics align with our core mission: helping users gain compassionate insights from their dating data while maintaining privacy and building trust.

## Metric Categories

### 1. Onboarding & Activation Metrics

#### 1.1 Onboarding Completion Rate
**Definition:** Percentage of visitors who successfully complete the journey from landing page to viewing their first insight.

**Calculation:**
```
Onboarding Completion Rate = (Users who view insights / Landing page visitors) × 100
```

**Instrumentation Points:**
- `landing_page_view` — User arrives at landing page
- `upload_initiated` — User clicks upload or drags file
- `file_validated` — File passes validation checks
- `parsing_started` — Processing begins
- `parsing_completed` — Data successfully normalized
- `first_insight_viewed` — User sees overview dashboard

**Success Threshold:** ≥60% of users who initiate upload complete to first insight view

**Why It Matters:** High completion indicates clear value communication, smooth upload UX, and reliable parsing. Drop-offs reveal friction points needing attention.

---

#### 1.2 Time to First Insight
**Definition:** Elapsed time from file upload initiation to viewing the insights overview dashboard.

**Calculation:**
```
Time to First Insight = timestamp(first_insight_viewed) - timestamp(upload_initiated)
```

**Instrumentation Points:**
- Track timestamps at `upload_initiated` and `first_insight_viewed`
- Capture file size and message count as context variables

**Success Threshold:** ≤90 seconds for 80th percentile of users with typical datasets (500-2000 messages)

**Why It Matters:** Long waits increase abandonment. This metric helps optimize parsing performance and set user expectations.

---

### 2. Engagement & Discovery Metrics

#### 2.1 Deep Dive Engagement Rate
**Definition:** Percentage of users who explore at least two in-depth insight sections beyond the overview.

**Calculation:**
```
Deep Dive Engagement Rate = (Users viewing ≥2 sections / Users viewing insights) × 100
```

**Instrumentation Points:**
- `section_viewed` — Track section type: `momentum_tracker`, `emotional_climate`, `boundary_scanner`, `self_reflection`, `reciprocity_gauge`, `strengths_spotlight`, `growth_opportunities`
- Capture unique section count per session
- Track time spent per section (optional, for depth analysis)

**Success Threshold:** ≥50% of users engage with 2+ sections

**Why It Matters:** High engagement shows users find insights compelling and relevant. Low engagement may indicate unclear navigation, overwhelming content, or misaligned expectations.

---

#### 2.2 Insight Card Interaction Rate
**Definition:** Average number of insight cards viewed per user session.

**Calculation:**
```
Avg Insight Cards Viewed = Total insight cards viewed / Total user sessions
```

**Instrumentation Points:**
- `insight_card_viewed` — Track card ID, pattern type, and evidence snippet count
- `insight_card_expanded` — User clicks to see full details
- `insight_card_bookmarked` — User saves for later reflection (if feature added)

**Success Threshold:** ≥5 cards viewed per session on average

**Why It Matters:** Indicates how well insights resonate and whether users explore multiple patterns. Helps identify most/least engaging insight types.

---

#### 2.3 Evidence Snippet Engagement
**Definition:** Percentage of insight cards where users view supporting message snippets.

**Calculation:**
```
Snippet Engagement Rate = (Cards with snippet views / Total cards viewed) × 100
```

**Instrumentation Points:**
- `snippet_viewed` — User expands evidence section
- Track snippet type (conversation excerpt, metric visualization, etc.)

**Success Threshold:** ≥30% of cards have snippet views

**Why It Matters:** Shows users trust and validate insights through original data, supporting our explainability principle.

---

### 3. Reflection & Action Metrics

#### 3.1 Reflection Note Save Rate
**Definition:** Average number of reflection notes saved per user session.

**Calculation:**
```
Avg Reflection Notes = Total notes saved / Users who accessed reflection workspace
```

**Instrumentation Points:**
- `reflection_workspace_opened` — User navigates to reflection area
- `reflection_note_created` — User starts typing
- `reflection_note_saved` — Note persisted to local storage
- `reflection_prompt_used` — Track which guided prompts were used

**Success Threshold:** ≥1.5 notes saved per user who opens workspace

**Why It Matters:** Reflection notes signal genuine engagement and behavior change intent. High rates suggest users find the experience transformative, not just informational.

---

#### 3.2 Recap Export Rate
**Definition:** Percentage of users who download their personalized recap (PDF).

**Calculation:**
```
Recap Export Rate = (Users who export recap / Total users viewing insights) × 100
```

**Instrumentation Points:**
- `recap_viewed` — User navigates to wrap-up/recap section
- `recap_exported` — PDF download triggered
- Capture recap content sections included (insights, notes, action items)

**Success Threshold:** ≥25% of users export recap

**Why It Matters:** Exports indicate users want to revisit insights or share with trusted others (e.g., therapist, friend). High export rates suggest lasting value.

---

#### 3.3 Future Check-In Opt-In Rate
**Definition:** Percentage of users who opt into future check-ins or updates.

**Calculation:**
```
Check-In Opt-In Rate = (Users opting in / Users completing session) × 100
```

**Instrumentation Points:**
- `check_in_prompt_shown` — Opt-in offer displayed
- `check_in_accepted` — User opts in
- `check_in_declined` — User declines

**Success Threshold:** ≥15% opt-in rate

**Why It Matters:** Shows user satisfaction and interest in longitudinal tracking. Helps build a returning user base for future features.

---

### 4. Satisfaction & Sentiment Metrics

#### 4.1 Net Promoter Score (NPS)
**Definition:** Measures user willingness to recommend Project Afterglow to others.

**Survey Question:**
> "How likely are you to recommend Project Afterglow to a friend or colleague who's actively dating?"
> (0-10 scale)

**Calculation:**
```
NPS = % Promoters (9-10) - % Detractors (0-6)
```

**Instrumentation:**
- Triggered 24-48 hours after first session via optional in-app prompt or email
- Include open-ended follow-up: "What's the main reason for your score?"

**Success Threshold:** NPS ≥40

**Why It Matters:** Gold-standard metric for product-market fit and user satisfaction. Qualitative feedback reveals strengths to amplify and pain points to address.

---

#### 4.2 Tone & Trust Sentiment Score
**Definition:** User perception of whether the tone felt supportive, nonjudgmental, and trustworthy.

**Survey Questions (5-point Likert scale):**
1. "The insights felt supportive and nonjudgmental."
2. "I felt in control of my data throughout the experience."
3. "The language used felt warm and validating, not clinical or cold."

**Calculation:**
```
Tone Score = (Strongly Agree + Agree responses / Total responses) × 100
```

**Instrumentation:**
- Optional post-session micro-survey (3 questions max)
- Track sentiment per insight section for granular feedback

**Success Threshold:** ≥80% agree or strongly agree across all three statements

**Why It Matters:** Core to brand promise. High scores validate tone guidelines; low scores demand copy revisions.

---

### 5. Privacy & Control Metrics

#### 5.1 Data Purge Usage Rate
**Definition:** Percentage of users who use the "Forget Me" / instant purge feature.

**Calculation:**
```
Purge Usage Rate = (Users who purge data / Total users) × 100
```

**Instrumentation Points:**
- `purge_prompted` — User views purge control
- `purge_confirmed` — User completes data deletion
- Track when in session purge occurs (before insights, after insights, etc.)

**Success Threshold:** Low rate (<5%) is good; means users feel safe. High rate (>20%) may signal trust issues.

**Why It Matters:** Offers insight into user comfort with data retention. Ensures feature visibility without creating anxiety.

---

#### 5.2 Privacy Assurance View Rate
**Definition:** Percentage of users who interact with privacy explainers or FAQs.

**Calculation:**
```
Privacy View Rate = (Users viewing privacy content / Total visitors) × 100
```

**Instrumentation Points:**
- `privacy_explainer_viewed` — User clicks privacy info tooltip or modal
- `faq_privacy_section_viewed` — User navigates to privacy FAQ

**Success Threshold:** 15-30% view rate (shows interest without overwhelming skepticism)

**Why It Matters:** Indicates whether privacy messaging is accessible and whether users need reassurance.

---

### 6. Technical Performance Metrics

#### 6.1 Parsing Success Rate
**Definition:** Percentage of uploaded files that successfully parse and generate insights.

**Calculation:**
```
Parsing Success Rate = (Successful parses / Total file uploads) × 100
```

**Instrumentation Points:**
- `parsing_failed` — Track error type (validation, schema mismatch, corrupt file)
- Capture platform (Tinder, Hinge) and file metadata for diagnosis

**Success Threshold:** ≥95% success rate

**Why It Matters:** Core product reliability. Failures block entire experience. Errors inform parser improvements and user-facing error messaging.

---

#### 6.2 Schema Drift Detection Rate
**Definition:** Frequency of encountering unknown fields or schema changes in uploaded exports.

**Calculation:**
```
Schema Drift Rate = (Files with unknown fields / Total files parsed) × 100
```

**Instrumentation Points:**
- `unknown_field_detected` — Log field name, file type, and frequency
- `schema_version_mismatch` — New export format doesn't match stored adapter version

**Success Threshold:** <10% drift rate without breaking insights

**Why It Matters:** Dating apps update export formats unpredictably. Early detection helps maintain adapter reliability and avoid breaking changes.

---

### 7. Error & Drop-Off Metrics

#### 7.1 Upload Abandonment Rate
**Definition:** Percentage of users who initiate upload but don't complete file selection.

**Calculation:**
```
Upload Abandonment = (upload_initiated - file_validated) / upload_initiated × 100
```

**Instrumentation Points:**
- Track state transitions: `upload_initiated` → `file_selected` → `file_validated`
- Capture reasons if validation fails

**Success Threshold:** <15% abandonment

**Why It Matters:** High abandonment suggests confusing instructions, file access issues, or validation friction.

---

#### 7.2 Error Message Display Rate
**Definition:** Frequency users encounter error messages during the experience.

**Calculation:**
```
Error Display Rate = (Sessions with errors / Total sessions) × 100
```

**Instrumentation Points:**
- `error_displayed` — Track error type (parsing, validation, timeout, browser incompatibility)
- Capture user recovery actions (retry, skip, abandon)

**Success Threshold:** <10% of sessions encounter errors

**Why It Matters:** Errors degrade trust and satisfaction. Tracking helps prioritize stability improvements.

---

## Instrumentation Architecture

### Event Schema
All telemetry events follow this structure:

```typescript
interface TelemetryEvent {
  event_id: string;              // UUID
  session_id: string;            // Per-session identifier (no PII)
  event_name: string;            // e.g., "insight_card_viewed"
  timestamp: string;             // ISO 8601
  properties?: Record<string, unknown>;  // Event-specific metadata
  user_consented: boolean;       // Explicit telemetry opt-in
}
```

### Privacy-Safe Properties
Never track:
- Message content
- Match names or personal identifiers
- User email or contact info
- Geolocation beyond country-level (if needed for localization)

Always anonymize:
- Session IDs are ephemeral and rotate per-session
- Use hashed device fingerprints only if cloud sync enabled
- Aggregate counts and percentages, not individual records

---

## Telemetry Implementation

### Client-Side Library
- Use **Plausible Analytics** (self-hosted or privacy-focused cloud tier)
- Configure custom event tracking via their API
- Respect Do Not Track (DNT) browser headers
- Provide in-app toggle to disable all telemetry

### Storage & Retention
- Store events in Supabase or dedicated analytics database
- Aggregate daily for dashboard queries
- Purge raw events after 90 days; retain aggregated reports indefinitely

---

## Dashboard Design

### MVP Metrics Dashboard (Internal Use)
**Real-time Overview Panel:**
- Onboarding completion funnel (landing → upload → insights)
- Active sessions in last 24h/7d/30d
- Average insight cards viewed per session
- NPS score trend

**Engagement Deep Dive:**
- Top-viewed insight sections (bar chart)
- Reflection note save rate over time (line chart)
- Recap export rate by user cohort

**Health Indicators:**
- Parsing success rate (gauge)
- Error rate by type (stacked bar)
- Schema drift alerts (notification feed)

**Feedback Loop:**
- Recent NPS comments with sentiment tagging
- User-reported issues linked to error logs

### Tech Stack
- **Frontend:** React + Recharts or Tremor for visualizations
- **Backend:** Supabase Edge Functions for aggregation queries
- **Refresh Rate:** Daily batch updates, with option for hourly during launch week

---

## Measurement Cadence

### Weekly Reviews
- Monitor onboarding completion and time-to-insight trends
- Review error logs and prioritize fixes
- Check NPS verbatims for emerging themes

### Monthly Deep Dives
- Cohort analysis: compare engagement by acquisition channel or date
- Feature impact assessment: did new insight types increase engagement?
- Privacy metric review: purge usage, privacy explainer views

### Quarterly Roadmap Input
- Identify underperforming metrics needing design/copy changes
- Surface most-loved features for amplification
- Plan new metrics for upcoming feature releases

---

## Success Criteria Summary

| Metric | Target | Monitoring Frequency |
|--------|--------|---------------------|
| Onboarding Completion Rate | ≥60% | Weekly |
| Time to First Insight (p80) | ≤90 seconds | Weekly |
| Deep Dive Engagement Rate | ≥50% | Weekly |
| Avg Insight Cards Viewed | ≥5 per session | Weekly |
| Reflection Notes Saved | ≥1.5 per workspace user | Weekly |
| Recap Export Rate | ≥25% | Weekly |
| NPS Score | ≥40 | Monthly |
| Tone & Trust Sentiment | ≥80% positive | Monthly |
| Parsing Success Rate | ≥95% | Daily |
| Error Display Rate | <10% | Daily |

---

## Iteration Process

### A/B Testing Opportunities
- Upload instruction copy variations
- Insight card layouts (compact vs. expanded)
- Reflection prompt phrasing
- Privacy explainer placement

### Feedback Integration
- Link qualitative NPS responses to quantitative drop-off points
- Use tone sentiment to refine copy in low-scoring sections
- Track feature requests in open-ended survey responses

### Data-Driven Decisions
- If time-to-insight exceeds threshold, optimize parser or add progress indicators
- If deep dive engagement is low, test gamification (e.g., "unlock next insight")
- If reflection notes are low, experiment with shorter prompts or voice recording

---

## Appendix: Event Catalog

### Core Events
| Event Name | Properties | Triggers When |
|------------|-----------|---------------|
| `landing_page_view` | `referrer`, `device_type` | User arrives |
| `upload_initiated` | `entry_point` (drag vs. button) | Upload zone activated |
| `file_validated` | `file_size`, `platform`, `message_count` | File passes checks |
| `parsing_completed` | `duration_ms`, `platform`, `schema_version` | Normalization done |
| `first_insight_viewed` | `time_since_upload` | Overview dashboard loads |
| `section_viewed` | `section_type`, `sequence_number` | Deep dive section opens |
| `insight_card_viewed` | `card_id`, `pattern_type` | Card renders on screen |
| `snippet_viewed` | `card_id`, `snippet_index` | Evidence expanded |
| `reflection_note_saved` | `note_length`, `prompt_used` | Note persisted |
| `recap_exported` | `sections_included`, `format` | PDF download triggered |
| `check_in_accepted` | `delivery_preference` | User opts in |
| `purge_confirmed` | `session_duration` | Data deletion executed |
| `error_displayed` | `error_type`, `context` | Error message shown |

---

## Next Steps
1. Implement event tracking in frontend using Plausible SDK
2. Set up Supabase table schema for event storage
3. Build internal dashboard prototype using Tremor or Recharts
4. Draft NPS survey copy and integrate trigger logic
5. Define alert thresholds for critical metrics (parsing failures, error spikes)
6. Schedule weekly metrics review meeting with product and engineering leads

---

**Document Owner:** Product Team
**Last Updated:** 2025-10-18
**Version:** 1.0 (MVP)
