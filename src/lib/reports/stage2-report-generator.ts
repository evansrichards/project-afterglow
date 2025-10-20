/**
 * Stage 2 Report Generator
 *
 * Formats comprehensive deep analysis results (Stage 2) into detailed,
 * user-friendly reports for the 20% of users who need in-depth insights.
 */

import type {
  Stage2ComprehensiveOutput,
  SafetyDeepDive,
  AttachmentAnalysis,
} from '../analyzers/stage2-types'
import type { Stage1Report } from './stage1-report-generator'

/**
 * Stage 2 Report structure
 * Comprehensive analysis for orange/red risk cases
 */
export interface Stage2Report {
  /** Report type */
  reportType: 'stage2-comprehensive'
  /** Include Stage 1 summary for context */
  stage1Summary: {
    riskLevel: Stage1Report['safetyAssessment']['riskLevel']
    headline: string
    summary: string
  }
  /** Safety deep dive section */
  safetyDeepDive: {
    crisisLevel: SafetyDeepDive['crisisLevel']
    manipulationTactics: Array<{
      type: string
      severity: 'low' | 'medium' | 'high'
      description: string
      examples: string[]
      pattern: string
    }>
    coerciveControl: {
      detected: boolean
      summary: string
      patterns: string[]
    }
    traumaBonding: {
      detected: boolean
      summary: string
      cyclePhases: string[]
    }
    professionalSupport: Array<{
      type: string
      priority: 'immediate' | 'high' | 'medium'
      description: string
    }>
  }
  /** Attachment analysis section */
  attachmentAnalysis: {
    primaryStyle: AttachmentAnalysis['primaryStyle']
    confidence: number
    styleDescription: string
    evidence: string[]
    triggers: Array<{
      trigger: string
      response: string
      healthiness: 'healthy' | 'neutral' | 'concerning'
      guidance: string
    }>
    copingMechanisms: Array<{
      mechanism: string
      effectiveness: 'helpful' | 'neutral' | 'harmful'
      frequency: string
      recommendation: string
    }>
    relationshipDynamics: {
      healthyAspects: string[]
      concerningAspects: string[]
      recommendations: string[]
    }
  }
  /** Growth trajectory section (if applicable) */
  growthTrajectory: {
    detected: boolean
    timeRangeMonths: number
    direction: 'improving' | 'declining' | 'stable' | 'fluctuating'
    summary: string
    skillsImproved: Array<{
      skill: string
      improvement: 'significant' | 'moderate' | 'slight'
      evidence: string[]
    }>
    growthOpportunities: Array<{
      area: string
      priority: 'high' | 'medium' | 'low'
      recommendations: string[]
    }>
    developmentInsights: string[]
  } | null
  /** Comprehensive synthesis */
  synthesis: {
    overallSummary: string
    keyThemes: string[]
    criticalInsights: Array<{
      insight: string
      category: 'safety' | 'attachment' | 'growth' | 'general'
      importance: 'critical' | 'high' | 'medium'
    }>
    prioritizedRecommendations: Array<{
      recommendation: string
      rationale: string
      priority: 'immediate' | 'high' | 'medium' | 'low'
      category: string
    }>
  }
  /** Processing metadata */
  processingInfo: {
    stage: 'Stage 2: Comprehensive Analysis'
    completedAt: string
    durationSeconds: number
    costUsd: number
    model: string
  }
}

/**
 * Get user-friendly description for attachment style
 */
function getAttachmentStyleDescription(style: AttachmentAnalysis['primaryStyle']): string {
  const descriptions = {
    secure:
      'You demonstrate a secure attachment style, characterized by comfort with both intimacy and independence. You communicate openly about your needs and respect others\' boundaries.',
    anxious:
      'You show signs of an anxious attachment style, which often involves a strong desire for closeness and reassurance. You may worry about relationships and need frequent validation.',
    avoidant:
      'You exhibit an avoidant attachment style, valuing independence and self-reliance. You may feel uncomfortable with emotional closeness or vulnerability.',
    'fearful-avoidant':
      'You display a fearful-avoidant attachment style, experiencing conflicting desires for both intimacy and distance. This can create push-pull dynamics in relationships.',
    mixed:
      'You show a mixed attachment style, displaying characteristics of multiple attachment patterns. Your responses may vary depending on the situation and relationship.',
  }
  return descriptions[style]
}

