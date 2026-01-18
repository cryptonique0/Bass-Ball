# ⚽ In-Match Controls System

## 📋 Summary

Complete in-match control system for Bass Ball with four core actions: **Pass**, **Shoot**, **Tackle**, and **Sprint**. Players can now execute tactical decisions during matches with full visual feedback and stamina management.

---

## 🎮 Control System Overview

### Four Core Actions

| Action | Input | Stamina | Range | Success Factor |
|--------|-------|---------|-------|-----------------|
| **Pass** 🎯 | Click target on pitch | None | Full pitch | Passing stat × Distance |
| **Shoot** ⚽ | Adjust power slider (1-20) | None | 300px of goal | Shooting stat × Distance × Power |
| **Tackle** 🛡️ | Click button (near ball) | Consumes 5% | 150px radius | Defense stat vs Dribbling |
| **Sprint** ⚡ | Click button | Costs 15% | N/A | Boosts Pace +20 for 5s |

---

## 🏗️ Architecture

### 1. **MatchControls Component** (`components/MatchControls.tsx`)
Interactive control panel with four action buttons:

**Features:**
- Player selection display with current stats
- Color-coded action buttons (Yellow/Blue/Red/Cyan)
- Context-aware availability (e.g., shoot disabled if too far)
- Power slider for shoot strength
- Visual pass target selector with mini pitch
- Control tips and help text
- Real-time stamina tracking

**States:**
- No player selected: Shows prompt to select
- Player selected: Shows all available controls
- Action dialog: Shows detailed control interface

### 2. **Match Engine Methods** (`lib/matchEngine.ts`)
Three new public methods:

**`activateSprint(playerId: string)`**
- Costs 15% stamina
- Boosts pace by 20 points for 5 seconds
- Cannot sprint with <15% stamina
- Records event in match log

**`playerTackle(playerIdAttempting: string, playerIdTackling?: string)`**
- Range: 150px from ball carrier
- Success: defender.defense/100 × (1 - attacker.dribbling/200)
- If fails: 30% chance to commit foul
- Records tackle/foul event
- Updates tackle statistics

### 3. **React Hooks** (`hooks/useMatchEngine.ts`)
Two new callback hooks:

**`sprint(playerId: string)`**
- Calls `activateSprint()` on match engine
- Updates UI immediately
- Works with both PvP and AI modes

**`tackle(playerId: string)`**
- Calls `playerTackle()` on match engine
- Instant resolution
- Works with both PvP and AI modes

### 4. **LiveMatch Integration** (`components/LiveMatch.tsx`)
Connects all systems:

- Receives sprint/tackle from hooks
- Passes methods to MatchControls
- Manages player selection state
- Updates UI based on match state
- Handles pass target selection

---

## 🎯 Control Details

### SHOOT ⚽

**Activation:** Click button (only enabled if near goal)

**Requirements:**
- Must be within 300px of opponent goal line
- Any stamina level

**Power Slider:**
- Range: 1-20
- Weak: 1-5 (shorter distance, higher accuracy)
- Medium: 6-15 (balanced)
- Powerful: 16-20 (longer distance, riskier)

**Success Calculation:**
```
shotSuccess = (player.shooting / 100) × distanceFactor × (1 - power/20 randomness)
goalSuccess = shotSuccess × 0.8 + random × 0.2
Goal scored if: goalSuccess > 0.55
```

**Stamina:** No cost (always available)

---

### PASS 🎯

**Activation:** Click button, then click target area on pitch

**Pass Selection:**
- Mini pitch visualization
- Shows current player position (gold circle)
- Click anywhere to set pass target
- Visual feedback for distance

**Success Calculation:**
```
passSuccess = (player.passing / 100) × max(0, 1 - distance/500)
Successful if: random < passSuccess
```

**Stamina:** No cost (always available)

**Range:** Full pitch (0-1050 horizontal, 0-680 vertical)

---

### TACKLE 🛡️

**Activation:** Click button (available anywhere on pitch)

**Range:** 150px from ball carrier

