# Project Afterglow ✨

A compassionate reflection companion that turns dating app exports into actionable insights. Built with privacy-first principles, all processing happens locally in your browser.

## Features

- 🔒 **100% Private** — All data processing happens client-side; nothing leaves your device
- 📊 **Compassionate Insights** — Understand your communication patterns and strengths
- 🎯 **Growth-Oriented** — Gentle experiments and suggestions, not prescriptions
- 🎨 **Thoughtfully Designed** — Warm, supportive UI aligned to brand values
- ⚡ **Fast & Modern** — Built with React, TypeScript, and Vite

## Tech Stack

- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with custom theme
- **Code Quality:** ESLint + TypeScript strict mode
- **Data Storage:** IndexedDB (via `idb` library)
- **Data Processing:** Client-side Web Workers

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

The app will be available at `http://localhost:3000`

## Project Structure

```
project-afterglow/
├── src/
│   ├── components/      # Reusable React components
│   │   └── layout/      # Header, Footer, Container
│   ├── pages/           # Full page components
│   ├── lib/             # Utilities and helpers
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   ├── styles/          # Global styles and Tailwind config
│   ├── App.tsx          # Root component
│   └── main.tsx         # Application entry point
├── docs/                # Product documentation
│   ├── PRD.md          # Product Requirements Document
│   ├── MVP.md          # Technical implementation overview
│   ├── BRAND_VOICE.md  # Tone and brand guidelines
│   ├── TASKS.md        # MVP task tracking
│   └── SUCCESS_METRICS.md # Metrics and KPI definitions
├── examples/            # Sample data files for testing
└── public/              # Static assets
```

## Development Workflow

### Path Aliases

The project uses TypeScript path aliases for cleaner imports:

- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@lib/*` → `src/lib/*`
- `@hooks/*` → `src/hooks/*`
- `@types/*` → `src/types/*`
- `@pages/*` → `src/pages/*`

Example:
```typescript
import Header from '@components/layout/Header'
import { parseMessages } from '@lib/parsers'
```

### Tailwind Theme

Custom theme aligned to brand voice with:
- **Afterglow colors** (warm sunrise palette)
- **Twilight colors** (calm secondary blues)
- **Insight colors** (semantic colors for different insight types)
- Custom typography scale optimized for readability
- Gentle animations for state transitions

## Privacy & Security

- **Local-First:** All file parsing and analysis happens in the browser
- **No Servers:** No data transmission to backend servers by default
- **Instant Delete:** Users can purge all data with one click
- **Optional Sync:** Encrypted cloud sync available only if explicitly opted-in

## Supported Platforms

Currently supports data exports from:
- Tinder (Data Download JSON bundle)
- Hinge (Request My Data ZIP)

More platforms coming soon!

## Contributing

This is currently an MVP in active development. Please see [TASKS.md](docs/TASKS.md) for the current roadmap.

## License

Copyright © 2025 Project Afterglow. All rights reserved.

## Support

For questions or feedback about the product vision, see the [PRD](docs/PRD.md).

---

Built with compassion for people who want to date with more intention, self-awareness, and hope. ✨
