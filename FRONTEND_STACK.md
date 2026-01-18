# 🎮 Bass Ball Frontend Stack

## Core Framework

### Next.js 14 (App Router)

```bash
npm create next-app@latest bass-ball --typescript --tailwind
cd bass-ball
npm install
```

**Why Next.js 14?**
- ✅ **App Router** - Modern file-based routing (`app/` directory)
- ✅ **SSR** - Server-side rendering for SEO + fast initial load
- ✅ **API Routes** - Built-in backend (no separate Express needed)
- ✅ **Image Optimization** - Automatic `<Image>` optimization
- ✅ **Dynamic imports** - Code splitting for game engines
- ✅ **Middleware** - Auth checks before page load
- ✅ **Vercel deployment** - One-command deploy

---

## 📦 Complete npm Dependencies

### Core
```bash
npm install next@latest react@latest react-dom@latest
```

### Web3 Authentication
```bash
npm install @privy-io/react-auth @rainbow-me/rainbowkit wagmi@latest viem@latest
```

### Smart Contract Interaction
```bash
npm install ethers@latest @openzeppelin/contracts
```

### Game Engines (choose one or both)
```bash
# 2D Game Engine
npm install phaser@latest

# 3D Graphics (optional)
npm install three@latest
```

### UI & Styling
```bash
npm install tailwindcss@latest autoprefixer@latest
npm install @headlessui/react @heroicons/react
npm install clsx tailwind-merge
```

### State Management
```bash
npm install zustand@latest
```

### HTTP Client
```bash
npm install axios@latest
```

### Real-time Communication
```bash
npm install socket.io-client@latest
```

### Utils
```bash
npm install dotenv@latest
npm install date-fns@latest
```

### Dev Dependencies
```bash
npm install --save-dev typescript @types/react @types/node
npm install --save-dev @types/phaser
npm install --save-dev eslint eslint-config-next
```

---

## 📁 Project Structure

