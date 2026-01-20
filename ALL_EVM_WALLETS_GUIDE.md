# 🔗 All-EVM Wallet Implementation Guide

## Overview

Comprehensive all-EVM wallet support for Bass Ball, enabling users to connect wallets and interact with any Ethereum Virtual Machine (EVM) compatible blockchain.

**Supported Chains: 18 Total**
- 9 Mainnet chains
- 9 Testnet chains

---

## 🎯 Supported Networks

### Layer 1 Mainnet (4 chains)
- ✅ **Ethereum** - Chain ID 1
- ✅ **Polygon** - Chain ID 137
- ✅ **Avalanche** - Chain ID 43114
- ✅ **Gnosis Chain** - Chain ID 100
- ✅ **Celo** - Chain ID 42220

### Layer 2 Mainnet (4 chains)
- ✅ **Arbitrum One** - Chain ID 42161
- ✅ **Optimism** - Chain ID 10
- ✅ **Base** - Chain ID 8453
- ✅ **Zora Network** - Chain ID 7777777

### Layer 1 Testnet (5 chains)
- ✅ **Sepolia** - Chain ID 11155111
- ✅ **Mumbai** - Chain ID 80001
- ✅ **Avalanche Fuji** - Chain ID 43113
- ✅ **Gnosis Chiado** - Chain ID 10200
- ✅ **Celo Alfajores** - Chain ID 44787

### Layer 2 Testnet (4 chains)
- ✅ **Arbitrum Sepolia** - Chain ID 421614
- ✅ **Optimism Sepolia** - Chain ID 11155420
- ✅ **Base Sepolia** - Chain ID 84532
- ✅ **Zora Sepolia** - Chain ID 999999999

---

## 📁 Files Created

### 1. **lib/wagmiAllEVMConfig.ts** (350+ lines)
Core configuration for all EVM chains with Wagmi.

**Features:**
- Production-only (mainnet) configuration
- Development configuration (mainnet + testnet)
- Chain metadata and categorization
- Utility functions for chain management

**Key Functions:**
```typescript
// Create configurations
createWagmiConfigProduction()
createWagmiConfigDevelopment()

// Chain utilities
getChainMetadata(chainId)
getSupportedChainIds()
isChainSupported(chainId)
getChainsByCategory(category)
```

### 2. **hooks/useAllEVMWallet.ts** (300+ lines)
React hooks for wallet management across all EVM chains.

**7 Hooks Provided:**
- `useAllEVMWallet()` - Main wallet hook
- `useMultiChainBalance()` - Balance checking
- `useCrossChainWallet()` - Cross-chain detection
- `useWalletConnectivity()` - Connection status
- `useAvailableEVMChains()` - List all chains
- `useChainSwitcher()` - Safe chain switching
- `useWalletRequired()` - Requirement checking

### 3. **components/AllEVMWalletComponents.tsx** (350+ lines)
Production-ready React components for UI.

**8 Components Provided:**
- `AllEVMConnectButton` - Enhanced connect button
- `ChainSwitcher` - Chain selection dropdown
- `WalletStatusBadge` - Status indicator
- `AvailableChainsGrid` - Chain browser
- `MultiChainWalletDisplay` - Full wallet info
- `ChainInfoCard` - Individual chain details
- `WalletConnectionStatus` - Connection indicator

---

## 🚀 Quick Start

### 1. Update Your Layout/Provider

```tsx
// app/layout.tsx
import { wagmiConfig, chains, RainbowKitProvider } from '@/lib/wagmiAllEVMConfig';
import { WagmiConfig } from 'wagmi';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider chains={chains}>
            {children}
          </RainbowKitProvider>
        </WagmiConfig>
      </body>
    </html>
  );
}
```

### 2. Use Wallet Hook in Component

```tsx
'use client';

import { useAllEVMWallet } from '@/hooks/useAllEVMWallet';

export function MyWallet() {
  const {
    address,
    formattedAddress,
    isConnected,
    chainName,
    balance,
    switchToChain,
  } = useAllEVMWallet();

  if (!isConnected) {
    return <div>Please connect wallet</div>;
  }

  return (
    <div>
      <p>Connected: {formattedAddress}</p>
      <p>Chain: {chainName}</p>
      <p>Balance: {balance} ETH</p>
      <button onClick={() => switchToChain(137)}>
        Switch to Polygon
      </button>
    </div>
  );
}
```

### 3. Add UI Components

