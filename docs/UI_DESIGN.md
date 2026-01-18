# 🎯 Bass Ball UI/UX Design Guide

**User Experience Principles, Mobile-First Design, and Interaction Patterns**

A comprehensive guide to Bass Ball's user experience philosophy, interaction design, and responsive mobile-first approach.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Mobile-First Approach](#mobile-first-approach)
3. [Responsive Design System](#responsive-design-system)
4. [Touch Interaction Design](#touch-interaction-design)
5. [Information Architecture](#information-architecture)
6. [User Flows](#user-flows)
7. [Onboarding Experience](#onboarding-experience)
8. [In-Game UI](#in-game-ui)
9. [Post-Match Experience](#post-match-experience)
10. [Error Handling & Feedback](#error-handling--feedback)
11. [Performance & Loading States](#performance--loading-states)
12. [Accessibility & Inclusivity](#accessibility--inclusivity)
13. [Visual Hierarchy](#visual-hierarchy)
14. [Web3 UX Considerations](#web3-ux-considerations)

---

## Design Philosophy

### Core UX Principles

**1. Clarity Over Aesthetics**
- Every visual element conveys information
- No decorative elements without purpose
- Game status always transparent
- Blockchain state always visible

**2. Mobile-Native Design**
- Design for 320px first (smallest phones)
- Desktop as progressive enhancement
- Touch-first interactions
- Gesture support where appropriate

**3. Performance Above All**
- UI must not compromise 60 FPS gameplay
- 16ms frame budget strictly enforced
- Lazy loading for non-critical content
- Optimistic UI updates

**4. Accessibility by Default**
- WCAG 2.1 AA minimum for all UI
- Keyboard navigation complete
- Screen reader friendly
- Color contrast ≥4.5:1

**5. Web3 Transparency**
- All transactions visible
- Gas costs explicit
- Wallet state always clear
- Blockchain status always shown

---

## Mobile-First Approach

### Design Process

**Step 1: Design for 320px**
```
Smallest viable screen (iPhone SE, older phones)
Single column layout
Large touch targets (48px)
Minimal chrome
Clear hierarchy
```

**Step 2: Optimize for 768px**
```
Two-column layout for larger content
Sidebar navigation optional
More whitespace
Subtle animations
```

**Step 3: Enhance for 1024px+**
```
Multi-column layouts
Desktop navigation
Hover effects
Advanced features
```

### Responsive Typography

```
Mobile (320px):  12px base → 14px body → 20px heading
Tablet (768px):  14px base → 16px body → 24px heading
Desktop (1024px): 16px base → 16px body → 28px heading

Use clamp() for smooth scaling:
font-size: clamp(14px, 2vw, 24px);
```

### Responsive Spacing

```
Mobile:   4px, 8px, 12px padding
Tablet:   8px, 12px, 16px padding
Desktop:  12px, 16px, 24px padding

Use fluid spacing:
padding: clamp(1rem, 4vw, 2rem);
```

### Responsive Images

```html
<!-- HD displays get optimized images -->
<picture>
  <source media="(min-width: 1024px)" srcset="image-large.webp">
  <source media="(min-width: 768px)" srcset="image-medium.webp">
  <img src="image-small.webp" alt="Description">
</picture>

<!-- Aspect ratio for consistency -->
<div class="aspect-video bg-gray-200">
  <img src="..." alt="..." class="w-full h-full object-cover">
</div>
```

---

## Responsive Design System

### Breakpoint Strategy

| Breakpoint | Device | Width | Use Case |
|-----------|--------|-------|----------|
| **xs** | Phone (small) | 320px | Samsung Galaxy A, older iPhones |
| **sm** | Phone (large) | 640px | iPhone 12, 13, 14, 15 |
| **md** | Tablet (small) | 768px | iPad mini, small tablets |
| **lg** | Tablet (large) | 1024px | iPad Pro, large tablets |
| **xl** | Desktop | 1280px | Laptops, desktops |
| **2xl** | Large Desktop | 1536px | Ultrawide monitors |

### Responsive Utilities Pattern

```html
<!-- Single prop controls all breakpoints -->
<div class="w-full md:w-1/2 lg:w-1/3">
  <!-- 100% width on mobile, 50% on tablet, 33% on desktop -->
</div>

<!-- Progressive enhancement -->
<div class="text-sm md:text-base lg:text-lg">
  <!-- Grows from 14px → 16px → 18px -->
</div>

<!-- Conditional display -->
<div class="hidden md:block">
  <!-- Hidden on mobile, shown on tablet+ -->
</div>

<div class="md:hidden">
  <!-- Shown on mobile, hidden on tablet+ -->
</div>
```

### Container Sizes (Tailwind)

```css
/* Max widths for content -->
max-width: 24rem;  /* Small container (384px) */
max-width: 42rem;  /* Medium container (672px) */
max-width: 56rem;  /* Large container (896px) */
max-width: 80rem;  /* Full container (1280px) */

/* Safe margins on all sides */
margin: 0 auto;
padding: 1rem;  /* Prevents edge-to-edge on small screens */
```

---

## Touch Interaction Design

### Touch Target Sizes

| Element | Minimum | Comfortable | Spacing |
|---------|---------|-------------|---------|
| Button | 44px × 44px | 48-56px | 8px gap |
| Icon Button | 44px | 48px | 8px |
| Checkbox | 44px | 48px | 16px (inline) |
| Input Field | 44px height | 48-56px | 12px bottom |
| Link | 44px | 48px | 8px |

### Touch-Friendly Spacing

```tsx
<!-- Sufficient vertical spacing for thumb reach -->
<div className="space-y-4 md:space-y-3">
  <button className="h-12 w-full">Join Match</button>
  <button className="h-12 w-full">Watch Replay</button>
  <button className="h-12 w-full">View Stats</button>
</div>

<!-- Full-width buttons (no horizontal scroll) -->
<button className="w-full px-4 py-3">
  Play Now
</button>

<!-- Avoid cramped layouts -->
<!-- ❌ Multiple small buttons in one row -->
<!-- ✅ Stacked buttons or larger touch targets -->
```

### Gesture Interactions

#### Tap
```
- Primary interaction
- 300ms debounce
- Visual feedback: scale, highlight
- No tap delay needed (mobile browsers optimized)
```

#### Long Press (3 seconds)
```
- Context menu
- Card selection
- Advanced actions
- Visual feedback: color change, highlight
```

#### Swipe
```
- Horizontal: Navigate between tabs, dismiss card
- Vertical: Scroll, pull-to-refresh
- Require ≥50px minimum distance
- Velocity-based for momentum
```

#### Pinch-to-Zoom
```
- Allowed on map/replay viewer
- Disabled on text content (readability)
- CSS: user-select, touch-action
```

### Touch Feedback

```tsx
// Immediate visual feedback
<button className="active:scale-95 active:opacity-75 transition-transform duration-100">
  Tap me
</button>

// Loading state during network
<button disabled className="opacity-50 cursor-not-allowed">
  <Spinner /> Loading...
</button>

// Success state
<button className="bg-emerald-500 text-white">
  ✓ Joined Match
</button>
```

---

## Information Architecture

### Navigation Model

```
📍 Home Screen
├── Play Match (CTA)
├── Live Leaderboard
├── My Matches
├── Wallet (top-right)
└── Menu (≡)

📍 Menu (Hamburger)
├── My Profile
├── My Cards
├── Tournaments
├── Settings
├── Help & Support
└── Sign Out
```

### Content Hierarchy (Mobile)

```
1. Immediate Action (CTA, e.g., "Play Match")
2. Most Important Information (score, status)
3. Secondary Information (stats, metadata)
4. Tertiary Information (timestamps, tips)
5. Hidden Information (advanced settings, help)
```

### Information Scent

Users should know where to go:

```
❌ Bad: "View" (vague)
✅ Good: "View Match Replay"

❌ Bad: "Process" (confusing)
✅ Good: "Verify On-Chain"

❌ Bad: "Manage" (unclear)
✅ Good: "Trade Cards"
```

---

## User Flows

### User Flow 1: First-Time Player

```
1. App Opens
   ↓ Guest Mode Option
   
2. Guest Profile Created (Instant)
   ↓ No wallet required
   
3. Tutorial Match Offered (Optional)
   ↓ 2-minute guided match
   
4. Casual Match Queue
   ↓ Join 11v11 match
   
5. Play Match (3 minutes)
   ↓ Server validates
   
6. Post-Match Screen
   ├── Score: 7-3
   ├── Replay: "Verify On-Chain"
   └── Next: "Play Again" or "Connect Wallet"
   
7. Optional: Connect Wallet
   ├── Claim Free Card NFT
   ├── Set Username
   └── Join Leaderboard
```

### User Flow 2: Returning Player (Wallet Connected)

```
1. App Opens
   ↓ Auto-load wallet
   
2. Dashboard
   ├── ELO Rating
   ├── Ranking
   ├── Card Inventory
   └── Quick Stats
   
3. Browse Matches/Tournaments
   ├── Open Tournaments
   ├── Friend Invites
   └── Skill-based Matchmaking
   
4. Join Match
   ├── Select Team
   ├── Confirm Entry Fee
   └── Enter Game
   
5. Play Match (3 minutes)
   
6. Post-Match Screen
   ├── Result & ELO Change
   ├── Verify Replay
   ├── Claim Rewards
   └── Share on Farcaster
```

### User Flow 3: Verify Match Integrity

```
1. User Views Match
2. Clicks "Verify" button
3. System fetches:
   ├── On-chain hash
   ├── IPFS replay
   └── Compute hash locally
4. Result:
   ├── ✓ Verified (match is valid)
   └── ✗ Invalid (fraud detected, report)
```

---

## Onboarding Experience

### Welcome Screen (Mobile-First)

```
┌─────────────────────────────┐
│                             │
│     🏈 Bass Ball            │
│                             │
│   Skill-Based Football      │
│   No Pay-To-Win             │
│   Verifiable Results        │
│                             │
│ ┌─────────────────────────┐ │
│ │   Play as Guest         │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │   Connect Wallet        │ │
│ └─────────────────────────┘ │
│                             │
│   [Learn More] [Skip]       │
│                             │
└─────────────────────────────┘
```

### Onboarding Steps

**Step 1: Choose Profile Type** (Instant)
```
☐ Play as Guest (no wallet)
   └─ Temporary account
   └─ Can claim 1 free NFT later

☐ Connect Wallet
   └─ Permanent profile
   └─ Enable trading, tournaments
```

**Step 2: Set Username** (Optional)
```
[Input field: "Choose your name"]
Placeholder: "Player_12345"
Character limit: 20
```

**Step 3: Tutorial Match** (Optional)
```
"Want a quick tutorial? (2 min)"
- Play against AI
- Learn controls
- See replay verification

[Start Tutorial] [Skip]
```

**Step 4: Join Live Match**
```
"Ready? Jump into a real match."
- 11v11 live players
- 3-minute match
- No entry fee (tutorial)

[Join Now]
```

### Onboarding Checklist (Post-Tutorial)

```
✅ Play first match
☐ Connect wallet (earn NFT rewards)
☐ Set avatar & team color
☐ Watch match replay
☐ Share on Farcaster
☐ Join tournament
```

---

## In-Game UI

### Match Screen Layout

```
┌──────────────────────────────────┐
│ ← Back  ELO: 1425  ⏱ 2:15  ⚙️   │ ← Header (minimal)
├──────────────────────────────────┤
│                                  │
│   🏈 Phaser Game (Full Width)    │ ← Game viewport
│   11v11 Real-time Match Engine   │
│   (Responsive aspect ratio)      │
│                                  │
├──────────────────────────────────┤
│ TEAM A      7 - 3     TEAM B     │ ← Score bar
├──────────────────────────────────┤
│ [🔴 HOME] [◆ SKILL] [🟢 AWAY]  │ ← Action buttons
│ 🎮 [⚡ POWER UP] [📊 STATS]     │
└──────────────────────────────────┘
```

### Responsive Game Viewport

```css
/* Maintains 16:9 aspect ratio */
.game-container {
  width: 100%;
  max-width: 100vw;
  aspect-ratio: 16 / 9;
  background: #1a1a1a;
}

/* Mobile: Full viewport height minus UI */
@media (max-width: 768px) {
  .game-container {
    height: calc(100vh - 200px);  /* Account for score bar + buttons */
  }
}

/* Desktop: Center with padding */
@media (min-width: 1024px) {
  .game-container {
    margin: 0 auto;
    height: 60vh;
  }
}
```

### HUD Elements (Heads-Up Display)

```
┌─────────────────────────────────┐
│ 0:45  ELO: 1425  [●●●●●◯] 85%  │ ← Top bar: Time, ELO, stamina
│                                 │
│ P1 ▶ (Your Player)              │ ← Left: Your player indicator
│ Possession: HOME (2.3s)         │
│                                 │
│ PLAYS:                          │ ← Center: Next play options
│ [1] Pass    [2] Shoot           │
│ [3] Sprint  [4] Tackle          │
│                                 │
│ Wind: ←↖ 12 mph   Zone: Midfield│ ← Right: Environmental info
│ Formation: 4-4-2                │
│                                 │
│ Match Stats:  HOME 7  AWAY 3   │ ← Bottom: Live score
└─────────────────────────────────┘
```

### Mobile Game Controls

```
┌──────────────────────────────┐
│   Game Viewport              │
│   (Phaser 3 rendering)       │
├──────────────────────────────┤
│                              │
│  [🎮 MOVE] [⚡ POWER UP]    │ ← Two buttons (large)
│                              │
│  [1] PASS  [2] SHOOT        │ ← Numbered quick-keys
│  [3] SPRINT [4] TACKLE      │
│                              │
│  ← BACK    STATS →           │ ← Secondary actions
└──────────────────────────────┘

Physical buttons:
- Left side: Movement (thumbpad-like area)
- Right side: Action buttons (ABXY layout)
- Alternately: On-screen D-pad + buttons
```

---

## Post-Match Experience

### Match Result Screen (3 Seconds)

```
┌─────────────────────────────────┐
│                                 │
│          🏈 FINAL SCORE          │
│                                 │
│     HOME 7 - 3 AWAY             │
│                                 │
│     ✓ VERIFIED ON-CHAIN         │
│                                 │
│  ELO Change: +45 (1425 → 1470)  │
│                                 │
│  Your Player:                   │
│  ├─ Goals: 2                    │
│  ├─ Assists: 1                  │
│  └─ Tackles: 4                  │
│                                 │
│ ┌────────────────────────────┐ │
│ │ 📝 View Full Replay        │ │
│ └────────────────────────────┘ │
│                                 │
│ ┌────────────────────────────┐ │
│ │ 🔗 Share on Farcaster     │ │
│ └────────────────────────────┘ │
│                                 │
│  [Play Again]  [Match Stats]   │
│                                 │
└─────────────────────────────────┘
```

### Replay Verification UI

```
┌─────────────────────────────────┐
│ Match #8374 Replay              │
├─────────────────────────────────┤
│                                 │
│ Status: ✓ VERIFIED              │
│                                 │
│ On-Chain Hash:                  │
│ 0x7f8a9b...c2d4e5f (click: copy)│
│                                 │
│ IPFS Replay:                    │
│ QmX2Y3Z... (3.2 MB)            │
│ [Pinned to IPFS ✓]             │
│                                 │
│ Verification Steps:            │
│ ✓ 1. Fetched on-chain hash    │
│ ✓ 2. Downloaded IPFS replay   │
│ ✓ 3. Re-simulated locally     │
│ ✓ 4. Hashes match             │
│ → Match is authentic!          │
│                                 │
│ [Re-verify] [Download Replay] │
│                                 │
└─────────────────────────────────┘
```

### Share Card (Farcaster)

```
┌─────────────────────────────────┐
│ 📱 Share Your Victory            │
├─────────────────────────────────┤
│                                 │
│ 🏈 Just won 7-3 in Bass Ball!  │
│ My ELO: 1470 👑                 │
│ Match ID: #8374                 │
│ Verified on @base ✓             │
│                                 │
│ bassball.io/match/8374          │
│                                 │
│ ┌────────────────────────────┐ │
│ │ Share to Farcaster         │ │
│ └────────────────────────────┘ │
│                                 │
│ [Copy Link]  [Close]            │
│                                 │
└─────────────────────────────────┘
```

---

## Error Handling & Feedback

### Error States

#### Network Error
```
┌─────────────────────────────────┐
│ ⚠️  Connection Lost              │
│                                 │
│ We lost connection to the       │
│ match server.                   │
│                                 │
│ Your match is recorded and      │
│ will be processed when we       │
│ reconnect.                      │
│                                 │
│ Current Status: Reconnecting... │
│ Time Until Auto-Save: 30s       │
│                                 │
│ ┌────────────────────────────┐ │
│ │ Retry Connection           │ │
│ └────────────────────────────┘ │
│                                 │
│ [Go Home]                       │
│                                 │
└─────────────────────────────────┘
```

#### Insufficient Funds
```
┌─────────────────────────────────┐
│ 💰 Not Enough Balance            │
│                                 │
│ Entry fee: $5.00                │
│ Your balance: $2.50             │
│ Shortfall: $2.50                │
│                                 │
│ ┌────────────────────────────┐ │
│ │ Add Funds to Wallet        │ │
│ └────────────────────────────┘ │
│                                 │
│ ┌────────────────────────────┐ │
│ │ Play Free Casual Match     │ │
│ └────────────────────────────┘ │
│                                 │
│ [Cancel]                        │
│                                 │
└─────────────────────────────────┘
```

#### Invalid Transaction
```
┌─────────────────────────────────┐
│ ❌ Transaction Failed            │
│                                 │
│ Error: Insufficient gas         │
│ TX Hash: 0x8f9e7d...a2b3c4     │
│                                 │
│ What happened?                  │
│ The blockchain transaction      │
│ failed. Your wallet wasn't      │
│ charged.                        │
│                                 │
│ ┌────────────────────────────┐ │
│ │ Try Again                  │ │
│ └────────────────────────────┘ │
│                                 │
│ [View on BaseScan]              │
│ [Go Home]                       │
│                                 │
└─────────────────────────────────┘
```

### Success States

#### Match Verified
```
┌─────────────────────────────────┐
│ ✅ Match Verified                │
│                                 │
│ Your match result is secure     │
│ on the Base blockchain.         │
│                                 │
│ Hash: 0x3f4a5b... (Base)       │
│ IPFS: QmX2Y3Z... (Pinned 3x)   │
│                                 │
│ Anyone can verify this match.  │
│                                 │
│ ┌────────────────────────────┐ │
│ │ View Proof on BaseScan     │ │
│ └────────────────────────────┘ │
│                                 │
│ [Share]  [Next Match]           │
│                                 │
└─────────────────────────────────┘
```

#### NFT Claimed
```
┌─────────────────────────────────┐
│ 🎉 Card Minted!                 │
│                                 │
│ [Card Image: Rare WR]           │
│ Wide Receiver (Rare)            │
│ Token ID: #47293                │
│                                 │
│ Speed: 94  |  Jumping: 87       │
│ Catching: 91                    │
│                                 │
│ Gasless via Paymaster ✓         │
│                                 │
│ ┌────────────────────────────┐ │
│ │ View in Wallet             │ │
│ └────────────────────────────┘ │
│                                 │
│ [Trade]  [Use in Team]          │
│                                 │
└─────────────────────────────────┘
```

### Toast Notifications

```
/* Temporary, non-blocking notifications */

✓ Match recorded successfully
⚠ Uploading replay to IPFS...
💾 Match auto-saved
❌ Failed to mint card (retry in 5s)
🔗 Copied link to clipboard
💬 You're connected to Farcaster
🔋 Low battery (device warning)
```

---

## Performance & Loading States

### Skeleton Loaders

```
While leaderboard is loading:

┌─────────────────────────────────┐
│ 🔄 Loading Leaderboard...       │
├─────────────────────────────────┤
│ ▮▮▮▮  Rank 1  $$$  [Skeleton]   │
│ ▮▮▮   Rank 2  $$$  [Skeleton]   │
│ ▮▮▮▮  Rank 3  $$$  [Skeleton]   │
│ ▮▮    Rank 4  $$$  [Skeleton]   │
│ ▮▮▮▮▮ Rank 5  $$$  [Skeleton]   │
│                                 │
│ (Shimmer animation)             │
│                                 │
└─────────────────────────────────┘
```

### Progressive Content Loading

```
1. Render skeleton (instant)
2. Load low-res image (fast)
3. Load high-res image (parallel)
4. Load metadata (parallel)
5. Hydrate with real data (instant swap)

User never sees "loading" - they see progressive enhancement.
```

### Performance Budget

```
Initial Load: <3 seconds (mobile)
- HTML: 50 KB
- JS: 200 KB (gzipped)
- CSS: 50 KB (gzipped)
- Images: 100 KB (optimized)

In-Game:
- FPS: 60 stable (match engine requirement)
- Memory: <150 MB
- Network: <2 Mbps sustained

Post-Match:
- Replay upload: <10 seconds
- Result confirmation: <2 seconds
```

---

## Accessibility & Inclusivity

### Keyboard Navigation

```
Tab       → Next focusable element
Shift+Tab → Previous focusable element
Enter     → Activate button / submit form
Space     → Toggle checkbox
Esc       → Close modal / cancel action
Arrow Keys → Navigate radio buttons, menu items
```

### Screen Reader Support

```
<button aria-label="Play as guest">
  [Guest Icon] Play
</button>

<div aria-live="polite">
  Match starting in 5 seconds...
</div>

<img alt="Season 1 Champion Badge" src="...">

<nav aria-label="Main navigation">
  <!-- Navigation items -->
</nav>
```

### Color Blind Friendly

```
✓ Don't rely on color alone
✓ Use patterns + color (stripes for warnings)
✓ Test with color blind simulator
✓ Minimum contrast 4.5:1

Example:
- Success: ✓ Green + checkmark
- Error: ✗ Red + X icon
- Warning: ⚠ Yellow + triangle
```

### Text Scaling

```css
/* Users can scale text up to 200% without breaking layout */
html {
  font-size: 16px;  /* Default, respects browser settings */
}

/* All sizes use rem or em (relative) units */
h1 { font-size: 2rem; }     /* Scales with user preference */
button { padding: 0.75rem; } /* Scales with user preference */
```

---

## Visual Hierarchy

### Emphasis Techniques

#### 1. Size
```
H1: 28px → Most important
H2: 20px
H3: 16px
Body: 14px → Least important
```

#### 2. Weight
```
Bold (700)       → Important elements
Semibold (600)   → Emphasis
Regular (400)    → Body text
```

#### 3. Color
```
Primary Blue (#0052CC) → CTAs, focus
Success Green → Confirmations
Warning Yellow → Attention
Gray → Secondary information
```

#### 4. Whitespace
```
Important elements get more breathing room
Less important grouped closely together
Creates visual scanning path for eye
```

#### 5. Position
```
Top-left → Scanned first
Center → Most important
Bottom-right → Least important
```

### Visual Hierarchy Example

```
┌─────────────────────────────────┐
│ ← Back [Most Visible Position]  │ Smallest (gray)
│                                 │
│    🏈 Bass Ball Leaderboard     │ Large, bold (primary focus)
│                                 │
│ Top 10 Players This Season      │ Medium, emphasis
│                                 │
│ #1 🏆 PlayerName                │ Large (important)
│    1,250 ELO  •  45-5 record    │ Small (supporting)
│                                 │
│ #2 PlayerName2                  │ Medium (less important)
│    1,240 ELO  •  44-6 record    │ Small
│                                 │
│ [See Full Leaderboard ▶]        │ Link (secondary action)
│                                 │
└─────────────────────────────────┘
```

---

## Web3 UX Considerations

### Wallet Integration

#### Wallet Connection Flow
```
1. User taps "Connect Wallet"
2. App shows wallet options (Rainbow, Coinbase, etc.)
3. User selects wallet
4. Wallet app opens (iOS) or modal (web)
5. User approves connection
6. App receives address + signature
7. User profile created

All gasless via Paymaster ✓
```

#### Gas Cost Transparency

```
┌─────────────────────────────────┐
│ Transaction Details             │
├─────────────────────────────────┤
│                                 │
│ Match Entry Fee: $5.00          │
│                                 │
│ Base Network Fee: $0.01         │
│ ├─ Included in entry fee        │
│ └─ Paid via Paymaster           │
│                                 │
│ Total Cost: $5.00               │
│                                 │
│ ✓ Gasless for you               │
│ (Paymaster covers gas)          │
│                                 │
│ [Approve & Join]                │
│                                 │
└─────────────────────────────────┘
```

#### Transaction Feedback

```
Pending (⏳): "Confirming on-chain..."
Confirmed (✓): "Match verified!"
Failed (✗): "Transaction failed. Retrying..."

Show blockchain explorer link:
"View on BaseScan →"
https://basescan.org/tx/0x...
```

### Blockchain Status Display

```
┌─────────────────────────────────┐
│ Network Status                  │
├─────────────────────────────────┤
│                                 │
│ Base Chain: 🟢 Connected        │
│ Gas Price: 0.1 Gwei (normal)   │
│ Last Block: #12,459,812 (2s)   │
│                                 │
│ Wallet: Connected               │
│ Balance: 2.5 ETH                │
│                                 │
│ Latest Match: ✓ Verified        │
│ TX: 0x3f4a... (2 confirmations) │
│                                 │
└─────────────────────────────────┘
```

### NFT Management

#### Card Inventory
```
┌─────────────────────────────────┐
│ My Cards (12)                   │
├─────────────────────────────────┤
│ Filter: [All ▼] Sort: [ELO ▼] │
│                                 │
│ [Card: Rare WR]  [Card: Comm]  │
│ [Card: Epic QB]  [Card: Comm]  │
│ [Card: Rare CB]  [Card: Comm]  │
│ [See More]                      │
│                                 │
│ Rarity Distribution:            │
│ ██░ Common (5)                  │
│ ███░ Rare (4)                   │
│ █░ Epic (2)                     │
│ ░ Legendary (0)                 │
│                                 │
│ Total Value: $127.50            │
│                                 │
│ [Trade]  [Use in Team]          │
│                                 │
└─────────────────────────────────┘
```

#### Smart Contract Verification

```
┌─────────────────────────────────┐
│ Card Details                    │
├─────────────────────────────────┤
│ Wide Receiver (Rare)            │
│ Token ID: #47293                │
│                                 │
│ Stats:                          │
│ Speed: 94                       │
│ Catching: 91                    │
│ Jumping: 87                     │
│                                 │
│ Ownership: You                  │
│ Contract: BassBallPlayerCard    │
│ Network: Base Chain             │
│                                 │
│ [View on BaseScan ↗]            │
│ [View on OpenSea ↗]             │
│                                 │
│ Smart Contract:                 │
│ 0x3F4a5b... (Verified ✓)       │
│                                 │
│ Stats are immutable in code     │
│ [View Source ↗]                 │
│                                 │
└─────────────────────────────────┘
```

---

## File Structure

```
src/
├── pages/
│   ├── home.tsx                 # Landing/dashboard
│   ├── match/[id].tsx          # Match details
│   ├── leaderboard.tsx          # Rankings
│   ├── profile.tsx              # User profile
│   ├── wallet.tsx               # Wallet management
│   └── settings.tsx             # User settings
│
├── components/
│   ├── game/
│   │   ├── PhaserGame.tsx      # Game canvas
│   │   ├── GameHUD.tsx          # Heads-up display
│   │   └── GameControls.tsx     # Input handling
│   │
│   ├── match/
│   │   ├── MatchResult.tsx     # Post-match UI
│   │   ├── ReplayVerifier.tsx  # Verification flow
│   │   └── ShareCard.tsx        # Social sharing
│   │
│   ├── web3/
│   │   ├── WalletConnect.tsx   # Connection flow
│   │   ├── GasDisplay.tsx       # Cost transparency
│   │   └── TransactionStatus.tsx # Feedback
│   │
│   └── layout/
│       ├── Header.tsx           # Top navigation
│       ├── Navigation.tsx       # Main menu
│       └── MobileMenu.tsx       # Hamburger menu
│
├── styles/
│   ├── responsive.css           # Breakpoint utilities
│   ├── animations.css           # Keyframes
│   └── accessibility.css        # A11y utilities
│
└── hooks/
    ├── useResponsive.ts         # Breakpoint detection
    ├── useTouchGestures.ts      # Swipe, long-press
    └── useGameState.ts          # Match state
```

---

## Design Tokens (CSS Variables)

```css
:root {
  /* Spacing Scale */
  --space-xs: 0.5rem;   /* 8px */
  --space-sm: 0.75rem;  /* 12px */
  --space-md: 1rem;     /* 16px */
  --space-lg: 1.5rem;   /* 24px */
  --space-xl: 2rem;     /* 32px */
  --space-2xl: 3rem;    /* 48px */

  /* Typography */
  --font-family-sans: -apple-system, BlinkMacSystemFont, sans-serif;
  --font-family-mono: 'Monaco', monospace;
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-base: 1rem;    /* 16px */
  --font-size-lg: 1.125rem;  /* 18px */

  /* Colors */
  --color-primary: #0052CC;
  --color-success: #10B981;
  --color-error: #EF4444;
  --color-warning: #F59E0B;
  --color-text: #1F2937;
  --color-bg: #FFFFFF;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Z-Index Scale */
  --z-base: 1;
  --z-dropdown: 100;
  --z-modal: 500;
  --z-toast: 1000;
}
```

---

## Usability Testing Checklist

When testing UI/UX with real players:

- ✅ Can new players understand how to join a match in <30 seconds?
- ✅ Is the onboarding path clear without instructions?
- ✅ Do players understand gas fees and blockchain status?
- ✅ Can users find match replays and verification?
- ✅ Are touch targets sized for thumbs (48px minimum)?
- ✅ Does the game work on slow networks (<2 Mbps)?
- ✅ Are error messages helpful and actionable?
- ✅ Can users navigate with keyboard only?
- ✅ Can screen reader users understand the UI?
- ✅ Do animations feel snappy (not sluggish)?
- ✅ Is the leaderboard update rate acceptable?
- ✅ Can users understand pay-to-win guarantees?

---

## Resources & References

- **Mobile UI Best Practices**: https://material.io/design/
- **Apple Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/
- **WCAG 2.1 Accessibility**: https://www.w3.org/WAI/WCAG21/quickref/
- **Web Performance**: https://web.dev/performance/
- **Touch Targets**: https://material.io/design/usability/accessibility.html

---

**Last Updated**: January 18, 2026  
**Version**: 1.0  
**Maintained By**: Bass Ball UX Team  
**Status**: Production Ready ✅
