import { describe, it, expect } from 'vitest'
import {
  cleanMessageText,
  isEmptyMessage,
  countWords,
  extractTimestamp,
  extractTimestampMs,
  groupMessagesByMatch,
  sortMessagesByTime,
  countMessagesByDirection,
  countMessagesBySender,
  getMessageDateRange,
  filterMessagesByDateRange,
  filterMessagesByDirection,
  getFirstMessage,
  getLastMessage,
  isUserMessage,
  isMatchMessage,
  getTotalCharacterCount,
  getTotalWordCount,
  getAverageMessageLength,
  groupConsecutiveMessagesBySender,
} from './message-processing'
import type { NormalizedMessage } from '@/types/data-model'

describe('cleanMessageText', () => {
  it('trims whitespace by default', () => {
    expect(cleanMessageText('  hello  ')).toBe('hello')
    expect(cleanMessageText('\n\nhello\n\n')).toBe('hello')
  })

  it('normalizes multiple spaces to single space', () => {
    expect(cleanMessageText('hello    world')).toBe('hello world')
    expect(cleanMessageText('hello\n\n\nworld')).toBe('hello world')
  })

  it('removes zero-width characters', () => {
    expect(cleanMessageText('hello\u200Bworld')).toBe('helloworld')
    expect(cleanMessageText('test\uFEFFstring')).toBe('teststring')
  })

  it('converts to lowercase when specified', () => {
    expect(cleanMessageText('Hello World', { lowercase: true })).toBe('hello world')
  })

  it('respects custom options', () => {
    expect(cleanMessageText('  HELLO  ', { trim: false, lowercase: true })).toBe(' hello ')
    expect(cleanMessageText('hello    world', { normalizeSpaces: false })).toBe('hello    world')
  })
})

describe('isEmptyMessage', () => {
  it('detects empty strings', () => {
    expect(isEmptyMessage('')).toBe(true)
    expect(isEmptyMessage('   ')).toBe(true)
    expect(isEmptyMessage('\n\n')).toBe(true)
  })

  it('detects non-empty strings', () => {
    expect(isEmptyMessage('hello')).toBe(false)
    expect(isEmptyMessage('  hello  ')).toBe(false)
  })
})

describe('countWords', () => {
  it('counts words correctly', () => {
    expect(countWords('hello world')).toBe(2)
    expect(countWords('one two three four')).toBe(4)
    expect(countWords('single')).toBe(1)
  })

  it('handles empty strings', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   ')).toBe(0)
  })

  it('handles extra whitespace', () => {
    expect(countWords('hello    world')).toBe(2)
    expect(countWords('  hello  world  ')).toBe(2)
  })
})

describe('extractTimestamp', () => {
  it('extracts timestamp as Date object', () => {
    const message: NormalizedMessage = {
      id: '1',
      matchId: 'm1',
      senderId: 'user',
      sentAt: '2024-01-01T10:00:00Z',
      body: 'Hi',
      direction: 'user',
    }

    const date = extractTimestamp(message)
    expect(date).toBeInstanceOf(Date)
    expect(date.toISOString()).toBe('2024-01-01T10:00:00.000Z')
  })
})

describe('extractTimestampMs', () => {
  it('extracts timestamp as milliseconds', () => {
    const message: NormalizedMessage = {
      id: '1',
      matchId: 'm1',
      senderId: 'user',
      sentAt: '2024-01-01T10:00:00Z',
      body: 'Hi',
      direction: 'user',
    }

    const ms = extractTimestampMs(message)
    expect(ms).toBe(new Date('2024-01-01T10:00:00Z').getTime())
  })
})

describe('groupMessagesByMatch', () => {
  it('groups messages by match ID', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm2', senderId: 'user', sentAt: '2024-01-01T10:01:00Z', body: 'Hey', direction: 'user' },
      { id: '3', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:02:00Z', body: 'Hello', direction: 'match' },
    ]

    const grouped = groupMessagesByMatch(messages)

    expect(grouped.size).toBe(2)
    expect(grouped.get('m1')?.length).toBe(2)
    expect(grouped.get('m2')?.length).toBe(1)
  })

  it('handles empty array', () => {
    const grouped = groupMessagesByMatch([])
    expect(grouped.size).toBe(0)
  })
})

