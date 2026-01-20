// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Wallet types
export interface WalletInfo {
  address: string;
  balance: string;
  network: number;
}

// Badge types
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  criteria: Record<string, any>;
  createdAt: number;
}

export interface PlayerBadge extends Badge {
  playerAddress: string;
  earnedAt: number;
  minted: boolean;
  contractAddress?: string;
  tokenId?: string;
}
