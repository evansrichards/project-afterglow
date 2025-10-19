import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, formatDate, truncate, generateId, safeJsonParse, debounce } from './utils'

describe('cn (className utility)', () => {
  it('combines multiple class names', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz')
  })

  it('filters out falsy values', () => {
    expect(cn('foo', false, 'bar', null, undefined, 'baz')).toBe('foo bar baz')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })

  it('handles all falsy values', () => {
    expect(cn(false, null, undefined)).toBe('')
  })
})

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2025-01-15T12:00:00Z')
    expect(result).toMatch(/January 1[45], 2025/)
  })

  it('formats a Date object', () => {
    const date = new Date('2025-01-15T12:00:00Z')
    const result = formatDate(date)
    expect(result).toMatch(/January 1[45], 2025/)
  })
})

describe('truncate', () => {
  it('returns original text if under max length', () => {
    expect(truncate('Hello', 10)).toBe('Hello')
  })

  it('truncates text that exceeds max length', () => {
    expect(truncate('Hello, World!', 10)).toBe('Hello, ...')
  })

  it('handles edge case where text length equals max length', () => {
    expect(truncate('Hello', 5)).toBe('Hello')
  })

  it('handles very short max length', () => {
    expect(truncate('Hello, World!', 5)).toBe('He...')
  })
})

describe('generateId', () => {
  it('generates a unique ID', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })

  it('generates IDs in correct format', () => {
    const id = generateId()
    expect(id).toMatch(/^\d+-[a-z0-9]+$/)
  })
})

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    const json = '{"name":"John","age":30}'
    const result = safeJsonParse(json, {})
    expect(result).toEqual({ name: 'John', age: 30 })
  })

  it('returns fallback for invalid JSON', () => {
    const json = '{invalid json}'
    const fallback = { error: true }
    const result = safeJsonParse(json, fallback)
    expect(result).toBe(fallback)
  })

  it('handles empty string with fallback', () => {
    const result = safeJsonParse('', null)
    expect(result).toBe(null)
  })
})

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('delays function execution', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('cancels previous calls when invoked multiple times', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn()
    debouncedFn()
    debouncedFn()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('passes arguments correctly', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn('arg1', 'arg2')
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
  })
})
