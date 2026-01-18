# 💡 Bass Ball - Examples & Usage Guide

## Game Play Examples

### Example 1: Starting Your First Match

```typescript
// From app/game/page.tsx
import { useGameEngine } from '@/hooks/useGameEngine';

export default function GamePage() {
  const { gameState, startMatch, selectPlayer, passToPlayer } = useGameEngine();

  const handleStart = () => {
    startMatch();
    // Match begins with 90 minute timer
    // Ball starts at center
    // Both teams in formation
  };

  return (
    <div>
      <button onClick={handleStart}>Start Match</button>
      {gameState && <GameStats gameState={gameState} />}
    </div>
  );
}
```

### Example 2: Selecting & Controlling Players

```typescript
// Select a player on your team
const player = gameState.homeTeam.players[5]; // Get a player
selectPlayer(player);

// Now selected player glows yellow
// Click "Pass" to send ball to nearest teammate
const handlePass = () => {
  const teammates = gameState.homeTeam.players;
  let nearestTeammate = teammates[0];
  
  // Find nearest teammate
  teammates.forEach(mate => {
    if (mate.id !== player.id) {
      nearestTeammate = mate; // Simplified
    }
  });
  
  passToPlayer(nearestTeammate);
};

// Click "Shoot" to attempt a goal
const handleShoot = () => {
  shoot(); // Ball moves toward opponent's goal
};
```

### Example 3: Understanding Player Stats

```typescript
// Each player has these stats (0-99 scale)
const player = {
  pace: 88,        // How fast they run
  shooting: 92,    // Goal scoring ability
  passing: 85,     // Accuracy and vision
  dribbling: 87,   // Ball control
  defense: 78,     // Defensive strength
  physical: 81,    // Strength and endurance
};

// Overall rating = average of all stats
const overall = (88 + 92 + 85 + 87 + 78 + 81) / 6; // = 85.17 ≈ 85
```

### Example 4: Match Results & Rewards

```typescript
// After 90 minute match

// Win Scenario
const homeGoals = 3;
const awayGoals = 1;

if (homeGoals > awayGoals) {
  // Player wins!
  const baseReward = 100; // Base tokens
  const multiplier = 1.5; // Win multiplier
  const totalReward = baseReward * multiplier; // 150 tokens
}

// Draw
if (homeGoals === awayGoals) {
  const totalReward = 100 * 1.0; // 100 tokens
}

// Loss
if (homeGoals < awayGoals) {
  const totalReward = 100 * 0.5; // 50 tokens
}
```

## Smart Contract Examples

### Example 1: Minting a Player NFT

```solidity
// From FootballPlayerNFT.sol
function mintPlayer(
  address to,
  string memory name,
  string memory position,
  uint8 pace,
  uint8 shooting,
  uint8 passing,
  uint8 dribbling,
  uint8 defense,
  uint8 physical,
  uint256 rarity, // 1=Common, 2=Rare, 3=Epic, 4=Legendary
  string memory uri
) public onlyOwner returns (uint256) {
  // Mints new player NFT with stats
  // Example call:
  // mintPlayer(
  //   "0x742d35Cc6634C0532925a3b844Bc87e7bCD01e4f",
  //   "Cristiano Ronaldo",
  //   "FWD",
  //   94, 93, 82, 87, 35, 79,
  //   4, // Legendary
  //   "ipfs://QmXxxx..."
  // )
}
```

### Example 2: Getting Player Stats

```solidity
// Retrieve player information
uint256 tokenId = 1;

// Get all stats
FootballPlayerNFT.Player memory player = nftContract.getPlayerStats(tokenId);
// Returns: {
//   name: "Cristiano Ronaldo",
//   position: "FWD",
//   pace: 94,
//   shooting: 93,
//   passing: 82,
//   dribbling: 87,
//   defense: 35,
//   physical: 79,
//   rarity: 4
// }

// Get overall rating
uint8 rating = nftContract.getOverallRating(tokenId); // 78
```

### Example 3: Claiming Rewards

```typescript
// From useWeb3Game.ts - Web3 Integration

const useGameRewards = () => {
  const { address } = useAccount();

  const claimMatchRewards = async (matchResult: 'win' | 'draw' | 'loss') => {
    if (!address) return;
    
    // Calculate reward based on result
    let rewardAmount = 100n; // Base: 100 tokens
    
    if (matchResult === 'win') {
      rewardAmount = rewardAmount * 150n / 100n; // 1.5x
    } else if (matchResult === 'loss') {
      rewardAmount = rewardAmount * 50n / 100n; // 0.5x
    }
    
    // Send transaction to claim reward
    // const tx = await gameTokenContract.mint(address, rewardAmount);
    // await tx.wait();
  };

  return { claimMatchRewards };
};
```

## Formation Examples

### Formation: 4-4-2 (Classic)

```
        GK
    DEF DEF DEF DEF
    MID MID MID MID
        FWD FWD

Best for: Balanced, defensive approach
```

### Formation: 4-3-3 (Balanced)

```
        GK
    DEF DEF DEF DEF
      MID MID MID
      FWD FWD FWD

Best for: Attacking with mid-field control
```

### Formation: 3-5-2 (Attacking)

```
        GK
      DEF DEF DEF
    MID MID MID MID MID
        FWD FWD

Best for: High possession, attacking style
```

## Game Physics Examples

### Ball Movement

