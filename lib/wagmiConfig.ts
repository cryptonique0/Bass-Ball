import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { infuraProvider } from 'wagmi/providers/infura';

/**
 * RainbowKit + Wagmi Configuration for Base Chain
 * Supports: MetaMask, Coinbase Wallet, WalletConnect, and more
 */

// Validate required environment variable
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!walletConnectProjectId) {
  console.warn(
    '⚠️  Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID. ' +
    'Get a free project ID at https://cloud.walletconnect.com'
  );
}

const { chains, publicClient } = configureChains(
  [base, baseSepolia],
  [
    infuraProvider({ apiKey: process.env.NEXT_PUBLIC_INFURA_KEY || '' }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'Bass Ball',
  projectId: walletConnectProjectId || 'demo-projectid-placeholder',
  chains,
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export { chains, RainbowKitProvider };
