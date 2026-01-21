# Advanced Analytics System - Architecture Overview

## 📊 Complete System Map

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components Layer                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  src/app/analytics-demo/page.tsx (500+ lines)       │  │
│  │  - 4-Tab Dashboard Interface                        │  │
│  │  - Heatmaps | Behavior | Predictions | Meta-Game   │  │
│  └──────────────────────────────────────────────────────┘  │
│                              ▲                               │
│                              │                               │
├─────────────────────────────────────────────────────────────┤
│                    React Hooks Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  src/hooks/useAnalytics.ts (244 lines)              │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ useHeatmaps                                 │   │  │
│  │  │ useBehaviorAnalytics                        │   │  │
│  │  │ usePredictions                              │   │  │
│  │  │ useMetaAnalytics                            │   │  │
│  │  │ useAdvancedAnalytics (combined)             │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│            ▲                            ▲                    │
│            │                            │                    │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                             │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │ services/                │  │ lib/                     │ │
│  │ analytics-advanced.ts    │  │ metaAnalytics.ts        │ │
│  │ (600+ lines)             │  │ (500+ lines)            │ │
│  ├──────────────────────────┤  ├──────────────────────────┤ │
│  │ ✓ Heatmap System         │  │ ✓ Formation Tracking     │ │
│  │ ✓ Behavior Tracking      │  │ ✓ Strategy System        │ │
│  │ ✓ Pattern Detection      │  │ ✓ Trend Analysis         │ │
│  │ ✓ Prediction Models      │  │ ✓ Counter Strategies     │ │
│  │ ✓ 25+ Methods            │  │ ✓ 20+ Methods           │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
│            ▲                            ▲                    │
│            └────────────────┬───────────┘                    │
│                             │                                │
├─────────────────────────────────────────────────────────────┤
│                   Data Persistence Layer                     │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │ localStorage             │  │ localStorage             │ │
│  │ advancedAnalytics:global │  │ metaAnalytics:global     │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ Module Breakdown

### 1. services/analytics-advanced.ts (600+ lines)

**Responsibility**: Individual player and match-level analytics

**Core Classes**:
```
AdvancedAnalyticsService
├── Heatmap Management
│   ├── createHeatmap()
│   ├── addHeatmapPoint()
│   ├── getHeatmapGrid()
│   └── deleteHeatmap()
├── Behavior Tracking
│   ├── recordBehavior()
│   ├── getPlayerBehaviorHistory()
│   ├── getAverageBehavior()
│   └── analyzePatterns()
├── Prediction Models
│   ├── createModel()
│   ├── makePrediction()
│   ├── verifyPrediction()
│   └── getModelAccuracy()
└── Data Management
    ├── exportAnalytics()
    └── clearAnalytics()
```

**Data Structures**:
- `Heatmap` - Spatial point collection with gaussian intensity
- `HeatmapPoint` - Individual event with coordinates and intensity
- `BehaviorMetrics` - 10-dimensional performance vector
- `BehaviorPattern` - Detected play style with confidence
- `PredictionModel` - ML model with accuracy tracking
- `Prediction` - Individual forecast with calibration

**Storage Key**: `localStorage['advancedAnalytics:global']`

### 2. lib/metaAnalytics.ts (500+ lines)

**Responsibility**: Comparative and strategic analytics

**Core Classes**:
```
MetaAnalyticsService
├── Formation Management
│   ├── getFormation()
│   ├── recordFormationMatch()
│   └── getTopFormations()
├── Strategy System
│   ├── createStrategy()
│   ├── updateStrategyWinRate()
│   ├── addCounterStrategy()
│   └── getBestCounter()
├── Trend Analysis
│   ├── recordTrend()
│   ├── getRisingTrends()
│   ├── getFallingTrends()
│   └── getTrends()
└── Advanced Analysis
    ├── analyzeFormationMismatch()
    └── getMismatch()
```

**Data Structures**:
- `Formation` - 5 pre-configured tactical setups
- `FormationStats` - Match history and performance
- `Strategy` - Formation + tactics combination
- `CounterStrategy` - Effectiveness against other strategies
- `MetaTrend` - Formation popularity momentum
- `PlayerRole` - Tactical position specialization

**Storage Key**: `localStorage['metaAnalytics:global']`

### 3. src/hooks/useAnalytics.ts (244 lines)

