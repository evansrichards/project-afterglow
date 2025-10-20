/**
 * Stage 1 Report Generator
 *
 * Formats Quick Triage results (Safety Screener output) into user-friendly
 * insights for the 80% of users who complete at Stage 1.
 *
 * For green/yellow risk levels: Provides actionable insights and confirms completion
 * For orange/red risk levels: Provides brief summary and escalation messaging
 */

import type { SafetyScreenerOutput, RiskLevel } from '../analyzers/types'

/**
 * Stage 1 Report structure
 * Formatted for user-facing display
 */
export interface Stage1Report {
  /** Report type for rendering */
  reportType: 'stage1-complete' | 'stage1-escalating'
  /** Safety assessment section */
  safetyAssessment: {
    riskLevel: RiskLevel
    headline: string
    summary: string
    riskLevelDescription: string
  }
  /** Basic patterns and insights */
  insights: Array<{
    category: 'safety' | 'communication' | 'positive-patterns'
    title: string
    description: string
    examples?: string[]
  }>
  /** Actionable recommendations */
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    recommendation: string
    rationale: string
  }>
  /** Processing metadata for transparency */
  processingInfo: {
    stage: 'Stage 1: Quick Triage'
    completedAt: string
    durationSeconds: number
    costUsd: number
    model: string
  }
  /** Escalation information (if applicable) */
  escalation?: {
    willEscalate: boolean
    reason: string
    nextSteps: string
  }
}

/**
 * Get user-friendly risk level headline
 */
function getRiskLevelHeadline(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'green':
      return 'Your conversations show healthy patterns'
    case 'yellow':
      return 'Your conversations are mostly healthy with minor areas to watch'
    case 'orange':
      return 'Some concerning patterns detected'
    case 'red':
      return 'Serious safety concerns detected'
  }
}

/**
 * Get user-friendly risk level description
 */
function getRiskLevelDescription(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'green':
      return 'We found no significant safety concerns in your dating conversations. Your communication patterns suggest healthy relationship dynamics.'
    case 'yellow':
      return 'Your conversations are generally healthy, but we noticed a few patterns worth keeping an eye on. These are minor concerns that may not be problematic, but awareness can help you maintain healthy boundaries.'
    case 'orange':
      return 'We detected multiple concerning patterns in your conversations that warrant closer attention. While not necessarily dangerous, these patterns could indicate developing issues that deserve deeper analysis.'
    case 'red':
      return 'We identified serious safety concerns in your conversations. These patterns may indicate manipulation, coercion, or other harmful dynamics. We strongly recommend reviewing our detailed analysis and considering professional support.'
  }
}

/**
 * Generate insights from red flags
 */
function generateRedFlagInsights(
  redFlags: SafetyScreenerOutput['redFlags']
): Stage1Report['insights'] {
  return redFlags.map((flag) => {
    const categoryTitles = {
      threat: 'Safety Concern: Threatening Behavior',
      'financial-request': 'Safety Concern: Financial Requests',
      'explicit-manipulation': 'Safety Concern: Manipulation Detected',
      pressure: 'Safety Concern: Pressure or Coercion',
      inconsistency: 'Pattern Alert: Inconsistencies Detected',
    }

    return {
      category: 'safety' as const,
      title: categoryTitles[flag.type],
      description: flag.description,
      examples: flag.examples,
    }
  })
}

/**
 * Generate insights from green flags
 */
function generateGreenFlagInsights(
  greenFlags: SafetyScreenerOutput['greenFlags']
): Stage1Report['insights'] {
  // Take top 3 green flags for Stage 1 report
  return greenFlags.slice(0, 3).map((flag) => ({
    category: 'positive-patterns' as const,
    title: 'Healthy Pattern Identified',
    description: flag,
  }))
}

/**
 * Generate recommendations based on risk level and flags
 */
