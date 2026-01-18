# ⚽ In-Match Controls - Quick Reference

## 🎮 Four Core Actions

### 1. SHOOT ⚽
```
When: Near opponent goal (within 300px)
How: Click button → Adjust power slider (1-20) → Click "Shoot!"

Power Levels:
  1-5  ████░░░░░░  Weak    (short, accurate)
  6-15 ████████░░  Medium  (balanced)
 16-20 ██████████  Powerful (far, risky)

Success Rate:
  Shooting Stat × Distance Factor × Power Modifier
  Example: 80 shooting × 0.8 distance × power = 60%+ success
```

### 2. PASS 🎯
```
When: Always available
How: Click button → Click target on pitch

Pass Range: Full pitch (1050 × 680)
Success Rate:
  Passing Stat × Distance Factor
  Example: 85 passing with short pass = 90%+ success

Visual: Mini pitch shows your current position
        Click any area to pass there
```

### 3. TACKLE 🛡️
```
When: Always available (defender)
How: Click button

Range: 150px from ball carrier
Success: Defense Stat vs Dribbling Stat
  High defense wins ball
  Low defense risks foul → yellow/red card

Outcomes:
  ✓ Win ball (60%)
  - Lose tackle (10%)
  ⚠️ Foul committed (30%)
```

### 4. SPRINT ⚡
```
When: Stamina > 15%
How: Click button

Effect: Pace +20 for 5 seconds
Cost: 15% stamina per activation
Duration: 5 seconds (then back to normal)

Stamina Status:
  ✅ 100-16%  Can sprint
  ❌ 15%-0%   Cannot sprint (button disabled)
```

---

## 📊 Player Selection Display

```
┌─────────────────────────────────┐
│ ▶ Midfielder 1                  │
│ MID • Stamina: 75%              │
│                                 │
│ Pace: 80  Shoot: 65  Pass: 82   │
└─────────────────────────────────┘
```

---

## 🕹️ Control Layout

```
┌─────────────────────────────────┐
│      ⚽ SHOOT  │  🎯 PASS       │
│     Power:    │   Target       │
│     Slider    │   Selection    │
├─────────────────────────────────┤
│      🛡️ TACKLE │  ⚡ SPRINT      │
│      Win Ball │   Boost Speed  │
│      (150px)  │   (-15 stamina)│
└─────────────────────────────────┘
```

---

## 📈 Success Factors by Action

### SHOOT Success
```
Player Shooting Stat → Distance from Goal → Power Used
      80 stat       ×    Good distance   ×   Medium  = ~60% chance

Higher stat = better chance
Closer distance = better chance
Higher power = slightly lower accuracy (more power, less control)
```

### PASS Success
```
Player Passing Stat → Distance to Target
      85 stat      ×    Short pass    = ~90% chance

Higher stat = better chance
Closer target = better chance
Max distance ~500px for reliable passes
```

### TACKLE Success
```
Defender Defense Stat → Attacker Dribbling Stat
     80 defense      ÷    40 dribbling    = High success

Higher defense = higher success
Lower attacker dribbling = higher success
Higher attacker dribbling = foul risk
```

### SPRINT Effectiveness
```
Pace: Normal 75 → Boosted 95 for 5 seconds
Speed increases by ~25%
Better for escaping defenders or reaching goal
```

---

## ⚠️ Status Indicators

```
Button Colors:
  🟨 SHOOT   - Yellow (actionable)
  🔵 PASS    - Blue (actionable)
  🔴 TACKLE  - Red (always available, offensive action)
  🔵 SPRINT  - Cyan (if stamina available)
  ⚫ DISABLED - Gray (not available)

Disabled When:
  SHOOT   - Stamina depleted or too far from goal (>300px)
  PASS    - None (always available)
  TACKLE  - None (always available)
  SPRINT  - Stamina < 15%
```

---

## 🎮 Example Match Scenario

```
MATCH START
  ↓
[Click Midfielder] → Selected
  ↓
Near midfield (no shoot option)
  [🎯 PASS] → Click target near goal
    → Pass succeeds 85% confident
    ↓
[Click Striker] → Selected
  ↓
Near penalty box (<300px from goal)
  [⚽ SHOOT] → Adjust to power level 15
    → High power, slight accuracy risk
    → 60% chance goal
    ↓
[Goal Kick to Away Team]
  ↓
[Click Defender] → Selected
  ↓
Ball carrier within 150px
  [🛡️ TACKLE] → Attempt tackle
    → Defense 85 vs Dribbling 50
    → High success chance
    → Win ball
    ↓
[⚡ SPRINT] → Boost away from pressure
  → Stamina drops to 60%
  → Pace boosted for 5 seconds
```

---

## ⏱️ Stamina Impact Over Time

```
Match Time (in minutes):
0'  ████████████████████  100% Stamina
15' ████████████░░░░░░░░  75% Stamina
30' ████████░░░░░░░░░░░░  50% Stamina  ← Speed reduction starts
45' ████░░░░░░░░░░░░░░░░  25% Stamina  ← Major reduction
90' ██░░░░░░░░░░░░░░░░░░  ~10% Stamina ← Very slow

Sprint costs:
Each sprint: -15% (permanent, never recovers)
Multiple sprints: Can go below 15% → no more sprints
```

---

## 🎯 Pro Tips

1. **Shooting**
   - Lower power (5-10) for close-range shots: higher accuracy
   - Higher power (15-20) from distance: riskier but goal-oriented
   - Shoot when stamina is above 30% for better character responsiveness

2. **Passing**
   - Short passes (nearby players): 90%+ success
   - Medium passes (50-100px): 70%+ success
   - Long passes (200px+): 40%+ success
   - Avoid passing across the pitch when tired

3. **Tackling**
   - Defenders with high defense stat: better success
   - Time tackles when ball carrier near sideline
   - Risky challenges near goal: possible foul
   - Multiple tackles drain stamina indirectly

4. **Sprinting**
   - Use when running toward goal (5 second advantage)
   - Use when escaping pressure (quick getaway)
   - Save stamina for critical moments
   - Don't sprint recklessly mid-field

---

## 📱 Mobile Controls (Future)

```
Touch Support (planned):
  Tap player → Select
  Swipe shoot button → Power slider
  Tap pitch → Pass target
  Long press tackle → Harder tackle (future)
  Double tap sprint → Quick boost (future)
```

---

## ⚙️ Keyboard Shortcuts (Future)

```
Planned shortcuts:
  S - Shoot
  P - Pass
  T - Tackle
  R - Sprint
  ESC - Deselect player
  SPACE - Pause
```

---

## 🏆 Control Mastery Checklist

- [ ] Understand all 4 actions
- [ ] Practice shooting from different distances
- [ ] Learn passing distance limits
- [ ] Practice tackling timing
- [ ] Manage stamina efficiently
- [ ] Use sprint strategically
- [ ] Combine actions for tactical flow
- [ ] Read opponent positioning
- [ ] Plan multi-player movements
- [ ] Adapt to stamina levels

---

**Last Updated:** January 18, 2026
