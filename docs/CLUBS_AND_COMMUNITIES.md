# 🏛️ Clubs & Communities System

**Player-Formed Clubs, Club ELO, Club Tournaments, Shared Treasury, and Guild Management**

Bass Ball's club system creates **community gravity**: players form teams, build reputation, compete together, and share cosmetics—all without stat-boosting monetization.

---

## Table of Contents

1. [Club System Overview](#club-system-overview)
2. [Club Creation & Management](#club-creation--management)
3. [Club ELO & Rankings](#club-elo--rankings)
4. [Club Tournaments](#club-tournaments)
5. [Shared Treasury System](#shared-treasury-system)
6. [Club Roles & Permissions](#club-roles--permissions)
7. [Club Halls of Fame](#club-halls-of-fame)
8. [Implementation](#implementation)

---

## Club System Overview

### What is a Club?

A **club** is a player-formed organization (2-50 members) that:
- Competes in team-based rankings (Club ELO)
- Hosts internal tournaments
- Shares cosmetics via shared treasury
- Builds competitive legacy & hall of fame
- Enables social bonding & team strategy

```
┌────────────────────────────────────────────────┐
│          CLUB HIERARCHY                        │
├────────────────────────────────────────────────┤
│                                                │
│  GLOBAL RANKINGS                               │
│  ├─ Individual Players (ELO)                   │
│  └─ Clubs (Club ELO)                           │
│                                                │
│  CLUB STRUCTURE                                │
│  ├─ President (Owner, 1)                       │
│  ├─ Generals (Officers, 2-5)                   │
│  ├─ Members (Players, 10-50)                   │
│  └─ Reserves (Bench, unlimited)                │
│                                                │
│  CLUB COMPETITION                              │
│  ├─ Club ELO (aggregate player skill)          │
│  ├─ Club Tournament (8-16 teams)               │
│  └─ Seasonal Cup (championship bracket)        │
│                                                │
│  CLUB TREASURY                                 │
│  ├─ Shared Cosmetics Pool                      │
│  ├─ Cosmetic Equity (% per player)             │
│  └─ No Stat Boost Allowed                      │
│                                                │
└────────────────────────────────────────────────┘
```

### Club Tier System

```
Tier        Members    Club ELO       Prestige
─────────────────────────────────────────────────
Bronze      2-5        1000-1199      Community
Silver      3-10       1200-1399      Regional
Gold        5-20       1400-1599      National
Platinum    8-30       1600-1799      Elite
Diamond     15-40      1800-1999      Legendary
Master      20-50      2000+          Hall of Fame

Tier Progression:
├─ Unlocked by avg member mastery
├─ Diamond requires: 80%+ avg mastery (very hard)
├─ Cosmetics per tier: Member limit increases
└─ Prestige badges shown on club badge
```

---

## Club Creation & Management

### Club Creation Flow

```
CREATE A CLUB

Step 1: Club Details
┌────────────────────────────────┐
│ Club Name: [Enter name]         │
│ Club Tag: [3-4 letters, unique]│
│ Club Icon: [Upload 512x512]    │
│ Region: [Select region]         │
│ Description: [Optional bio]     │
│                                 │
│ [Create Club]  [Cancel]         │
└────────────────────────────────┘

Club Requirements:
├─ Minimum 250 ELO personal rating
├─ 20+ matches played
├─ No active bans
└─ $0 cost (free to create)

Upon Creation:
├─ You become President
├─ Starting Club ELO: 1000
├─ Starting Members: 1 (you)
├─ Treasury: $0 (earn through play)
└─ Can invite up to 10 members
```

### Club Management Interface

```
CLUB MANAGEMENT PANEL (President Only)

┌─────────────────────────────────────────────┐
│ CLUB: [Club Name] (Gold Tier)               │
│ Tag: [CLUB] | Founded: Dec 2025             │
├─────────────────────────────────────────────┤
│                                             │
│ OVERVIEW:                                   │
│ ├─ Members: 14/20                           │
│ ├─ Club ELO: 1,450 (Gold I)                │
│ ├─ Avg Member Mastery: 68%                 │
│ ├─ Treasury: $340 (cosmetics budget)        │
│ └─ Rank: #234 Global                        │
│                                             │
│ MEMBERS TAB:                                │
│ ├─ [Add Member]  [Invite Link]              │
│ ├─ [Manage Roles] [Kick Member]             │
│ └─ Show: 14 Members ▼                       │
│                                             │
│   President: You (President)                │
│   General: Ahmed (100% mastery) [⋮]        │
│   General: Sarah (95% mastery) [⋮]         │
│   Member: James (78% mastery) [⋮]          │
│   Member: David (72% mastery) [⋮]          │
│   ... 9 more members                        │
│                                             │
│ TREASURY TAB:                               │
│ ├─ Current: $340                            │
│ ├─ Source: Win bonuses + cosmetic sales     │
│ ├─ [Purchase Cosmetic]  [Transfer]          │
│ └─ History: Last purchase Dec 18, 2025      │
│                                             │
│ TOURNAMENTS TAB:                            │
│ ├─ [Create Tournament]                      │
│ ├─ Active: Club Cup 2026 (Signup)          │
│ └─ Past: 3 tournaments completed            │
│                                             │
│ SETTINGS:                                   │
│ ├─ [Edit Club Info]                         │
│ ├─ [Change Icon]                            │
│ ├─ [Set Discord Server]                     │
│ ├─ [Disband Club]                           │
│ └─ Password Protected: ✓                    │
│                                             │
└─────────────────────────────────────────────┘
```

### Member Invitation & Joining

```
INVITE PLAYERS TO CLUB:

Option 1: Direct Invitation
├─ Search player by name/ID
├─ Send invitation (instant)
├─ Invitee receives notification
├─ Invitee can accept/decline
└─ Upon accept: Added to roster

Option 2: Invite Link
├─ Generate shareable link (24-hour validity)
├─ Share via Discord/Farcaster
├─ Click link → Join club (no approval needed)
├─ Max 10 auto-joins per link
└─ President sees all joins in log

Option 3: Public Application
├─ Player sees club in global directory
├─ Player submits application
├─ President receives notification
├─ President can accept/decline
└─ Upon accept: Player joins roster

Leave Club Flow:
├─ Player clicks [Leave Club]
├─ Confirmation: "Leave [Club]?"
├─ Upon leaving:
│  ├─ Removed from roster
│  ├─ Keep all personal cosmetics (transferred)
│  ├─ Share of club treasury paid out (proportional)
│  └─ Previous achievements remain on profile
└─ Notification sent to President
```

---

## Club ELO & Rankings

### Club ELO Calculation

```
CLUB ELO FORMULA:

Club ELO = Weighted Average of Member Ratings

Formula:
club_elo = Σ(member_elo × weight) / Σ(weight)

Where weight = {
  President: 2.0x multiplier
  General: 1.5x multiplier
  Member: 1.0x multiplier
  Reserve: 0.5x multiplier
}

Example Club (10 members):
─────────────────────────────────────────
Role      Count   Avg ELO   Weight   Total
─────────────────────────────────────────
President   1     1,650      2.0x    3,300
Generals    2     1,550      1.5x    4,650
Members     5     1,450      1.0x    7,250
Reserves    2     1,200      0.5x    1,200
─────────────────────────────────────────
Weighted ELO = (3,300 + 4,650 + 7,250 + 1,200) / 
               (2.0 + 3.0 + 5.0 + 1.0)
             = 16,400 / 11.0
             = 1,491 (Gold II Club ELO)
```

### Club Rankings & Tiers

```
┌─── GLOBAL CLUB RANKINGS ───────────────────┐
│ Rank │ Club Name       │ ELO  │ Members   │
├─────────────────────────────────────────────┤
│ 1    │ Apex Predators  │2,150 │ 48/50     │
│ 2    │ Shadow Elite    │2,089 │ 42/50     │
│ 3    │ United Force    │2,034 │ 50/50     │
│ 4    │ Rising Storm    │1,987 │ 35/40     │
│ 5    │ Championship    │1,945 │ 38/40     │
│ ...  │ ...             │ ...  │ ...       │
│ 234  │ [Your Club]     │1,450 │ 14/20     │
│ ...  │ ...             │ ...  │ ...       │
└─────────────────────────────────────────────┘

Tier Badges:
🟩 Diamond Club (ELO 1800+)
🟩 Platinum Club (ELO 1600-1799)
🟨 Gold Club (ELO 1400-1599)
🟨 Silver Club (ELO 1200-1399)
🟪 Bronze Club (ELO 1000-1199)
```

### Club ELO Changes

```
Club ELO Update Mechanism:

When member plays ranked match:
1. Member's ELO changes by ±X
2. Club ELO recalculates using new member rating
3. Club ELO can gain/lose 0.5-2 points per member match
4. Change is visible on club page (live update)

Example:
Member at 1,500 ELO wins match → +18 ELO → 1,518
Club ELO changes: 1,450 → 1,451 (+1 from member's contribution)

Club Promotion (Tier Up):
├─ Reach ELO threshold for next tier
├─ Automatic promotion (no ceremony needed)
├─ Unlock: More members allowed, higher treasury cap
└─ New tier badge shows on club profile

Club Demotion (Tier Down):
├─ Fall below current tier ELO minimum
├─ Automatic demotion after 7 days at low ELO
├─ Penalty: Can't start tournaments for 3 days
└─ Restriction: Can't invite new members for 24 hours
```

---

## Club Tournaments

### Club Tournament Creation

```
CREATE A CLUB TOURNAMENT:

┌──────────────────────────────────────────┐
│ CREATE TOURNAMENT                        │
├──────────────────────────────────────────┤
│                                          │
│ Tournament Name: [Club Cup 2026]         │
│ Format:         [Bracket / Round Robin]  │
│ Participants:   [8 / 16 / 32 players]   │
│ Fee:           [Free / $100 club fund]   │
│ Prize Pool:    [Auto-calculated]         │
│                                          │
│ Schedule:                                │
│ ├─ Signup Start: [Date]                 │
│ ├─ Signup End:   [Date]                 │
│ ├─ Tournament:   [Date]                 │
│ └─ Duration:     [1 week / 2 weeks]     │
│                                          │
│ Rules:                                   │
│ ├─ Min Mastery: [50% / 70% / 80%]       │
│ ├─ Min Rating:  [1000 / 1200 / 1400]   │
│ ├─ Formation:   [Any / Preset / Free]   │
│ └─ Substitutions: [On / Off]             │
│                                          │
│ [Create] [Cancel]                        │
│                                          │
└──────────────────────────────────────────┘

Prize Distribution (8-player):
├─ 1st Place: $60 + Champion Badge
├─ 2nd Place: $30 + Runner-up Badge
├─ 3rd Place: $15 + Finalist Badge
└─ Participation: $5 each (4 losers)
```

### Tournament Structure

```
CLUB CUP 2026 (Single Elimination - 8 Players)

Signup Phase: Dec 20-22, 2025
├─ Signups open (any club member)
├─ Minimum 8 players required
└─ Max 16 players (if full, lottery draw)

Semi-Finals (Dec 24):
┌──────────────┬──────────────┐
│ Player 1     │              │
│      vs      ├─ Winner 1 ──┐
│ Player 8     │              │
└──────────────┴──────────────┘

┌──────────────┬──────────────┐
│ Player 4     │              │
│      vs      ├─ Winner 2 ──┤
│ Player 5     │              │
└──────────────┴──────────────┘

Final (Dec 26):
           ┌─────────────────┐
Winner 1 ──┤                 ├── CHAMPION 🏆
           │  Best of 3      │
Winner 2 ──┤                 ├── Prize: $60
           └─────────────────┘

Consolation Bracket (for 3rd place):
├─ Player 2 (lost semis)
├─ Player 3 (lost semis)
└─ Winner = 3rd Place ($15)

Broadcast:
├─ Live spectating enabled
├─ Tournament director commentary
├─ Top-8 players featured
└─ Replay available 7 days post-tournament
```

### Seasonal Club Championship

```
SEASONAL CLUB CHAMPIONSHIP (Global):

Season: Every 3 months (Q1, Q2, Q3, Q4)

Qualification:
├─ Top 64 clubs by ELO auto-qualify
├─ Next 32 clubs compete in play-in (4-round)
├─ 8 clubs eliminated per round
└─ Total: Top 16 clubs advance to main bracket

Main Bracket (16-team):
├─ Group Stage: 4 groups of 4 clubs
├─ Round Robin: Each plays 3 matches
├─ Top 2 per group → Knockout Stage
├─ Semi-Finals: 2 matches
├─ Final: 1 match (best of 3)

Prize Pool: $10,000 total
├─ Champion: $5,000 + Trophy Badge NFT
├─ Runner-up: $2,500 + Finalist Badge NFT
├─ 3rd Place: $1,250 + Finalist Badge NFT
├─ 4th-8th: $250 each
└─ All Top-16: Cosmetic allocation (+$500)

Club Championship Trophies:
├─ Minted as ERC-721 (soul-bound to club)
├─ Year + rank (Season 1 Champion, Season 2 Runner-up)
├─ Metadata includes all tournament stats
└─ Perpetually displayed on club hall of fame
```

---

## Shared Treasury System

### Treasury Mechanics

```
CLUB TREASURY - Shared Cosmetics Fund

Source of Income:
├─ Tournament Prizes: 50% goes to club (50% to players)
├─ Club Cosmetic Sales: If club sells shared cosmetics
├─ Player Donations: Players can contribute personal funds
└─ Championship Bonuses: 10% of prize pool per season

Treasury Cap (by tier):
├─ Bronze: $100 max
├─ Silver: $250 max
├─ Gold: $500 max
├─ Platinum: $1,000 max
├─ Diamond: $2,500 max
└─ Master: Unlimited (no cap)

When Treasury Reaches Cap:
├─ New income is rejected
├─ Players can only withdraw/transfer
├─ Club can spend on cosmetics
└─ Excess prize money paid to players instead

Treasury Uses (Cosmetics Only):
✓ Purchase cosmetics for shared pool
✓ Purchase battle pass (season cosmetics)
✓ Mint club-exclusive cosmetics (club badge overlay)
✗ CANNOT boost stats
✗ CANNOT purchase power-ups
✗ CANNOT buy advantages
```

### Cosmetic Equity & Ownership

```
SHARED COSMETICS POOL:

Club has $340 treasury:
├─ President allocates cosmetics
├─ Example: Purchase Gold Season Jersey ($5 × 14 = $70)
├─ Jersey added to "Club Cosmetics" pool
└─ Any member can equip that jersey

Cosmetic Ownership:
├─ Club owns cosmetics (stored in treasury)
├─ Members get usage rights (not ownership)
├─ Members can equip during club events/tournaments
├─ If player leaves: Can't use club cosmetics anymore
│  (but keeps personal cosmetics)
└─ Cosmetics stay in club pool for next members

Equity Calculation (for Payouts):
When player leaves or club dissolves:
equity = (treasury_size) × (player_contribution % of total)

Example:
├─ Treasury: $500
├─ Player contributed: $100 (of $500 total contributions)
├─ Player equity: $500 × (100/500) = $100 payout
└─ Player receives their equity share + personal cosmetics
```

### Treasury Management UI

```
TREASURY PANEL (General/President Access):

┌─────────────────────────────────────────┐
│ CLUB TREASURY: $340 / $500 (Gold Cap)   │
├─────────────────────────────────────────┤
│                                         │
│ INCOME HISTORY:                         │
│ ├─ Mar 18 Tournament Prize: +$100       │
│ ├─ Mar 10 Player Donation (Ahmed): +$50 │
│ ├─ Mar 05 Cosmetic Sale: +$85          │
│ └─ Mar 01 Championship Bonus: +$105     │
│                                         │
│ SPENDING HISTORY:                       │
│ ├─ Mar 17 Gold Jersey (×14): -$70       │
│ ├─ Mar 08 Season Pass (×1): -$10        │
│ └─ Mar 01 Club Badge Overlay: -$25      │
│                                         │
│ [Purchase Cosmetic] [Donate Funds]      │
│ [Payout to Members] [Transfer]          │
│                                         │
│ SHARED COSMETICS:                       │
│ ├─ Gold Season Jersey (14 uses)         │
│ ├─ Season Pass Cosmetics (active)       │
│ └─ Club Badge Overlay (20 uses)         │
│                                         │
│ [More Info] [Audit Log]                 │
│                                         │
└─────────────────────────────────────────┘
```

---

## Club Roles & Permissions

### Role Hierarchy

```
PRESIDENT (1)
├─ Permissions:
│  ├─ Invite/Remove members
│  ├─ Assign roles (General, Member, Reserve)
│  ├─ Manage treasury (spend, allocate)
│  ├─ Create/manage tournaments
│  ├─ Edit club info (name, icon, description)
│  ├─ Disband club (after 30-day warning)
│  └─ Designate new President (only)
└─ Restrictions:
   └─ Can't be removed (unless disband)

GENERAL (2-5)
├─ Permissions:
│  ├─ Invite members (up to 3 per day)
│  ├─ Remove members (up to 2 per day)
│  ├─ View treasury (read-only)
│  ├─ Create tournaments
│  ├─ Manage tournament signups
│  └─ Post club announcements
└─ Restrictions:
   └─ Can't spend treasury or edit club info

MEMBER (10-50)
├─ Permissions:
│  ├─ Participate in tournaments
│  ├─ Use shared cosmetics
│  ├─ Contribute to treasury (optional)
│  └─ View club stats/history
└─ Restrictions:
   ├─ Can't invite members
   ├─ Can't manage treasury
   └─ Can't create tournaments

RESERVE
├─ Permissions:
│  ├─ View club (limited access)
│  └─ Join as Member (on acceptance)
└─ Restrictions:
   └─ Can't participate in tournaments
   └─ Can't use club cosmetics
```

---

## Club Halls of Fame

### Seasonal Club Hall of Fame

```
CLUB HALL OF FAME (Season 1 - Gold Tier)

Club: [Club Name]
Founded: Dec 2025 | Tier: Gold | ELO: 1,450

TOURNAMENT CHAMPIONS:
├─ Club Cup 2026:
│  ├─ Champion: Ahmed (1,650 ELO)
│  ├─ Prize: $60 + Champion Badge NFT
│  └─ Runner-up: Sarah (1,550 ELO)
│
├─ Club Invitational #1:
│  ├─ Champion: James (1,480 ELO)
│  ├─ Prize: $40 + Champion Badge NFT
│  └─ Runner-up: David (1,420 ELO)

TOP PERFORMERS (This Season):
├─ Most Wins: Ahmed (45-12 record, 79% win rate)
├─ Best Mastery Gain: Sarah (45% → 72%)
├─ Most Tournaments Won: James (3 tournaments)
├─ ELO Climber: Carlos (1,100 → 1,380)
└─ Most Valuable Member: Ahmed (tournament trophy)

CLUB ACHIEVEMENTS:
├─ Reached Gold Tier: Mar 2026
├─ 50+ Wins (Cumulative): Mar 10, 2026
├─ 100% Member Participation: Feb 2026
└─ Hosted 5+ Tournaments: Mar 2026

HISTORICAL STATS:
├─ Total Members (Lifetime): 28
├─ Total Matches: 1,234
├─ Total Wins: 678 (55% win rate)
├─ Club Peak ELO: 1,487 (Mar 18)
└─ Total Revenue: $4,230
```

### All-Time Club Hall of Fame (Perpetual)

```
ALL-TIME CLUB HALL OF FAME

CHAMPIONSHIP TROPHIES:
├─ Season 1 Champion (Jan 2026): [Club Name]
│  └─ ELO: 1,987 | Members: 34
├─ Season 2 Runner-up (Apr 2026): [Club Name]
│  └─ ELO: 1,923 | Members: 29
├─ Season 3 Champion (Jul 2026): [Club Name]
│  └─ ELO: 2,034 | Members: 42
└─ Season 4 (Current): TBD

LEGENDARY CLUBS (Diamond Tier+):
├─ Apex Predators (2,150 ELO) - 3 titles
├─ Shadow Elite (2,089 ELO) - 1 title
├─ United Force (2,034 ELO) - 1 title
├─ Rising Storm (1,987 ELO) - 1 title
└─ Championship (1,945 ELO) - 2 titles

HALL OF FAME MEMBERS:
├─ ProGamer2K (5 seasons, 2 club championships)
├─ SkillMaster (4 seasons, tournament champion 3×)
├─ TheTactician (3 seasons, club co-founder)
└─ FastBreak (2 seasons, ELO climber +500)
```

---

## Implementation

### ClubSystem Class

```typescript
class ClubSystem {
  private clubs: Map<string, Club> = new Map();
  private clubEloRatings: Map<string, number> = new Map();
  private clubMembers: Map<string, ClubMember[]> = new Map();
  private clubTournaments: Map<string, Tournament[]> = new Map();
  private clubTreasuries: Map<string, number> = new Map();
  
  // Create club
  createClub(
    presidentId: string,
    clubName: string,
    clubTag: string,
    iconUrl: string
  ): Club {
    // Validate president (250+ ELO, 20+ matches)
    if (!this.validatePresident(presidentId)) {
      throw new Error('Player does not meet club creation requirements');
    }
    
    const clubId = this.generateClubId();
    const newClub: Club = {
      id: clubId,
      name: clubName,
      tag: clubTag,
      presidentId,
      icon: iconUrl,
      founded: new Date(),
      members: [{ playerId: presidentId, role: 'president' }],
      elo: 1000,
      tier: this.getTierFromElo(1000),
      treasury: 0,
      tournaments: [],
    };
    
    this.clubs.set(clubId, newClub);
    this.clubMembers.set(clubId, newClub.members);
    this.clubEloRatings.set(clubId, 1000);
    this.clubTreasuries.set(clubId, 0);
    
    return newClub;
  }
  
  // Add member to club
  addMemberToClub(
    clubId: string,
    playerId: string,
    invitingGeneralId: string
  ): void {
    const club = this.clubs.get(clubId);
    if (!club) throw new Error('Club not found');
    
    // Check permissions
    const inviter = this.clubMembers
      .get(clubId)
      ?.find(m => m.playerId === invitingGeneralId);
    if (inviter?.role !== 'president' && inviter?.role !== 'general') {
      throw new Error('Only President or General can invite');
    }
    
    // Check capacity
    if (club.members.length >= this.getMemberCapForTier(club.tier)) {
      throw new Error('Club at member capacity');
    }
    
    // Add member
    club.members.push({ playerId, role: 'member' });
    this.clubMembers.get(clubId)!.push({ playerId, role: 'member' });
  }
  
  // Update club ELO
  updateClubElo(clubId: string): void {
    const club = this.clubs.get(clubId);
    if (!club) return;
    
    const members = this.clubMembers.get(clubId) || [];
    let totalWeightedElo = 0;
    let totalWeight = 0;
    
    members.forEach(member => {
      const playerElo = this.getPlayerElo(member.playerId);
      const weight = this.getRoleWeight(member.role);
      
      totalWeightedElo += playerElo * weight;
      totalWeight += weight;
    });
    
    const newClubElo = totalWeightedElo / totalWeight;
    this.clubEloRatings.set(clubId, newClubElo);
    
    // Check tier change
    const newTier = this.getTierFromElo(newClubElo);
    if (newTier !== club.tier) {
      this.handleTierChange(clubId, club.tier, newTier);
      club.tier = newTier;
    }
  }
  
  // Create club tournament
  createTournament(
    clubId: string,
    presidentId: string,
    tournamentData: TournamentConfig
  ): Tournament {
    const club = this.clubs.get(clubId);
    if (!club) throw new Error('Club not found');
    
    // Only president can create
    if (club.presidentId !== presidentId) {
      throw new Error('Only President can create tournaments');
    }
    
    const tournament: Tournament = {
      id: this.generateTournamentId(),
      clubId,
      name: tournamentData.name,
      format: tournamentData.format,
      participants: [],
      bracket: null,
      prize_pool: this.calculatePrizePool(tournamentData.participants),
      start_date: tournamentData.startDate,
      end_date: tournamentData.endDate,
    };
    
    const tournaments = this.clubTournaments.get(clubId) || [];
    tournaments.push(tournament);
    this.clubTournaments.set(clubId, tournaments);
    
    return tournament;
  }
  
  // Handle tournament signup
  signupForTournament(
    tournamentId: string,
    playerId: string,
    clubId: string
  ): void {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    
    // Check player is in club
    const members = this.clubMembers.get(clubId) || [];
    const player = members.find(m => m.playerId === playerId);
    if (!player) throw new Error('Player not in club');
    
    // Check minimum requirements
    const playerMastery = this.getPlayerMastery(playerId);
    const playerElo = this.getPlayerElo(playerId);
    
    if (playerMastery < tournament.requirements.minMastery) {
      throw new Error('Insufficient mastery for tournament');
    }
    if (playerElo < tournament.requirements.minElo) {
      throw new Error('Insufficient ELO for tournament');
    }
    
    // Add to tournament
    tournament.participants.push({
      playerId,
      elo: playerElo,
      status: 'active',
    });
  }
  
  // Handle tournament completion
  completeTournament(tournamentId: string, results: TournamentResult[]): void {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) return;
    
    // Distribute prizes
    const prizeDistribution = this.calculatePrizeDistribution(
      tournament.prize_pool,
      results.length
    );
    
    results.forEach((result, index) => {
      const playerPrize = prizeDistribution[index];
      
      // 50% to player, 50% to club treasury
      this.awardToPlayer(result.playerId, playerPrize * 0.5);
      this.addToClubTreasury(tournament.clubId, playerPrize * 0.5);
      
      // Award badge NFT
      this.mintBadgeNFT(result.playerId, tournament.clubId, index + 1);
    });
    
    // Mark tournament complete
    tournament.status = 'completed';
  }
  
  // Manage treasury
  spendFromTreasury(
    clubId: string,
    presidentId: string,
    amount: number,
    cosmeticId: string
  ): void {
    const club = this.clubs.get(clubId);
    if (!club) throw new Error('Club not found');
    if (club.presidentId !== presidentId) {
      throw new Error('Only President can spend treasury');
    }
    
    const treasury = this.clubTreasuries.get(clubId) || 0;
    if (treasury < amount) {
      throw new Error('Insufficient treasury funds');
    }
    
    // Verify cosmetic has no stat impact
    const cosmetic = this.getCosmetic(cosmeticId);
    if (!this.isCosmetic_NoStatBoost(cosmetic)) {
      throw new Error('Cannot purchase stat-boosting items with club treasury');
    }
    
    // Spend and add to shared pool
    this.clubTreasuries.set(clubId, treasury - amount);
    this.addCosmeticToSharedPool(clubId, cosmeticId);
    
    // Log transaction
    this.logTreasuryTransaction(clubId, 'spend', amount, cosmeticId);
  }
  
  // Leave club (with payout)
  leaveClub(clubId: string, playerId: string): void {
    const club = this.clubs.get(clubId);
    if (!club) return;
    
    // Calculate equity share
    const treasury = this.clubTreasuries.get(clubId) || 0;
    const equity = this.calculatePlayerEquity(clubId, playerId);
    const payout = (equity / 100) * treasury;
    
    // Remove from club
    const members = this.clubMembers.get(clubId) || [];
    const memberIndex = members.findIndex(m => m.playerId === playerId);
    if (memberIndex !== -1) {
      members.splice(memberIndex, 1);
    }
    
    // Award payout
    this.awardToPlayer(playerId, payout);
    
    // Recalculate club ELO
    this.updateClubElo(clubId);
  }
  
  // Get club leaderboard
  getClubLeaderboard(limit: number = 100): Array<{
    rank: number;
    club: string;
    elo: number;
    tier: string;
    members: number;
  }> {
    const clubs = Array.from(this.clubEloRatings.entries())
      .map(([clubId, elo]) => {
        const club = this.clubs.get(clubId)!;
        return {
          clubId,
          elo,
          tier: this.getTierFromElo(elo),
          members: this.clubMembers.get(clubId)?.length || 0,
        };
      })
      .sort((a, b) => b.elo - a.elo)
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        club: this.clubs.get(entry.clubId)!.name,
        elo: Math.round(entry.elo),
        tier: entry.tier,
        members: entry.members,
      }));
    
    return clubs;
  }
  
  private getRoleWeight(role: string): number {
    switch (role) {
      case 'president': return 2.0;
      case 'general': return 1.5;
      case 'member': return 1.0;
      case 'reserve': return 0.5;
      default: return 1.0;
    }
  }
  
  private getTierFromElo(elo: number): string {
    if (elo >= 2000) return 'Master';
    if (elo >= 1800) return 'Diamond';
    if (elo >= 1600) return 'Platinum';
    if (elo >= 1400) return 'Gold';
    if (elo >= 1200) return 'Silver';
    return 'Bronze';
  }
  
  private getMemberCapForTier(tier: string): number {
    switch (tier) {
      case 'Bronze': return 5;
      case 'Silver': return 10;
      case 'Gold': return 20;
      case 'Platinum': return 30;
      case 'Diamond': return 40;
      case 'Master': return 50;
      default: return 5;
    }
  }
}
```

---

## Clubs & Communities Summary

✅ **Player-Formed Clubs**: Create, manage, grow from Bronze to Master tier  
✅ **Club ELO System**: Weighted average of member ratings with role multipliers  
✅ **Club Tournaments**: Bracket-style, seasonal championships, prize pools  
✅ **Shared Treasury**: Cosmetics-only fund, no stat-boosting allowed  
✅ **Seasonal Club Championship**: Global tournament (16-team bracket, $10k prize)  
✅ **Hall of Fame**: Perpetual club achievements, trophy NFTs, legendary status  
✅ **Community Gravity**: Builds retention through social bonding & team competition  

---

**Status**: Fully Designed, Implementation Ready  
**Last Updated**: January 18, 2026  
**Social Retention**: ✅ Community-Driven Engagement System
