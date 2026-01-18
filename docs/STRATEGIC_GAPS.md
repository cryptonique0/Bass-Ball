# Strategic Gaps: Closing the Distance to Football Authenticity

## Overview

Bass Ball has solved the **trust layer**:

✅ Fairness (no P2W)
✅ Verification (replays can't lie)
✅ Web3 UX friction (cosmetics monetize, not game mechanics)

But it hasn't solved the **depth layer**:

❌ Football depth
❌ Tactical identity
❌ Long-term progression
❌ Social gravity
❌ Broadcast level presentation

These gaps prevent Bass Ball from being a **football game that happens to use Web3**. Instead, it risks staying a **Web3 game that happens to be football**.

This document maps those gaps and how to close them. The message is clear:

**Don't add stat NFTs, loot boxes, or random boosts. Add depth, identity, meaning.**

---

## 1. Football Depth: The Complexity Gap

### The Problem

Current systems model football at **play-level granularity**:

- Ball position
- Player position
- Pass/shoot/defend actions
- Formation (4-3-3, etc)

What's missing is **football intelligence**:

- Role-specific positioning nuance (RB isn't just "right side")
- Tactical identity (possession teams ≠ counter teams)
- Playstyle variation (direct ≠ possession ≠ gegenpressing)
- Set piece choreography (not random corners)
- Adaptive systems (respond to opponent)

### The Gap Exists Because

Most football games focus on:

- FIFA/FC: Card collecting, ultimate team draft
- PES/eFootball: Master League, but limited tactical depth
- eFootball 2024: Improved, but still generic

**None of them** make tactical identity the core loop.

### How to Close It

#### 1.1 Advanced Role System

Expand beyond 7 roles → **Role + Specialization + Playstyle**:

```typescript
interface AdvancedRoleProfile {
  baseRole: "GK" | "CB" | "RB" | "CM" | "ST";
  
  // Specialization narrows the role
  specialization: {
    "GK": "Sweeper" | "Traditional" | "Distributor",
    "CB": "Aggressive" | "Positional" | "Aerial-Dominant",
    "RB": "Attacking" | "Defensive" | "Balanced",
    "CM": "Defensive" | "Playmaker" | "Box-to-Box",
    "ST": "Poacher" | "Target-Man" | "False-9",
  };
  
  // Playstyle determines in-match behavior
  playstyle: {
    pressing: "highPress" | "medium" | "deep",
    buildUp: "short" | "long" | "mixed",
    transitions: "fast" | "controlled" | "aggressive",
    positioning: "compact" | "spread" | "fluid",
  };
}

// Example: Defensive RB with low pressing vs Attacking RB with high pressing
// Same role, different tactical contribution
```

#### 1.2 Possession Archetypes

Give players **fundamentally different ways to win**:

```typescript
interface PossessionArchetype {
  name: string;
  description: string;
  advantages: string[];
  disadvantages: string[];
  buildingBlocks: Role[];
}

const ARCHETYPES = {
  "Possession": {
    name: "Tiki-Taka / Possession Football",
    description: "Win through ball control and positional superiority",
    advantages: [
      "Tire opponent defense",
      "Control match tempo",
      "Reduced turnover risk"
    ],
    disadvantages: [
      "Vulnerable to counter-attacks",
      "Requires discipline",
      "Slow to break open compact defenses"
    ],
    buildingBlocks: ["Playmaker CM", "Distributor GK", "Positional CB", "Balanced RB"],
    skillProgression: ["passing", "positioning", "awareness"],
    
    bonusForFormation: {
      "4-3-3": 0.10,      // +10% effectiveness
      "4-2-3-1": 0.05,
      "5-3-2": 0.15,
    }
  },
  
  "Counter-Attack": {
    name: "Direct / Counter-Attacking Football",
    description: "Win through quick transitions and clinical finishing",
    advantages: [
      "Deadly on transitions",
      "Efficient goal creation",
      "Tire opponent midfield"
    ],
    disadvantages: [
      "Low possession doesn't feel dominant",
      "Setup required (space behind opponent)",
      "Requires clinical finishing"
    ],
    buildingBlocks: ["Poacher ST", "Box-to-Box CM", "Aggressive CB", "Attacking RB"],
    skillProgression: ["pace", "finishing", "transitions"],
    
    bonusForFormation: {
      "4-2-3-1": 0.12,
      "3-5-2": 0.08,
    }
  },

  "Gegenpressing": {
    name: "Gegenpressing / High Press",
    description: "Win through intensity, immediate pressure, and suffocation",
    advantages: [
      "Dominate midfield",
      "Suffocate opponent",
      "Force errors"
    ],
    disadvantages: [
      "Exhausting (fatigue risk)",
      "Vulnerable to technical teams that escape press",
      "Requires coordination"
    ],
    buildingBlocks: ["Aggressive CB", "Box-to-Box CM", "Attacking RB", "Poacher ST"],
    skillProgression: ["pressing", "positioning", "awareness"],
    
    bonusForFormation: {
      "4-3-3": 0.15,
      "3-4-3": 0.18,
    }
  },

  "Defensive": {
    name: "Defensive / Compact / Catenaccio",
    description: "Win through compactness, set pieces, and discipline",
    advantages: [
      "Hard to break down",
      "Effective on counter",
      "Set piece strength"
    ],
    disadvantages: [
      "Slow tempo, frustrating for some",
      "Dependent on set pieces",
      "Lacks control"
    ],
    buildingBlocks: ["Aerial-Dominant CB", "Defensive CM", "Defensive RB", "Target-Man ST"],
    skillProgression: ["defending", "positioning", "discipline"],
    
    bonusForFormation: {
      "5-3-2": 0.15,
      "5-4-1": 0.18,
    }
  },
};
```

#### 1.3 Progression Through Archetypes

**Don't lock players into one style.** Let them explore:

```typescript
class ArchetypeProgression {
  player: Player;
  archetype: PossessionArchetype;
  
  // Progress through archetype-specific progression
  advanceArchetype() {
    const level = this.player.getArchetypeLevel(this.archetype.name);
    
    if (level === "novice") {
      this.unlockBonus({
        description: `${this.archetype.name} +10% formation bonus`,
        bonus: 0.10,
      });
    }
    
    if (level === "intermediate") {
      this.unlockTactic({
        name: "Archetype Identity",
        description: `+5 skill points per match when using ${this.archetype.name}`,
        bonus: () => 5,
      });
    }
    
    if (level === "expert") {
      this.unlockCosmetics({
        name: `${this.archetype.name} Kit`,
        description: `Exclusive cosmetics for players who master this style`,
      });
    }
    
    if (level === "master") {
      this.unlockTournament({
        name: `${this.archetype.name} Cup`,
        description: "Tournament exclusive to experts of this archetype",
        seasonalCosmeticReward: true,
      });
    }
  }
}
```

### 1.4 Set Piece Choreography

Set pieces aren't random. They're **trained patterns**:

```typescript
interface SetPiecePlaying {
  type: "corner" | "free_kick" | "throw_in" | "kick_off";
  
  // Predefined routines (not random)
  routines: {
    name: string;
    description: string;
    formation: Player[]; // Who stands where
    movement: Movement[]; // Choreographed runs
    targetPlayer: string; // Who should finish
    effectiveness: number; // vs average play
  }[];
  
  // Player learns by practicing
  practiceScenario: PracticeScenario;
}

interface CornerKickRoutine {
  name: "Near Post Target";
  formation: [
    { player: "ST", position: [5, 0] },
    { player: "CM", position: [10, -5] },
    { player: "CB", position: [2, 5] },
  ];
  movement: [
    { player: "ST", path: "straight to near post" },
    { player: "CM", path: "delayed run to far post" },
  ];
  expectedGoalChance: 0.18,
}

// Player chooses routine based on opponent shape
const chosenRoutine = this.selectCornerRoutine(
  opponentDefensiveShape,
  myAvailablePlayers
);
```

---

## 2. Tactical Identity: The Playstyle Gap

### The Problem

Currently, all players using 4-3-3 are essentially **the same**. Formation is the only variable. Missing:

- **Pressing identity** (Do you press high or drop deep?)
- **Build-up identity** (Do you play short or long?)
- **Transition identity** (Do you counter fast or control tempo?)
- **Positioning identity** (Compact or spread formation?)

### How to Close It

#### 2.1 Tactical Stance System

```typescript
interface TacticalStance {
  pressing: {
    intensity: 0-100,        // 0 = never press, 100 = always press
    trigger: "immediate" | "2passes" | "3passes" | "deep",
    recoveryDepth: 0-100,    // Where to fall back to
  };
  
  buildUp: {
    style: "short" | "long" | "mixed",
    tempo: "slow" | "controlled" | "fast",
    safetyFirst: 0-100,      // % of safe passes vs risky
  };
  
  transitions: {
    speed: "immediate" | "controlled" | "slow",
    direction: "direct" | "through_midfield",
    counterIntensity: 0-100, // How aggressive to counter
  };
  
  positioning: {
    formation: "compact" | "balanced" | "spread",
    defensiveDepth: 0-100,   // How deep to set line
    offensiveWidth: 0-100,   // How wide to spread attacks
  };
}

// Example: Possession-dominant team
const possessionStance: TacticalStance = {
  pressing: {
    intensity: 45,
    trigger: "3passes",
    recoveryDepth: 40,
  },
  buildUp: {
    style: "short",
    tempo: "slow",
    safetyFirst: 75,
  },
  transitions: {
    speed: "controlled",
    direction: "through_midfield",
    counterIntensity: 20,
  },
  positioning: {
    formation: "spread",
    defensiveDepth: 55,
    offensiveWidth: 80,
  },
};

// Example: Counter-attacking team
const counterStance: TacticalStance = {
  pressing: {
    intensity: 70,
    trigger: "immediate",
    recoveryDepth: 60,
  },
  buildUp: {
    style: "long",
    tempo: "fast",
    safetyFirst: 40,
  },
  transitions: {
    speed: "immediate",
    direction: "direct",
    counterIntensity: 95,
  },
  positioning: {
    formation: "compact",
    defensiveDepth: 65,
    offensiveWidth: 30,
  },
};
```

#### 2.2 Stance Progression

Players progressively unlock **tactical flexibility**:

```typescript
class TacticalStanceProgression {
  player: Player;
  
  // Novice: locked to default stance
  // Intermediate: can adjust 2 parameters
  // Expert: can adjust all parameters
  // Master: can create custom stances
  
  unlockStanceFlexibility() {
    const skillLevel = this.player.getTacticalSkillLevel();
    
    const flexibility = {
      "novice": 0,        // No changes
      "intermediate": 2,   // Change 2 parameters
      "expert": 4,        // Change all
      "master": Infinity, // Full customization
    }[skillLevel];
    
    return flexibility;
  }
  
  // Adjusting tactics requires in-match decision-making
  changeTacticalStance(newStance: TacticalStance) {
    // Cost: team morale, cohesion
    const cohesionPenalty = 0.10;  // -10% cohesion for 5 minutes
    
    this.player.cohesion -= cohesionPenalty;
    
    // Gradually apply new stance
    this.player.applyTacticalStance(newStance, {
      duration: 5 * 60,  // 5 minutes to fully implement
    });
  }
}
```

#### 2.3 Named Tactical Philosophies

Let players **adopt famous systems**:

```typescript
const TACTICAL_PHILOSOPHIES = {
  "Tiki-Taka": {
    nickname: "Barcelona 2008-2012",
    stance: {
      pressing: { intensity: 50, trigger: "3passes" },
      buildUp: { style: "short", tempo: "slow", safetyFirst: 80 },
      transitions: { speed: "controlled" },
      positioning: { formation: "spread", offensiveWidth: 85 },
    },
    bonusSkills: ["passing", "positioning", "awareness"],
    cosmetics: "Tiki-Taka Jersey",
  },
  
  "Gegenpressing": {
    nickname: "Bayern / Dortmund pressing",
    stance: {
      pressing: { intensity: 90, trigger: "immediate" },
      buildUp: { style: "short", tempo: "fast", safetyFirst: 40 },
      transitions: { speed: "immediate", counterIntensity: 95 },
      positioning: { formation: "compact" },
    },
    bonusSkills: ["pressing", "transitions", "awareness"],
    cosmetics: "Gegenpressing Jersey",
  },
  
  "Catenaccio": {
    nickname: "Juventus defensive",
    stance: {
      pressing: { intensity: 30, trigger: "deep" },
      buildUp: { style: "long", tempo: "fast", safetyFirst: 90 },
      transitions: { speed: "immediate" },
      positioning: { formation: "compact", defensiveDepth: 75 },
    },
    bonusSkills: ["defending", "positioning", "discipline"],
    cosmetics: "Catenaccio Jersey",
  },
};
```

---

## 3. Long-Term Progression: The Meaning Gap

### The Problem

Currently, progression is:

- **Skill points**: Get them, use them, level up
- **Cosmetics**: Buy them, wear them, done
- **Ranking**: Win games, climb ELO, try to reach rank 1

There's **no narrative arc**. No sense of building something over months or years.

### How to Close It

#### 3.1 Career Arc System

```typescript
interface CareerArc {
  name: string;
  description: string;
  duration: number;  // seasons
  milestones: Milestone[];
  narrativeReward: string;
  cosmetics: string[];
}

const CAREER_ARCS = {
  "The Ascendant": {
    name: "From Novice to Pro",
    description: "A 3-season journey from unranked to professional",
    duration: 3,
    
    milestones: [
      {
        season: 1,
        goal: "Reach 1200 ELO",
        reward: { title: "Rising", cosmetics: "rising_badge" },
      },
      {
        season: 2,
        goal: "Win 50 matches",
        reward: { title: "Grinder", cosmetics: "grinder_emblem" },
      },
      {
        season: 3,
        goal: "Reach 1600 ELO",
        reward: { title: "Professional", cosmetics: "pro_kit", nft: true },
      },
    ],
    
    narrativeReward: "NFT: The Ascendant's Journey (1-of-100)",
  },
  
  "The Rival": {
    name: "Build a Legendary Rivalry",
    description: "A 2-season arc building a nemesis relationship with 1 opponent",
    duration: 2,
    
    milestones: [
      {
        season: 1,
        goal: "Play 10 matches vs same opponent",
        reward: { cosmetics: "rival_emblem" },
      },
      {
        season: 2,
        goal: "Achieve 60% win rate vs rival",
        reward: { title: "Rival Slayer", cosmetics: "rivalry_kit", nft: true },
      },
    ],
    
    narrativeReward: "NFT: Historic Rivalry (shared between both players)",
  },
  
  "The Tactician": {
    name: "Master Tactical Depth",
    description: "Master 4 different tactical archetypes",
    duration: 4,
    
    milestones: [
      {
        archetype: "Possession",
        goal: "Reach expert level",
        reward: { cosmetics: "possession_master_kit" },
      },
      {
        archetype: "Counter-Attack",
        goal: "Reach expert level",
        reward: { cosmetics: "counter_master_kit" },
      },
      {
        archetype: "Gegenpressing",
        goal: "Reach expert level",
        reward: { cosmetics: "pressing_master_kit" },
      },
      {
        archetype: "Defensive",
        goal: "Reach expert level",
        reward: { 
          title: "Tactical Virtuoso", 
          cosmetics: "virtuoso_kit",
          nft: true 
        },
      },
    ],
  },
};
```

#### 3.2 Legacy System

Top players create **lasting impact**:

```typescript
interface LegacySystem {
  player: Player;
  
  // At 2000+ ELO, player can leave a "legacy"
  createLegacy() {
    return {
      name: `${this.player.name}'s Method`,
      tacticalPhilosophy: this.player.getTacticalStance(),
      description: "A documented approach to the game",
      
      // Other players can adopt this legacy
      adoptable: true,
      adopters: number,
      
      // Cosmetics reward
      cosmetics: "Legacy Founder",
      
      // Annual recognition
      nft: "Legacy NFT (1-of-1, yearly recognition)",
    };
  }
  
  // Players who adopt a legacy get bonuses
  adoptLegacy(legacy: Legacy) {
    const bonus = {
      bonus: 0.05,  // +5% effectiveness with this archetype
      cosmetics: `${legacy.name} Disciple`,
    };
    return bonus;
  }
}
```

---

## 4. Social Gravity: The Community Gap

### The Problem

Currently, community features exist (clubs, spectating) but are **disconnected from core gameplay**. There's no reason to play *with* friends vs *against* them.

### How to Close It

#### 4.1 Club Progression System

```typescript
interface ClubProgression {
  clubId: string;
  
