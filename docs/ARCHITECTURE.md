# Bass Ball Architecture

## System Overview

Bass Ball is a blockchain-powered web3 basketball game built on Base chain with real-time multiplayer, NFT integration, and AI-enhanced matchmaking.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer (Next.js)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   PWA    │  │  Wallet  │  │   Game   │  │  Admin   │   │
│  │ Offline  │  │  Connect │  │   UI     │  │  Tools   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer (TypeScript)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   RUM    │  │  Error   │  │    ML    │  │   PWA    │   │
│  │ Tracking │  │ Tracking │  │  Engine  │  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Econ    │  │ Feature  │  │   Recs   │  │  Touch   │   │
│  │ Monitor  │  │  Flags   │  │  Engine  │  │ Gestures │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Blockchain Layer (Base/EVM)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Smart   │  │   NFT    │  │  Token   │  │  Bridge  │   │
│  │Contracts │  │ Minting  │  │  Staking │  │  L1↔L2   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5
- **Styling:** CSS Modules, Tailwind (optional)
- **State:** React hooks, local storage services
- **Build:** Webpack, SWC

### Blockchain
- **Network:** Base (Ethereum L2)
- **Wallet:** WalletConnect, MetaMask, Coinbase Wallet, Rainbow
- **Libraries:** wagmi, viem, ethers
- **Standards:** ERC-20, ERC-721, ERC-1155

### Services & Infrastructure
- **PWA:** Service Worker, Cache API, Push Notifications
- **Performance:** PerformanceObserver, Web Vitals
- **ML/AI:** Custom TypeScript implementations (KMeans, ELO, recommendations)
- **Testing:** Playwright E2E, Jest/Vitest (unit)
- **Monitoring:** Custom RUM service, Sentry integration

## Core Components

### 1. Game Engine
- Deterministic physics and collision
- Server-authoritative validation
- Replay system with state snapshots
- Anti-cheat detection

### 2. Matchmaking System
- ELO/MMR rating
- KMeans clustering for skill groups
- Region and latency-based matching
- ML-powered fraud detection

### 3. Economic System
- Token rewards and inflation tracking
- Transaction anomaly detection
- Player economic profiles
- Supply/demand monitoring

### 4. Admin & Moderation
- Investigation dashboard
- Feature flag rollouts
- Economic monitoring
- Content moderation queue

### 5. Mobile & Accessibility
- PWA with offline support
- Touch gesture library (tap, swipe, pinch, pan)
- WCAG 2.1 AA compliance
- Screen reader optimization

## Architecture Decision Records (ADRs)

### ADR-001: Next.js App Router
**Status:** Accepted  
**Context:** Need SSR, routing, and modern React features  
**Decision:** Use Next.js 14 with App Router for file-based routing and server components  
**Consequences:** Better SEO, simpler routing, requires Node.js runtime

### ADR-002: TypeScript Throughout
**Status:** Accepted  
**Context:** Need type safety for complex game logic and blockchain interactions  
**Decision:** Use TypeScript for all code (client, server, services)  
**Consequences:** Better DX, fewer runtime errors, steeper learning curve

### ADR-003: Base Chain for L2 Scaling
**Status:** Accepted  
**Context:** Need low-cost, fast transactions for in-game actions  
**Decision:** Deploy on Base (Ethereum L2) for reduced gas fees  
**Consequences:** Lower costs, faster confirmations, requires bridge for L1 assets

### ADR-004: Client-Side Services Pattern
**Status:** Accepted  
**Context:** Need reusable, testable business logic separate from UI  
**Decision:** Implement singleton service classes (RUM, error tracking, ML, etc.)  
**Consequences:** Clean separation, easier testing, state management via localStorage

### ADR-005: Custom ML Instead of Server-Side
**Status:** Accepted  
**Context:** Need matchmaking and recommendations without server dependency  
**Decision:** Implement lightweight ML algorithms in TypeScript (KMeans, ELO, CF)  
**Consequences:** Faster iteration, no backend needed, limited model complexity

### ADR-006: Progressive Web App (PWA)
**Status:** Accepted  
**Context:** Need mobile-first experience with offline capability  
**Decision:** Implement service worker, manifest, and caching strategies  
**Consequences:** Installable app, offline support, additional complexity

### ADR-007: Feature Flags for Rollouts
**Status:** Accepted  
**Context:** Need safe, gradual feature releases and A/B testing  
**Decision:** Build custom feature flag service with rules and progressive rollout  
**Consequences:** Controlled releases, built-in analytics, requires flag management

### ADR-008: Playwright for E2E Testing
**Status:** Accepted  
**Context:** Need cross-browser, comprehensive E2E tests  
**Decision:** Use Playwright for all E2E, performance, and accessibility tests  
**Consequences:** Modern tooling, great DX, requires separate test maintenance

### ADR-009: Sentry-Compatible Error Tracking
**Status:** Accepted  
**Context:** Need crash analytics with graceful fallback  
**Decision:** Build Sentry-compatible service with offline queue  
**Consequences:** Can use Sentry or custom endpoint, requires manual integration

### ADR-010: Accessibility First
**Status:** Accepted  
**Context:** Need inclusive design and WCAG compliance  
**Decision:** Build accessibility tools, audits, and enforce standards  
**Consequences:** Broader audience, compliance requirements, additional testing

## Data Flow

### Game Match Flow
1. Player initiates matchmaking
2. ML engine finds compatible opponents
3. Match state initialized (deterministic seed)
4. Real-time updates via state sync (future: WebSocket)
5. Server validates critical actions (anti-cheat)
6. Match result recorded, ELO updated
7. Rewards distributed via smart contract

### Economic Flow
1. User earns tokens via gameplay
2. Transaction recorded in economic monitoring
3. Anomaly detection runs
4. Thresholds checked against budgets
5. Violations flagged for admin review
6. Approved transactions execute on-chain

### Feature Rollout Flow
1. Admin creates feature flag with rules
2. User requests feature evaluation
3. Flag service checks targeting rules
4. Progressive rollout stage determined
5. User assigned to cohort (A/B test)
6. Analytics recorded
7. Gradual increase in rollout percentage

## Security Considerations

- **Smart Contracts:** Audited, upgradeable proxies, multi-sig for admin functions
- **Anti-Cheat:** Server-side validation, deterministic replay verification, fraud detection ML
- **Wallet Security:** Client-side signing only, never request private keys
- **Data Privacy:** Minimize PII, encrypt sensitive data, GDPR-compliant data exports
- **Rate Limiting:** Protect endpoints from abuse, matchmaking throttling

## Performance Targets

- **FCP (First Contentful Paint):** < 1.5s
- **LCP (Largest Contentful Paint):** < 2.5s
- **CLS (Cumulative Layout Shift):** < 0.1
- **TTFB (Time to First Byte):** < 600ms
- **Bundle Size:** < 500KB (gzipped)
- **Matchmaking Latency:** < 2s for 90th percentile
- **Transaction Confirmation:** < 10s on Base

## Deployment

- **Hosting:** Vercel (Next.js), Netlify, or self-hosted
- **Blockchain:** Base mainnet (production), Base Sepolia (testnet)
- **CDN:** Vercel Edge, Cloudflare
- **Monitoring:** Custom RUM + Sentry
- **CI/CD:** GitHub Actions with E2E tests on PR

## Future Enhancements

- WebSocket real-time multiplayer
- Voice chat integration
- Tournament bracket system
- Mobile native apps (React Native)
- Advanced analytics dashboard
- Community-created content (UGC)
- Cross-chain bridge expansion
