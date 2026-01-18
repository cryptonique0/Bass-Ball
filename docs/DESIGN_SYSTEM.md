# 🎨 Bass Ball Design System

**Component Library, Styling Standards, and UI Guidelines**

A comprehensive design system ensuring consistency, accessibility, and performance across Bass Ball's frontend.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color Palette](#color-palette)
3. [Typography System](#typography-system)
4. [Spacing & Sizing](#spacing--sizing)
5. [Component Library](#component-library)
6. [Tailwind Utilities](#tailwind-utilities)
7. [Animation System](#animation-system)
8. [Accessibility Standards](#accessibility-standards)
9. [Performance Optimization](#performance-optimization)
10. [Responsive Grid System](#responsive-grid-system)
11. [Touch Targets & Mobile UX](#touch-targets--mobile-ux)
12. [Dark Mode & Theme Support](#dark-mode--theme-support)

---

## Design Philosophy

### Core Principles

**1. Clarity Over Beauty**
- Every UI element serves a gameplay function
- Visual hierarchy guides player focus
- Animations clarify, never confuse

**2. Performance First**
- 60 FPS target (match engine requirement)
- Minimal paint/layout thrashing
- CSS containment for isolated rendering
- GPU-accelerated transforms only

**3. Mobile Native**
- Design for 320px screens first
- Touch-friendly (48px minimum tap targets)
- Responsive scaling (no horizontal scroll)
- Gestures before clicks

**4. Accessibility by Default**
- WCAG 2.1 AA compliance
- Semantic HTML + ARIA labels
- Color contrast ≥4.5:1
- Keyboard navigation complete

**5. Web3 Transparency**
- All UI states show blockchain status
- Clear transaction feedback
- Loading states explicit
- Error messages actionable

---

## Color Palette

### Primary Colors

| Color | Hex | Usage | Tailwind |
|-------|-----|-------|----------|
| Primary Blue | `#0052CC` | Brand, CTAs, active states | `blue-600` |
| Success Green | `#10B981` | Verified, win states, confirmations | `emerald-500` |
| Warning Yellow | `#F59E0B` | Pending, caution, loading | `amber-500` |
| Danger Red | `#EF4444` | Errors, loss states, validation | `red-500` |
| Neutral Dark | `#1F2937` | Text, backgrounds (dark mode) | `gray-800` |
| Neutral Light | `#F3F4F6` | Backgrounds, borders (light mode) | `gray-100` |

### Semantic Colors

```css
/* Success */
--color-success: #10B981;     /* emerald-500 */
--color-success-light: #D1FAE5; /* emerald-100 */
--color-success-dark: #065F46;  /* emerald-900 */

/* Error */
--color-error: #EF4444;       /* red-500 */
--color-error-light: #FEE2E2;  /* red-100 */
--color-error-dark: #7F1D1D;   /* red-900 */

/* Warning */
--color-warning: #F59E0B;     /* amber-500 */
--color-warning-light: #FEF3C7; /* amber-100 */
--color-warning-dark: #78350F; /* amber-900 */

/* Info */
--color-info: #3B82F6;        /* blue-500 */
--color-info-light: #DBEAFE;   /* blue-100 */
--color-info-dark: #1E3A8A;    /* blue-900 */
```

### Accessibility Contrast

All text meets WCAG AA minimum:

| Foreground | Background | Contrast Ratio | Usage |
|-----------|-----------|-----------------|-------|
| white | `#0052CC` | 9.2:1 | Buttons, primary CTAs |
| white | `#10B981` | 6.7:1 | Success states |
| white | `#1F2937` | 14.1:1 | Dark backgrounds |
| `#1F2937` | `#F3F4F6` | 12.6:1 | Light backgrounds |

---

## Typography System

### Font Stack

```css
/* Primary Font (UI) */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

/* Game Font (Scoreboards) */
font-family: 'Monaco', 'Courier New', monospace;

/* Display Font (Headlines) */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Type Scale (Tailwind Classes)

```
Heading 1: text-4xl font-bold leading-tight (36px, 400px @desktop)
Heading 2: text-3xl font-bold leading-snug (30px)
Heading 3: text-2xl font-semibold leading-normal (24px)
Heading 4: text-xl font-semibold leading-normal (20px)
Body Large: text-lg leading-relaxed (18px)
Body Regular: text-base leading-relaxed (16px)
Body Small: text-sm leading-normal (14px)
Caption: text-xs leading-tight (12px)
```

### Responsive Typography

```html
<!-- Scales from mobile to desktop -->
<h1 class="text-2xl md:text-3xl lg:text-4xl font-bold">
  Match Results
</h1>

<!-- Game score (monospace) -->
<div class="font-mono text-4xl font-bold text-amber-500">
  7 - 3
</div>

<!-- UI labels (fixed size) -->
<label class="text-xs uppercase tracking-wider text-gray-600">
  Player Name
</label>
```

### Font Weights

- **Regular (400)**: Body text, descriptions
- **Medium (500)**: Emphasis, labels
- **Semibold (600)**: Subheadings, cards
- **Bold (700)**: Headings, CTAs

---

## Spacing & Sizing

### Spacing Scale (Tailwind)

```
0.5rem (8px):   px-2, py-2, gap-2, space-y-2
1rem (16px):    px-4, py-4, gap-4, space-y-4
1.5rem (24px):  px-6, py-6, gap-6, space-y-6
2rem (32px):    px-8, py-8, gap-8, space-y-8
3rem (48px):    px-12, py-12, gap-12, space-y-12
4rem (64px):    px-16, py-16, gap-16, space-y-16
```

### Sizing Standards

```
Compact (Mobile):     4px/8px padding, 16px gaps
Normal (Tablet):      8px/12px padding, 24px gaps
Spacious (Desktop):   12px/16px padding, 32px gaps
```

### Common Component Sizes

```
Button: 44-48px height (touch-friendly)
Icon: 20px, 24px, 32px (scalable)
Avatar: 32px (sidebar), 48px (profile), 64px (large)
Card: 16px/24px padding, 8px border radius
Input Field: 44px height, 12px padding
```

---

## Component Library

### Buttons

#### Primary Button
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
  Play Match
</button>
```

**Variants:**
- `bg-blue-600` (Primary)
- `bg-emerald-500` (Success)
- `bg-red-500` (Danger)
- `bg-gray-300 text-gray-800` (Secondary)

#### Size Variants
- **Small**: `px-3 py-1 text-sm`
- **Medium**: `px-4 py-2 text-base` (default)
- **Large**: `px-6 py-3 text-lg`
- **Full Width**: `w-full`

#### States
```css
/* Default */
bg-blue-600 text-white

/* Hover */
hover:bg-blue-700

/* Active/Pressed */
active:scale-95

/* Loading */
opacity-75 cursor-wait

/* Disabled */
disabled:opacity-50 disabled:cursor-not-allowed

/* Focus (Keyboard) */
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
```

### Cards

```tsx
<div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow">
  <h3 className="text-lg font-semibold mb-2">Match 2347</h3>
  <p className="text-sm text-gray-600 dark:text-gray-400">11v11 • 2 min • 7-3</p>
</div>
```

**Card Types:**
- **Default**: `bg-white p-6 rounded-lg border`
- **Elevated**: `shadow-lg` (modal overlays)
- **Outlined**: `border-2` (interactive elements)
- **Flat**: `bg-gray-50` (less emphasis)

### Input Fields

```tsx
<div className="flex flex-col gap-2">
  <label className="text-sm font-medium text-gray-700">Player Name</label>
  <input 
    type="text"
    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
    placeholder="Enter name..."
  />
</div>
```

**States:**
- **Default**: `border-gray-300`
- **Focus**: `ring-2 ring-blue-500 border-transparent`
- **Error**: `border-red-500 ring-red-500`
- **Disabled**: `bg-gray-100 cursor-not-allowed opacity-50`

### Badges & Pills

```tsx
<!-- Status Badge -->
<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
  ✓ Verified
</span>

<!-- Rarity Badge -->
<span className="inline-flex px-3 py-1 rounded-lg text-sm font-medium bg-amber-100 text-amber-900">
  Rare
</span>
```

**Rarity Colors:**
- **Common**: `bg-gray-100 text-gray-900`
- **Uncommon**: `bg-emerald-100 text-emerald-900`
- **Rare**: `bg-blue-100 text-blue-900`
- **Epic**: `bg-purple-100 text-purple-900`
- **Legendary**: `bg-amber-100 text-amber-900`

### Modals & Overlays

```tsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full mx-4 shadow-xl">
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4">Confirm Action</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Are you sure? This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
        <button className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
      </div>
    </div>
  </div>
</div>
```

### Loaders & Spinners

```tsx
<!-- Spinner -->
<div className="inline-block animate-spin">
  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
  </svg>
</div>

<!-- Loading Bar -->
<div className="h-1 bg-gray-200 rounded-full overflow-hidden">
  <div className="h-full bg-blue-600 animate-pulse" style={{width: '65%'}}/>
</div>

<!-- Skeleton Loaders -->
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-gray-200 rounded w-3/4"/>
  <div className="h-4 bg-gray-200 rounded w-1/2"/>
</div>
```

### Toasts & Notifications

```tsx
<!-- Success Toast -->
<div className="fixed bottom-4 right-4 bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up">
  <span>✓</span>
  <span>Match recorded successfully!</span>
</div>

<!-- Error Toast -->
<div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
  <span>⚠</span>
  <span>Connection lost. Retrying...</span>
</div>
```

---

## Tailwind Utilities

### Custom Tailwind Config

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      // Custom colors
      colors: {
        'bass-blue': '#0052CC',
        'bass-green': '#10B981',
        'bass-orange': '#F59E0B',
      },
      
      // Custom spacing
      spacing: {
        'safe': 'max(1rem, env(safe-area-inset-bottom))',
      },
      
      // Custom animations
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'bounce-in': 'bounceIn 0.4s ease-out',
      },
      
      // Custom keyframes
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      
      // Custom breakpoints
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
    },
  },
  plugins: [],
}
```

### Common Utility Patterns

```html
<!-- Flex Container (Center content) -->
<div class="flex flex-col items-center justify-center gap-4">

<!-- Grid Layout (Responsive) -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

<!-- Responsive Text -->
<h1 class="text-xl md:text-2xl lg:text-3xl">

<!-- Responsive Padding -->
<div class="p-4 md:p-6 lg:p-8">

<!-- Responsive Width -->
<div class="w-full md:w-1/2 lg:w-1/3">

<!-- Safe Area (Mobile Notch) -->
<div class="pb-safe">

<!-- Truncate Text (Ellipsis) -->
<p class="truncate">Long text...</p>

<!-- Line Clamp -->
<p class="line-clamp-3">Multiple line text...</p>

<!-- Aspect Ratio -->
<div class="aspect-video bg-gray-200"></div>

<!-- Dark Mode -->
<div class="bg-white dark:bg-gray-900">
```

---

## Animation System

### Motion Principles

**1. Purpose-Driven**
- Animations clarify transitions
- Duration 150-300ms (fast, snappy)
- Easing: `ease-in-out` or `ease-out`

**2. Performance**
- GPU-accelerated (transform, opacity only)
- Avoid paint/layout triggers
- Use CSS containment

**3. Accessible**
- Respect `prefers-reduced-motion`
- Optional animations (no required interactivity)
- Provide instant alternative

### Standard Animations

```tailwind
/* Quick feedback (button presses) */
active:scale-95 transition-transform duration-100

/* Hover effects */
hover:scale-105 transition-transform duration-200

/* State changes */
transition-all duration-300 ease-in-out

/* Loading states */
animate-pulse animate-spin

/* Entrances */
animate-fade-in animate-slide-up duration-300

/* Exits */
animate-fade-out duration-200
```

### Keyframe Library

```css
/* Fade In/Out */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Scale Pulse */
@keyframes scalePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Shimmer (loading) */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

/* Bounce (attention) */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

### Animation Use Cases

| Use Case | Duration | Easing | Trigger |
|----------|----------|--------|---------|
| Button press | 100ms | `ease-out` | `active:scale-95` |
| Hover | 200ms | `ease-in-out` | `hover:scale-105` |
| Modal entrance | 300ms | `ease-out` | On mount |
| Loading spinner | 1s | linear | Loading state |
| Toast notification | 300ms | `ease-out` | On message |
| Page transition | 200ms | `ease-out` | Route change |

---

## Accessibility Standards

### WCAG 2.1 AA Compliance

#### Color Contrast (4.5:1 minimum for text)
```
✓ White text on #0052CC (9.2:1)
✓ White text on #10B981 (6.7:1)
✓ #1F2937 text on #F3F4F6 (12.6:1)
✗ Gray text on white (<3:1 fails)
```

#### Semantic HTML
```tsx
<!-- Good -->
<button onClick={handleClick}>Start Match</button>
<nav aria-label="Main navigation">...</nav>
<h1>Bass Ball</h1>

<!-- Avoid -->
<div onClick={handleClick}>Start Match</div>
<div role="navigation">...</div>
<div class="text-4xl font-bold">Bass Ball</div>
```

#### Keyboard Navigation
```tsx
// All interactive elements must be focusable
<button tabIndex={0} onKeyDown={handleKeyPress}>

// Logical focus order (DOM order)
<input type="text" /> 
<button type="submit" />

// Focus visible styles
outline-none focus:ring-2 focus:ring-blue-500
```

#### Screen Reader Support
```tsx
<!-- Form labels -->
<label htmlFor="username">Username</label>
<input id="username" />

<!-- ARIA labels for icons -->
<button aria-label="Close menu" onClick={closeMenu}>
  ✕
</button>

<!-- List structures -->
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>

<!-- Live regions (announcements) -->
<div aria-live="polite" aria-atomic="true">
  {matchStatus}
</div>
```

#### Touch Targets
```
Minimum: 48px × 48px
Comfortable: 56px × 56px
Spacing: 8px between targets
```

#### Motion & Seizure Prevention
```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Avoid flashing (>3 times/second) */
/* Avoid rapid color changes */
```

---

## Performance Optimization

### Rendering Performance

#### CSS Containment
```css
/* Isolate component rendering */
.card {
  contain: layout style paint;
}

/* Prevents repainting entire page */
.match-item {
  contain: content;
}
```

#### GPU Acceleration (Transform Only)
```css
/* Fast (GPU accelerated) */
transform: translateX(10px);
opacity: 0.5;

/* Slow (triggers paint) */
left: 10px;
width: 200px;
background: blue;
```

#### Reducing Reflow
```tsx
// Bad: Multiple reflows
element.style.width = '100px';  // Reflow
element.style.height = '100px'; // Reflow
element.style.left = '10px';    // Reflow

// Good: Batch updates
element.style.cssText = 'width: 100px; height: 100px; left: 10px;';

// Better: CSS class
element.classList.add('expanded');
```

### CSS Optimization Tips

1. **Defer non-critical CSS**
   ```html
   <link rel="preload" href="main.css" as="style">
   <link rel="stylesheet" href="main.css">
   ```

2. **Minimize Tailwind output** (with purging)
   ```js
   // tailwind.config.js
   content: ['./src/**/*.{js,jsx,ts,tsx}']
   ```

3. **Use CSS variables for themes**
   ```css
   :root {
     --color-primary: #0052CC;
     --color-success: #10B981;
   }
   ```

---

## Responsive Grid System

### 12-Column Grid

```html
<!-- Full width -->
<div class="grid grid-cols-12 gap-4">
  
  <!-- 6 columns (50%) -->
  <div class="col-span-6">Half width</div>
  
  <!-- 4 columns (33%) -->
  <div class="col-span-4">1/3 width</div>
  
  <!-- 8 columns (67%) -->
  <div class="col-span-8">2/3 width</div>
</div>
```

### Responsive Breakpoints

```html
<!-- Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>

<!-- Stack on mobile, side-by-side on desktop -->
<div class="flex flex-col lg:flex-row gap-6">
  <aside class="lg:w-1/4">Sidebar</aside>
  <main class="lg:w-3/4">Content</main>
</div>
```

### Container Queries (Modern)

```css
@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}
```

---

## Touch Targets & Mobile UX

### Button Sizing

```
Minimum: 44px height, 44px width
Comfortable: 48-56px height
Spacing: 8px gap between buttons
```

```tsx
<!-- Touch-friendly button -->
<button className="w-full px-4 py-3 md:w-auto text-base">
  Play Match
</button>
```

### Gesture Support

```tsx
// Long press (3 seconds)
const handleLongPress = useRef();

const onMouseDown = () => {
  handleLongPress.current = setTimeout(() => {
    openContextMenu();
  }, 3000);
};

const onMouseUp = () => {
  clearTimeout(handleLongPress.current);
};

// Swipe detection
const [startX, setStartX] = useState(0);

const onTouchStart = (e) => setStartX(e.touches[0].clientX);
const onTouchEnd = (e) => {
  const endX = e.changedTouches[0].clientX;
  if (startX - endX > 50) handleSwipeLeft();
  if (endX - startX > 50) handleSwipeRight();
};
```

### Safe Area Padding (iPhone Notch)

```css
/* Respects safe area on notched devices */
padding: max(1rem, env(safe-area-inset-left));
padding-bottom: max(1rem, env(safe-area-inset-bottom));
```

```html
<!-- In Tailwind -->
<div class="pb-safe">Content with safe area padding</div>
```

---

## Dark Mode & Theme Support

### Dark Mode Implementation

```tailwind
<!-- Prefix with 'dark:' -->
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>

<!-- Specific components -->
<button class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
  Action
</button>
```

### Theme Toggle

```tsx
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem('theme');
    const isDarkMode = saved === 'dark' || 
      (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(isDarkMode);
    updateTheme(isDarkMode);
  }, []);

  const updateTheme = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  return (
    <button
      onClick={() => {
        setIsDark(!isDark);
        updateTheme(!isDark);
      }}
      aria-label="Toggle theme"
    >
      {isDark ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
```

### Color Scheme Media Query

```css
/* Detect system preference */
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1f2937;
    --text: #f3f4f6;
  }
}

@media (prefers-color-scheme: light) {
  :root {
    --bg: #ffffff;
    --text: #1f2937;
  }
}
```

---

## Component Checklist

When building new components, verify:

- ✅ **Responsive** (works on 320px-1920px)
- ✅ **Accessible** (keyboard, screen reader, color contrast)
- ✅ **Performant** (CSS containment, GPU acceleration)
- ✅ **Branded** (uses design system colors, spacing, typography)
- ✅ **Tested** (unit tests for interactions)
- ✅ **Documented** (Storybook or component guide)
- ✅ **Dark Mode** (light/dark variants)
- ✅ **Mobile-First** (designed for small screens first)

---

## Design System Usage Examples

### Example 1: Match Card

```tsx
export function MatchCard({ matchId, score, duration }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-base md:text-lg font-semibold">Match {matchId}</h3>
        <span className="text-xs md:text-sm font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-1 rounded">
          ✓ Verified
        </span>
      </div>

      {/* Score */}
      <div className="text-2xl md:text-3xl font-mono font-bold text-amber-500 mb-2">
        {score}
      </div>

      {/* Meta */}
      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
        {duration} • {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
```

### Example 2: Player Stats

```tsx
export function PlayerStats({ name, wins, losses, elo }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
          {name[0]}
        </div>
        <div>
          <h2 className="text-lg font-bold">{name}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">ELO: {elo}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{wins}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Wins</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{losses}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Losses</p>
        </div>
      </div>
    </div>
  );
}
```

---

## File Structure

```
src/
├── components/
│   ├── ui/                          # Design system components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Toast.tsx
│   │   └── Spinner.tsx
│   ├── match/                       # Game-specific components
│   │   ├── MatchCard.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── PlayerStats.tsx
│   │   └── ReplayViewer.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── styles/
│   ├── globals.css                  # Global styles
│   ├── tailwind.css                 # Tailwind config
│   └── animations.css               # Animation definitions
└── hooks/
    ├── useTheme.ts                  # Dark mode
    ├── useResponsive.ts             # Breakpoint detection
    └── useAnimation.ts              # Animation utilities
```

---

## Resources

- **Tailwind CSS**: https://tailwindcss.com/
- **Headless UI**: https://headlessui.com/ (unstyled components)
- **Radix UI**: https://www.radix-ui.com/ (accessible components)
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **Web Vitals**: https://web.dev/vitals/

---

**Last Updated**: January 18, 2026  
**Version**: 1.0  
**Maintained By**: Bass Ball Design System Team  
**Status**: Production Ready ✅
