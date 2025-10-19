/**
 * AI-Powered Insight Generation
 *
 * Transforms AI conversation analysis into user-facing insights with:
 * - Personalized recommendations based on attachment style
 * - Safety-focused guidance for red flags
 * - Communication improvement suggestions
 * - Actionable growth opportunities
 */

import type {
  Insight,
  InsightSeverity,
  InsightCategory,
} from '../analytics/insight-generation'
import type {
  ConversationAnalysis,
  AttachmentAnalysis,
  RedFlagAnalysis,
  CommunicationStrength,
  GrowthOpportunity,
} from './conversation-analysis'

/**
 * Generate attachment style insight
 */
export function generateAttachmentInsight(
  analysis: AttachmentAnalysis,
  conversationId: string
): Insight {
  const { primaryStyle, confidence, patterns } = analysis

  // Determine severity based on attachment style
  let severity: InsightSeverity = 'neutral'
  if (primaryStyle === 'secure' && confidence > 0.7) {
    severity = 'positive'
  } else if (primaryStyle === 'disorganized' || confidence < 0.4) {
    severity = 'concern'
  }

  // Generate title based on attachment style
  const titles: Record<string, string> = {
    secure: 'Secure Attachment: Strong Foundation',
    anxious: 'Anxious Attachment: Seeking Connection',
    avoidant: 'Avoidant Attachment: Valuing Independence',
    disorganized: 'Mixed Attachment Patterns Detected',
    unclear: 'Attachment Style: More Data Needed',
  }

  const title = titles[primaryStyle] || 'Attachment Style Analysis'

  // Generate personalized summary
  let summary: string
  let reflection: string

  switch (primaryStyle) {
    case 'secure':
      summary = `You show strong signs of secure attachment (${Math.round(confidence * 100)}% confidence). You balance independence and connection well, communicate openly, and feel comfortable with emotional intimacy. This is a healthy foundation for relationships.`
      reflection =
        'Your secure attachment style is a strength. Continue being authentic and open while maintaining healthy boundaries.'
      break

    case 'anxious':
      summary = `Your messages suggest anxious attachment patterns (${Math.round(confidence * 100)}% confidence). You may seek frequent reassurance and worry about connection. ${patterns.abandonmentFears ? 'Fear of abandonment may be influencing your communication.' : 'You value closeness and emotional connection.'}`
      reflection =
        'Notice when anxiety drives your communication. Practice self-soothing and trust that secure connections can handle space and uncertainty.'
      break

    case 'avoidant':
      summary = `You show signs of avoidant attachment (${Math.round(confidence * 100)}% confidence). You value independence highly and may feel uncomfortable with emotional vulnerability. ${patterns.emotionalOpenness ? 'You are making efforts to open up.' : 'Opening up emotionally may feel challenging.'}`
      reflection =
        'Challenge yourself to share more about your feelings and needs. Vulnerability builds intimacy and deeper connection.'
      break

    case 'disorganized':
      summary = `Your communication shows mixed attachment patterns (${Math.round(confidence * 100)}% confidence). You may oscillate between seeking closeness and creating distance, which can reflect internal conflict about relationships.`
      reflection =
        'Working with a therapist on attachment patterns could help you develop more consistent, secure relationship behaviors.'
      break

    default:
      summary = `We need more conversation data to reliably identify your attachment style (current confidence: ${Math.round(confidence * 100)}%). This is normal with limited messages.`
      reflection =
        'As you continue conversations, patterns will become clearer. Focus on being authentic and noticing your own feelings.'
  }

  return {
    id: `attachment-${conversationId}`,
    category: 'pattern',
    severity,
    title,
    summary,
    reflection,
    metrics: {
      attachmentStyle: primaryStyle,
      confidence: Math.round(confidence * 100),
      reassuranceSeeking: patterns.reassuranceSeeking ? 'Yes' : 'No',
      emotionalOpenness: patterns.emotionalOpenness ? 'High' : 'Low',
      intimacyComfort: patterns.intimacyComfort ? 'Comfortable' : 'Cautious',
    },
  }
}

/**
 * Generate red flag safety insight
 */
