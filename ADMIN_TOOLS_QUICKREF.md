# Phase 6 Admin/Moderation Tools - Quick Reference

## 🚀 Quick Start

### Import & Setup

```typescript
// Use the combined hook for all admin features
import { useAdmin } from '@/hooks/useAdmin';

export function AdminPanel() {
  const { investigation, economicMonitoring, featureFlags } = useAdmin();
  
  // Access data directly
  const risks = economicMonitoring.playerProfiles.filter(p => p.economicScore > 70);
}
```

### Economic Monitoring - 5 Minute Setup

```typescript
// 1. Record transaction
economicMonitoringService.recordTransaction(playerId, 'earn', 100, 'match', 'Won match');

// 2. Check anomalies
const anomaly = economicMonitoringService.checkTransactionAnomaly(txId);

// 3. Get player profile
const profile = economicMonitoringService.getPlayerProfile(playerId);
console.log(`Risk Score: ${profile.economicScore}/100`);

// 4. Get metrics
const metrics = economicMonitoringService.calculateRewardMetrics(1); // daily

// 5. Get suspicious players
const suspicious = economicMonitoringService.getSuspiciousPlayers(70);
```

### Feature Flags - 5 Minute Setup

```typescript
// 1. Create flag
featureFlagService.createFlag('new-ui', 'New UI', 'Updated interface');

// 2. Evaluate for user
const config = featureFlagService.evaluateFlag('new-ui', userId);
if (config.enabled) renderNewUI();

// 3. Create progressive rollout
featureFlagService.createProgressiveRollout('new-ui', [
  { name: '5%', percentage: 5, duration: 86400000 },   // 1 day
  { name: '50%', percentage: 50, duration: 86400000 }, // 1 day
  { name: '100%', percentage: 100, duration: Infinity }
]);

// 4. Create A/B test
featureFlagService.createABTest('test-1', 'UI Test', 'ui-v1', 'ui-v2', 50);

// 5. Add targeting rule
featureFlagService.addRule('feature-x', 'user.level >= 10', true);
```

---

## 📊 Key Metrics & Scores

### Economic Risk Scoring (0-100)

| Score | Risk Level | Action |
|-------|-----------|--------|
| 0-25 | Safe | Monitor normally |
| 26-50 | Low Risk | Regular review |
| 51-70 | Medium Risk | Weekly review |
| 71-85 | High Risk | Admin review |
| 86-100 | Critical | Immediate action |

### Anomaly Types

| Type | Trigger | Response |
|------|---------|----------|
| unusual_amount | >3x average | Flag review |
| rare_pattern | Uncommon behavior | Monitor |
| suspicious_timing | Off-hours activity | Track |
| blacklisted_address | Known bad addresses | Ban |

### Suspicious Patterns

- **rapid_accumulation**: >5000 tokens in 24h
- **reward_farming**: Repetitive earning patterns
- **unusual_spending**: Abnormal spending spikes
- **wash_trading**: Buy/sell cycling
- **price_manipulation**: Market manipulation

---

## 🎯 Common Operations

### Monitor Economy Health

```typescript
// Get daily report
const report = economicMonitoringService.generateEconomicReport('daily');
console.log(`Inflation: ${report.metrics.inflationRate}%`);

// Get inflation indicators
const inflation = economicMonitoringService.getInflationIndicators();
inflation.forEach(ind => console.log(`${ind.metric}: ${ind.value}`));

// Get token supply
const supply = economicMonitoringService.getTokenSupply();
console.log(`Circulating: ${supply.circulating}`);
```

### Deploy Feature Safely

```typescript
// 1% canary → 10% beta → 100% production
const stages = [
  { name: 'Canary', percentage: 1, duration: 3600000 },      // 1 hour
  { name: 'Beta', percentage: 10, duration: 86400000 },      // 1 day
  { name: 'Production', percentage: 100, duration: Infinity }
];

featureFlagService.createProgressiveRollout('new-feature', stages);
```

### Run A/B Test

```typescript
// Test two versions
const test = featureFlagService.createABTest(
  'test-id',
  'Test Name',
  'control-flag-id',
  'treatment-flag-id',
  50 // 50/50 split
);

// Check results
const metrics = test.metrics;
console.log(`Control CR: ${metrics.control.conversionRate}%`);
console.log(`Treatment CR: ${metrics.treatment.conversionRate}%`);
```

### Investigate Player

