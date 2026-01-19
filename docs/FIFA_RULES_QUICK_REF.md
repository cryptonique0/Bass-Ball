# ⚽ FIFA Rules Quick Reference

**Compact guide to Bass Ball's FIFA ruleset implementation**

---

## Cards & Suspensions At A Glance

| Offense | Card | Suspension | Appealable |
|---------|------|-----------|-----------|
| Excessive force | 🟨 Yellow | — | Yes |
| Dangerous play | 🟨 Yellow | — | Yes |
| Dissent/Protest | 🟨 Yellow | — | Yes |
| Persistent fouling (3x) | 🟨 Yellow | — | Yes |
| 2x Yellow cards in match | 🔴 Red | 1 match | Yes |
| Violent conduct (punch, headbutt) | 🔴 Red | 3 matches | Yes |
| Serious foul play (two-footed studs) | 🔴 Red | 3 matches | Yes |
| Spitting / Biting | 🔴 Red | 4 matches | Yes |
| Abusive language (racial/religious) | 🔴 Red | 5-10 matches | Yes |
| Denial of goal-scoring opportunity | 🔴 Red | 2 matches | Yes |

**Yellow Card Accumulation**: 5 yellows in season = 1-match ban | 10 yellows = 2-match ban

---

## Transfer Windows

| Window | Dates | Max Transfers | Budget Cap | Notes |
|--------|-------|---------------|-----------|-------|
| Summer | June 1 - Aug 31 | 4 in / 3 out | 500K USDC | Peak activity |
| Winter | Jan 1 - Jan 31 | 2 in / 2 out | 250K USDC | Limited moves |
| Emergency | Feb 1 - Mar 15 | 1 in (injury only) | 50K USDC | League approval required |

**Transfer Rules**:
- Players must complete 1 full season before transfer (26 matches)
- Suspended players can't be transferred
- Max 1 player per position per window
- Squad must maintain 11+ eligible players minimum

---

## Squad Rules

| Rule | Limit |
|------|-------|
| Starting XI | 11 players (must match formation) |
| Bench/Subs | 7 players maximum |
| Minimum Eligible | 11 (team folded if <7) |
| Goalkeepers | 1 playing, 1+ backup required |
| Defenders | 4+ eligible required |
| Midfielders | 4+ eligible required |
| Strikers | 2+ eligible required |

**Ineligible Players (Can't Field)**:
- Serving suspension (check dashboard)
- Injured (X matches out)
- Transferred mid-season (not cleared)
- Contract expired
- Red card still active

---

## Offside & Ball Rules

**Offside**: Player ahead of both last defender AND ball when pass is made
- **NOT offside**: Own half, throw-in, goal kick, corner kick, level with defender
- **Penalty**: Indirect free kick to defending team

**Handball**:
- **Deliberate**: In box = penalty | Outside = free kick | Card issued
- **Accidental**: Free kick, no card
- **GK Exception**: Can handle in penalty area from field pass only

**Penalties**:
- Awarded for fouls or handball in penalty area
- Taken from 11-meter spot
- 3-second time limit per shot
- Goalkeeper stays on line
- Saved or missed = ball in play

---

## Match Duration

| Format | Duration | Extra Time | Penalties |
|--------|----------|-----------|-----------|
| League | 2×45 min | N/A | N/A |
| Cup Knockout | 2×45 min | 2×15 min | Best of 5 if tied |
| Friendly | Custom | Optional | N/A |

**Stoppage Time**: Added by server (injuries, cards, delays)

---

## League Scoring

| Result | Points |
|--------|--------|
| Win | 3 |
| Draw | 1 |
| Loss | 0 |
| Abandoned | 0 |

**Tiebreaker** (Final Standings):
1. Goal difference
2. Goals scored
3. Head-to-head record
4. Deterministic seed

---

## Injury System

| Severity | Duration | Recovery |
|----------|----------|----------|
| Minor | 3-5 matches | Gradual |
| Moderate | 7-14 matches | Slower |
| Serious | Season-ending | Auto-restore next season |

- Player can't participate while injured
- Injury chance: 2-5% base + fatigue modifier
- No P2W recovery (medical staff can't speed up)

---

## Disciplinary Appeal Process

1. **Incident occurs** → Red card issued
2. **24-hour window** → Player submits replay clip to IPFS
3. **Voting period** → 5 random judges vote (48 hours)
4. **Resolution** → ≥3/5 votes = upheld or overturned
5. **Outcome** → If overturned: suspension removed, 0.05 ETH reward

**Appeal Cost**: 0.1 ETH (refunded if successful)

---

## Position Abbreviations

| Pos | Full Name | Typical Role |
|-----|-----------|--------------|
| GK | Goalkeeper | Defend goal, punting |
| CB | Center Back | Central defense |
| LB | Left Back | Left defense |
| RB | Right Back | Right defense |
| LWB | Left Wing Back | Left flank, attacking |
| RWB | Right Wing Back | Right flank, attacking |
| DM | Defensive Midfielder | Ball winning, distribution |
| CM | Central Midfielder | Box-to-box |
| CAM | Attacking Midfielder | Creating chances |
| LW | Left Winger | Left flank dribble/cross |
| RW | Right Winger | Right flank dribble/cross |
| ST | Striker | Scoring/finishing |
| CF | Center Forward | Goal creation/scoring |

---

## Common Fouls & Cards

| Infringement | Card | FK Position |
|---|---|---|
| Tackle from behind (no ball) | 🔴 Red | Where fouled |
| Two-footed challenge | 🔴 Red | Where fouled |
| High studs challenge | 🟨 Yellow | Where fouled |
| Holding jersey | 🟨 Yellow | Where fouled |
| Pushing (away from ball) | 🟨 Yellow | Where fouled |
| Kicking ball away | 🟨 Yellow | Where fouled |
| Throwing ball at opponent | 🟨 Yellow | Where fouled |
| Time-wasting (GK >6s) | 🟨 Yellow | Penalty area |
| Backpass handling (GK) | 🟡 Indirect FK | Edge of box |
| Offside | 🟡 Indirect FK | Offside position |

---

## Blockchain Integration

✅ **On-Chain Records**:
- Every card (yellow/red) logged with match hash
- Suspensions locked in smart contract
- Transfer completions recorded as NFT ownership changes
- Appeal outcomes verified by voting

✅ **Verifiable via Replay**:
- Card incidents can be disputed with cryptographic proof
- Physics and decisions deterministic (same seed = same outcome)
- IPFS replay clips for appeal evidence

✅ **Immutable History**:
- Player disciplinary record visible on-chain
- Transfer history tracked per NFT
- Suspension calendar transparent to all

---

## Resources

📖 **Full Specification**: [FIFA Rules Implementation](FIFA_RULES_IMPLEMENTATION.md)

🎮 **Quick Commands**:
- Check suspension: Player profile → "Disciplinary" tab
- View transfer eligibility: Team screen → "Transfers" button
- Appeal card: Match summary → "Dispute" button (within 24h)
- View formation rules: Squad builder → "Validation" panel

⚖️ **Disputes & Appeals**:
- 24-hour appeal window from match completion
- Submit replay clip as evidence (IPFS auto-uploaded)
- Community voting: 5 judges, 48-hour period
- Appeal fee: 0.1 ETH (refunded if successful)

---

**Last Updated**: January 2026
**Version**: 1.0 (Complete FIFA Ruleset)
**Blockchain**: Base Chain (Ethereum L2)
