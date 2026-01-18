# System Architecture & Data Flow

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React UI Layer                                │
├──────────────────────┬──────────────────────┬──────────────────┤
│ RewardsAndChallenges │ TeamSelectorEnhance  │ Dashboard Views   │
│ - Rewards Tab        │ - Reward Badge       │ - Season Status   │
│ - Challenges Tab     │ - Challenge Preview  │ - Leaderboards    │
│ - Real-time Updates  │ - Cosmetic Preview   │ - Statistics      │
└──────────┬───────────┴──────────┬───────────┴────────┬──────────┘
           │                      │                    │
           ▼                      ▼                    ▼
┌────────────────────────────────────────────────────────────────┐
│              Manager Layer (Singleton Pattern)                  │
├──────────────────┬──────────────────┬────────────────────────┤
│ SeasonManager    │ RewardManager    │ ChallengeManager       │
│ - Season CRUD    │ - Reward Tiers   │ - Challenge Creation   │
│ - Snapshots      │ - Cosmetics      │ - Progress Tracking    │
│ - Reset Logic    │ - Inventory      │ - Leaderboards        │
│ - Statistics     │ - Metadata Gen   │ - Statistics           │
└──────────┬───────┴────────┬────────┴──────────────┬──────────┘
           │                │                      │
           ▼                ▼                      ▼
┌────────────────────────────────────────────────────────────────┐
│                 LocalStorage Persistence                        │
├────────────────────┬────────────────┬──────────────────────────┤
│ season_management  │ reward_system  │ challenge_system        │
│ - Seasons          │ - Rewards      │ - Challenges            │
│ - Snapshots        │ - Claims       │ - Progress              │
│ - Reset History    │ - Cosmetics    │ - Completed             │
│ - Statistics       │ - Inventory    │ - Statistics            │
└────────────────────┴────────────────┴──────────────────────────┘
```

---

## Season Management Flow

```
User Initiates Season Reset
         │
         ▼
┌─────────────────────────────┐
│ 1. Create Season            │
│    - Define reset rules      │
│    - Set season timeline     │
│    - Theme configuration     │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ 2. Activate Season          │
│    - Change status to active │
│    - Start accepting matches │
│    - Initialize challenges   │
└────────────┬────────────────┘
             │
    [Regular Season Play]
        - Matches
        - Challenges
        - Progression
             │
             ▼
┌─────────────────────────────┐
│ 3. End Season               │
│    - Finalize rankings      │
│    - Close matches          │
│    - Prepare for reset      │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ 4. Take Snapshots (For All) │
│    - Archive final stats    │
│    - Capture ranking info   │
│    - Store badges earned    │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ 5. Apply Reset Rules        │
│    - Reset level (Y/N)      │
│    - Reset tier (Y/N)       │
│    - Preserve XP (X%)       │
│    - Reset matches (Y/N)    │
│    - Keep badges (Y/N)      │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ 6. Execute Reset            │
│    - Calculate new stats    │
│    - Apply adjustments      │
│    - Clean up old data      │
│    - Start new season       │
└─────────────────────────────┘
```

---

## Reward Distribution Flow

```
Match Completes
        │
        ├─→ Player Updates Challenge Progress
        │        │
        │        ▼
        │   Challenge Completed?
        │        │
        │        ├─→ YES: Claimable Reward
        │        │        (XP + Tokens)
        │        │
        │        └─→ NO: Continue Progress
        │
        └─→ Season Rankings Updated
                 │
                 ▼
         Final Ranking Achieved
                 │
                 ▼
         ┌──────────────────────┐
         │ Reward Tier Assigned  │
         ├──────────────────────┤
         │ Rank 1-5:  1000 XP   │
         │            500 TOK   │
         │            Exclusive │
         ├──────────────────────┤
         │ Rank 6-10:  500 XP   │
         │            250 TOK   │
         │            Badge     │
         ├──────────────────────┤
         │ Rank 11-25: 250 XP   │
         │            100 TOK   │
         │            Badge     │
         ├──────────────────────┤
         │ Rank 26-50: 100 XP   │
         │             50 TOK   │
         ├──────────────────────┤
         │ Rank 51-100: 50 XP   │
         │             25 TOK   │
         └──────────────────────┘
                 │
                 ▼
         ┌──────────────────────┐
         │ Rewards Created      │
         │ (Pending Claim)      │
         └────────┬─────────────┘
                  │
                  ▼
         User Claims Reward
                  │
                  ├─→ XP: Added to player
                  ├─→ Tokens: Added to wallet
                  └─→ Cosmetic: Added to inventory