describe('sortMessagesByTime', () => {
  it('sorts messages ascending by default', () => {
    const messages: NormalizedMessage[] = [
      { id: '2', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:02:00Z', body: 'Second', direction: 'user' },
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'First', direction: 'user' },
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:04:00Z', body: 'Third', direction: 'user' },
    ]

    const sorted = sortMessagesByTime(messages)

    expect(sorted[0].body).toBe('First')
    expect(sorted[1].body).toBe('Second')
    expect(sorted[2].body).toBe('Third')
  })

  it('sorts messages descending when specified', () => {
    const messages: NormalizedMessage[] = [
      { id: '2', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:02:00Z', body: 'Second', direction: 'user' },
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'First', direction: 'user' },
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:04:00Z', body: 'Third', direction: 'user' },
    ]

    const sorted = sortMessagesByTime(messages, false)

    expect(sorted[0].body).toBe('Third')
    expect(sorted[1].body).toBe('Second')
    expect(sorted[2].body).toBe('First')
  })
})

describe('countMessagesByDirection', () => {
  it('counts messages by direction', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:01:00Z', body: 'Hey', direction: 'user' },
      { id: '3', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:02:00Z', body: 'Hello', direction: 'match' },
    ]

    const counts = countMessagesByDirection(messages)

    expect(counts.user).toBe(2)
    expect(counts.match).toBe(1)
    expect(counts.total).toBe(3)
  })

  it('handles empty array', () => {
    const counts = countMessagesByDirection([])
    expect(counts.user).toBe(0)
    expect(counts.match).toBe(0)
    expect(counts.total).toBe(0)
  })
})

describe('countMessagesBySender', () => {
  it('counts messages by sender ID', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:01:00Z', body: 'Hey', direction: 'user' },
      { id: '3', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:02:00Z', body: 'Hello', direction: 'match' },
      { id: '4', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:03:00Z', body: 'Hi there', direction: 'match' },
      { id: '5', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:04:00Z', body: 'How are you?', direction: 'user' },
    ]

    const counts = countMessagesBySender(messages)

    expect(counts.get('user')).toBe(3)
    expect(counts.get('match1')).toBe(2)
  })
})

describe('getMessageDateRange', () => {
  it('calculates date range for messages', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'First', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T12:00:00Z', body: 'Second', direction: 'user' },
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T14:00:00Z', body: 'Third', direction: 'user' },
    ]

    const range = getMessageDateRange(messages)

    expect(range).not.toBeNull()
    expect(range!.earliest.toISOString()).toBe('2024-01-01T10:00:00.000Z')
    expect(range!.latest.toISOString()).toBe('2024-01-01T14:00:00.000Z')
    expect(range!.durationMs).toBe(4 * 60 * 60 * 1000) // 4 hours
  })

  it('returns null for empty array', () => {
    expect(getMessageDateRange([])).toBeNull()
  })
})

describe('filterMessagesByDateRange', () => {
  it('filters messages within date range', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'First', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T12:00:00Z', body: 'Second', direction: 'user' },
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T14:00:00Z', body: 'Third', direction: 'user' },
    ]

    const startDate = new Date('2024-01-01T11:00:00Z')
    const endDate = new Date('2024-01-01T13:00:00Z')

    const filtered = filterMessagesByDateRange(messages, startDate, endDate)

    expect(filtered.length).toBe(1)
    expect(filtered[0].body).toBe('Second')
  })
})

describe('filterMessagesByDirection', () => {
  it('filters user messages', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'User msg', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:01:00Z', body: 'Match msg', direction: 'match' },
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:02:00Z', body: 'User msg 2', direction: 'user' },
    ]

    const filtered = filterMessagesByDirection(messages, 'user')

    expect(filtered.length).toBe(2)
    expect(filtered[0].body).toBe('User msg')
    expect(filtered[1].body).toBe('User msg 2')
  })

  it('filters match messages', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'User msg', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:01:00Z', body: 'Match msg', direction: 'match' },
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:02:00Z', body: 'User msg 2', direction: 'user' },
    ]

    const filtered = filterMessagesByDirection(messages, 'match')

    expect(filtered.length).toBe(1)
    expect(filtered[0].body).toBe('Match msg')
  })
})

describe('getFirstMessage', () => {
  it('returns first message by timestamp', () => {
    const messages: NormalizedMessage[] = [
      { id: '2', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:02:00Z', body: 'Second', direction: 'user' },
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'First', direction: 'user' },
    ]

    const first = getFirstMessage(messages)

    expect(first).not.toBeNull()
    expect(first!.body).toBe('First')
  })

  it('returns null for empty array', () => {
    expect(getFirstMessage([])).toBeNull()
  })
})