```typescript
// From gameEngine.ts

// Ball follows physics
state.ballX += state.ballVx; // X movement
state.ballY += state.ballVy; // Y movement

// Friction slows ball down
state.ballVx *= 0.99; // Friction constant
state.ballVy *= 0.99;

// Eventually ball stops
// After ~10 frames: velocity ≈ 0
```

### Player AI

```typescript
// Computer players move toward ball
const distToBall = getDistanceBetweenPoints(
  player.x, player.y,
  state.ballX, state.ballY
);

if (distToBall < 200) {
  // Within range - move toward ball
  const angle = getAngleBetweenPoints(
    player.x, player.y,
    state.ballX, state.ballY
  );
  
  const speed = 2 + player.pace / 100; // Faster players move quicker
  player.vx = Math.cos(angle) * speed;
  player.vy = Math.sin(angle) * speed;
}
```

## Component Examples

### Example 1: PlayerCard Component

```typescript
import { PlayerCard } from '@/components/PlayerCard';
import { Player } from '@/lib/gameEngine';

const myPlayer: Player = {
  id: "player-1",
  name: "John Doe",
  position: "FWD",
  pace: 85,
  shooting: 88,
  passing: 80,
  dribbling: 82,
  defense: 60,
  physical: 78,
  x: 100,
  y: 200,
  vx: 0,
  vy: 0,
  stamina: 95,
  selected: true,
};

// Usage
<PlayerCard 
  player={myPlayer} 
  selected={true}
  onClick={() => selectPlayer(myPlayer)}
/>
```

### Example 2: GameStats Component

```typescript
import { GameStats } from '@/components/GameStats';

const gameState = {
  homeTeam: {
    name: "Home Team",
    score: 2,
    players: [...],
    possession: 55,
  },
  awayTeam: {
    name: "Away Team",
    score: 1,
    players: [...],
    possession: 45,
  },
  gameTime: 45, // 45 minutes played
};

// Usage
<GameStats gameState={gameState} gameTime={45} />
// Displays: Home Team 2 - 1 Away Team | 45:00 | 55% possession
```

## Team Building Examples

### Example: Creating a Complete Team

```typescript
const buildMyTeam = () => {
  const formation = FORMATIONS['4-3-3'];
  const players = [];

  // Get NFT player IDs from wallet
  const myPlayerNFTs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  // Assign players to positions
  formation.positions.forEach((pos, idx) => {
    players.push({
      ...getPlayerStatsFromChain(myPlayerNFTs[idx]),
      position: pos.position,
      x: pos.x * PITCH_WIDTH,
      y: pos.y * PITCH_HEIGHT,
    });
  });

  return {
    name: "My Dream Team",
    formation: '4-3-3',
    players: players,
    averageRating: calculateAverageRating(players),
  };
};
```

## Environment Configuration Examples

### Development Environment

```env
NEXT_PUBLIC_BASE_CHAIN_ID=84532 # Sepolia testnet
NEXT_PUBLIC_PLAYER_NFT_ADDRESS=0x... # Test address
NEXT_PUBLIC_GAME_TOKEN_ADDRESS=0x... # Test address
NEXT_PUBLIC_DEV_MODE=true
```

### Production Environment

```env
NEXT_PUBLIC_BASE_CHAIN_ID=8453 # Base mainnet
NEXT_PUBLIC_PLAYER_NFT_ADDRESS=0x... # Mainnet address
NEXT_PUBLIC_GAME_TOKEN_ADDRESS=0x... # Mainnet address
NEXT_PUBLIC_DEV_MODE=false
```

## Common Tasks

### Task 1: Deploy to Production

```bash
# 1. Compile contracts
npm run contracts:compile

# 2. Deploy to mainnet
npm run contracts:deploy --network base

# 3. Update environment
# Edit .env.local with new contract addresses

# 4. Build frontend
npm run build

# 5. Deploy
vercel deploy --prod
```

### Task 2: Mint Player NFTs

```bash
# 1. Get contract address
CONTRACT_ADDRESS=0x...

# 2. Create script to mint
# scripts/mint-players.ts

# 3. Run script
npx hardhat run scripts/mint-players.ts
```

### Task 3: Debug Game Logic

```typescript
// Add console logs to gameEngine.ts
console.log('Ball position:', {
  x: state.ballX,
  y: state.ballY,
  vx: state.ballVx,
  vy: state.ballVy,
});

// Open DevTools (F12) to see logs
```

## Testing Examples

### Test 1: Player Stat Calculation

```typescript
// lib/__tests__/gameEngine.test.ts
describe('Player Stats', () => {
  it('should calculate overall rating correctly', () => {
    const player: Player = {
      pace: 80,
      shooting: 85,
      passing: 75,
      dribbling: 88,
      defense: 70,
      physical: 82,
      // ... other props
    };
    
    const overall = calculateOverall(player);
    expect(overall).toBe(80); // Average of stats
  });
});
```

## Troubleshooting Examples

### Issue: Game Not Rendering

```typescript
// Check in GamePage
console.log('gameState:', gameState);
console.log('gameState.homeTeam.players:', gameState?.homeTeam.players);

// Verify gameState is initialized
if (!gameState) {
  return <div>Loading game...</div>;
}
```

### Issue: Web3 Connection

```typescript
// Check wallet connection
const { address, isConnected } = useAccount();
console.log('Connected:', isConnected);
console.log('Address:', address);

// Verify chain
const { chain } = useNetwork();
console.log('Current chain:', chain?.id);
```

---

**These examples should help you understand and extend Bass Ball!** 🚀