```

---

## Challenge Lifecycle

```
Challenge Created
        │
        ├─→ Daily (24-hour)    OR    Weekly (7-day)
        │
        ▼
Challenge Assigned to Players
        │
        ├─→ Progress: 0/Target
        ├─→ Status: Active
        └─→ Expiry: Now + Duration
        
        │
        ▼
Player Takes Action
(Wins match, scores goal, etc.)
        │
        ▼
Challenge Progress Updated
        │
        ├─→ Progress: 1/Target
        │   (Not yet complete)
        │
        └─→ [Repeat until target reached]
        
        │
        ▼
Challenge Completed!
        │
        ├─→ Progress: Target/Target ✓
        ├─→ Status: Completed
        └─→ CompletedDate: Now
        
        │
        ▼
Player Claims Reward
        │
        ├─→ Status: Claimed
        ├─→ ClaimedDate: Now
        │
        ├─→ XP Added to player
        └─→ Tokens Added to wallet
        
        │
        ▼
Reward History Recorded
        │
        └─→ Query with getClaimedRewards()
```

---

## Data Model Relationships

```
Season
├─ seasonId (PK)
├─ seasonNumber
├─ seasonName
├─ status (planning|active|ended|archived)
├─ startDate
├─ endDate
├─ resetDate
└─ resetRules
    ├─ resetLevel
    ├─ resetTier
    ├─ preserveXP
    ├─ preserveXPPercentage
    ├─ resetMatches
    ├─ preserveBadges
    └─ resetStreak

    ▼ Creates many

PlayerSeasonSnapshot
├─ snapshotId (PK)
├─ seasonId (FK → Season)
├─ entityId
├─ entityType
├─ finalLevel
├─ finalTier
├─ finalXP
├─ totalMatches
├─ totalWins
├─ totalLosses
├─ finalRank
├─ badgesEarned
└─ snapshotDate


Challenge
├─ challengeId (PK)
├─ title
├─ type (daily|weekly)
├─ difficulty (easy|medium|hard)
├─ category (wins|goals|assists|rating|clean_sheets|variety|consistency)
├─ target
├─ reward.xp
├─ reward.tokens
├─ season (optional)
└─ createdDate

    ▼ Assigned to create

ChallengeProgress
├─ progressId (PK)
├─ challengeId (FK → Challenge)
├─ entityId
├─ entityType
├─ currentProgress
├─ targetProgress
├─ completed
├─ completedDate
├─ claimed
├─ claimedDate
├─ season
├─ startDate
└─ expiryDate


Reward
├─ rewardId (PK)
├─ type (xp|token|cosmetic_nft|cosmetic|badge)
├─ amount
├─ description
├─ rarity
├─ source (season_end|ranking|tier_promotion|challenge)
└─ metadata (optional)

    ▼ Creates

RewardClaim
├─ claimId (PK)
├─ entityId
├─ entityType
├─ reward (FK → Reward)
├─ claimed (boolean)
├─ claimedDate
└─ season


CosmeticNFT
├─ cosmeticId (PK)
├─ name
├─ description
├─ type (jersey|badge|border|effect|particles|aura)
├─ rarity (common|uncommon|rare|epic|legendary)
├─ colors.primary
├─ colors.secondary
├─ colors.accent
├─ season
├─ exclusive
├─ mintedDate
└─ tokenId (for blockchain)

    ▼ Can be multiple

PlayerCosmeticInventory
├─ entityId + cosmeticId (composite PK)
├─ claimedDate
└─ active (boolean)
```

---

## Component Hierarchy

```
Dashboard
├── SeasonStatusBanner
│   ├─ Season info
│   ├─ Reset countdown
│   └─ Status alerts
│
└── EnhancedTeamSelector
    ├── TeamCard (for each team)
    │   ├─ Team name
    │   ├─ RewardBadgeSmall
    │   ├─ ChallengePreview
    │   └─ CosmeticPreview
    │
    └── TeamSummaryWithRewards
        ├─ RewardStats
        ├─ ChallengeStats
        └─ ActionButtons
            ├─ View Rewards
            └─ View Challenges

