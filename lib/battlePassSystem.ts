export type BattlePassTier = 'free' | 'premium';
export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'event';

export interface BattlePassReward {
  id: string;
  name: string;
  type: 'cosmetic' | 'currency' | 'experience' | 'title' | 'emote';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  value: string | number;
  icon: string;
}

export interface BattlePassLevel {
  level: number;
  requiredXP: number;
  rewards: { free: BattlePassReward; premium?: BattlePassReward };
  milestone: boolean;
  milestoneName?: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  category: 'match' | 'personal' | 'team' | 'seasonal';
  difficulty: 'easy' | 'medium' | 'hard' | 'elite';
  xpReward: number;
  target: number;
  progress: number;
  completed: boolean;
  repeatable: boolean;
  resetFrequency?: 'daily' | 'weekly' | 'monthly';
  icon: string;
}

export interface PlayerProgress {
  userId: string;
  currentLevel: number;
  currentXP: number;
  totalXP: number;
  tier: BattlePassTier;
  purchases: Array<{ level: number; cost: number; date: Date }>;
  completedChallenges: Array<{ challengeId: string; completedAt: Date }>;
  claimedRewards: Array<{ level: number; tier: BattlePassTier; claimedAt: Date }>;
}

export interface BattlePassSeason {
  id: string;
  number: number;
  name: string;
  season: Season;
  theme: string;
  startDate: Date;
  endDate: Date;
  totalLevels: number;
  levels: BattlePassLevel[];
  challenges: Challenge[];
  premiumPrice: number;
  premiumDiscountedPrice?: number;
  premiumCost: 'USD' | 'gems';
  passDescription: string;
  artworkUrl: string;
}

export interface BattlePassStats {
  activeSeason: BattlePassSeason | null;
  totalPlayersEnrolled: number;
  premiumSubscribers: number;
  freePlayersEnrolled: number;
  totalChallengesCompleted: number;
  averagePlayerLevel: number;
  seasonalRevenue: number;
}

class BattlePassSystem {
  private static instance: BattlePassSystem;
  private seasons: Map<string, BattlePassSeason>;
  private playerProgress: Map<string, PlayerProgress>;
  private stats: BattlePassStats;
  private currentSeasonId: string = '';

  private constructor() {
    this.seasons = new Map();
    this.playerProgress = new Map();
    this.stats = { activeSeason: null, totalPlayersEnrolled: 0, premiumSubscribers: 0, freePlayersEnrolled: 0, totalChallengesCompleted: 0, averagePlayerLevel: 0, seasonalRevenue: 0 };
    this.initializeSeasons();
    this.loadFromStorage();
  }

  static getInstance(): BattlePassSystem {
    if (!BattlePassSystem.instance) { BattlePassSystem.instance = new BattlePassSystem(); }
    return BattlePassSystem.instance;
  }

