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
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    throw new Error(
      'OpenRouter API key not configured. Please set VITE_OPENROUTER_API_KEY in your .env.local file. ' +
      'Get your API key from: https://openrouter.ai/keys'
    )
  }

  return apiKey
}

/**
 * Get OpenRouter site URL for analytics (optional)
 */
export function getOpenRouterSiteUrl(): string | undefined {
  return import.meta.env.VITE_OPENROUTER_SITE_URL
}

/**
 * Get OpenRouter app name for analytics (optional)
 */
export function getOpenRouterAppName(): string | undefined {
  return import.meta.env.VITE_OPENROUTER_APP_NAME
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
