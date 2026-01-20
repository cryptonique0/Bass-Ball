/**
 * All-EVM Wallet Configuration
 * Supports all Ethereum Virtual Machine (EVM) compatible blockchains
 * Includes mainnet and testnet chains
 */

import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { configureChains, createConfig } from 'wagmi';
import {
  mainnet,
  sepolia,
  polygon,
  polygonMumbai,
  arbitrum,
  arbitrumSepolia,
  optimism,
  optimismSepolia,
  base,
  baseSepolia,
  avalanche,
  avalancheFuji,
  gnosis,
  gnosisChiado,
  celo,
  celoAlfajores,
  zora,
  zoraSepolia,
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { infuraProvider } from 'wagmi/providers/infura';
import { alchemyProvider } from 'wagmi/providers/alchemy';

// ============================================================================
// EVM CHAIN CONFIGURATION
// ============================================================================

export const EVM_CHAINS = {
  // Mainnet chains
  MAINNET: {
    ethereum: mainnet,
    polygon: polygon,
    arbitrum: arbitrum,
    optimism: optimism,
    base: base,
    avalanche: avalanche,
    gnosis: gnosis,
    celo: celo,
    zora: zora,
  },

  // Testnet chains
  TESTNET: {
    sepolia: sepolia,
    mumbai: polygonMumbai,
    arbitrumSepolia: arbitrumSepolia,
    optimismSepolia: optimismSepolia,
    baseSepolia: baseSepolia,
    avalancheFuji: avalancheFuji,
    gnosisChiado: gnosisChiado,
    celoAlfajores: celoAlfajores,
    zoraSepolia: zoraSepolia,
  },
} as const;

// Chain categories for UI
export const CHAIN_CATEGORIES = {
  LAYER1: [mainnet, polygon, gnosis, avalanche],
  LAYER2: [arbitrum, optimism, base, zora],
  LAYER1_TESTNET: [sepolia, mumbai, gnosisChiado, avalancheFuji],
  LAYER2_TESTNET: [arbitrumSepolia, optimismSepolia, baseSepolia, zoraSepolia],
} as const;

// All mainnet chains
export const ALL_MAINNET_CHAINS = Object.values(EVM_CHAINS.MAINNET);

// All testnet chains
export const ALL_TESTNET_CHAINS = Object.values(EVM_CHAINS.TESTNET);

// Combined (production: mainnet only, development: both)
export const ALL_EVM_CHAINS_PRODUCTION = ALL_MAINNET_CHAINS;
export const ALL_EVM_CHAINS_DEVELOPMENT = [...ALL_MAINNET_CHAINS, ...ALL_TESTNET_CHAINS];

// ============================================================================
// WAGMI CONFIGURATION - PRODUCTION (Mainnet Only)
// ============================================================================

export function createWagmiConfigProduction() {
  const { chains, publicClient, webSocketPublicClient } = configureChains(
    ALL_MAINNET_CHAINS,
    [
      alchemyProvider({
        apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '',
      }),
      infuraProvider({
        apiKey: process.env.NEXT_PUBLIC_INFURA_KEY || '',
      }),
      publicProvider(),
    ]
  );

  const { connectors } = getDefaultWallets({
    appName: 'Bass Ball',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    chains,
  });

  const wagmiConfig = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
    webSocketPublicClient,
  });

  return { wagmiConfig, chains };
}

// ============================================================================
// WAGMI CONFIGURATION - DEVELOPMENT (Mainnet + Testnet)
// ============================================================================

export function createWagmiConfigDevelopment() {
  const { chains, publicClient, webSocketPublicClient } = configureChains(
    ALL_EVM_CHAINS_DEVELOPMENT,
    [
      alchemyProvider({
        apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '',
      }),
      infuraProvider({
        apiKey: process.env.NEXT_PUBLIC_INFURA_KEY || '',
      }),
      publicProvider(),
    ]
  );

  const { connectors } = getDefaultWallets({
    appName: 'Bass Ball',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    chains,
  });

  const wagmiConfig = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
    webSocketPublicClient,
  });

  return { wagmiConfig, chains };
}

// ============================================================================
// DEFAULT CONFIGURATION (Use based on environment)
// ============================================================================

const isProduction = process.env.NODE_ENV === 'production';
const useDevChains = process.env.NEXT_PUBLIC_USE_DEV_CHAINS === 'true';
const useBothChains = !isProduction || useDevChains;

export const { wagmiConfig, chains } = useBothChains
  ? createWagmiConfigDevelopment()
  : createWagmiConfigProduction();

