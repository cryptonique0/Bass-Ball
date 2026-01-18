# Seasonal Rankings, Team Ownership & Customization - Integration Guide

**Implementation Path for Bass-Ball**

---

## Integration Overview

Three on-chain systems working together:

```
┌─────────────────────────────────────────┐
│  Match Completion                       │
│  (MatchLogger, On-Chain Storage)        │
└──────────────┬──────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
┌─────────────┐   ┌──────────────────┐
│ Calculate   │   │ Team Performance │
│ Player      │   │ Updates          │
│ Rankings    │   │                  │
└──────┬──────┘   └────────┬─────────┘
       │                   │
       ▼                   ▼
┌──────────────────────────────────────┐
│ Seasonal Ranking NFT Manager         │
│ - Award ranking NFTs                 │
│ - Track badges and achievements      │
│ - Store on-chain metadata            │
└──────────┬───────────────────────────┘
           │
           ├─────────────┬──────────────┐
           ▼             ▼              ▼
      Platinum      Gold           Silver
      NFTs          NFTs           NFTs
      (1-5)         (6-25)         (26-100)


Parallel Process:
┌─────────────────────────────────────────┐
│  Team Ownership & Customization         │
│  - Manage team visual identity          │
│  - Track ownership percentages          │
│  - Store customization history          │
└─────────────────────────────────────────┘
```

---

## Step 1: Database Setup

### Create Seasonal Data Schema

In your database (Prisma/MongoDB), add:

```prisma
model Season {
  id              String      @id @default(cuid())
  seasonId        String      @unique
  seasonName      String
  startDate       DateTime
  endDate         DateTime
  isActive        Boolean     @default(false)
  totalParticipants Int       @default(0)
  
  pointsPerGoal   Int         @default(5)
  pointsPerAssist Int         @default(3)
  pointsPerWin    Int         @default(10)
  pointsPerDraw   Int         @default(3)

  createdAt       DateTime    @default(now())
  
  seasonalNFTs    SeasonalNFT[]

  @@index([isActive])
}

model SeasonalNFT {
  id              String      @id @default(cuid())
  tokenId         String      @unique
  
  season          Season      @relation(fields: [seasonId], references: [id])
  seasonId        String
  
  playerId        String
  playerName      String
  playerTeam      String
  
  finalRank       Int
  badge           String      // platinum, gold, silver, bronze, participant
  totalPoints     Int
  matchesPlayed   Int
  goalsScored     Int
  assists         Int
  averageRating   Float
  
  owner           String      // wallet address
  previousOwners  String[]    @default([])
  
  // On-chain data
  contractAddress String?
  chainId         Int?
  txHash          String?
  blockNumber     Int?
  
  createdAt       DateTime    @default(now())
  
  @@index([playerId])
  @@index([seasonId])
  @@index([badge])
  @@index([finalRank])
}

model TeamOwnershipNFT {
  id              String      @id @default(cuid())
  tokenId         String      @unique
  
  teamId          String
  teamName        String
  teamCity        String
  
  owner           String      // wallet
  ownershipPercentage Float
  ownershipTier   String      // founder, major, minor, supporter
  
  votingRights    Boolean
  governanceVotingPower Int
  boardSeatEligible Boolean
  
  revenueShare    Float
  matchTicketAllowance Int
  merchandiseDiscount Int
  
  // Team stats
  teamWins        Int         @default(0)
  teamDraws       Int         @default(0)
  teamLosses      Int         @default(0)
  
  // On-chain
  contractAddress String?
  chainId         Int?
  txHash          String?
  
  createdAt       DateTime    @default(now())
  
  @@unique([teamId, owner])
  @@index([teamId])
  @@index([owner])
}

model TeamCustomization {
  id              String      @id @default(cuid())
  teamId          String      @unique
  teamName        String
  
  // Jersey colors
  jerseyHomePrimary String
  jerseyHomeSecondary String
  jerseyHomeAccent String
  
  jerseyAwayPrimary String?
  jerseyAwaySecondary String?
  jerseyAwayAccent String?
  
  // Team colors
  teamColorPrimary String
  teamColorSecondary String
  teamColorAccent String
  
  // Details
  teamStadium     String?
  teamMotto       String?
  teamCrest       String?
  
  // Current badge
  currentBadgeId  String?
  
  owner           String
  lastModified    DateTime    @default(now())
  
  createdAt       DateTime    @default(now())
  
  @@index([teamId])
}
```

