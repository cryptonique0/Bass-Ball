# Bass Ball Developer Quickref

Complete reference for all features, APIs, and tools.

## Project Structure

```
Bass-Ball/
├── src/app/              # Next.js pages (App Router)
├── components/           # React components
├── hooks/                # React hooks
├── lib/                  # Core libraries
├── services/             # Business logic
├── e2e/                  # E2E tests (Playwright)
├── sdk/                  # Official SDKs
├── docs/                 # Documentation
└── public/               # Static assets
```

## Core Services

### PWA Service (`lib/pwaService.ts`)
```ts
import pwaService from '@/lib/pwaService';
await pwaService.initialize();
pwaService.setBudgets({ LCP: 2500, CLS: 0.1 });
await pwaService.sendNotification({ title: 'Update', body: 'New version' });
```

### RUM Service (`services/rum-service.ts`)
```ts
import rumService from '@/services/rum-service';
rumService.initialize();
rumService.setBudgets({ LCP: 2500, TTFB: 600, CLS: 0.1 });
rumService.recordNavigation('/new-route');
const report = rumService.getReport();
```

### Error Tracking (`services/error-tracking.ts`)
```ts
import errorTracking from '@/services/error-tracking';
await errorTracking.init({ dsn: '<DSN>', environment: 'prod' });
errorTracking.captureException(error, { feature: 'checkout' });
errorTracking.setUser({ id: '123', email: 'user@example.com' });
```

### ML Engine (`lib/mlEngine.ts`)
```ts
import { matchmakingEngine, fraudDetector } from '@/lib/mlEngine';
matchmakingEngine.registerProfile({ id: 'p1', rating: 1200, skill: 0.6 });
const matches = matchmakingEngine.findMatches({ playerId: 'p1', tolerance: 200 });
const analysis = fraudDetector.analyze(events, profile);
```

### Recommendations (`lib/recommendationEngine.ts`)
```ts
import recommendationEngine from '@/lib/recommendationEngine';
recommendationEngine.upsertItem({ id: 'arena', tags: ['fast'] });
recommendationEngine.recordInteraction('p1', 'arena', 'play');
const recs = recommendationEngine.getRecommendations('p1', 10);
```

### Plugin System (`lib/pluginSystem.ts`)
```ts
import pluginSystem from '@/lib/pluginSystem';
await pluginSystem.register(myPlugin);
pluginSystem.emit('match.end', matchData);
pluginSystem.registerHook('beforeMatchStart', async (data) => { /* ... */ });
```

## React Hooks

### usePWA (`hooks/usePWA.ts`)
```tsx
const { state, installApp, checkUpdates, clearCache } = usePWA();
```

### useTouch (`hooks/useTouch.ts`)
```tsx
const boxRef = useRef<HTMLDivElement>(null);
useTouch(boxRef, { swipeThreshold: 40 }, {
  onSwipe: (dir) => console.log(dir),
  onTap: () => console.log('tap'),
});
```

### useAdmin (`hooks/useAdmin.ts`)
```tsx
const { investigation, economic, flags } = useAdmin();
```

## Components

### AccessibilityTools (`components/AccessibilityTools.tsx`)
```tsx
import AccessibilityTools from '@/components/AccessibilityTools';
<AccessibilityTools />
```

Includes: skip link, live region, focus outlines, reduced motion, high contrast, color contrast checker.

## E2E Testing

```bash
# Run all tests
npx playwright test

# Specific suite
npx playwright test e2e/basic.spec.ts
npx playwright test e2e/performance
npx playwright test e2e/load
npx playwright test e2e/scenarios

# Debug
npx playwright test --debug --headed
npx playwright show-report
```

## SDK Usage

### TypeScript SDK
```bash
npm install @bassball/sdk
```

```ts
import { BassBallClient } from '@bassball/sdk';
const client = new BassBallClient({ apiUrl: 'https://bassball.game' });
await client.auth_connect();
const profile = await client.player_get('p1');
```

## Performance Budgets

- **TTFB:** < 600ms
- **FCP:** < 1.5s
- **LCP:** < 2.5s
- **CLS:** < 0.1
- **Bundle:** < 500KB

## Accessibility Standards

- WCAG 2.1 AA compliance
- Skip links on all pages
- ARIA landmarks (header, main, nav, footer)
- Keyboard navigation
- Color contrast ≥ 4.5:1
- Screen reader announcements via `aria-live`

## Admin Tools

### Economic Monitoring
```ts
import { economicMonitoringService } from '@/lib/economicMonitoring';
economicMonitoringService.recordTransaction(tx);
const anomalies = economicMonitoringService.getAnomalies();
```

### Feature Flags
```ts
import { featureFlagService } from '@/lib/featureFlagSystem';
featureFlagService.createFlag({ id: 'new-ui', enabled: true });
const enabled = featureFlagService.evaluateFlag('new-ui', userId);
```

## Mobile Utilities

```ts
import { isMobile, getPlatform, getViewportSize, estimateFPS } from '@/lib/mobileUtils';
const fps = await estimateFPS(1000);
```

## API Endpoints

See [docs/api.md](docs/api.md) for full OpenAPI spec.

- `POST /api/auth/challenge` - Get auth challenge
- `POST /api/auth/verify` - Verify signature
- `GET /api/player/{id}` - Get player profile
- `POST /api/matchmaking/search` - Find matches
- `POST /api/game/match` - Create match
- `POST /api/blockchain/rewards/claim` - Claim rewards

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design and ADRs
- [CONTRIBUTING.md](.github/CONTRIBUTING.md) - Development guide
- [api.md](docs/api.md) - API reference
- [E2E_TESTING_GUIDE.md](E2E_TESTING_GUIDE.md) - Testing guide
- [ACCESSIBILITY_AUDIT.md](ACCESSIBILITY_AUDIT.md) - A11y checklist
- Various quickrefs for specific features

## Common Commands

```bash
# Development
npm run dev

# Build
npm run build
npm start

# Lint
npm run lint

# Tests
npx playwright test
npx playwright test --ui
npx playwright codegen

# SDK
cd sdk/typescript
npm run build
```

## Environment Variables

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
NEXT_PUBLIC_BASE_RPC_URL=...
NEXT_PUBLIC_CONTRACT_ADDRESS=...
```

## Contributing

See [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) for setup, workflow, and PR process.

## Support

- Issues: [GitHub Issues](https://github.com/Bass-Ball/issues)
- Docs: [docs/](docs/)
- SDK: [sdk/typescript/README.md](sdk/typescript/README.md)
