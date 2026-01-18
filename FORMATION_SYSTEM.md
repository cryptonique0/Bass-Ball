# Team Selection & Formation System

## 📋 Summary

Complete team selection and tactical formation system integrated into the Bass Ball match system. Players can now select their team and choose from 5 different tactical formations before matches.

## 🎯 Features Implemented

### 1. **Formation System** (`lib/formations.ts`)
Five competitive formations with unique tactical layouts:
- **4-3-3** - Balanced (4 DEF, 3 MID, 3 FWD) - Possession-focused
- **4-4-2** - Classic (4 DEF, 4 MID, 2 FWD) - Solid defense with width  
- **3-5-2** - Modern (3 DEF, 5 MID, 2 FWD) - Midfield control
- **5-3-2** - Defensive (5 DEF, 3 MID, 2 FWD) - Maximum security
- **4-2-3-1** - Tactical (4 DEF, 2 DM, 3 AM, 1 ST) - Flexible & versatile

#### Formation Features:
- Auto-positioning of players based on formation
- Depth-based horizontal placement (defense/midfield/attack zones)
- Vertical spacing for width coverage
- Home/Away side differentiation (left vs right)
- Pitch dimensions: 1050x680

### 2. **Team Selector Modal** (`components/TeamSelector.tsx`)
Interactive modal interface for tactical setup:

#### Sections:
- **Team Selection** - Choose between home/away teams
- **Formation Grid** - 5 buttons for all formations
- **Formation Details** - Description and position breakdown
- **Formation Visualization** - Mini pitch preview with player arrangement
- **Squad Overview** - Position breakdown and player availability
- **Player Count** - Shows needed vs available for each position

#### Visual Elements:
- Color-coded positions (GK=Yellow, DEF=Red, MID=Yellow, FWD=Cyan)
- Formation layout preview
- Position availability indicators (green/red)
- Responsive grid layout
- Real-time formation info

### 3. **Enhanced Match Flow** (`app/match/page.tsx`)
State-driven match progression:

#### Match States:
1. **menu** - Game mode selection (AI vs PvP)
2. **formation-home** - Select home team formation
3. **formation-away** - Select away team formation (PvP only)
4. **playing** - Live match with selected formations

#### Features:
- Mode selection (AI or PvP)
- AI difficulty settings (Easy, Normal, Hard)
- Formation selection for each team
- Formation-based player repositioning
- Team display with roster info
- Back-to-menu navigation

## 🏗️ Architecture

### File Structure:
```
lib/
  ├── formations.ts (256 lines)
  │   ├── FormationType enum
  │   ├── FormationConfig interface
  │   ├── FORMATIONS registry
  │   ├── applyFormation() function
  │   └── Helper functions
  
components/
  ├── TeamSelector.tsx (370 lines)
  │   ├── TeamSelector component
  │   └── FormationPreview subcomponent
  
app/
  └── match/
      └── page.tsx (updated)
          ├── SAMPLE_TEAMS data
          ├── State management
          ├── Formation selection flow
          └── UI layouts
```

### Key Functions:

**`applyFormation(players, formation, isHomeTeam)`**
- Repositions all players according to formation
- Returns updated player array with new x/y coordinates
- Separates by position (GK/DEF/MID/FWD)
- Calculates pitch zones and spacing

**`calculateVerticalPosition(row, playerIndex, playerCount)`**
- Distributes players evenly across pitch height
- Respects top/bottom margins
- Centers single players

**`calculateHorizontalPosition(row, isHomeTeam)`**
- Places players at tactical depth zones
- Home team defends left, attacks right
- Away team defends right, attacks left
- Uses depth array for positioning

## 🎮 User Flow

```
Match Page
  ├── Select Game Mode (AI/PvP)
  ├── Select Difficulty (AI only)
  ├── Select Home Formation → TeamSelector Modal
  │   ├── Choose Formation
  │   ├── See Preview
  │   ├── Apply Formation
  │   └── Players repositioned ✓
  ├── Select Away Formation → TeamSelector Modal (PvP only)
  │   ├── Choose Formation
  │   ├── See Preview
  │   ├── Apply Formation
  │   └── Players repositioned ✓
  └── Start Match → LiveMatch Component
      └── Play with selected formations applied
```

## 📊 Formation Data

Each formation stores:
- **name**: Display name (e.g., "4-3-3")
- **description**: Tactical explanation
- **positions**: Count of each position type
- **layout**: Row-by-row player distribution

Example (4-3-3):
```typescript
{
  name: '4-3-3',
  positions: { GK: 1, DEF: 4, MID: 3, FWD: 3 },
  layout: [
    { row: 0, count: 1 },  // GK at goal line
    { row: 1, count: 4 },  // Defenders
    { row: 2, count: 3 },  // Midfielders
    { row: 3, count: 3 },  // Forwards
  ]
}
```

## 🎨 UI Components

### TeamSelector Modal:
- Fixed overlay with semi-transparent background
- Team selection buttons (red/blue)
- Formation grid (responsive)
- Details card with position counts
- Formation visualization
- Squad availability checklist
- Confirm/Cancel buttons

### Formation Preview:
- Green pitch background
- Player circles arranged by formation
- Position legend (G/D/M/F)
- Defensive side indicator

## 🔌 Integration Points

1. **LiveMatch Component** - Receives teams with applied formations
2. **Match Engine** - Uses player positions for physics
3. **GameState** - Maintains formation through match
4. **Sample Teams** - 10 players per team (all positions)

## ✅ Validation

- Position counts match formations
- All players get repositioned
- Home/away differentiation works
- Formation previews accurate
- Modal controls work properly
- Formation state persists to match

## 🚀 Usage Example

```tsx
// From app/match/page.tsx
const handleFormationSelect = (formation: FormationType) => {
  const updatedHome = {
    ...homeTeam,
    players: applyFormation(homeTeam.players, formation, true),
    formation,
  };
  setHomeTeam(updatedHome);
};

// User selects 4-3-3, players are positioned accordingly:
// - Goalkeeper at x=50 (left goal line)
// - 4 Defenders at x=180 (defense zone)
// - 3 Midfielders at x=350 (midfield zone)
// - 3 Forwards at x=550 (attack zone)
```

## 🎯 Next Steps

Potential enhancements:
- Custom formation creator
- Formation presets by team
- Historical formation stats
- Formation suggestions based on opponent
- Formation-specific AI strategy
- Substitution management with formation changes
