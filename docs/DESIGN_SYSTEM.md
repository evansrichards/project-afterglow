# Project Afterglow Design System

## Overview
This design system implements the brand voice through color, typography, spacing, and component patterns. All choices prioritize warmth, clarity, and emotional safety.

## Color Palette

### Primary: Afterglow (Warm Sunrise)
Main brand color representing hope, warmth, and new beginnings.

```css
afterglow-50:  #fff9f5  /* Lightest tint for backgrounds */
afterglow-100: #fff2e8
afterglow-200: #ffe3d1
afterglow-300: #ffcca8
afterglow-400: #ffab73
afterglow-500: #ff8a3d  /* Primary brand color */
afterglow-600: #f96d1f
afterglow-700: #e05416
afterglow-800: #b84315
afterglow-900: #8d3314  /* Darkest for text */
```

**Usage:**
- Primary CTAs and buttons
- Interactive elements on hover
- Brand accents and highlights
- Progress indicators

### Secondary: Twilight (Calming Blues)
Represents trust, calm, and safety.

```css
twilight-50:  #f4f8fb
twilight-100: #e9f1f7
twilight-200: #cfe3f0
twilight-300: #a5cce4
twilight-400: #74b1d5
twilight-500: #5196c4
twilight-600: #3c7cb0  /* Secondary brand color */
twilight-700: #31658f
twilight-800: #2c5577
twilight-900: #294764
```

**Usage:**
- Privacy badges and security indicators
- Secondary buttons
- Supportive backgrounds for privacy sections
- Informational states

### Neutrals: Warm Grays
Warmer than standard grays to maintain inviting feel.

```css
warm-50:  #fafaf9  /* Page background */
warm-100: #f5f5f4
warm-200: #e7e5e4
warm-300: #d6d3d1
warm-400: #a8a29e
warm-500: #78716c
warm-600: #57534e
warm-700: #44403c
warm-800: #292524
warm-900: #1c1917  /* Primary text */
```

**Usage:**
- Body text (`warm-900` for primary, `warm-700` for secondary)
- Borders and dividers
- Backgrounds and cards
- Disabled states

### Semantic: Insight Colors
Purpose-specific colors for different insight types.

```css
/* Positive/Success */
insight-positive:       #10b981
insight-positive-light: #d1fae5

/* Growth Opportunity */
insight-growth:         #f59e0b
insight-growth-light:   #fef3c7

/* Warning/Caution */
insight-caution:        #f97316
insight-caution-light:  #ffedd5

/* Reflection */
insight-reflection:     #8b5cf6
insight-reflection-light: #ede9fe
```

**Usage:**
- Insight card backgrounds
- Badge colors for pattern types
- Icon backgrounds
- Chart/visualization colors

---

## Typography

### Font Families

**Display Font:** Outfit
- Headings (h1-h6)
- Section titles
- Logo text
- Used for warmth and approachability

**Body Font:** Inter
- Body text
- UI elements
- Forms and inputs
- Used for readability and professionalism

### Type Scale

```css
text-xs:   0.75rem  (12px)  — Small labels, captions
text-sm:   0.875rem (14px)  — Secondary text, helper text
text-base: 1rem     (16px)  — Body text (default)
text-lg:   1.125rem (18px)  — Emphasized body text
text-xl:   1.25rem  (20px)  — Small headings
text-2xl:  1.5rem   (24px)  — Card titles
text-3xl:  1.875rem (30px)  — Section headings (h3)
text-4xl:  2.25rem  (36px)  — Page headings (h2)
text-5xl:  3rem     (48px)  — Hero headings (h1)
```

**Line Height:**
- Generous line heights (1.5-1.7) for readability
- Tighter for large headings (1.2-1.3)

**Letter Spacing:**
- Subtle negative tracking on large text (-0.02em to -0.03em)
- Slight positive on small text (0.01em)

---

## Spacing System

### Standard Scale
Follows 4px base unit with extended values for breathing room:

```
1:   0.25rem  (4px)
2:   0.5rem   (8px)
3:   0.75rem  (12px)
4:   1rem     (16px)
6:   1.5rem   (24px)
8:   2rem     (32px)
12:  3rem     (48px)
16:  4rem     (64px)
20:  5rem     (80px)
24:  6rem     (96px)
32:  8rem     (128px)
```

### Custom Extensions
```
18:  4.5rem   (72px)   — Section spacing
88:  22rem    (352px)  — Large layouts
100: 25rem    (400px)  — Extra large
128: 32rem    (512px)  — Maximum spacing
```

**Usage Guidelines:**
- `gap-8` or `gap-12` between sections
- `space-y-4` or `space-y-6` within components
- `p-6` standard card padding
- `py-20` or `py-32` for page sections

---

## Component Patterns

### Buttons

#### Primary Button
```tsx
<button className="btn-primary">
  Get Started
</button>
```
- Background: `afterglow-500`
- Text: white
- Hover: `afterglow-600` with shadow lift
- Use for main CTAs

#### Secondary Button
```tsx
<button className="btn-secondary">
  Learn More
</button>
```
- Background: `twilight-100`
- Text: `twilight-700`
- Hover: `twilight-200`
- Use for secondary actions

