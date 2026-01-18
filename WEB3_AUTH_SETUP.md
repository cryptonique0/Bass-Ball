# Web3 Authentication Setup Guide

## Environment Variables

To use wallet authentication with wagmi + RainbowKit, add the following to your `.env.local`:

```env
# RainbowKit + WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wallet_connect_project_id_here
NEXT_PUBLIC_INFURA_KEY=your_infura_api_key_here

# Optional: Alchemy RPC (if using Alchemy instead of Infura)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key_here
```

## Getting API Keys

### 1. WalletConnect Project ID
- Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
- Sign up/login
- Create a new project
- Copy your Project ID
- Paste it in `.env.local`

### 2. Infura API Key
- Go to [Infura](https://www.infura.io/)
- Sign up/login
- Create a new project
- Select "Web3 API"
- Copy your API Key
- Paste it in `.env.local`

## Wallet Integrations

The system automatically supports:
- **MetaMask** - Browser extension
- **Coinbase Wallet** - Browser extension or mobile
- **WalletConnect** - Scan QR code to connect mobile wallets
- **Rainbow Wallet** - Desktop and mobile
- **Brave Wallet** - Built into Brave browser
- **Opera Wallet** - Built into Opera browser
- And many more through WalletConnect!

## Supported Networks

By default, the app supports:
- **Base Mainnet** (chainId: 8453)
- **Base Sepolia Testnet** (chainId: 84532)

Users can switch networks using the wallet connection interface.

## Usage

### 1. Wrap Your App with Web3Provider

In `app/layout.tsx`:
```tsx
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

### 2. Add Login Page

Import and use `WalletLogin`:
```tsx
import { WalletLogin } from '@/components/WalletLogin';

export default function LoginPage() {
  return (
    <WalletLogin
      onLoginSuccess={(address) => {
        console.log('Logged in:', address);
      }}
    />
  );
}
```

### 3. Use User Identity Hook

Access wallet info in components:
```tsx
import { useUserIdentity, useGameReady } from '@/hooks/useUserIdentity';

export default function MyComponent() {
  const {
    address,
    formattedAddress,
    isConnected,
    connector,
    chain,
    isOnBase,
    balance,
    switchToBase,
  } = useUserIdentity();

  const { isGameReady, readyChecks } = useGameReady(0.001); // Min 0.001 ETH

  return (
    <div>
      <p>Wallet: {formattedAddress}</p>
      <p>Balance: {balance} ETH</p>
      <p>Network: {chain}</p>
      {isGameReady ? (
        <p>Ready to play!</p>
      ) : (
        <>
          {!readyChecks.walletConnected && <p>Please connect wallet</p>}
          {!readyChecks.onCorrectChain && <button onClick={switchToBase}>Switch to Base</button>}
          {!readyChecks.sufficientBalance && <p>Insufficient balance</p>}
        </>
      )}
    </div>
  );
}
```

### 4. Add Wallet Connection Button

Use RainbowKit's built-in button:
```tsx
import { RainbowConnectButton } from '@/components/WalletConnector';

export default function Header() {
  return (
    <header>
      <h1>My App</h1>
      <RainbowConnectButton />
    </header>
  );
}
```

## Protected Pages

To create protected pages that require wallet connection:

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
    return <div>Loading...</div>;
  }

  return (
    <div>
      <p>This content is only visible to connected users</p>
    </div>
  );
}
```

## Custom RPC Configuration

To add custom RPC providers, modify `lib/wagmiConfig.ts`:

```typescript
const { chains, publicClient } = configureChains(
  [base, baseSepolia],
  [
    jsonRpcProvider({
      rpc: () => ({
        http: 'https://mainnet.base.org',
      }),
    }),
    infuraProvider({ apiKey: process.env.NEXT_PUBLIC_INFURA_KEY || '' }),
    publicProvider(),
  ]
);
```

## Testing with Testnet

To test with Base Sepolia instead of mainnet:

1. Add Base Sepolia to your wallet (MetaMask will prompt)
2. Get testnet ETH from [Base Sepolia Faucet](https://www.basefaucet.io/)
3. Users will be prompted to switch networks in the UI

## Troubleshooting

### "Window is not defined"
- Make sure you're using `'use client'` in components
- Use `useEffect` to set `mounted` state before rendering

### MetaMask not detected
- User needs to install MetaMask browser extension
- Other wallets will be available through WalletConnect

### Wrong network error
- App will prompt user to switch to Base network
- User's wallet handles the actual network switch

### Balance showing 0
- Make sure user has the RPC endpoint correctly configured
- Try refreshing the page
- Check that wallet has ETH on the correct network

## Security Notes

- 🔐 Private keys never leave the user's wallet
- 🔐 All transactions must be approved by user
- 🔐 Use wagmi hooks for all blockchain interactions
- 🔐 Never ask users for seed phrases or private keys
- 🔐 Validate contract addresses before calling

## Resources

- [wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://rainbowkit.com/)
- [Base Chain Docs](https://docs.base.org/)
- [Ethers.js Docs](https://docs.ethers.org/)
- [WalletConnect Docs](https://docs.walletconnect.com/)

---

**Bass Ball Web3 Authentication System** - Ready to use! 🏆
