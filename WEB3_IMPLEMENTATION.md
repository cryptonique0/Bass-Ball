# 🔐 Web3 Authentication System Implementation

## Overview

Complete Web3 wallet authentication system for Bass Ball featuring:
- **Multiple Wallet Support**: MetaMask, Coinbase Wallet, WalletConnect, and more
- **Base Chain Integration**: Seamless Base network connection
- **Beautiful UI**: Professional login and dashboard screens
- **Type-Safe**: Full TypeScript support
- **Production Ready**: Error handling and security best practices

---

## What Was Built

### 1. **Web3 Configuration** (`lib/wagmiConfig.ts`)
- Wagmi + RainbowKit configuration
- Base Mainnet & Base Sepolia support
- Multiple RPC providers (Infura + public)
- WalletConnect integration

### 2. **Web3 Provider** (`components/Web3Provider.tsx`)
- Root-level context provider
- Wraps entire app with Web3 capabilities
- Manages wallet connections
- Handles blockchain operations

### 3. **Wallet Connector** (`components/WalletConnector.tsx`)
- Display wallet connection status
- Manual wallet selection buttons
- Disconnect functionality
- RainbowKit button integration

### 4. **Wallet Login** (`components/WalletLogin.tsx`)
- Beautiful login interface
- Automatic network detection
- Network switch prompts
- Connected wallet info display
- Multi-step authentication flow

### 5. **User Identity Hooks** (`hooks/useUserIdentity.ts`)
- `useUserIdentity()` - Access wallet and network info
- `useGameReady()` - Check game prerequisites
- Network switching utilities
- Balance management

### 6. **Dashboard** (`app/dashboard/page.tsx`)
- Main game hub after login
- Game mode selection (AI vs Player)
- Quick links to features
- Player stats display
- Network status display

### 7. **Type Definitions** (`types/web3.ts`)
- User profile types
- Wallet info types
- NFT types
- Match reward types
- Game session types
- Leaderboard types

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Root Layout                              │
│  ├─ Web3Provider (wagmi + RainbowKit)                      │
│  └─ All Pages & Components                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
   ┌────▼──┐  ┌───▼────┐  ┌──▼────────┐
   │Login  │  │Dashboard│  │Protected  │
   │Page   │  │Page     │  │Pages      │
   └────┬──┘  └───┬────┘   └──┬───────┘
        │         │           │
        └────┬────┴───┬───────┘
             │        │
      ┌──────▼┐  ┌───▼──────┐
      │wagmi  │  │RainbowKit │
      │Hooks  │  │UI         │
      └───────┘  └───────────┘
             │
      ┌──────▼──────────┐
      │  Blockchain    │
      │  (Base Chain)  │
      └────────────────┘
```

---

## Installation & Setup

### 1. Install Dependencies
```bash
npm install wagmi viem @rainbow-me/rainbowkit ethers
```

### 2. Get API Keys

**WalletConnect Project ID:**
1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com/)
2. Create project and copy ID

**Infura API Key:**
1. Go to [infura.io](https://www.infura.io/)
2. Create Web3 API key

### 3. Setup Environment Variables
```env
# .env.local
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_INFURA_KEY=your_infura_key
```

### 4. Update Layout
```tsx
// app/layout.tsx
import { Web3Provider } from '@/components/Web3Provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
```

---

## Usage Examples

### Login Flow
```tsx
// app/page.tsx
import { WalletLogin } from '@/components/WalletLogin';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <WalletLogin
      onLoginSuccess={(address) => {
        console.log('User logged in:', address);
        router.push('/dashboard');
      }}
      onLoginFailed={(error) => {
        console.error('Login failed:', error);
      }}
    />
  );
}
```

### Access Wallet Info
```tsx
// Any component wrapped by Web3Provider
import { useUserIdentity } from '@/hooks/useUserIdentity';

