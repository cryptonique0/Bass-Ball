/**
 * Bass Ball JavaScript/TypeScript SDK
 * Official SDK for interacting with Bass Ball game API
 */

export interface SDKConfig {
  apiUrl: string;
  walletProvider?: any;
  authToken?: string;
}

export interface PlayerProfile {
  id: string;
  username: string;
  rating: number;
  stats: {
    wins: number;
    losses: number;
    winrate: number;
  };
  wallet?: string;
}

export interface MatchSearchOptions {
  playerId: string;
  region?: string;
  maxLatencyMs?: number;
  tolerance?: number;
}

export interface MatchCandidate {
  playerId: string;
  score: number;
  rating: number;
}

export class BassBallClient {
  private config: SDKConfig;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  constructor(config: SDKConfig) {
    this.config = config;
  }

  // Auth methods
  async auth_connect(): Promise<string> {
    const response = await fetch(`${this.config.apiUrl}/api/auth/challenge`, {
      method: 'POST',
    });
    const { challenge } = await response.json();

    if (!this.config.walletProvider) {
      throw new Error('Wallet provider required for authentication');
    }

    const signature = await this.config.walletProvider.request({
      method: 'personal_sign',
      params: [challenge, this.config.walletProvider.selectedAddress],
    });

    const verifyResponse = await fetch(`${this.config.apiUrl}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge, signature }),
    });

    const { token } = await verifyResponse.json();
    this.config.authToken = token;
    return token;
  }

  // Player methods
  async player_get(playerId: string): Promise<PlayerProfile> {
    const response = await this.request(`/api/player/${playerId}`);
    return response;
  }

  async player_update(playerId: string, data: Partial<PlayerProfile>): Promise<PlayerProfile> {
    return this.request(`/api/player/${playerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Matchmaking methods
  async matchmaking_search(options: MatchSearchOptions): Promise<MatchCandidate[]> {
    const response = await this.request('/api/matchmaking/search', {
      method: 'POST',
      body: JSON.stringify(options),
    });
    return response.candidates || [];
  }

  async matchmaking_status(matchId: string): Promise<any> {
    return this.request(`/api/matchmaking/status/${matchId}`);
  }

  // Event system
  on(event: string, handler: Function): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // Generic request helper
  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }

    const response = await fetch(`${this.config.apiUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }

    return response.json();
  }
}

export default BassBallClient;
