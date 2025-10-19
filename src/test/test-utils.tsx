import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

/**
 * Custom render function that wraps components with common providers
 * Extend this as you add context providers, routers, etc.
 */
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { ...options })
}

// Re-export everything from React Testing Library
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react'
export { customRender as render }