```tsx
import {
  ChainSwitcher,
  WalletStatusBadge,
  MultiChainWalletDisplay,
} from '@/components/AllEVMWalletComponents';

export function Header() {
  return (
    <div className="flex justify-between items-center p-4">
      <h1>Bass Ball</h1>
      <WalletStatusBadge />
      <ChainSwitcher />
    </div>
  );
}

export function WalletPage() {
  return (
    <div>
      <MultiChainWalletDisplay />
    </div>
  );
}
```

---

## 📚 API Reference

### Configuration

#### `createWagmiConfigProduction()`
Creates Wagmi config for production (mainnet only).

```typescript
const { wagmiConfig, chains } = createWagmiConfigProduction();
```

#### `createWagmiConfigDevelopment()`
Creates Wagmi config for development (mainnet + testnet).

```typescript
const { wagmiConfig, chains } = createWagmiConfigDevelopment();
```

### Hooks

#### `useAllEVMWallet()`
Main hook for wallet management.

```typescript
const {
  // Wallet info
  address,
  formattedAddress,
  isConnected,
  connector,

  // Chain info
  chainId,
  chainName,
  chainCategory,
  isCurrentChainSupported,
  chainExplorer,

  // Available chains
  availableChainIds,

  // Balance
  balance,
  balanceSymbol,

  // Actions
  switchToChain,
  disconnect,
} = useAllEVMWallet();
```

#### `useAvailableEVMChains()`
Get list of all available chains organized by category.

```typescript
const {
  allChains,           // Array of all chain metadata
  chainsByCategory,    // Grouped by L1/L2/Testnet
  totalSupported,      // Number of supported chains
} = useAvailableEVMChains();
```

#### `useChainSwitcher()`
Safe chain switching with error handling.

```typescript
const {
  switchChainSafely,   // Function to switch chain
  isSwitching,         // Loading state
  error,               // Error message if any
} = useChainSwitcher();
```

#### `useWalletRequired(requiredChainId?)`
Check if wallet is connected and on correct chain.

```typescript
const {
  isReady,             // All checks passed
  readyChecks: {
    walletConnected,   // Is wallet connected
    correctChain,      // Is on correct chain (if specified)
    allChecks,         // Both checks passed
  },
} = useWalletRequired(137); // Optional: require specific chain
```

### Components

#### `ChainSwitcher`
Dropdown component to switch between chains.

```tsx
import { ChainSwitcher } from '@/components/AllEVMWalletComponents';

<ChainSwitcher />
```

#### `WalletStatusBadge`
Compact wallet status display.

```tsx
import { WalletStatusBadge } from '@/components/AllEVMWalletComponents';

<WalletStatusBadge />
// Shows: "✓ 0x1234...5678 • Base • 1.5 ETH"
```

#### `MultiChainWalletDisplay`
Full wallet information panel.

```tsx
import { MultiChainWalletDisplay } from '@/components/AllEVMWalletComponents';

<MultiChainWalletDisplay />
```

#### `AvailableChainsGrid`
Grid display of all supported chains.

```tsx
import { AvailableChainsGrid } from '@/components/AllEVMWalletComponents';

<AvailableChainsGrid />
```

---

## 💡 Usage Examples

### Example 1: Switch to Specific Chain

```typescript
import { useAllEVMWallet } from '@/hooks/useAllEVMWallet';

export function PolygonButton() {
  const { switchToChain, chainId } = useAllEVMWallet();

  return (
    <button
      onClick={() => switchToChain(137)}
      disabled={chainId === 137}
      className="btn"
    >
      {chainId === 137 ? '✓ On Polygon' : 'Switch to Polygon'}
    </button>
  );
}
```

### Example 2: Display Chain-Specific Info

```typescript
import { useAllEVMWallet } from '@/hooks/useAllEVMWallet';
import { ChainInfoCard } from '@/components/AllEVMWalletComponents';

export function ChainInfo() {
  const { chainId } = useAllEVMWallet();

  if (!chainId) return null;

  return <ChainInfoCard chainId={chainId} />;
}
```

### Example 3: Multi-Chain Balance Checker

```typescript
import { useMultiChainBalance } from '@/hooks/useAllEVMWallet';
import { useAvailableEVMChains } from '@/hooks/useAllEVMWallet';

export function BalanceChecker() {
  const { address } = useMultiChainBalance();
  const { allChains } = useAvailableEVMChains();

  // In production, fetch balance for each chain
  return (
    <div>
      {allChains.map(chain => (
        <div key={chain.id}>
          <p>{chain.name}</p>
          {/* Fetch and display balance */}
        </div>
      ))}
    </div>
  );
}
```

### Example 4: Require Specific Chain

