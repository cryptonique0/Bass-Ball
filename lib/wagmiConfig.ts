import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { configureChains, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { infuraProvider } from 'wagmi/providers/infura';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { createStorage } from 'wagmi';
import { BASE_ENV, validateBaseEnv } from '../src/config/env';

/**
 * RainbowKit + Wagmi Configuration for Base Chain
 * Supports: MetaMask, Coinbase Wallet, WalletConnect, and more
 * With persistent wallet reconnection via localStorage
 */

validateBaseEnv();

const providers = [
  jsonRpcProvider({
    priority: 0,
    rpc: (chain) => {
      if (chain.id === base.id) {
        return { http: BASE_ENV.baseRpcUrl };
      }
      if (chain.id === baseSepolia.id) {
        return { http: BASE_ENV.baseSepoliaRpcUrl };
      }
      return null;
    },
  }),
];

if (BASE_ENV.infuraId) {
  providers.push(infuraProvider({ apiKey: BASE_ENV.infuraId, priority: 1 }));
}

providers.push(publicProvider({ priority: 2 }));

const { chains, publicClient } = configureChains([base, baseSepolia], providers);

const { connectors } = getDefaultWallets({
  appName: 'Bass Ball',
  projectId: BASE_ENV.walletConnectProjectId || 'demo-projectid-placeholder',
  chains,
});

// Create storage instance for persistent wallet data
const storage = typeof window !== 'undefined' 
  ? createStorage({ storage: window.localStorage, key: 'wagmi' })
  : undefined;

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  storage,
});

export { chains, RainbowKitProvider };