**Responsibility**: React integration and state management

**Hooks Exported**:
```
useHeatmaps(playerId, matchId)
├── State: heatmaps[], selectedHeatmap
└── Methods: 6 CRUD operations

useBehaviorAnalytics(playerId)
├── State: behaviors[], patterns[]
└── Methods: 5 analysis operations

usePredictions()
├── State: models[], predictions[]
└── Methods: 5 prediction operations

useMetaAnalytics()
├── State: formations[], strategies[], trends[]
└── Methods: 10 strategic operations

useAdvancedAnalytics(playerId, matchId)
└── Combined access to all above
```

**Integration Pattern**:
- useCallback for memoized methods
- useState for local state
- useEffect for initialization
- localStorage synchronization

### 4. src/app/analytics-demo/page.tsx (500+ lines)

**Responsibility**: UI demonstration and feature showcase

**Tab Structure**:
```
Analytics Dashboard
├── Heatmaps Tab
│   ├── Heatmap creation interface
│   ├── Grid visualization (10x10 / 20x20)
│   ├── Point intensity display
│   └── Heatmap management list
├── Behavior Analytics Tab
│   ├── Metric recording form
│   ├── Performance stat bars
│   ├── Average metrics display
│   └── Pattern detection results
├── Predictions Tab
│   ├── Model creation interface
│   ├── Prediction generation
│   ├── Confidence visualization
│   └── Accuracy metrics
└── Meta-Game Tab
    ├── Formation win rates
    ├── Strategy tracking
    ├── Trend momentum display
    └── Formation advantage matrix
```

**Component Features**:
- Interactive controls for all analytics operations
- Real-time data binding with hooks
- Visual representations (grids, bars, charts)
- Responsive card-based layout
- Dark theme with cyan accents

### 5. src/app/analytics-demo/analytics-demo.module.css (400+ lines)

**Responsibility**: Visual styling and responsive design

**Style Categories**:
```
analytics-demo.module.css
├── Layout Styles
│   ├── .container (min-height: 100vh)
│   ├── .section (max-width: 1400px)
│   └── .grid (responsive grid)
├── Component Styles
│   ├── .card (blue gradient borders)
│   ├── .button (cyan accents)
│   ├── .tab (active state)
│   └── .header (gradient background)
├── Visualization Styles
│   ├── .heatmapGrid (intensity colors)
│   ├── .statBar (gradient fills)
│   └── .confidenceBar (precision indicator)
└── Responsive Breakpoints
    ├── Desktop (default)
    ├── Tablet (@media 768px)
    └── Mobile (@media 480px)
```

**Color Scheme** (Phase 7 Compliant):
- Primary Cyan: #00d9ff
- Dark Background: #0f0f23, #1a1a3e
- Text: #e0e0e0
- Accent: #8338ec (available for extended)

## 🔄 Data Flow Examples

### Heatmap Creation Flow
```
User Action
  ↓
useHeatmaps.createHeatmap('pass', 20)
  ↓
advancedAnalyticsService.createHeatmap()
  ↓
Creates Heatmap object with unique ID
  ↓
Stores in localStorage['advancedAnalytics:global']
  ↓
Returns ID to hook
  ↓
Hook updates state, component re-renders
```

### Behavior Pattern Detection Flow
```
recordBehavior({metrics})
  ↓
advancedAnalyticsService.recordBehavior()
  ↓
Stores metrics snapshot with timestamp
  ↓
Triggers automatic analyzePatterns()
  ↓
Checks 5-record average against pattern conditions
  ↓
Generates BehaviorPattern with confidence
  ↓
Stores pattern and returns to component
  ↓
Component displays detected patterns
```

### Prediction Flow
```
makePrediction(modelId, inputData)
  ↓
advancedAnalyticsService.makePrediction()
  ↓
Retrieves training data and model config
  ↓
Generates forecast with confidence score
  ↓
Creates Prediction object with reasoning
  ↓
Stores prediction (expires in 7 days)
  ↓
Returns to component for display
  ↓
Later: verifyPrediction() updates calibration
```

### Formation Trend Flow
```
recordFormationMatch('4-3-3', 'win', stats)
  ↓
metaAnalyticsService.recordFormationMatch()
  ↓
Updates FormationStats (match count, wins)
  ↓
Triggers automatic trend recording
  ↓
Calculates win rate and momentum
  ↓
Generates MetaTrend (rising/falling/stable)
  ↓
Stores in localStorage['metaAnalytics:global']
  ↓
useMetaAnalytics component hook updates
```