```typescript
import { useWalletRequired } from '@/hooks/useAllEVMWallet';

export function ArbitrumOnly() {
  const { isReady, readyChecks } = useWalletRequired(42161); // Arbitrum

  if (!readyChecks.walletConnected) {
    return <p>Please connect wallet</p>;
  }

  if (!readyChecks.correctChain) {
    return <p>Please switch to Arbitrum</p>;
  }

  if (isReady) {
    return <p>Ready to use Arbitrum features</p>;
  }

  return null;
}
```

### Example 5: Chain-Aware UI

```typescript
import { useAllEVMWallet } from '@/hooks/useAllEVMWallet';

export function ChainAwareUI() {
  const { chainCategory, chainName } = useAllEVMWallet();

  return (
    <div>
      <h2>Connected to {chainName}</h2>
      {chainCategory === 'L2' && (
        <p>✓ You're on an optimized Layer 2 network!</p>
      )}
      {chainCategory === 'L1 Testnet' && (
        <p>⚠️ You're on a testnet. Use test funds only.</p>
      )}
    </div>
  );
}
```

---

## 🔒 Security Considerations

✅ **No Private Keys**
- All wallet signing handled by wallet extensions
- No private keys stored or exposed
- Uses RainbowKit for secure connections

✅ **Chain Verification**
- Always check `isChainSupported()` before operations
- Verify current chain before transactions
- Handle chain switch failures gracefully

✅ **Environment Safety**
- Production uses mainnet only by default
- Development can opt-in to testnet
- Chain ID validation on all operations

✅ **Error Handling**
- All async operations wrapped in try-catch
- User-friendly error messages
- Automatic retry for transient failures

---

## ⚙️ Environment Configuration

### .env.local

```env
# Wallet Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_INFURA_KEY=your_infura_key
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key

# Chain Configuration
NEXT_PUBLIC_USE_DEV_CHAINS=false  # Set to true for testnet support
```

### Development vs Production

**Development Mode** (testnet support):
```env
NEXT_PUBLIC_USE_DEV_CHAINS=true
```

**Production Mode** (mainnet only):
```env
NEXT_PUBLIC_USE_DEV_CHAINS=false
```

---

## 📊 Chain Categorization

Chains are automatically categorized:

- **L1**: Ethereum, Polygon, Avalanche, Gnosis, Celo
- **L2**: Arbitrum, Optimism, Base, Zora
- **L1 Testnet**: Sepolia, Mumbai, Fuji, Chiado, Alfajores
- **L2 Testnet**: ArbitrumSepolia, OptimismSepolia, BaseSepolia, ZoraSepolia

Access by category:

```typescript
const l2Chains = getChainsByCategory('L2');
const testnets = getChainsByCategory('L2 Testnet');
```

---

## 🎨 UI/UX Best Practices

### Show Current Chain
Always display the current connected chain to users.

```tsx
<WalletStatusBadge />
// or
<ChainSwitcher />
```

### Chain Availability
Show available chains grouped by category.

```tsx
<AvailableChainsGrid />
```

### Wallet Requirements
Check requirements before sensitive operations.

```tsx
const { isReady } = useWalletRequired(137); // Polygon required
if (isReady) {
  // Proceed with operation
}
```

### Error Messages
Always provide clear error messages for chain issues.

```typescript
const { switchChainSafely, error } = useChainSwitcher();

if (error) {
  console.error(`Chain switch failed: ${error}`);
}
```

---

## 🐛 Troubleshooting

### Wallet Not Connecting
- Check `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
- Ensure wallet extension is installed
- Try refreshing the page

### Chain Switch Fails
- Verify chain is supported via `isChainSupported()`
- Check wallet extension supports the chain
- Ensure RPC endpoints are accessible

### Balance Not Showing
- Verify wallet is connected
- Check current chain has ETH balance
- Ensure RPC endpoint for chain is responsive

### Wrong Chain Displayed
- Check chain ID matches connected wallet
- Use `getChainMetadata(chainId)` to verify
- Try switching chains and back

---

## 📈 Performance

- **Chain data**: Cached and memoized
- **Wallet state**: Auto-refreshed on changes
- **Component renders**: Optimized with useMemo/useCallback
- **RPC calls**: Batched and deduplicated

---

## 🔮 Future Enhancements

- [ ] Multi-signature wallet support
- [ ] Hardware wallet integration
- [ ] Custom RPC endpoint support
- [ ] Cross-chain swap integration
- [ ] Advanced gas estimation
- [ ] Wallet activity history
- [ ] Token balance tracking
- [ ] DeFi integration

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review usage examples
3. Check component props
4. Review error messages

---

**Last Updated**: January 20, 2026  
**Status**: ✅ Production Ready  
**Supported Chains**: 18 (9 mainnet, 9 testnet)