---

## Step 2: API Endpoints

### Create REST endpoints for seasonal rankings

```typescript
// pages/api/seasons/index.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get all seasons
    const seasons = await prisma.season.findMany();
    res.json(seasons);
  } else if (req.method === 'POST') {
    // Create season
    const season = await prisma.season.create({
      data: req.body,
    });
    res.json(season);
  }
}

// pages/api/seasons/[seasonId]/leaderboard.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { seasonId } = req.query;
  const leaderboard = await prisma.seasonalNFT.findMany({
    where: { seasonId: seasonId as string },
    orderBy: { finalRank: 'asc' },
  });
  res.json(leaderboard);
}

// pages/api/teams/[teamId]/ownership.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = req.query;
  const ownership = await prisma.teamOwnershipNFT.findMany({
    where: { teamId: teamId as string },
  });
  res.json(ownership);
}

// pages/api/teams/[teamId]/customization.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = req.query;
  const customization = await prisma.teamCustomization.findUnique({
    where: { teamId: teamId as string },
  });
  res.json(customization);
}
```

---

## Step 3: Sync After Match Completion

### Update in match completion flow

```typescript
// lib/matchEngine.ts or components/MatchEndFlow.tsx

import { SeasonalRankingNFTManager } from '@/lib/seasonalRankingNFT';
import { TeamOwnershipNFTManager } from '@/lib/teamOwnershipNFT';

async function handleMatchCompletion(match: CompletedMatch) {
  // 1. Store match on-chain
  await storeMatchOnChain(match);

  // 2. Update seasonal rankings if active season
  const seasonalMgr = SeasonalRankingNFTManager.getInstance();
  const currentSeason = seasonalMgr.getCurrentSeason();

  if (currentSeason) {
    // Calculate updated rankings based on match results
    const updated Rankings = calculateUpdatedRankings(match);

    // Award NFTs to top performers
    updatedRankings.forEach((player) => {
      if (player.newRank && playerQualifiesForNFT(player.newRank)) {
        try {
          seasonalMgr.awardSeasonalRankingNFT(
            player.playerId,
            player.playerName,
            player.team,
            currentSeason.seasonId,
            {
              finalRank: player.newRank,
              totalPoints: player.seasonPoints,
              matchesPlayed: player.matchesPlayed,
              goalsScored: player.goalsScored,
              assists: player.assists,
              averageRating: player.averageRating,
            },
            player.walletAddress,
            'platform'
          );
        } catch (error) {
          console.error('Failed to award seasonal NFT:', error);
        }
      }
    });
  }

  // 3. Update team performance stats
  const ownershipMgr = TeamOwnershipNFTManager.getInstance();
  ownershipMgr.updateTeamStats(match.homeTeamId, {
    totalMatches: match.homeTeamStats.matches,
    wins: match.homeTeamStats.wins,
    draws: match.homeTeamStats.draws,
    losses: match.homeTeamStats.losses,
  });
  ownershipMgr.updateTeamStats(match.awayTeamId, {
    totalMatches: match.awayTeamStats.matches,
    wins: match.awayTeamStats.wins,
    draws: match.awayTeamStats.draws,
    losses: match.awayTeamStats.losses,
  });

  // 4. Save to database
  await fetch('/api/match-completion', {
    method: 'POST',
    body: JSON.stringify({
      match,
      seasonalAwards: updatedRankings.filter((p) => playerQualifiesForNFT(p.newRank)),
      teamStats: {
        [match.homeTeamId]: match.homeTeamStats,
        [match.awayTeamId]: match.awayTeamStats,
      },
    }),
  });
}
```

