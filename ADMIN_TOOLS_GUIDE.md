# Phase 6: Admin/Moderation Tools - Complete Implementation Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [API Reference](#api-reference)
5. [Integration Guide](#integration-guide)
6. [Usage Examples](#usage-examples)
7. [Advanced Features](#advanced-features)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Phase 6 delivers a comprehensive admin and moderation system for Bass Ball, featuring:

- **Economic Monitoring**: Real-time token/reward economy tracking with anomaly detection
- **Feature Flags**: Progressive rollouts, A/B testing, and rule-based feature targeting
- **Investigation Dashboard**: Player investigation UI with violation tracking and moderation actions
- **Admin Hooks**: React integration layer for all admin systems
- **Admin Demo**: Full-featured dashboard showcasing all capabilities

### Key Features

✅ **Transaction Tracking** - Record and monitor all economic transactions  
✅ **Reward Metrics** - Track daily issued, claimed, and burned tokens  
✅ **Anomaly Detection** - Automatic detection of 4 anomaly types and 5 suspicious patterns  
✅ **Player Profiling** - Economic risk scoring (0-100) with comprehensive player data  
✅ **Progressive Rollouts** - Deploy features to users gradually with automatic advancement  
✅ **A/B Testing** - Run controlled experiments with metrics tracking  
✅ **Investigation Management** - Investigate violations with evidence and moderation actions  
✅ **Multi-tab Dashboard** - Integrated UI for moderation, economic, and features management

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 ADMIN DEMO UI LAYER                         │
│      (src/app/admin-demo/page.tsx + CSS Module)             │
│   3-Tab Dashboard: Moderation | Economic | Features         │
└──────────────────┬──────────────────────────────────────────┘
                   │
          ┌────────┴────────────────────┐
          │                             │
┌─────────▼──────────────┐  ┌──────────▼─────────────┐
│   REACT HOOKS LAYER    │  │   REACT HOOKS LAYER    │
│    (hooks/useAdmin.ts) │  │   (hooks/useAdmin.ts)  │
│                        │  │                        │
│ • useInvestigation     │  │ • useEconomicMonitor   │
│ • useFeatureFlags      │  │ • useAdmin (combined)  │
└─────────┬──────────────┘  └──────────┬─────────────┘
          │                            │
    ┌─────┴────────────────────────────┴──────┐
    │                                         │
┌───▼──────────────────┐  ┌──────────────────▼───┐
│  SERVICE LAYER       │  │  SERVICE LAYER       │
│  (lib/*.ts files)    │  │  (lib/*.ts files)    │
│                      │  │                      │
│ economicMonitoring   │  │ featureFlagSystem    │
│ Service Class        │  │ Service Class        │
│ • 30+ methods        │  │ • 25+ methods        │
│ • localStorage       │  │ • localStorage       │
│   persistence        │  │   persistence        │
└──────────────────────┘  └──────────────────────┘

┌───────────────────────────────────────────────────┐
│    INVESTIGATION DASHBOARD COMPONENT              │
│    (admin/investigationDashboard.tsx)             │
│    React Component with 5 tabs + moderation UI    │
└───────────────────────────────────────────────────┘
```

### File Structure

```
Bass-Ball/
├── lib/
│   ├── economicMonitoring.ts        (500+ lines) - Economic service
│   └── featureFlagSystem.ts         (400+ lines) - Feature flag service
├── admin/
│   └── investigationDashboard.tsx   (600+ lines) - Investigation UI component
├── hooks/
│   └── useAdmin.ts                  (424 lines)  - Admin React hooks
├── src/app/admin-demo/
│   ├── page.tsx                     (410 lines)  - Admin demo dashboard
│   └── page.module.css              (800+ lines) - Dark theme styling
└── [Documentation]
    └── ADMIN_TOOLS_GUIDE.md         (this file)
```

---

## 🧩 Core Components

### 1. Economic Monitoring Service

**File**: `lib/economicMonitoring.ts`

#### Purpose
Real-time token/reward economy monitoring with automatic anomaly detection, inflation tracking, and player profiling.

#### Key Interfaces

```typescript
interface TokenTransaction {
  id: string;
  playerId: string;
  type: 'earn' | 'spend' | 'transfer' | 'burn' | 'mint';
  amount: number;
  source: string;
  reason: string;
  verified: boolean;
  timestamp: number;
  metadata: Record<string, unknown>;
}

interface RewardMetrics {
  dailyRewardIssued: number;
  dailyRewardClaimed: number;
  dailyRewardBurned: number;
  inflationRate: number;
  burnRate: number;
  claimRate: number;
  avgRewardSize: number;
}

interface PlayerEconomicProfile {
  playerId: string;
  totalEarnings: number;
  totalSpending: number;
  rewardClaimRate: number;
  economicScore: number; // 0-100
  suspiciousPatterns: SuspiciousPattern[];
  transactions: TokenTransaction[];
  lastActivity: number;
}

interface TransactionAnomaly {
  id: string;
  playerId: string;
  anomalyType: 'unusual_amount' | 'rare_pattern' | 'suspicious_timing' | 'blacklisted_address';
  severity: 'low' | 'medium' | 'high';
  description: string;
  flaggedAt: number;
  reviewed: boolean;
  metadata: Record<string, unknown>;
}

interface SuspiciousPattern {
  type: 'rapid_accumulation' | 'reward_farming' | 'unusual_spending' | 'wash_trading' | 'price_manipulation';
  detectedAt: number;
  evidence: string;
  severity: 'low' | 'medium' | 'high';
}
```

#### Main Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `recordTransaction` | playerId, type, amount, source, reason | string (txId) | Records a token transaction |
| `verifyTransaction` | txId | boolean | Verifies transaction legitimacy |
| `getPlayerTransactionHistory` | playerId, days | TokenTransaction[] | Gets player's transaction history |
| `updatePlayerProfile` | playerId, updates | PlayerEconomicProfile | Updates player profile |
| `calculateEconomicScore` | playerId | number | Calculates 0-100 risk score |
| `checkTransactionAnomaly` | txId | TransactionAnomaly \| null | Checks for anomalies |
| `getAnomalies` | reviewed | TransactionAnomaly[] | Gets flagged anomalies |
| `getPlayerProfile` | playerId | PlayerEconomicProfile | Gets player profile |
| `getAllPlayerProfiles` | - | PlayerEconomicProfile[] | Gets all profiles |
| `getSuspiciousPlayers` | threshold | PlayerEconomicProfile[] | Gets players above threshold |
| `calculateRewardMetrics` | dayCount | RewardMetrics | Calculates reward metrics |
| `getInflationIndicators` | - | InflationIndicator[] | Gets inflation data |
| `getTokenSupply` | - | TokenSupply | Gets current supply |
| `generateEconomicReport` | period | EconomicReport | Generates period report |

#### Key Features

**Anomaly Detection (3-Check System)**:
1. **Unusual Amounts**: Transaction > 3x average amount
2. **Rapid Accumulation**: >5000 tokens earned in 24h
3. **Suspicious Timing**: Off-hours activity (detected)

**Reward Claim Rate Alert**: Flags if player claims >95% of rewards

**Default Reward Sources** (5):
- Tournament Wins (1.0x multiplier)
- Match Completion (0.8x bonus)
- Achievement Unlocks (1.5x multiplier)
- Daily Login (0.5x bonus)
- Seasonal Ranking (2.0x multiplier)

**Storage**: `localStorage['economicMonitoring:global']`

---

### 2. Feature Flag System

**File**: `lib/featureFlagSystem.ts`

#### Purpose
Progressive feature deployment with rollout staging, A/B testing, and rule-based targeting.

#### Key Interfaces

```typescript
interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  rolloutType: 'all' | 'percentage' | 'whitelist' | 'blacklist' | 'rule_based';
  rules: FlagRule[];
  version: number;
}

interface FlagRule {
  id: string;
  condition: string; // JavaScript condition string
  value: boolean;
  priority: number;
}

interface ProgressiveRollout {
  flagId: string;
  stages: RolloutStage[];
  currentStageIndex: number;
  autoAdvance: boolean;
}

interface RolloutStage {
  name: string;
  percentage: number; // 0-100
  duration: number; // milliseconds
  startTime: number;
}

interface ABTest {
  id: string;
  name: string;
  controlVersion: string; // flagId
  treatmentVersion: string; // flagId
  split: number; // 50 = 50/50
  active: boolean;
  startTime: number;
  metrics: ABTestMetrics;
}

interface ABTestMetrics {
  control: {
    usersExposed: number;
    conversions: number;
    conversionRate: number;
    engagementTime: number;
  };
  treatment: {
    usersExposed: number;
    conversions: number;
    conversionRate: number;
    engagementTime: number;
  };
  statisticalSignificance: boolean;
}

interface FeatureFlagConfig {
  flagId: string;
  userId: string;
  enabled: boolean;
  version: number;
  abTestVariant: 'control' | 'treatment' | null;
  reason: string;
}
```

#### Main Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `createFlag` | id, name, description, options | FeatureFlag | Creates new feature flag |
| `updateFlag` | id, updates | FeatureFlag | Updates flag configuration |
| `deleteFlag` | id | boolean | Deletes flag |
| `getFlag` | id | FeatureFlag \| null | Gets flag by ID |
| `getAllFlags` | - | FeatureFlag[] | Gets all flags |
| `addRule` | flagId, condition, value, priority | FlagRule | Adds targeting rule |
| `removeRule` | flagId, ruleId | boolean | Removes rule |
| `createProgressiveRollout` | flagId, stages | ProgressiveRollout | Creates rollout plan |
| `getCurrentStage` | flagId | RolloutStage \| null | Gets current rollout stage |
| `createABTest` | id, name, control, treatment, split | ABTest | Creates A/B test |
| `evaluateFlag` | flagId, userId, context | FeatureFlagConfig | Evaluates if enabled for user |
| `recordEvaluation` | flagId, userId, enabled | void | Records evaluation event |
| `recordError` | flagId, error | void | Records error |
| `recordEvent` | event | void | Records custom event |
| `getAnalytics` | flagId | FeatureFlagAnalytics | Gets flag analytics |
| `getAllAnalytics` | - | FeatureFlagAnalytics[] | Gets all analytics |

#### Key Features

**Deterministic User Assignment**:
```typescript
const hash = Math.abs(
  Array.from(userId).reduce((h, c) => 31 * h + c.charCodeAt(0), 0)
);
const isEnabled = (hash % 100) < rolloutPercentage;
```

**Rule Evaluation**:
- Operators: `===`, `==`, `!==`, `!=`, `>`, `<`, `>=`, `<=`
- Priority-based sorting
- Context-aware evaluation

**A/B Test Tracking**:
- Control vs Treatment group metrics
- Conversion rate calculation
- Statistical significance testing
- Engagement time tracking

**Storage**: `localStorage['featureFlagSystem:global']`

---

### 3. Investigation Dashboard Component

**File**: `admin/investigationDashboard.tsx`

#### Purpose
React component providing UI for player investigations with violation tracking and moderation actions.

#### Component Features

**5-Tab Interface**:
1. **Overview** - Investigation queue, stats, notes
2. **Violations** - Violation cards with evidence
3. **Economic** - Economic anomalies and flags
4. **Behavior** - Behavior patterns and toxicity
5. **Actions** - Moderation actions history

**Key Interactions**:
- Search and filter investigations by player/status
- Color-coded risk indicators (red/orange/yellow/cyan)
- Violation evidence display
- Investigation notes with timestamps
- Moderation action buttons (5 types)

#### Props

```typescript
interface InvestigationDashboardProps {
  onPlayerSelect?: (playerId: string) => void;
  onAction?: (action: ModerationAction) => void;
}
```

#### Types

```typescript
type ViolationType = 'inappropriate_content' | 'cheating' | 'abusive_behavior' | 'economic_fraud' | 'account_sharing';
type ViolationStatus = 'pending' | 'investigating' | 'confirmed' | 'dismissed' | 'actioned';
type ModerationActionType = 'warning' | 'mute' | 'suspend' | 'ban' | 'economic_correction';
type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
```

---

### 4. Admin React Hooks

**File**: `hooks/useAdmin.ts`

#### Purpose
React integration layer providing custom hooks for all admin systems with state management.

#### Hooks

**useInvestigation(playerId?)**
```typescript
const {
  investigations,           // PlayerInvestigation[]
  selectedInvestigation,    // PlayerInvestigation | null
  loading,                  // boolean
  fetchInvestigations,      // () => Promise<void>
  addViolation,             // (playerId, violationData) => void
  addNote,                  // (playerId, note) => void
  updateInvestigationStatus,// (playerId, status) => void
  takeAction                // (playerId, action) => void
} = useInvestigation(playerId);
```

**useEconomicMonitoring()**
```typescript
const {
  playerProfiles,           // PlayerEconomicProfile[]
  metrics,                  // RewardMetrics | null
  anomalies,                // TransactionAnomaly[]
  supply,                   // TokenSupply | null
  report,                   // EconomicReport | null
  loading,                  // boolean
  fetchPlayerProfiles,      // () => Promise<void>
  fetchMetrics,             // (dayCount) => void
  generateReport,           // (period) => void
  recordTransaction,        // (playerId, type, amount, source, reason) => string | null
  getSuspiciousPlayers,     // (threshold) => PlayerEconomicProfile[]
  getInflationIndicators    // () => InflationIndicator[]
} = useEconomicMonitoring();
```

**useFeatureFlags()**
```typescript
const {
  flags,                    // FeatureFlag[]
  analytics,                // FeatureFlagAnalytics[]
  userConfig,               // FeatureFlagConfig | null
  events,                   // FeatureFlagEvent[]
  loading,                  // boolean
  fetchFlags,               // () => Promise<void>
  fetchAnalytics,           // () => Promise<void>
  evaluateFlag,             // (flagId, userId, context) => FeatureFlagConfig | null
  createFlag,               // (id, name, description, options) => FeatureFlag | null
  updateFlag,               // (id, updates) => FeatureFlag | null
  deleteFlag,               // (id) => boolean
  addRule,                  // (flagId, condition, value, priority) => FlagRule | null
  createProgressiveRollout, // (flagId, stages) => ProgressiveRollout | null
  createABTest,             // (id, name, control, treatment, split) => ABTest | null
  fetchEvents               // (flagId, limit) => void
} = useFeatureFlags();
```

**useAdmin()**
```typescript
const {
  investigation,     // useInvestigation() hook
  economicMonitoring,// useEconomicMonitoring() hook
  featureFlags       // useFeatureFlags() hook
} = useAdmin();
```

---

### 5. Admin Demo Dashboard

**File**: `src/app/admin-demo/page.tsx`

#### Purpose
Full-featured demo dashboard showcasing all admin capabilities with 3-tab interface.

#### Tab Features

**Moderation Tab**:
- Investigation queue (left panel, searchable)
- Moderation stats grid (pending/active/resolved/flagged)
- Violation distribution
- Player risk color coding

**Economic Tab**:
- Daily metrics (issued/claimed/burned/inflation)
- Token supply breakdown
- High-risk players list
- Transaction anomalies

**Features Tab**:
- Active flags list with rollout %
- Progressive rollouts progress bars
- A/B tests in progress
- Flag analytics summary table

---

## 📖 API Reference

### Economic Monitoring API

#### Recording Transactions

```typescript
// Record a player earning tokens
const txId = economicMonitoringService.recordTransaction(
  playerId: string,
  type: 'earn' | 'spend' | 'transfer' | 'burn' | 'mint',
  amount: number,
  source: string,
  reason: string
): string;

// Example
const txId = economicMonitoringService.recordTransaction(
  'player-123',
  'earn',
  100,
  'tournament_win',
  'Won championship match'
);
```

#### Checking Anomalies

```typescript
// Check if transaction has anomalies
const anomaly = economicMonitoringService.checkTransactionAnomaly(
  txId: string
): TransactionAnomaly | null;

// Get all anomalies (with optional filtering)
const anomalies = economicMonitoringService.getAnomalies(
  reviewed?: boolean
): TransactionAnomaly[];
```

#### Player Profiling

```typescript
// Get or create player profile
const profile = economicMonitoringService.getPlayerProfile(
  playerId: string
): PlayerEconomicProfile;

// Get economic risk score (0-100)
const score = economicMonitoringService.calculateEconomicScore(
  playerId: string
): number;

// Get all suspicious players (above threshold)
const suspicious = economicMonitoringService.getSuspiciousPlayers(
  threshold?: number // default: 70
): PlayerEconomicProfile[];
```

#### Metrics & Reporting

```typescript
// Calculate reward metrics for period
const metrics = economicMonitoringService.calculateRewardMetrics(
  dayCount?: number // default: 1
): RewardMetrics;

// Get inflation indicators
const indicators = economicMonitoringService.getInflationIndicators(): InflationIndicator[];

// Generate comprehensive report
const report = economicMonitoringService.generateEconomicReport(
  period: 'daily' | 'weekly' | 'monthly'
): EconomicReport;
```

### Feature Flag API

#### Creating Flags

```typescript
// Create a simple feature flag
const flag = featureFlagService.createFlag(
  id: string,
  name: string,
  description: string,
  options?: {
    enabled?: boolean;
    rolloutPercentage?: number;
    rolloutType?: 'all' | 'percentage' | 'whitelist' | 'blacklist' | 'rule_based';
  }
): FeatureFlag;

// Example
const flag = featureFlagService.createFlag(
  'new-matchmaking',
  'New Matchmaking Algorithm',
  'Improved ranking calculation',
  { enabled: true, rolloutPercentage: 20, rolloutType: 'percentage' }
);
```

#### Managing Flags

```typescript
// Update flag configuration
const updated = featureFlagService.updateFlag(
  id: string,
  updates: Partial<FeatureFlag>
): FeatureFlag | null;

// Delete a flag
const success = featureFlagService.deleteFlag(
  id: string
): boolean;

// Get flag details
const flag = featureFlagService.getFlag(
  id: string
): FeatureFlag | null;
```

#### Rule-Based Targeting

```typescript
// Add a targeting rule
const rule = featureFlagService.addRule(
  flagId: string,
  condition: string, // e.g., "user.level >= 10"
  value: boolean,
  priority?: number
): FlagRule | null;

// Examples
featureFlagService.addRule('feature-x', 'user.level >= 10', true, 1);
featureFlagService.addRule('feature-y', 'user.region === "US"', true, 2);
featureFlagService.addRule('feature-z', 'user.premiumTier > 0', true, 3);
```

#### Progressive Rollouts

```typescript
// Create staged rollout
const rollout = featureFlagService.createProgressiveRollout(
  flagId: string,
  stages: Array<{
    name: string;
    percentage: number;
    duration: number; // milliseconds
  }>
): ProgressiveRollout | null;

// Example: Gradual 100% rollout over 7 days
const rollout = featureFlagService.createProgressiveRollout(
  'new-ui',
  [
    { name: 'Day 1 - 5%', percentage: 5, duration: 86400000 },
    { name: 'Day 2 - 25%', percentage: 25, duration: 86400000 },
    { name: 'Day 3 - 50%', percentage: 50, duration: 86400000 },
    { name: 'Day 4 - 75%', percentage: 75, duration: 86400000 },
    { name: 'Day 5+ - 100%', percentage: 100, duration: 345600000 }
  ]
);
```

#### A/B Testing

```typescript
// Create A/B test
const test = featureFlagService.createABTest(
  id: string,
  name: string,
  controlFlagId: string,
  treatmentFlagId: string,
  split?: number // 50 for 50/50, default: 50
): ABTest | null;

// Example
const test = featureFlagService.createABTest(
  'matchmaking-test',
  'Matchmaking Algorithm Test',
  'matchmaking-v1',
  'matchmaking-v2',
  50
);
```

#### Evaluating Flags

```typescript
// Evaluate if feature is enabled for user
const config = featureFlagService.evaluateFlag(
  flagId: string,
  userId: string,
  context?: Record<string, unknown>
): FeatureFlagConfig;

// Example
const config = featureFlagService.evaluateFlag(
  'new-ui',
  'player-123',
  { level: 15, region: 'US', premiumTier: 1 }
);

if (config.enabled) {
  // Show new UI
}
```

---

## 🔌 Integration Guide

### 1. Basic Setup in React Components

```typescript
'use client';

import { useAdmin } from '@/hooks/useAdmin';

export default function MyAdminComponent() {
  const { economicMonitoring, featureFlags, investigation } = useAdmin();

  // Access economic data
  useEffect(() => {
    console.log('Player Profiles:', economicMonitoring.playerProfiles);
    console.log('Metrics:', economicMonitoring.metrics);
    console.log('Anomalies:', economicMonitoring.anomalies);
  }, [economicMonitoring]);

  // Access feature flags
  useEffect(() => {
    console.log('Active Flags:', featureFlags.flags);
    console.log('Analytics:', featureFlags.analytics);
  }, [featureFlags]);

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/* Render dashboard */}
    </div>
  );
}
```

### 2. Economic Monitoring Integration

```typescript
'use client';

import { economicMonitoringService } from '@/lib/economicMonitoring';

// In a game event handler
function handleMatchComplete(playerId: string, prizeAmount: number) {
  // Record transaction
  const txId = economicMonitoringService.recordTransaction(
    playerId,
    'earn',
    prizeAmount,
    'match_completion',
    'Completed competitive match'
  );

  // Check for anomalies
  const anomaly = economicMonitoringService.checkTransactionAnomaly(txId);
  if (anomaly) {
    console.warn('Anomaly detected:', anomaly);
    // Flag for admin review
  }

  // Get updated profile
  const profile = economicMonitoringService.getPlayerProfile(playerId);
  console.log('Player risk score:', profile.economicScore);
}
```

### 3. Feature Flag Integration

```typescript
'use client';

import { featureFlagService } from '@/lib/featureFlagSystem';

// During app initialization
function initializeFeatures(userId: string) {
  // Evaluate all flags for user
  const flags = featureFlagService.getAllFlags();
  
  flags.forEach(flag => {
    const config = featureFlagService.evaluateFlag(flag.id, userId);
    console.log(`Flag ${flag.name}: ${config.enabled}`);
  });
}

// Render features conditionally
function MyComponent({ userId }: { userId: string }) {
  const config = featureFlagService.evaluateFlag('experimental-ui', userId);

  return (
    <div>
      {config.enabled ? (
        <NewUIVersion />
      ) : (
        <OldUIVersion />
      )}
    </div>
  );
}
```

### 4. Using Investigation Dashboard

```typescript
import { InvestigationDashboard } from '@/admin/investigationDashboard';

function AdminPanel() {
  const handlePlayerSelect = (playerId: string) => {
    console.log('Selected player:', playerId);
  };

  const handleModerationAction = (action: ModerationAction) => {
    console.log('Action taken:', action);
    // Send to backend
  };

  return (
    <InvestigationDashboard
      onPlayerSelect={handlePlayerSelect}
      onAction={handleModerationAction}
    />
  );
}
```

---

## 💡 Usage Examples

### Example 1: Monitor Token Economy

```typescript
import { useEconomicMonitoring } from '@/hooks/useAdmin';

function EconomyMonitor() {
  const {
    playerProfiles,
    metrics,
    anomalies,
    supply,
    generateReport
  } = useEconomicMonitoring();

  useEffect(() => {
    // Generate daily report
    generateReport('daily');
  }, [generateReport]);

  return (
    <div>
      <h2>Economy Monitor</h2>
      
      <div>
        <h3>Daily Metrics</h3>
        <p>Issued: {metrics?.dailyRewardIssued}</p>
        <p>Claimed: {metrics?.dailyRewardClaimed}</p>
        <p>Burned: {metrics?.dailyRewardBurned}</p>
        <p>Inflation: {metrics?.inflationRate.toFixed(2)}%</p>
      </div>

      <div>
        <h3>Supply</h3>
        <p>Total: {supply?.total}</p>
        <p>Circulating: {supply?.circulating}</p>
        <p>Burned: {supply?.burned}</p>
      </div>

      <div>
        <h3>Anomalies ({anomalies.length})</h3>
        {anomalies.map(anom => (
          <div key={anom.id}>
            <span>{anom.anomalyType}</span>
            <span>{anom.severity}</span>
          </div>
        ))}
      </div>

      <div>
        <h3>High-Risk Players</h3>
        {playerProfiles
          .filter(p => p.economicScore > 70)
          .map(profile => (
            <div key={profile.playerId}>
              <span>{profile.playerId}</span>
              <span>Risk: {profile.economicScore}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
```

### Example 2: Progressive Feature Rollout

```typescript
import { useFeatureFlags } from '@/hooks/useAdmin';

function FeatureRolloutManager() {
  const { createFlag, createProgressiveRollout, updateFlag } = useFeatureFlags();

  const handleRolloutNew Feature = async () => {
    // Step 1: Create feature flag
    const flag = createFlag(
      'experimental-matchmaking',
      'Experimental Matchmaking',
      'New ranking algorithm',
      { enabled: true, rolloutPercentage: 0 }
    );

    if (!flag) return;

    // Step 2: Create progressive rollout
    const rollout = createProgressiveRollout(
      flag.id,
      [
        { name: 'Phase 1 - 2%', percentage: 2, duration: 86400000 * 1 },
        { name: 'Phase 2 - 10%', percentage: 10, duration: 86400000 * 1 },
        { name: 'Phase 3 - 50%', percentage: 50, duration: 86400000 * 2 },
        { name: 'Phase 4 - 100%', percentage: 100, duration: 86400000 * 3 }
      ]
    );

    // Step 3: Monitor progress
    console.log('Rollout started:', rollout);
  };

  return (
    <button onClick={handleRolloutNewFeature}>
      Start Progressive Rollout
    </button>
  );
}
```

### Example 3: A/B Testing

```typescript
import { useFeatureFlags } from '@/hooks/useAdmin';

function ABTestManager() {
  const { createFlag, createABTest, updateFlag } = useFeatureFlags();

  const handleStartTest = async () => {
    // Create two flag versions
    const controlFlag = createFlag(
      'ui-layout-v1',
      'UI Layout Control',
      'Original layout'
    );

    const treatmentFlag = createFlag(
      'ui-layout-v2',
      'UI Layout Treatment',
      'New layout'
    );

    if (!controlFlag || !treatmentFlag) return;

    // Create A/B test
    const test = createABTest(
      'ui-test-001',
      'UI Layout A/B Test',
      controlFlag.id,
      treatmentFlag.id,
      50 // 50/50 split
    );

    console.log('A/B test started:', test);
  };

  return (
    <button onClick={handleStartTest}>
      Start A/B Test
    </button>
  );
}
```

### Example 4: Investigating Violations

```typescript
import { useInvestigation } from '@/hooks/useAdmin';

function ViolationInvestigator({ playerId }: { playerId: string }) {
  const {
    selectedInvestigation,
    addViolation,
    addNote,
    takeAction
  } = useInvestigation(playerId);

  const handleAddViolation = () => {
    addViolation(playerId, {
      type: 'cheating',
      severity: 'high',
      description: 'Suspicious win rate pattern detected',
      evidence: ['unusual_mouse_movements', 'lag_detection']
    });
  };

  const handleAddNote = () => {
    addNote(playerId, {
      authorId: 'admin-123',
      content: 'Pattern matches known cheat signature',
      tags: ['cheating', 'urgent'],
      created: new Date().toISOString()
    });
  };

  const handleTakeAction = () => {
    takeAction(playerId, {
      type: 'suspend',
      severity: 'heavy',
      duration: 86400000 * 7, // 7 days
      reason: 'Confirmed cheating violation'
    });
  };

  return (
    <div>
      <h2>Investigating: {playerId}</h2>
      
      {selectedInvestigation && (
        <div>
          <p>Risk Score: {selectedInvestigation.riskScore}</p>
          <p>Violations: {selectedInvestigation.violations.length}</p>
        </div>
      )}

      <button onClick={handleAddViolation}>Add Violation</button>
      <button onClick={handleAddNote}>Add Investigation Note</button>
      <button onClick={handleTakeAction}>Take Action</button>
    </div>
  );
}
```

---

## 🚀 Advanced Features

### 1. Custom Anomaly Detection

```typescript
import { economicMonitoringService } from '@/lib/economicMonitoring';

// Register custom anomaly detection
function monitorSpecificPlayer(playerId: string) {
  const profile = economicMonitoringService.getPlayerProfile(playerId);
  
  // Check multiple indicators
  const indicators = {
    rapidAccumulation: profile.totalEarnings > 100000,
    unusualClaims: profile.rewardClaimRate > 0.95,
    frequentTransfers: (profile.transactions || []).length > 1000,
    suspiciousPatterns: profile.suspiciousPatterns.length > 0
  };

  const riskLevel = Object.values(indicators).filter(Boolean).length;
  
  if (riskLevel >= 2) {
    // Flag for admin review
    console.log(`Player ${playerId} flagged (risk level: ${riskLevel})`);
  }
}
```

### 2. Conditional Rule Evaluation

```typescript
import { featureFlagService } from '@/lib/featureFlagSystem';

// Add complex targeting rules
featureFlagService.addRule(
  'premium-feature',
  'user.subscription === "premium" && user.level >= 20 && user.joinDate < Date.now() - 86400000 * 30',
  true,
  1
);

// Add tiered pricing
featureFlagService.addRule(
  'cosmetics-item',
  'user.premiumTier === "gold"',
  true,
  1
);

featureFlagService.addRule(
  'cosmetics-item',
  'user.premiumTier === "silver" && Math.random() < 0.5',
  false, // Only 50% for silver
  2
);
```

### 3. Multi-Stage Rollout Strategies

```typescript
// Canary deployment
const canaryRollout = featureFlagService.createProgressiveRollout(
  'risky-feature',
  [
    { name: 'Canary (0.1%)', percentage: 0.1, duration: 3600000 },  // 1 hour
    { name: 'Early Adopters (1%)', percentage: 1, duration: 3600000 * 24 }, // 1 day
    { name: 'Beta (10%)', percentage: 10, duration: 86400000 * 7 }, // 1 week
    { name: 'General (100%)', percentage: 100, duration: Infinity }
  ]
);

// Region-based rollout
featureFlagService.addRule(
  'region-feature',
  'user.region === "US" && Math.random() < 0.5',
  true,
  1
);

featureFlagService.addRule(
  'region-feature',
  'user.region === "EU" && Math.random() < 0.25',
  true,
  2
);
```

---

## 🔧 Troubleshooting

### Issue: Anomalies Not Detecting

**Problem**: Economic anomalies not being flagged for suspicious players.

**Solutions**:
1. Check transaction amounts against 3x threshold
2. Verify player has >5 transactions in 24h for rapid accumulation
3. Check transaction timestamps for off-hours activity
4. Ensure anomaly severity thresholds are configured correctly

```typescript
// Debug anomaly detection
const profile = economicMonitoringService.getPlayerProfile(playerId);
console.log('Profile:', profile);
console.log('Economic Score:', profile.economicScore);
console.log('Suspicious Patterns:', profile.suspiciousPatterns);
```

### Issue: Feature Flags Not Applying

**Problem**: Feature flags evaluating to wrong value for users.

**Solutions**:
1. Verify user is included in rollout percentage
2. Check rule conditions are valid JavaScript
3. Confirm userId is consistent
4. Review A/B test split percentage

```typescript
// Debug flag evaluation
const config = featureFlagService.evaluateFlag('flag-id', userId, { level: 10 });
console.log('Config:', config);
console.log('Enabled:', config.enabled);
console.log('Reason:', config.reason);
console.log('AB Test Variant:', config.abTestVariant);
```

### Issue: Data Not Persisting

**Problem**: Economic data or feature flags disappearing after reload.

**Solutions**:
1. Check browser localStorage is enabled
2. Verify localStorage quota not exceeded
3. Check browser's privacy/incognito mode
4. Review browser console for storage errors

```typescript
// Check localStorage
console.log(localStorage['economicMonitoring:global']);
console.log(localStorage['featureFlagSystem:global']);
```

### Issue: Performance Degradation

**Problem**: Admin dashboard slow with large datasets.

**Solutions**:
1. Implement data pagination for large lists
2. Use React.memo() for expensive components
3. Implement virtual scrolling for long lists
4. Archive old anomalies/events

```typescript
// Archive old data
economicMonitoringService.exportData(); // Backup first
// Clear old transactions
economicMonitoringService.clearData();

featureFlagService.clearOldData(); // Clears events >7 days old
```

---

## 📋 Deployment Checklist

- [ ] All TypeScript files compile without errors
- [ ] Economic monitoring service initialized
- [ ] Feature flag system initialized
- [ ] Investigation dashboard renders without errors
- [ ] Admin hooks integration tested
- [ ] Admin demo dashboard accessible
- [ ] localStorage persistence verified
- [ ] CSS styling applied correctly
- [ ] Error boundaries implemented
- [ ] Rate limiting configured for API endpoints
- [ ] Audit logging enabled for moderation actions
- [ ] Admin authentication required
- [ ] Backup strategy for economic data
- [ ] Documentation deployed
- [ ] Team trained on admin interface

---

## 📞 Support & Contact

For issues or questions about Phase 6 Admin/Moderation Tools:

1. Check the Troubleshooting section above
2. Review code comments in implementation files
3. Check TypeScript interfaces for method signatures
4. Review example usage code
5. Consult system architecture diagram

---

**Phase 6 Implementation: Complete ✅**
**Total Lines of Code: 2,100+**
**Components Delivered: 5**
**Documentation Pages: Comprehensive**
