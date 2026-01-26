/**
 * Farcaster Frame Provider
 * Manages mini-match gameplay inside Farcaster Frames
 */

interface FrameGameState {
  gameId: string;
  playerId: string; // farcaster user ID
  playerName: string;
  
  // Game mechanics
  gameType: 'quick_tap' | 'rhythm_match' | 'deck_duel' | 'tournament';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  
  // Gameplay
  status: 'setup' | 'active' | 'paused' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  duration: number; // seconds
  
  // Scoring
  score: number;
  lives: number;
  combo: number;
  multiplier: number;
  
  // Results
  result?: 'win' | 'loss' | 'tie' | 'abandoned';
  finalScore?: number;
  reward?: {
    coins: number;
    xp: number;
    nft?: string;
  };
  
  // Frame metadata
  castHash?: string;
  replyHash?: string;
  timestamp: number;
}

interface FrameAction {
  actionId: string;
  gameId: string;
  playerId: string;
  
  action: 'tap' | 'swipe' | 'hold' | 'release' | 'rotate' | 'button_click';
  value?: number; // for analog inputs
  timestamp: number;
  
  responseTime: number; // ms from prompt to action
  accuracy: number; // 0-100%
  
  points: number;
  comboIncrement: number;
}

interface MiniGame {
  gameTypeId: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  
  duration: number; // seconds
  baseReward: number; // coin reward
  xpReward: number;
  
  mechanics: {
    type: 'tap_sequence' | 'rhythm' | 'reflex' | 'memory' | 'strategy';
    prompt: string;
    validActions: string[];
    successThreshold: number;
  };
  
  difficulty_scaling: {
    speed: number; // 1.0 = normal
    complexity: number;
    lives: number;
  };
  
  createdAt: number;
}

interface FrameLeaderboard {
  leaderboardId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'alltime';
  gameType: string;
  
  entries: Array<{
    rank: number;
    playerId: string;
    playerName: string;
    score: number;
    gamesPlayed: number;
    timestamp: number;
  }>;
  
  snapshot: number;
}

interface FrameAchievement {
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  
  condition: {
    type: 'score_threshold' | 'game_count' | 'streak' | 'combo';
    value: number;
    gameType?: string;
  };
  
  reward: {
    coins: number;
    xp: number;
    badge: string;
  };
  
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  
  createdAt: number;
}

interface PlayerFrameStats {
  statsId: string;
  playerId: string;
  playerName: string;
  
  totalGamesPlayed: number;
  totalScore: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  
  currentStreak: number;
  bestStreak: number;
  
  highestScore: number;
  averageScore: number;
  
  coinsEarned: number;
  xpEarned: number;
  
  achievements: string[]; // achievement IDs
  badges: string[];
  
  lastGameTime?: number;
  snapshot: number;
}

interface FrameSession {
  sessionId: string;
  playerId: string;
  farcasterToken: string; // Farcaster auth token
  
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  
  gamesPlayed: number[];
  totalCoinsEarned: number;
  
  valid: boolean;
}

export class FarcasterFrameProvider {
  private static instance: FarcasterFrameProvider;
  
  private games: Map<string, FrameGameState> = new Map();
  private actions: Map<string, FrameAction> = new Map();
  private miniGames: Map<string, MiniGame> = new Map();
  private leaderboards: Map<string, FrameLeaderboard> = new Map();
  private achievements: Map<string, FrameAchievement> = new Map();
  private playerStats: Map<string, PlayerFrameStats> = new Map();
  private sessions: Map<string, FrameSession> = new Map();

