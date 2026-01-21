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

const toNumber = (value: string | undefined, fallback: number, label: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    console.warn(`[env] Falling back to ${fallback} for ${label}`);
    return fallback;
  }
  return parsed;
};

const toUrl = (value: string | undefined, fallback: string, label: string): string => {
  if (!value) {
    console.warn(`[env] Missing ${label}; using fallback ${fallback}`);
    return fallback;
  }
  try {
    // Validate URL format to avoid silent misconfiguration
    // eslint-disable-next-line no-new
    new URL(value);
    return value;
  } catch (err) {
    console.warn(`[env] Invalid URL for ${label}; using fallback ${fallback}`);
    return fallback;
  }
};

export const BASE_ENV = {
  baseRpcUrl: toUrl(process.env.NEXT_PUBLIC_BASE_RPC, 'https://mainnet.base.org', 'NEXT_PUBLIC_BASE_RPC'),
  baseSepoliaRpcUrl: toUrl(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC, 'https://sepolia.base.org', 'NEXT_PUBLIC_BASE_SEPOLIA_RPC'),
  baseChainId: toNumber(process.env.NEXT_PUBLIC_BASE_CHAIN_ID, 8453, 'NEXT_PUBLIC_BASE_CHAIN_ID'),
  baseSepoliaChainId: toNumber(process.env.NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID, 84532, 'NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID'),
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  infuraId: process.env.NEXT_PUBLIC_INFURA_ID || process.env.NEXT_PUBLIC_INFURA_KEY || '',
} as const;

let envWarningsLogged = false;
export const validateBaseEnv = (): void => {
  if (envWarningsLogged) return;
  const warnings: string[] = [];
  if (!BASE_ENV.walletConnectProjectId) {
    warnings.push('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is missing. Get one at https://cloud.walletconnect.com');
  }
  if (!BASE_ENV.baseRpcUrl) {
    warnings.push('NEXT_PUBLIC_BASE_RPC is missing; using default https://mainnet.base.org');
  }
  if (!BASE_ENV.baseSepoliaRpcUrl) {
    warnings.push('NEXT_PUBLIC_BASE_SEPOLIA_RPC is missing; using default https://sepolia.base.org');
  }
  if (warnings.length) {
    console.warn('[env] Base chain configuration warnings:\n- ' + warnings.join('\n- '));
  }
  envWarningsLogged = true;
};

export const GAME_CONFIG_DEFAULTS = {
  MAX_PLAYERS_PER_TEAM: 11,
  MATCH_DURATION_SECONDS: 5400,
  HALF_DURATION_SECONDS: 2700,
} as const;