```
bass-ball/
├── app/                                    # Next.js App Router
│   ├── layout.tsx                          # Root layout
│   ├── page.tsx                            # Home page
│   ├── globals.css                         # Global styles
│   ├── (auth)/
│   │   ├── login/page.tsx                  # Login page
│   │   └── layout.tsx                      # Auth layout
│   ├── (game)/
│   │   ├── match/page.tsx                  # Match page
│   │   ├── leaderboard/page.tsx            # Rankings
│   │   ├── profile/[address]/page.tsx      # Player profiles
│   │   └── layout.tsx                      # Game layout
│   ├── api/                                # API routes
│   │   ├── match/
│   │   │   ├── find/route.ts               # Find opponent
│   │   │   ├── history/[address]/route.ts  # Match history
│   │   │   └── result/route.ts             # Submit result
│   │   ├── player/
│   │   │   ├── [address]/stats/route.ts    # Stats endpoint
│   │   │   ├── [address]/profile/route.ts  # Profile endpoint
│   │   │   └── onboard/route.ts            # New player onboarding
│   │   └── leaderboard/route.ts            # Leaderboard endpoint
│   └── middleware.ts                       # Auth middleware
│
├── components/                             # React components
│   ├── layout/
│   │   ├── Header.tsx                      # Top nav bar
│   │   ├── Sidebar.tsx                     # Side navigation
│   │   └── Footer.tsx                      # Footer
│   ├── game/
│   │   ├── PhaserGame.tsx                  # Game wrapper
│   │   ├── MatchCanvas.tsx                 # Game display
│   │   ├── MatchControls.tsx               # Game controls
│   │   ├── MatchTimer.tsx                  # Countdown
│   │   └── MatchResult.tsx                 # Results screen
│   ├── wallet/
│   │   ├── ConnectButton.tsx               # Wallet connect
│   │   ├── WalletInfo.tsx                  # Address display
│   │   └── NetworkChecker.tsx              # Network validation
│   ├── profile/
│   │   ├── PlayerCard.tsx                  # Player stats card
│   │   ├── StatsGrid.tsx                   # Stats dashboard
│   │   └── BadgeShowcase.tsx               # NFT badges display
│   ├── leaderboard/
│   │   ├── LeaderboardTable.tsx            # Rankings table
│   │   └── MedalIcon.tsx                   # Medal badges
│   └── common/
│       ├── Button.tsx                      # Reusable button
│       ├── Card.tsx                        # Reusable card
│       ├── Modal.tsx                       # Modal dialog
│       ├── Spinner.tsx                     # Loading spinner
│       └── Alert.tsx                       # Alert messages
│
├── lib/                                    # Utility functions
│   ├── web3/
│   │   ├── privy.ts                        # Privy client setup
│   │   ├── wagmi.ts                        # Wagmi config
│   │   ├── contracts.ts                    # Contract ABIs
│   │   └── nft.ts                          # NFT utilities
│   ├── game/
│   │   ├── phaser-config.ts                # Phaser setup
│   │   ├── physics.ts                      # Physics constants
│   │   └── scenes.ts                       # Game scenes
│   ├── api/
│   │   ├── player.ts                       # Player API calls
│   │   ├── match.ts                        # Match API calls
│   │   └── leaderboard.ts                  # Leaderboard API
│   ├── hooks/
│   │   ├── usePlayer.ts                    # Player hook
│   │   ├── useMatch.ts                     # Match hook
│   │   ├── useWallet.ts                    # Wallet hook
│   │   └── useLeaderboard.ts               # Leaderboard hook
│   ├── stores/
│   │   ├── gameStore.ts                    # Game state (Zustand)
│   │   ├── playerStore.ts                  # Player state
│   │   └── uiStore.ts                      # UI state
│   ├── types/
│   │   ├── game.ts                         # Game types
│   │   ├── player.ts                       # Player types
│   │   └── contract.ts                     # Contract types
│   └── utils/
│       ├── rating.ts                       # Rating calculations
│       ├── format.ts                       # Formatting utils
│       └── validation.ts                   # Input validation
│
├── public/                                 # Static assets
│   ├── images/
│   │   ├── logo.png
│   │   ├── badge-*.png
│   │   └── player-*.png
│   ├── sounds/
│   │   ├── goal.mp3
│   │   ├── hit.mp3
│   │   └── applause.mp3
│   └── fonts/
│       └── custom-font.ttf
│
├── styles/                                 # CSS modules & globals
│   ├── globals.css                         # Global styles
│   ├── game.module.css                     # Game-specific styles
│   └── animations.css                      # Animations
│
├── config/
│   ├── networks.ts                         # Network config
│   ├── contracts.ts                        # Contract addresses
│   └── constants.ts                        # App constants
│
├── next.config.js                          # Next.js config
├── tailwind.config.ts                      # Tailwind config
├── tsconfig.json                           # TypeScript config
├── package.json
└── .env.example                            # Env template
```

---

## ⚙️ Configuration Files

### `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: [
      'ipfs.io',
      'gateway.pinata.cloud',
      'arweave.net',
      'cdn.jsdelivr.net'
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_BASE_CHAIN_ID: '8453',
    NEXT_PUBLIC_BASE_RPC: process.env.BASE_RPC_URL,
  },

  // Webpack config for Phaser
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'canvas': false,
    };
    
    // Support for WebGL
    config.externals = {
      ...config.externals,
      webgl: 'gl',
    };
    
    return config;
  },

  // Headers for Web3
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ],
      },
    ];
  },

  // Rewrites for API
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/api/:path*',
        },
      ],
    };
  },
};

module.exports = nextConfig;
```

### `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#0066FF',
        'base-dark': '#0052CC',
        'base-light': '#3D84F7',
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out',
        slideIn: 'slideIn 0.5s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 🔌 Web3 Integration

### `lib/web3/privy.ts`

```typescript
import { PrivyClient } from '@privy-io/react-auth';

export const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  config: {
    loginMethods: ['email', 'wallet'],
    appearance: {
      theme: 'dark',
      accentColor: '#0066FF',
    },
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
      requireUserPasswordOnCreate: false,
    },
    defaultChain: 'base',
  },
};
```

### `lib/web3/wagmi.ts`

```typescript
import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';

const { chains, publicClient } = configureChains(
  [base, baseSepolia],
  [
    alchemyProvider({ apiKey: process.env.ALCHEMY_ID || '' }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'Bass Ball',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || '',
  chains,
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export { chains };
```

