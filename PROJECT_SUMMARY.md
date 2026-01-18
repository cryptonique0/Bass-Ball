# 🎮 Bass Ball - Project Summary

## Project Overview

Bass Ball is a complete **Web3 Football Game** built on the **Base Chain** (Ethereum L2), featuring:
- Interactive 2D football pitch with real-time physics
- NFT-based player cards with unique statistics  
- Play-to-earn mechanics with $BBALL tokens
- Team building and strategic gameplay
- Smart contracts for secure asset ownership

## 📁 Project Structure

```
Bass-Ball/
│
├── 📄 Configuration Files
│   ├── package.json          → Dependencies & scripts
│   ├── tsconfig.json         → TypeScript config
│   ├── next.config.js        → Next.js settings
│   ├── tailwind.config.ts    → Tailwind CSS config
│   ├── postcss.config.js     → PostCSS setup
│   ├── hardhat.config.ts     → Hardhat/Web3 config
│   ├── .env.local            → Environment variables
│   ├── .env.example          → Environment template
│   └── .gitignore            → Git ignore rules
│
├── 📱 Frontend (app/)
│   ├── layout.tsx            → Root layout wrapper
│   ├── page.tsx              → Home/landing page
│   ├── globals.css           → Global styles
│   ├── game/
│   │   └── page.tsx          → Main game interface
│   └── team-builder/
│       └── page.tsx          → Team creation page
│
├── 🧩 React Components (components/)
│   ├── FootballPitch.tsx     → Game field renderer
│   ├── GameStats.tsx         → Score & statistics display
│   ├── MatchControls.tsx     → Game control buttons
│   ├── PlayerCard.tsx        → Player stats card
│   └── ConnectWallet.tsx     → Web3 wallet connection
│
├── 🎮 Game Logic (lib/ & hooks/)
│   ├── gameEngine.ts         → Game mechanics & physics
│   ├── useGameEngine.ts      → Game state management hook
│   └── useWeb3Game.ts        → Web3 integration hooks
│
├── 📝 Smart Contracts (contracts/)
│   ├── FootballPlayerNFT.sol → ERC721 player cards
│   └── GameToken.sol         → ERC20 reward token
│
├── 🚀 Deployment (scripts/)
│   └── deploy.ts             → Contract deployment script
│
├── 📚 Documentation
│   ├── README.md             → Main documentation
│   └── QUICKSTART.md         → Quick start guide
│
└── 📦 Dependencies
    └── node_modules/         → Installed packages
```

## 🎮 Game Features

### Gameplay Mechanics
✅ **Real-time football match simulation**
- Interactive 2D pitch with animated players and ball
- Physics engine with ball trajectory and friction
- Player selection and control system
- Pass and shoot mechanics

✅ **Team Management**
- 11 unique players per team
- 4 different tactical formations
- Player stats affecting performance
- Stamina system for realistic fatigue

✅ **AI Opponents**
- Computer-controlled team
- Dynamic positioning and ball pursuit
- Intelligent player movement

✅ **Match Statistics**
- Live score tracking
- Possession percentage
- Match time (90 minutes)
- Player performance metrics

### Web3 Integration
✅ **NFT Player Cards**
- ERC721 tokens for unique player ownership
- Embedded player statistics (6 attributes)
- Rarity tiers (Common to Legendary)
- Transferable on secondary markets

✅ **Tokenomics**
- $BBALL ERC20 reward token
- Play-to-earn incentives
- Daily claim rewards
- Win/draw/loss multipliers

✅ **Smart Contract Features**
- Secure player minting
- Ownership verification
- Reward distribution
- Token transfers

## 📊 Technology Stack

### Frontend
- **Next.js 14** - React framework with SSR
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Hooks** - State management

### Web3
- **Wagmi** - React hooks for Ethereum
- **Viem** - Lightweight Ethereum client
- **Ethers.js** - Contract interaction