#### Ghost Button
```tsx
<button className="btn-ghost">
  Cancel
</button>
```
- Background: transparent
- Text: `warm-700`
- Hover: `warm-100`
- Use for tertiary actions

### Cards

#### Standard Card
```tsx
<div className="card">
  {/* Content */}
</div>
```
- White background
- Soft shadow
- Rounded corners (2xl)
- Standard padding

#### Interactive Card
```tsx
<div className="card-interactive">
  {/* Content */}
</div>
```
- Extends card
- Hover effects (shadow lift, border color change)
- Slight translate-y on hover
- Use for clickable insight cards

### Badges

```tsx
<span className="badge-positive">Strength</span>
<span className="badge-growth">Opportunity</span>
<span className="badge-caution">Attention Needed</span>
<span className="badge-reflection">Insight</span>
```

### Privacy Badge
```tsx
<div className="privacy-badge">
  <LockIcon />
  <span>100% Private</span>
</div>
```

### Form Inputs
```tsx
<input
  type="text"
  className="input"
  placeholder="Enter your thoughts..."
/>
```

---

## Animations

### Fade In
```tsx
<div className="animate-fade-in">
  {/* Content fades in smoothly */}
</div>
```
Duration: 0.5s

### Slide Up
```tsx
<div className="animate-slide-up">
  {/* Content slides up from below */}
</div>
```
Duration: 0.4s
Good for staggered content reveals

### Gentle Pulse
```tsx
<div className="animate-pulse-gentle">
  {/* Subtle pulsing for loading states */}
</div>
```
Duration: 2s infinite

### Staggered Delays
```tsx
<div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
  {/* Delayed animation */}
</div>
```

---

## Shadows

```css
shadow-soft:    /* Subtle elevation */
shadow-soft-lg: /* Pronounced elevation */
shadow-inner-soft: /* Inset for inputs */
```

**Usage:**
- `shadow-soft` for cards at rest
- `shadow-soft-lg` for cards on hover or important CTAs
- No shadows on flat UI elements (badges, plain text)

---

## Layout Utilities

### Container
```tsx
<Container maxWidth="lg">
  {/* Centered content with responsive padding */}
</Container>
```

Options: `sm`, `md`, `lg`, `xl`, `2xl`, `full`

### Section Structure
```tsx
<section className="py-20 bg-white">
  <Container maxWidth="lg">
    <div className="section-header text-center">
      <h2 className="section-title">Title</h2>
      <p className="section-description">Description</p>
    </div>
    {/* Section content */}
  </Container>
</section>
```

### Gradients
```tsx
<div className="gradient-warm">
  {/* Subtle warm gradient background */}
</div>

<div className="gradient-sunset">
  {/* Bold sunset gradient for CTAs */}
</div>
```

---

## Responsive Breakpoints

```css
sm:  640px   /* Mobile landscape, small tablets */
md:  768px   /* Tablets */
lg:  1024px  /* Laptops */
xl:  1280px  /* Desktops */
2xl: 1536px  /* Large desktops */
```

### Mobile-First Approach
```tsx
<h1 className="text-3xl md:text-5xl">
  {/* 3xl on mobile, 5xl on tablet+ */}
</h1>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive grid */}
</div>
```

---

## Accessibility

### Focus States
All interactive elements have custom focus rings:
```css
focus-visible:ring-2
focus-visible:ring-afterglow-500
focus-visible:ring-offset-2
```

### Color Contrast
- Primary text (`warm-900`) on light backgrounds meets WCAG AAA
- All button text meets WCAG AA minimum
- Insight badges maintain sufficient contrast

### Screen Reader Support
- Semantic HTML elements (`header`, `footer`, `section`)
- Descriptive labels on all interactive elements
- ARIA labels where needed

---

## Usage Examples

### Hero Section
```tsx
<section className="gradient-warm py-20 md:py-32">
  <Container maxWidth="lg">
    <div className="text-center space-y-8 animate-fade-in">
      <h1 className="text-5xl md:text-6xl font-display font-bold text-warm-900">
        Turn your dating data into{' '}
        <span className="text-afterglow-600">compassionate insights</span>
      </h1>
      <p className="text-xl text-warm-700 max-w-3xl mx-auto">
        Supporting text goes here
      </p>
      <button className="btn-primary text-lg px-8 py-4">
        Get Started
      </button>
    </div>
  </Container>
</section>
```

### Insight Card
```tsx
<div className="card-interactive">
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-insight-positive-light flex items-center justify-center">
      <Icon className="w-6 h-6 text-insight-positive" />
    </div>
    <div className="space-y-2">
      <h3 className="font-display font-semibold text-warm-900">
        Card Title
      </h3>
      <p className="text-warm-700">
        Supporting description
      </p>
    </div>
  </div>
</div>
```

---

## Design Principles

1. **Warmth Over Clinical** — Use rounded corners, warm colors, generous spacing
2. **Clarity Over Complexity** — Clear hierarchy, readable type, obvious actions
3. **Support Over Judgment** — Positive framing, gentle language, encouraging tone
4. **Privacy Over Performance** — Always visible privacy indicators, clear controls
5. **Calm Over Busy** — Breathing room, subtle animations, reduced visual noise

---

**Last Updated:** 2025-10-18
**Version:** 1.0 (MVP)