---

## Step 4: UI Integration

### Add components to pages

```typescript
// pages/seasons/[seasonId].tsx
import { SeasonalLeaderboard, SeasonalRankingNFTCard } from '@/components/SeasonalRankingsUI';

export default function SeasonPage({ seasonId }: { seasonId: string }) {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <SeasonalLeaderboard seasonId={seasonId} />
    </div>
  );
}

// pages/player/[playerId].tsx
import { SeasonalRankingNFTCard } from '@/components/SeasonalRankingsUI';

export default function PlayerProfile({ playerId }: { playerId: string }) {
  const manager = SeasonalRankingNFTManager.getInstance();
  const seasonalNFTs = manager.getPlayerSeasonalNFTs(playerId);

  return (
    <div className="p-6">
      <h1>Seasonal Achievements</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {seasonalNFTs.map((nft) => (
          <SeasonalRankingNFTCard key={nft.tokenId} nft={nft} />
        ))}
      </div>
    </div>
  );
}

// pages/team/[teamId]/ownership.tsx
import { TeamOwnershipNFTCard } from '@/components/SeasonalRankingsUI';

export default function TeamOwnership({ teamId }: { teamId: string }) {
  const manager = TeamOwnershipNFTManager.getInstance();
  const owners = manager.getTeamOwnershipNFTs(teamId);

  return (
    <div className="p-6">
      <h1>Team Ownership</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {owners.map((nft) => (
          <TeamOwnershipNFTCard key={nft.tokenId} nft={nft} />
        ))}
      </div>
    </div>
  );
}

// pages/team/[teamId]/customize.tsx
import { TeamCustomizationPreview, TeamCustomizationManager } from '@/components/SeasonalRankingsUI';
import { useState } from 'react';

export default function TeamCustomization({ teamId }: { teamId: string }) {
  const manager = TeamCustomizationManager.getInstance();
  const [customization, setCustomization] = useState(manager.getTeamCustomization(teamId));

  const handleJerseyPreset = (preset: string) => {
    const updated = manager.applyJerseyPreset(teamId, preset, 'home', 'user_wallet');
    setCustomization(updated);
  };

  return (
    <div className="p-6 grid grid-cols-2 gap-6">
      <div>
        <h2>Available Presets</h2>
        <div className="space-y-2">
          {['real-madrid', 'manchester-blue', 'barcelona', 'juventus', 'milan', 'liverpool'].map(
            (preset) => (
              <button
                key={preset}
                onClick={() => handleJerseyPreset(preset)}
                className="block w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {preset}
              </button>
            )
          )}
        </div>
      </div>
      <div>
        <TeamCustomizationPreview teamId={teamId} />
      </div>
    </div>
  );
}
```

---

## Step 5: Background Jobs

### Process seasons with cron

```typescript
// pages/api/cron/process-seasons.ts
import { SeasonalRankingNFTManager } from '@/lib/seasonalRankingNFT';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }

  const manager = SeasonalRankingNFTManager.getInstance();
  const seasons = manager.getAllSeasons();

  for (const season of seasons) {
    if (season.isActive && Date.now() > season.endDate) {
      // Season ended - finalize rankings
      const nfts = manager.getSeasonalNFTs(season.seasonId);

      // Store to database
      for (const nft of nfts) {
        await prisma.seasonalNFT.create({
          data: {
            tokenId: nft.tokenId,
            seasonId: season.id,
            playerId: nft.playerId,
            playerName: nft.playerName,
            playerTeam: nft.playerTeam,
            finalRank: nft.finalRank,
            badge: nft.badge,
            totalPoints: nft.totalPoints,
            matchesPlayed: nft.matchesPlayed,
            goalsScored: nft.goalsScored,
            assists: nft.assists,
            averageRating: nft.averageRating,
            owner: nft.owner,
          },
        });
      }

      console.log(`Finalized season ${season.seasonId}`);
    }
  }

  res.json({ success: true });
}
```

---

## Step 6: Blockchain Integration

### Mint NFTs to blockchain