export function MyComponent() {
  const {
    address,
    formattedAddress,
    isConnected,
    connector,        // MetaMask, Coinbase Wallet, etc.
    chain,           // Network name
    isOnBase,        // True if on Base chain
    balance,         // ETH balance as string
    switchToBase,    // Function to switch network
  } = useUserIdentity();

  return (
    <div>
      <p>Address: {formattedAddress}</p>
      <p>Balance: {balance} ETH</p>
      <p>Network: {chain}</p>
      {!isOnBase && (
        <button onClick={switchToBase}>Switch to Base</button>
      )}
    </div>
  );
}
```

### Check Game Readiness
```tsx
import { useGameReady } from '@/hooks/useUserIdentity';

export function GameStartButton() {
  const { isGameReady, readyChecks } = useGameReady(0.001); // Min 0.001 ETH

  if (!readyChecks.walletConnected) {
    return <p>Connect your wallet first</p>;
  }

  if (!readyChecks.onCorrectChain) {
    return <p>Switch to Base network</p>;
  }

  if (!readyChecks.sufficientBalance) {
    return <p>You need at least 0.001 ETH</p>;
  }

  return (
    <button disabled={!isGameReady}>
      Start Game
    </button>
  );
}
```

### Protected Page
```tsx
'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div>
      <p>Only connected users can see this</p>
    </div>
  );
}
```

### Use RainbowKit Button
```tsx
import { RainbowConnectButton } from '@/components/WalletConnector';

export function Header() {
  return (
    <header>
      <h1>Bass Ball</h1>
      <RainbowConnectButton />
    </header>
  );
}
```

---

## Supported Wallets

The system automatically supports:

### Browser Extensions
- ✅ MetaMask
- ✅ Coinbase Wallet
- ✅ Brave Wallet
- ✅ Opera Wallet
- ✅ Rainbow Wallet
- ✅ Ledger
- ✅ Trezor

### Mobile Wallets (via WalletConnect)
- ✅ Trust Wallet
- ✅ Argent
- ✅ Ledger Live
- ✅ Gnosis Safe
- ✅ Rainbow
- ✅ 100+ more wallets

### QR Code Connection
- Users can scan with any WalletConnect-compatible wallet
- No app installation required for many wallets

---

## Network Support

### Mainnet
- **Base** (chainId: 8453)
  - RPC: `https://mainnet.base.org`
  - Explorer: `https://basescan.org`

