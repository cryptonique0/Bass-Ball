# Advanced Gameplay System Documentation

Complete guide to implementing dynamic weather, player injuries, live substitutions, and tactical sliders for realistic match simulation.

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Components](#core-components)
3. [Manager Systems](#manager-systems)
4. [React Components](#react-components)
5. [Integration Guide](#integration-guide)
6. [API Reference](#api-reference)
7. [Best Practices](#best-practices)
8. [Real-World Examples](#real-world-examples)

---

## System Overview

The Advanced Gameplay system consists of two core manager systems and corresponding React UI components that work together to create dynamic, realistic match conditions:

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│             Advanced Gameplay System                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Backend Managers (localStorage-based)                │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  • GameplayDynamicsManager                            │ │
│  │    - Weather generation & effects                      │ │
│  │    - Injury tracking & recovery                        │ │
│  │    - Live substitutions management                     │ │
│  │    - Match conditions (pitch, crowd)                   │ │
│  │                                                         │ │
│  │  • TacticalSystem                                      │ │
│  │    - Formation management                              │ │
│  │    - Tactical sliders (8 dimensions)                   │ │
│  │    - Preset saving & loading                           │ │
│  │    - Tactical adjustments tracking                      │ │
│  │    - Analytics & effectiveness                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                    ↓ Integration                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React UI Components                                   │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  • TacticalManager                                     │ │
│  │    - Sliders tab (8 tactical dimensions)               │ │
│  │    - Formation tab (3-5-2, 4-3-3, etc.)               │ │
│  │    - Presets tab (save/load strategies)                │ │
│  │    - Analysis tab (effectiveness tracking)             │ │
│  │                                                         │ │
│  │  • SubstitutionPanel                                   │ │
│  │    - Live substitution interface                        │ │
│  │    - Bench player status                               │ │
│  │    - Substitution history                              │ │
│  │                                                         │ │
│  │  • WeatherDisplay                                      │ │
│  │    - Live weather conditions                           │ │
│  │    - Pitch condition effects                           │ │
│  │    - Injury management                                 │ │
│  │    - Weather-based recommendations                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Key Features

- **Dynamic Weather**: 7 weather types with intensity-based gameplay effects
- **Player Injuries**: Severity-based recovery times with performance degradation
- **Live Substitutions**: Up to 5 subs per match with reason tracking
- **Tactical Sliders**: 8 dimensions for complete tactical control
  - Pressing intensity
  - Tempo of play
  - Width of play
  - Defensive line height
  - Offensive aggression
  - Build-up play style
  - Transition speed
  - Creativity level

---

## Core Components

### 1. Gameplay Dynamics System

**File**: `lib/gameplayDynamicsSystem.ts`

#### Data Structures

```typescript
interface WeatherCondition {
  weatherId: string;
  type: 'clear' | 'rainy' | 'snowy' | 'foggy' | 'windy' | 'stormy' | 'extreme';
  intensity: number; // 0-100
  temperature: number; // Celsius
  windSpeed: number; // km/h
  rainfall: number; // mm/hour
  visibility: number; // 0-100%
  duration: number; // milliseconds
  
  // Effects on gameplay (0-2.0 multipliers)
  effectMultipliers: {
    passAccuracy: number;
    shootingAccuracy: number;
    ballControl: number;
    playerSpeed: number;
    tackleStrength: number;
    staminaDrain: number;
  };
}

interface PlayerInjury {
  injuryId: string;
  playerId: string;
  playerName: string;
  type: 'strain' | 'sprain' | 'fracture' | 'concussion' | 'cut' | 'muscle_tear' | 'ligament';
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  location: string; // 'head', 'left_leg', 'right_leg', etc.
  causedBy?: string; // Offending player ID
  recoveryTime: number; // milliseconds until healed
  status: 'active' | 'recovering' | 'healed';
  gamesDissed: number;
  
  // Performance impact (-0 to -50% per attribute)
  performanceImpact: {
    speed: number;
    acceleration: number;
    stamina: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defense: number;
  };
}

interface PlayerSubstitution {
  substitutionId: string;
  matchId: string;
  playerOut: { playerId: string; playerName: string; position: string };
  playerIn: { playerId: string; playerName: string; position: string };
  time: number; // Game minute
  reason: 'injury' | 'tactics' | 'fatigue' | 'performance';
  teamId: string;
  timestamp: number;
}

interface MatchConditions {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  weather: WeatherCondition;
  injuries: Map<string, PlayerInjury>; // playerId -> injury
  substitutions: PlayerSubstitution[];
  pitchCondition: 'perfect' | 'good' | 'wet' | 'muddy' | 'icy';
  crowd: number; // Attendance percentage (0-100)
  timestamp: number;
}
```

#### Weather Types & Effects

**Clear (Best conditions)**
- Pass accuracy: +5%
- Shooting accuracy: +5%
- Ball control: +5%
- All skills optimal

**Rainy (Difficult)**
- Pass accuracy: -15%
- Shooting accuracy: -20%
- Ball control: -10%
- Stamina drain: +15%

**Snowy (Very difficult)**
- Pass accuracy: -25%
- Shooting accuracy: -30%
- Ball control: -20%
- Player speed: -15%
- Stamina drain: +25%

**Foggy (Visibility issues)**
- Pass accuracy: -12%
- Shooting accuracy: -18%
- Stamina drain: +8%

**Windy (Unpredictable)**
- Pass accuracy: -10%
- Shooting accuracy: -25% (long range)
- Ball control: +2% (unpredictable bounce)

**Stormy (Chaotic)**
- Pass accuracy: -30%
- Shooting accuracy: -40%
- All skills reduced
- Injury risk increased

#### Injury Recovery Times

```typescript
const recoveryTimes = {
  minor: 7 * 24 * 60 * 60 * 1000,      // 7 days
  moderate: 14 * 24 * 60 * 60 * 1000,  // 14 days
  severe: 30 * 24 * 60 * 60 * 1000,    // 30 days
  critical: 90 * 24 * 60 * 60 * 1000,  // 90 days
};

const performanceImpactMultipliers = {
  minor: 0.05,      // 5% impact on stats
  moderate: 0.15,   // 15% impact
  severe: 0.35,     // 35% impact
  critical: 0.5,    // 50% impact
};
```

#### Key Methods

```typescript
// Weather Management
const weather = gameplayMgr.generateWeather('rainy', 75);
const multipliers = weather.effectMultipliers;

// Injury Management
const injury = gameplayMgr.recordInjury(
  'player_1',
  'Cristiano Ronaldo',
  'muscle_tear',
  'severe',
  'left_leg',
  'player_2' // Offending player
);

const impacted = gameplayMgr.getPlayerPerformanceImpact('player_1');
gameplayMgr.healInjury('injury_001');
gameplayMgr.updateInjuryRecovery(); // Call periodically

// Substitution Management
const slot = gameplayMgr.createSubstitutionSlot(
  'match_001',
  'team_001',
  ['player_1', 'player_2', ...],
  [benchPlayer1, benchPlayer2, ...],
  3 // max substitutions
);

const sub = gameplayMgr.performSubstitution(
  'match_001',
  'team_001',
  'player_1', // Out
  'player_5', // In
  'tactics',
  45 // minute
);

const available = gameplayMgr.getAvailableSubstitutes('match_001', 'team_001', 'FW');

// Match Conditions
const conditions = gameplayMgr.initializeMatchConditions(
  'match_001',
  'team_001',
  'team_002',
  weather
);

gameplayMgr.updatePitchCondition('match_001', 'wet');

// Get gameplay multipliers (weather + pitch)
const multipliers = gameplayMgr.getGameplayMultipliers('match_001');
```

#### Storage

```javascript
localStorage['gameplay_dynamics_system'] = {
  matchConditions: Map<matchId, MatchConditions>,
  playerInjuries: Map<injuryId, PlayerInjury>,
  substitutionSlots: Map<slotId, SubstitutionSlot>,
  weatherPatterns: Map<weatherId, WeatherCondition>
}
```

---

### 2. Tactical System

**File**: `lib/tacticalSystem.ts`

#### Data Structures

```typescript
interface TeamFormation {
  formationId: string;
  name: string; // "4-3-3", "4-4-2", "3-5-2", etc.
  type: '433' | '442' | '352' | '532' | '4231' | '3421' | 'custom';
  description: string;
  positions: Map<string, FormationPosition>;
  isDefault: boolean;
  createdAt: number;
}

interface FormationPosition {
  positionName: string; // "Center Back Left"
  shortName: string; // "CB"
  x: number; // Field X (0-100)
  y: number; // Field Y (0-100)
  responsibilities: string[];
  idealPlayerType: string;
}

interface TacticalSliders {
  slidersId: string;
  teamId: string;
  matchId?: string;
  
  pressing: number; // 0-100: Low pressure → High pressure
  tempo: number; // 0-100: Slow build → Fast counter
  width: number; // 0-100: Narrow → Wide
  defensiveLineHeight: number; // 0-100: Deep → High press
  offensiveAggression: number; // 0-100: Passive → Aggressive
  buildUpPlay: number; // 0-100: Long balls → Short passes
  transitionSpeed: number; // 0-100: Slow possession → Fast transitions
  creativity: number; // 0-100: Structured → Creative/risky
  
  timestamp: number;
}

interface TacticalPreset {
  presetId: string;
  name: string;
  description: string;
  sliders: TacticalSliders;
  isDefault: boolean;
  winRate?: number; // Historical effectiveness
  createdAt: number;
}

interface MatchTactics {
  matchId: string;
  homeTeamTactics: {
    formation: TeamFormation;
    sliders: TacticalSliders;
    playerRoles: Map<string, PlayerTacticalRole>;
  };
  awayTeamTactics: {
    formation: TeamFormation;
    sliders: TacticalSliders;
    playerRoles: Map<string, PlayerTacticalRole>;
  };
  timestamp: number;
}

interface TacticalAnalytics {
  matchId: string;
  teamId: string;
  formationEffectiveness: Record<string, number>;
  sliderImpact: Record<string, number>;
  pressureSuccess: number; // Successful press percentage
  possessionLost: number; // Ball loss percentage
  defensiveErrors: number;
  creativeSuccess: number; // Successful creative play %
  adjustments: TacticalAdjustment[];
  timestamp: number;
}
```

#### Tactical Slider Effects

```typescript
// Pressing (0-100)
// - 0: Low pressure, allow possession
// - 50: Balanced pressing
// - 100: High press from kickoff

// Tempo (0-100)
// - 0: Slow, patient build-up
// - 50: Balanced tempo
// - 100: Fast, counter-attack focused

// Width (0-100)
// - 0: Narrow, compact formation
// - 50: Balanced width
// - 100: Wide, expansive play using wings

// Defensive Line Height (0-100)
// - 0: Deep defense, long passes over top
// - 50: Balanced positioning
// - 100: High press, offside trap

// Offensive Aggression (0-100)
// - 0: Passive, counter-attack only
// - 50: Balanced attacking
// - 100: Aggressive, all-out attack

// Build-up Play (0-100)
// - 0: Long balls from defense
// - 50: Mixed approach
// - 100: Short passes, possession-based

// Transition Speed (0-100)
// - 0: Slow, methodical transitions
// - 50: Balanced transition
// - 100: Fast, immediate transitions

// Creativity (0-100)
// - 0: Structured, predictable play
// - 50: Balanced creativity
// - 100: Creative, risky, unpredictable
```

#### Preset Combinations

```typescript
// Defensive Setup
const defensivePreset: TacticalSliders = {
  pressing: 30,
  tempo: 40,
  width: 40,
  defensiveLineHeight: 20,
  offensiveAggression: 30,
  buildUpPlay: 20,
  transitionSpeed: 60,
  creativity: 30,
};

// Attacking Setup
const attackingPreset: TacticalSliders = {
  pressing: 70,
  tempo: 80,
  width: 80,
  defensiveLineHeight: 70,
  offensiveAggression: 90,
  buildUpPlay: 80,
  transitionSpeed: 80,
  creativity: 70,
};

// Possession-Based
const possessionPreset: TacticalSliders = {
  pressing: 60,
  tempo: 50,
  width: 70,
  defensiveLineHeight: 50,
  offensiveAggression: 50,
  buildUpPlay: 90,
  transitionSpeed: 40,
  creativity: 60,
};

// Counter-Attack
const counterAttackPreset: TacticalSliders = {
  pressing: 40,
  tempo: 90,
  width: 80,
  defensiveLineHeight: 30,
  offensiveAggression: 80,
  buildUpPlay: 20,
  transitionSpeed: 100,
  creativity: 50,
};
```

#### Key Methods

```typescript
// Formation Management
const formations = tacticalMgr.getAllFormations();
const formation = tacticalMgr.getFormation('form_433');

const custom = tacticalMgr.createCustomFormation(
  'My Custom Formation',
  'Description',
  positionsMap
);

// Tactical Sliders
const sliders = tacticalMgr.createTacticalSliders(
  'team_001',
  pressing = 50,
  tempo = 50,
  width = 50,
  // ... other sliders
);

tacticalMgr.updateTacticalSliders('sliders_001', {
  pressing: 70,
  tempo: 80,
});

// Presets
const preset = tacticalMgr.createPreset(
  'Aggressive',
  'Full attacking setup',
  sliders
);

const presets = tacticalMgr.getAllPresets();

// Match Tactics
const tactics = tacticalMgr.initializeMatchTactics(
  'match_001',
  'team_001',
  'team_002',
  formation1,
  formation2,
  sliders1,
  sliders2
);

// Player Roles
tacticalMgr.updatePlayerRole('match_001', 'team_001', 'player_1', {
  playerId: 'player_1',
  playerName: 'Ronaldo',
  position: 'ST',
  assignment: 'forward',
  personalPressing: 80,
  advancedPosition: true,
  markedOpponent: 'player_5',
  tacticType: 'aggressive',
});

// Adjustments
const adjustment = tacticalMgr.recordAdjustment(
  'match_001',
  'team_001',
  45,
  'slider_change',
  previousState,
  newState,
  'Opponent too strong, switching to defense'
);

// Analytics
const analytics = tacticalMgr.createAnalytics('match_001', 'team_001');
tacticalMgr.updateAnalytics('analytics_001', {
  pressureSuccess: 65,
  possessionLost: 22,
});
```

#### Storage

```javascript
localStorage['tactical_system'] = {
  formations: Map<formationId, TeamFormation>,
  tacticalSliders: Map<slidersId, TacticalSliders>,
  presets: Map<presetId, TacticalPreset>,
  matchTactics: Map<matchId, MatchTactics>,
  adjustments: Map<adjustmentId, TacticalAdjustment>,
  analytics: Map<analyticsId, TacticalAnalytics>
}
```

---

## React Components

### 1. TacticalManager Component

**File**: `components/TacticalManager.tsx`

#### Features

- **Tactical Sliders Tab**: 8 interactive sliders for all tactical dimensions
- **Formation Tab**: Pre-built formations with pitch visualization
- **Presets Tab**: Save and load tactical presets
- **Analysis Tab**: View tactical effectiveness metrics
- **Real-time Updates**: 5-second polling for live data

#### Sub-Components

```typescript
// Main component
<TacticalManager />

// Tabs
<SlidersTab />          // Slider control
<FormationTab />        // Formation selection
<PresetsTab />          // Preset management
<AnalysisTab />         // Effectiveness tracking

// Sub-components
<SliderCard />          // Individual slider
<FormationCard />       // Formation display
<PresetCard />          // Preset card
<TacticSummaryBox />    // Summary display
<MetricRow />           // Analytics metric
```

#### Usage

```typescript
import { TacticalManager } from '@/components/TacticalManager';

export default function GamePage() {
  return <TacticalManager />;
}
```

#### Key Features

```typescript
// Adjust pressing
setPressing(75); // High press

// Change formation
selectFormation('form_352'); // Switch to 3-5-2

// Load preset
loadPreset('preset_aggressive');

// View analytics
const pressure = analytics.pressureSuccess; // 65%
const creative = analytics.creativeSuccess; // 78%
```

### 2. SubstitutionPanel Component

**File**: `components/SubstitutionPanel.tsx`

#### Features

- **Make Substitution**: Swap players with reason selection
- **Bench Status**: Real-time bench player readiness
- **Substitution History**: Track all subs made during match
- **Availability Tracking**: Monitor injured/suspended players
- **Readiness Indicator**: Visual readiness bars for bench

#### Sub-Components

```typescript
// Main component
<SubstitutionPanel />

// Sub-components
<BenchPlayerCard />         // Individual bench player
<SubstitutionHistoryRow />  // Historical sub entry
```

#### Usage

```typescript
import { SubstitutionPanel } from '@/components/SubstitutionPanel';

export default function MatchPage() {
  return (
    <SubstitutionPanel 
      matchId="match_001"
      teamId="team_001"
      gameMinute={45}
    />
  );
}
```

#### Features

```typescript
// Make substitution
handleSubstitute({
  playerOut: 'player_1',
  playerIn: 'player_5',
  reason: 'injury'
});

// View available subs
const bench = getAvailableSubstitutes('FW');

// Check substitutions used
const used = 2;
const max = 3;
```

### 3. WeatherDisplay Component

**File**: `components/WeatherDisplay.tsx`

#### Features

- **Live Weather**: Current weather with temperature, wind, rainfall
- **Gameplay Impact**: Visual multipliers for all skills
- **Pitch Condition**: Effect of weather on pitch quality
- **Crowd Atmosphere**: Attendance percentage and morale
- **Injury Management**: Active injuries with recovery tracking
- **Weather Tips**: Contextual recommendations based on conditions

#### Sub-Components

```typescript
// Main component
<WeatherDisplay />

// Sub-components
<WeatherDetailBox />        // Weather stat
<ImpactBar />              // Skill impact visualization
<PitchConditionDisplay />  // Pitch condition details
<InjuryCard />             // Individual injury
<WeatherTips />            // Recommendations
```

#### Usage

```typescript
import { WeatherDisplay } from '@/components/WeatherDisplay';

export default function MatchPage() {
  return <WeatherDisplay matchId="match_001" />;
}
```

#### Live Updates

```typescript
// Auto-updates every 5 seconds
- Current weather conditions
- Pitch condition changes
- Active injuries
- Player recovery progress
- Crowd atmosphere
```

---

## Integration Guide

### Setup Instructions

#### 1. Copy Manager Systems

```bash
cp lib/gameplayDynamicsSystem.ts lib/tacticalSystem.ts <your-project>/lib/
```

#### 2. Copy React Components

```bash
cp components/TacticalManager.tsx components/SubstitutionPanel.tsx \
   components/WeatherDisplay.tsx <your-project>/components/
```

#### 3. Import in Match Component

```typescript
import { GameplayDynamicsManager } from '@/lib/gameplayDynamicsSystem';
import { TacticalSystem } from '@/lib/tacticalSystem';
import { TacticalManager } from '@/components/TacticalManager';
import { SubstitutionPanel } from '@/components/SubstitutionPanel';
import { WeatherDisplay } from '@/components/WeatherDisplay';

export default function LiveMatch() {
  const dynamicsMgr = GameplayDynamicsManager.getInstance();
  const tacticalMgr = TacticalSystem.getInstance();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        {/* Match view */}
      </div>
      <div className="space-y-6">
        <WeatherDisplay matchId="match_001" />
        <SubstitutionPanel matchId="match_001" teamId="team_001" gameMinute={45} />
        <TacticalManager />
      </div>
    </div>
  );
}
```

### Pre-Match Setup Flow

```typescript
// 1. Initialize match conditions
const weather = dynamicsMgr.generateWeather('rainy', 60);
const conditions = dynamicsMgr.initializeMatchConditions(
  'match_001',
  'team_001',
  'team_002',
  weather
);

// 2. Create substitution slots
const slot1 = dynamicsMgr.createSubstitutionSlot(
  'match_001',
  'team_001',
  homeXI,
  homeBench,
  3
);
const slot2 = dynamicsMgr.createSubstitutionSlot(
  'match_001',
  'team_002',
  awayXI,
  awayBench,
  3
);

// 3. Initialize tactical setup
const tactics = tacticalMgr.initializeMatchTactics(
  'match_001',
  'team_001',
  'team_002',
  formation1,
  formation2,
  sliders1,
  sliders2
);

// 4. Set up analytics
const analytics1 = tacticalMgr.createAnalytics('match_001', 'team_001');
const analytics2 = tacticalMgr.createAnalytics('match_001', 'team_002');
```

### During Match Flow

```typescript
// Every minute: Update gameplay multipliers
const multipliers = dynamicsMgr.getGameplayMultipliers('match_001');
applyToPlayerStats(multipliers);

// On foul/challenge: Record potential injury
if (foulSevere) {
  const injury = dynamicsMgr.recordInjury(
    injuredPlayerId,
    injuredPlayerName,
    'muscle_tear',
    'severe',
    'left_leg',
    culpritId
  );
}

// Make substitution
const sub = dynamicsMgr.performSubstitution(
  'match_001',
  'team_001',
  playerOutId,
  playerInId,
  'injury',
  currentMinute
);

// Adjust tactics
tacticalMgr.updateTacticalSliders('sliders_001', {
  pressing: 75,
  defensiveLineHeight: 40,
});

const adjustment = tacticalMgr.recordAdjustment(
  'match_001',
  'team_001',
  currentMinute,
  'slider_change',
  previousSliders,
  newSliders,
  'Opponent pushing hard, defensive adjustment'
);
```

---

## API Reference

### GameplayDynamicsManager API

```typescript
class GameplayDynamicsManager {
  // Weather
  generateWeather(type?, intensity?): WeatherCondition
  getCurrentWeather(matchId: string): WeatherCondition | null
  
  // Injuries
  recordInjury(playerId, playerName, type, severity, location, causedBy?): PlayerInjury
  getPlayerInjury(playerId: string): PlayerInjury | null
  healInjury(injuryId: string): void
  updateInjuryRecovery(): void
  getPlayerPerformanceImpact(playerId: string): Record<string, number>
  getAllActiveInjuries(): PlayerInjury[]
  
  // Substitutions
  createSubstitutionSlot(matchId, teamId, startingXI, bench, maxSubs): SubstitutionSlot
  performSubstitution(matchId, teamId, playerOutId, playerInId, reason, minute): PlayerSubstitution
  getSubstitutionSlot(matchId, teamId): SubstitutionSlot | null
  getAvailableSubstitutes(matchId, teamId, position?): BenchPlayer[]
  getSubstitutionHistory(matchId): PlayerSubstitution[]
  
  // Match Conditions
  initializeMatchConditions(matchId, homeTeamId, awayTeamId, weather): MatchConditions
  getMatchConditions(matchId): MatchConditions | null
  updatePitchCondition(matchId, condition): void
  getGameplayMultipliers(matchId): Record<string, number>
}
```

### TacticalSystem API

```typescript
class TacticalSystem {
  // Formations
  createCustomFormation(name, description, positions): TeamFormation
  getFormation(formationId: string): TeamFormation | null
  getAllFormations(): TeamFormation[]
  
  // Sliders
  createTacticalSliders(teamId, ...sliderValues): TacticalSliders
  updateTacticalSliders(slidersId, updates): TacticalSliders | null
  getTacticalSliders(slidersId): TacticalSliders | null
  
  // Presets
  createPreset(name, description, sliders): TacticalPreset
  getPreset(presetId): TacticalPreset | null
  getAllPresets(): TacticalPreset[]
  
  // Match Tactics
  initializeMatchTactics(matchId, homeId, awayId, formations, sliders?): MatchTactics
  getMatchTactics(matchId): MatchTactics | null
  updatePlayerRole(matchId, teamId, playerId, role): void
  
  // Adjustments & Analytics
  recordAdjustment(matchId, teamId, minute, type, prevState, newState, reason): TacticalAdjustment
  getAdjustments(matchId): TacticalAdjustment[]
  createAnalytics(matchId, teamId): TacticalAnalytics
  updateAnalytics(analyticsId, updates): void
  getAnalytics(matchId, teamId): TacticalAnalytics | null
}
```

---

## Best Practices

### 1. Weather Impact Management

```typescript
// Apply weather multipliers to player stats
function applyWeatherEffects(player: Player, multipliers: Record<string, number>) {
  player.passing *= multipliers.passAccuracy;
  player.shooting *= multipliers.shootingAccuracy;
  player.ballControl *= multipliers.ballControl;
  player.speed *= multipliers.playerSpeed;
  player.stamina *= multipliers.staminaDrain;
}
```

### 2. Injury Impact Calculation

```typescript
// Reduce player attributes by injury impact
function applyInjuryImpact(player: Player, injury: PlayerInjury) {
  const impact = injury.performanceImpact;
  
  player.speed *= (1 + impact.speed / 100);
  player.stamina *= (1 + impact.stamina / 100);
  player.shooting *= (1 + impact.shooting / 100);
  player.defense *= (1 + impact.defense / 100);
  
  return player;
}
```

### 3. Substitution Validation

```typescript
// Validate substitution before executing
function canPerformSubstitution(
  slot: SubstitutionSlot,
  playerIn: BenchPlayer,
  playerOutPosition: string
): boolean {
  if (slot.usedSubstitutions >= slot.maxSubstitutions) return false;
  if (playerIn.availability !== 'available') return false;
  
  const compatible = slot.preferredPositions.get(playerOutPosition) || [];
  return compatible.includes(playerIn.position);
}
```

### 4. Tactical Effectiveness Tracking

```typescript
// Track effectiveness of tactical adjustments
function trackAdjustmentEffectiveness(
  adjustment: TacticalAdjustment,
  matchEvents: MatchEvent[]
): void {
  const afterAdjustment = matchEvents.filter(e => e.minute > adjustment.gameMinute);
  
  const successRate = afterAdjustment.filter(e => e.team === adjustment.teamId).length /
                      afterAdjustment.length;
  
  adjustment.effectiveness = (successRate - 0.5) * 200; // -100 to +100
}
```

### 5. Crowd Impact

```typescript
// Increase player morale based on crowd
function applyCrowdBoost(player: Player, crowd: number) {
  if (crowd > 80) {
    player.mentalStrength *= 1.1;
    player.aggression *= 1.05;
  } else if (crowd < 30) {
    player.mentalStrength *= 0.95;
    player.motivation *= 0.9;
  }
}
```

---

## Real-World Examples

### Example 1: Match Initialization

```typescript
// Set up a rainy match with substitutions and tactics
const dynamicsMgr = GameplayDynamicsManager.getInstance();
const tacticalMgr = TacticalSystem.getInstance();

// 1. Generate weather
const weather = dynamicsMgr.generateWeather('rainy', 70);
// Effects: Pass -15%, Shoot -20%, Speed -5%, Stamina +15%

// 2. Initialize match conditions
const conditions = dynamicsMgr.initializeMatchConditions(
  'champions_league_final',
  'real_madrid',
  'manchester_city',
  weather
);

// 3. Create substitution slots
const realSlot = dynamicsMgr.createSubstitutionSlot(
  'champions_league_final',
  'real_madrid',
  ['ronaldo', 'modric', ...],
  [
    { playerId: 'benz', playerName: 'Benzema', position: 'ST', readiness: 95 },
    { playerId: 'nacho', playerName: 'Nacho', position: 'CB', readiness: 85 },
  ],
  3
);

// 4. Set up tactics
const realFormation = tacticalMgr.getFormation('form_433');
const cityFormation = tacticalMgr.getFormation('form_442');

const matchTactics = tacticalMgr.initializeMatchTactics(
  'champions_league_final',
  'real_madrid',
  'manchester_city',
  realFormation,
  cityFormation,
  // Real Madrid: Defensive due to rain
  { pressing: 50, tempo: 50, width: 60, defensiveLineHeight: 40, ... },
  // Manchester City: Possession-based
  { pressing: 60, tempo: 70, width: 70, defensiveLineHeight: 50, ... }
);
```

### Example 2: Mid-Match Injury & Substitution

```typescript
// Minute 30: Modric gets injured after a foul
const injury = dynamicsMgr.recordInjury(
  'modric',
  'Luka Modrić',
  'muscle_tear',
  'severe',
  'right_leg',
  'fernandinho' // Offending player
);

// Modric's stats reduced by 35%
const impact = dynamicsMgr.getPlayerPerformanceImpact('modric');
// { speed: -28, stamina: -32, passing: -35, dribbling: -30 }

// Minute 32: Bring on Kroos as replacement
const sub = dynamicsMgr.performSubstitution(
  'champions_league_final',
  'real_madrid',
  'modric',
  'kroos',
  'player_name_kroos',
  'injury',
  32
);

// Kroos brings fresh legs at 98% readiness
```

### Example 3: Tactical Adjustment at Half-Time

```typescript
// Minute 45: Real Madrid needs to adjust to rain and pressure
const currentTactics = tacticalMgr.getMatchTactics('champions_league_final');
const homeSliders = currentTactics.homeTeamTactics.sliders;

// Increase defensive line height, reduce tempo
const adjustment = tacticalMgr.recordAdjustment(
  'champions_league_final',
  'real_madrid',
  45,
  'slider_change',
  { defensiveLineHeight: 40, tempo: 50 },
  { defensiveLineHeight: 30, tempo: 40 },
  'Rain making passing difficult, retreat and control tempo'
);

tacticalMgr.updateTacticalSliders(homeSliders.slidersId, {
  defensiveLineHeight: 30,
  tempo: 40,
  pressing: 45,
});

// Track effectiveness
// In minutes 46-60, Real Madrid gains 62% possession, records 2 shots on target
adjustment.effectiveness = 45; // Positive adjustment
```

### Example 4: Weather Impact Adaptation

```typescript
// Minute 15: Wind increases, visibility drops to 60%
const weather = dynamicsMgr.getCurrentWeather('champions_league_final');

if (weather.intensity > 75) {
  // Weather getting worse - adjust play style
  const analytics = tacticalMgr.getAnalytics('champions_league_final', 'real_madrid');
  
  // High creativity failing (30% success) due to weather
  if (analytics.creativeSuccess < 40) {
    tacticalMgr.updateTacticalSliders(homeSliders.slidersId, {
      creativity: 30,    // Reduce risky play
      buildUpPlay: 90,   // Increase short passes
      tempo: 35,         // Slow down play
    });
  }
}

// Multipliers applied to all player actions:
// Pass accuracy: 0.85 (weather) × 0.90 (wet pitch) = 0.765
// Shooting accuracy: 0.75 (weather) × 0.88 (pitch) = 0.660
```

---

## Advanced Scenarios

### Scenario 1: Snow Storm in Winter Tournament

```typescript
const weather = dynamicsMgr.generateWeather('snowy', 95);

// Extreme conditions:
// - Visibility: 35%
// - Pass accuracy: -25%
// - Shot accuracy: -30%
// - Player speed: -15%
// - Stamina drain: +25%

// Recommended tactics:
// - Low possession (short passes only)
// - Defensive setup (high defensive line to prevent long balls over top)
// - Fast transitions when possible (capitalize on opponent mistakes)

const snowTactics = {
  pressing: 70,           // High press to force errors
  tempo: 35,             // Slow, methodical
  width: 40,             // Compact, centered play
  defensiveLineHeight: 75, // High to prevent long passes
  offensiveAggression: 30,
  buildUpPlay: 95,       // Only short passes
  transitionSpeed: 90,   // Exploit turnover mistakes
  creativity: 20,        // Safe, no risky plays
};
```

### Scenario 2: Multiple Injuries Cascade

```typescript
// Minute 20: CB gets head injury (concussion)
const concussion = dynamicsMgr.recordInjury(
  'ramos',
  'Sergio Ramos',
  'concussion',
  'moderate',
  'head'
);

// Minute 28: RM gets tackled (muscle tear)
const tear = dynamicsMgr.recordInjury(
  'carvajal',
  'Dani Carvajal',
  'muscle_tear',
  'severe',
  'right_leg',
  'foden'
);

// Minute 35: Need to make defensive substitutions
const sub1 = dynamicsMgr.performSubstitution(
  'match_001',
  'real_madrid',
  'ramos',
  'nacho',
  'injury',
  28
);

const sub2 = dynamicsMgr.performSubstitution(
  'match_001',
  'real_madrid',
  'carvajal',
  'odriozola',
  'injury',
  35
);

// Defense now compromised, adjust formation
tacticalMgr.updateTacticalSliders(sliders.slidersId, {
  defensiveLineHeight: 20,  // Drop deep
  pressing: 30,             // Allow possession
  width: 40,                // Compact defense
});
```

---

## Performance Considerations

### Optimization Tips

1. **Update Intervals**: Adjust polling frequencies based on network quality
2. **Lazy Loading**: Load analytics only when tab is viewed
3. **Caching**: Store frequently accessed formations/presets
4. **Batch Updates**: Update multiple sliders in single call
5. **Debouncing**: Debounce slider changes (100-200ms)

```typescript
// Optimize slider updates
const debouncedUpdate = debounce((sliders) => {
  tacticalMgr.updateTacticalSliders(sliderId, sliders);
}, 200);

// Update on slider move
onSliderChange((value) => {
  setLocalValue(value); // Immediate UI feedback
  debouncedUpdate(updatedSliders); // Batch save
});
```

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Gameplay Systems Team
