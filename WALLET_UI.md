# 🎨 Wallet UI: RainbowKit + Wagmi (Beautiful Web3 UX)

## Why RainbowKit?

### Comparison: RainbowKit vs. Alternatives

| Feature | RainbowKit ✅ | Web3Modal | Connectkit | DIY |
|---------|--------------|-----------|-----------|-----|
| **UI Quality** | Beautiful ✨ | Good | Good | Ugly |
| **Mobile** | ✅ Native | ✅ Native | ✅ Native | ❌ Complex |
| **Setup Time** | 5 min | 10 min | 10 min | 100+ hours |
| **Customization** | Easy | Medium | Medium | Hard |
| **Multi-chain** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Manual |
| **Gas Display** | ✅ Yes | Limited | Limited | No |
| **Themes** | Light/Dark | Limited | Limited | Manual |
| **Bundle Size** | 45KB | 60KB | 50KB | Variable |
| **Gaming Ready** | ✅ Perfect | Good | Good | ⚠️ Risky |

---

## Why RainbowKit + Wagmi (vs. Privy Alone)?

**Privy (Email → Auto-Wallet):**
- ✅ Account creation
- ✅ Embedded wallet
- ✅ Gas sponsorship
- ❌ Limited UI customization
- ❌ Fewer wallet options

**RainbowKit (Wallet UI):**
- ✅ Beautiful UI
- ✅ Multi-wallet support (MetaMask, Coinbase, WalletConnect)
- ✅ Mobile wallets (Rainbow, Trust, Uniswap)
- ✅ Custom themes
- ❌ Doesn't handle auto-wallet

**Best Practice: Privy + RainbowKit = Perfect UX**
- Privy handles email signup (creates wallet)
- RainbowKit handles wallet connection UI
- Together = best-in-class experience

---

## Installation

```bash
npm install @rainbow-me/rainbowkit wagmi viem
npm install @tanstack/react-query
npm install --save-dev @types/react @types/react-dom
```

---

## Complete Setup (Privy + RainbowKit + Wagmi)

### Root Layout

**`app/layout.tsx`**

```typescript
'use client';

import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/web3/wagmi-config';
import '@rainbow-me/rainbowkit/styles.css';
import '@/styles/globals.css';

const queryClient = new QueryClient();

export const metadata: Metadata = {
  title: 'Bass Ball - Play Web3 Football',
  description: 'Free-to-play PvP football on Base. Earn NFT badges.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white">
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
          config={{
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
          }}
        >
          <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
              <RainbowKitProvider
                theme={{
                  colors: {
                    accentColor: '#0066FF',
                    accentColorForeground: '#FFFFFF',
                    actionButtonBorder: '#1e293b',
                    actionButtonBorderMobile: '#1e293b',
                    actionButtonSecondaryBackground: '#1e293b',
                    closeButton: '#a1a1a1',
                    closeButtonBackground: '#1e293b',
                    connectButtonBackground: '#0066FF',
                    connectButtonBackgroundError: '#ff6b6b',
                    connectButtonInnerBackground: '#0052CC',
                    connectButtonText: '#ffffff',
                    connectButtonTextError: '#ffffff',
                    connectionIndicator: '#30B34B',
                    downloadBottomCardBackground: '#1e293b',
                    downloadTopCardBackground: '#0f172a',
                    error: '#ff6b6b',
                    generalBorder: '#334155',
                    generalBorderDim: '#1e293b',
                    menuItemBackground: '#1e293b',
                    modalBackground: '#0f172a',
                    modalBorder: '#1e293b',
                    modalText: '#ffffff',
                    modalTextDim: '#94a3b8',
                    primaryButton: '#0066FF',
                    primaryButtonPressedBackground: '#0052CC',
                    profileAction: '#0066FF',
                    profileActionHover: '#0052CC',
                    profileForeground: '#1e293b',
                    searchInputBackground: '#1e293b',
                    searchInputBorder: '#334155',
                    selectedOptionBorder: '#0066FF',
                    selectedWalletLogo: '#0066FF',
                    standby: '#94a3b8',
                  },
                  fonts: {
                    body: 'system-ui, sans-serif',
                  },
                  radii: {
                    actionButton: '8px',
                    connectButton: '8px',
                    menuButton: '8px',
                    modal: '16px',
                    modalMobile: '16px',
                  },
                }}
              >
                {children}
              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
```

---

## Wagmi Configuration

### `lib/web3/wagmi-config.ts`

