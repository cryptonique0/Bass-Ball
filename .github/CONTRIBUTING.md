# Contributing to Bass Ball

Thank you for your interest in contributing to Bass Ball! This guide will help you get started.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Project Structure](#project-structure)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- MetaMask or compatible Web3 wallet
- Base Sepolia testnet ETH (for testing)

### First-Time Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Bass-Ball.git
   cd Bass-Ball
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright (for E2E tests)**
   ```bash
   npx playwright install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Required environment variables:
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - Get from [WalletConnect Cloud](https://cloud.walletconnect.com)
   - `NEXT_PUBLIC_BASE_RPC_URL` - Base RPC endpoint
   - `NEXT_PUBLIC_CONTRACT_ADDRESS` - Deployed contract address (optional for local dev)

5. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

## Development Workflow

### Branching Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/your-feature-name` - New features
- `fix/issue-description` - Bug fixes
- `docs/topic` - Documentation updates

### Creating a Feature Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Making Changes
1. Make your changes in focused, atomic commits
2. Write clear commit messages:
   ```
   feat: add touch gesture support for mobile gameplay
   
   - Implement swipe detection for player movement
   - Add pinch-to-zoom for game view
   - Update accessibility guide
   ```

3. Test your changes locally:
   ```bash
   npm run dev          # Development server
   npm run build        # Production build
   npm run lint         # TypeScript/ESLint checks
   npm run test         # Unit tests (if available)
   npx playwright test  # E2E tests
   ```

## Testing

### Running Tests

**All E2E tests:**
```bash
npx playwright test
```

**Specific test suite:**
```bash
npx playwright test e2e/basic.spec.ts
npx playwright test e2e/performance
npx playwright test e2e/scenarios
```

**With browser visible:**
```bash
npx playwright test --headed
```

**Debug mode:**
```bash
npx playwright test --debug
```

**Generate HTML report:**
```bash
npx playwright show-report
```

### Writing Tests
- Add E2E tests for new user-facing features
- Place tests in appropriate directory:
  - `e2e/` - Basic functionality
  - `e2e/performance/` - Performance metrics
  - `e2e/load/` - Load testing
  - `e2e/scenarios/` - User journeys
- Follow existing test patterns
- Use semantic selectors (role, label, text)

### Test Coverage Requirements
- All critical user flows must have E2E tests
- New components should have accessibility tests
- Performance-sensitive features need perf tests

## Pull Request Process

### Before Submitting
1. **Update your branch with latest changes:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout your-feature-branch
   git rebase develop
   ```

2. **Run full test suite:**
   ```bash
   npm run build
   npx playwright test
   ```

3. **Check code quality:**
   ```bash
   npm run lint
   ```

4. **Update documentation:**
   - Add/update relevant documentation
   - Update CHANGELOG.md if applicable

### Submitting PR
1. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create PR on GitHub:
   - Use clear, descriptive title
   - Fill out PR template completely
   - Link related issues
   - Add screenshots/videos for UI changes
   - Mark as draft if work-in-progress

3. **PR Title Format:**
   ```
   feat: Add mobile touch gestures
   fix: Resolve wallet connection timeout
   docs: Update API documentation
   perf: Optimize matchmaking algorithm
   test: Add E2E tests for tournament flow
   ```

### PR Review Process
- Reviewers will provide feedback
- Address comments and push updates
- Re-request review when ready
- Maintain a respectful, collaborative tone
- Be open to suggestions and alternative approaches

### Merge Criteria
- ✅ All CI checks pass
- ✅ E2E tests pass
- ✅ Code reviewed and approved
- ✅ No merge conflicts
- ✅ Documentation updated
- ✅ Accessibility requirements met (if UI change)

## Code Style

### TypeScript
- Use TypeScript for all new code
- Define interfaces for data structures
- Avoid `any` type; use `unknown` if necessary
- Export types alongside implementations

### React Components
- Use functional components with hooks
- Prefer composition over inheritance
- Extract reusable logic into custom hooks
- Use meaningful component and prop names

### File Organization
```typescript
// 1. Imports
import { useState } from 'react';
import ComponentName from '@/components/ComponentName';

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Component
export default function MyComponent({ prop }: Props) {
  // Hooks
  const [state, setState] = useState();
  
  // Handlers
  const handleClick = () => {};
  
  // Render
  return <div>...</div>;
}
```

### Naming Conventions
- **Files:** `camelCase.ts`, `PascalCase.tsx` (components)
- **Components:** `PascalCase`
- **Functions/Variables:** `camelCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Interfaces:** `PascalCase` (no `I` prefix)
- **Types:** `PascalCase`

### Comments
- Use JSDoc for public APIs
- Explain "why" not "what"
- Keep comments up-to-date
- Remove commented-out code

### Accessibility
- Use semantic HTML
- Include ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers
- Maintain color contrast ≥ 4.5:1
- Provide skip links for navigation

## Project Structure

```
Bass-Ball/
├── src/
│   ├── app/              # Next.js App Router pages
│   └── hooks/            # React hooks
├── components/           # React components
├── lib/                  # Core libraries
│   ├── mlEngine.ts       # ML/matchmaking
│   ├── pwaService.ts     # PWA functionality
│   └── touchGestures.ts  # Touch input
├── services/             # Business logic services
│   ├── rum-service.ts    # Performance monitoring
│   └── error-tracking.ts # Error handling
├── e2e/                  # E2E tests (Playwright)
│   ├── basic.spec.ts
│   ├── performance/
│   ├── load/
│   └── scenarios/
├── public/               # Static assets
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service worker
├── docs/                 # Documentation
│   ├── ARCHITECTURE.md
│   └── api.md
└── .github/
    └── CONTRIBUTING.md   # This file
```

## Getting Help

- **Questions:** Open a [GitHub Discussion](https://github.com/Bass-Ball/discussions)
- **Bugs:** Create an [Issue](https://github.com/Bass-Ball/issues)
- **Security:** Email security@bassball.game (do not open public issue)

## Runbook for Common Tasks

### Adding a New Service
1. Create file in `services/` or `lib/`
2. Export singleton instance
3. Add TypeScript types
4. Update `tsconfig.json` paths if needed
5. Create hook in `hooks/` if UI integration needed
6. Add tests in `e2e/`
7. Document in relevant `.md` file

### Adding a New Page Route
1. Create `src/app/your-route/page.tsx`
2. Add metadata export
3. Implement component with proper landmarks
4. Add to navigation if applicable
5. Create E2E test in `e2e/scenarios/`
6. Test accessibility with skip links and keyboard nav

### Updating Smart Contracts
1. Make changes to contract code
2. Write comprehensive tests
3. Deploy to Base Sepolia testnet
4. Update contract address in `.env`
5. Update ABI if interfaces changed
6. Test integration thoroughly
7. Request audit before mainnet deployment

### Releasing a New Feature
1. Implement feature behind feature flag
2. Add to `lib/featureFlagSystem.ts`
3. Test thoroughly in staging
4. Progressive rollout (5% → 25% → 50% → 100%)
5. Monitor RUM metrics and error rates
6. Document in CHANGELOG.md
7. Announce in release notes

## Code of Conduct

- Be respectful and inclusive
- Assume good intent
- Provide constructive feedback
- Focus on code, not people
- Follow the [Contributor Covenant](https://www.contributor-covenant.org/)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

---

Thank you for contributing to Bass Ball! 🏀⛓️
