/**
 * Report Generators
 *
 * Export all report generation functionality for two-stage analysis
 */

// Stage 1: Quick Triage Reports
export {
  generateStage1Report,
  formatStage1ReportAsMarkdown,
  formatStage1ReportAsText,
  type Stage1Report,
} from './stage1-report-generator'

// Stage 2: Comprehensive Analysis Reports
export {
  generateStage2Report,
  formatStage2ReportAsMarkdown,
  formatStage2ReportAsText,
  type Stage2Report,
} from './stage2-report-generator'