function generateRecommendations(
  riskLevel: RiskLevel,
  redFlags: SafetyScreenerOutput['redFlags'],
  greenFlags: SafetyScreenerOutput['greenFlags']
): Stage1Report['recommendations'] {
  const recommendations: Stage1Report['recommendations'] = []

  // Green/Yellow: Focus on maintaining healthy patterns
  if (riskLevel === 'green' || riskLevel === 'yellow') {
    if (greenFlags.length > 0) {
      recommendations.push({
        priority: 'high',
        recommendation: 'Continue fostering the healthy communication patterns you\'ve developed',
        rationale:
          'Your conversations show positive signs of respectful communication, boundary setting, and genuine connection. These are strong foundations for healthy relationships.',
      })
    }

    if (riskLevel === 'yellow' && redFlags.length > 0) {
      recommendations.push({
        priority: 'medium',
        recommendation: 'Stay aware of the minor concerns we identified',
        rationale:
          'While not serious, the patterns we flagged are worth monitoring. Trust your instincts if you notice these behaviors escalating or becoming more frequent.',
      })
    }

    recommendations.push({
      priority: 'low',
      recommendation: 'Keep reflecting on your dating experiences',
      rationale:
        'Regular self-reflection helps you stay attuned to your needs, boundaries, and what you\'re looking for in relationships.',
      })
  }

  // Orange: Focus on awareness and caution
  if (riskLevel === 'orange') {
    recommendations.push({
      priority: 'high',
      recommendation: 'Review the detailed safety analysis we\'re preparing for you',
      rationale:
        'The patterns we detected warrant deeper analysis. Our comprehensive report will provide specific insights into the concerning behaviors and actionable guidance.',
    })

    recommendations.push({
      priority: 'high',
      recommendation: 'Trust your instincts and maintain strong boundaries',
      rationale:
        'If something feels off in your interactions, that feeling is valid. Don\'t dismiss your concerns, even if the other person seems charming or apologetic.',
    })

    recommendations.push({
      priority: 'medium',
      recommendation: 'Consider discussing these patterns with a trusted friend or counselor',
      rationale:
        'An outside perspective can help you process what you\'re experiencing and make informed decisions about your relationships.',
    })
  }

  // Red: Focus on safety and support
  if (riskLevel === 'red') {
    recommendations.push({
      priority: 'high',
      recommendation: 'Review our comprehensive safety analysis carefully',
      rationale:
        'We detected serious concerning patterns that require your immediate attention. Our detailed analysis will help you understand the risks and available resources.',
    })

    recommendations.push({
      priority: 'high',
      recommendation: 'Consider reaching out to a professional for support',
      rationale:
        'The patterns we identified may indicate manipulation or coercive control. A therapist, counselor, or domestic violence advocate can provide specialized guidance and support.',
    })

    recommendations.push({
      priority: 'high',
      recommendation: 'Prioritize your safety and well-being',
      rationale:
        'Your safety is the top priority. If you feel unsafe at any point, trust that feeling and seek help from trusted friends, family, or professional resources.',
    })
  }

  return recommendations
}

/**
 * Generate escalation information for orange/red cases
 */
function generateEscalationInfo(
  riskLevel: RiskLevel,
  escalateToRiskEvaluator: boolean
): Stage1Report['escalation'] | undefined {
  if (!escalateToRiskEvaluator) {
    return undefined
  }

  const reasons = {
    orange:
      'The patterns we detected suggest there may be deeper dynamics at play that warrant comprehensive analysis.',
    red: 'The safety concerns we identified require immediate and thorough analysis to provide you with complete information and resources.',
  }

  const nextSteps = {
    orange:
      'We\'re running a comprehensive analysis that will examine attachment patterns, relationship dynamics, and provide detailed safety guidance. You\'ll receive an email when this analysis is complete (typically 30-60 seconds).',
    red: 'We\'re immediately running a comprehensive safety analysis that will identify specific manipulation tactics, assess risk levels, and provide crisis resources if needed. You\'ll receive an email with your complete report shortly (typically 30-60 seconds).',
  }

  return {
    willEscalate: true,
    reason: riskLevel === 'red' ? reasons.red : reasons.orange,
    nextSteps: riskLevel === 'red' ? nextSteps.red : nextSteps.orange,
  }
}

/**
 * Generate Stage 1 Report from Safety Screener output
 *
 * @param safetyScreenerOutput - Results from Safety Screener (Stage 1 Quick Triage)
 * @returns Formatted user-facing report
 */
export function generateStage1Report(
  safetyScreenerOutput: SafetyScreenerOutput
): Stage1Report {
  const {
    riskLevel,
    redFlags,
    greenFlags,
    escalateToRiskEvaluator,
    summary,
    metadata,
  } = safetyScreenerOutput

  // Determine report type
  const reportType: Stage1Report['reportType'] =
    riskLevel === 'green' || riskLevel === 'yellow'
      ? 'stage1-complete'
      : 'stage1-escalating'

  // Generate insights from flags
  const redFlagInsights = generateRedFlagInsights(redFlags)
  const greenFlagInsights = generateGreenFlagInsights(greenFlags)

  // Combine insights (red flags first, then green flags)
  const insights = [...redFlagInsights, ...greenFlagInsights]

  // Generate recommendations
  const recommendations = generateRecommendations(riskLevel, redFlags, greenFlags)

  // Generate escalation info if needed
  const escalation = generateEscalationInfo(riskLevel, escalateToRiskEvaluator)

  return {
    reportType,
    safetyAssessment: {
      riskLevel,
      headline: getRiskLevelHeadline(riskLevel),
      summary,
      riskLevelDescription: getRiskLevelDescription(riskLevel),
    },
    insights,
    recommendations,
    processingInfo: {
      stage: 'Stage 1: Quick Triage',
      completedAt: metadata.analyzedAt,
      durationSeconds: Math.round(metadata.durationMs / 1000),
      costUsd: metadata.costUsd || 0,
      model: metadata.model || 'unknown',
    },
    escalation,
  }
}