### `app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import { PrivyProvider } from '@privy-io/react-auth';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import { wagmiConfig, chains } from '@/lib/web3/wagmi';
import { privyConfig } from '@/lib/web3/privy';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Bass Ball - Web3 Gaming on Base',
  description: 'Play PvP matches, earn NFTs, climb the leaderboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PrivyProvider appId={privyConfig.appId} config={privyConfig.config}>
          <WagmiConfig config={wagmiConfig}>
            <RainbowKitProvider chains={chains}>
              {children}
            </RainbowKitProvider>
          </WagmiConfig>
        </PrivyProvider>
      </body>
    </html>
  );
}
```

---

## 🎮 Game Engine Integration

### `lib/game/phaser-config.ts`

```typescript
import Phaser from 'phaser';

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: process.env.NODE_ENV === 'development',
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768,
    expandParent: true,
  },
  scene: [
    // Your game scenes here
  ],
  audio: {
    disableWebAudio: false,
  },
  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
  },
};

export default phaserConfig;
```

### `components/game/PhaserGame.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import phaserConfig from '@/lib/game/phaser-config';

export const PhaserGame = () => {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const config = {
      ...phaserConfig,
      parent: 'game-container',
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, []);

  return (
    <div id="game-container" className="w-full h-full bg-black rounded-lg" />
  );
};
```

---

## 📚 Custom Hooks

### `lib/hooks/usePlayer.ts`

```typescript
'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface PlayerStats {
  address: string;
  rating: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  badges: string[];
}