/**
 * Format manipulation tactic type for display
 */
function formatManipulationTacticType(type: string): string {
  const formatted = {
    DARVO: 'DARVO (Deny, Attack, Reverse Victim & Offender)',
    gaslighting: 'Gaslighting',
    'love-bombing': 'Love-Bombing',
    triangulation: 'Triangulation',
    projection: 'Projection',
    isolation: 'Isolation Tactics',
    'financial-control': 'Financial Control',
    'emotional-blackmail': 'Emotional Blackmail',
  }
  return formatted[type as keyof typeof formatted] || type
}

/**
 * Get professional support description
 */
function getProfessionalSupportDescription(type: string, priority: string): string {
  const descriptions = {
    therapist: {
      immediate:
        'We strongly recommend speaking with a licensed therapist who specializes in relationship dynamics and trauma. They can provide personalized support and coping strategies.',
      high: 'Consider scheduling an appointment with a therapist who specializes in relationship issues. They can help you process these patterns and develop healthier approaches.',
      medium:
        'A therapist could be helpful in exploring these patterns further and developing strategies for healthier relationships.',
    },
    'domestic-violence-advocate': {
      immediate:
        'Please reach out to a domestic violence advocate immediately. They are trained to help you assess your situation safely and can connect you with resources. National Domestic Violence Hotline: 1-800-799-7233.',
      high: 'We recommend contacting a domestic violence advocate who can provide specialized support and help you understand your options. National Domestic Violence Hotline: 1-800-799-7233.',
      medium:
        'A domestic violence advocate can provide information about healthy relationships and safety planning if needed.',
    },
    'crisis-hotline': {
      immediate:
        'If you are in immediate danger or crisis, please call the National Domestic Violence Hotline at 1-800-799-7233 or text START to 88788. Help is available 24/7.',
      high: 'If you\'re feeling overwhelmed or unsafe, crisis support is available 24/7. National Domestic Violence Hotline: 1-800-799-7233.',
      medium:
        'Crisis support resources are available if you need to talk to someone. National Domestic Violence Hotline: 1-800-799-7233.',
    },
    'legal-aid': {
      immediate:
        'Consider consulting with a lawyer who specializes in protective orders or domestic violence cases. Legal aid may be available if cost is a concern.',
      high: 'Legal consultation may be helpful to understand your rights and options. Many areas have free or low-cost legal aid services.',
      medium: 'Legal resources are available if you need them in the future.',
    },
  }

  const typeKey = type as keyof typeof descriptions
  const priorityKey = priority as 'immediate' | 'high' | 'medium'

  return descriptions[typeKey]?.[priorityKey] || 'Professional support is recommended.'
}

/**
 * Generate Stage 2 Report from comprehensive analysis
 */