/**
 * Format Stage 1 Report as markdown (for email notifications)
 */
export function formatStage1ReportAsMarkdown(report: Stage1Report): string {
  const sections: string[] = []

  // Header
  sections.push(`# ${report.safetyAssessment.headline}\n`)
  sections.push(`${report.safetyAssessment.riskLevelDescription}\n`)
  sections.push(`**Summary:** ${report.safetyAssessment.summary}\n`)

  // Insights
  if (report.insights.length > 0) {
    sections.push(`## Key Insights\n`)
    report.insights.forEach((insight, index) => {
      sections.push(`### ${index + 1}. ${insight.title}\n`)
      sections.push(`${insight.description}\n`)
      if (insight.examples && insight.examples.length > 0) {
        sections.push(`**Examples:**`)
        insight.examples.forEach((example) => {
          sections.push(`- ${example}`)
        })
        sections.push('')
      }
    })
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    sections.push(`## Recommendations\n`)
    report.recommendations.forEach((rec) => {
      const priorityEmoji = {
        high: '🔴',
        medium: '🟡',
        low: '🟢',
      }
      sections.push(
        `${priorityEmoji[rec.priority]} **${rec.recommendation}**`
      )
      sections.push(`${rec.rationale}\n`)
    })
  }

  // Escalation info
  if (report.escalation?.willEscalate) {
    sections.push(`## Next Steps\n`)
    sections.push(`**Additional Analysis Running**\n`)
    sections.push(`${report.escalation.reason}\n`)
    sections.push(`${report.escalation.nextSteps}\n`)
  } else {
    sections.push(`## Your Analysis is Complete\n`)
    sections.push(
      `We've completed our safety assessment of your dating conversations. The insights and recommendations above are based on our analysis of your communication patterns.\n`
    )
  }

  // Processing info
  sections.push(`---\n`)
  sections.push(`*${report.processingInfo.stage}*`)
  sections.push(
    `*Completed in ${report.processingInfo.durationSeconds} seconds using ${report.processingInfo.model}*`
  )

  return sections.join('\n')
}

/**
 * Format Stage 1 Report as plain text (for simple displays)
 */
export function formatStage1ReportAsText(report: Stage1Report): string {
  const sections: string[] = []

  sections.push(report.safetyAssessment.headline.toUpperCase())
  sections.push('='.repeat(report.safetyAssessment.headline.length))
  sections.push('')
  sections.push(report.safetyAssessment.riskLevelDescription)
  sections.push('')
  sections.push(`Summary: ${report.safetyAssessment.summary}`)
  sections.push('')

  if (report.insights.length > 0) {
    sections.push('KEY INSIGHTS')
    sections.push('------------')
    report.insights.forEach((insight, index) => {
      sections.push(`${index + 1}. ${insight.title}`)
      sections.push(`   ${insight.description}`)
      if (insight.examples && insight.examples.length > 0) {
        sections.push('   Examples:')
        insight.examples.forEach((example) => {
          sections.push(`   - ${example}`)
        })
      }
      sections.push('')
    })
  }

  if (report.recommendations.length > 0) {
    sections.push('RECOMMENDATIONS')
    sections.push('---------------')
    report.recommendations.forEach((rec) => {
      sections.push(`[${rec.priority.toUpperCase()}] ${rec.recommendation}`)
      sections.push(`${rec.rationale}`)
      sections.push('')
    })
  }

  if (report.escalation?.willEscalate) {
    sections.push('NEXT STEPS')
    sections.push('----------')
    sections.push('Additional Analysis Running')
    sections.push(report.escalation.reason)
    sections.push(report.escalation.nextSteps)
  } else {
    sections.push('YOUR ANALYSIS IS COMPLETE')
    sections.push('--------------------------')
    sections.push(
      'We\'ve completed our safety assessment of your dating conversations.'
    )
  }

  sections.push('')
  sections.push(`${report.processingInfo.stage}`)
  sections.push(
    `Completed in ${report.processingInfo.durationSeconds} seconds using ${report.processingInfo.model}`
  )

  return sections.join('\n')
}