describe('getLastMessage', () => {
  it('returns last message by timestamp', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'First', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:02:00Z', body: 'Last', direction: 'user' },
    ]

    const last = getLastMessage(messages)

    expect(last).not.toBeNull()
    expect(last!.body).toBe('Last')
  })

  it('returns null for empty array', () => {
    expect(getLastMessage([])).toBeNull()
  })
})

describe('isUserMessage and isMatchMessage', () => {
  it('identifies user messages', () => {
    const message: NormalizedMessage = {
      id: '1',
      matchId: 'm1',
      senderId: 'user',
      sentAt: '2024-01-01T10:00:00Z',
      body: 'Hi',
      direction: 'user',
    }

    expect(isUserMessage(message)).toBe(true)
    expect(isMatchMessage(message)).toBe(false)
  })

  it('identifies match messages', () => {
    const message: NormalizedMessage = {
      id: '1',
      matchId: 'm1',
      senderId: 'match1',
      sentAt: '2024-01-01T10:00:00Z',
      body: 'Hi',
      direction: 'match',
    }

    expect(isUserMessage(message)).toBe(false)
    expect(isMatchMessage(message)).toBe(true)
  })
})

describe('getTotalCharacterCount', () => {
  it('counts total characters across messages', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' }, // 2 chars
      { id: '2', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:01:00Z', body: 'Hello', direction: 'user' }, // 5 chars
    ]

    expect(getTotalCharacterCount(messages)).toBe(7)
  })

  it('handles empty array', () => {
    expect(getTotalCharacterCount([])).toBe(0)
  })
})

describe('getTotalWordCount', () => {
  it('counts total words across messages', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hello world', direction: 'user' }, // 2 words
      { id: '2', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:01:00Z', body: 'How are you', direction: 'user' }, // 3 words
    ]

    expect(getTotalWordCount(messages)).toBe(5)
  })

  it('handles empty array', () => {
    expect(getTotalWordCount([])).toBe(0)
  })
})

describe('getAverageMessageLength', () => {
  it('calculates average message length', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' }, // 2 chars
      { id: '2', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:01:00Z', body: 'Hello', direction: 'user' }, // 5 chars
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:02:00Z', body: 'Hey there', direction: 'user' }, // 9 chars
    ]

    expect(getAverageMessageLength(messages)).toBeCloseTo(5.33, 1)
  })

  it('returns 0 for empty array', () => {
    expect(getAverageMessageLength([])).toBe(0)
  })
})

describe('groupConsecutiveMessagesBySender', () => {
  it('groups consecutive messages from same sender', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:01:00Z', body: 'How are you?', direction: 'user' },
      { id: '3', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:05:00Z', body: 'Good!', direction: 'match' },
      { id: '4', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:06:00Z', body: 'You?', direction: 'match' },
      { id: '5', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:10:00Z', body: 'Great!', direction: 'user' },
    ]

    const groups = groupConsecutiveMessagesBySender(messages)

    expect(groups.length).toBe(3)
    expect(groups[0].senderId).toBe('user')
    expect(groups[0].messages.length).toBe(2)
    expect(groups[1].senderId).toBe('match1')
    expect(groups[1].messages.length).toBe(2)
    expect(groups[2].senderId).toBe('user')
    expect(groups[2].messages.length).toBe(1)
  })

  it('handles single message', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
    ]

    const groups = groupConsecutiveMessagesBySender(messages)

    expect(groups.length).toBe(1)
    expect(groups[0].messages.length).toBe(1)
  })

  it('handles empty array', () => {
    const groups = groupConsecutiveMessagesBySender([])
    expect(groups.length).toBe(0)
  })

  it('sets correct start and end times for groups', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:05:00Z', body: 'How are you?', direction: 'user' },
      { id: '3', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:10:00Z', body: 'Good!', direction: 'match' },
    ]

    const groups = groupConsecutiveMessagesBySender(messages)

    expect(groups[0].startTime.toISOString()).toBe('2024-01-01T10:00:00.000Z')
    expect(groups[0].endTime.toISOString()).toBe('2024-01-01T10:05:00.000Z')
    expect(groups[1].startTime.toISOString()).toBe('2024-01-01T10:10:00.000Z')
    expect(groups[1].endTime.toISOString()).toBe('2024-01-01T10:10:00.000Z')
  })
})