export function generateStage2Report(
  stage2Output: Stage2ComprehensiveOutput,
  stage1Summary: Stage1Report['safetyAssessment']
): Stage2Report {
  const {
    safetyDeepDive,
    attachmentAnalysis,
    growthTrajectory,
    synthesis,
    metadata,
  } = stage2Output

  // Format safety deep dive
  const formattedSafetyDeepDive = {
    crisisLevel: safetyDeepDive.crisisLevel,
    manipulationTactics: safetyDeepDive.manipulationTactics.map((tactic) => ({
      type: formatManipulationTacticType(tactic.type),
      severity: tactic.severity,
      description: tactic.description,
      examples: tactic.examples,
      pattern: tactic.pattern,
    })),
    coerciveControl: {
      detected: safetyDeepDive.coerciveControl.detected,
      summary: safetyDeepDive.coerciveControl.detected
        ? `We identified patterns of coercive control in your conversations. This involves one person using tactics to dominate, control, or manipulate the other.`
        : 'We did not identify significant patterns of coercive control.',
      patterns: safetyDeepDive.coerciveControl.patterns,
    },
    traumaBonding: {
      detected: safetyDeepDive.traumaBonding.detected,
      summary: safetyDeepDive.traumaBonding.detected
        ? `We identified indicators of trauma bonding, which occurs through cycles of abuse followed by periods of affection or calm. This can make it difficult to leave harmful relationships.`
        : 'We did not identify significant trauma bonding patterns.',
      cyclePhases: safetyDeepDive.traumaBonding.cyclePhases.map(
        (phase) => `${phase.phase}: ${phase.description}`
      ),
    },
    professionalSupport: safetyDeepDive.recommendedResources.map((resource) => ({
      type: resource.type,
      priority: resource.priority,
      description: getProfessionalSupportDescription(resource.type, resource.priority),
    })),
  }

  // Format attachment analysis
  const formattedAttachmentAnalysis = {
    primaryStyle: attachmentAnalysis.primaryStyle,
    confidence: attachmentAnalysis.confidence,
    styleDescription: getAttachmentStyleDescription(attachmentAnalysis.primaryStyle),
    evidence: attachmentAnalysis.evidence,
    triggers: attachmentAnalysis.triggers.map((trigger) => ({
      trigger: trigger.trigger,
      response: trigger.response,
      healthiness: trigger.healthiness,
      guidance:
        trigger.healthiness === 'healthy'
          ? 'This is a healthy response that shows self-awareness and good boundaries.'
          : trigger.healthiness === 'concerning'
            ? 'This response pattern may be worth exploring with a therapist or counselor.'
            : 'This response is neutral and context-dependent.',
    })),
    copingMechanisms: attachmentAnalysis.copingMechanisms.map((coping) => ({
      mechanism: coping.mechanism,
      effectiveness: coping.effectiveness,
      frequency: coping.frequency,
      recommendation:
        coping.effectiveness === 'helpful'
          ? 'This is a healthy coping strategy worth continuing.'
          : coping.effectiveness === 'harmful'
            ? 'Consider working with a therapist to develop healthier coping strategies.'
            : 'This coping mechanism has mixed effects. Awareness of when and how you use it can be helpful.',
    })),
    relationshipDynamics: {
      healthyAspects: attachmentAnalysis.relationshipDynamics.healthyAspects,
      concerningAspects: attachmentAnalysis.relationshipDynamics.concerningAspects,
      recommendations: attachmentAnalysis.relationshipDynamics.recommendations,
    },
  }

  // Format growth trajectory
  const formattedGrowthTrajectory = growthTrajectory
    ? {
        detected: growthTrajectory.detected,
        timeRangeMonths: growthTrajectory.timeRangeMonths,
        direction: growthTrajectory.direction,
        summary:
          growthTrajectory.direction === 'improving'
            ? `Over ${growthTrajectory.timeRangeMonths} months, we've observed positive growth in your relationship patterns and communication skills.`
            : growthTrajectory.direction === 'declining'
              ? `Over ${growthTrajectory.timeRangeMonths} months, we've noticed some concerning trends that may benefit from professional support.`
              : growthTrajectory.direction === 'stable'
                ? `Over ${growthTrajectory.timeRangeMonths} months, your patterns have remained relatively consistent.`
                : `Over ${growthTrajectory.timeRangeMonths} months, your patterns show variation with both improvements and setbacks.`,
        skillsImproved: growthTrajectory.skillsImproved,
        growthOpportunities: growthTrajectory.growthOpportunities,
        developmentInsights: growthTrajectory.developmentInsights,
      }
    : null

  // Format synthesis
  const formattedSynthesis = {
    overallSummary: synthesis.overallSummary,
    keyThemes: synthesis.keyThemes,
    criticalInsights: synthesis.prioritizedInsights.map((insight) => ({
      insight: insight.insight,
      category: insight.category,
      importance: insight.importance,
    })),
    prioritizedRecommendations: synthesis.recommendations.map((rec) => ({
      recommendation: rec.recommendation,
      rationale: rec.rationale,
      priority: rec.priority,
      category: rec.category,
    })),
  }

  return {
    reportType: 'stage2-comprehensive',
    stage1Summary: {
      riskLevel: stage1Summary.riskLevel,
      headline: stage1Summary.headline,
      summary: stage1Summary.summary,
    },
    safetyDeepDive: formattedSafetyDeepDive,
    attachmentAnalysis: formattedAttachmentAnalysis,
    growthTrajectory: formattedGrowthTrajectory,
    synthesis: formattedSynthesis,
    processingInfo: {
      stage: 'Stage 2: Comprehensive Analysis',
      completedAt: metadata.analyzedAt,
      durationSeconds: Math.round(metadata.durationMs / 1000),
      costUsd: metadata.costUsd || 0,
      model: metadata.model || 'unknown',
    },
  }
}