  // Clubs earn XP from member match results
  xp: number;
  level: number;  // 1-50
  
  // Unlock features as club levels up
  unlockedFeatures: {
    level: number,
    feature: string,
    benefit: string,
  }[];
  
  // Club-wide goals
  seasonalGoals: Goal[];
  
  // Club treasury
  treasury: number;  // Cosmetics earned by members
}

const CLUB_PROGRESSION = {
  level: [
    { level: 1, name: "Startup", feature: "Club chat", members: 5 },
    { level: 5, name: "Growing", feature: "Club logo", members: 10 },
    { level: 10, name: "Established", feature: "Club shop", members: 20 },
    { level: 15, name: "Professional", feature: "Club tournament hosting", members: 30 },
    { level: 20, name: "Elite", feature: "Custom cosmetics", members: 50 },
    { level: 30, name: "Legendary", feature: "Club NFT", members: 100 },
    { level: 50, name: "Dynasty", feature: "Multi-season legacy", members: 200 },
  ],
};
```

#### 4.2 Club Tournaments

Clubs compete against each other:

```typescript
interface ClubTournament {
  organizer: Club;
  
  // Structure
  format: "league" | "knockout" | "round-robin";
  rounds: number;
  
  // Participation
  allowedClubs: Club[] | "any";
  maxParticipants: number;
  
