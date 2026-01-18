# ⚽ Formation System - Quick Reference

## Available Formations

### 4-3-3 - Balanced Possession
```
        GK
      D D D D
      M M M
      F F F
```
**Best for:** Ball control, balanced defense/attack, possession-based play
**Position breakdown:** 1 GK, 4 DEF, 3 MID, 3 FWD

---

### 4-4-2 - Classic Solid
```
        GK
      D D D D
      M M M M
        F F
```
**Best for:** Defensive width, set pieces, traditional gameplay
**Position breakdown:** 1 GK, 4 DEF, 4 MID, 2 FWD

---

### 3-5-2 - Modern Midfield
```
        GK
        D D D
      M M M M M
        F F
```
**Best for:** Midfield dominance, wing play, high press
**Position breakdown:** 1 GK, 3 DEF, 5 MID, 2 FWD

---

### 5-3-2 - Defensive Fortress
```
        GK
      D D D D D
      M M M
      F F
```
**Best for:** Defensive security, counter-attacks, deep defense
**Position breakdown:** 1 GK, 5 DEF, 3 MID, 2 FWD

---

### 4-2-3-1 - Tactical Modern
```
        GK
      D D D D
        DM DM
      AM AM AM
        ST
```
**Best for:** Tactical flexibility, defensive mids, creative attacks
**Position breakdown:** 1 GK, 4 DEF, 5 MID, 1 FWD

---

## How Formations Work

### Player Positioning
When you select a formation, the system automatically positions all players:
1. **Goalkeeper** - On goal line (x=50 for home, x=1000 for away)
2. **Defenders** - Defense zone (x=180 for home, x=870 for away)
3. **Midfielders** - Midfield zone (x=350-550 depending on formation)
4. **Forwards** - Attack zone (x=550-800 for home)

### Vertical Distribution
Players are evenly spaced across the pitch height (680px) with top/bottom margins.

### Formation Selection Flow
```
Match Start
  ↓
Select Game Mode (AI/PvP)
  ↓
Select Difficulty (AI only)
  ↓
[FORMATION MODAL] ← Select Home Team Formation
  ├─ Choose formation (5 options)
  ├─ See formation preview
  ├─ View squad availability
  └─ Apply → Players repositioned ✓
  ↓
[FORMATION MODAL] ← Select Away Team Formation (PvP only)
  └─ Same as above
  ↓
LiveMatch Component
  └─ Teams now use selected formations
```

---

## Formation Selection Interface

The **TeamSelector modal** shows:
- ✅ Team selection (Home/Away)
- ✅ Formation grid (5 formation buttons)
- ✅ Formation description
- ✅ Position breakdown (GK/DEF/MID/FWD counts)
- ✅ Mini pitch visualization
- ✅ Squad availability checklist
- ✅ Available player count

---

## Tactical Tips

### 4-3-3 (Balanced)
- Best for possession play
- Good midfield support
- Three strikers create more scoring chances
- Requires well-rounded squad

### 4-4-2 (Classic)
- Solid defense with 4 defenders
- Balanced midfield
- Set piece specialists up front
- Good for tight defensive matches

### 3-5-2 (Modern)
- Requires excellent midfielders
- Creates wing overloads
- Less defensive coverage
- Best for teams with midfield strength

### 5-3-2 (Defensive)
- Maximum defensive security
- Limited attacking options
- Perfect for counter-attacks
- Best when protecting a lead

### 4-2-3-1 (Tactical)
- Two defensive midfielders shield defense
- Three attacking midfielders create chances
- One striker for clinical finishing
- Most flexible formation

---

## Player Stats Impact

Formation effectiveness depends on player stats:
- **Defenders:** Defense, Physical, Pace
- **Midfielders:** Passing, Dribbling, Defense, Pace
- **Forwards:** Shooting, Pace, Dribbling

The formation positions players optimally, but their stats determine actual performance!

---

## Match Integration

### Before Match:
1. User selects formation
2. `applyFormation()` repositions all players
3. Player positions saved in GameState

### During Match:
1. Players move from base formation positions
2. AI/PvP decisions factor in formation
3. Possession and positioning reflect formation

### After Match:
1. Formation stats tracked
2. Can switch formation for next match

---

## Code Examples

### Selecting a Formation
```tsx
<button onClick={() => setSelectedFormation('4-3-3')}>
  4-3-3
</button>
```

### Applying to Team
```tsx
const updatedTeam = {
  ...team,
  players: applyFormation(team.players, '4-3-3', true),
  formation: '4-3-3',
};
```

### Accessing Formation Info
```tsx
const config = FORMATIONS['4-3-3'];
console.log(config.positions); // { GK: 1, DEF: 4, MID: 3, FWD: 3 }
```

---

## Files

- **lib/formations.ts** - Formation definitions and positioning logic
- **components/TeamSelector.tsx** - Formation selection modal UI
- **app/match/page.tsx** - Integration into match flow

---

**Last Updated:** January 18, 2026