// ============================================================================
// CHAIN METADATA & UTILITIES
// ============================================================================

export const CHAIN_METADATA = {
  [mainnet.id]: {
    name: 'Ethereum',
    category: 'L1',
    isMainnet: true,
    explorer: 'https://etherscan.io',
  },
  [sepolia.id]: {
    name: 'Ethereum Sepolia',
    category: 'L1 Testnet',
    isMainnet: false,
    explorer: 'https://sepolia.etherscan.io',
  },
  [polygon.id]: {
    name: 'Polygon',
    category: 'L1 Sidechain',
    isMainnet: true,
    explorer: 'https://polygonscan.com',
  },
  [polygonMumbai.id]: {
    name: 'Polygon Mumbai',
    category: 'L1 Testnet',
    isMainnet: false,
    explorer: 'https://mumbai.polygonscan.com',
  },
  [arbitrum.id]: {
    name: 'Arbitrum One',
    category: 'L2',
    isMainnet: true,
    explorer: 'https://arbiscan.io',
  },
  [arbitrumSepolia.id]: {
    name: 'Arbitrum Sepolia',
    category: 'L2 Testnet',
    isMainnet: false,
    explorer: 'https://sepolia.arbiscan.io',
  },
  [optimism.id]: {
    name: 'Optimism',
    category: 'L2',
    isMainnet: true,
    explorer: 'https://optimistic.etherscan.io',
  },
  [optimismSepolia.id]: {
    name: 'Optimism Sepolia',
    category: 'L2 Testnet',
    isMainnet: false,
    explorer: 'https://sepolia-optimism.etherscan.io',
  },
  [base.id]: {
    name: 'Base',
    category: 'L2',
    isMainnet: true,
    explorer: 'https://basescan.org',
  },
  [baseSepolia.id]: {
    name: 'Base Sepolia',
    category: 'L2 Testnet',
    isMainnet: false,
    explorer: 'https://sepolia.basescan.org',
  },
  [avalanche.id]: {
    name: 'Avalanche C-Chain',
    category: 'L1 Sidechain',
    isMainnet: true,
    explorer: 'https://snowtrace.io',
  },
  [avalancheFuji.id]: {
    name: 'Avalanche Fuji',
    category: 'L1 Testnet',
    isMainnet: false,
    explorer: 'https://testnet.snowtrace.io',
  },
  [gnosis.id]: {
    name: 'Gnosis Chain',
    category: 'L1 Sidechain',
    isMainnet: true,
    explorer: 'https://gnosisscan.io',
  },
  [gnosisChiado.id]: {
    name: 'Gnosis Chiado',
    category: 'L1 Testnet',
    isMainnet: false,
    explorer: 'https://chiado.blockscout.com',
  },
  [celo.id]: {
    name: 'Celo',
    category: 'L1 Sidechain',
    isMainnet: true,
    explorer: 'https://celoscan.io',
  },
  [celoAlfajores.id]: {
    name: 'Celo Alfajores',
    category: 'L1 Testnet',
    isMainnet: false,
    explorer: 'https://alfajores.celoscan.io',
  },
  [zora.id]: {
    name: 'Zora Network',
    category: 'L2',
    isMainnet: true,
    explorer: 'https://explorer.zora.energy',
  },
  [zoraSepolia.id]: {
    name: 'Zora Sepolia',
    category: 'L2 Testnet',
    isMainnet: false,
    explorer: 'https://sepolia.explorer.zora.energy',
  },
} as const;

/**
 * Get chain metadata
 */
export function getChainMetadata(chainId: number) {
  return CHAIN_METADATA[chainId as keyof typeof CHAIN_METADATA] || null;
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return chains.map(chain => chain.id);
}

/**
 * Check if chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return getSupportedChainIds().includes(chainId);
}

/**
 * Get available chains by category
 */
export function getChainsByCategory(category: 'L1' | 'L2' | 'L1 Sidechain' | 'L1 Testnet' | 'L2 Testnet') {
  return chains.filter(chain => {
    const metadata = getChainMetadata(chain.id);
    return metadata?.category === category;
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  wagmiConfig,
  chains,
  EVM_CHAINS,
  CHAIN_CATEGORIES,
  CHAIN_METADATA,
  ALL_MAINNET_CHAINS,
  ALL_TESTNET_CHAINS,
  getChainMetadata,
  getSupportedChainIds,
  isChainSupported,
  getChainsByCategory,
  createWagmiConfigProduction,
  createWagmiConfigDevelopment,
};