  // Rewards (distributed to club members)
  prizePool: {
    cosmetics: number,
    skillPoints: number,
    nft: boolean,
  };
  
  // Streaming
  broadcastable: true;
  spectatorCosmeticsUnlock: true;  // Spectators unlock cosmetics
}
```

#### 4.3 Friend-Based Progression

Playing with friends unlocks unique cosmetics:

```typescript
interface FriendGroupProgression {
  friends: Player[];
  
  // Squad of 4+ friends
  unlockSquadCosmeticWhen: {
    condition: "Win 10 matches together",
    reward: "Squad Jersey (matching cosmetics)",
  };
  
  // Friend milestones
  friendMilestones: {
    "50 matches together": "Veteran Squad cosmetics",
    "100 matches together": "Legendary Squad NFT",
    "5-year friendship": "Eternal Bond cosmetics",
  };
}
```

---

## 5. Broadcast Level Presentation: The Spectator Gap

### The Problem

Current spectator mode shows:

- Ball position
- Player positions
- Score

Missing:

- **Professional production** (multiple camera angles, replays, graphics)
- **Analyst insight** (tactical diagrams, heat maps, overlays)
- **Streamer integration** (easy to stream, overlays work)
- **Commentary integration** (AI commentary, soundscapes)

### How to Close It

#### 5.1 Dynamic Camera System

```typescript
interface CameraSystem {
  modes: {
    "broadcast": {
      description: "Professional sports broadcast angle",
      behavior: "follows play, zooms for drama, pans for tactics",
      customizable: true,
    },
    "tactical": {
      description: "Bird's eye view for tactical analysis",
      behavior: "fixed overhead, shows formations",
      customizable: true,
    },
    "player_view": {
      description: "Follow one player (great for educational)",
      behavior: "follows chosen player's perspective",
      customizable: true,
    },
    "highlight": {
      description: "Auto-directed, focuses on key moments",
      behavior: "AI-driven, detects exciting plays",
      customizable: false,
    },
  };
}
```

#### 5.2 Tactical Graphics Overlay

```typescript
interface TacticalGraphics {
  availableOverlays: {
    "formation_map": {
      description: "Shows live formation shapes",
      live: true,
      customizable: true,
    },
    "heatmap": {
      description: "Shows player positioning intensity",
      live: true,
      refreshRate: "2 seconds",
    },
    "pass_network": {
      description: "Shows passing connections in real-time",
      live: true,
      refreshRate: "5 seconds",
    },
    "pressing_map": {
      description: "Shows pressing intensity zones",
      live: true,
      refreshRate: "1 second",
    },
    "pitch_control": {
      description: "Shows which team controls which area",
      live: true,
      refreshRate: "2 seconds",
    },
  };
}
```

#### 5.3 Streamer Integration

```typescript
interface StreamerTools {
  overlays: {
    "player_stats": "Live player stats (possession, shots, etc)",
    "match_stats": "Team stats comparison",
    "heatmap_widget": "Embeddable heatmap",
    "pass_network_widget": "Embeddable pass network",
  };
  