export function generateSafetyInsight(
  analysis: RedFlagAnalysis,
  conversationId: string
): Insight {
  const { flagsDetected, overallSafety, flags, positiveIndicators } = analysis

  // Determine severity
  let severity: InsightSeverity = 'positive'
  if (overallSafety === 'concerning' || overallSafety === 'unsafe') {
    severity = 'concern'
  } else if (overallSafety === 'cautious') {
    severity = 'neutral'
  }

  // Generate title
  const titles: Record<string, string> = {
    safe: 'Healthy Relationship Indicators',
    cautious: 'Minor Concerns to Monitor',
    concerning: 'Concerning Patterns Detected',
    unsafe: 'Serious Safety Concerns',
  }

  const title = titles[overallSafety] || 'Relationship Safety Check'

  // Generate summary
  let summary: string
  let reflection: string

  if (!flagsDetected) {
    summary = `Great news! No major red flags detected in this conversation. ${positiveIndicators.length > 0 ? `We noticed positive signs: ${positiveIndicators.slice(0, 2).join(', ')}.` : 'The communication appears respectful and healthy.'}`
    reflection =
      'Continue noticing green flags: respect, honesty, good boundaries, and mutual interest. These are foundations of healthy relationships.'
  } else {
    const criticalFlags = flags.filter((f) => f.severity === 'critical')
    const highFlags = flags.filter((f) => f.severity === 'high')

    if (criticalFlags.length > 0) {
      summary = `⚠️ We detected ${criticalFlags.length} critical safety concern(s). ${criticalFlags[0].description} Please consider: ${criticalFlags[0].recommendation}`
      reflection =
        'Your safety and wellbeing matter. Trust your instincts. If something feels wrong, it probably is. Consider reaching out to a trusted friend or counselor.'
    } else if (highFlags.length > 0) {
      summary = `We noticed ${highFlags.length} concerning pattern(s): ${highFlags[0].category.replace('-', ' ')}. ${highFlags[0].description}`
      reflection = `${highFlags[0].recommendation} Pay attention to how this pattern makes you feel.`
    } else {
      summary = `We noticed ${flags.length} minor concern(s) to be aware of. ${flags[0].description} This may be worth monitoring as the relationship develops.`
      reflection =
        'Early conversations can reveal important patterns. Stay observant and trust your gut feelings about respect and boundaries.'
    }
  }

  return {
    id: `safety-${conversationId}`,
    category: 'pattern',
    severity,
    title,
    summary,
    reflection,
    metrics: {
      overallSafety,
      flagsDetected: flags.length,
      criticalFlags: flags.filter((f) => f.severity === 'critical').length,
      positiveIndicators: positiveIndicators.length,
    },
  }
}

/**
 * Generate communication strength insight
 */
export function generateCommunicationInsight(
  analysis: CommunicationStrength,
  conversationId: string
): Insight {
  const { overallScore, dimensions, strengths, areasForGrowth } = analysis

  // Determine severity
  let severity: InsightSeverity = 'neutral'
  if (overallScore >= 75) {
    severity = 'positive'
  } else if (overallScore < 50) {
    severity = 'concern'
  }

  // Find strongest and weakest dimensions
  const dimensionEntries = Object.entries(dimensions)
  const strongest = dimensionEntries.reduce((a, b) => (a[1] > b[1] ? a : b))
  const weakest = dimensionEntries.reduce((a, b) => (a[1] < b[1] ? a : b))

  // Generate title
  let title: string
  if (overallScore >= 80) {
    title = 'Excellent Communication Skills'
  } else if (overallScore >= 65) {
    title = 'Strong Communication Foundation'
  } else if (overallScore >= 50) {
    title = 'Communication Room for Growth'
  } else {
    title = 'Communication Needs Attention'
  }

  // Generate summary
  const strengthsList =
    strengths.length > 0
      ? strengths.slice(0, 2).join(' and ')
      : 'your willingness to communicate'
  const growthArea = areasForGrowth.length > 0 ? areasForGrowth[0] : weakest[0]

  const summary = `Your overall communication score is ${overallScore}/100. Your strongest area is ${strongest[0]} (${strongest[1]}/100), showing ${strengthsList}. ${areasForGrowth.length > 0 ? `An area to develop: ${growthArea}.` : 'Continue building on your strengths.'}`

  // Generate reflection
  let reflection: string
  if (weakest[1] < 60) {
    reflection = `Focus on improving ${weakest[0]}. Small changes in how you communicate can significantly deepen connection and understanding.`
  } else {
    reflection =
      'Great communication is about continuous growth. Even small improvements in clarity, vulnerability, or listening can strengthen relationships.'
  }

  return {
    id: `communication-${conversationId}`,
    category: 'pattern',
    severity,
    title,
    summary,
    reflection,
    metrics: {
      overallScore,
      strongest: `${strongest[0]} (${strongest[1]}/100)`,
      weakest: `${weakest[0]} (${weakest[1]}/100)`,
      clarity: dimensions.clarity,
      emotionalIntelligence: dimensions.emotionalIntelligence,
      vulnerability: dimensions.vulnerability,
    },
  }
}