  // Configuration
  private readonly FRAME_HOST = 'https://frames.bassball.io';
  private readonly FRAME_VERSION = '0.1';
  private readonly SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    this.loadFromStorage();
    this.initializeMiniGames();
    this.initializeAchievements();
  }

  static getInstance(): FarcasterFrameProvider {
    if (!FarcasterFrameProvider.instance) {
      FarcasterFrameProvider.instance = new FarcasterFrameProvider();
    }
    return FarcasterFrameProvider.instance;
  }

  /**
   * Get game by ID
   */
  getGame(gameId: string): FrameGameState | undefined {
    return this.games.get(gameId);
  }

  /**
   * Mini Games Setup
   */
  private initializeMiniGames(): void {
    const games: MiniGame[] = [
      {
        gameTypeId: 'quick_tap',
        name: 'Quick Tap',
        description: 'Tap the targets as they appear',
        difficulty: 'easy',
        duration: 30,
        baseReward: 50,
        xpReward: 100,
        mechanics: {
          type: 'tap_sequence',
          prompt: 'Tap the blue square!',
          validActions: ['tap'],
          successThreshold: 80,
        },
        difficulty_scaling: {
          speed: 1.0,
          complexity: 1,
          lives: 3,
        },
        createdAt: Date.now(),
      },
      {
        gameTypeId: 'rhythm_match',
        name: 'Rhythm Match',
        description: 'Match the beat sequence',
        difficulty: 'medium',
        duration: 45,
        baseReward: 75,
        xpReward: 150,
        mechanics: {
          type: 'rhythm',
          prompt: 'Follow the rhythm!',
          validActions: ['tap', 'hold'],
          successThreshold: 85,
        },
        difficulty_scaling: {
          speed: 1.2,
          complexity: 2,
          lives: 3,
        },
        createdAt: Date.now(),
      },
      {
        gameTypeId: 'deck_duel',
        name: 'Deck Duel',
        description: 'Build the best card hand',
        difficulty: 'hard',
        duration: 60,
        baseReward: 100,
        xpReward: 200,
        mechanics: {
          type: 'strategy',
          prompt: 'Choose your cards wisely',
          validActions: ['button_click'],
          successThreshold: 75,
        },
        difficulty_scaling: {
          speed: 1.5,
          complexity: 3,
          lives: 2,
        },
        createdAt: Date.now(),
      },
      {
        gameTypeId: 'tournament',
        name: 'Tournament Mode',
        description: 'Compete in a 3-round tournament',
        difficulty: 'expert',
        duration: 180,
        baseReward: 200,
        xpReward: 500,
        mechanics: {
          type: 'strategy',
          prompt: 'Win 3 rounds to claim victory',
          validActions: ['button_click', 'tap'],
          successThreshold: 90,
        },
        difficulty_scaling: {
          speed: 2.0,
          complexity: 4,
          lives: 1,
        },
        createdAt: Date.now(),
      },
    ];

    games.forEach(game => this.miniGames.set(game.gameTypeId, game));
  }

  private initializeAchievements(): void {
    const achievements: FrameAchievement[] = [
      {
        achievementId: 'first_win',
        name: 'First Victory',
        description: 'Win your first mini-match',
        icon: '🏆',
        condition: { type: 'game_count', value: 1 },
        reward: { coins: 100, xp: 50, badge: 'novice' },
        rarity: 'common',
        createdAt: Date.now(),
      },
      {
        achievementId: 'perfect_score',
        name: 'Perfect Score',
        description: 'Get a perfect combo in Quick Tap',
        icon: '⭐',
        condition: { type: 'score_threshold', value: 1000, gameType: 'quick_tap' },
        reward: { coins: 250, xp: 200, badge: 'perfect' },
        rarity: 'rare',
        createdAt: Date.now(),
      },
      {
        achievementId: 'win_streak_5',
        name: 'On Fire',
        description: 'Win 5 games in a row',
        icon: '🔥',
        condition: { type: 'streak', value: 5 },
        reward: { coins: 500, xp: 500, badge: 'on_fire' },
        rarity: 'epic',
        createdAt: Date.now(),
      },
      {
        achievementId: 'combo_master',
        name: 'Combo Master',
        description: 'Reach a 50x combo multiplier',
        icon: '⚡',
        condition: { type: 'combo', value: 50 },
        reward: { coins: 1000, xp: 1000, badge: 'combo_master' },
        rarity: 'legendary',
        createdAt: Date.now(),
      },
    ];

    achievements.forEach(ach => this.achievements.set(ach.achievementId, ach));
  }

  /**
   * Game Session Management
   */
  createGameSession(
    playerId: string,
    playerName: string,
    gameType: 'quick_tap' | 'rhythm_match' | 'deck_duel' | 'tournament',
    difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  ): FrameGameState {
    const game: FrameGameState = {
      gameId: `game_${playerId}_${Date.now()}`,
      playerId,
      playerName,
      gameType,
      difficulty,
      status: 'setup',
      startTime: Date.now(),
      duration: this.miniGames.get(gameType)?.duration || 30,
      score: 0,
      lives: 3,
      combo: 0,
      multiplier: 1.0,
      timestamp: Date.now(),
    };

    this.games.set(game.gameId, game);
    this.saveToStorage();

    return game;
  }

  startGame(gameId: string): FrameGameState | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    game.status = 'active';
    game.startTime = Date.now();
    this.saveToStorage();

    return game;
  }

  recordAction(
    gameId: string,
    playerId: string,
    action: FrameAction['action'],
    value?: number,
    accuracy: number = 100
  ): FrameAction | null {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'active') return null;

    // Calculate points based on accuracy and combo
    const basePoints = Math.floor(10 * accuracy / 100);
    const comboBonus = game.combo * 2;
    const multiplierBonus = Math.floor(basePoints * (game.multiplier - 1));
    const points = basePoints + comboBonus + multiplierBonus;

    const frameAction: FrameAction = {
      actionId: `action_${gameId}_${Date.now()}`,
      gameId,
      playerId,
      action,
      value,
      timestamp: Date.now(),
      responseTime: Date.now() - game.startTime,
      accuracy,
      points,
      comboIncrement: accuracy > 80 ? 1 : accuracy > 60 ? 0 : -1,
    };

    this.actions.set(frameAction.actionId, frameAction);

    // Update game state
    game.score += points;
    game.combo = Math.max(0, game.combo + frameAction.comboIncrement);
    game.multiplier = Math.min(10, 1.0 + game.combo * 0.1); // Cap at 10x

    // Check for failure
    if (accuracy < 50) {
      game.lives--;
      if (game.lives <= 0) {
        this.endGame(gameId, 'loss');
      }
    }

    this.saveToStorage();
    return frameAction;
  }

  endGame(
    gameId: string,
    result: 'win' | 'loss' | 'tie' | 'abandoned'
  ): FrameGameState | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    game.status = 'completed';
    game.endTime = Date.now();
    game.result = result;
    game.finalScore = game.score;

    // Calculate rewards
    const miniGame = this.miniGames.get(game.gameType);
    if (miniGame && result === 'win') {
      const multiplier = game.multiplier / 1.0; // normalize
      game.reward = {
        coins: Math.floor(miniGame.baseReward * multiplier),
        xp: Math.floor(miniGame.xpReward * multiplier),
      };
    }

    // Update player stats
    this.updatePlayerStats(game.playerId, game);

    // Check achievements
    this.checkAchievements(game.playerId);

    this.saveToStorage();
    return game;
  }

  /**
   * Player Statistics
   */
  private updatePlayerStats(playerId: string, game: FrameGameState): void {
    let stats = this.playerStats.get(playerId);

    if (!stats) {
      stats = {
        statsId: `stats_${playerId}`,
        playerId,
        playerName: game.playerName,
        totalGamesPlayed: 0,
        totalScore: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
        currentStreak: 0,
        bestStreak: 0,
        highestScore: 0,
        averageScore: 0,
        coinsEarned: 0,
        xpEarned: 0,
        achievements: [],
        badges: [],
        snapshot: Date.now(),
      };
    }

    stats.totalGamesPlayed++;
    stats.totalScore += game.score;

    if (game.result === 'win') {
      stats.winCount++;
      stats.currentStreak++;
      stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
      if (game.reward) {
        stats.coinsEarned += game.reward.coins;
        stats.xpEarned += game.reward.xp;
      }
    } else if (game.result === 'loss') {
      stats.lossCount++;
      stats.currentStreak = 0;
    }

    stats.winRate = (stats.winCount / stats.totalGamesPlayed) * 100;
    stats.averageScore = stats.totalScore / stats.totalGamesPlayed;
    stats.highestScore = Math.max(stats.highestScore, game.finalScore || 0);
    stats.lastGameTime = Date.now();
    stats.snapshot = Date.now();

    this.playerStats.set(playerId, stats);
  }

  getPlayerStats(playerId: string): PlayerFrameStats | null {
    return this.playerStats.get(playerId) || null;
  }

  /**
   * Achievements
   */
  private checkAchievements(playerId: string): void {
    const stats = this.playerStats.get(playerId);
    if (!stats) return;

    this.achievements.forEach((ach) => {
      if (stats.achievements.includes(ach.achievementId)) return; // Already earned

      let earned = false;

      switch (ach.condition.type) {
        case 'game_count':
          earned = stats.totalGamesPlayed >= ach.condition.value;
          break;
        case 'score_threshold':
          earned = stats.highestScore >= ach.condition.value;
          break;
        case 'streak':
          earned = stats.bestStreak >= ach.condition.value;
          break;
        case 'combo':
          // Would need to track max combo in game state
          break;
      }

      if (earned) {
        stats.achievements.push(ach.achievementId);
        stats.badges.push(ach.reward.badge);
        stats.coinsEarned += ach.reward.coins;
        stats.xpEarned += ach.reward.xp;
      }
    });
  }

  getAchievement(achievementId: string): FrameAchievement | null {
    return this.achievements.get(achievementId) || null;
  }

  /**
   * Leaderboards
   */
  updateLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'alltime'): FrameLeaderboard {
    const allStats = Array.from(this.playerStats.values());

    // Sort by score
    const sorted = allStats.sort((a, b) => b.totalScore - a.totalScore);

    const leaderboard: FrameLeaderboard = {
      leaderboardId: `lb_${period}_${Date.now()}`,
      period,
      gameType: 'all',
      entries: sorted.slice(0, 100).map((stats, idx) => ({
        rank: idx + 1,
        playerId: stats.playerId,
        playerName: stats.playerName,
        score: stats.totalScore,
        gamesPlayed: stats.totalGamesPlayed,
        timestamp: stats.snapshot,
      })),
      snapshot: Date.now(),
    };

    this.leaderboards.set(`${period}_all`, leaderboard);
    this.saveToStorage();

    return leaderboard;
  }

  getLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'alltime', gameType: string = 'all'): FrameLeaderboard | null {
    return this.leaderboards.get(`${period}_${gameType}`) || null;
  }

  /**
   * Frame Methods
   */
  generateFrameMetadata(gameId: string): {
    title: string;
    description: string;
    image: string;
    buttons: Array<{ label: string; action: string }>;
  } {
    const game = this.games.get(gameId);
    if (!game) {
      return {
        title: 'Game Not Found',
        description: '',
        image: `${this.FRAME_HOST}/images/error.png`,
        buttons: [],
      };
    }

    if (game.status === 'active') {
      return {
        title: `🎮 Playing: ${game.playerName}`,
        description: `Score: ${game.score} | Lives: ${game.lives} | Combo: ${game.combo}x`,
        image: `${this.FRAME_HOST}/images/gameplay.png?gameId=${gameId}`,
        buttons: [
          { label: '↓ Tap Here', action: 'tap' },
          { label: '⏸ Pause', action: 'pause' },
        ],
      };
    } else if (game.status === 'completed') {
      return {
        title: `🎯 Game Over - ${game.result?.toUpperCase()}`,
        description: `Final Score: ${game.finalScore} | Earned: ${game.reward?.coins}💰`,
        image: `${this.FRAME_HOST}/images/result.png?gameId=${gameId}`,
        buttons: [
          { label: '🔄 Play Again', action: 'new_game' },
          { label: '🏆 Leaderboard', action: 'leaderboard' },
        ],
      };
    }

    return {
      title: 'Ready to Play?',
      description: 'Press the button to start',
      image: `${this.FRAME_HOST}/images/ready.png?gameType=${game.gameType}`,
      buttons: [{ label: '▶ Start Game', action: 'start' }],
    };
  }

  /**
   * Session Management
   */
  createSession(playerId: string, farcasterToken: string): FrameSession {
    const session: FrameSession = {
      sessionId: `session_${playerId}_${Date.now()}`,
      playerId,
      farcasterToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.SESSION_EXPIRY,
      lastActivity: Date.now(),
      gamesPlayed: [],
      totalCoinsEarned: 0,
      valid: true,
    };

    this.sessions.set(session.sessionId, session);
    this.saveToStorage();

    return session;
  }

  validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (Date.now() > session.expiresAt) {
      session.valid = false;
      return false;
    }

    session.lastActivity = Date.now();
    return session.valid;
  }

  /**
   * Storage
   */
  private saveToStorage(): void {
    try {
      const data = {
        games: Array.from(this.games.entries()),
        actions: Array.from(this.actions.entries()),
        miniGames: Array.from(this.miniGames.entries()),
        leaderboards: Array.from(this.leaderboards.entries()),
        achievements: Array.from(this.achievements.entries()),
        playerStats: Array.from(this.playerStats.entries()),
        sessions: Array.from(this.sessions.entries()),
      };
      localStorage['farcaster_frame_provider'] = JSON.stringify(data);
    } catch (error) {
      console.error('Failed to save farcaster frame provider:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage['farcaster_frame_provider'] || '{}');
      if (data.games) this.games = new Map(data.games);
      if (data.actions) this.actions = new Map(data.actions);
      if (data.miniGames) this.miniGames = new Map(data.miniGames);
      if (data.leaderboards) this.leaderboards = new Map(data.leaderboards);
      if (data.achievements) this.achievements = new Map(data.achievements);
      if (data.playerStats) this.playerStats = new Map(data.playerStats);
      if (data.sessions) this.sessions = new Map(data.sessions);
    } catch (error) {
      console.error('Failed to load farcaster frame provider:', error);
    }
  }
}

export type {
  FrameGameState,
  FrameAction,
  MiniGame,
  FrameLeaderboard,
  FrameAchievement,
  PlayerFrameStats,
  FrameSession,
};