### Testnet
- **Base Sepolia** (chainId: 84532)
  - RPC: `https://sepolia.base.org`
  - Explorer: `https://sepolia.basescan.org`
  - Faucet: [basefaucet.io](https://www.basefaucet.io/)

---

## Components Breakdown

### WalletLogin Component
```
┌─────────────────────────────────────────┐
│         🎯 WALLET LOGIN SCREEN          │
├─────────────────────────────────────────┤
│                                         │
│  ⚽ Bass Ball                          │
│  Football on Base Chain                 │
│                                         │
│  [Connect Wallet Button]                │
│                                         │
│  Supported:                             │
│  • MetaMask                             │
│  • Coinbase Wallet                      │
│  • WalletConnect                        │
│  • And more...                          │
│                                         │
└─────────────────────────────────────────┘
```

### After Connected to Wrong Network
```
┌─────────────────────────────────────────┐
│          ⚠️ WRONG NETWORK                 │
├─────────────────────────────────────────┤
│                                         │
│  Connected: 0x123...456                 │
│                                         │
│  [Switch to Base Network Button]        │
│                                         │
│  "Your wallet will prompt you to        │
│   switch to the Base network"           │
│                                         │
└─────────────────────────────────────────┘
```

### After Connected & Ready
```
┌─────────────────────────────────────────┐
│           ✅ READY TO PLAY!              │
├─────────────────────────────────────────┤
│                                         │
│  Wallet: 0x123...456                    │
│  Balance: 2.5 ETH                       │
│  Network: 🌐 Base Chain                 │
│                                         │
│  [Enter Bass Ball Button]               │
│                                         │
└─────────────────────────────────────────┘
```

### Dashboard
```
┌──────────────────────────────────────────────┐
│  ⚽ Bass Ball        [Connect Button]         │
├──────────────────────────────────────────────┤
│                                              │
│  Welcome, 0x123...456! 🎮                   │
│  Choose your game mode                       │
│                                              │
│  ┌──────────────────┬──────────────────┐   │
│  │     🤖 AI        │     👥 Player    │   │
│  │   Play vs AI     │  Play vs Player  │   │
│  └──────────────────┴──────────────────┘   │
│                                              │
│  Quick Links:                                │
│  [Build Team] [My Club] [League] [More]    │
│                                              │
│  Stats:                                      │
│  Matches: 0  |  Win Rate: 0%  |  Rewards: 0│
│                                              │
│  🌐 Connected to Base Chain                 │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Files Created/Modified

### Created:
- ✅ `lib/wagmiConfig.ts` - Wagmi configuration
- ✅ `components/Web3Provider.tsx` - Provider wrapper
- ✅ `components/WalletConnector.tsx` - Wallet UI
- ✅ `components/WalletLogin.tsx` - Login screen
- ✅ `hooks/useUserIdentity.ts` - Identity hooks
- ✅ `app/dashboard/page.tsx` - Game dashboard
- ✅ `types/web3.ts` - Type definitions
- ✅ `WEB3_AUTH_SETUP.md` - Setup guide

### Modified:
- ✅ `app/layout.tsx` - Added Web3Provider

---

## Key Features

### ✅ Auto-Connect
- App automatically connects to previously connected wallet
- Saves user preference

### ✅ Network Detection
- Automatically detects current network
- Prompts user to switch if wrong network
- One-click network switching

### ✅ Balance Management
- Real-time balance updates
- Shows ETH balance in wallet
- Minimum balance requirements

### ✅ Error Handling
- User-friendly error messages
- Network error recovery
- Transaction failure handling

### ✅ Mobile Responsive
- Works on desktop and mobile
- WalletConnect QR scanning on mobile
- Native wallet apps on mobile

### ✅ TypeScript Support
- Full type definitions
- Intellisense support
- Runtime type safety

---

## Security Best Practices

🔐 **What's Secure:**
- Private keys never leave user's wallet
- No seed phrase requests
- All transactions user-approved
- HTTPS only communication
- No sensitive data stored

🔐 **Best Practices:**
- Always use HTTPS in production
- Validate contract addresses
- Use Ethers.js for blockchain calls
- Implement rate limiting
- Audit smart contracts

---

## Testing

### Local Testing
```bash
# 1. Set environment variables
cp .env.example .env.local
# Edit with your keys

# 2. Run dev server
npm run dev

# 3. Open http://localhost:3000

# 4. Connect with MetaMask Testnet
```

### Using Base Sepolia Testnet
1. Add Base Sepolia to MetaMask
2. Get testnet ETH from [basefaucet.io](https://www.basefaucet.io/)
3. Connect and test

---

## Troubleshooting

### "Window is not defined"
- Component must have `'use client'` directive
- Use `useEffect` to check `mounted` state

### MetaMask not showing
- User needs extension installed
- Try WalletConnect as alternative
- Clear browser cache and restart

### Balance showing 0
- Refresh the page
- Check RPC endpoint is working
- Verify correct network selected

### Network switch fails
- Check network parameters in wagmiConfig
- Ensure RPC URLs are valid
- Check wallet compatibility

---

## Next Steps

1. **Get API Keys** from WalletConnect and Infura
2. **Add to .env.local** with your keys
3. **Test Login Flow** with MetaMask
4. **Deploy Dashboard** to show game modes
5. **Integrate with Game** pages using hooks

---

## Files & Locations

```
Bass-Ball/
├── lib/
│   └── wagmiConfig.ts           ← Wagmi setup
├── components/
│   ├── Web3Provider.tsx         ← Provider wrapper
│   ├── WalletConnector.tsx      ← Wallet UI
│   └── WalletLogin.tsx          ← Login screen
├── hooks/
│   └── useUserIdentity.ts       ← Identity hooks
├── types/
│   └── web3.ts                  ← Type definitions
├── app/
│   ├── layout.tsx               ← Updated with Web3
│   ├── page.tsx                 ← Main page
│   └── dashboard/
│       └── page.tsx             ← Game dashboard
└── WEB3_AUTH_SETUP.md          ← Setup guide
```

---

**Web3 Authentication System** - Complete & Production-Ready! 🚀
