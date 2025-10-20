# Email Notification System - One-Time Analysis

## Overview
The email notification system sends users a summary notification when their analysis is complete, with a secure link to view their full report. This replaces the monthly insight delivery model with a one-time notification approach.

## Email Notification Flow

### 1. Analysis Completion Trigger
```typescript
interface AnalysisCompletionEvent {
  userId: string;
  email: string;
  analysisId: string;
  tier: 'tier1' | 'tier2' | 'tier3';
  completedAt: string;
  processingDuration: number; // minutes
  reportSections: string[]; // e.g., ['attachment-style', 'safety-analysis', 'communication-patterns']
}
```

### 2. Email Template Structure

#### Subject Line Options:
- "Your dating pattern analysis is ready 📊"
- "Your Afterglow insights are complete ✨"
- "Ready to discover your dating patterns? 🔍"

#### Email Content:
```html
<div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">

  <!-- Header -->
  <div style="text-align: center; padding: 40px 20px;">
    <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 600;">
      Your insights are ready
    </h1>
    <p style="color: #6b7280; margin: 16px 0 0 0; font-size: 16px;">
      We've analyzed your dating conversations and found meaningful patterns
    </p>
  </div>

  <!-- Analysis Summary -->
  <div style="background: #f8fafc; padding: 32px; margin: 0 20px; border-radius: 12px;">
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Your analysis includes:</h2>

    <div style="margin-bottom: 16px;">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="color: #10b981; margin-right: 8px; font-size: 16px;">✓</span>
        <strong style="color: #1f2937;">Attachment Style Analysis</strong>
      </div>
      <p style="color: #6b7280; margin: 0 0 0 24px; font-size: 14px;">
        How you connect and communicate in relationships
      </p>
    </div>

    <div style="margin-bottom: 16px;">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="color: #10b981; margin-right: 8px; font-size: 16px;">✓</span>
        <strong style="color: #1f2937;">Communication Strengths</strong>
      </div>
      <p style="color: #6b7280; margin: 0 0 0 24px; font-size: 14px;">
        Your authentic voice and conversation skills
      </p>
    </div>

    <!-- Conditional Safety Section (only for Tier 2/3) -->
    {{#if hasSafetyAnalysis}}
    <div style="margin-bottom: 16px;">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="color: #f59e0b; margin-right: 8px; font-size: 16px;">⚠</span>
        <strong style="color: #1f2937;">Safety Awareness</strong>
      </div>
      <p style="color: #6b7280; margin: 0 0 0 24px; font-size: 14px;">
        Important patterns to be aware of for your protection
      </p>
    </div>
    {{/if}}

    <div style="margin-bottom: 0;">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="color: #10b981; margin-right: 8px; font-size: 16px;">✓</span>
        <strong style="color: #1f2937;">Growth Opportunities</strong>
      </div>
      <p style="color: #6b7280; margin: 0 0 0 24px; font-size: 14px;">
        Personalized suggestions for enhancing your dating experience
      </p>
    </div>
  </div>

  <!-- CTA Button -->
  <div style="text-align: center; padding: 40px 20px;">
    <a href="{{reportUrl}}"
       style="background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
      View My Full Report
    </a>
    <p style="color: #9ca3af; margin: 16px 0 0 0; font-size: 12px;">
      This link is secure and only accessible to you
    </p>
  </div>

  <!-- Privacy Reassurance -->
  <div style="background: #f3f4f6; padding: 20px; margin: 0 20px; border-radius: 8px;">
    <p style="color: #6b7280; margin: 0; font-size: 13px; text-align: center;">
      🔒 Your data remains private and secure. This analysis is based on sanitized conversation patterns only.
    </p>
  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 40px 20px 20px;">
    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
      Questions? Reply to this email or visit our
      <a href="{{supportUrl}}" style="color: #3b82f6;">support center</a>
    </p>
  </div>

</div>
```

## Authentication & Security

### Secure Report Access
```typescript
interface ReportAccessToken {
  userId: string;
  analysisId: string;
  issuedAt: string;
  expiresAt: string; // 30 days from issue
  scope: 'report-view';
}

// Report URL format
const reportUrl = `https://afterglow.app/report/${analysisId}?token=${signedToken}`;
```

### Token Validation Flow
1. User clicks email link with signed token
2. Frontend validates token signature and expiration
3. If valid, user is automatically authenticated for report viewing
4. If expired/invalid, redirect to login with option to request new link

## Email Timing & Delivery

### Processing Duration Estimates
- **Tier 1 Analysis:** 2-5 minutes
- **Tier 2 Analysis:** 5-15 minutes
- **Tier 3 Analysis:** 10-30 minutes

### Email Delivery Rules
```typescript
const emailDeliveryLogic = {
  // Send immediately after analysis completion
  immediate: true,

  // Backup: If processing takes >30 minutes, send "still processing" email
  processingUpdate: {
    threshold: 30, // minutes
    message: "Your analysis is taking a bit longer than expected. We'll email you when it's ready."
  },

  // Retry logic for failed deliveries
  retryAttempts: 3,
  retryIntervals: [5, 15, 60], // minutes
};
```

## Email Content Variations by Tier

### Tier 1 (Basic Analysis)
- Focus on positive findings and strengths
- Gentle introduction to attachment concepts
- 1-2 main insights highlighted

### Tier 2 (Complex Patterns)
- More detailed section preview
- May include safety awareness section
- Emphasize personalized nature of insights

### Tier 3 (Safety Concerns)
- Include safety awareness section prominently
- Reassuring tone about protective insights
- May include links to additional resources

## Technical Implementation

### Email Service Integration
```typescript
// Using SendGrid for reliable delivery
interface EmailNotificationService {
  sendAnalysisComplete(event: AnalysisCompletionEvent): Promise<void>;
  sendProcessingUpdate(userId: string, estimatedCompletion: string): Promise<void>;
  sendNewReportAccessLink(userId: string, analysisId: string): Promise<void>;
}
```

### Database Schema Updates
```sql
-- Track email delivery status
CREATE TABLE analysis_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id),
  user_id UUID REFERENCES users(id),
  email_type VARCHAR(50) NOT NULL, -- 'completion', 'processing_update', 'access_link'
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Success Metrics

### Email Performance Targets
- **Delivery Rate:** >99% (using SendGrid)
- **Open Rate:** >60% (compelling subject lines)
- **Click Rate:** >40% (users eager for insights)
- **Time to Open:** <24 hours for 80% of recipients

### User Experience Metrics
- **Report Access Time:** <30 seconds from email click
- **Authentication Success:** >95% on first attempt
- **User Satisfaction:** >4.5/5 rating for email experience

This email notification system provides a clean, secure, and user-friendly way to deliver analysis completion notifications while maintaining the privacy-first approach of the platform.