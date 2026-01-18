# 🎮 Bass Ball - Konami Features Documentation

A complete guide to all Konami Pro Evolution Soccer-style features implemented in Bass Ball.

## 📋 Table of Contents

1. [Game Modes](#game-modes)
2. [Team Management](#team-management)
3. [Tactics System](#tactics-system)
4. [Training & Development](#training--development)
5. [Online Divisions](#online-divisions)
6. [Stadium Management](#stadium-management)
7. [Transfer Market](#transfer-market)
8. [Match Events & Mechanics](#match-events--mechanics)
9. [Weather System](#weather-system)
10. [Challenges & Events](#challenges--events)
11. [Smart Contract Integration](#smart-contract-integration)

---

## Game Modes

### 🎮 Available Game Modes

#### 1. **Quick Match**
- One-off matches against AI opponents
- Customizable difficulty levels (Amateur, Professional, Legendary)
- Variable weather conditions
- Automatic team selection or custom lineup
- Match rewards (coins, experience)

#### 2. **MyClub**
- Card-collecting team management system
- Squad building with up to 23 players
- Transfer market integration
- Contract management for each player
- Training sessions for squad development
- Seasonal rewards and upgrades

#### 3. **Master League**
- 38-week competitive season
- Week-by-week fixture schedule
- Dynamic league standings
- Transfer window mechanics
- Stadium upgrades and management
- Prize money based on final position
- Injuries and player form tracking

#### 4. **Tournaments**
- Cup competitions (32 teams)
- Knockout rounds (Group → Round of 16 → Quarters → Semis → Finals)
- Tournament-specific rewards
- Weekly tournament rotation
- Leaderboard rankings

#### 5. **Online Divisions**
- Cross-platform multiplayer
- 6 competitive divisions (Professional → Division 3)
- Ranking system based on points
- Season rewards (coins, player packs, contracts)
- Matchmaking by skill level
- Seasonal ranking resets

#### 6. **Training**
- Focused practice sessions
- 6 training types:
  - Shooting Training (↑ Shooting)
  - Passing Drills (↑ Passing)
  - Dribbling (↑ Dribbling)
  - Defensive Training (↑ Defense)
  - Physical Training (↑ Physical)
  - Speed Work (↑ Pace)
- Squad-wide training options
- Effectiveness ratings (0-100%)
- Fatigue management

---

## Team Management

### MyClub Squad System

**Squad Structure:**
- 11 Starting Players
- 12 Substitute Players
- Total: 23 Player Squad

**Squad Management Features:**
- Formation Selection (4-4-2, 4-3-3, 3-5-2, etc.)
- Player Positioning
- Squad Chemistry
- Overall Rating Calculation
- Squad Value Tracking
- Win Rate Monitoring

**Player Contracts:**
- Weekly wage deduction
- Contract duration (1-5 years)
- Loyalty bonuses
- Performance bonuses
- Contract renewal options

---

## Tactics System

### 🎯 Tactical Framework

**Three Tactical Dimensions:**

#### 1. Defensive Style
- DEFENSIVE (Deep formation, Defensive play)
- BALANCED (Mixed defense and attack)
- ATTACKING (High pressing, Aggressive)

#### 2. Build-Up Play
- SHORT PASS (Possession-based)
- BALANCED (Mixed play)
- LONG BALL (Direct play, Counter-attacks)

#### 3. Pressure Mode
- LOW (Relax defense, Counter-ready)
- MEDIUM (Normal, Balanced)
- HIGH (Aggressive pressing, High risk)

**Tactical Parameters:**
- **Width** (1-10): Control attacking/defending width
- **Depth** (1-10): Control pressing line position

---

## Online Divisions

### 🏆 Competitive Ranking System

**Division Structure:**
- Professional (Top 250)
- Professional II (251-1000)
- Professional III (1001-2500)
- Division 1 (2501-5000)
- Division 2 (5001-10000)
- Division 3 (10001+)

**Season Rewards Based on Final Position:**
- Top 1: 50,000 coins, 10 packs, Elite contract
- Top 3: 30,000 coins, 6 packs, Gold contract
- Top 10: 20,000 coins, 4 packs
- Participation: 5,000 coins, 1 pack

---

## Match Events & Mechanics

### 📺 Event Types

- **Goals**: Both teams can score
- **Saves**: Goalkeeper saves
- **Yellow/Red Cards**: Disciplinary actions
- **Injuries**: Player removal
- **Substitutions**: Player changes
- **VAR Reviews**: Controversial goals/cards
- **Set Pieces**: Corners, Free Kicks, Penalties
- **Offsides**: Blocking actions

**VAR System:**
- Goal: 15% chance of review
- Red Card: 50% chance of review
- Penalty: 25% chance of review

---

## Weather System

### 🌤️ Dynamic Weather Conditions

**Weather Types:**
- **Clear**: Ideal conditions
- **Rainy**: Ball control -20%, Passing -15%
- **Snowy**: All actions -25%
- **Foggy**: Passing -10%
- **Stormy**: Ball control -30%, Wind effects +15m/s

**Wind Effects:**
- Ball trajectory affected
- Long passes deflected
- Shot swerve increased
- Up to 25 m/s wind speed

---

## Challenges & Events

### 📋 Challenge System

**Daily Challenges:**
- 3-5 objectives per day
- Reset every 24 hours
- Rewards: 3-5K coins, occasional packs

**Weekly Challenges:**
- 5-7 objectives per week
- Reset every 7 days
- Rewards: 15-25K coins, guaranteed packs

**Seasonal Challenges:**
- Major objectives (100 goals, etc.)
- Reset every 4 weeks
- Rewards: 50-100K coins, elite packs

### 🎁 Event Calendar

Upcoming events displayed with:
- Event date and time
- Event type and description
- Duration and rewards

### 🎯 Battle Pass

**100 Levels per Season**
- Level 1-50: Free rewards
- Level 51-100: Premium rewards
- XP-based progression
- 4-week duration

---

## Smart Contract Integration

### 🔗 Blockchain Features

**NFT System (ERC721):**
- Player cards as NFTs
- Tradeable between accounts
- Rarity tiers (Bronze to Elite)
- Stat tracking on-chain

**Token System (ERC20 - BBALL):**
- Total Supply: 1 Billion
- Match rewards
- Premium transactions
- Staking opportunities

**Base Chain Deployment:**
- Mainnet: ChainID 8453
- Testnet: ChainID 84532 (Sepolia)
- Sub-cent transaction costs
- L2 optimized

---

## 💰 Economy Summary

### Earning Coins
- Quick Match: 500-2,000
- MyClub Match: 1,000-5,000
- Master League: 5,000-15,000
- Online Win: 2,000-5,000
- Challenges: 3,000-50,000
- Tournaments: 10,000-100,000

### Spending
- Player Cards: 50K-500K
- Training: 1K-5K per session
- Stadium Upgrades: 100K-500K
- Contracts: 10K-50K

---

## 🎮 Control Guide

**Match Controls:**
- Pass: Space
- Shoot: Enter
- Dribble: Arrow Keys
- Slide Tackle: C
- Change Player: Tab

**Menu Navigation:**
- Pause: Esc
- Tactics: T
- Substitutions: Sub
- Formation: F

---

## 📊 Features Summary

✅ **Game Modes**: 6 complete modes (Quick Match, MyClub, Master League, Tournaments, Online, Training)

✅ **Team Management**: Squad building, contracts, chemistry

✅ **Tactics**: Dynamic system with presets and customization

✅ **Training**: 6 training types with player development

✅ **Online**: Divisions, ranking, matchmaking

✅ **Stadium**: Management, upgrades, upgrades tracking

✅ **Market**: Scout, transfer, youth academy

✅ **Match Events**: 12 event types, VAR system, injuries, cards

✅ **Weather**: 5 weather conditions with gameplay effects

✅ **Challenges**: Daily, weekly, seasonal with rewards

✅ **Battle Pass**: 100-level progression system

✅ **Web3**: NFT players, token rewards, blockchain integration

---

**Bass Ball © 2024** | Web3 Football Management on Base Chain
