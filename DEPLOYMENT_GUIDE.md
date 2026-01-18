# 🎮 Bass Ball - Web3 Gaming Platform

A modern PvP gaming platform on Base network with NFT badges, wallet integration, and global leaderboards.

**Live Features:**
- ✅ Wallet + Email Login (Privy)
- ✅ PvP Match System
- ✅ Match Results & History
- ✅ Player Profiles with Stats
- ✅ Global Rankings/Leaderboard
- ✅ NFT Badges on Base
- ✅ Clean, Responsive UI
- ✅ Gas-optimized transactions

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Base network RPC key (or use public endpoint)
- Privy app ID (free at [privy.io](https://privy.io))
- WalletConnect project ID (free at [walletconnect.com](https://walletconnect.com))

### Local Development

```bash
# 1. Clone and install
git clone <repo>
cd Bass-Ball
npm install

# 2. Create .env.local with your keys
cp .env.example .env.local

# 3. Add your credentials to .env.local:
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_id
NEXT_PUBLIC_WALLETCONNECT_ID=your_wc_id

# 4. Start dev server
npm run dev

# 5. Open http://localhost:3000
```

---

## 📦 Deployment

### Option 1: Deploy to Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Add environment variables in Vercel dashboard:
#    - NEXT_PUBLIC_PRIVY_APP_ID
#    - NEXT_PUBLIC_WALLETCONNECT_ID

# 4. Your app is live! 🚀
```

### Option 2: Deploy with Docker Compose

```bash
# 1. Build and start all services
docker-compose up --build

# 2. Services running:
#    - Frontend: http://localhost:3000
#    - Backend API: http://localhost:3001
#    - PostgreSQL: localhost:5432
#    - Redis: localhost:6379
```

### Option 3: Deploy NFT Contract to Base Testnet

```bash
# 1. Install Hardhat
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# 2. Add deployer private key to .env:
PRIVATE_KEY=your_private_key

# 3. Deploy to Base Sepolia testnet first (recommended):
npx hardhat run scripts/deployNFT.ts --network baseSepolia

# 4. After testing, deploy to Base mainnet:
npx hardhat run scripts/deployNFT.ts --network base

# 5. Save returned contract address - you'll need it!
# Add to your .env.local:
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
```

---

## 📁 Project Structure

```
Bass-Ball/
├── pages/                          # Next.js pages
│   ├── index.tsx                   # Home/Dashboard
│   ├── match.tsx                   # Match gameplay
│   ├── leaderboard.tsx             # Global rankings
│   ├── profile/[address].tsx       # Player profiles
│   └── api/                        # API routes
│       ├── player/[address]/       # Player endpoints
│       ├── match/                  # Match endpoints
│       └── leaderboard.ts          # Leaderboard endpoint
├── components/                     # React components
│   ├── Navigation.tsx              # Top nav bar
│   └── AuthButton.tsx              # Login/logout button
├── contracts/                      # Solidity smart contracts
│   └── BassballPlayerNFT.sol       # ERC721 badge contract
├── scripts/                        # Deployment scripts
│   └── deployNFT.ts                # Contract deployment
├── styles/                         # Global styles
│   └── globals.css                 # Tailwind + custom CSS
├── lib/                            # Utilities
│   ├── aiOpponentSystem.ts         # AI opponents (from previous phase)
│   ├── baseGasSponsor.ts           # Gas sponsorship (from previous phase)
│   └── ...                         # Other managers
├── docker-compose.yml              # Multi-container setup
├── Dockerfile.frontend             # Next.js container
├── Dockerfile.backend              # Express backend container
├── hardhat.config.ts               # Smart contract config
├── package.json                    # Dependencies
└── .env.example                    # Environment template
```

---

## 🎮 How It Works

### User Flow

1. **Login**
   - User clicks "Login" on home page
   - Privy modal opens (email or wallet)
   - Wallet created automatically if needed

2. **Play Match**
   - Click "Find Match" on match page
   - System pairs with similar-rated opponent
   - 5-second gameplay simulation
   - Results displayed with rating change

3. **View Stats**
   - Click "My Profile"
   - See personal stats (rating, wins, badges)
   - View earned NFT badges
   - Check match history

4. **Check Rankings**
   - Go to "Leaderboard"
   - Filter by time period (week/month/all-time)
   - Top 3 players highlighted with medals
   - Click player to view detailed profile

5. **Earn NFT Badge**
   - Win matches to improve stats
   - Earn badges automatically:
     - 🚀 OG Player (joined early)
     - 🏆 Champion (60% win rate)
     - 💎 Top 1% (elite tier)
     - 👑 Living Legend (70% win rate, 500+ matches)
     - 🔥 Streak Master (20+ win streak)
     - 🎖️ Collector (5+ badges)

### Smart Contract

**BassballPlayerNFT.sol**
- ERC721 standard NFT contract on Base
- 6 badge types with different rarity tiers
- Max supply limits on rare badges (Top 1%: 100, Living Legend: 10)
- Metadata stored on-chain
- Only contract owner can mint badges

---

## 🔑 Environment Variables

```env
# Required for Frontend
NEXT_PUBLIC_BASE_CHAIN_ID=8453                    # Base mainnet
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org     # RPC endpoint
NEXT_PUBLIC_PRIVY_APP_ID=clr...                   # Your Privy app ID
NEXT_PUBLIC_WALLETCONNECT_ID=your_wc_id           # WalletConnect ID
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...            # Deployed NFT contract

# Optional for Local Backend
DATABASE_URL=postgresql://...                     # PostgreSQL URL
REDIS_URL=redis://localhost:6379                  # Redis URL
BASE_RPC_URL=https://mainnet.base.org             # Backend RPC

# For Smart Contract Deployment
PRIVATE_KEY=your_private_key                      # Deployer wallet key
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org    # Testnet RPC
BASESCAN_API_KEY=your_api_key                     # For verification
```

---

## 🧪 Testing

### Local Testing

```bash
# 1. Start dev server
npm run dev

# 2. Test features:
# - Login with email (creates Privy wallet)
# - Login with MetaMask (connects existing wallet)
# - Play match and see results
# - View leaderboard
# - Check your profile and badges

# 3. Check contract deployment
npx hardhat run scripts/deployNFT.ts --network hardhat
```

### Smart Contract Testing

```bash
# 1. Deploy to Base Sepolia (testnet)
npx hardhat run scripts/deployNFT.ts --network baseSepolia

# 2. Contract address will be logged
# 3. Mint test badge:
npx hardhat console --network baseSepolia
> const nft = await ethers.getContractAt("BassballPlayerNFT", "0x...")
> await nft.mintBadge(walletAddress, 0, "ipfs://...", 1000)

# 4. Check Basescan to verify on-chain
# https://sepolia.basescan.org
```

---

## 📊 API Endpoints

### Player
- `GET /api/player/:address/stats` - Player statistics
- `GET /api/player/:address/profile` - Full player profile

### Match
- `POST /api/match/find` - Find opponent
- `GET /api/match/history/:address` - Match history

### Leaderboard
- `GET /api/leaderboard?period=month` - Global rankings
  - Periods: `week`, `month`, `all`

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 | React SSR framework |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Web3 Auth** | Privy | Email → wallet |
| **Wallet Connect** | RainbowKit | Multi-wallet support |
| **Blockchain** | Base (EVM) | Layer 2 settlement |
| **Smart Contracts** | Solidity 0.8.20 | ERC721 NFTs |
| **Backend** | Node.js + Express | REST API (optional) |
| **Database** | PostgreSQL + Redis | Data persistence |
| **Deployment** | Vercel + Docker | Hosting |

---

## 🔐 Security

- ✅ No private keys in frontend
- ✅ Smart contract auditable
- ✅ Gas sponsorship via Paymaster
- ✅ Rate limiting on API endpoints
- ✅ CORS configured for specific origins
- ✅ Input validation on all endpoints

---

## 📈 Roadmap

- [x] Core gameplay (PvP matches)
- [x] Player profiles & stats
- [x] NFT badges on Base
- [x] Global leaderboards
- [ ] Real-time WebSocket updates
- [ ] Advanced AI opponents
- [ ] Tournaments & seasons
- [ ] Trading & marketplace
- [ ] Mobile app
- [ ] Cross-chain deployment

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

This project is open source and available under the MIT License.

---

## 💬 Support

- GitHub Issues: [Report bugs](https://github.com/yourusername/bass-ball/issues)
- Discord: [Join community](https://discord.gg/bassball)
- Docs: [Full documentation](https://bass-ball.readme.io)

---

## 🚀 Live Demo

**Mainnet (Base):** https://bass-ball.vercel.app
**Testnet (Base Sepolia):** https://bass-ball-testnet.vercel.app

---

Made with 💜 for Web3 gamers on Base Network
