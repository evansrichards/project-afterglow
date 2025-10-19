/**
 * Insight Generation - Simple test
 */

import type { NormalizedMessage } from '@/types/data-model'

export type InsightSeverity = 'positive' | 'neutral' | 'concern'

export interface Insight {
  id: string
  title: string
  summary: string
}

export function generateTestInsight(): Insight {
  return {
    id: 'test',
    title: 'Test Insight',
    summary: 'This is a test'
  }
}
