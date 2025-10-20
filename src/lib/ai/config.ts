/**
 * OpenRouter Configuration
 *
 * Centralized configuration for OpenRouter API access with environment variable validation.
 */

/**
 * Get OpenRouter API key from environment variables
 * @throws Error if API key is not configured
 */
export function getOpenRouterApiKey(): string {
  // Check if running in Node.js (backend) or browser (frontend)
  const apiKey = typeof process !== 'undefined' && process.env
    ? process.env.OPENROUTER_API_KEY  // Backend (Node.js)
    : import.meta.env.VITE_OPENROUTER_API_KEY  // Frontend (Vite)

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    const envVarName = typeof process !== 'undefined' && process.env
      ? 'OPENROUTER_API_KEY'
      : 'VITE_OPENROUTER_API_KEY'

    throw new Error(
      `OpenRouter API key not configured. Please set ${envVarName} in your .env file. ` +
      'Get your API key from: https://openrouter.ai/keys'
    )
  }

  return apiKey
}

/**
 * Get OpenRouter site URL for analytics (optional)
 */
export function getOpenRouterSiteUrl(): string | undefined {
  return typeof process !== 'undefined' && process.env
    ? process.env.OPENROUTER_SITE_URL
    : import.meta.env.VITE_OPENROUTER_SITE_URL
}

/**
 * Get OpenRouter app name for analytics (optional)
 */
export function getOpenRouterAppName(): string | undefined {
  return typeof process !== 'undefined' && process.env
    ? process.env.OPENROUTER_APP_NAME
    : import.meta.env.VITE_OPENROUTER_APP_NAME
}

/**
 * Check if OpenRouter is configured and ready to use
 */
export function isOpenRouterConfigured(): boolean {
  try {
    getOpenRouterApiKey()
    return true
  } catch {
    return false
  }
}