```typescript
import { getDefaultWallets, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia, mainnet, sepolia } from 'wagmi/chains';
import { http } from 'viem';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID || '';

export const wagmiConfig = getDefaultConfig({
  appName: 'Bass Ball',
  projectId,
  chains: [base, mainnet, baseSepolia, sepolia],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC),
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC),
  },
  ssr: true, // Enable for Next.js
});

// Alternative: Manual config for more control
export const createWagmiConfig = () => {
  const { connectors } = getDefaultWallets({
    appName: 'Bass Ball',
    projectId,
    chains: [base, baseSepolia],
  });

  return {
    chains: [base, baseSepolia],
    connectors,
    transports: {
      [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC),
      [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC),
    },
  };
};
```

---

## ConnectButton Component

### Default RainbowKit Button

**`components/wallet/ConnectButton.tsx`**

```typescript
'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export const WalletConnectButton = () => {
  return (
    <ConnectButton
      accountStatus="avatar"
      chainStatus="icon"
      showBalance={true}
      label="Connect Wallet"
    />
  );
};
```

### Custom Connect Button

**`components/wallet/CustomConnectButton.tsx`**

```typescript
'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';

export const CustomConnectButton = () => {
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({ address });

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
              >
                Connect Wallet
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition"
              >
                Wrong network
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={openChainModal}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium flex items-center gap-2 transition"
                >
                  {chain.hasIcon && chain.iconUrl && (
                    <img
                      alt={chain.name ?? 'Chain icon'}
                      src={chain.iconUrl}
                      style={{ width: 16, height: 16 }}
                    />
                  )}
                  {chain.name}
                </button>

                <button
                  onClick={openAccountModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
                >
                  {account.displayBalance
                    ? `${account.displayBalance} • ${account.displayName}`
                    : account.displayName}
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
```

---

## Advanced Wallet Components

### Wallet Info Card

**`components/wallet/WalletInfo.tsx`**

```typescript
'use client';

import { useAccount, useBalance, useEnsName } from 'wagmi';
import { base } from 'wagmi/chains';
import { useEffect, useState } from 'react';

export const WalletInfo = () => {
  const { address, chain, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { data: ensName } = useEnsName({ address });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isConnected || !address) {
    return null;
  }

  const isCorrectChain = chain?.id === base.id;

  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
      <div className="space-y-2">
        {/* Network Status */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Network</span>
          <div className={`flex items-center gap-2 ${isCorrectChain ? 'text-green-400' : 'text-yellow-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isCorrectChain ? 'bg-green-400' : 'bg-yellow-400'}`} />
            {isCorrectChain ? 'Base Mainnet' : `${chain?.name} (switch required)`}
          </div>
        </div>

        {/* Address */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Address</span>
          <div className="text-right">
            <div className="font-mono text-sm">
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
            {ensName && <div className="text-xs text-slate-500">{ensName}</div>}
          </div>
        </div>

        {/* Balance */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Balance</span>
          <div className="text-right">
            <div className="font-medium">
              {balance?.formatted || '0'} {balance?.symbol || 'ETH'}
            </div>
            <div className="text-xs text-slate-500">
              ${(parseFloat(balance?.formatted || '0') * 2500).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Network Switcher

**`components/wallet/NetworkSwitcher.tsx`**

```typescript
'use client';

import { useSwitchChain } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { useState } from 'react';

export const NetworkSwitcher = () => {
  const { chains, switchChain } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);

  const networks = [
    {
      id: base.id,
      name: 'Base Mainnet',
      color: 'from-blue-600 to-blue-700',
      icon: '🔵',
    },
    {
      id: baseSepolia.id,
      name: 'Base Sepolia (Testnet)',
      color: 'from-purple-600 to-purple-700',
      icon: '🟣',
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-medium transition"
      >
        Switch Network
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-10">
          {networks.map((network) => (
            <button
              key={network.id}
              onClick={() => {
                switchChain?.({ chainId: network.id });
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg text-left transition flex items-center gap-2"
            >
              <span className="text-xl">{network.icon}</span>
              <span className="font-medium">{network.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## Custom Hooks for Wallet Interactions

### `useWalletTransactions` Hook

**`lib/hooks/useWalletTransactions.ts`**

```typescript
'use client';

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useCallback } from 'react';
import { encodeFunctionData, parseEther } from 'viem';

export const useWalletTransactions = () => {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });
  const [error, setError] = useState<string | null>(null);

  const sendTransaction = useCallback(
    async (to: string, value: string, functionName?: string, args?: any[]) => {
      try {
        if (!isConnected || !address) {
          throw new Error('Wallet not connected');
        }

        setError(null);

        const config: any = {
          account: address,
          to,
          value: parseEther(value),
        };

        if (functionName && args) {
          config.data = encodeFunctionData({
            functionName,
            args,
          });
        }

        return await writeContract(config);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      }
    },
    [address, isConnected, writeContract]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sendTransaction,
    hash,
    isPending,
    isConfirming,
    receipt,
    error,
    resetError,
    isSuccess: receipt?.blockHash !== undefined,
  };
};
```

### `useContractRead` Hook

**`lib/hooks/useContractRead.ts`**

```typescript
'use client';

import { useReadContract } from 'wagmi';
import { useCallback } from 'react';

export const useContractRead = (
  address: string,
  abi: any[],
  functionName: string,
  args?: any[],
  options?: any
) => {
  const { data, isLoading, error, refetch } = useReadContract({
    address: address as `0x${string}`,
    abi,
    functionName,
    args,
    ...options,
  });

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    isLoading,
    error,
    refresh,
  };
};
```

---

## Transaction Status Display

### Transaction Toast Component

**`components/wallet/TransactionToast.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';

