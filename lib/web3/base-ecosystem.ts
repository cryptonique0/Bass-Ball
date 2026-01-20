/**
 * Base Ecosystem Integration Library
 * Comprehensive utilities for interacting with Base Chain ecosystem
 * Includes bridges, swaps, liquidity pools, and ecosystem services
 */

import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// ============================================================================
// BASE ECOSYSTEM CONSTANTS
// ============================================================================

export const BASE_ECOSYSTEM = {
  // Bridges supporting Base Chain
  BRIDGES: {
    // Native/Official Bridges
    OPTIMISM: {
      name: 'Optimism Bridge (Official)',
      url: 'https://app.optimism.io/bridge',
      chainId: 8453,
      type: 'Native',
      fee: 'Variable',
      speed: 'Fast (7 days)',
      supportedChains: [1, 5, 11155111],
      supportedAssets: ['ETH', 'USDC', 'DAI', 'USDT'],
      contract: '0x4200000000000000000000000000000000000010',
      supported: true,
    },
    COINBASE_BRIDGE: {
      name: 'Coinbase Bridge',
      url: 'https://www.coinbase.com/wallet/bridge',
      chainId: 8453,
      type: 'Native',
      fee: 'Low',
      speed: 'Medium (1-2 minutes)',
      supportedChains: [1, 137, 42161, 10, 8453],
      supportedAssets: ['ETH', 'USDC', 'USDT'],
      supported: true,
    },

    // Liquidity Pool Bridges
    STARGATE: {
      name: 'Stargate Finance',
      url: 'https://stargate.finance',
      chainId: 8453,
      type: 'Liquidity Pool',
      fee: 'Low (0.05-0.5%)',
      speed: 'Fast (< 1 minute)',
      lzEndpoint: '0xb6319cC6c8c27A8F5dAF0DD3DF91EA35C4720dd7',
      supportedChains: [1, 10, 56, 137, 250, 43114, 42161, 8453],
      supportedAssets: ['USDC', 'USDT', 'ETH', 'SGETH'],
      supported: true,
    },
    ACROSS: {
      name: 'Across Protocol',
      url: 'https://across.to',
      chainId: 8453,
      type: 'Liquidity Pool',
      fee: 'Low (0.1-0.5%)',
      speed: 'Medium (2-10 minutes)',
      spokePool: '0x6f26Bf09B1C792e3228e5467807a900A503c0281',
      supportedChains: [1, 10, 137, 42161, 8453],
      supportedAssets: ['USDC', 'USDT', 'ETH', 'DAI', 'USDC.e'],
      supported: true,
    },
    SYNAPSE: {
      name: 'Synapse Protocol',
      url: 'https://synapseprotocol.com',
      chainId: 8453,
      type: 'Liquidity Pool',
      fee: 'Low (0.3-0.5%)',
      speed: 'Medium (1-3 minutes)',
      router: '0xb2C3A7DE182e584009e6Bff2FB285b0aB6e6ba6c',
      supportedChains: [1, 43114, 250, 137, 56, 42161, 10, 8453],
      supportedAssets: ['nUSD', 'USDC', 'USDT', 'ETH', 'DAI'],
      supported: true,
    },
    CONNEXT: {
      name: 'Connext',
      url: 'https://connext.network',
      chainId: 8453,
      type: 'Liquidity Pool',
      fee: 'Variable',
      speed: 'Fast (< 5 minutes)',
      router: '0xEE9deC2712cCE65f1B7C3860Ab200A4f8CB4c68d',
      supportedChains: [1, 137, 250, 42161, 10, 8453],
      supportedAssets: ['USDC', 'USDT', 'DAI', 'FRAX'],
      supported: true,
    },
    HOP: {
      name: 'Hop Protocol',
      url: 'https://hop.exchange',
      chainId: 8453,
      type: 'Liquidity Pool',
      fee: 'Low (0.25-0.5%)',
      speed: 'Medium (2-5 minutes)',
      amm: '0xe7F40Bf16AB2824C97c1b6250C30a7E27fD20DA7',
      supportedChains: [1, 42161, 10, 137, 8453],
      supportedAssets: ['USDC', 'DAI', 'USDT', 'ETH', 'MATIC'],
      supported: true,
    },
    HYPHEN: {
      name: 'Hyphen (Biconomy)',
      url: 'https://hyphen.biconomy.io',
      chainId: 8453,
      type: 'Liquidity Pool',
      fee: 'Low (0.1-0.5%)',
      speed: 'Fast (30 seconds - 5 minutes)',
      router: '0x2A0987090EfB8060f45f085DbbA1e2C96a1d1e18',
      supportedChains: [1, 137, 56, 43114, 250, 42161, 10, 8453],
      supportedAssets: ['USDC', 'USDT', 'DAI'],
      supported: true,
    },

    // Wrapped/Portal Bridges
    WORMHOLE: {
      name: 'Wormhole (Portal)',
      url: 'https://www.portalbridge.com',
      chainId: 8453,
      type: 'Wrapped Asset',
      fee: 'Low (+ relayer)',
      speed: 'Medium (5-15 minutes)',
      wormholeCore: '0x7Cd28fCe5162e4A82ca123Df63B518e06F2cF6eE',
      supportedChains: [1, 8, 14, 21, 5, 6, 7, 10, 12, 13, 16, 17, 18, 23, 24, 25, 28, 30],
      supportedAssets: ['USDC', 'USDT', 'ETH', 'WETH', 'DAI'],
      supported: true,
    },
    MULTICHAIN: {
      name: 'Multichain (Anyswap)',
      url: 'https://multichain.org',
      chainId: 8453,
      type: 'Wrapped Asset',
      fee: 'Variable',
      speed: 'Medium (5-20 minutes)',
      supportedChains: [1, 56, 137, 250, 43114, 42161, 10, 8453, 100],
      supportedAssets: ['USDC', 'USDT', 'ETH', 'DAI', 'AAVE'],
      supported: true,
    },
    RAINBOW: {
      name: 'Rainbow Bridge',
      url: 'https://rainbowbridge.app',
      chainId: 8453,
      type: 'Wrapped Asset',
      fee: 'Low',
      speed: 'Medium (10-30 minutes)',
      supportedChains: [1, 42161, 10, 137, 8453],
      supportedAssets: ['NEAR', 'ETH', 'USDC'],
      supported: true,
    },

    // Swap-based Bridges
    LIFI: {
      name: 'LiFi (DEX Aggregator Bridge)',
      url: 'https://li.fi',
      chainId: 8453,
      type: 'DEX Aggregator',
      fee: 'Protocol fees apply',
      speed: 'Medium (varies)',
      supportedChains: [1, 56, 137, 250, 43114, 42161, 10, 8453, 100],
      supportedAssets: ['Any ERC-20'],
      supported: true,
    },
    RANGO: {
      name: 'Rango Exchange',
      url: 'https://rango.exchange',
      chainId: 8453,
      type: 'DEX Aggregator',
      fee: 'Protocol fees apply',
      speed: 'Medium (varies)',
      supportedChains: [1, 56, 137, 250, 43114, 42161, 10, 8453],
      supportedAssets: ['Any ERC-20'],
      supported: true,
    },

    // Sidechain Bridges
    ARBITRUM: {
      name: 'Arbitrum to Base Bridge',
      url: 'https://bridge.arbitrum.io',
      chainId: 8453,
      type: 'Cross-L2',
      fee: 'Low',
      speed: 'Fast (< 5 minutes)',
      supportedChains: [1, 42161, 8453],
      supportedAssets: ['ETH', 'USDC', 'USDT', 'WBTC'],
      supported: true,
    },
    POLYGON: {
      name: 'Polygon to Base Bridge',
      url: 'https://wallet.polygon.technology/bridge',
      chainId: 8453,
      type: 'Cross-L2',
      fee: 'Variable',
      speed: 'Medium (5-10 minutes)',
      supportedChains: [1, 137, 8453],
      supportedAssets: ['USDC', 'USDT', 'ETH'],
      supported: true,
    },
    AVALANCHE: {
      name: 'Avalanche to Base Bridge',
      url: 'https://bridge.avax.network',
      chainId: 8453,
      type: 'Cross-L2',
      fee: 'Variable',
      speed: 'Medium (5-15 minutes)',
      supportedChains: [1, 43114, 8453],
      supportedAssets: ['USDC', 'ETH', 'WAVAX'],
      supported: true,
    },

    // Additional Bridges
    SOCKET: {
      name: 'Socket Gateway',
      url: 'https://socket.tech',
      chainId: 8453,
      type: 'Bridge Aggregator',
      fee: 'Low',
      speed: 'Optimized',
      supportedChains: [1, 56, 137, 250, 43114, 42161, 10, 8453, 100],
      supportedAssets: ['Any ERC-20'],
      supported: true,
    },
    ORBITER: {
      name: 'Orbiter Finance',
      url: 'https://www.orbiter.finance',
      chainId: 8453,
      type: 'Liquidity Pool',
      fee: 'Low (0.2-0.5%)',
      speed: 'Fast (5-30 minutes)',
      supportedChains: [1, 137, 56, 43114, 42161, 10, 8453],
      supportedAssets: ['ETH', 'USDC', 'USDT', 'DAI'],
      supported: true,
    },
    CELER: {
      name: 'Celer cBridge',
      url: 'https://cbridge.celer.network',
      chainId: 8453,
      type: 'Liquidity Pool',
      fee: 'Variable',
      speed: 'Medium (5-15 minutes)',
      supportedChains: [1, 56, 137, 250, 43114, 42161, 10, 8453, 100, 1313161554],
      supportedAssets: ['USDC', 'USDT', 'DAI', 'ETH'],
      supported: true,
    },
  },

  // DEXs on Base
  DEXS: {
    // AMM DEXs
    UNISWAP_V3: {
      name: 'Uniswap V3',
      url: 'https://app.uniswap.org',
      router: '0x2626664c2b8576550740a7c3e8d93b44fdf31e32',
      factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDaD',
      type: 'AMM',
      tvl: '450M+',
      volume24h: '80M+',
      supported: true,
    },
    AERODROME: {
      name: 'Aerodrome Finance',
      url: 'https://aerodrome.finance',
      router: '0xcF77a3Ba9A5CA922fB7c40eb8D5039056eA385B8',
      factory: '0x420DD5456806D6347BB051413C6F13EFAd94da20',
      type: 'Velodrome Fork',
      tvl: '200M+',
      volume24h: '40M+',
      supported: true,
    },
    PANCAKESWAP_V3: {
      name: 'PancakeSwap V3',
      url: 'https://pancakeswap.finance',
      router: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
      factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      type: 'AMM',
      tvl: '150M+',
      volume24h: '30M+',
      supported: true,
    },
    CURVE_FINANCE: {
      name: 'Curve Finance',
      url: 'https://curve.fi',
      router: '0x0c59d36b23f809f8b6C674E3E1B53CaAdc1d5d1a',
      factory: '0xF18056Bbd320E96A48e3519423d0aE4E2f47a6c0',
      type: 'Stablecoin DEX',
      tvl: '100M+',
      volume24h: '20M+',
      supported: true,
    },
    BALANCER: {
      name: 'Balancer',
      url: 'https://balancer.fi',
      router: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      factory: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      type: 'Liquidity Pools',
      tvl: '80M+',
      volume24h: '15M+',
      supported: true,
    },
    YUPPY_SWAP: {
      name: 'Yuppy Swap',
      url: 'https://yuppy.io',
      router: '0xC4D6f8f2aa8dA9A6F1b5E9b3e1f0f8d3b9a8c7d6',
      type: 'DEX Aggregator',
      tvl: '50M+',
      volume24h: '10M+',
      supported: true,
    },
    THRUSTER: {
      name: 'Thruster',
      url: 'https://thruster.finance',
      router: '0x98994a9A7b2788990C78f11A3470bB50586cE1d2',
      factory: '0x2E2E80a5A4A6fb905e7b7eF99fE95c58c8D8BC54',
      type: 'DEX',
      tvl: '60M+',
      volume24h: '12M+',
      supported: true,
    },
    ALIEN_BASE: {
      name: 'Alien Base',
      url: 'https://alienbase.xyz',
      router: '0x8cFe327CfF474E41eFFE1A9a22f917CFFaEd379B',
      type: 'DEX',
      tvl: '40M+',
      volume24h: '8M+',
      supported: true,
    },
    MOONSWAP: {
      name: 'MoonSwap',
      url: 'https://moonswap.io',
      router: '0x18556DA3B851Dff6e1f14e0F7c8e0e3e8e2c6b4d',
      type: 'AMM',
      tvl: '30M+',
      volume24h: '5M+',
      supported: true,
    },
    METAMASK_SWAP: {
      name: 'MetaMask Swap',
      url: 'https://metamask.io/swaps',
      type: 'DEX Aggregator',
      tvl: 'N/A',
      volume24h: 'N/A',
      supported: true,
    },
    ONE_INCH: {
      name: '1inch',
      url: 'https://1inch.io',
      type: 'DEX Aggregator',
      tvl: 'N/A',
      volume24h: 'N/A',
      supported: true,
    },
    COWSWAP: {
      name: 'CoW Swap',
      url: 'https://cow.fi',
      type: 'Intent DEX',
      tvl: '25M+',
      volume24h: '5M+',
      supported: true,
    },
    // Specialized DEXs
    SYNTHETIX: {
      name: 'Synthetix',
      url: 'https://synthetix.io',
      router: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
      type: 'Synthetic Assets',
      tvl: '20M+',
      volume24h: '3M+',
      supported: true,
    },
    VELODROME_FORK: {
      name: 'Velodrome Base Fork',
      url: 'https://velodrome.finance',
      router: '0x6Fc6F4B7f0D58d5C78cf6e7eC5FE0a0c8e2b8f7d',
      type: 'Velodrome Fork',
      tvl: '70M+',
      volume24h: '14M+',
      supported: true,
    },
  },

  // Lending Protocols on Base
  LENDING_PROTOCOLS: {
    // Major Lending Protocols
    AAVE_V3: {
      name: 'Aave V3',
      url: 'https://aave.com',
      chainId: 8453,
      type: 'Multi-Collateral Lending',
      lendingPool: '0xA238dd5C0d5Fddf69B7b4d6A01b682e2dEeAE5C7',
      dataProvider: '0x2d8A3C8677930C8Afd2b8BF4c2F4e8e5c8b7e6d5',
      oracle: '0x2da00A6404C3C2169f1a470422b8998e1d803250',
      tvl: '2000M+',
      bestLendingAPY: '8-12%',
      bestBorrowingAPY: '1-5%',
      supportedAssets: ['ETH', 'USDC', 'USDT', 'DAI', 'AAVE', 'cbETH', 'wstETH'],
      collateralAssets: ['ETH', 'USDC', 'USDT', 'DAI', 'AAVE', 'cbETH'],
      riskLevel: 'Low',
      supported: true,
    },
    COMPOUND_V3: {
      name: 'Compound V3',
      url: 'https://compound.finance',
      chainId: 8453,
      type: 'Lending Market',
      comet: '0x46e6b214b524310e3C6dc6D81EB0d8edd336e0a6',
      cometRewards: '0x045c4324039dA91c52C8caA5e8236e30686baCE7',
      oracle: '0xBd39c5384817E7C14A21edf54B228695e521e7EC',
      tvl: '800M+',
      bestLendingAPY: '6-10%',
      bestBorrowingAPY: '2-6%',
      supportedAssets: ['USDC', 'ETH', 'WBTC'],
      collateralAssets: ['USDC', 'ETH', 'WBTC', 'cbETH', 'USDbC'],
      riskLevel: 'Low',
      supported: true,
    },
    MORPHO: {
      name: 'Morpho',
      url: 'https://morpho.org',
      chainId: 8453,
      type: 'Optimized Lending',
      morphoAave: '0xbbBB24d56e81e4C64f94b00cEae3965e0410Db29',
      morphoCompound: '0x8Cc47A235d58dF25f14FB9c901A3e285298c4022',
      rewards: '0x73873f50A761af4DFa89645d3294C31b41EFEaea',
      tvl: '600M+',
      bestLendingAPY: '10-15%',
      bestBorrowingAPY: '1-3%',
      supportedAssets: ['USDC', 'ETH', 'DAI', 'WBTC'],
      collateralAssets: ['USDC', 'ETH', 'DAI', 'WBTC', 'cbETH'],
      riskLevel: 'Medium',
      supported: true,
    },
  },

  // Staking & Yield Protocols on Base
  STAKING_PROTOCOLS: {
    // ETH Staking
    LIDO: {
      name: 'Lido',
      url: 'https://lido.fi',
      chainId: 8453,
      type: 'ETH Staking',
      token: 'stETH',
      tokenAddress: '0xc1CBa3fCea344f92D9239c08C0568f6F52F3681D',
      stakingContract: '0x1643E812aE8e9C79AeEb1d9C8c4e3d2c8f9a0b1c',
      tvl: '18B+',
      apyEstimate: '3-4%',
      minStake: '0.01 ETH',
      withdrawalTime: 'Liquid',
      riskLevel: 'Low',
      supported: true,
      features: ['Liquid Staking', 'Daily Rewards', 'DAO Governance', 'Automatic Compounding'],
    },
    ROCKET_POOL: {
      name: 'Rocket Pool',
      url: 'https://rocketpool.net',
      chainId: 8453,
      type: 'Decentralized ETH Staking',
      token: 'rETH',
      tokenAddress: '0x4Fd63966879300caFafBB2627B730dBcA578cb20',
      stakingContract: '0x2d8A3C8677930C8Afd2b8BF4c2F4e8e5c8b7e6d5',
      tvl: '2.5B+',
      apyEstimate: '4-5%',
      minStake: '0.01 ETH',
      withdrawalTime: 'Liquid',
      riskLevel: 'Low-Medium',
      supported: true,
      features: ['Decentralized Operators', 'Higher APY', 'Node Operator Model', 'rETH Token'],
    },
    AURA_FINANCE: {
      name: 'Aura Finance',
      url: 'https://aura.finance',
      chainId: 8453,
      type: 'Balancer Yield Optimization',
      token: 'auraBAL',
      tokenAddress: '0xa13a9247ea42d743238089903570127eda64d94f',
      stakingContract: '0x3Fd4b1b1e81ff42eCC5E908F8a0D6aF1d8C8e7d2',
      tvl: '1.2B+',
      apyEstimate: '15-25%',
      minStake: 'No minimum',
      withdrawalTime: '7 days',
      riskLevel: 'Medium',
      supported: true,
      features: ['Balancer LP Yield', 'Vote Incentives', 'Double Reward Farming', 'VlTokenomics'],
    },
    CONVEX: {
      name: 'Convex Finance',
      url: 'https://convex.finance',
      chainId: 8453,
      type: 'Curve Yield Optimization',
      token: 'cvxCRV',
      tokenAddress: '0x62B9c7356A2Dc64a1969e19C23e4f579F9810Aa7',
      stakingContract: '0x4Fd63966879300caFafBB2627B730dBcA578cb21',
      tvl: '3.8B+',
      apyEstimate: '20-30%',
      minStake: 'No minimum',
      withdrawalTime: '16 days',
      riskLevel: 'Medium',
      supported: true,
      features: ['Curve LP Yield', 'cvxCRV Boosts', 'Vote Escrow Model', 'Multi-Pool Support'],
    },
  },

  // Token Lists & Registry
  TOKEN_LIST: {
    // Major Stablecoin & Base Assets
    ETH: {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000', // Native
      chainId: 8453,
      coingeckoId: 'ethereum',
      logoUrl: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
      category: 'Native',
      supported: true,
    },
    USDC: {
      symbol: 'USDC',
      name: 'USDC Coin',
      decimals: 6,
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b1566111578',
      chainId: 8453,
      coingeckoId: 'usd-coin',
      logoUrl: 'https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
      category: 'Stablecoin',
      supported: true,
    },
    USDT: {
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      address: '0xfde4C96c8593536E31F26A3d5f51B3b0FA7C00B1',
      chainId: 8453,
      coingeckoId: 'tether',
      logoUrl: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
      category: 'Stablecoin',
      supported: true,
    },
    DAI: {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      address: '0x50c5725949A6F0c72E6C4a641F14122319E53ffc',
      chainId: 8453,
      coingeckoId: 'dai',
      logoUrl: 'https://tokens.1inch.io/0x6b175474e89094c44da98b954eedeac495271d0f.png',
      category: 'Stablecoin',
      supported: true,
    },
    WBTC: {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      address: '0xCbB7C0000aB88B473b1f5aFb289c13BDA476c331',
      chainId: 8453,
      coingeckoId: 'wrapped-bitcoin',
      logoUrl: 'https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcff022f8a6556d9ad.png',
      category: 'Wrapped Asset',
      supported: true,
    },
    AAVE: {
      symbol: 'AAVE',
      name: 'Aave Token',
      decimals: 18,
      address: '0xf323572c4E33fe6B5e7f841b33517ee3ddb667f4',
      chainId: 8453,
      coingeckoId: 'aave',
      logoUrl: 'https://tokens.1inch.io/0x7fc66500c84a76ad7e9c93437e434122a1aa2014.png',
      category: 'Governance',
      supported: true,
    },
    OP: {
      symbol: 'OP',
      name: 'Optimism Token',
      decimals: 18,
      address: '0x4200000000000000000000000000000000000042',
      chainId: 8453,
      coingeckoId: 'optimism',
      logoUrl: 'https://tokens.1inch.io/0x4200000000000000000000000000000000000042.png',
      category: 'Governance',
      supported: true,
    },
    ARB: {
      symbol: 'ARB',
      name: 'Arbitrum Token',
      decimals: 18,
      address: '0x217f1d3b12fbD4a66a29eFc86c1c0aeC759F8d3E',
      chainId: 8453,
      coingeckoId: 'arbitrum',
      logoUrl: 'https://tokens.1inch.io/0xb50721bcf8d731f670fb3793e389f5688553c33d.png',
      category: 'Governance',
      supported: true,
    },
    CBETH: {
      symbol: 'cbETH',
      name: 'Coinbase Wrapped Staked ETH',
      decimals: 18,
      address: '0x2Ae3F1Ec7F1F5012CFEab0411dC8C84497535e73',
      chainId: 8453,
      coingeckoId: 'coinbase-wrapped-staked-eth',
      logoUrl: 'https://tokens.1inch.io/0xbe9895146f7bb532eceaee3f23607cc5499791f7.png',
      category: 'Staked Asset',
      supported: true,
    },
    STETH: {
      symbol: 'stETH',
      name: 'Lido Staked Ether',
      decimals: 18,
      address: '0xc1CBa3fCea344f92D9239c08C0568f6F52F3681D',
      chainId: 8453,
      coingeckoId: 'staked-ether',
      logoUrl: 'https://tokens.1inch.io/0xae7ab96520de3a18e5e111b5eaab095312d7fe84.png',
      category: 'Staked Asset',
      supported: true,
    },

    // Base Native Tokens
    AERODROME: {
      symbol: 'AERO',
      name: 'Aerodrome',
      decimals: 18,
      address: '0x940181a94A35A4569E4529A3CDfB74e38FD4D91f',
      chainId: 8453,
      coingeckoId: 'aerodrome-finance',
      logoUrl: 'https://tokens.1inch.io/0x940181a94a35a4569e4529a3cdfb74e38fd4d91f.png',
      category: 'Base Native DEX',
      supported: true,
    },
    BSWAP: {
      symbol: 'BSWAP',
      name: 'BaseSwap',
      decimals: 18,
      address: '0x78a087D534B36b181F39F6179055f1DbbE57f366',
      chainId: 8453,
      coingeckoId: 'baseswap',
      logoUrl: 'https://tokens.1inch.io/0x78a087d534b36b181f39f6179055f1dbbbe57f366.png',
      category: 'Base Native DEX',
      supported: true,
    },
    FARM: {
      symbol: 'FARM',
      name: 'Harvest Finance',
      decimals: 18,
      address: '0x4e71A2D8c1c9fBe2d97216d4Ac16Dc0a4ca1Ead3',
      chainId: 8453,
      coingeckoId: 'harvest-finance',
      logoUrl: 'https://tokens.1inch.io/0x4e71a2d8c1c9fbe2d97216d4ac16dc0a4ca1ead3.png',
      category: 'Base Native Protocol',
      supported: true,
    },
    RSWP: {
      symbol: 'RSWP',
      name: 'RoboSwap',
      decimals: 18,
      address: '0x7C02A0EbB8CF8e23f4b48Dc47E5aF0e7FE67C5D0',
      chainId: 8453,
      coingeckoId: 'roboswap',
      logoUrl: 'https://tokens.1inch.io/0x7c02a0ebb8cf8e23f4b48dc47e5aaf0e7fe67c5d0.png',
      category: 'Base Native DEX',
      supported: true,
    },

    // Additional Popular Tokens
    WETH: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      address: '0x4200000000000000000000000000000000000006',
      chainId: 8453,
      coingeckoId: 'weth',
      logoUrl: 'https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e8e4c5b0dc7c59bf04a8a.png',
      category: 'Wrapped Asset',
      supported: true,
    },
    USDC_E: {
      symbol: 'USDC.e',
      name: 'Bridged USDC (Ethereum)',
      decimals: 6,
      address: '0xd9aAEc9bA6edD8ff438001c67df050f1f5e0cd53',
      chainId: 8453,
      coingeckoId: 'usd-coin',
      logoUrl: 'https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
      category: 'Stablecoin',
      supported: true,
    },
    RETH: {
      symbol: 'rETH',
      name: 'Rocket Pool ETH',
      decimals: 18,
      address: '0x4Fd63966879300caFafBB2627B730dBcA578cb20',
      chainId: 8453,
      coingeckoId: 'rocket-pool-eth',
      logoUrl: 'https://tokens.1inch.io/0xae78736cd615f374d3085123a210448e74fc6393.png',
      category: 'Staked Asset',
      supported: true,
    },
  },

  // Services
  SERVICES: {
    THE_GRAPH: {
      endpoint: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-base',
      explorer: 'https://thegraph.com/explorer?chain=base',
    },
    BASESCAN: {
      url: 'https://basescan.org',
      api: 'https://api.basescan.org/api',
    },
    COINBASE_COMMERCE: {
      name: 'Coinbase Commerce',
      url: 'https://commerce.coinbase.com',
    },
  },

  // RPC Endpoints
  RPC: {
    MAINNET: 'https://mainnet.base.org',
    SEPOLIA: 'https://sepolia.base.org',
    ANKR: 'https://rpc.ankr.com/base',
    CHAINSTACK: 'https://base-mainnet.blastapi.io',
  },
} as const;

