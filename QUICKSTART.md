# 🚀 Bass Ball - Quick Start Guide

## What is Bass Ball?

Bass Ball is a blockchain-powered football game built on the Base Chain. It combines the excitement of interactive football matches with Web3 technology, allowing players to:

- **Play** engaging football matches with real-time physics
- **Own** unique NFT player cards with special abilities
- **Earn** $BBALL tokens by winning matches
- **Trade** players on the marketplace
- **Compete** globally with other players

## Getting Started

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/Bass-Ball.git
cd Bass-Ball

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

### 2. Configuration

Edit `.env.local`:
```env
# Base Chain Network
NEXT_PUBLIC_BASE_CHAIN_ID=8453  # Mainnet
# or
NEXT_PUBLIC_BASE_CHAIN_ID=84532 # Sepolia testnet

# Contract Addresses (after deployment)
NEXT_PUBLIC_PLAYER_NFT_ADDRESS=0x...
NEXT_PUBLIC_GAME_TOKEN_ADDRESS=0x...
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Key Pages

- **Home (`/`)**: Landing page with game overview
- **Game (`/game`)**: Main gameplay interface
- **Team Builder (`/team-builder`)**: Create and manage your team

## Game Tutorial

### Starting a Match

1. Navigate to `/game`
2. Click "Start Match" to initialize a new game
3. The pitch will appear with both teams positioned

### Playing

**Select a Player**: Click on any player to select them (selected players glow yellow)

**Pass**: 
- Select a player on your team
- Click the "Pass" button
- The ball passes to the nearest teammate

**Shoot**:
- Select a forward near the opponent's goal
- Click "Shoot"
- Try to score!

### Winning

- Score more goals than your opponent
- Match ends after 90 minutes (simulated)
- Earn rewards based on performance

## Smart Contracts

### Quick Deployment

```bash
# Compile contracts
npm run contracts:compile

# Deploy to Base Sepolia testnet
npm run contracts:deploy

# Verify on BaseScan
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

### Contract Addresses (After Deployment)

Update in `.env.local`:
```env
NEXT_PUBLIC_PLAYER_NFT_ADDRESS=0x[GameToken]
NEXT_PUBLIC_GAME_TOKEN_ADDRESS=0x[PlayerNFT]
```

## Features Explained

### ⚽ Gameplay

- **Real-time Physics**: Ball responds to player kicks with realistic movement
- **AI Opposition**: Computer-controlled teams with intelligent positioning
- **Formation System**: Choose from multiple tactical formations
- **Player Stats**: Each player has unique attributes affecting performance

### 🏆 NFT System

Players are represented as ERC721 NFTs with:
- Unique ID and name
- Position (GK, DEF, MID, FWD)
- 6 Statistical attributes (0-99 scale)
- Rarity tier (Common → Legendary)

### 💰 Rewards

Earn $BBALL tokens:
- **Win**: 100 tokens × 1.5 multiplier = 150 tokens
- **Draw**: 100 tokens × 1.0 multiplier = 100 tokens
- **Loss**: 100 tokens × 0.5 multiplier = 50 tokens
- **Daily Bonus**: 10 tokens (claim once per day)

### 👥 Team Management

- Select 11 players from your NFT collection
- Choose formation (4-4-2, 4-3-3, 3-5-2, 5-3-2)
- Save multiple team compositions
- Switch between teams before matches

## Project Architecture

```
Frontend (Next.js)
    ↓
React Components & Game Engine
    ↓
Web3 Integration (Wagmi/Viem)
    ↓
Base Chain Network
    ↓
Smart Contracts (Solidity)
```

## File Organization

```
Key Files for Development:

Game Logic:
- lib/gameEngine.ts          → Core game mechanics
- hooks/useGameEngine.ts     → Game state management

Components:
- components/FootballPitch.tsx    → Game field rendering
- components/GameStats.tsx        → Score display
- components/MatchControls.tsx    → Control buttons

Contracts:
- contracts/FootballPlayerNFT.sol → Player NFTs
- contracts/GameToken.sol         → Reward token

Pages:
- app/game/page.tsx           → Main game
- app/team-builder/page.tsx   → Team creation
- app/page.tsx                → Home page
```

## Debugging Tips

### Game Not Loading?
- Check browser console for errors (F12)
- Verify Node.js version: `node --version` (should be 18+)
- Clear cache: `npm run build && npm run dev`

### Contracts Not Deploying?
```bash
# Check Hardhat setup
npx hardhat accounts

# Check network connection
npx hardhat run scripts/deploy.ts --network baseSepolia
```

### Web3 Connection Issues?
- Ensure MetaMask is installed
- Check network is set to Base Sepolia (ChainID: 84532)
- Check wallet has test ETH for gas fees

## Common Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Production build
npm start                  # Run production build

# Smart Contracts
npm run contracts:compile  # Compile Solidity
npm run contracts:deploy   # Deploy contracts
npm run contracts:test     # Run tests

# Linting & Formatting
npm run lint              # Check TypeScript
npm run format            # Auto-format code
```

## Next Steps

1. **Deploy Contracts**: Follow smart contract deployment guide
2. **Mint Players**: Create sample NFT players
3. **Test Gameplay**: Play a match and test game mechanics
4. **Customize**: Add your own teams, players, and game modes
5. **Deploy Frontend**: Host on Vercel or similar

## Resources

- [Base Chain Docs](https://docs.base.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Guide](https://nextjs.org/docs)
- [Solidity Docs](https://docs.soliditylang.org/)
- [Wagmi Documentation](https://wagmi.sh/)

## Getting Help

1. Check the main README.md for detailed documentation
2. Review example contracts in `contracts/`
3. Check game logic in `lib/gameEngine.ts`
4. Review component implementations in `components/`

## License

MIT - Feel free to use and modify!

---

**Ready to play? Start with `npm run dev` and navigate to http://localhost:3000** ⚽