interface TransactionToastProps {
  hash?: string;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: string | null;
  onClose: () => void;
}

export const TransactionToast = ({
  hash,
  isPending,
  isConfirming,
  isSuccess,
  error,
  onClose,
}: TransactionToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isSuccess || error) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, error, onClose]);

  if (!isVisible && !isPending && !isConfirming) return null;

  const statusConfig = {
    pending: {
      bg: 'bg-blue-900',
      border: 'border-blue-700',
      text: 'text-blue-100',
      icon: '⏳',
      message: 'Transaction pending...',
    },
    confirming: {
      bg: 'bg-yellow-900',
      border: 'border-yellow-700',
      text: 'text-yellow-100',
      icon: '🔄',
      message: 'Confirming...',
    },
    success: {
      bg: 'bg-green-900',
      border: 'border-green-700',
      text: 'text-green-100',
      icon: '✅',
      message: 'Transaction confirmed!',
    },
    error: {
      bg: 'bg-red-900',
      border: 'border-red-700',
      text: 'text-red-100',
      icon: '❌',
      message: error || 'Transaction failed',
    },
  };

  const currentStatus = error
    ? 'error'
    : isSuccess
      ? 'success'
      : isConfirming
        ? 'confirming'
        : 'pending';
  const config = statusConfig[currentStatus];

  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg border ${config.bg} ${config.border} ${config.text} max-w-sm`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{config.icon}</span>
        <div className="flex-1">
          <p className="font-medium">{config.message}</p>
          {hash && (
            <a
              href={`https://basescan.org/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline hover:opacity-80"
            >
              View on Basescan →
            </a>
          )}
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-lg hover:opacity-70"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
```

---

## Full Example: NFT Claim Page

**`app/(game)/claim/page.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWalletTransactions } from '@/lib/hooks/useWalletTransactions';
import { TransactionToast } from '@/components/wallet/TransactionToast';
import { WalletInfo } from '@/components/wallet/WalletInfo';
import { NFT_CONTRACT_ABI } from '@/lib/web3/contracts';