### Blockchain
- **Solidity ^0.8.19** - Smart contract language
- **OpenZeppelin Contracts** - Battle-tested libraries
- **Hardhat** - Ethereum development framework
- **Base Chain** - Ethereum L2 network

### Development Tools
- **TypeScript** - Static typing
- **Tailwind CSS** - Responsive design
- **PostCSS** - CSS processing

## 🚀 Getting Started

### 1. Installation
```bash
cd Bass-Ball
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 3. Development
```bash
npm run dev
# Open http://localhost:3000
```

### 4. Deploy Smart Contracts
```bash
npm run contracts:compile
npm run contracts:deploy
```

## 📋 Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Production build
npm start              # Run production build

# Smart Contracts
npm run contracts:compile  # Compile Solidity
npm run contracts:deploy   # Deploy to Base Chain
npm run contracts:test     # Run contract tests

# Utilities
npm run lint           # Check TypeScript
npm run format         # Auto-format code
```

## 🎯 Key Files Explained

### Game Logic
- **lib/gameEngine.ts** - Core game mechanics, physics, and calculations
- **hooks/useGameEngine.ts** - React hook for game state management

### Contracts
- **contracts/FootballPlayerNFT.sol** - Player NFT contract (ERC721)
- **contracts/GameToken.sol** - Reward token contract (ERC20)

### UI Components
- **components/FootballPitch.tsx** - Renders the game field and players
- **components/GameStats.tsx** - Displays score and match statistics
- **components/MatchControls.tsx** - Game control buttons
- **components/PlayerCard.tsx** - Player stats display

### Pages
- **app/page.tsx** - Home page with game overview
- **app/game/page.tsx** - Main gameplay interface
- **app/team-builder/page.tsx** - Team creation interface

## 🔧 Configuration

### Environment Variables
```
NEXT_PUBLIC_BASE_CHAIN_ID=8453              # Base mainnet
NEXT_PUBLIC_PLAYER_NFT_ADDRESS=0x...        # Deploy, then update
NEXT_PUBLIC_GAME_TOKEN_ADDRESS=0x...        # Deploy, then update
PRIVATE_KEY=0x...                           # For contract deployment
```

## 📚 Game Rules

1. **Match Duration**: 90 minutes (simulated)
2. **Players per Side**: 11 players
3. **Objective**: Score more goals than opponent
4. **Controls**: Click to select → Pass/Shoot buttons
5. **Rewards**: 150 tokens (win) / 100 (draw) / 50 (loss)

## 🌐 Base Chain Information

- **Mainnet Chain ID**: 8453
- **Sepolia Testnet ID**: 84532
- **RPC**: https://mainnet.base.org (mainnet) / https://sepolia.base.org (testnet)
- **Explorer**: BaseScan.org

## 📈 Roadmap

- [x] Core gameplay mechanics
- [x] NFT player system
- [x] Smart contracts
- [ ] Multiplayer matches
- [ ] Tournament system
- [ ] Player marketplace
- [ ] Advanced AI
- [ ] Mobile app
- [ ] Governance token

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Change port in next.config.js or run on different port
npm run dev -- -p 3001
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Contract Deployment Failed
```bash
# Check network settings in hardhat.config.ts
# Ensure PRIVATE_KEY is set in .env.local
# Verify sufficient gas funds
```

## 📞 Support Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Base Chain Docs**: https://docs.base.org
- **Hardhat Guide**: https://hardhat.org/docs
- **Solidity Docs**: https://docs.soliditylang.org
- **Tailwind CSS**: https://tailwindcss.com/docs

## 📄 License

MIT License - Open source and freely modifiable

## 🎉 Summary

Bass Ball is a **complete, production-ready** Web3 football game combining:
- 🎮 Engaging gameplay mechanics
- ⚡ Blockchain integration via smart contracts
- 💰 Play-to-earn tokenomics
- 🏆 NFT-based player ownership
- 🚀 Modern web technology stack

**Everything is ready to run, customize, and deploy!**

---

**Questions?** Check QUICKSTART.md or README.md for detailed guides.