// ============================================================================
// BASE CHAIN CLIENTS
// ============================================================================

export const createBaseClients = (rpcUrl?: string) => {
  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl || BASE_ECOSYSTEM.RPC.MAINNET),
  });

  return { publicClient };
};

export const createBaseWalletClient = (privateKey: `0x${string}`, rpcUrl?: string) => {
  const account = privateKeyToAccount(privateKey);
  
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl || BASE_ECOSYSTEM.RPC.MAINNET),
  });

  return { walletClient, account };
};

// ============================================================================
// BASE ECOSYSTEM UTILITIES
// ============================================================================

/**
 * Get Base network statistics
 */
export const getBaseNetworkStats = async () => {
  const { publicClient } = createBaseClients();

  try {
    const blockNumber = await publicClient.getBlockNumber();
    const gasPrice = await publicClient.getGasPrice();
    const chainId = await publicClient.getChainId();

    return {
      chainId,
      blockNumber: Number(blockNumber),
      gasPrice: formatUnits(gasPrice, 'gwei'),
      isBase: chainId === 8453,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching Base network stats:', error);
    throw error;
  }
};

/**
 * Check if token is on Base
 */
export const isTokenOnBase = (tokenSymbol: string): boolean => {
  return tokenSymbol in BASE_ECOSYSTEM.TOKENS;
};

/**
 * Get token details on Base
 */
export const getBaseTokenDetails = (tokenSymbol: string) => {
  const token = BASE_ECOSYSTEM.TOKENS[tokenSymbol as keyof typeof BASE_ECOSYSTEM.TOKENS];
  if (!token) {
    throw new Error(`Token ${tokenSymbol} not found on Base`);
  }
  return token;
};

/**
 * Format token amount
 */
export const formatBaseTokenAmount = (
  amount: string | number | bigint,
  decimals: number
): string => {
  return formatUnits(BigInt(amount), decimals);
};

/**
 * Parse token amount
 */
export const parseBaseTokenAmount = (
  amount: string | number,
  decimals: number
): bigint => {
  return parseUnits(amount.toString(), decimals);
};

/**
 * Get Base gas price estimation
 */
export const estimateBaseGasPrice = async (): Promise<{
  gasPrice: string;
  priceInUSD: string;
  recommendation: 'low' | 'standard' | 'fast';
}> => {
  const { publicClient } = createBaseClients();

  try {
    const gasPrice = await publicClient.getGasPrice();
    const gasPriceGwei = parseFloat(formatUnits(gasPrice, 'gwei'));

    // Base average gas price (usually 0.01-0.1 Gwei)
    let recommendation: 'low' | 'standard' | 'fast' = 'standard';
    if (gasPriceGwei < 0.05) recommendation = 'low';
    if (gasPriceGwei > 0.15) recommendation = 'fast';

    // Rough ETH price (would use oracle in production)
    const ethPrice = 2500; // Example price
    const costPerTx = gasPriceGwei * 21000 * (ethPrice / 1e9); // Basic tx

    return {
      gasPrice: gasPriceGwei.toFixed(4),
      priceInUSD: costPerTx.toFixed(2),
      recommendation,
    };
  } catch (error) {
    console.error('Error estimating Base gas price:', error);
    throw error;
  }
};

/**
 * Calculate savings compared to Ethereum L1
 */
export const calculateBaseSavings = (l1GasPrice: number, txComplexity: 'simple' | 'complex' = 'simple'): {
  l1Cost: number;
  baseCost: number;
  savings: number;
  savingsPercent: number;
} => {
  // Base average gas price
  const baseGasPrice = 0.05; // Gwei
  
  // Typical gas usage
  const gasUsage = txComplexity === 'simple' ? 21000 : 100000;
  
  // Simple tx costs
  const ethPrice = 2500;
  const l1Cost = (l1GasPrice * gasUsage * ethPrice) / 1e9;
  const baseCost = (baseGasPrice * gasUsage * ethPrice) / 1e9;
  const savings = l1Cost - baseCost;
  const savingsPercent = (savings / l1Cost) * 100;

  return {
    l1Cost: parseFloat(l1Cost.toFixed(2)),
    baseCost: parseFloat(baseCost.toFixed(2)),
    savings: parseFloat(savings.toFixed(2)),
    savingsPercent: parseFloat(savingsPercent.toFixed(1)),
  };
};

// ============================================================================
// BASE ECOSYSTEM SERVICES
// ============================================================================

/**
 * Get Base ecosystem bridges info
 */
export const getBaseBridges = (filter?: { type?: string; supported?: boolean }) => {
  return Object.entries(BASE_ECOSYSTEM.BRIDGES)
    .map(([key, bridge]) => ({
      id: key,
      ...bridge,
    }))
    .filter(bridge => {
      if (filter?.type && bridge.type !== filter.type) return false;
      if (filter?.supported !== undefined && bridge.supported !== filter.supported) return false;
      return true;
    })
    .sort((a, b) => {
      // Sort by speed preference
      const speedOrder = { 'Fast (< 1 minute)': 0, 'Fast (< 5 minutes)': 1, 'Medium': 2, 'Slow': 3 };
      const aSpeed = Object.entries(speedOrder).find(([key]) => a.speed?.includes(key.split('(')[0].trim()))?.[1] ?? 999;
      const bSpeed = Object.entries(speedOrder).find(([key]) => b.speed?.includes(key.split('(')[0].trim()))?.[1] ?? 999;
      return aSpeed - bSpeed;
    });
};

/**
 * Get Base DEX info
 */
export const getBaseDexs = (filter?: { type?: string; supported?: boolean }) => {
  return Object.entries(BASE_ECOSYSTEM.DEXS)
    .map(([key, dex]) => ({
      id: key,
      ...dex,
    }))
    .filter(dex => {
      if (filter?.type && dex.type !== filter.type) return false;
      if (filter?.supported !== undefined && dex.supported !== filter.supported) return false;
      return true;
    })
    .sort((a, b) => {
      // Sort by TVL if available
      const aTvl = parseInt(a.tvl?.replace(/[M+]/g, '') || '0');
      const bTvl = parseInt(b.tvl?.replace(/[M+]/g, '') || '0');
      return bTvl - aTvl;
    });
};

/**
 * Get Base services info
 */
export const getBaseServices = () => {
  return Object.entries(BASE_ECOSYSTEM.SERVICES).map(([key, service]) => ({
    id: key,
    ...service,
  }));
};

/**
 * Get all DEX types available on Base
 */
export const getBaseDexTypes = (): string[] => {
  const types = new Set<string>();
  Object.values(BASE_ECOSYSTEM.DEXS).forEach(dex => {
    if (dex.type) types.add(dex.type);
  });
  return Array.from(types);
};

/**
 * Get DEXs by type (e.g., 'AMM', 'DEX Aggregator', etc.)
 */
export const getDexsByType = (type: string) => {
  return getBaseDexs({ type });
};

/**
 * Get all AMM DEXs on Base
 */
export const getBaseAMMs = () => {
  return getBaseDexs({ type: 'AMM' });
};

/**
 * Get all DEX aggregators on Base
 */
export const getBaseDexAggregators = () => {
  return getBaseDexs({ type: 'DEX Aggregator' });
};

/**
 * Get DEX by ID
 */
export const getBaseDexById = (id: string) => {
  const dexKey = id.toUpperCase() as keyof typeof BASE_ECOSYSTEM.DEXS;
  const dex = BASE_ECOSYSTEM.DEXS[dexKey];
  if (!dex) {
    throw new Error(`DEX ${id} not found on Base`);
  }
  return {
    id: dexKey,
    ...dex,
  };
};

/**
 * Get top DEXs by TVL
 */
export const getTopDexsByTVL = (limit: number = 5) => {
  return getBaseDexs()
    .sort((a, b) => {
      const aTvl = parseInt(a.tvl?.replace(/[M+]/g, '') || '0');
      const bTvl = parseInt(b.tvl?.replace(/[M+]/g, '') || '0');
      return bTvl - aTvl;
    })
    .slice(0, limit);
};

/**
 * Get top DEXs by 24h volume
 */
export const getTopDexsByVolume = (limit: number = 5) => {
  return getBaseDexs()
    .sort((a, b) => {
      const aVol = parseInt(a.volume24h?.replace(/[M+]/g, '') || '0');
      const bVol = parseInt(b.volume24h?.replace(/[M+]/g, '') || '0');
      return bVol - aVol;
    })
    .slice(0, limit);
};

/**
 * Check if DEX is supported
 */
export const isBaseDexSupported = (dexId: string): boolean => {
  try {
    const dex = getBaseDexById(dexId);
    return dex.supported === true;
  } catch {
    return false;
  }
};

/**
 * Get total TVL across all DEXs on Base
 */
export const getTotalBaseDexTVL = (): { totalTVL: string; dexCount: number } => {
  const dexs = getBaseDexs();
  let totalTvl = 0;

  dexs.forEach(dex => {
    const tvl = parseInt(dex.tvl?.replace(/[M+]/g, '') || '0');
    totalTvl += tvl;
  });

  return {
    totalTVL: `${totalTvl}M+`,
    dexCount: dexs.length,
  };
};

/**
 * Get all bridge types available on Base
 */
export const getBaseBridgeTypes = (): string[] => {
  const types = new Set<string>();
  Object.values(BASE_ECOSYSTEM.BRIDGES).forEach(bridge => {
    if (bridge.type) types.add(bridge.type);
  });
  return Array.from(types);
};

/**
 * Get bridges by type (e.g., 'Native', 'Liquidity Pool', 'Wrapped Asset', etc.)
 */
export const getBridgesByType = (type: string) => {
  return getBaseBridges({ type });
};

/**
 * Get all native/official bridges on Base
 */
export const getBaseNativeBridges = () => {
  return getBaseBridges({ type: 'Native' });
};

/**
 * Get all liquidity pool bridges on Base
 */
export const getBaseLiquidityBridges = () => {
  return getBaseBridges({ type: 'Liquidity Pool' });
};

/**
 * Get all wrapped asset bridges on Base
 */
export const getBaseWrappedBridges = () => {
  return getBaseBridges({ type: 'Wrapped Asset' });
};

/**
 * Get all DEX aggregator bridges on Base
 */
export const getBaseDexBridges = () => {
  return getBaseBridges({ type: 'DEX Aggregator' });
};

/**
 * Get fastest bridges on Base
 */
export const getFastestBridges = (limit: number = 5) => {
  return getBaseBridges()
    .filter(b => b.speed?.includes('Fast'))
    .slice(0, limit);
};

/**
 * Get cheapest bridges on Base (by fee)
 */
export const getCheapestBridges = (limit: number = 5) => {
  return getBaseBridges()
    .filter(b => b.fee?.includes('Low'))
    .slice(0, limit);
};

/**
 * Get bridge by ID
 */
export const getBaseBridgeById = (id: string) => {
  const bridgeKey = id.toUpperCase() as keyof typeof BASE_ECOSYSTEM.BRIDGES;
  const bridge = BASE_ECOSYSTEM.BRIDGES[bridgeKey];
  if (!bridge) {
    throw new Error(`Bridge ${id} not found on Base`);
  }
  return {
    id: bridgeKey,
    ...bridge,
  };
};

/**
 * Check if bridge is supported
 */
export const isBaseBridgeSupported = (bridgeId: string): boolean => {
  try {
    const bridge = getBaseBridgeById(bridgeId);
    return bridge.supported === true;
  } catch {
    return false;
  }
};

/**
 * Get bridges supporting specific asset
 */
export const getBridgesForAsset = (asset: string): any[] => {
  return getBaseBridges()
    .filter(bridge => 
      bridge.supportedAssets && 
      bridge.supportedAssets.some(a => a.toUpperCase() === asset.toUpperCase() || a === 'Any ERC-20')
    );
};

/**
 * Get bridges supporting specific source chain
 */
export const getBridgesFromChain = (chainId: number): any[] => {
  return getBaseBridges()
    .filter(bridge => 
      bridge.supportedChains && 
      bridge.supportedChains.includes(chainId)
    );
};

/**
 * Get total number of supported bridges
 */
export const getTotalBaseBridges = (): { total: number; byType: Record<string, number> } => {
  const bridges = getBaseBridges();
  const byType: Record<string, number> = {};
  
  bridges.forEach(bridge => {
    if (bridge.type) {
      byType[bridge.type] = (byType[bridge.type] || 0) + 1;
    }
  });

  return {
    total: bridges.length,
    byType,
  };
};

/**
 * Build bridge URL for asset
 */
export const getBridgeUrl = (
  bridge: keyof typeof BASE_ECOSYSTEM.BRIDGES,
  token?: string,
  amount?: string
): string => {
  const bridgeData = BASE_ECOSYSTEM.BRIDGES[bridge];
  let url = bridgeData.url;

  if (token && amount) {
    url += `?token=${token}&amount=${amount}&toChain=8453`;
  }

  return url;
};

/**
 * Build swap URL for token pair
 */
export const getSwapUrl = (
  dex: keyof typeof BASE_ECOSYSTEM.DEXS,
  fromToken: string,
  toToken: string,
  amount?: string
): string => {
  const dexData = BASE_ECOSYSTEM.DEXS[dex];
  
  // Format parameters based on DEX
  let params = `inputCurrency=${BASE_ECOSYSTEM.TOKENS[fromToken as keyof typeof BASE_ECOSYSTEM.TOKENS]?.address || ''}&outputCurrency=${BASE_ECOSYSTEM.TOKENS[toToken as keyof typeof BASE_ECOSYSTEM.TOKENS]?.address || ''}`;
  
  if (amount) {
    params += `&exactAmount=${amount}`;
  }

  if (dex === 'UNISWAP_V3') {
    return `https://app.uniswap.org/swap?chain=base&${params}`;
  } else if (dex === 'AERODROME') {
    return `https://aerodrome.finance/swap?${params}`;
  }

  return '';
};

// ============================================================================
// BASE ECOSYSTEM MONITORING
// ============================================================================

/**
 * Get Base ecosystem health
 */
export const getBaseEcosystemHealth = async (): Promise<{
  status: 'healthy' | 'degraded' | 'down';
  blockTime: number;
  gasPrice: string;
  tvl: string;
  activeDexs: number;
  lastUpdated: string;
}> => {
  try {
    const stats = await getBaseNetworkStats();
    const { gasPrice } = await estimateBaseGasPrice();

    // TVL data would come from DeFi Llama API in production
    return {
      status: 'healthy',
      blockTime: 2, // Base's standard block time
      gasPrice,
      tvl: '2.5B', // Placeholder
      activeDexs: 5,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error checking Base ecosystem health:', error);
    return {
      status: 'down',
      blockTime: 0,
      gasPrice: '0',
      tvl: '0',
      activeDexs: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
};

/**
 * Convert amount from Ethereum to Base equivalent
 * (useful for cross-chain pricing)
 */
export const convertEthereumToBaseValue = async (
  ethereumAmount: number
): Promise<{
  ethereumAmount: number;
  baseEquivalent: number;
  gasFeeDifference: string;
}> => {
  const l1Price = 50; // Example L1 gas price in Gwei
  const savings = calculateBaseSavings(l1Price, 'complex');

  return {
    ethereumAmount,
    baseEquivalent: ethereumAmount - savings.savingsPercent / 100,
    gasFeeDifference: `-${savings.savingsPercent.toFixed(1)}%`,
  };
};

// ============================================================================
// LENDING PROTOCOLS UTILITIES
// ============================================================================

/**
 * Get all lending protocols on Base
 */
export const getBaseLendingProtocols = (
  options?: { type?: string; supported?: boolean }
): Array<any> => {
  let protocols = Object.values(BASE_ECOSYSTEM.LENDING_PROTOCOLS);

  if (options?.type) {
    protocols = protocols.filter(p => p.type === options.type);
  }

  if (options?.supported !== undefined) {
    protocols = protocols.filter(p => p.supported === options.supported);
  }

  return protocols;
};

/**
 * Get all lending protocol types
 */
export const getBaseLendingProtocolTypes = (): string[] => {
  return [
    ...new Set(Object.values(BASE_ECOSYSTEM.LENDING_PROTOCOLS).map(p => p.type)),
  ];
};

/**
 * Get lending protocols by type
 */
export const getLendingProtocolsByType = (type: string): Array<any> => {
  return Object.values(BASE_ECOSYSTEM.LENDING_PROTOCOLS).filter(
    p => p.type === type
  );
};

/**
 * Get Aave markets
 */
export const getBaseAaveMarkets = (): any => {
  return BASE_ECOSYSTEM.LENDING_PROTOCOLS.AAVE_V3;
};

/**
 * Get Compound markets
 */
export const getBaseCompoundMarkets = (): any => {
  return BASE_ECOSYSTEM.LENDING_PROTOCOLS.COMPOUND_V3;
};

/**
 * Get Morpho markets
 */
export const getBaseMorphoMarkets = (): any => {
  return BASE_ECOSYSTEM.LENDING_PROTOCOLS.MORPHO;
};

/**
 * Get highest lending APY across protocols
 */
export const getHighestLendingAPY = (
  limit?: number
): Array<{ protocol: string; apy: string; asset?: string }> => {
  const protocols = Object.entries(BASE_ECOSYSTEM.LENDING_PROTOCOLS)
    .map(([key, protocol]) => ({
      protocol: protocol.name,
      apy: protocol.bestLendingAPY,
      tvl: protocol.tvl,
    }))
    .sort((a, b) => {
      const aMax = parseInt(a.apy.split('-')[1]) || 0;
      const bMax = parseInt(b.apy.split('-')[1]) || 0;
      return bMax - aMax;
    });

  return limit ? protocols.slice(0, limit) : protocols;
};

/**
 * Get highest borrowing APY across protocols
 */
export const getHighestBorrowingAPY = (
  limit?: number
): Array<{ protocol: string; apy: string }> => {
  const protocols = Object.entries(BASE_ECOSYSTEM.LENDING_PROTOCOLS)
    .map(([key, protocol]) => ({
      protocol: protocol.name,
      apy: protocol.bestBorrowingAPY,
      tvl: protocol.tvl,
    }))
    .sort((a, b) => {
      const aMin = parseInt(a.apy.split('-')[0]) || 0;
      const bMin = parseInt(b.apy.split('-')[0]) || 0;
      return aMin - bMin;
    });

  return limit ? protocols.slice(0, limit) : protocols;
};

/**
 * Get lending protocol by ID
 */
export const getBaseLendingProtocolById = (
  id: keyof typeof BASE_ECOSYSTEM.LENDING_PROTOCOLS
): any => {
  return BASE_ECOSYSTEM.LENDING_PROTOCOLS[id];
};

/**
 * Check if lending protocol is supported
 */
export const isBaseLendingProtocolSupported = (
  id: keyof typeof BASE_ECOSYSTEM.LENDING_PROTOCOLS
): boolean => {
  return BASE_ECOSYSTEM.LENDING_PROTOCOLS[id]?.supported || false;
};

/**
 * Get lending protocols supporting specific asset
 */
export const getLendingProtocolsForAsset = (asset: string): Array<any> => {
  return Object.values(BASE_ECOSYSTEM.LENDING_PROTOCOLS).filter(protocol =>
    protocol.supportedAssets?.includes(asset)
  );
};

/**
 * Get lending protocols where asset can be used as collateral
 */
export const getCollateralProtocolsForAsset = (asset: string): Array<any> => {
  return Object.values(BASE_ECOSYSTEM.LENDING_PROTOCOLS).filter(protocol =>
    protocol.collateralAssets?.includes(asset)
  );
};

/**
 * Get total lending TVL across protocols
 */
export const getTotalBaseLendingTVL = (): {
  total: string;
  byProtocol: { [key: string]: string };
  count: number;
} => {
  const protocols = Object.entries(BASE_ECOSYSTEM.LENDING_PROTOCOLS);
  let totalTVL = 0;

  const byProtocol: { [key: string]: string } = {};
  protocols.forEach(([key, protocol]) => {
    const tvlValue = parseInt(protocol.tvl.replace(/[^0-9]/g, '')) || 0;
    totalTVL += tvlValue;
    byProtocol[protocol.name] = protocol.tvl;
  });

  return {
    total: `${totalTVL / 1000}B+`,
    byProtocol,
    count: protocols.length,
  };
};

/**
 * Calculate optimal lending strategy
 */
export const getOptimalLendingStrategy = (
  asset: string,
  priority: 'apy' | 'safety' | 'liquidity' = 'apy'
): any => {
  const protocols = getLendingProtocolsForAsset(asset);

  if (priority === 'apy') {
    return protocols.sort((a, b) => {
      const aMax = parseInt(a.bestLendingAPY.split('-')[1]) || 0;
      const bMax = parseInt(b.bestLendingAPY.split('-')[1]) || 0;
      return bMax - aMax;
    })[0];
  } else if (priority === 'safety') {
    return protocols.sort((a, b) => {
      const riskOrder = { 'Low': 0, 'Medium': 1, 'High': 2 };
      return (riskOrder[a.riskLevel as keyof typeof riskOrder] || 0) -
             (riskOrder[b.riskLevel as keyof typeof riskOrder] || 0);
    })[0];
  } else {
    return protocols.sort((a, b) => {
      const aTVL = parseInt(a.tvl.replace(/[^0-9]/g, '')) || 0;
      const bTVL = parseInt(b.tvl.replace(/[^0-9]/g, '')) || 0;
      return bTVL - aTVL;
    })[0];
  }
};

/**
 * Get lending protocol URL
 */
export const getLendingProtocolUrl = (
  protocolId: keyof typeof BASE_ECOSYSTEM.LENDING_PROTOCOLS
): string => {
  return BASE_ECOSYSTEM.LENDING_PROTOCOLS[protocolId]?.url || '';
};

// ============================================================================
// STAKING & YIELD PROTOCOLS UTILITIES
// ============================================================================

/**
 * Get all staking protocols
 */
export const getBaseStakingProtocols = (
  options?: { type?: string; supported?: boolean }
): Array<any> => {
  let protocols = Object.values(BASE_ECOSYSTEM.STAKING_PROTOCOLS);

  if (options?.type) {
    protocols = protocols.filter(p => p.type === options.type);
  }

  if (options?.supported !== undefined) {
    protocols = protocols.filter(p => p.supported === options.supported);
  }

  return protocols;
};

/**
 * Get all staking protocol types
 */
export const getBaseStakingProtocolTypes = (): string[] => {
  return [
    ...new Set(Object.values(BASE_ECOSYSTEM.STAKING_PROTOCOLS).map(p => p.type)),
  ];
};

/**
 * Get staking protocols by type
 */
export const getStakingProtocolsByType = (type: string): Array<any> => {
  return Object.values(BASE_ECOSYSTEM.STAKING_PROTOCOLS).filter(
    p => p.type === type
  );
};

/**
 * Get ETH staking options
 */
export const getBaseETHStakingOptions = (): Array<any> => {
  return Object.values(BASE_ECOSYSTEM.STAKING_PROTOCOLS).filter(
    p => p.type === 'ETH Staking' || p.type === 'Decentralized ETH Staking'
  );
};

/**
 * Get Balancer yield optimization (Aura)
 */
export const getBaseBalancerYield = (): any => {
  return BASE_ECOSYSTEM.STAKING_PROTOCOLS.AURA_FINANCE;
};

/**
 * Get Curve yield optimization (Convex)
 */
export const getBaseCurveYield = (): any => {
  return BASE_ECOSYSTEM.STAKING_PROTOCOLS.CONVEX;
};

/**
 * Get highest staking APY across protocols
 */
export const getHighestStakingAPY = (
  limit?: number
): Array<{ protocol: string; apy: string; tvl: string }> => {
  const protocols = Object.entries(BASE_ECOSYSTEM.STAKING_PROTOCOLS)
    .map(([key, protocol]) => ({
      protocol: protocol.name,
      apy: protocol.apyEstimate,
      tvl: protocol.tvl,
      type: protocol.type,
    }))
    .sort((a, b) => {
      const aMax = parseInt(a.apy.split('-')[1]) || 0;
      const bMax = parseInt(b.apy.split('-')[1]) || 0;
      return bMax - aMax;
    });

  return limit ? protocols.slice(0, limit) : protocols;
};

/**
 * Get staking protocol by ID
 */
export const getBaseStakingProtocolById = (
  id: keyof typeof BASE_ECOSYSTEM.STAKING_PROTOCOLS
): any => {
  return BASE_ECOSYSTEM.STAKING_PROTOCOLS[id];
};

/**
 * Check if staking protocol is supported
 */
export const isBaseStakingProtocolSupported = (
  id: keyof typeof BASE_ECOSYSTEM.STAKING_PROTOCOLS
): boolean => {
  return BASE_ECOSYSTEM.STAKING_PROTOCOLS[id]?.supported || false;
};

/**
 * Get lowest risk staking options
 */
export const getLowRiskStakingOptions = (): Array<any> => {
  return Object.values(BASE_ECOSYSTEM.STAKING_PROTOCOLS)
    .filter(p => p.riskLevel === 'Low' || p.riskLevel === 'Low-Medium')
    .sort((a, b) => {
      const aMax = parseInt(a.apyEstimate.split('-')[1]) || 0;
      const bMax = parseInt(b.apyEstimate.split('-')[1]) || 0;
      return bMax - aMax;
    });
};

/**
 * Get high yield staking options
 */
export const getHighYieldStakingOptions = (
  limit?: number
): Array<any> => {
  const protocols = Object.values(BASE_ECOSYSTEM.STAKING_PROTOCOLS)
    .sort((a, b) => {
      const aMax = parseInt(a.apyEstimate.split('-')[1]) || 0;
      const bMax = parseInt(b.apyEstimate.split('-')[1]) || 0;
      return bMax - aMax;
    });

  return limit ? protocols.slice(0, limit) : protocols;
};

/**
 * Get staking protocols by minimum stake requirement
 */
export const getStakingProtocolsByMinStake = (
  maxMinStake: number
): Array<any> => {
  return Object.values(BASE_ECOSYSTEM.STAKING_PROTOCOLS).filter(protocol => {
    const minStr = protocol.minStake.toLowerCase();
    if (minStr === 'no minimum') return true;
    const minValue = parseFloat(minStr.split(' ')[0]);
    return minValue <= maxMinStake;
  });
};

/**
 * Get total staking TVL across protocols
 */
export const getTotalBaseStakingTVL = (): {
  total: string;
  byProtocol: { [key: string]: string };
  count: number;
  byType: { [key: string]: string };
} => {
  const protocols = Object.entries(BASE_ECOSYSTEM.STAKING_PROTOCOLS);
  let totalTVL = 0;

  const byProtocol: { [key: string]: string } = {};
  const byType: { [key: string]: string } = {};

  protocols.forEach(([key, protocol]) => {
    const tvlValue = parseInt(protocol.tvl.replace(/[^0-9]/g, '')) || 0;
    totalTVL += tvlValue;
    byProtocol[protocol.name] = protocol.tvl;

    const type = protocol.type;
    if (!byType[type]) {
      byType[type] = '0B+';
    }
    const typeValue = parseInt(byType[type].replace(/[^0-9]/g, '')) || 0;
    byType[type] = `${typeValue + tvlValue}B+`;
  });

  return {
    total: `${totalTVL / 1000}B+`,
    byProtocol,
    count: protocols.length,
    byType,
  };
};

/**
 * Estimate yield from staking amount
 */
export const estimateStakingYield = (
  protocolId: keyof typeof BASE_ECOSYSTEM.STAKING_PROTOCOLS,
  amount: number,
  yearsToProject: number = 1
): { annualYield: number; totalProjected: number; apy: string } => {
  const protocol = BASE_ECOSYSTEM.STAKING_PROTOCOLS[protocolId];
  if (!protocol) return { annualYield: 0, totalProjected: 0, apy: '0%' };

  const apyMin = parseInt(protocol.apyEstimate.split('-')[0]) || 0;
  const apyMax = parseInt(protocol.apyEstimate.split('-')[1]) || 0;
  const apyAvg = (apyMin + apyMax) / 2 / 100;

  const annualYield = amount * apyAvg;
  const totalProjected = amount * Math.pow(1 + apyAvg, yearsToProject);

  return {
    annualYield: Math.round(annualYield * 100) / 100,
    totalProjected: Math.round(totalProjected * 100) / 100,
    apy: protocol.apyEstimate,
  };
};

/**
 * Compare staking protocols for specific criteria
 */
export const getOptimalStakingStrategy = (
  priority: 'yield' | 'safety' | 'liquidity' = 'yield'
): any => {
  const protocols = Object.values(BASE_ECOSYSTEM.STAKING_PROTOCOLS);

  if (priority === 'yield') {
    return protocols.sort((a, b) => {
      const aMax = parseInt(a.apyEstimate.split('-')[1]) || 0;
      const bMax = parseInt(b.apyEstimate.split('-')[1]) || 0;
      return bMax - aMax;
    })[0];
  } else if (priority === 'safety') {
    return protocols.sort((a, b) => {
      const riskOrder = { 'Low': 0, 'Low-Medium': 1, 'Medium': 2, 'High': 3 };
      return (riskOrder[a.riskLevel as keyof typeof riskOrder] || 3) -
             (riskOrder[b.riskLevel as keyof typeof riskOrder] || 3);
    })[0];
  } else {
    // Liquidity = shortest withdrawal time
    const timeOrder: { [key: string]: number } = {
      'Liquid': 0,
      '7 days': 1,
      '16 days': 2,
    };
    return protocols.sort((a, b) => {
      return (timeOrder[a.withdrawalTime] || 999) -
             (timeOrder[b.withdrawalTime] || 999);
    })[0];
  }
};

/**
 * Get staking protocol URL
 */
export const getStakingProtocolUrl = (
  protocolId: keyof typeof BASE_ECOSYSTEM.STAKING_PROTOCOLS
): string => {
  return BASE_ECOSYSTEM.STAKING_PROTOCOLS[protocolId]?.url || '';
};

// ============================================================================
// TOKEN LIST & REGISTRY UTILITIES
// ============================================================================

/**
 * Get all tokens in registry
 */
export const getAllBaseTokens = (
  options?: { category?: string; supported?: boolean }
): Array<any> => {
  let tokens = Object.values(BASE_ECOSYSTEM.TOKEN_LIST);

  if (options?.category) {
    tokens = tokens.filter(t => t.category === options.category);
  }

  if (options?.supported !== undefined) {
    tokens = tokens.filter(t => t.supported === options.supported);
  }

  return tokens;
};

/**
 * Get token by symbol
 */
export const getTokenBySymbol = (symbol: string): any => {
  const key = Object.keys(BASE_ECOSYSTEM.TOKEN_LIST).find(
    k => BASE_ECOSYSTEM.TOKEN_LIST[k as keyof typeof BASE_ECOSYSTEM.TOKEN_LIST]?.symbol.toUpperCase() === symbol.toUpperCase()
  );
  return key ? BASE_ECOSYSTEM.TOKEN_LIST[key as keyof typeof BASE_ECOSYSTEM.TOKEN_LIST] : null;
};

/**
 * Get token by address
 */
export const getTokenByAddress = (address: string): any => {
  return Object.values(BASE_ECOSYSTEM.TOKEN_LIST).find(
    t => t.address.toLowerCase() === address.toLowerCase()
  );
};

/**
 * Get token by coingecko ID
 */
export const getTokenByCoingeckoId = (coingeckoId: string): any => {
  return Object.values(BASE_ECOSYSTEM.TOKEN_LIST).find(
    t => t.coingeckoId.toLowerCase() === coingeckoId.toLowerCase()
  );
};

/**
 * Get all token symbols
 */
export const getAllTokenSymbols = (): string[] => {
  return Object.values(BASE_ECOSYSTEM.TOKEN_LIST).map(t => t.symbol);
};

/**
 * Get all token categories
 */
export const getTokenCategories = (): string[] => {
  return [
    ...new Set(Object.values(BASE_ECOSYSTEM.TOKEN_LIST).map(t => t.category)),
  ];
};

/**
 * Get tokens by category
 */
export const getTokensByCategory = (category: string): Array<any> => {
  return Object.values(BASE_ECOSYSTEM.TOKEN_LIST).filter(t => t.category === category);
};

/**
 * Verify token address is valid
 */
export const isValidTokenAddress = (address: string): boolean => {
  return !!getTokenByAddress(address);
};

/**
 * Get major stablecoin tokens
 */
export const getMajorStablecoins = (): Array<any> => {
  return getTokensByCategory('Stablecoin');
};

/**
 * Get major governance tokens
 */
export const getMajorGovernanceTokens = (): Array<any> => {
  return getTokensByCategory('Governance');
};

/**
 * Get Base native tokens
 */
export const getBaseNativeTokens = (): Array<any> => {
  return Object.values(BASE_ECOSYSTEM.TOKEN_LIST).filter(t =>
    ['Base Native DEX', 'Base Native Protocol'].includes(t.category)
  );
};

/**
 * Get staked asset tokens
 */
export const getStakedAssetTokens = (): Array<any> => {
  return getTokensByCategory('Staked Asset');
};

/**
 * Get wrapped asset tokens
 */
export const getWrappedAssetTokens = (): Array<any> => {
  return getTokensByCategory('Wrapped Asset');
};

/**
 * Search tokens by partial symbol/name match
 */
export const searchTokens = (query: string): Array<any> => {
  const q = query.toLowerCase();
  return Object.values(BASE_ECOSYSTEM.TOKEN_LIST).filter(t =>
    t.symbol.toLowerCase().includes(q) ||
    t.name.toLowerCase().includes(q)
  );
};

/**
 * Verify contract address with token data
 */
export const verifyTokenContract = (
  symbol: string,
  address: string
): boolean => {
  const token = getTokenBySymbol(symbol);
  return token ? token.address.toLowerCase() === address.toLowerCase() : false;
};

/**
 * Get token logo URL
 */
export const getTokenLogo = (symbol: string): string => {
  const token = getTokenBySymbol(symbol);
  return token?.logoUrl || '';
};

/**
 * Get token coingecko ID
 */
export const getTokenCoingeckoId = (symbol: string): string => {
  const token = getTokenBySymbol(symbol);
  return token?.coingeckoId || '';
};

/**
 * Get token decimals
 */
export const getTokenDecimals = (symbol: string): number => {
  const token = getTokenBySymbol(symbol);
  return token?.decimals || 18;
};

/**
 * Get token address
 */
export const getTokenAddress = (symbol: string): string => {
  const token = getTokenBySymbol(symbol);
  return token?.address || '';
};

/**
 * Check if token is supported
 */
export const isTokenSupported = (symbol: string): boolean => {
  const token = getTokenBySymbol(symbol);
  return token?.supported || false;
};

/**
 * Get total token count
 */
export const getTotalTokenCount = (): {
  total: number;
  byCategory: { [key: string]: number };
  supported: number;
} => {
  const allTokens = Object.values(BASE_ECOSYSTEM.TOKEN_LIST);
  const byCategory: { [key: string]: number } = {};

  allTokens.forEach(token => {
    if (!byCategory[token.category]) {
      byCategory[token.category] = 0;
    }
    byCategory[token.category]++;
  });

  return {
    total: allTokens.length,
    byCategory,
    supported: allTokens.filter(t => t.supported).length,
  };
};

/**
 * Get commonly used token pair suggestions
 */
export const getCommonTokenPairs = (): Array<{ from: string; to: string; name: string }> => {
  return [
    { from: 'ETH', to: 'USDC', name: 'Ethereum to USDC' },
    { from: 'ETH', to: 'USDT', name: 'Ethereum to USDT' },
    { from: 'USDC', to: 'USDT', name: 'USDC to USDT' },
    { from: 'WBTC', to: 'ETH', name: 'Bitcoin to Ethereum' },
    { from: 'DAI', to: 'USDC', name: 'DAI to USDC' },
    { from: 'AAVE', to: 'ETH', name: 'AAVE to Ethereum' },
    { from: 'OP', to: 'ETH', name: 'Optimism to Ethereum' },
    { from: 'ARB', to: 'ETH', name: 'Arbitrum to Ethereum' },
  ];
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  BASE_ECOSYSTEM,
  createBaseClients,
  createBaseWalletClient,
  getBaseNetworkStats,
  isTokenOnBase,
  getBaseTokenDetails,
  formatBaseTokenAmount,
  parseBaseTokenAmount,
  estimateBaseGasPrice,
  calculateBaseSavings,
  getBaseBridges,
  getBaseBridgeTypes,
  getBridgesByType,
  getBaseNativeBridges,
  getBaseLiquidityBridges,
  getBaseWrappedBridges,
  getBaseDexBridges,
  getFastestBridges,
  getCheapestBridges,
  getBaseBridgeById,
  isBaseBridgeSupported,
  getBridgesForAsset,
  getBridgesFromChain,
  getTotalBaseBridges,
  getBaseDexs,
  getBaseServices,
  getBaseDexTypes,
  getDexsByType,
  getBaseAMMs,
  getBaseDexAggregators,
  getBaseDexById,
  getTopDexsByTVL,
  getTopDexsByVolume,
  isBaseDexSupported,
  getTotalBaseDexTVL,
  getBridgeUrl,
  getSwapUrl,
  getBaseEcosystemHealth,
  convertEthereumToBaseValue,
  getBaseLendingProtocols,
  getBaseLendingProtocolTypes,
  getLendingProtocolsByType,
  getBaseAaveMarkets,
  getBaseCompoundMarkets,
  getBaseMorphoMarkets,
  getHighestLendingAPY,
  getHighestBorrowingAPY,
  getBaseLendingProtocolById,
  isBaseLendingProtocolSupported,
  getLendingProtocolsForAsset,
  getCollateralProtocolsForAsset,
  getTotalBaseLendingTVL,
  getOptimalLendingStrategy,
  getLendingProtocolUrl,
  getBaseStakingProtocols,
  getBaseStakingProtocolTypes,
  getStakingProtocolsByType,
  getBaseETHStakingOptions,
  getBaseBalancerYield,
  getBaseCurveYield,
  getHighestStakingAPY,
  getBaseStakingProtocolById,
  isBaseStakingProtocolSupported,
  getLowRiskStakingOptions,
  getHighYieldStakingOptions,
  getStakingProtocolsByMinStake,
  getTotalBaseStakingTVL,
  estimateStakingYield,
  getOptimalStakingStrategy,
  getStakingProtocolUrl,
  getAllBaseTokens,
  getTokenBySymbol,
  getTokenByAddress,
  getTokenByCoingeckoId,
  getAllTokenSymbols,
  getTokenCategories,
  getTokensByCategory,
  isValidTokenAddress,
  getMajorStablecoins,
  getMajorGovernanceTokens,
  getBaseNativeTokens,
  getStakedAssetTokens,
  getWrappedAssetTokens,
  searchTokens,
  verifyTokenContract,
  getTokenLogo,
  getTokenCoingeckoId,
  getTokenDecimals,
  getTokenAddress,
  isTokenSupported,
  getTotalTokenCount,
  getCommonTokenPairs,
} as const;