export const usePlayer = () => {
  const { user } = usePrivy();
  const { address } = useAccount();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (playerAddress: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/player/${playerAddress}/stats`);
      setStats(response.data);
    } catch (err) {
      setError('Failed to load player stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchStats(address);
    }
  }, [address]);

  return { stats, loading, error, refetch: () => address && fetchStats(address) };
};
```

### `lib/hooks/useMatch.ts`

```typescript
'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';

interface MatchResult {
  matchId: string;
  winner: string;
  loser: string;
  score: [number, number];
  rating: { old: number; new: number };
}

export const useMatch = () => {
  const [matchState, setMatchState] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findMatch = useCallback(async (playerAddress: string, rating: number) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/match/find', {
        playerAddress,
        playerRating: rating,
      });
      setMatchState(response.data);
      return response.data;
    } catch (err) {
      setError('Failed to find match');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitResult = useCallback(async (result: MatchResult) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/match/result', result);
      return response.data;
    } catch (err) {
      setError('Failed to submit match result');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { matchState, loading, error, findMatch, submitResult };
};
```

---

## 🎨 State Management (Zustand)

### `lib/stores/gameStore.ts`

```typescript
import { create } from 'zustand';

interface GameState {
  isPlaying: boolean;
  currentMatchId: string | null;
  score: [number, number];
  timeRemaining: number;
  
  startGame: (matchId: string) => void;
  updateScore: (p1: number, p2: number) => void;
  updateTime: (time: number) => void;
  endGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  isPlaying: false,
  currentMatchId: null,
  score: [0, 0],
  timeRemaining: 300,
  
  startGame: (matchId) =>
    set({
      isPlaying: true,
      currentMatchId: matchId,
      score: [0, 0],
      timeRemaining: 300,
    }),
  
  updateScore: (p1, p2) => set({ score: [p1, p2] }),
  
  updateTime: (time) => set({ timeRemaining: time }),
  
  endGame: () => set({ isPlaying: false, currentMatchId: null }),
}));
```

---

## 🌐 API Routes

### `app/api/match/find/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { playerAddress, playerRating } = await request.json();

    if (!playerAddress) {
      return NextResponse.json(
        { error: 'Missing playerAddress' },
        { status: 400 }
      );
    }

    // Find opponent logic (mock)
    const opponentAddress = '0x' + Math.random().toString(16).slice(2, 42);
    const matchId = 'match_' + Date.now();

    return NextResponse.json({
      matchId,
      opponent: opponentAddress,
      opponentRating: playerRating + Math.random() * 200 - 100,
      status: 'found',
    });
  } catch (error) {
    console.error('Match finding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### `app/api/player/[address]/stats/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    // Fetch from database or cache
    const stats = {
      address,
      rating: 1000,
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      badges: [],
    };

    // Cache for 5 minutes
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
```

---

## 📦 Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,css,md}\"",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

---

## 🚀 Development Workflow

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local
cp .env.example .env.local

# 3. Add credentials
NEXT_PUBLIC_PRIVY_APP_ID=your_id
NEXT_PUBLIC_WALLETCONNECT_ID=your_id

# 4. Run dev server
npm run dev

# 5. Open http://localhost:3000
```

### Hot Reloading

- **Components:** Instant reload on save
- **Styles:** CSS modules update instantly
- **API routes:** Server restart (fast)
- **Game scenes:** Need page refresh

### Browser DevTools

```bash
# React DevTools extension
https://chrome.google.com/webstore/detail/react-developer-tools/

# Redux DevTools (for Zustand)
https://chrome.google.com/webstore/detail/redux-devtools/

# Web3 debugging
Privy dashboard: https://dashboard.privy.io
```

---

## 🎯 Performance Best Practices

### Code Splitting

```typescript
// Lazy load game components
import dynamic from 'next/dynamic';

const PhaserGame = dynamic(
  () => import('@/components/game/PhaserGame'),
  {
    ssr: false,
    loading: () => <div>Loading game...</div>,
  }
);
```

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/images/badge.png"
  alt="Achievement Badge"
  width={100}
  height={100}
  priority // Only for above-fold
/>
```

### CSS-in-JS vs. Tailwind

```typescript
// ✅ GOOD: Use Tailwind for most styles
<div className="bg-slate-900 text-white p-4 rounded-lg">

// ⚠️ CAUTION: Use CSS modules for complex animations
import styles from './Animation.module.css';
<div className={styles.fadeIn}>
```

---

## 📱 Responsive Design

### Mobile-First Approach

```typescript
// Tailwind responsive classes
<div className="
  grid grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-4 
  gap-4
">

<button className="
  px-4 py-2
  md:px-6 md:py-3
  text-sm
  md:text-base
">
```

### Touch Events

```typescript
// Handle touch for mobile
const handleTouchStart = (e: React.TouchEvent) => {
  const touch = e.touches[0];
  const x = touch.clientX;
  const y = touch.clientY;
  // Game logic
};
```

---

## 🔐 Environment Variables

### `.env.example`

```env
# Privy (Auth)
NEXT_PUBLIC_PRIVY_APP_ID=clr_xxxxxxxxxxxxxxxxxxxx

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_ID=your_project_id

# Base Network
NEXT_PUBLIC_BASE_CHAIN_ID=8453
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org

# NFT Contract
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...

# Backend (if separate)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G_XXXXXXXX
```

---

## ✅ Frontend Checklist

- [ ] Next.js 14 App Router setup
- [ ] Tailwind CSS configured
- [ ] Privy authentication integrated
- [ ] RainbowKit wallet connection
- [ ] Wagmi config for Base network
- [ ] Phaser game engine loaded
- [ ] WebSocket client configured
- [ ] API routes created
- [ ] Custom hooks built
- [ ] Zustand stores set up
- [ ] Mobile responsive design
- [ ] Dark theme applied
- [ ] Error boundaries added
- [ ] Loading states implemented
- [ ] Analytics integrated
- [ ] SEO metadata added

---

## 🎬 Next Steps

1. **Start dev server:** `npm run dev`
2. **Test Privy login:** Should create wallet automatically
3. **Test wallet display:** Should show address in header
4. **Test API routes:** Should fetch player stats
5. **Load Phaser game:** Should render game canvas
6. **Test responsiveness:** Check mobile view

---

## 📚 Resources

- **Next.js:** https://nextjs.org/docs
- **Phaser:** https://phaser.io/docs
- **Tailwind:** https://tailwindcss.com/docs
- **Privy:** https://privy.io/docs
- **RainbowKit:** https://rainbowkit.com/docs
- **Wagmi:** https://wagmi.sh/docs

---

**Frontend Stack Summary:**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 14 | App routing, SSR, API routes |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Game Engine** | Phaser 3 | 2D gameplay |
| **3D Graphics** | Three.js | Optional 3D rendering |
| **Auth** | Privy | Email → wallet |
| **Wallets** | RainbowKit + Wagmi | Wallet connection |
| **State** | Zustand | Game & UI state |
| **HTTP** | Axios | API calls |
| **Real-time** | Socket.io | WebSocket events |

---

*Production-ready Web3 frontend on Base network* 🚀