RewardsAndChallenges (Modal/Overlay)
├── Header
│   ├─ Trophy icon
│   ├─ Title
│   ├─ Total completions
│   └─ Streak indicator
│
├── Tabs
│   ├─ Rewards (pending count badge)
│   └─ Challenges (active count badge)
│
└── TabContent
    ├─ RewardsTab (if active)
    │   ├─ PendingRewards
    │   │   └─ RewardCard (for each)
    │   ├─ CosmeticsInventory
    │   │   └─ CosmeticCard (for each)
    │   └─ ClaimedHistory
    │       └─ HistoryItem (for each)
    │
    └─ ChallengesTab (if active)
        ├─ DailyChallenges
        │   └─ ChallengeCard (for each)
        └─ WeeklyChallenges
            └─ ChallengeCard (for each)
```

---

## State Management Flow

```
User Action
    │
    ▼
Component Update
    │
    ├─→ Call Manager Method
    │        │
    │        ▼
    │    Update Internal State
    │        │
    │        ▼
    │    Save to localStorage
    │        │
    │        ▼
    │    Return updated data
    │
    ▼
Component Re-render
    │
    ├─→ Update UI
    ├─→ Show confirmation
    └─→ Trigger refresh interval
```

---

## API Integration Points

```
Current Systems                    New Systems
─────────────────                  ───────────
ProgressionManager ◄──────────────► RewardManager
  - Experience                       - Tier-up rewards
  - Levels                          - Cosmetics

LeagueManager ◄─────────────────► RewardManager
  - Rankings                         - Ranking rewards
  - Divisions                        - Tier placement

SeasonalRankingNFT ◄──────────────► SeasonManager
  - Season reference                 - Season tracking
  - Rankings                         - Reset rules

Match System ◄─────────────────► ChallengeManager
  - Match results                    - Progress updates
  - Player stats                     - Challenge completion

TeamSelector ◄─────────────────► All Managers
  - Team display                     - Status badges
  - Team selection                   - Preview data
```

---

## Storage Schema

```
localStorage['season_management']
├─ seasons: Map<string, Season>
├─ snapshots: Map<string, PlayerSeasonSnapshot[]>
├─ resetHistory: ResetEvent[]
└─ statistics: SeasonStatistics[]

localStorage['reward_system']
├─ rewards: Map<string, Reward>
├─ claims: Map<string, RewardClaim>
├─ cosmetics: Map<string, CosmeticNFT>
├─ inventory: Map<entityId, cosmeticId[]>
└─ metadata: Map<cosmeticId, ERC721Metadata>

localStorage['challenge_system']
├─ challenges: Map<string, Challenge>
├─ progress: Map<string, ChallengeProgress>
├─ completedChallenges: Map<entityId, challengeId[]>
└─ statistics: Map<entityId_season, CompletionStats>
```

---

## Performance Optimization

```
Operation                Optimization           Time
─────────────────────────────────────────────────────
Season Creation          In-memory Map          1ms
Snapshot Taking          Batch operations       5ms
Reset Execution          Parallel updates       10ms
Reward Distribution      Lazy evaluation        2ms
Challenge Progress       Direct update          1ms
Leaderboard Query        In-memory sort         5ms
Component Render         Memoization           50ms
Real-time Update          5s debounce           <10ms
Storage Persist          Async JSON.stringify  <20ms
```

---

## Error Handling

```
User Action
    │
    ▼
Try Manager Operation
    │
    ├─→ Validation Error
    │        │
    │        ▼
    │    Return null/false
    │        │
    │        ▼
    │    Show error UI
    │
    ├─→ Storage Error
    │        │
    │        ▼
    │    Log to console
    │        │
    │        ▼
    │    Graceful degradation
    │
    └─→ Success
             │
             ▼
         Return data
             │
             ▼
         Update UI
```

---

## Scaling Considerations

```
Players       Storage    Lookups    Updates
────────────────────────────────────────────
100           ~5 MB      O(1)       O(1)
1,000         ~50 MB     O(1)       O(1)
10,000        ~500 MB    O(1)       O(1)
100,000       ~5 GB      O(n log n) O(1)

Recommendations:
- Cache leaderboards in memory
- Archive old seasons to separate storage
- Use pagination for large lists
- Implement data cleanup schedule
```

This architecture is designed to be:
- **Modular**: Each system is independent
- **Scalable**: Uses efficient data structures
- **Persistent**: All data saved to localStorage
- **Fast**: Sub-second operations
- **Maintainable**: Clear separation of concerns