```typescript
// lib/mintSeasonalNFTs.ts
import { ethers } from 'ethers';

export async function mintSeasonalNFT(
  nft: SeasonalRankingNFT,
  contractAddress: string,
  provider: ethers.Provider
) {
  const contract = new ethers.Contract(
    contractAddress,
    ['function mint(address to, string uri) external'],
    provider.getSigner()
  );

  const manager = SeasonalRankingNFTManager.getInstance();
  const metadata = manager.generateMetadata(nft);

  // Upload metadata to IPFS (Pinata, NFT.storage, etc)
  const metadataUri = await uploadToIPFS(metadata);

  // Mint NFT
  const tx = await contract.mint(nft.owner, metadataUri);
  const receipt = await tx.wait();

  // Update NFT with blockchain info
  nft.contractAddress = contractAddress;
  nft.txHash = receipt.transactionHash;
  nft.blockNumber = receipt.blockNumber;

  return nft;
}

// Batch mint season NFTs
export async function mintSeasonNFTs(
  seasonId: string,
  contractAddress: string
) {
  const manager = SeasonalRankingNFTManager.getInstance();
  const nfts = manager.getSeasonalNFTs(seasonId);
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

  for (const nft of nfts) {
    try {
      await mintSeasonalNFT(nft, contractAddress, provider);
    } catch (error) {
      console.error(`Failed to mint ${nft.tokenId}:`, error);
    }
  }
}
```

---

## Step 7: Testing

### Test complete flow

```typescript
// __tests__/seasonal-ranking.test.ts
import { SeasonalRankingNFTManager } from '@/lib/seasonalRankingNFT';

describe('Seasonal Rankings', () => {
  it('should create season and award NFTs', () => {
    const manager = SeasonalRankingNFTManager.getInstance();

    // Create season
    manager.createSeason({
      seasonId: 'test_s1',
      seasonName: 'Test Season',
      startDate: Date.now(),
      endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
      isActive: true,
      totalParticipants: 0,
      pointsPerGoal: 5,
      pointsPerAssist: 3,
      pointsPerWin: 10,
      pointsPerDraw: 3,
    });

    // Award NFTs
    const nft1 = manager.awardSeasonalRankingNFT(
      'p1',
      'Player 1',
      'Team A',
      'test_s1',
      { finalRank: 1, totalPoints: 3000, matchesPlayed: 38, goalsScored: 50, assists: 20, averageRating: 9 },
      'wallet1'
    );
    const nft2 = manager.awardSeasonalRankingNFT(
      'p2',
      'Player 2',
      'Team B',
      'test_s1',
      { finalRank: 10, totalPoints: 2000, matchesPlayed: 35, goalsScored: 30, assists: 15, averageRating: 8 }
      'wallet2'
    );

    expect(nft1.badge).toBe('platinum');
    expect(nft2.badge).toBe('silver');

    // Get leaderboard
    const board = manager.getSeasonLeaderboard('test_s1');
    expect(board[0].finalRank).toBe(1);
    expect(board[1].finalRank).toBe(10);
  });
});
```

---

## Deployment Checklist

- [ ] Create database schema
- [ ] Deploy API endpoints
- [ ] Integrate with match completion
- [ ] Setup cron job for season finalization
- [ ] Deploy React components
- [ ] Test end-to-end flow
- [ ] Deploy blockchain minting service
- [ ] Setup IPFS for metadata storage
- [ ] Monitor and test on testnet
- [ ] Go live on mainnet

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_RPC_URL=https://...
NEXT_PUBLIC_SEASONAL_CONTRACT=0x...
NEXT_PUBLIC_OWNERSHIP_CONTRACT=0x...
PINATA_JWT=...
CRON_SECRET=...
DATABASE_URL=...
```

---

**See Also**: [Full Documentation](./SEASONAL_RANKINGS_OWNERSHIP_CUSTOMIZATION.md) | [Quick Reference](./SEASONAL_RANKINGS_QUICKREF.md)

**Version**: 1.0
**Date**: January 18, 2026