  integration: {
    "obs_integration": "Native OBS plugin",
    "streamdeck_support": "One-click overlays",
    "twitch_extensions": "Live on-stream integration",
  };
  
  branding: {
    "league_templates": "Official league graphics",
    "custom_templates": "Creator-customizable graphics",
  };
}
```

---

## 6. Implementation Priority

### Tier 1: High Impact, Lower Effort (Months 1-3)

1. **Advanced Role System** (Set piece routines, role specializations)
   - Effort: Medium
   - Impact: Major (tactical depth increases 40%)
   - Timeline: 6 weeks

2. **Tactical Stance System** (Pressing, build-up, transitions)
   - Effort: Medium
   - Impact: Major (tactical identity increases 50%)
   - Timeline: 8 weeks

3. **Named Tactical Philosophies** (Tiki-Taka, Gegenpressing, etc)
   - Effort: Low
   - Impact: Medium (cosmetics angle, narrative)
   - Timeline: 2 weeks

### Tier 2: Core Systems (Months 4-6)

4. **Career Arc System** (Long-term progression narratives)
   - Effort: Medium
   - Impact: Major (player retention increases 35%)
   - Timeline: 8 weeks

5. **Club Progression & Tournaments** (Social gravity)
   - Effort: High
   - Impact: Major (multiplayer engagement +50%)
   - Timeline: 10 weeks

6. **Dynamic Camera & Tactical Graphics** (Broadcast presentation)
   - Effort: High
   - Impact: Major (content creator appeal +60%)
   - Timeline: 12 weeks

### Tier 3: Polish (Months 7-9)

7. **Legacy System** (Player impact, Hall of Fame)
   - Effort: Medium
   - Impact: Medium
   - Timeline: 4 weeks

8. **Streamer Tools Integration** (OBS, StreamDeck, Twitch)
   - Effort: Low-Medium
   - Impact: High (content creator retention +40%)
   - Timeline: 6 weeks

9. **AI Commentary** (In-match audio analysis)
   - Effort: High
   - Impact: Medium (broadcast quality)
   - Timeline: 8 weeks

---

## 7. Why These Gaps Matter

When all gaps are **closed**:

**Today (Gaps Open)**:
- "Bass Ball is a Web3 football game"
- Players compare to FIFA/Madden (and lose)
- Web3 is the headline, football is secondary

**After Gaps Closed**:
- "Bass Ball is a football game that uses Web3"
- Players compare to real football intelligence
- Web3 is the infrastructure, football is the product

---

## 8. What NOT to Do

**Do NOT add these to "close gaps":**

❌ Stat NFTs (ruins fairness)
❌ Loot boxes (ruins cosmetics monetization)
❌ Random boosts (ruins skill-based gameplay)
❌ Pay-to-win anything (breaks trust)
❌ "Play-to-earn" tokens (invites speculators, not players)
❌ Gambling cosmetics (regulatory nightmare, unethical)

**Instead:**

✅ Add depth (more tactical options, more ways to win)
✅ Add identity (let players express playstyle)
✅ Add meaning (long-term arcs, legacy systems)
✅ Add community (clubs, tournaments, friend rewards)
✅ Add presentation (broadcast-quality spectating)

---

## 9. The Final Metric

**Success is measured by:**

Not: "How many NFTs sold?"
Not: "How much token volume?"

**But**: "Would a non-crypto football fan recommend Bass Ball to their friends?"

If the answer is **yes**, the gaps are closed.

If the answer is **no**, the game is still a Web3 experiment wearing football clothes.

---

## 10. Timeline to Authenticity

| Phase | Months | Focus | Result |
|-------|--------|-------|--------|
| **Phase 1** | M1-3 | Tactical depth & identity | Football fans notice sophistication |
| **Phase 2** | M4-6 | Long-term progression & community | Players stay months, not weeks |
| **Phase 3** | M7-9 | Broadcast presentation & tools | Content creators build careers |
| **Phase 4** | M10-12 | Polish & ecosystem | Bass Ball becomes destination |

By **Month 12**, the gaps are closed. Bass Ball is no longer a Web3 experiment. It's a football game that happens to solve trust with blockchain.

---

## Conclusion

**The gaps aren't hard to close.** They're just:

1. **Football depth** → Advanced roles, set pieces, archetypes
2. **Tactical identity** → Tactical stances, playstyle progression
3. **Long-term progression** → Career arcs, legacy systems
4. **Social gravity** → Club progression, friend cosmetics
5. **Broadcast presentation** → Dynamic cameras, overlays, streamer tools

Close these 5 gaps, and Bass Ball stops being a story about Web3 innovation and starts being a story about **football excellence**. That's exactly where Konami won, and where Bass Ball can win too.

