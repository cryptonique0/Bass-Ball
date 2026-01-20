// Configuration manager
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
  };
  game: {
    maxPlayers: number;
    matchDuration: number;
  };
  features: {
    enableAI: boolean;
    enableWallet: boolean;
    enableBadges: boolean;
  };
}

class ConfigManager {
  private config: AppConfig = {
    api: {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
      timeout: 30000,
    },
    game: {
      maxPlayers: 22,
      matchDuration: 5400,
    },
    features: {
      enableAI: true,
      enableWallet: true,
      enableBadges: true,
    },
  };

  get(key: string): any {
    return key.split('.').reduce((obj, k) => obj?.[k], this.config);
  }

  set(key: string, value: any): void {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    const obj = keys.reduce((current, k) => {
      current[k] = current[k] || {};
      return current[k];
    }, this.config as any);
    obj[lastKey] = value;
  }

  getAll(): AppConfig {
    return this.config;
  }
}

export const config = new ConfigManager();