  private initializeSeasons(): void {
    const s1: BattlePassSeason = { id: 'season_1', number: 1, name: 'Rise of Champions', season: 'spring', theme: 'Glory & Victory', startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31'), totalLevels: 100, levels: this.generateLevels(100), challenges: this.generateChallenges('season_1'), premiumPrice: 9.99, premiumDiscountedPrice: 7.99, premiumCost: 'USD', passDescription: 'Unlock exclusive cosmetics, titles, and rewards throughout the season', artworkUrl: 'season1.webp' };
    const s2: BattlePassSeason = { id: 'season_2', number: 2, name: 'Summer Showdown', season: 'summer', theme: 'Beach & Festival', startDate: new Date('2024-04-01'), endDate: new Date('2024-06-30'), totalLevels: 100, levels: this.generateLevels(100), challenges: this.generateChallenges('season_2'), premiumPrice: 9.99, premiumCost: 'USD', passDescription: 'Summer special battle pass with beach-themed cosmetics and rewards', artworkUrl: 'season2.webp' };
    this.seasons.set(s1.id, s1);
    this.seasons.set(s2.id, s2);
    this.currentSeasonId = 'season_1';
    this.stats.activeSeason = s1;
  }

  private generateLevels(count: number): BattlePassLevel[] {
    const levels: BattlePassLevel[] = [];
    for (let i = 1; i <= count; i++) {
      const isMilestone = i % 10 === 0;
      levels.push({ level: i, requiredXP: i * 1000, rewards: { free: { id: `reward_free_${i}`, name: `Level ${i} Reward`, type: 'currency', rarity: 'common', value: i * 10, icon: '🎁' }, premium: i % 5 === 0 ? { id: `reward_premium_${i}`, name: `Premium Cosmetic ${i}`, type: 'cosmetic', rarity: isMilestone ? 'epic' : 'rare', value: `cosmetic_${i}`, icon: '✨' } : undefined }, milestone: isMilestone, milestoneName: isMilestone ? `Milestone ${i / 10}` : undefined });
    }
    return levels;
  }

  private generateChallenges(seasonId: string): Challenge[] {
    return [
      { id: `${seasonId}_win_5`, name: 'Victory Seeker', description: 'Win 5 matches', category: 'match', difficulty: 'easy', xpReward: 500, target: 5, progress: 0, completed: false, repeatable: true, resetFrequency: 'weekly', icon: '🏆' },
      { id: `${seasonId}_score_100`, name: 'Goal Scorer', description: 'Score 100 goals', category: 'personal', difficulty: 'medium', xpReward: 1000, target: 100, progress: 0, completed: false, repeatable: false, icon: '⚽' },
      { id: `${seasonId}_assist_50`, name: 'Team Player', description: 'Get 50 assists', category: 'team', difficulty: 'medium', xpReward: 800, target: 50, progress: 0, completed: false, repeatable: false, icon: '🤝' },
      { id: `${seasonId}_play_100`, name: 'Marathon Player', description: 'Play 100 matches', category: 'match', difficulty: 'hard', xpReward: 1500, target: 100, progress: 0, completed: false, repeatable: false, icon: '⏱️' },
      { id: `${seasonId}_daily_5`, name: 'Daily Grinder', description: 'Complete 5 daily challenges', category: 'seasonal', difficulty: 'easy', xpReward: 250, target: 5, progress: 0, completed: false, repeatable: true, resetFrequency: 'daily', icon: '📅' },
    ];
  }

  getSeason(seasonId: string): BattlePassSeason | null { return this.seasons.get(seasonId) || null; }
  getCurrentSeason(): BattlePassSeason | null { return this.seasons.get(this.currentSeasonId) || null; }
  getAllSeasons(): BattlePassSeason[] { return Array.from(this.seasons.values()); }

  setActiveSeason(seasonId: string): boolean {
    if (!this.seasons.has(seasonId)) return false;
    this.currentSeasonId = seasonId;
    this.stats.activeSeason = this.seasons.get(seasonId) || null;
    this.saveToStorage();
    return true;
  }

  enrollPlayer(userId: string, tier: BattlePassTier): PlayerProgress {
    let progress = this.playerProgress.get(userId);
    if (!progress) {
      progress = { userId, currentLevel: 1, currentXP: 0, totalXP: 0, tier, purchases: [], completedChallenges: [], claimedRewards: [] };
      this.playerProgress.set(userId, progress);
      if (tier === 'free') { this.stats.freePlayersEnrolled++; } else { this.stats.premiumSubscribers++; }
      this.stats.totalPlayersEnrolled++;
    } else {
      progress.tier = tier;
    }
    this.saveToStorage();
    return progress;
  }

  getPlayerProgress(userId: string): PlayerProgress | null { return this.playerProgress.get(userId) || null; }

  addXP(userId: string, xpAmount: number): { leveledUp: boolean; newLevel: number } {
    const progress = this.getPlayerProgress(userId);
    if (!progress) return { leveledUp: false, newLevel: 1 };
    const season = this.getCurrentSeason();
    if (!season) return { leveledUp: false, newLevel: progress.currentLevel };
    progress.currentXP += xpAmount;
    progress.totalXP += xpAmount;
    let leveledUp = false;
    const currentLevel = season.levels[progress.currentLevel - 1];
    if (currentLevel && progress.currentXP >= currentLevel.requiredXP) {
      progress.currentLevel++;
      progress.currentXP -= currentLevel.requiredXP;
      leveledUp = true;
    }
    this.saveToStorage();
    return { leveledUp, newLevel: progress.currentLevel };
  }

  completeChallenge(userId: string, challengeId: string): boolean {
    const progress = this.getPlayerProgress(userId);
    if (!progress) return false;
    const already = progress.completedChallenges.find(c => c.challengeId === challengeId);
    if (already) return false;
    progress.completedChallenges.push({ challengeId, completedAt: new Date() });
    this.stats.totalChallengesCompleted++;
    const season = this.getCurrentSeason();
    const challenge = season?.challenges.find(c => c.id === challengeId);
    if (challenge) { this.addXP(userId, challenge.xpReward); }
    this.saveToStorage();
    return true;
  }

  claimReward(userId: string, level: number): boolean {
    const progress = this.getPlayerProgress(userId);
    if (!progress) return false;
    if (progress.currentLevel < level) return false;
    const already = progress.claimedRewards.find(r => r.level === level);
    if (already) return false;
    progress.claimedRewards.push({ level, tier: progress.tier, claimedAt: new Date() });
    this.saveToStorage();
    return true;
  }

  buyLevels(userId: string, levelsToBuy: number, cost: number): boolean {
    const progress = this.getPlayerProgress(userId);
    if (!progress) return false;
    const season = this.getCurrentSeason();
    if (!season || progress.currentLevel + levelsToBuy > season.totalLevels) return false;
    progress.currentLevel += levelsToBuy;
    progress.purchases.push({ level: progress.currentLevel, cost, date: new Date() });
    this.stats.seasonalRevenue += cost;
    this.saveToStorage();
    return true;
  }

  updateChallengeProgress(userId: string, challengeId: string, newProgress: number): boolean {
    const season = this.getCurrentSeason();
    const challenge = season?.challenges.find(c => c.id === challengeId);
    if (!challenge) return false;
    challenge.progress = newProgress;
    if (newProgress >= challenge.target && !challenge.completed) {
      challenge.completed = true;
      this.completeChallenge(userId, challengeId);
    }
    this.saveToStorage();
    return true;
  }

  getChallenges(seasonId: string): Challenge[] { const season = this.seasons.get(seasonId); return season?.challenges || []; }

  getStats(): BattlePassStats {
    this.stats.averagePlayerLevel = this.playerProgress.size > 0 ? Array.from(this.playerProgress.values()).reduce((sum, p) => sum + p.currentLevel, 0) / this.playerProgress.size : 0;
    return { ...this.stats };
  }

  getSeasonStats(seasonId: string): { enrolledPlayers: number; premiumPlayers: number; avgLevel: number } {
    const players = Array.from(this.playerProgress.values());
    const premiumCount = players.filter(p => p.tier === 'premium').length;
    const avgLevel = players.length > 0 ? players.reduce((sum, p) => sum + p.currentLevel, 0) / players.length : 0;
    return { enrolledPlayers: players.length, premiumPlayers: premiumCount, avgLevel };
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const data = { seasons: Array.from(this.seasons.entries()), playerProgress: Array.from(this.playerProgress.entries()), currentSeasonId: this.currentSeasonId, stats: this.stats };
      localStorage.setItem('battlePassSystem', JSON.stringify(data));
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const data = localStorage.getItem('battlePassSystem');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          this.seasons = new Map(parsed.seasons);
          this.playerProgress = new Map(parsed.playerProgress);
          this.currentSeasonId = parsed.currentSeasonId;
          this.stats = parsed.stats;
        } catch (error) {
          console.error('Failed to load battle pass data:', error);
        }
      }
    }
  }

  reset(): void {
    this.seasons.clear();
    this.playerProgress.clear();
    this.currentSeasonId = '';
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('battlePassSystem');
    }
  }
}

export default BattlePassSystem.getInstance();