**Success Calculation:**
```
defenseSuccess = (defender.defense / 100) × (1 - attacker.dribbling / 200)
```

**Outcomes:**
- **Success (60%):** Possession changes to defender
- **Defended (10%):** Ball carrier keeps possession
- **Foul (30%):** Tackle fails, possible yellow/red card

**Fouls Trigger:**
- 15% chance: Yellow card
- 3% chance: Red card  
- Second yellow = automatic red

**Stamina:** No cost (always available)

---

### SPRINT ⚡

**Activation:** Click button (disabled if <15% stamina)

**Mechanics:**
- **Cost:** 15% stamina per sprint
- **Boost:** +20 pace for 5 seconds
- **Duration:** 5 seconds
- **Cooldown:** Immediate (can spam if stamina available)

**Stamina Check:**
```
canSprint = selectedPlayer.stamina > 15
```

**Effect:**
```
originalPace = player.pace
player.pace = min(99, originalPace + 20)
// After 5 seconds
player.pace = originalPace
```

**Stamina:** Costs 15% per activation

---

## 💻 Code Example

### Using Controls in a Match

```tsx
// In LiveMatch component
<MatchControls
  selectedPlayer={gameState.selectedPlayer}
  isPaused={isPaused}
  onShoot={(strength) => {
    shoot(strength); // Send ball toward goal
  }}
  onPass={(x, y) => {
    pass(x, y); // Pass to coordinates
  }}
  onTackle={(playerId) => {
    tackle(playerId); // Attempt to win ball
  }}
  onSprint={() => {
    sprint(selectedPlayerId); // Boost pace
  }}
  canSprint={gameState.selectedPlayer?.stamina > 15}
  ballX={gameState.ballX}
  ballY={gameState.ballY}
  team={playerTeam}
/>
```

### Direct Engine Usage

```typescript
// Direct call to match engine
matchEngine.activateSprint(playerId);
matchEngine.playerTackle(tacklerId);
matchEngine.manualShoot(shootStrength); // Existing
matchEngine.manualPass(targetX, targetY); // Existing
```

---

## 🎨 UI Components

### Control Panel Layout

```
┌──────────────────────────────┐
│ Selected Player: Player Name │
│ Position: DEF • Stamina: 85% │
│                              │
│ Pace: 75 | Shoot: 40 | Pass: 70 │
└──────────────────────────────┘

┌──────────────────────────────┐
│  ⚽ SHOOT  │  🎯 PASS       │
│  Power    │  Target        │
├──────────────────────────────┤
│  🛡️ TACKLE │  ⚡ SPRINT      │
│  Defend   │  Speed +20     │
└──────────────────────────────┘

[SHOOT Power Dialog]
  Range: 1 — 10 — 20
  [Cancel] [🎯 Shoot!]

[PASS Target Dialog]
  [Mini Pitch with clickable areas]
  [Cancel]
```

### Color Scheme