/**
 * Format Stage 2 Report as markdown
 */
export function formatStage2ReportAsMarkdown(report: Stage2Report): string {
  const sections: string[] = []

  // Header with Stage 1 context
  sections.push(`# Comprehensive Relationship Analysis\n`)
  sections.push(`## Initial Assessment\n`)
  sections.push(`**${report.stage1Summary.headline}**\n`)
  sections.push(`${report.stage1Summary.summary}\n`)
  sections.push(
    `Based on this initial assessment, we conducted a comprehensive deep-dive analysis.\n`
  )

  // Safety Deep Dive
  sections.push(`## Safety Analysis\n`)

  if (report.safetyDeepDive.crisisLevel !== 'none') {
    const crisisEmoji = {
      low: '🟡',
      moderate: '🟠',
      high: '🔴',
      critical: '🚨',
    }
    sections.push(
      `**Crisis Level:** ${crisisEmoji[report.safetyDeepDive.crisisLevel as keyof typeof crisisEmoji] || ''} ${report.safetyDeepDive.crisisLevel.toUpperCase()}\n`
    )
  }

  if (report.safetyDeepDive.manipulationTactics.length > 0) {
    sections.push(`### Manipulation Tactics Detected\n`)
    report.safetyDeepDive.manipulationTactics.forEach((tactic) => {
      const severityEmoji = { low: '🟢', medium: '🟡', high: '🔴' }
      sections.push(
        `#### ${severityEmoji[tactic.severity]} ${tactic.type} (${tactic.severity} severity)\n`
      )
      sections.push(`${tactic.description}\n`)
      sections.push(`**Pattern:** ${tactic.pattern}\n`)
      if (tactic.examples.length > 0) {
        sections.push(`**Examples:**`)
        tactic.examples.forEach((ex) => sections.push(`- ${ex}`))
        sections.push('')
      }
    })
  }

  if (report.safetyDeepDive.coerciveControl.detected) {
    sections.push(`### Coercive Control\n`)
    sections.push(`${report.safetyDeepDive.coerciveControl.summary}\n`)
    if (report.safetyDeepDive.coerciveControl.patterns.length > 0) {
      sections.push(`**Patterns identified:**`)
      report.safetyDeepDive.coerciveControl.patterns.forEach((p) => sections.push(`- ${p}`))
      sections.push('')
    }
  }

  if (report.safetyDeepDive.traumaBonding.detected) {
    sections.push(`### Trauma Bonding\n`)
    sections.push(`${report.safetyDeepDive.traumaBonding.summary}\n`)
    if (report.safetyDeepDive.traumaBonding.cyclePhases.length > 0) {
      sections.push(`**Cycle phases observed:**`)
      report.safetyDeepDive.traumaBonding.cyclePhases.forEach((p) =>
        sections.push(`- ${p}`)
      )
      sections.push('')
    }
  }

  // Professional Support
  if (report.safetyDeepDive.professionalSupport.length > 0) {
    sections.push(`### Professional Support Recommendations\n`)
    report.safetyDeepDive.professionalSupport.forEach((support) => {
      const priorityEmoji = { immediate: '🚨', high: '🔴', medium: '🟡' }
      sections.push(
        `#### ${priorityEmoji[support.priority]} ${support.type.replace(/-/g, ' ').toUpperCase()} (${support.priority} priority)\n`
      )
      sections.push(`${support.description}\n`)
    })
  }

  // Attachment Analysis
  sections.push(`## Attachment Analysis\n`)
  sections.push(
    `**Your Attachment Style:** ${report.attachmentAnalysis.primaryStyle.toUpperCase()} (${Math.round(report.attachmentAnalysis.confidence * 100)}% confidence)\n`
  )
  sections.push(`${report.attachmentAnalysis.styleDescription}\n`)

  if (report.attachmentAnalysis.evidence.length > 0) {
    sections.push(`**Evidence:**`)
    report.attachmentAnalysis.evidence.forEach((e) => sections.push(`- ${e}`))
    sections.push('')
  }

  if (report.attachmentAnalysis.triggers.length > 0) {
    sections.push(`### Your Triggers\n`)
    report.attachmentAnalysis.triggers.forEach((trigger) => {
      const healthIcon = {
        healthy: '✅',
        neutral: '➖',
        concerning: '⚠️',
      }
      sections.push(`#### ${healthIcon[trigger.healthiness]} ${trigger.trigger}\n`)
      sections.push(`**Your response:** ${trigger.response}\n`)
      sections.push(`**Guidance:** ${trigger.guidance}\n`)
    })
  }

  if (report.attachmentAnalysis.copingMechanisms.length > 0) {
    sections.push(`### Coping Mechanisms\n`)
    report.attachmentAnalysis.copingMechanisms.forEach((coping) => {
      const effectIcon = { helpful: '✅', neutral: '➖', harmful: '⚠️' }
      sections.push(
        `**${effectIcon[coping.effectiveness]} ${coping.mechanism}** (${coping.frequency})\n`
      )
      sections.push(`${coping.recommendation}\n`)
    })
  }

  sections.push(`### Relationship Dynamics\n`)
  if (report.attachmentAnalysis.relationshipDynamics.healthyAspects.length > 0) {
    sections.push(`**Healthy Aspects:**`)
    report.attachmentAnalysis.relationshipDynamics.healthyAspects.forEach((a) =>
      sections.push(`- ✅ ${a}`)
    )
    sections.push('')
  }
  if (report.attachmentAnalysis.relationshipDynamics.concerningAspects.length > 0) {
    sections.push(`**Areas for Attention:**`)
    report.attachmentAnalysis.relationshipDynamics.concerningAspects.forEach((a) =>
      sections.push(`- ⚠️ ${a}`)
    )
    sections.push('')
  }

  // Growth Trajectory
  if (report.growthTrajectory) {
    sections.push(`## Personal Growth Trajectory\n`)
    sections.push(`${report.growthTrajectory.summary}\n`)

    if (report.growthTrajectory.skillsImproved.length > 0) {
      sections.push(`### Skills You've Developed\n`)
      report.growthTrajectory.skillsImproved.forEach((skill) => {
        const improvementIcon = {
          significant: '🌟',
          moderate: '📈',
          slight: '↗️',
        }
        sections.push(`#### ${improvementIcon[skill.improvement]} ${skill.skill}\n`)
        skill.evidence.forEach((e) => sections.push(`- ${e}`))
        sections.push('')
      })
    }

    if (report.growthTrajectory.growthOpportunities.length > 0) {
      sections.push(`### Opportunities for Continued Growth\n`)
      report.growthTrajectory.growthOpportunities.forEach((opp) => {
        const priorityIcon = { high: '🔴', medium: '🟡', low: '🟢' }
        sections.push(`#### ${priorityIcon[opp.priority]} ${opp.area}\n`)
        opp.recommendations.forEach((r) => sections.push(`- ${r}`))
        sections.push('')
      })
    }

    if (report.growthTrajectory.developmentInsights.length > 0) {
      sections.push(`### Key Development Insights\n`)
      report.growthTrajectory.developmentInsights.forEach((i) => sections.push(`- ${i}`))
      sections.push('')
    }
  }

  // Comprehensive Synthesis
  sections.push(`## Overall Assessment\n`)
  sections.push(`${report.synthesis.overallSummary}\n`)

  if (report.synthesis.keyThemes.length > 0) {
    sections.push(`### Key Themes\n`)
    report.synthesis.keyThemes.forEach((theme) => sections.push(`- ${theme}`))
    sections.push('')
  }

  if (report.synthesis.criticalInsights.length > 0) {
    sections.push(`### Critical Insights\n`)
    report.synthesis.criticalInsights.forEach((insight) => {
      const importanceIcon = { critical: '🚨', high: '🔴', medium: '🟡' }
      sections.push(`${importanceIcon[insight.importance]} **${insight.insight}**\n`)
    })
  }

  if (report.synthesis.prioritizedRecommendations.length > 0) {
    sections.push(`### Recommendations\n`)
    report.synthesis.prioritizedRecommendations.forEach((rec) => {
      const priorityIcon = {
        immediate: '🚨',
        high: '🔴',
        medium: '🟡',
        low: '🟢',
      }
      sections.push(`${priorityIcon[rec.priority]} **${rec.recommendation}**\n`)
      sections.push(`${rec.rationale}\n`)
    })
  }

  // Processing info
  sections.push(`---\n`)
  sections.push(`*${report.processingInfo.stage}*\n`)
  sections.push(
    `*Completed in ${report.processingInfo.durationSeconds} seconds using ${report.processingInfo.model}*\n`
  )
  sections.push(
    `*This analysis included Stage 1 Quick Triage (~$0.50) and Stage 2 Comprehensive Analysis (~$${report.processingInfo.costUsd.toFixed(2)})*`
  )

  return sections.join('\n')
}