/**
 * Generate growth opportunity insights
 */
export function generateGrowthInsights(
  opportunities: GrowthOpportunity[],
  conversationId: string
): Insight[] {
  return opportunities
    .filter((opp) => opp.priority === 'high' || opp.priority === 'medium')
    .slice(0, 3) // Limit to top 3
    .map((opp, index) => {
      const severity: InsightSeverity = opp.priority === 'high' ? 'neutral' : 'positive'

      const summary = `${opp.currentState} → ${opp.desiredState}\n\nNext steps:\n${opp.suggestions.slice(0, 3).map((s) => `• ${s}`).join('\n')}`

      const reflection =
        opp.resources.length > 0
          ? `Explore: ${opp.resources.slice(0, 2).join(', ')}`
          : 'Growth happens one small step at a time. Choose one suggestion to try this week.'

      return {
        id: `growth-${conversationId}-${index}`,
        category: 'pattern',
        severity,
        title: `Growth Area: ${opp.area}`,
        summary,
        reflection,
        metrics: {
          priority: opp.priority,
          suggestionsCount: opp.suggestions.length,
          context: opp.context,
        },
      }
    })
}

/**
 * Generate comprehensive AI-powered insights from conversation analysis
 */
export function generateAIInsights(analysis: ConversationAnalysis): Insight[] {
  const insights: Insight[] = []

  // 1. Attachment style insight
  insights.push(generateAttachmentInsight(analysis.attachment, analysis.conversationId))

  // 2. Safety/red flag insight
  insights.push(generateSafetyInsight(analysis.redFlags, analysis.conversationId))

  // 3. Communication strength insight
  insights.push(generateCommunicationInsight(analysis.communication, analysis.conversationId))

  // 4. Growth opportunity insights (top 3)
  insights.push(...generateGrowthInsights(analysis.growthOpportunities, analysis.conversationId))

  // 5. Overview insight
  insights.unshift({
    id: `overview-${analysis.conversationId}`,
    category: 'overview',
    severity: analysis.redFlags.overallSafety === 'concerning' || analysis.redFlags.overallSafety === 'unsafe' ? 'concern' : 'neutral',
    title: 'AI Analysis Summary',
    summary: analysis.summary,
    reflection:
      'These insights are based on AI analysis of your conversation patterns. Use them as a starting point for self-reflection and growth.',
    metrics: {
      analyzedAt: new Date(analysis.analyzedAt).toLocaleString(),
      totalCost: `$${analysis.cost.totalCost.toFixed(2)}`,
      conversationId: analysis.conversationId,
    },
  })

  return insights
}

/**
 * Generate insight summary for dashboard/overview
 */
export function generateInsightSummary(insights: Insight[]): {
  totalInsights: number
  concerns: number
  positives: number
  topPriority: Insight | null
  categories: Record<string, number>
} {
  const concerns = insights.filter((i) => i.severity === 'concern').length
  const positives = insights.filter((i) => i.severity === 'positive').length

  const categories: Record<string, number> = {}
  for (const insight of insights) {
    categories[insight.category] = (categories[insight.category] || 0) + 1
  }

  // Top priority is first concern, or first insight
  const topPriority = insights.find((i) => i.severity === 'concern') || insights[0] || null

  return {
    totalInsights: insights.length,
    concerns,
    positives,
    topPriority,
    categories,
  }
}

/**
 * Filter insights by severity
 */
export function filterInsightsBySeverity(
  insights: Insight[],
  severity: InsightSeverity
): Insight[] {
  return insights.filter((i) => i.severity === severity)
}

/**
 * Filter insights by category
 */
export function filterInsightsByCategory(
  insights: Insight[],
  category: InsightCategory
): Insight[] {
  return insights.filter((i) => i.category === category)
}

/**
 * Sort insights by priority (concerns first, then neutral, then positive)
 */
export function sortInsightsByPriority(insights: Insight[]): Insight[] {
  const severityOrder: Record<InsightSeverity, number> = {
    concern: 0,
    neutral: 1,
    positive: 2,
  }

  return [...insights].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}
