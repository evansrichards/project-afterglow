import { describe, it, expect } from 'vitest'
import {
  anonymizePhoneNumber,
  anonymizeEmail,
  anonymizeSocialHandle,
  anonymizeNames,
  anonymizeAddress,
  anonymizeText,
  anonymizeHighlights,
} from './anonymization'

describe('anonymizePhoneNumber', () => {
  it('should anonymize phone numbers with dashes', () => {
    expect(anonymizePhoneNumber('Call me at 555-123-4567')).toBe('Call me at ***-***-4567')
    expect(anonymizePhoneNumber('My number is 123-456-7890')).toBe('My number is ***-***-7890')
  })

  it('should anonymize phone numbers with dots', () => {
    expect(anonymizePhoneNumber('555.123.4567')).toBe('***.***.4567')
  })

  it('should anonymize phone numbers with parentheses', () => {
    expect(anonymizePhoneNumber('(555) 123-4567')).toBe('(***) ***-4567')
    expect(anonymizePhoneNumber('(123) 456.7890')).toBe('(***) ***.7890')
  })

  it('should anonymize 10-digit phone numbers without separators', () => {
    expect(anonymizePhoneNumber('Text me at 5551234567')).toBe('Text me at *******4567')
  })

  it('should anonymize phone numbers with country code', () => {
    // Keep country code visible for context, mask the rest
    expect(anonymizePhoneNumber('+1-555-123-4567')).toBe('+1-***-***-4567')
    expect(anonymizePhoneNumber('+1 555 123 4567')).toBe('+1 *** *** 4567')
  })

  it('should handle multiple phone numbers in text', () => {
    const text = 'Call 555-123-4567 or text (555) 987-6543'
    expect(anonymizePhoneNumber(text)).toBe('Call ***-***-4567 or text (***) ***-6543')
  })

  it('should not affect non-phone number text', () => {
    expect(anonymizePhoneNumber('Hello world')).toBe('Hello world')
    expect(anonymizePhoneNumber('The year is 2024')).toBe('The year is 2024')
  })
})

describe('anonymizeEmail', () => {
  it('should anonymize simple email addresses', () => {
    expect(anonymizeEmail('john.doe@example.com')).toBe('j***@example.com')
    expect(anonymizeEmail('sarah123@gmail.com')).toBe('s***@gmail.com')
  })

  it('should preserve domain names', () => {
    expect(anonymizeEmail('user@company.co.uk')).toBe('u***@company.co.uk')
    expect(anonymizeEmail('test@subdomain.example.com')).toBe('t***@subdomain.example.com')
  })

  it('should handle multiple emails', () => {
    const text = 'Email me at john@test.com or sarah@example.org'
    expect(anonymizeEmail(text)).toBe('Email me at j***@test.com or s***@example.org')
  })

  it('should handle emails with numbers and special chars', () => {
    expect(anonymizeEmail('user_123@example.com')).toBe('u***@example.com')
    expect(anonymizeEmail('first.last@example.com')).toBe('f***@example.com')
  })

  it('should not affect non-email text', () => {
    expect(anonymizeEmail('Hello @ world')).toBe('Hello @ world')
  })
})

describe('anonymizeSocialHandle', () => {
  it('should anonymize Twitter/Instagram handles', () => {
    expect(anonymizeSocialHandle('Follow me @instagram')).toBe('Follow me @ins***')
    expect(anonymizeSocialHandle('DM me @john_doe_123')).toBe('DM me @joh***')
  })

  it('should anonymize social media URLs', () => {
    expect(anonymizeSocialHandle('instagram.com/johndoe')).toBe('instagram.com/joh***')
    expect(anonymizeSocialHandle('twitter.com/sarah_smith')).toBe('twitter.com/sar***')
    expect(anonymizeSocialHandle('facebook.com/username123')).toBe('facebook.com/use***')
  })

  it('should anonymize LinkedIn profile URLs', () => {
    expect(anonymizeSocialHandle('linkedin.com/in/johndoe')).toBe('linkedin.com/in/joh***')
  })

  it('should handle multiple handles', () => {
    const text = 'Find me @instagram or @twitter'
    expect(anonymizeSocialHandle(text)).toBe('Find me @ins*** or @twi***')
  })

  it('should be case insensitive for URLs', () => {
    expect(anonymizeSocialHandle('Instagram.com/username')).toBe('Instagram.com/use***')
  })

  it('should not affect regular @ mentions', () => {
    expect(anonymizeSocialHandle('@ home')).toBe('@ home')
  })
})

