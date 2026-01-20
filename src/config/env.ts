// Environment configuration
export const ENV = {
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
} as const;

export const BLOCKCHAIN_CONFIG = {
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '8453',
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org',
  CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
} as const;

export const GAME_CONFIG_DEFAULTS = {
  MAX_PLAYERS_PER_TEAM: 11,
  MATCH_DURATION_SECONDS: 5400,
  HALF_DURATION_SECONDS: 2700,
} as const;
