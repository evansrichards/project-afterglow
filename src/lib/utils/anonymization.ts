/**
 * Anonymization utilities for protecting user privacy in conversation highlights
 */

/**
 * Anonymizes phone numbers by showing only last 4 digits
 * Examples:
 *   555-123-4567 -> ***-***-4567
 *   (555) 123-4567 -> (***) ***-4567
 *   5551234567 -> *******4567
 *   +1-555-123-4567 -> +1-***-***-4567 (keeps country code for context)
 */
export function anonymizePhoneNumber(text: string): string {
  let result = text

  // Format: +1-555-123-4567 or +1 555 123 4567 (handle first to avoid partial matches)
  // Keep country code visible for context
  result = result.replace(
    /\+(\d{1,2})[-.\s]?(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})\b/g,
    (match, countryCode, p2, p3, p4) => {
      const separator = match.includes('.') ? '.' : match.includes('-') ? '-' : ' '
      return `+${countryCode}${separator}***${separator}***${separator}${p4}`
    }
  )

  // Format: (555) 123-4567
  result = result.replace(/\((\d{3})\)\s*(\d{3})[-.](\d{4})\b/g, (match, p1, p2, p3) => {
    const separator = match.includes('.') ? '.' : '-'
    return `(***) ***${separator}${p3}`
  })

  // Format: 555-123-4567 or 555.123.4567
  result = result.replace(/\b(\d{3})[-.](\d{3})[-.](\d{4})\b/g, (match, p1, p2, p3) => {
    const separator = match.includes('.') ? '.' : '-'
    return `***${separator}***${separator}${p3}`
  })

  // Format: 5551234567 (10 digits)
  result = result.replace(/\b(\d{3})(\d{3})(\d{4})\b/g, (match, p1, p2, p3) => {
    // Only replace if not already masked
    if (match.includes('*')) return match
    return `*******${p3}`
  })

  return result
}

/**
 * Anonymizes email addresses by showing only first char and domain
 * Examples:
 *   john.doe@example.com -> j***@example.com
 *   sarah123@gmail.com -> s***@gmail.com
 */
export function anonymizeEmail(text: string): string {
  return text.replace(
    /\b([a-zA-Z0-9])[a-zA-Z0-9._-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
    (match, firstChar, domain) => `${firstChar}***@${domain}`
  )
}

/**
 * Anonymizes social media handles by showing only first few chars
 * Examples:
 *   @instagram -> @inst***
 *   @john_doe_123 -> @joh***
 *   instagram.com/username -> instagram.com/use***
 *
 * NOTE: This should be called AFTER email anonymization to avoid
 * matching email domains. Domain names in already-anonymized emails
 * (containing `***@`) are protected from further anonymization.
 */
export function anonymizeSocialHandle(text: string): string {
  let result = text

  // Match @handles (show first 3-4 chars)
  // But skip if it's part of an email address (has *** before it)
  result = result.replace(
    /@([a-zA-Z0-9_]{1,3})([a-zA-Z0-9_]+)/g,
    (match, prefix, rest, offset, fullString) => {
      // Check if this is part of an anonymized email (has *** before @)
      if (offset > 0 && fullString.slice(Math.max(0, offset - 4), offset).includes('***')) {
        return match // Don't anonymize - it's part of an email
      }
      return `@${prefix}***`
    }
  )

  // Match social media URLs ONLY for known platforms
  // This prevents matching random domain names in email addresses
  const socialPlatforms = [
    'instagram.com',
    'facebook.com',
    'twitter.com',
    'snapchat.com',
    'tiktok.com',
    'linkedin.com',
  ]

  for (const platform of socialPlatforms) {
    // Match platform.com/username or platform.com/in/username
    // Skip if preceded by `***@` (part of anonymized email)
    const regex = new RegExp(
      `(${platform.replace('.', '\\.')})/(in/)?([a-zA-Z0-9_]{1,3})([a-zA-Z0-9_.-]+)`,
      'gi'
    )
    result = result.replace(regex, (match, domain, inPath, prefix, rest, offset, fullString) => {
      // Check if this is part of an email (preceded by ***@)
      const precedingText = fullString.slice(Math.max(0, offset - 10), offset)
      if (precedingText.includes('***@')) {
        return match // Don't anonymize - it's part of an email domain
      }
      const path = inPath || ''
      return `${domain}/${path}${prefix}***`
    })
  }

  return result
}

/**
 * Anonymizes common personal names (first and last names)
 * Uses a list of common first names to detect and mask
 * Examples:
 *   "My name is John" -> "My name is [Name]"
 *   "I'm Sarah" -> "I'm [Name]"
 */
export function anonymizeNames(text: string): string {
  // Common first names to detect (expandable list)
  const commonNames = [
    'james',
    'john',
    'robert',
    'michael',
    'william',
    'david',
    'richard',
    'joseph',
    'thomas',
    'christopher',
    'mary',
    'patricia',
    'jennifer',
    'linda',
    'elizabeth',
    'barbara',
    'susan',
    'jessica',
    'sarah',
    'karen',
    'nancy',
    'lisa',
    'betty',
    'margaret',
    'sandra',
    'ashley',
    'kimberly',
    'emily',
    'donna',
    'michelle',
  ]

  let result = text

  // Replace "my name is [Name]" patterns
  result = result.replace(/\b(my name is|i'm|i am|call me)\s+([a-z]+)\b/gi, (match, prefix, name) => {
    if (commonNames.includes(name.toLowerCase())) {
      return `${prefix} [Name]`
    }
    return match
  })

  // Replace capitalized words after common name indicators
  result = result.replace(
    /\b(name is|i'm|i am|call me)\s+([A-Z][a-z]+)\b/g,
    (match, prefix, name) => `${prefix} [Name]`
  )

  return result
}

/**
 * Anonymizes street addresses
 * Examples:
 *   "123 Main Street" -> "[Address]"
 *   "456 Oak Ave, Apt 2B" -> "[Address]"
 */
export function anonymizeAddress(text: string): string {
  // Match common address patterns
  return text.replace(
    /\b\d{1,5}\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Way|Circle|Cir|Place|Pl)(,?\s+(Apt|Apartment|Suite|Unit|#)\s*[A-Za-z0-9]+)?\b/gi,
    '[Address]'
  )
}

/**
 * Main anonymization function that applies all anonymization rules
 * This is the primary function to use for cleaning conversation highlights
 *
 * NOTE: Order matters! We apply email first to avoid social handle patterns
 * matching email domains.
 */
export function anonymizeText(text: string): string {
  let result = text

  // Apply all anonymization functions in order
  // Email MUST come before social handles to avoid domain conflicts
  result = anonymizePhoneNumber(result)
  result = anonymizeEmail(result) // Do email first!
  result = anonymizeNames(result)
  result = anonymizeAddress(result)
  result = anonymizeSocialHandle(result) // Do social handles last

  return result
}

/**
 * Anonymizes an array of conversation highlights
 */
export function anonymizeHighlights(highlights: string[]): string[] {
  return highlights.map((highlight) => anonymizeText(highlight))
}