/**
 * Format Stage 2 Report as plain text
 */
export function formatStage2ReportAsText(report: Stage2Report): string {
  const sections: string[] = []

  sections.push('COMPREHENSIVE RELATIONSHIP ANALYSIS')
  sections.push('='.repeat(50))
  sections.push('')
  sections.push('INITIAL ASSESSMENT')
  sections.push('-'.repeat(50))
  sections.push(report.stage1Summary.headline)
  sections.push(report.stage1Summary.summary)
  sections.push('')
  sections.push(
    'Based on this initial assessment, we conducted a comprehensive deep-dive analysis.'
  )
  sections.push('')

  // Safety Analysis
  sections.push('SAFETY ANALYSIS')
  sections.push('-'.repeat(50))

  if (report.safetyDeepDive.crisisLevel !== 'none') {
    sections.push(`Crisis Level: ${report.safetyDeepDive.crisisLevel.toUpperCase()}`)
    sections.push('')
  }

  if (report.safetyDeepDive.manipulationTactics.length > 0) {
    sections.push('Manipulation Tactics Detected:')
    report.safetyDeepDive.manipulationTactics.forEach((tactic, i) => {
      sections.push(
        `  ${i + 1}. ${tactic.type} (${tactic.severity} severity)`
      )
      sections.push(`     ${tactic.description}`)
      sections.push(`     Pattern: ${tactic.pattern}`)
      sections.push('')
    })
  }

  if (report.safetyDeepDive.professionalSupport.length > 0) {
    sections.push('Professional Support Recommended:')
    report.safetyDeepDive.professionalSupport.forEach((support, i) => {
      sections.push(
        `  ${i + 1}. ${support.type.toUpperCase()} (${support.priority} priority)`
      )
      sections.push(`     ${support.description}`)
      sections.push('')
    })
  }

  // Attachment Analysis
  sections.push('ATTACHMENT ANALYSIS')
  sections.push('-'.repeat(50))
  sections.push(
    `Your Attachment Style: ${report.attachmentAnalysis.primaryStyle.toUpperCase()}`
  )
  sections.push(
    `Confidence: ${Math.round(report.attachmentAnalysis.confidence * 100)}%`
  )
  sections.push(report.attachmentAnalysis.styleDescription)
  sections.push('')

  // Growth Trajectory
  if (report.growthTrajectory) {
    sections.push('PERSONAL GROWTH TRAJECTORY')
    sections.push('-'.repeat(50))
    sections.push(report.growthTrajectory.summary)
    sections.push('')
  }

  // Synthesis
  sections.push('OVERALL ASSESSMENT')
  sections.push('-'.repeat(50))
  sections.push(report.synthesis.overallSummary)
  sections.push('')

  if (report.synthesis.prioritizedRecommendations.length > 0) {
    sections.push('RECOMMENDATIONS')
    sections.push('-'.repeat(50))
    report.synthesis.prioritizedRecommendations.forEach((rec, i) => {
      sections.push(
        `${i + 1}. [${rec.priority.toUpperCase()}] ${rec.recommendation}`
      )
      sections.push(`   ${rec.rationale}`)
      sections.push('')
    })
  }

  // Processing info
  sections.push(`${report.processingInfo.stage}`)
  sections.push(
    `Completed in ${report.processingInfo.durationSeconds} seconds using ${report.processingInfo.model}`
  )

  return sections.join('\n')
}
