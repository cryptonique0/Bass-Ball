# ⚽ Tactics Engine

**Formation Management, Pressing Logic, and Line Management System**

The core system that transforms abstract tactical choices into concrete player positioning, pressing intensity, and defensive shape.

---

## Table of Contents

1. [Formation Logic](#formation-logic)
2. [Pressing System](#pressing-system)
3. [Line Management](#line-management)
4. [Stamina Impact](#stamina-impact)
5. [Formation Examples](#formation-examples)
6. [Implementation](#implementation)

---

## Formation Logic

### What is a Formation?

A formation is not just player positions. It's a **spatial blueprint** that defines:

1. **Defensive Shape** - How CBs, FBs, DMs organize against opponent attacks
2. **Midfield Control** - How CMs and AMs transition and compress space
3. **Attacking Width** - How Wingers and FBs stretch the opponent
4. **Pressing Trigger Points** - When and where players aggressively challenge

### Formation Components

```typescript
interface Formation {
  name: string;                    // '4-2-3-1', '5-3-2', etc.
  
  // Spatial zones (relative to goal line)
  defensiveLineYard: number;       // 20-60 (goal line = 0, halfway = 50)
  midfielderDepthVariation: number; // Spread between DM and AM
  attackerYard: number;            // Forward positioning (70-95)
  
  // Compactness & Shape
  compactness: number;             // 0-1 (tight = 0.8, loose = 0.4)
  width: number;                   // 0-1 (narrow = 0.3, wide = 0.8)
  
  // Player allocation by zone
  defense: PlayerAllocation;       // CBs, FBs count
  midfield: PlayerAllocation;      // DMs, CMs count
  attack: PlayerAllocation;        // AMs, Wingers, Strikers count
  
  // Pressing config
  pressingIntensity: number;       // 0-1 (passive = 0.2, aggressive = 1.0)
  pressingTriggerZone: number;     // How far upfield to press (30-70 yard line)
  
  // Transition balance
  transitionSpeed: number;         // How quickly to shift between defense and attack
}
```

### Real-World Formation Examples

**4-2-3-1 (Modern Standard)**
```
Spatial Layout:
┌────────────────────────────────┐
│         Striker (90)           │ Attack Zone: 85-95 yard line
│      AM (75)    AM (75)        │ Midfield: 70-80 spread
│    W  CM(65) CM(65)    W      │ CMs: 60-70 yard line
│    FB DM(45) DM(45)  FB       │ DMs: 40-50 (shield zone)
│       CB    CB                │ Defense: 20-30 yard line
└────────────────────────────────┘

Compactness: 0.65 (moderate gap between lines)
Width: 0.7 (uses sidelines)
Pressing: Medium intensity (0.6)
```

**5-3-2 (Defensive)**
```
Spatial Layout:
┌────────────────────────────────┐
│    ST       ST (positioned)    │ Attack: 85-95 yard line
│      W       W                │ Wingers at 70-75
│       CM    CM    CM          │ CMs: 55-65 (compact)
│    FB DM     DM       FB      │ DMs/FBs: 30-45 (deep)
│      CB   CB   CB             │ CBs: 15-25 (very deep)
└────────────────────────────────┘

Compactness: 0.85 (tight spacing)
Width: 0.5 (narrower)
Pressing: Passive (0.3)
```

**3-5-2 (Possession)**
```
Spatial Layout:
┌────────────────────────────────┐
│     ST       ST (hold-up)      │ Strikers: 82-92
│      AM       AM               │ AMs: 65-75 (creative zone)
│   W   CM   CM   CM    W       │ CMs: 50-65 (control)
│   WB          WB              │ Wing-backs: 40-60 (fluid)
│      CB   CB   CB             │ CBs: 20-30
└────────────────────────────────┘

Compactness: 0.7 (flexible)
Width: 0.9 (maximum width - wing-backs push out)
Pressing: Medium-high (0.65)
```

### Positional Zones

Every player occupies a **zone** with an ideal position + tolerance:

```typescript
interface Zone {
  center: { x: number; y: number };     // Ideal position (0-100 scale)
  tolerance: { x: number; y: number };  // Movement tolerance (±)
  role: PlayerRole;                      // CB, FB, DM, etc.
  marking: 'zonal' | 'man';             // Zone vs man-marking
  
  // Depth relative to formation
  depth: 'defensive' | 'midfield' | 'attacking';
  
  // Defensive responsibility
  responsibility: {
    markZone: Rect;       // Area to defend
    pressTarget?: Role;   // Who to press if nearby
    coverZone?: Rect;     // Secondary coverage area
  };
}
```

---

## Pressing System

### Pressing Triggers

Pressing is not constant. Players intelligently choose **when** to pressure:

```typescript
interface PressingLogic {
  // Aggressive pressing (high press)
  aggressivePress: {
    trigger: 'loss_of_possession',
    delay: 0.1,           // 100ms (very quick)
    intensity: 1.0,       // Full aggression
    targetZone: 60-100,   // Press in opponent's half
  };
  
  // Medium pressing
  mediumPress: {
    trigger: 'player_in_zone',
    delay: 0.3,           // 300ms
    intensity: 0.65,      // Moderate
    targetZone: 40-80,    // Press through midfield
  };
  
  // Passive pressing (low block)
  passivePress: {
    trigger: 'enter_penalty_area',
    delay: 0.8,           // 800ms (very slow)
    intensity: 0.3,       // Light pressure
    targetZone: 0-40,     // Only defend near goal
  };
}
```

### Pressing Decision Tree

**When player loses ball:**

```
Is pressing enabled?
├─ YES: Intensity = 1.0?
│  ├─ YES (Aggressive): Closest player → Immediate press
│  ├─ MID (Medium): Nearest defender → Step up + press
│  └─ LOW (Passive): Stay in shape, don't rush forward
└─ NO: Hold formation, reset

Pressing intensity modifiers:
- Team is losing? Add +0.2 intensity
- Player has yellow card? Subtract -0.1 intensity (cautious)
- Stamina < 30%? Subtract -0.2 intensity (too tired)
```

### Pressing Trigger Points

Players recognize **high-risk situations** that demand pressing:

```typescript
const pressingTriggers = [
  {
    name: 'Ball Recovery High',
    condition: 'opponent loses ball in our attacking third',
    response: 'all nearby players → aggressive press',
    priority: 1,
  },
  {
    name: 'Turnover in Midfield',
    condition: 'possession change in midfield zone',
    response: 'CMs + DMs → immediate press',
    priority: 2,
  },
  {
    name: 'Poor Goalkeeper Pass',
    condition: 'goalkeeper plays loose ball',
    response: 'Striker + AM → attack immediately',
    priority: 1,
  },
  {
    name: 'Vulnerable Fullback',
    condition: 'FB receives ball under pressure',
    response: 'Nearby Winger/AM → apply immediate pressure',
    priority: 2,
  },
  {
    name: 'Backpass to CB',
    condition: 'CB receives backpass (low-intensity possession)',
    response: 'Strikers → step up and press',
    priority: 3,
  },
];
```

---

## Line Management

### Defensive Line Height

The **defensive line** (where CBs position) determines how high up the pitch the team presses:

```typescript
interface DefensiveLineManagement {
  // Line height: yard line from goal (0-100)
  highLine: number;      // 55-65 (aggressive, risk sucker-punch)
  mediumLine: number;    // 40-50 (standard)
  lowLine: number;       // 20-35 (defensive, absorb pressure)
  
  // Line adjustment triggers
  triggers: [
    {
      condition: 'opponent has >60% possession',
      action: 'drop 5 yards (reduce offside trap risk)',
    },
    {
      condition: 'we score (now winning)',
      action: 'drop 10 yards (consolidate)',
    },
    {
      condition: 'opponent has pace advantage',
      action: 'drop 5-10 yards (safety margin)',
    },
    {
      condition: 'we need goal (losing late)',
      action: 'push up 10-15 yards (aggressive)',
    },
  ];
  
  // Dynamic adjustments per second
  lineAdjustmentRate: number;  // How quickly line moves (5-15 yards/sec)
}
```

### Line Width Management

The **width** of the formation (how spread out defenders are):

```typescript
interface LineWidthManagement {
  // Horizontal spacing between fullbacks
  wideFormation: number;    // 0.8-1.0 (use full pitch)
  normalFormation: number;  // 0.6-0.75
  narrowFormation: number;  // 0.3-0.5 (compact, block center)
  
  // Width adjustment logic
  adjustmentTriggers: [
    {
      name: 'Opponent attacking width',
      condition: 'wingers have space on flanks',
      response: 'narrow formation (compress sidelines)',
      widthModifier: -0.2,
    },
    {
      name: 'Central overload threat',
      condition: 'opponent flooding center',
      response: 'widen formation (spread defense)',
      widthModifier: +0.2,
    },
    {
      name: 'Stamina warning',
      condition: 'players fatigued',
      response: 'slightly narrow (reduce coverage)',
      widthModifier: -0.1,
    },
  ];
  
  // Minimum/maximum safety thresholds
  minWidth: number;     // 0.3 (never narrower than 30%)
  maxWidth: number;     // 1.0 (never wider than 100%)
}
```

### Midfield Compactness

How tightly packed the midfield is (defense line to attack line):

```typescript
interface MidfieldCompactness {
  // Gap between defensive and attacking lines
  compactSpacing: {
    veryTight: 8,     // 8 yards (counter-attack risk)
    normal: 12,       // 12 yards (balanced)
    loose: 16,        // 16 yards (pressing space)
  };
  
  // Triggers for adjustment
  compactnessTriggers: [
    {
      condition: 'opponent striker making runs behind',
      response: 'compact midfield (reduce space)',
      compact: true,
    },
    {
      condition: 'we control midfield (possession >65%)',
      response: 'loosen midfield (more creativity)',
      compact: false,
    },
  ];
}
```

---

## Stamina Impact

### How Fatigue Affects Positioning

Stamina doesn't just limit speed—it impacts **tactical decisions**:

```typescript
interface StaminaImpact {
  // Stamina levels: 0-100
  stamina: number;
  
  // Impact on positioning accuracy
  positioningAccuracy() {
    if (stamina > 80) return 1.0;    // Full accuracy
    if (stamina > 60) return 0.95;   // 95% accuracy
    if (stamina > 40) return 0.85;   // 85% accuracy
    if (stamina > 20) return 0.70;   // 70% accuracy
    return 0.50;                      // 50% (barely walking)
  }
  
  // Impact on pressing intensity
  pressingIntensity() {
    if (stamina > 75) return baseIntensity;
    if (stamina > 50) return baseIntensity * 0.9;
    if (stamina > 25) return baseIntensity * 0.7;
    return baseIntensity * 0.4;  // Too tired to press
  }
  
  // Impact on line height (defensive line drops with fatigue)
  defensiveLineDepth() {
    const baseDepth = 50;
    if (stamina > 70) return baseDepth;
    if (stamina > 40) return baseDepth - 5;
    return baseDepth - 10;  // Drop deeper when tired
  }
  
  // Impact on formation width (tighten when fatigued)
  formationWidth() {
    const baseWidth = 0.75;
    if (stamina > 70) return baseWidth;
    if (stamina > 40) return baseWidth - 0.1;
    return baseWidth - 0.2;  // Narrow to cover less ground
  }
  
  // Pressing frequency (less pressing when tired)
  pressingFrequency() {
    if (stamina > 70) return 'aggressive';  // Press every loss
    if (stamina > 40) return 'normal';      // Press selectively
    return 'passive';                        // Don't press
  }
}
```

### Stamina Decay During Match

```typescript
interface StaminaModel {
  // Base decay per second (all players)
  baseDecay: 0.15,  // Lose 0.15% stamina per second (90 min = ~100% loss)
  
  // Activity multipliers
  activityMultiplier: {
    standingStill: 0.1,      // Minimal decay
    walking: 0.25,           // Low activity
    jogging: 0.5,            // Medium
    running: 1.0,            // High
    sprintingFull: 1.5,      // Very high (15% decay per second sprinting)
  },
  
  // Position-specific wear
  positionDrain: {
    CB: 0.9,         // Center backs don't run much
    FB: 1.1,         // Fullbacks run more
    DM: 1.2,         // Defensive mids are always working
    CM: 1.3,         // Central mids cover most ground
    AM: 1.2,         // Attacking mids press
    Winger: 1.4,     // Wingers sprint constantly
    Striker: 1.1,    // Strikers burst energy in short intervals
  },
  
  // Stamina recovery
  recovery: {
    durationSeconds: 60,     // Recovery takes 60 seconds of rest
    recoveryRate: 2.0,       // Recover 2% per second at rest
    partialActivity: 0.8,    // Light jogging recovers 0.8% per second
  },
}
```

### Tactical Adjustments Based on Stamina

```typescript
// Example: Team stamina level drops → Adjust tactics
const adjustTacticsForStamina = (avgTeamStamina: number) => {
  if (avgTeamStamina < 30) {
    // Crisis mode: Drop very deep, don't press, protect goal
    return {
      defensiveLineDepth: 25,
      pressingIntensity: 0.1,
      compactness: 0.9,
      width: 0.5,
    };
  }
  
  if (avgTeamStamina < 50) {
    // Tired: More conservative, less pressing
    return {
      defensiveLineDepth: 40,
      pressingIntensity: 0.4,
      compactness: 0.7,
      width: 0.65,
    };
  }
  
  // Normal levels: Use base tactics
  return baseTactics;
};
```

---

## Formation Examples

### 4-2-3-1: High Press Variant

```
Match Situation: We're winning 1-0, want to close out game
Tactical Preset: High Press + Possession

Spatial Layout:
Y-Position (yard line):
- Striker: 88         (advanced, pressing)
- AMs: 72, 72         (supporting)
- CMs: 62, 62         (box-to-box)
- DMs: 42, 42         (shield)
- FBs: 35, 35         (high up)
- CBs: 25, 25         (covering)

X-Position (width):
- FBs: 5, 95          (full width)
- Wingers: 15, 85     (wide)
- CBs: 20, 80         (comfortable width)
- CMs: 40, 60         (central focus)

Pressing Config:
- Intensity: 0.9 (aggressive)
- Triggers: Press on loss, press in midfield
- Offside trap: Active (use high line)
- Risk: Vulnerable to through balls

Stamina Consideration:
- After 70 minutes: Drop to 0.7 intensity (players tired)
- Defensive line drops 5 yards (safety margin)
```

### 5-3-2: Low Block Variant

```
Match Situation: Down 0-1, defending lead, opponent attacking
Tactical Preset: Low Block + Counter

Spatial Layout:
- Strikers: 85, 85    (waiting for counter)
- Wingers: 70, 70     (transitional)
- CMs: 55, 55, 55     (compact block)
- DMs: 35, 35         (shielding)
- CBs: 20, 20, 20     (very deep)
- FBs: 25, 75         (high fullbacks for counter)

Pressing Config:
- Intensity: 0.2 (minimal pressing)
- Focus: Defend set shape, don't chase ball
- Counter triggers: Break immediately on turnover
- Risk: Allow high possession, require clinical finishing

Stamina Consideration:
- Minimal sprinting required (defense-focused)
- Stamina efficiency: ~20% decay (low pressure)
- Can maintain through 90 minutes
```

---

## Implementation

### TacticsEngine Class

```typescript
class TacticsEngine {
  private formation: Formation;
  private preset: TacticalPreset;
  private team: Team;
  
  // Line management
  private defensiveLineDepth: number = 50;
  private formationWidth: number = 0.75;
  private midfielderCompactness: number = 0.65;
  
  // Stamina tracking
  private playerStamina: Map<string, number> = new Map();
  
  constructor(team: Team, preset: TacticalPreset, formation: Formation) {
    this.team = team;
    this.preset = preset;
    this.formation = formation;
  }
  
  // Update line height based on match situation
  updateDefensiveLineHeight(situation: MatchSituation): void {
    const { possession, score, matchTime } = situation;
    
    // Base height from formation
    let height = this.formation.defensiveLineYard;
    
    // Adjust for possession
    if (possession < 40) height += 5;  // Deep block if no ball
    if (possession > 70) height -= 5;  // Push up if dominating
    
    // Adjust for score
    if (score.us < score.them) height += 8;  // Drop if losing
    if (score.us > score.them) height -= 8;  // Push up if winning
    
    // Adjust for fatigue
    const avgStamina = this.getAverageStamina();
    if (avgStamina < 40) height -= 5;  // Tire = drop deeper
    
    this.defensiveLineDepth = Math.max(20, Math.min(65, height));
  }
  
  // Get pressing intensity based on situation
  getPressingIntensity(situation: MatchSituation): number {
    const baseIntensity = this.preset.pressingIntensity;
    const avgStamina = this.getAverageStamina();
    const staminalFactor = Math.max(0.3, avgStamina / 80);
    
    return baseIntensity * staminalFactor;
  }
  
  // Adjust formation width
  updateFormationWidth(situation: MatchSituation): void {
    let width = this.formation.width;
    
    // Narrow if opponent attacking width
    if (situation.ballZone === 'sidelines') width -= 0.15;
    
    // Widen if opponent flooding center
    if (situation.ballZone === 'center') width += 0.1;
    
    this.formationWidth = Math.max(0.3, Math.min(1.0, width));
  }
  
  // Get ideal position for player accounting for stamina
  getPlayerPosition(player: Player): Vector2 {
    const zone = this.getZoneForRole(player.role);
    const staminaFactor = this.getStaminaFactor(player.id);
    
    // Reduce defensive line depth if tired
    const adjustedLineDepth = this.defensiveLineDepth * staminaFactor;
    
    return {
      x: zone.center.x + (this.formationWidth - 0.75) * 10,
      y: zone.center.y * staminaFactor,
    };
  }
  
  private getAverageStamina(): number {
    let total = 0;
    for (const stamina of this.playerStamina.values()) {
      total += stamina;
    }
    return total / this.playerStamina.size;
  }
  
  private getStaminaFactor(playerId: string): number {
    const stamina = this.playerStamina.get(playerId) ?? 80;
    return Math.max(0.5, stamina / 80);
  }
}
```

---

## Tactical Variety Summary

This system creates **tactical depth**:

✅ **Formation Flexibility**: Change shape mid-match  
✅ **Intelligent Pressing**: Not constant, situation-aware  
✅ **Dynamic Lines**: Defensive line, midfield, width all adaptive  
✅ **Stamina Integration**: Fatigue forces tactical compromise  
✅ **Realistic Positioning**: Matches real football dynamics  

---

**Status**: Design Complete, Implementation Ready  
**Last Updated**: January 18, 2026  
**Complexity**: Core to match realism ⚽