export default function ClaimNFTPage() {
  const { address, isConnected } = useAccount();
  const { sendTransaction, isPending, isConfirming, isSuccess, error, resetError } =
    useWalletTransactions();
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  const badges = [
    {
      id: 'og-player',
      name: 'OG Player',
      description: 'First 1000 players',
      icon: '🏆',
    },
    {
      id: 'champion',
      name: 'Champion',
      description: 'Won 10 matches',
      icon: '👑',
    },
    {
      id: 'top-1',
      name: 'Top 1%',
      description: 'In top 1% of players',
      icon: '⭐',
    },
  ];

  const handleClaimNFT = async (badgeId: string) => {
    try {
      await sendTransaction(
        process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!,
        '0',
        'claimBadge',
        [badgeId]
      );
    } catch (err) {
      console.error('Claim failed:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Connect Wallet to Claim NFTs</h1>
          <p className="text-slate-400 mb-8">Use the wallet button in the top right</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🎖️ Claim Your Badges</h1>

        {/* Wallet Info */}
        <div className="mb-8">
          <WalletInfo />
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="p-6 bg-slate-800 rounded-lg border border-slate-700 hover:border-blue-500 transition"
            >
              <div className="text-5xl mb-4">{badge.icon}</div>
              <h3 className="text-xl font-bold mb-2">{badge.name}</h3>
              <p className="text-slate-400 mb-6">{badge.description}</p>

              <button
                onClick={() => {
                  setSelectedBadge(badge.id);
                  handleClaimNFT(badge.id);
                }}
                disabled={isPending || isConfirming || isSuccess}
                className={`w-full py-2 rounded-lg font-medium transition ${
                  isPending || isConfirming
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isPending && selectedBadge === badge.id
                  ? '⏳ Claiming...'
                  : isConfirming && selectedBadge === badge.id
                    ? '🔄 Confirming...'
                    : 'Claim NFT'}
              </button>
            </div>
          ))}
        </div>

        {/* Transaction Toast */}
        <TransactionToast
          isPending={isPending}
          isConfirming={isConfirming}
          isSuccess={isSuccess && selectedBadge !== null}
          error={error}
          onClose={() => {
            resetError();
            setSelectedBadge(null);
          }}
        />
      </div>
    </div>
  );
}
```

---

## Environment Variables

### `.env.local`

```env
# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_ID=your_walletconnect_project_id

# RPC Endpoints
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
NEXT_PUBLIC_MAINNET_RPC=https://eth.llamarpc.com

# Smart Contracts
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_MATCH_CONTRACT_ADDRESS=0x...

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=clr_xxxxxxxxxxxxxxxxxxxx
```

---

## Mobile Optimization

### Responsive Design

```typescript
// components/wallet/MobileWalletButton.tsx
'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const MobileWalletButton = () => {
  return (
    <ConnectButton
      accountStatus={{
        smallScreen: 'avatar',
        largeScreen: 'full',
      }}
      chainStatus={{
        smallScreen: 'icon',
        largeScreen: 'full',
      }}
      showBalance={true}
    />
  );
};
```

### Touch-Friendly Design

```typescript
// Make buttons bigger on mobile
<button className="
  px-4 py-2                    // Desktop
  sm:px-3 sm:py-1.5           // Tablet
  active:scale-95              // Touch feedback
  transition-transform
">
  Claim NFT
</button>
```

---

## Testing Wallet Integration

### Local Testing with Hardhat

```bash
# Terminal 1: Start local blockchain
npx hardhat node

# Terminal 2: Run your app
npm run dev

# In browser:
# 1. Add Hardhat network to MetaMask
# 2. RPC: http://localhost:8545
# 3. Chain ID: 31337
# 4. Import test account (from Hardhat output)
# 5. Now has unlimited test ETH
```

### Test Transactions

```typescript
// Test claiming NFT locally
const testClaimNFT = async () => {
  const tx = await contract.claimBadge('og-player');
  await tx.wait();
  console.log('✅ NFT claimed successfully');
};
```

---

## Error Handling

### Network Mismatch

```typescript
const { chain } = useAccount();
const { switchChain } = useSwitchChain();

if (chain?.id !== base.id) {
  return (
    <button onClick={() => switchChain?.({ chainId: base.id })}>
      Switch to Base
    </button>
  );
}
```

### Insufficient Balance

```typescript
const { balance } = useBalance({ address });

if (balance?.value < cost) {
  return <div>Insufficient balance for transaction</div>;
}
```

### User Rejected Transaction

```typescript
try {
  await sendTransaction(...);
} catch (err) {
  if (err.message.includes('user rejected')) {
    console.log('User cancelled transaction');
  }
}
```

---

## Best Practices

### DO ✅
- Show wallet address truncated (0x1234...5678)
- Display balance in USD
- Use RainbowKit's default theme initially
- Show transaction status toast
- Allow network switching
- Require correct chain for transactions

### DON'T ❌
- Don't require wallet on home page
- Don't force mainnet (testnet is fine)
- Don't show raw contract ABIs
- Don't forget to handle errors
- Don't assume wallet is always connected
- Don't ignore gas price warnings

---

## Performance

### Bundle Impact
- RainbowKit: 45KB (gzipped)
- Wagmi: 35KB (gzipped)
- Viem: 25KB (gzipped)
- **Total: ~105KB** (vs. 570KB for game engine)

### Lazy Loading

```typescript
import dynamic from 'next/dynamic';

const ConnectButton = dynamic(
  () => import('@rainbow-me/rainbowkit').then(mod => mod.ConnectButton),
  { ssr: false }
);
```

---

## Summary Table

| Component | Purpose | Size |
|-----------|---------|------|
| **RainbowKit** | Wallet connection UI | 45KB |
| **Wagmi** | Ethereum interactions | 35KB |
| **Viem** | Low-level blockchain calls | 25KB |
| **Privy** | Email authentication | 60KB |
| **Total** | Complete Web3 stack | ~165KB |

---

## Resources

- **RainbowKit Docs:** https://rainbowkit.com/docs
- **Wagmi Docs:** https://wagmi.sh/
- **Viem Docs:** https://viem.sh/
- **WalletConnect:** https://walletconnect.com/
- **Base Network:** https://docs.base.org/

---

**Beautiful, production-ready wallet UI in 15 minutes** 🎨