```typescript
// Get investigation
const inv = investigation.investigations.find(i => i.playerId === 'player-123');

// Add violation
investigation.addViolation('player-123', {
  type: 'cheating',
  severity: 'high',
  evidence: ['unusual_win_rate']
});

// Add note
investigation.addNote('player-123', {
  authorId: 'admin-1',
  content: 'Matches pattern with known cheaters',
  tags: ['cheating', 'urgent']
});

// Take action
investigation.takeAction('player-123', {
  type: 'ban',
  duration: Infinity,
  reason: 'Confirmed cheating'
});
```

---

## 🔑 Key Interfaces

### Economic Data

```typescript
interface RewardMetrics {
  dailyRewardIssued: number;
  dailyRewardClaimed: number;
  dailyRewardBurned: number;
  inflationRate: number;      // High = problem
  burnRate: number;
  claimRate: number;          // Alert if >95%
  avgRewardSize: number;
}

interface PlayerEconomicProfile {
  playerId: string;
  totalEarnings: number;
  totalSpending: number;
  rewardClaimRate: number;
  economicScore: number;      // 0-100 risk
  suspiciousPatterns: SuspiciousPattern[];
}
```

### Feature Flags

```typescript
interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  rolloutPercentage: number;  // 0-100
  rolloutType: 'percentage' | 'rule_based' | 'whitelist' | 'blacklist';
}

interface FeatureFlagConfig {
  flagId: string;
  userId: string;
  enabled: boolean;           // Should user see feature?
  reason: string;             // Why (rollout/rule/ab-test)
  abTestVariant: 'control' | 'treatment' | null;
}
```

---

## 💾 Storage

### localStorage Keys

```typescript
// Economic data (persisted)
localStorage['economicMonitoring:global']
  → Map of playerIds to PlayerEconomicProfile

// Feature flags (persisted)
localStorage['featureFlagSystem:global']
  → Map of flag IDs to FeatureFlag + rules + analytics
```

---

## 📈 Monitoring

### Health Checks

```typescript
// Check inflation
const metrics = economicMonitoringService.calculateRewardMetrics(1);
if (metrics.inflationRate > 10) {
  console.warn('High inflation detected');
}

// Check claim rate
const profiles = economicMonitoringService.getAllPlayerProfiles();
const farming = profiles.filter(p => p.rewardClaimRate > 0.95);
if (farming.length > 10) {
  console.warn('High reward farming detected');
}

// Check anomalies
const anomalies = economicMonitoringService.getAnomalies();
console.log(`Flagged anomalies: ${anomalies.filter(a => !a.reviewed).length}`);
```

---

## 🛠️ Debugging

### Enable Verbose Logging

```typescript
// Log all economic transactions
const profile = economicMonitoringService.getPlayerProfile(playerId);
profile.transactions.forEach(tx => {
  console.log(`${tx.type}: ${tx.amount} from ${tx.source}`);
});

// Log flag evaluation
const config = featureFlagService.evaluateFlag(flagId, userId);
console.log('Evaluation reason:', config.reason);
```

### Export Data

```typescript
// Backup economic data
const data = economicMonitoringService.exportData();
localStorage['backup:economic'] = JSON.stringify(data);

// Backup flags
const flags = featureFlagService.exportData();
localStorage['backup:flags'] = JSON.stringify(flags);
```

---

## ⚠️ Common Gotchas

1. **Claim Rate Alert**: Flag if player claims >95% of earned rewards
2. **Inflation Thresholds**: Default >5% inflation = problem
3. **Anomaly Detection**: Must have >5 transactions for pattern detection
4. **Deterministic Rollout**: Same userId gets consistent behavior (hash-based)
5. **Rule Evaluation**: Rules sorted by priority, first true wins
6. **A/B Test Split**: Default 50/50, actual hash % based
7. **localStorage Limits**: ~5-10MB per domain, watch for quota exceeded

---

## 📖 File Locations

```
Bass-Ball/
├── lib/economicMonitoring.ts      # Economic service (30+ methods)
├── lib/featureFlagSystem.ts       # Flag service (25+ methods)
├── admin/investigationDashboard.tsx # Investigation UI (5-tab component)
├── hooks/useAdmin.ts              # React hooks (useInvestigation, useEconomicMonitoring, useFeatureFlags)
├── src/app/admin-demo/
│   ├── page.tsx                   # Admin dashboard demo
│   └── page.module.css            # Dark theme styling
└── ADMIN_TOOLS_GUIDE.md           # Full documentation (this guide)
```

---

## 🎓 Learning Path

1. **Start**: Read overview & architecture
2. **Learn**: Study economic monitoring API
3. **Practice**: Create your first feature flag
4. **Master**: Set up progressive rollout
5. **Advanced**: Build custom anomaly detection

---

**Phase 6 Quick Reference v1.0**