## 🔌 Integration Points

### With Game Engine
```typescript
// When match completes
const matchResult = { formation: '4-3-3', won: true };
await analytics.meta.recordFormationMatch(
  matchResult.formation,
  matchResult.won ? 'win' : 'loss',
  { possession: 52.1, shots: 14, accuracy: 64.3 }
);
```

### With Player Stats
```typescript
// Record player performance after match
await analytics.behavior.recordBehavior({
  passAccuracy: playerStats.passAccuracy,
  shotAccuracy: playerStats.shotAccuracy,
  dribbleSuccessRate: playerStats.dribbleSuccessRate,
  // ... other metrics from game stats
});
```

### With UI Components
```typescript
// In any React component
const analytics = useAdvancedAnalytics(playerId, matchId);

// Access all systems through single hook
<HeatmapDisplay grid={analytics.heatmaps.selectedHeatmap} />
<BehaviorStats metrics={analytics.behavior.currentBehavior} />
<Predictions predictions={analytics.predictions.predictions} />
```

## 📈 Scalability Considerations

### Current Limits
- Heatmap Points: Tested with 500+ points per heatmap
- Behavior Records: 7-day retention, ~10 records per player per day
- Predictions: Auto-cleanup at 7 days
- Formations: 5 pre-configured, unlimited custom

### Storage Constraints
- localStorage Quota: ~5-10MB per domain (browser dependent)
- Current Usage: ~100-200KB for active player
- Scale to ~100 players: ~10-20MB (warning level)

### Performance Optimization
- Heatmap Grid: O(n) calculation (n = grid size × point count)
- Pattern Detection: O(1) with 5-record rolling window
- Trend Calculation: O(1) with momentum formula
- Query Operations: O(1) with Map structure

## 🛠️ Development Patterns

### Service Singleton Pattern
```typescript
// services/analytics-advanced.ts
const advancedAnalyticsService = new AdvancedAnalyticsService();
export { advancedAnalyticsService };

// Usage
import { advancedAnalyticsService } from '@/services/analytics-advanced';
```

### React Hook Pattern
```typescript
// Encapsulates service logic
export function useHeatmaps(playerId: string, matchId: string) {
  const [heatmaps, setHeatmaps] = useState<Heatmap[]>([]);
  
  const createHeatmap = useCallback(async (type, gridSize) => {
    const id = advancedAnalyticsService.createHeatmap(...);
    setHeatmaps(prev => [...prev, ...]);
    return id;
  }, []);
  
  return { heatmaps, createHeatmap, ... };
}
```

### localStorage Persistence Pattern
```typescript
// Service manages serialization
const data = {
  heatmaps: new Map([...]),
  behaviors: [...],
  models: [...]
};

localStorage.setItem('advancedAnalytics:global', JSON.stringify({
  heatmaps: Array.from(data.heatmaps.entries()),
  behaviors: data.behaviors,
  models: data.models
}));
```

## 📊 Analytics Coverage Matrix

| Feature | Heatmap | Behavior | Prediction | Meta |
|---------|---------|----------|-----------|------|
| Player Level | ✓ | ✓ | ✓ | - |
| Team Level | ✓ | - | - | ✓ |
| Match Level | ✓ | ✓ | ✓ | ✓ |
| Historical | - | ✓ | ✓ | ✓ |
| Real-time | ✓ | ✓ | - | - |
| Comparative | - | - | ✓ | ✓ |

## 🎯 Future Expansion Opportunities

1. **Real-time Streaming Integration**
   - Wire prediction models to live match updates
   - Stream heatmap data as events occur

2. **Advanced Visualizations**
   - 3D heatmap rendering
   - Player network graphs
   - Possession sequence diagrams

3. **Machine Learning Enhancement**
   - Neural network models
   - Time-series forecasting
   - Anomaly detection

4. **Export & Integration**
   - CSV/JSON export functionality
   - Third-party analytics platform integration
   - Statistical significance testing

5. **Mobile Optimization**
   - Touch-friendly interface
   - Responsive grid visualization
   - Offline data caching

---

**Architecture Version**: 1.0  
**Status**: Production Ready  
**Last Updated**: 2024