- **Shoot:** Yellow (⚽ #EAB308)
- **Pass:** Blue (🎯 #3B82F6)
- **Tackle:** Red (🛡️ #EF4444)
- **Sprint:** Cyan (⚡ #06B6D4)
- **Disabled:** Gray (🚫 #4B5563)

---

## ⚙️ Event Recording

All actions generate match events:

```typescript
// Successful shot
{
  type: 'shot',
  team: 'home',
  player: 'Striker 1',
  description: '🎯 Striker 1 takes a shot!'
}

// Successful pass
{
  type: 'pass',
  team: 'home',
  player: 'Midfielder 1',
  description: 'Midfielder 1 passes to Defender 1'
}

// Successful tackle
{
  type: 'tackle',
  team: 'away',
  player: 'Defender 2',
  description: '🛡️ Defender 2 wins the ball!'
}

// Sprint activation
{
  type: 'possession_change',
  team: 'home',
  player: 'Winger 1',
  description: '⚡ Winger 1 sprints forward!'
}
```

---

## 📊 Stamina System

### Stamina Impact
Stamina degrades during match:
- Goalkeepers: -0.01% per frame
- Outfield players: -0.05% per frame
- Below 30%: Pace -15%, Defense -20%, Dribbling -20%
- Never regenerates during match

### Sprint Interaction
- Cannot sprint if stamina < 15%
- Each sprint costs 15%
- Stamina affects overall performance

---

## 🎮 User Flow

```
MATCH RUNNING
    ↓
[Click Player] → Player Selected
    ↓
    ├─ [Click SHOOT] → (If near goal)
    │  ├─ Adjust power slider (1-20)
    │  ├─ Click "Shoot!"
    │  └─ Ball goes toward goal
    │
    ├─ [Click PASS]
    │  ├─ Mini pitch appears
    │  ├─ Click target area
    │  └─ Pass executes
    │
    ├─ [Click TACKLE]
    │  ├─ (If near ball carrier, 150px)
    │  ├─ Success based on defense vs dribbling
    │  └─ Possible foul/card
    │
    └─ [Click SPRINT]
       ├─ (If stamina > 15%)
       ├─ Pace +20 for 5 seconds
       ├─ Stamina -15%
       └─ Effect applies
```

---

## 🔗 Integration Points

### Files Modified/Created

1. **components/MatchControls.tsx** (New)
   - Control panel UI
   - Dialog management
   - Visual feedback

2. **lib/matchEngine.ts** (Updated)
   - Added `activateSprint()`
   - Added `playerTackle()`
   - Event recording

3. **hooks/useMatchEngine.ts** (Updated)
   - Added `sprint` callback
   - Added `tackle` callback
   - Exported from PvP/AI hooks

4. **components/LiveMatch.tsx** (Updated)
   - MatchControls integration
   - Pass-through of control methods
   - Selected player management

---

## ✨ Features

✅ **Four Core Actions** - Pass, Shoot, Tackle, Sprint  
✅ **Stamina System** - Sprint costs stamina, affects performance  
✅ **Visual Feedback** - Color-coded buttons, dialogs, status  
✅ **Range Detection** - Shoot disabled far from goal  
✅ **Power Control** - Slider for shot strength  
✅ **Target Selection** - Click-based pass targeting  
✅ **Event Recording** - All actions logged with timestamps  
✅ **Statistics** - Shots, passes, tackles tracked  
✅ **RNG Integration** - Success rates based on stats  
✅ **Defensive AI** - Tackles have foul probability  

---

## 🚀 Usage

### For Players

1. **Select a player** by clicking on the pitch
2. **Choose an action:**
   - **Shoot:** If near goal, adjust power and click
   - **Pass:** Click button, then select target on pitch
   - **Tackle:** Click button to attempt tackle (if near ball)
   - **Sprint:** Click to boost speed temporarily
3. **Watch the result** in the event log
4. **Manage stamina** - sprint drains stamina, affects stats

### For Developers

```typescript
// Hook usage
const { shoot, pass, sprint, tackle } = useAIMatch(home, away);

// Call methods
shoot(strength: 1-20);
pass(targetX: 0-1050, targetY: 0-680);
sprint(playerId: string);
tackle(playerId: string);
```

---

## 📈 Future Enhancements

1. **Advanced Tactics**
   - Formation-based passing lanes
   - Tactical fouls
   - Slide tackles vs standing challenges

2. **Skill Moves**
   - Ball juggling
   - Dribble feints
   - Chip passes

3. **Set Pieces**
   - Corners
   - Free kicks
   - Penalties

4. **Player Positioning**
   - Tactical movement
   - Defensive coverage
   - Offside mechanics

5. **Control Variants**
   - Gesture controls
   - Controller support
   - Difficulty modifiers

---

## 📚 Related Files

- [Match Engine](./lib/matchEngine.ts) - Core mechanics
- [Live Match Component](./components/LiveMatch.tsx) - UI rendering
- [Match Hooks](./hooks/useMatchEngine.ts) - State management
- [Formations System](./lib/formations.ts) - Tactical setup

---

**Implementation Date:** January 18, 2026  
**Status:** ✅ Complete & Integrated  
**Lines of Code:** 300+ (controls + engine + hooks)
