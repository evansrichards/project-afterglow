# Contributing to Project Afterglow

Thank you for your interest in contributing to Project Afterglow! This guide will help you get started with development.

## Development Setup

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher
- A modern code editor (VS Code recommended)

### Getting Started

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd project-afterglow
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 in your browser

3. **Run linting:**
   ```bash
   npm run lint
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm run preview  # Preview the production build
   ```

## Project Structure

```
project-afterglow/
├── src/
│   ├── components/      # Reusable React components
│   │   ├── layout/      # Layout components (Header, Footer, Container)
│   │   ├── ui/          # Generic UI components (coming soon)
│   │   └── features/    # Feature-specific components (coming soon)
│   ├── pages/           # Full page components
│   ├── lib/             # Utility functions and helpers
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   └── styles/          # Global styles and Tailwind config
├── docs/                # Product and technical documentation
└── examples/            # Sample data files for testing
```

## Code Style Guide

### TypeScript

- Use TypeScript for all new files
- Enable strict mode (already configured)
- Define interfaces for all props and data structures
- Avoid `any` type; use `unknown` if truly dynamic

```typescript
// ✅ Good
interface UserProfile {
  id: string
  name: string
  age?: number  // Optional fields use ?
}

function greetUser(profile: UserProfile): string {
  return `Hello, ${profile.name}!`
}

// ❌ Avoid
function greetUser(profile: any) {
  return `Hello, ${profile.name}!`
}
```

### React Components

- Use functional components with hooks
- Keep components small and focused (< 200 lines)
- Extract complex logic into custom hooks
- Use TypeScript interfaces for props

```typescript
// ✅ Good component structure
interface CardProps {
  title: string
  description: string
  variant?: 'default' | 'interactive'
}

export default function Card({ title, description, variant = 'default' }: CardProps) {
  return (
    <div className={variant === 'interactive' ? 'card-interactive' : 'card'}>
      <h3 className="font-display font-semibold">{title}</h3>
      <p className="text-warm-700">{description}</p>
    </div>
  )
}
```

### Styling with Tailwind

- Use utility classes instead of custom CSS when possible
- Leverage the custom theme (see `docs/DESIGN_SYSTEM.md`)
- Use semantic color names (`afterglow-500`, `twilight-600`)
- Mobile-first responsive design

```tsx
// ✅ Good
<div className="px-4 py-6 md:px-6 md:py-8 bg-white rounded-2xl shadow-soft">

// ❌ Avoid inline styles
<div style={{ padding: '24px', background: 'white', borderRadius: '16px' }}>
```

### Brand Voice in Copy

All user-facing text should align with brand guidelines:

- **Warm, not clinical** — "Let's explore" instead of "Analyze data"
- **Supportive, not judgmental** — "Opportunity" instead of "Problem"
- **Clear, not technical** — "Your messages stay on your device" instead of "Client-side processing"
- **Empowering, not prescriptive** — "You might try" instead of "You should do"

See `docs/BRAND_VOICE.md` for complete guidelines.

## Path Aliases

Use path aliases for cleaner imports:

```typescript
// ✅ Good
import Header from '@components/layout/Header'
import { parseMessages } from '@lib/parsers'
import { useUpload } from '@hooks/useUpload'

// ❌ Avoid relative paths
import Header from '../../../components/layout/Header'
```

Available aliases:
- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@lib/*` → `src/lib/*`
- `@hooks/*` → `src/hooks/*`
- `@types/*` → `src/types/*`
- `@pages/*` → `src/pages/*`

## Testing

(Coming soon in Task 2.2)

- Write unit tests for utilities and hooks
- Write component tests for UI components
- Use Testing Library for React components
- Follow "test behavior, not implementation" principle

## Git Workflow

### Branch Naming

- `feature/` — New features (e.g., `feature/upload-zone`)
- `fix/` — Bug fixes (e.g., `fix/parser-error`)
- `docs/` — Documentation updates (e.g., `docs/api-reference`)
- `refactor/` — Code refactoring (e.g., `refactor/consolidate-parsers`)

### Commit Messages

Follow conventional commits format:

```
feat: add drag-and-drop upload zone
fix: correct timestamp parsing for Hinge exports
docs: update design system color palette
refactor: extract parser utilities into lib
style: fix linting issues in Header component
test: add tests for message normalization
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the code style guide
3. Ensure all linting passes (`npm run lint`)
4. Build successfully (`npm run build`)
5. Write/update tests (when testing is set up)
6. Update documentation if needed
7. Create a pull request with a clear description
8. Link to any related issues

## Privacy & Security Guidelines

Project Afterglow prioritizes user privacy. When contributing:

- ✅ **DO** process data client-side whenever possible
- ✅ **DO** clearly communicate what happens to user data
- ✅ **DO** provide explicit opt-ins for any non-local processing
- ✅ **DO** implement instant data deletion
- ❌ **DON'T** send user data to external servers without explicit consent
- ❌ **DON'T** log message content or personal information
- ❌ **DON'T** use third-party analytics without privacy review

## Design System Usage

Reference `docs/DESIGN_SYSTEM.md` for:
- Complete color palette with usage guidelines
- Typography scale and font choices
- Spacing system
- Component patterns
- Animation utilities
- Accessibility requirements

### Common Patterns

#### Section with Header
```tsx
<section className="py-20 bg-white">
  <Container maxWidth="lg">
    <div className="section-header text-center">
      <h2 className="section-title">Section Title</h2>
      <p className="section-description mx-auto">
        Description text
      </p>
    </div>
    {/* Section content */}
  </Container>
</section>
```

#### Insight Card
```tsx
<div className="card-interactive">
  <div className="flex items-start gap-4">
    <div className="w-12 h-12 rounded-xl bg-insight-positive-light flex items-center justify-center">
      <Icon className="w-6 h-6 text-insight-positive" />
    </div>
    <div className="space-y-2">
      <h3 className="font-display font-semibold">Card Title</h3>
      <p className="text-warm-700">Description</p>
    </div>
  </div>
</div>
```

#### Privacy Badge
```tsx
<div className="privacy-badge">
  <LockIcon className="w-4 h-4" />
  <span>100% Private</span>
</div>
```

## Accessibility Checklist

When adding new components:

- [ ] Use semantic HTML elements
- [ ] Ensure keyboard navigation works
- [ ] Add ARIA labels for icon-only buttons
- [ ] Test with screen reader (VoiceOver on Mac, NVDA on Windows)
- [ ] Verify color contrast meets WCAG AA minimum
- [ ] Ensure touch targets are at least 44x44px
- [ ] Test responsive design on mobile devices

## Performance Guidelines

- Use `React.memo()` for expensive components
- Implement code splitting for large features
- Lazy load heavy libraries (use `React.lazy()`)
- Keep bundle sizes small (check with `npm run build`)
- Optimize images (use WebP, compress, provide multiple sizes)
- Use Web Workers for CPU-intensive processing (parsing, NLP)

## Questions?

- Check `docs/` directory for detailed documentation
- Review `docs/TASKS.md` for current roadmap
- See `docs/PRD.md` for product vision
- Read `docs/MVP.md` for technical architecture

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- Be respectful and empathetic in all interactions
- Focus on constructive feedback
- Assume good intentions
- Prioritize user privacy and emotional safety in all decisions

---

Happy coding! ✨
