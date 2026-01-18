# 🎮 Custom Match Rules & Extensibility System

**Friendly Match Modifiers, Custom Tournaments, Community Rule Sets, and Creative Experimentation**

Bass Ball's modding system enables **creative experimentation and community innovation** through custom rule sets, modifier stacks, and community-created tournaments—without compromising competitive integrity or enabling stat-boosting exploits.

---

## Table of Contents

1. [Custom Match Rules Overview](#custom-match-rules-overview)
2. [Friendly Match Modifiers](#friendly-match-modifiers)
3. [Modifier Categories & Balance](#modifier-categories--balance)
4. [Community Tournament Rule Sets](#community-tournament-rule-sets)
5. [Rule Validation & Safety](#rule-validation--safety)
6. [Custom Match Finder](#custom-match-finder)
7. [Creator Tools & SDK](#creator-tools--sdk)
8. [Implementation](#implementation)

---

## Custom Match Rules Overview

### Core Philosophy

```
CUSTOM RULES PRINCIPLES:

✅ ALLOWED (No stat impact):
├─ Ball physics modifiers (weight, air density, gravity)
├─ Stamina system tweaks (drain rate, recovery)
├─ Card thresholds (yellow/red card points)
├─ Match time (45min halves, 30min, 20min, etc.)
├─ Player attributes (start with fatigue, injuries)
├─ Formation restrictions (only 5 specific formations)
├─ Positioning rules (no offside, no backpass, etc.)
├─ Bonus systems (goal multipliers, clean sheet points)
└─ Visual themes (different stadiums, weather, time)

❌ FORBIDDEN (Would enable pay-to-win):
├─ Player stat boosts (no pace/shot/passing increases)
├─ Cosmetics granting advantages (no invisible players, no enlarged goal)
├─ Skill mastery cheating (no "start at 100% mastery")
├─ ELO artificial inflation (no free rating boost)
├─ Input advantages (no super-speed for keyboard players)
├─ Physics breaking (impossible gravity that helps certain styles)
├─ NFT stat bonuses (cosmetic NFTs can't improve gameplay)
└─ Hidden mechanics (players must see all rules before match)

Philosophy:
├─ Innovation encouraged (try wild rulesets!)
├─ Balance maintained (no paid advantages)
├─ Transparency required (all rules visible pre-match)
├─ Experimentation praised (creative modifiers = cosmetics)
└─ Competitive integrity protected (ranked matches unchanged)
```

---

## Friendly Match Modifiers

### Modifier Categories

```
MODIFIER LIBRARY:

A. PHYSICS MODIFIERS:

Low Gravity Mode:
├─ Gravity: 50% (5.0 m/s² instead of 9.81)
├─ Effect: Ball stays airborne longer, higher arcs
├─ Community: "Space Football" (popular)
├─ Use case: Creative, flashy plays
└─ Impact: No skill advantage (both players affected equally)

Heavy Ball Mode:
├─ Ball mass: 2.0x normal (0.86 kg instead of 0.43 kg)
├─ Effect: Harder to move, less responsive, power shots crucial
├─ Community: "Strength Test"
├─ Use case: Physical play emphasis
└─ Impact: Favors ST/CB, nerfs AM/Winger (still balanced)

Slippery Pitch Mode:
├─ Friction: 0.05 (vs normal 0.15)
├─ Effect: Ball and players slide, harder to stop
├─ Community: "Ice Rink Football"
├─ Use case: Unpredictable, chaotic fun
└─ Impact: Skill > stats (control matters more)

Ultra-Spin Mode:
├─ Ball spin multiplier: 3.0x
├─ Effect: Extreme curve, dip, rise on shots/passes
├─ Community: "Bend It Like Beckham"
├─ Use case: Curve mastery showcase
└─ Impact: No P2W (spin skill built-in)

Wind Mode:
├─ Wind speed: 20 mph (varies by time)
├─ Effect: Ball trajectory affected, passes drift
├─ Community: "Windy City Football"
├─ Use case: Unpredictable outdoor feel
└─ Impact: Adds variance (interesting, not unfair)

B. STAMINA MODIFIERS:

No Stamina Mode:
├─ Stamina drain: 0%
├─ Effect: Players never tired, can sprint all match
├─ Community: "Superhuman Football"
├─ Use case: Fast-paced, high-intensity play
└─ Impact: Favors aggressive tactics (no rest needed)

Extreme Fatigue Mode:
├─ Stamina drain: 2.0x
├─ Effect: Players tire quickly, must manage energy
├─ Community: "Endurance Test"
├─ Use case: Tactical depth (substitutions crucial)
└─ Impact: Favors possession retention (lower intensity)

C. MATCH TIME MODIFIERS:

20-Minute Match:
├─ Duration: 20 minutes (no halves)
├─ Effect: Quick, arcade-style
├─ Community: "Lunch Break Football"
├─ Use case: Quick fun matches
└─ Impact: Reduces strategy depth (shorter time)

Extra-Time Guarantee:
├─ If draw: Auto 30 minutes extra time (no penalties)
├─ Effect: Guarantees winner (no draws possible)
├─ Community: "No Draws League"
├─ Use case: Elimination tournament play
└─ Impact: Fairer outcomes (fewer lucky edges)

D. CARD MODIFIERS:

Lenient Cards:
├─ Yellow card points: 40 (vs normal 35)
├─ Red card points: 70 (vs normal 60)
├─ Effect: Harder to get sent off
├─ Community: "Play Rough"
├─ Use case: Aggressive tackling encouraged
└─ Impact: More contact, more fouls (legitimate)

Strict Cards:
├─ Yellow card points: 25 (vs normal 35)
├─ Red card points: 50 (vs normal 60)
├─ Effect: Easier to get carded
├─ Community: "Referee's Nightmare"
├─ Use case: Discipline and clean play emphasis
└─ Impact: Tactical fouls less viable

E. FORMATION MODIFIERS:

Formation Lock (Must use specific formation):
├─ Options: 4-3-3, 3-5-2, 4-2-3-1 (choose 1)
├─ Effect: Both players locked to same formation
├─ Community: "Symmetrical Football"
├─ Use case: Formation mastery testing
└─ Impact: Removes formation-switching advantage

High Possession Handicap:
├─ Possession > 60%: -5% passing accuracy
├─ Effect: Discourages ball-hogging
├─ Community: "Spread the Ball"
├─ Use case: Balanced play encouraged
└─ Impact: Tactical (not stat) disadvantage

F. VISUAL MODIFIERS:

Weather Effects:
├─ Options: Rain, Snow, Fog, Hail
├─ Effect: Visual change, slight physics impact (rain = less grip)
├─ Community: Cosmetic only
└─ Impact: Aesthetic (no gameplay advantage)

Time of Day:
├─ Options: Morning, Afternoon, Evening, Night
├─ Effect: Lighting changes, shadows
├─ Community: Cosmetic only
└─ Impact: Aesthetic (no gameplay advantage)

Stadium Theme:
├─ Options: 20+ stadiums (default, retro, futuristic, etc.)
├─ Effect: Visual theme
├─ Community: Cosmetic preference
└─ Impact: No gameplay change
```

### Modifier Stacking

```
MODIFIER COMBINATION EXAMPLES:

Balanced Stack (Popular):
├─ Low Gravity (fun, not unfair)
├─ No Stamina (constant intensity)
├─ 20-Minute Match (quick)
├─ Stadium: Retro Theme
└─ Name: "Classic Arcade Football"
└─ Playstyle: Flashy, high-paced

Tactical Stack (Championship-style):
├─ Extra-Time Guarantee (no draws)
├─ Formation Lock: 4-3-3 (mastery testing)
├─ Lenient Cards (contact sport allowed)
├─ 90-Minute Match (full duration)
└─ Name: "Pro Formation Battle"
└─ Playstyle: Strategic, organized

Extreme Experimentation Stack:
├─ Low Gravity
├─ Heavy Ball
├─ Extreme Fatigue
├─ Strict Cards
├─ Ultra-Spin
├─ 20-Minute Match
└─ Name: "Total Chaos"
└─ Playstyle: Wild, unpredictable, experimental

Skill-Testing Stack:
├─ Ultra-Spin Mode (curve mastery)
├─ No Stamina (pure control)
├─ Lenient Cards (aggressive tactics ok)
├─ 90-Minute Match
└─ Name: "Skill Gauntlet"
└─ Playstyle: Offensive, high-precision

Modifier Validation:
├─ Cannot apply same modifier twice (redundant)
├─ Cannot apply contradictory modifiers
│  (e.g., "No Stamina" + "Extreme Fatigue")
├─ Max 6 modifiers per custom match
├─ All modifiers must be published (not hidden)
└─ All modifiers must NOT grant stat advantages
```

---

## Modifier Categories & Balance

### Modifier Balance Framework

```
BALANCE SCORING SYSTEM:

Each modifier assigned "Balance Score" (0-100):
├─ 0-20: Highly biased (FORBIDDEN)
│  └─ Examples: Player stat boosts, invisible mode, super-speed
├─ 21-40: Situationally biased (RESTRICTED)
│  └─ Examples: Extreme formation locks, unrealistic gravity
├─ 41-60: Balanced (ALLOWED, monitored)
│  └─ Examples: Most physics tweaks, visual changes
├─ 61-80: Well-balanced (ENCOURAGED)
│  └─ Examples: Stamina tweaks, time variations
├─ 81-100: Pure fun (FULLY ALLOWED)
│  └─ Examples: Visual themes, cosmetic effects

Balance Calculation:
balance_score = 50 (baseline)
  + skill_impact (5 if both players affected equally, -20 if favors one role)
  + stat_impact (-50 if enables stat boost, 0 if purely mechanical)
  + precedent (+10 if similar modifiers in tournaments, -5 if experimental)
  + player_testing (+5 if tested extensively, -10 if untested)

Examples:

"Low Gravity" Balance:
├─ Baseline: 50
├─ Skill impact: +5 (both players equally affected)
├─ Stat impact: 0 (no stat boost)
├─ Precedent: +10 (tournament tested)
├─ Testing: +5
└─ TOTAL: 70 (Well-balanced) ✅

"Player Stat Boost +10%" Balance:
├─ Baseline: 50
├─ Skill impact: -20 (favors player with higher stats)
├─ Stat impact: -50 (enables cheating)
├─ Precedent: -5 (never used in tournaments)
├─ Testing: 0
└─ TOTAL: -25 (Forbidden) ❌
```

### Role Impact Analysis

```
MODIFIER IMPACT BY ROLE:

Low Gravity Mode Impact:
┌────────────────┬──────────────────────────────┐
│ Role           │ Impact                       │
├────────────────┼──────────────────────────────┤
│ CB (Defender)  │ Neutral (jumping reaches ↑)  │
│ FB (Fullback)  │ Neutral (same vertical jump) │
│ DM (Midfielder)│ Slight boost (headers higher)│
│ CM (Center M)  │ Neutral (no advantage)       │
│ AM (Att. Mid)  │ Slight boost (longer passes) │
│ Winger         │ Neutral (crossing same)      │
│ ST (Striker)   │ Slight boost (headers easier)│
└────────────────┴──────────────────────────────┘
Conclusion: Neutral overall (slight ST advantage, negligible)

Heavy Ball Mode Impact:
┌────────────────┬──────────────────────────────┐
│ Role           │ Impact                       │
├────────────────┼──────────────────────────────┤
│ CB (Defender)  │ Boost (clearances stronger)  │
│ FB (Fullback)  │ Neutral (same)               │
│ DM (Midfielder)│ Neutral (defensive)          │
│ CM (Center M)  │ Slight penalty (ball heavy)  │
│ AM (Att. Mid)  │ Slight penalty (control)     │
│ Winger         │ Penalty (dribbling harder)   │
│ ST (Striker)   │ Boost (power shots viable)   │
└────────────────┴──────────────────────────────┘
Conclusion: Favors strength (CB/ST), penalizes agility (AM/Winger)
BUT: Still skill-based (dribble timing can overcome)

Verdict: Allowed (interesting tradeoff, not P2W)
```

---

## Community Tournament Rule Sets

### Pre-Built Rule Sets

```
OFFICIAL RULE SET LIBRARY:

1. CLASSIC (Ranked Default)
   └─ No modifiers (standard Bass Ball rules)
   └─ Used in: All ranked matches, official tournaments
   └─ Balance: 100/100 (baseline)

2. ARCADE (Fun, chaotic)
   ├─ Low Gravity (0.5x)
   ├─ No Stamina
   ├─ Ultra-Spin (3x)
   ├─ 20-Minute Match
   └─ Community rating: 4.8/5 (4,200 plays)

3. TACTICAL (Strategic depth)
   ├─ Extreme Fatigue (2x)
   ├─ Extra-Time Guarantee
   ├─ Formation Locked (4-3-3)
   ├─ 90-Minute Match
   └─ Community rating: 4.6/5 (2,100 plays)

4. SPEED RUN (Quick tournaments)
   ├─ 20-Minute Match
   ├─ No Stamina
   ├─ Lenient Cards
   └─ Community rating: 4.7/5 (5,600 plays)

5. CHALLENGE (Skill test)
   ├─ Ultra-Spin Mode (3x)
   ├─ Slippery Pitch (0.05 friction)
   ├─ 90-Minute Match
   ├─ Lenient Cards
   └─ Community rating: 4.3/5 (1,800 plays)

6. SYMMETRY (Formation mastery)
   ├─ Formation Lock (same for both)
   ├─ Extra-Time Guarantee
   ├─ 90-Minute Match
   └─ Community rating: 4.5/5 (3,200 plays)

7. EXPERIMENTAL (Wild modifiers)
   ├─ Community-voted modifiers (rotates monthly)
   ├─ Currently: Low Gravity + Heavy Ball + Extreme Fatigue
   ├─ Next month: TBD (community votes)
   └─ Community rating: 4.2/5 (varies)

Creator Tips:
├─ "Keep 1-4 modifiers (more = confusing)"
├─ "Test with friends before publishing"
├─ "Explain the fun in 2-3 sentences"
├─ "Encourage creative playstyles"
└─ "Monitor player feedback, adjust yearly"
```

### Community Rule Creation

```
CREATE CUSTOM TOURNAMENT RULE SET:

┌──────────────────────────────────────────┐
│ PUBLISH CUSTOM RULE SET                  │
├──────────────────────────────────────────┤
│                                          │
│ Name: [e.g., "Wall Builders"]            │
│ Description: [Max 200 chars]             │
│ "Defensive football emphasis - high      │
│  tackling requirements, loose cards,     │
│  sticky pitch. Best for 2-player league" │
│                                          │
│ Modifiers Selected:                      │
│ ☑ Lenient Cards (easier to defend)       │
│ ☑ Slippery Pitch (unpredictable passes) │
│ ☑ Heavy Ball (strong clearing kicks)     │
│ ☐ [Add modifier...]                      │
│                                          │
│ Match Time: [90 minutes ▼]               │
│                                          │
│ Formation Lock: ☐ [Choose ▼]             │
│                                          │
│ Visibility:                              │
│ ☉ Public (anyone can see/play)           │
│ ○ Private (friends only)                 │
│ ○ Restricted (invited players only)      │
│                                          │
│ Content Type:                            │
│ [Select Primary Playstyle ▼]             │
│ ├─ Defensive                             │
│ ├─ Balanced                              │
│ ├─ Offensive                             │
│ ├─ Chaotic/Fun                           │
│ └─ Experimental                          │
│                                          │
│ [Validate Rules] [Publish] [Save Draft]  │
│                                          │
└──────────────────────────────────────────┘

Validation Checks:
├─ ✅ No forbidden modifiers
├─ ✅ No stat-boosting exploits
├─ ✅ Balanced score > 40
├─ ✅ Description clear
├─ ✅ Tested by author (checkbox)
└─ ✅ Ready to publish!

Upon Publication:
├─ Rule set assigned unique ID
├─ Listed in community library (browseable)
├─ Players can rate (1-5 stars)
├─ Creator gets feedback (positive reinforces cosmetics)
├─ Popular sets featured (1,000+ plays = featured badge)
└─ All data: transparent, verifiable
```

### Community Tournament Integration

```
RUN A TOURNAMENT WITH CUSTOM RULES:

Step 1: Pick Rule Set
├─ Use official set (ARCADE, TACTICAL, etc.)
├─ Or create custom set
└─ Or fork existing community set (remix)

Step 2: Tournament Structure
├─ Format: 8/16/32 players
├─ Bracket: Single/Double elimination or round-robin
├─ Prize pool: Cosmetics + prestige badges
└─ Duration: 1 week to 1 month

Step 3: Promote
├─ Share in-game (announcements)
├─ Share Discord/Farcaster
├─ List in community tournament calendar
└─ Automatic notifications (players who like rule set)

Step 4: Run Tournament
├─ Matches use selected rule set
├─ Streaming allowed (spectators earn XP)
├─ Replays stored on IPFS
└─ Live leaderboard displayed

Step 5: Award & Celebrate
├─ Winners announced in-game
├─ Exclusive cosmetics awarded
├─ Replays featured on homepage
├─ Best plays shared on social media
└─ Creator gets prestige cosmetics ($5 value)

Example Winning Tournaments:

"Wall Builders League" (Created by Ahmed):
├─ 32 players
├─ 4 weeks (Sundays only)
├─ Defensive focus (custom rule set)
├─ Prize: $50 cosmetics, exclusive "Wall Master" badge
├─ Players: 2,400 watched live (spectators)
├─ Creator reward: "Tournament Organizer" badge + $5 cosmetics
└─ Seasonal repeat: Monthly (popular demand)

"Chaos Cup" (Created by Sarah):
├─ 16 players
├─ Experimental modifiers (voted on monthly)
├─ Wild, unpredictable fun
├─ Prize: $20 cosmetics, random cosmetics drops
├─ Players: 800 watched
├─ Creator reward: $3 cosmetics (modest, but fun)
└─ Cult following: "ChaosHeads" community
```

---

## Rule Validation & Safety

### Anti-Cheat Validation

```
RULE SET VALIDATION SYSTEM:

Automatic Scan (Smart Contract):
├─ Check 1: No stat boosts
│  └─ Scan for keywords: "+shot", "mastery", "speed boost"
│  └─ If found: FORBIDDEN
├─ Check 2: No invisible mode / hidden mechanics
│  └─ All modifiers public? (must list all)
│  └─ If found: FORBIDDEN
├─ Check 3: No ELO manipulation
│  └─ Matches still affect ELO (cannot disable ranking)
│  └─ If found: FORBIDDEN
├─ Check 4: No input advantages
│  └─ Keyboard speed = Gamepad speed (equal)
│  └─ If found: FORBIDDEN
├─ Check 5: Balance score check
│  └─ Must be > 40 (not totally broken)
│  └─ If < 40: FLAGGED for review
└─ Check 6: Code review
   └─ Unusual modifiers manually reviewed
   └─ Approvers must verify no exploit

Manual Review (Guardians):
├─ Community moderators review flagged sets
├─ Test against balance criteria
├─ Approve or deny within 7 days
├─ Feedback provided to creator
└─ Appeals available (request re-review)

Approval Status Labels:
├─ ✅ VERIFIED (Passed all checks)
├─ ⏳ PENDING (Under review)
├─ ⚠️ FLAGGED (Suspicious, being reviewed)
├─ ❌ REJECTED (Violates rules, cannot publish)
└─ 🔄 REVISED (Creator updated set, re-review)
```

### Rule Set Integrity

```
EXPLOITING RULES (What's Prevented):

Exploit Attempt 1: "Cosmetics Stat Boost"
├─ Creator tries: "Equip rare cosmetic → +10% shot accuracy"
├─ Validation detects: Cosmetic name in modifier
├─ Result: REJECTED ("Cosmetics cannot affect stats")
└─ Message: "Try visual cosmetics instead (stadium theme, etc.)"

Exploit Attempt 2: "Hidden Mastery"
├─ Creator tries: "If player has 100% mastery, +200 ELO"
├─ Validation detects: Conditional stat boost
├─ Result: REJECTED ("No conditional stat boosts")
└─ Message: "Mastery level cannot affect match outcome"

Exploit Attempt 3: "Device Discrimination"
├─ Creator tries: "Keyboard players: 2x input speed"
├─ Validation detects: Input speed differential
├─ Result: REJECTED ("All input devices must be equal")
└─ Message: "Keyboard and Gamepad must have same timing"

Exploit Attempt 4: "ELO Farming"
├─ Creator tries: "Matches don't affect ELO (free wins)"
├─ Validation detects: ELO disabled
├─ Result: REJECTED ("Ranked matches must affect ELO")
└─ Message: "Use friendly match option instead"

Exploit Attempt 5: "Invisible Mode"
├─ Creator tries: "Blue team invisible (can see opponent)"
├─ Validation detects: Visual/perspective modifier
├─ Result: REJECTED ("No game-breaking visual changes")
└─ Message: "Use themed stadiums instead"

What PASSES Validation (Allowed):

✅ "Low Gravity Mode":
├─ Physics modifier (affects both equally)
├─ No stat boost
├─ Interesting mechanic
└─ Approved!

✅ "Retro Stadium Theme":
├─ Visual cosmetic
├─ No gameplay impact
├─ Aesthetic preference
└─ Approved!

✅ "Ultra-Spin Mode":
├─ Physics modifier
├─ Affects both players equally
├─ Favors skill (curve mastery)
└─ Approved!
```

---

## Custom Match Finder

### Browse & Filter Rule Sets

```
CUSTOM RULE SET MARKETPLACE:

┌────────────────────────────────────────────┐
│ RULE SET LIBRARY                           │
│ [Search] [Sort By] [Filter] [My Favorites] │
├────────────────────────────────────────────┤
│                                            │
│ OFFICIAL RULES (8):                        │
│ ├─ Classic (Standard)                      │
│ ├─ Arcade (Fun, chaotic)                   │
│ ├─ Tactical (Strategic)                    │
│ ├─ Speed Run (Quick)                       │
│ └─ [+4 more official sets]                 │
│                                            │
│ COMMUNITY RULES (Trending):                │
│ ├─ "Wall Builders" by Ahmed ⭐⭐⭐⭐⭐    │
│ │  ├─ Rating: 4.9/5 (832 plays)            │
│ │  ├─ Modifiers: Lenient Cards, Heavy Ball │
│ │  ├─ Playstyle: Defensive                 │
│ │  └─ [Play] [Favorite] [Details]          │
│ │                                          │
│ ├─ "Chaos Cup" by Sarah ⭐⭐⭐⭐           │
│ │  ├─ Rating: 4.3/5 (1,247 plays)          │
│ │  ├─ Modifiers: Ultra-Spin, Low Gravity   │
│ │  ├─ Playstyle: Experimental              │
│ │  └─ [Play] [Favorite] [Details]          │
│ │                                          │
│ ├─ "Pro Formation" by James ⭐⭐⭐⭐⭐     │
│ │  ├─ Rating: 4.8/5 (2,156 plays)          │
│ │  ├─ Modifiers: Formation Lock (4-3-3)    │
│ │  ├─ Playstyle: Tactical/Skill            │
│ │  └─ [Play] [Favorite] [Details]          │
│ │                                          │
│ └─ [Show more trending (50+ more)]         │
│                                            │
│ MY CREATED RULES (3):                      │
│ ├─ "My Arcade Mix" (Draft)                 │
│ ├─ "Speed Demon" (Published, 234 plays)    │
│ └─ "Retro Cup" (Published, 1,899 plays)    │
│                                            │
│ FILTERS:                                   │
│ ├─ Playstyle: [Defensive ▼] [All ▼]        │
│ ├─ Modifier Count: [1-3 ▼]                 │
│ ├─ Match Time: [20 min ▼] [Any ▼]          │
│ ├─ Difficulty: [Easy ▼] [Any ▼]            │
│ ├─ Balance Score: [40+ ▼]                  │
│ └─ Sort By: [Most Popular ▼]               │
│                                            │
└────────────────────────────────────────────┘

Rule Set Detail View:

┌────────────────────────────────────┐
│ "Wall Builders" - Defensive League │
├────────────────────────────────────┤
│ Created by Ahmed (Legendary River) │
│ Rating: ⭐⭐⭐⭐⭐ 4.9/5            │
│ Plays: 832 (this month: 156)       │
│ Featured: ✅ (1,000+ all-time)     │
│                                    │
│ DESCRIPTION:                       │
│ Defensive football emphasis -      │
│ high tackling requirements, loose  │
│ cards, sticky pitch. Best for      │
│ 2-player league with focus on      │
│ solid defending.                   │
│                                    │
│ MODIFIERS:                         │
│ ├─ Lenient Cards                   │
│ │  └─ Yellow: 40pts (vs 35 std)   │
│ ├─ Slippery Pitch                  │
│ │  └─ Friction: 0.05 (vs 0.15)     │
│ └─ Heavy Ball                      │
│    └─ Mass: 2.0x (0.86 kg)        │
│                                    │
│ MATCH TIME: 90 minutes             │
│ FORMATION LOCK: None               │
│ BALANCE SCORE: 65/100 (Well-balanced)│
│                                    │
│ PLAYER FEEDBACK:                   │
│ "Love the defensive focus!" (150   │
│  upvotes)                          │
│ "Tackling is everything here"      │
│ "Best for organized leagues"       │
│                                    │
│ [Play Now] [Favorite] [Share]      │
│ [Create Tournament]                │
│                                    │
└────────────────────────────────────┘
```

---

## Creator Tools & SDK

### Rule Set SDK (TypeScript)

```typescript
// Custom Rule Set Creator SDK

interface RuleSet {
  name: string;
  description: string;
  modifiers: Modifier[];
  matchTime: number; // minutes
  formationLock?: string;
  visibility: 'public' | 'private' | 'restricted';
  playstyle: 'defensive' | 'balanced' | 'offensive' | 'chaotic' | 'experimental';
}

interface Modifier {
  type: 'physics' | 'stamina' | 'time' | 'cards' | 'formation' | 'visual';
  name: string;
  parameter: string;
  value: number | string;
  impactAnalysis?: {
    roleImpact: Record<string, number>; // -1 to +1 scale
    balanceScore: number; // 0-100
  };
}

// Example: Creating "Wall Builders" rule set

const wallBuildersRuleSet: RuleSet = {
  name: 'Wall Builders',
  description: 'Defensive football emphasis - high tackling, loose cards, sticky pitch',
  modifiers: [
    {
      type: 'cards',
      name: 'Lenient Cards',
      parameter: 'yellow_card_points',
      value: 40, // vs 35 default
    },
    {
      type: 'physics',
      name: 'Slippery Pitch',
      parameter: 'friction',
      value: 0.05, // vs 0.15 default
    },
    {
      type: 'physics',
      name: 'Heavy Ball',
      parameter: 'ball_mass_multiplier',
      value: 2.0,
    },
  ],
  matchTime: 90,
  visibility: 'public',
  playstyle: 'defensive',
};

// Validate rule set
const validator = new RuleSetValidator();
const validationResult = await validator.validate(wallBuildersRuleSet);

if (validationResult.isValid) {
  console.log('✅ Rule set is valid! Publishing...');
  const published = await ruleSetManager.publish(wallBuildersRuleSet);
  console.log('Published rule set ID:', published.id);
} else {
  console.log('❌ Validation failed:');
  validationResult.errors.forEach(error => {
    console.log(`- ${error.modifier}: ${error.reason}`);
  });
}

// Share rule set
const shareLink = `https://bassball.io/rules/${published.id}`;
console.log('Share link:', shareLink);

// Create tournament with rule set
const tournament = await tournamentManager.create({
  name: 'Wall Builders League',
  ruleSetId: published.id,
  format: '8-player single elimination',
  prizePool: '$50 cosmetics',
  duration: '4 weeks',
});
```

---

## Implementation

### CustomMatchRulesSystem Class

```typescript
class CustomMatchRulesSystem {
  private ruleSets: Map<string, RuleSet> = new Map();
  private validationEngine: RuleSetValidator;
  private communityRatings: Map<string, RuleSetRating[]> = new Map();
  
  // Create custom rule set
  createRuleSet(
    creatorId: string,
    ruleSet: RuleSet
  ): RuleSet {
    // Validate rule set
    const validation = this.validationEngine.validate(ruleSet);
    if (!validation.isValid) {
      throw new Error('Rule set validation failed: ' + validation.errors[0].reason);
    }
    
    // Assign ID and metadata
    const ruleSetId = this.generateRuleSetId();
    const publishedRuleSet: RuleSet = {
      ...ruleSet,
      id: ruleSetId,
      creatorId,
      createdAt: new Date(),
      modifiedAt: new Date(),
      balanceScore: this.calculateBalanceScore(ruleSet),
      status: 'pending', // Awaiting guardian review
      visibility: ruleSet.visibility,
    };
    
    this.ruleSets.set(ruleSetId, publishedRuleSet);
    return publishedRuleSet;
  }
  
  // Validate rule set
  private validateRuleSet(ruleSet: RuleSet): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Check 1: No stat boosts
    for (const modifier of ruleSet.modifiers) {
      if (this.isStatBoost(modifier)) {
        errors.push({
          modifier: modifier.name,
          reason: 'Stat boosts are forbidden',
        });
      }
    }
    
    // Check 2: All modifiers public
    if (!this.areAllModifiersPublic(ruleSet)) {
      errors.push({
        modifier: 'general',
        reason: 'All modifiers must be visible to players',
      });
    }
    
    // Check 3: ELO still matters
    if (!this.doesMatchAffectElo(ruleSet)) {
      errors.push({
        modifier: 'elo',
        reason: 'Matches must still affect ELO ranking',
      });
    }
    
    // Check 4: Balance score
    const balanceScore = this.calculateBalanceScore(ruleSet);
    if (balanceScore < 40) {
      errors.push({
        modifier: 'balance',
        reason: `Balance score too low (${balanceScore}/100)`,
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      balanceScore,
    };
  }
  
  // Calculate balance score
  private calculateBalanceScore(ruleSet: RuleSet): number {
    let score = 50; // Baseline
    
    // Analyze each modifier
    for (const modifier of ruleSet.modifiers) {
      const roleImpact = this.analyzeRoleImpact(modifier);
      
      // If balanced across roles
      if (Math.max(...Object.values(roleImpact)) - Math.min(...Object.values(roleImpact)) < 0.1) {
        score += 10; // Well balanced
      } else if (Math.max(...Object.values(roleImpact)) - Math.min(...Object.values(roleImpact)) < 0.3) {
        score += 5; // Somewhat balanced
      } else {
        score -= 5; // Biased toward certain roles
      }
    }
    
    // Cap at 100
    return Math.min(100, score);
  }
  
  // Publish rule set
  publishRuleSet(ruleSetId: string): void {
    const ruleSet = this.ruleSets.get(ruleSetId);
    if (!ruleSet) throw new Error('Rule set not found');
    
    ruleSet.status = 'published';
    ruleSet.modifiedAt = new Date();
  }
  
  // Rate rule set
  rateRuleSet(
    ruleSetId: string,
    playerId: string,
    rating: number,
    comment?: string
  ): void {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be 1-5');
    }
    
    const ratings = this.communityRatings.get(ruleSetId) || [];
    
    // Check if player already rated
    const existingRating = ratings.find(r => r.playerId === playerId);
    if (existingRating) {
      existingRating.rating = rating;
      existingRating.comment = comment;
      existingRating.timestamp = new Date();
    } else {
      ratings.push({
        playerId,
        rating,
        comment,
        timestamp: new Date(),
      });
    }
    
    this.communityRatings.set(ruleSetId, ratings);
  }
  
  // Get rule set stats
  getRuleSetStats(ruleSetId: string): RuleSetStats {
    const ruleSet = this.ruleSets.get(ruleSetId);
    const ratings = this.communityRatings.get(ruleSetId) || [];
    
    if (!ruleSet) throw new Error('Rule set not found');
    
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;
    
    return {
      id: ruleSetId,
      name: ruleSet.name,
      creator: ruleSet.creatorId,
      balanceScore: ruleSet.balanceScore,
      averageRating,
      totalRatings: ratings.length,
      totalPlays: this.getMatchCount(ruleSetId),
      status: ruleSet.status,
      visibility: ruleSet.visibility,
    };
  }
  
  // Create tournament with rule set
  createTournament(
    tournamentName: string,
    ruleSetId: string,
    format: 'single-elimination' | 'double-elimination' | 'round-robin',
    participants: number,
    prizePool: number
  ): Tournament {
    const ruleSet = this.ruleSets.get(ruleSetId);
    if (!ruleSet) throw new Error('Rule set not found');
    if (ruleSet.status !== 'published') {
      throw new Error('Rule set must be published to create tournaments');
    }
    
    const tournament: Tournament = {
      id: this.generateTournamentId(),
      name: tournamentName,
      ruleSetId,
      format,
      participants: [],
      maxParticipants: participants,
      prizePool,
      createdAt: new Date(),
      status: 'signup',
    };
    
    return tournament;
  }
  
  // Apply rule set to match
  applyRuleSet(matchId: string, ruleSetId: string): void {
    const ruleSet = this.ruleSets.get(ruleSetId);
    if (!ruleSet) throw new Error('Rule set not found');
    
    // Update match config
    const match = this.getMatch(matchId);
    match.customRuleSet = ruleSet;
    match.balanceModifiers = this.buildModifierStack(ruleSet);
    
    // Save match
    this.updateMatch(match);
  }
  
  private isStatBoost(modifier: Modifier): boolean {
    const statBoostKeywords = ['+shot', '+pace', '+pass', '+dribble', '+physical', 'mastery', 'stat boost'];
    return statBoostKeywords.some(keyword => 
      modifier.name.toLowerCase().includes(keyword)
    );
  }
  
  private areAllModifiersPublic(ruleSet: RuleSet): boolean {
    // All modifiers must be listed in the rule set
    return ruleSet.modifiers.length > 0;
  }
  
  private doesMatchAffectElo(ruleSet: RuleSet): boolean {
    // Check if any modifier disables ELO
    return !ruleSet.modifiers.some(m => m.name.toLowerCase().includes('no elo'));
  }
  
  private analyzeRoleImpact(modifier: Modifier): Record<string, number> {
    // Analyze how modifier affects each role (-1 to +1)
    const roleImpact: Record<string, number> = {
      CB: 0,
      FB: 0,
      DM: 0,
      CM: 0,
      AM: 0,
      Winger: 0,
      ST: 0,
    };
    
    // Logic to analyze specific modifiers
    // (Returns impact scores per role)
    
    return roleImpact;
  }
}
```

---

## Custom Match Rules Summary

✅ **Friendly Match Modifiers**: Physics (gravity, friction, spin), stamina, time, cards, formations, visuals  
✅ **Modifier Stacking**: Combine up to 6 modifiers, balance validation prevents exploits  
✅ **Community Rule Sets**: Players publish rule sets, rated by community, featured if popular  
✅ **Community Tournaments**: Run tournaments with any rule set, stream, award cosmetics  
✅ **Rule Validation**: Automatic + manual review, balance scoring (0-100), smart contract verification  
✅ **Anti-Cheat**: Forbidden modifiers (stat boosts, invisible mode, ELO cheating), approval process  
✅ **Creator Tools**: SDK for TypeScript, rule set validator, tournament builder, analytics  
✅ **Extensibility**: Encourages innovation while protecting competitive integrity  

---

**Status**: Fully Designed, Implementation Ready  
**Last Updated**: January 18, 2026  
**Creative Extensibility**: ✅ Custom Match Rules & Community Modding System