describe('anonymizeNames', () => {
  it('should anonymize common "my name is" patterns', () => {
    expect(anonymizeNames('My name is John')).toBe('My name is [Name]')
    expect(anonymizeNames('my name is Sarah')).toBe('my name is [Name]')
  })

  it('should anonymize "I\'m" patterns', () => {
    expect(anonymizeNames("I'm John")).toBe("I'm [Name]")
    expect(anonymizeNames("i'm Sarah")).toBe("i'm [Name]")
  })

  it('should anonymize "call me" patterns', () => {
    expect(anonymizeNames('Call me John')).toBe('Call me [Name]')
    expect(anonymizeNames('You can call me Sarah')).toBe('You can call me [Name]')
  })

  it('should only anonymize capitalized names after indicators', () => {
    expect(anonymizeNames('My name is Alex')).toBe('My name is [Name]')
  })

  it('should not affect random capitalized words', () => {
    expect(anonymizeNames('Hello World')).toBe('Hello World')
    expect(anonymizeNames('I love Coffee')).toBe('I love Coffee')
  })

  it('should handle multiple name patterns', () => {
    const text = "Hi, I'm John. My name is John Smith"
    const result = anonymizeNames(text)
    expect(result).toContain('[Name]')
  })
})

describe('anonymizeAddress', () => {
  it('should anonymize street addresses', () => {
    expect(anonymizeAddress('123 Main Street')).toBe('[Address]')
    expect(anonymizeAddress('456 Oak Avenue')).toBe('[Address]')
    expect(anonymizeAddress('789 Elm Road')).toBe('[Address]')
  })

  it('should anonymize addresses with apartment numbers', () => {
    expect(anonymizeAddress('123 Main St, Apt 2B')).toBe('[Address]')
    expect(anonymizeAddress('456 Oak Ave, Unit 301')).toBe('[Address]')
    expect(anonymizeAddress('789 Elm Rd, Suite 100')).toBe('[Address]')
  })

  it('should anonymize addresses with abbreviations', () => {
    expect(anonymizeAddress('123 Main St')).toBe('[Address]')
    expect(anonymizeAddress('456 Oak Ave')).toBe('[Address]')
    expect(anonymizeAddress('789 Elm Blvd')).toBe('[Address]')
  })

  it('should handle addresses in sentences', () => {
    const text = 'Meet me at 123 Main Street tomorrow'
    expect(anonymizeAddress(text)).toBe('Meet me at [Address] tomorrow')
  })

  it('should not affect random numbers and street words', () => {
    expect(anonymizeAddress('I have 5 friends')).toBe('I have 5 friends')
    expect(anonymizeAddress('Walk down the street')).toBe('Walk down the street')
  })
})

describe('anonymizeText', () => {
  it('should apply all anonymization rules together', () => {
    const text = "Hi, I'm John. Call me at 555-123-4567 or email john@example.com. Find me @instagram or at 123 Main Street"
    const result = anonymizeText(text)

    expect(result).toContain('[Name]') // Name anonymized
    expect(result).toContain('***-***-4567') // Phone anonymized
    expect(result).toContain('j***@example.com') // Email anonymized
    expect(result).toContain('@ins***') // Social handle anonymized
    expect(result).toContain('[Address]') // Address anonymized
  })

  it('should handle text with only some PII', () => {
    const text = 'Call me at 555-123-4567'
    expect(anonymizeText(text)).toBe('Call me at ***-***-4567')
  })

  it('should not modify text without PII', () => {
    const text = 'Want to grab coffee sometime?'
    expect(anonymizeText(text)).toBe(text)
  })

  it('should handle complex real-world examples', () => {
    const text = 'Sure! My number is (555) 123-4567. You can also reach me at sarah@gmail.com or @sarah_insta'
    const result = anonymizeText(text)

    expect(result).toBe('Sure! My number is (***) ***-4567. You can also reach me at s***@gmail.com or @sar***')
  })
})

describe('anonymizeHighlights', () => {
  it('should anonymize array of highlights', () => {
    const highlights = [
      'Call me at 555-123-4567',
      'Email: john@example.com',
      'Find me @instagram',
    ]

    const result = anonymizeHighlights(highlights)

    expect(result).toEqual([
      'Call me at ***-***-4567',
      'Email: j***@example.com',
      'Find me @ins***',
    ])
  })

  it('should handle empty array', () => {
    expect(anonymizeHighlights([])).toEqual([])
  })

  it('should handle mixed content', () => {
    const highlights = [
      'Want to grab coffee?', // No PII
      'Sure! Text me at 555-1234', // Has phone (partial)
      "I'm Sarah, email me at sarah@test.com", // Has name and email
    ]

    const result = anonymizeHighlights(highlights)

    expect(result[0]).toBe('Want to grab coffee?')
    expect(result[1]).toContain('555-1234') // Partial phone preserved (not 10 digits)
    expect(result[2]).toContain('[Name]')
    expect(result[2]).toContain('s***@test.com')
  })
})
