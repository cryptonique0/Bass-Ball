// Match validation and fairness analysis system
// Integrated with Phase 7 NFT Bridge Support

import {
  createWormholeNFTBridgeRequest,
  createStargateNFTBridgeRequest,
  isNFTEligibleForBridging,
  getBestBridgeForNFT,
  createBassBallNFT,
  getWormholeBridgeStatus,
  getStargateBridgeStatus,
} from '../../lib/web3/nft-bridge';

/**
 * BASE Chain Network Configuration
 * Support for both mainnet and testnet
 */
export enum BaseNetwork {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
}

export interface BaseNetworkConfig {
  chainId: number;
  rpcUrl: string;
  blockExplorerUrl: string;
  network: BaseNetwork;
  name: string;
}

export const BASE_NETWORKS: Record<BaseNetwork, BaseNetworkConfig> = {
  [BaseNetwork.MAINNET]: {
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    blockExplorerUrl: 'https://basescan.org',
    network: BaseNetwork.MAINNET,
    name: 'BASE Mainnet',
  },
  [BaseNetwork.TESTNET]: {
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    blockExplorerUrl: 'https://sepolia.basescan.org',
    network: BaseNetwork.TESTNET,
    name: 'BASE Sepolia Testnet',
  },
};

export interface GuestMatch {
  matchId: string;
  timestamp: number;
  duration: number; // Minutes
  homeTeam: string;
  homeScore: number;
  awayTeam: string;
  awayScore: number;
  playerTeam: 'home' | 'away';
  playerGoals: number;
  playerAssists: number;
  result: 'win' | 'loss' | 'draw';
  inputs: Array<{
    tick: number;
    timestamp: number;
    action: string;
    [key: string]: any;
  }>;
}

export interface ValidationIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold?: number;
  actual?: number;
}

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
  timestamp: number;
  checksSummary: {
    reasonableness: boolean;
    consistency: boolean;
    anomaly: boolean;
    comparison: boolean;
    tickBased: boolean;
  };
}

/**
 * Phase 7: NFT Bridge Integration
 * NFT rewards and cross-chain transfer support for match results
 */
export enum NFTRewardType {
  ACHIEVEMENT = 'achievement',
  COSMETIC = 'cosmetic',
  PLAYER_STATS = 'player-stats',
  LIMITED_EDITION = 'limited-edition',
}

export interface NFTRewardEarned {
  nftId: string;
  type: NFTRewardType;
  metadata: {
    name: string;
    description: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    value: string; // In ETH
    achievement?: string;
  };
  earnedAt: number;
  chainId: number; // Chain where NFT was minted
  contractAddress: string;
  eligible: boolean; // Can be bridged cross-chain
}

export interface MatchNFTRewards {
  matchId: string;
  playerId: string;
  rewards: NFTRewardEarned[];
  totalValue: string; // In ETH
  claimedAt?: number;
  bridgeInfo?: {
    protocol: 'wormhole' | 'stargate';
    destChainId: number;
    txHash?: string;
    status: 'pending' | 'confirmed' | 'completed' | 'failed';
    bridgedAt?: number;
  };
}

export interface MatchBridgeTransaction {
  txHash: string;
  nftId: string;
  fromChain: number;
  toChain: number;
  protocol: 'wormhole' | 'stargate';
  status: 'pending' | 'confirmed' | 'finalized' | 'completed' | 'failed';
  progress: number; // 0-100
  estimatedCompletion?: number;
  fee: string;
  timestamp: number;
}

/**
 * Tick-based rate limiting rules
 * Prevents automated input spam and cheating
 */
interface TickBucket {
  inputs: number; // Count of inputs in this tick window
  maxAllowed: number; // Maximum inputs allowed
}

export class MatchValidator {
  private static currentNetwork: BaseNetwork = BaseNetwork.MAINNET;

  /**
   * Set the active BASE network (mainnet or testnet)
   */
  static setNetwork(network: BaseNetwork): void {
    this.currentNetwork = network;
  }

  /**
   * Get the current active network configuration
   */
  static getNetwork(): BaseNetworkConfig {
    return BASE_NETWORKS[this.currentNetwork];
  }

  /**
   * Get network configuration by network type
   */
  static getNetworkConfig(network: BaseNetwork): BaseNetworkConfig {
    return BASE_NETWORKS[network];
  }

  /**
   * Check if running on mainnet
   */
  static isMainnet(): boolean {
    return this.currentNetwork === BaseNetwork.MAINNET;
  }

  /**
   * Check if running on testnet
   */
  static isTestnet(): boolean {
    return this.currentNetwork === BaseNetwork.TESTNET;
  }

  /**
   * Validate tick-based input rate limiting
   * Enforces max 5 inputs per 12-tick window (60Hz / 5 = 12 ticks per second)
   */
  static validateTickBasedRates(inputs: any[]): { valid: boolean; issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = [];
    const tickBuckets = new Map<number, number>(); // tickBucket -> input count
    const tickBucketSize = 12; // 12 ticks = 200ms at 60Hz
    const maxInputsPerBucket = 5;

    for (const input of inputs) {
      const bucket = Math.floor(input.tick / tickBucketSize);
      const count = (tickBuckets.get(bucket) || 0) + 1;
      tickBuckets.set(bucket, count);

      if (count > maxInputsPerBucket) {
        issues.push({
          type: 'TICK_RATE_LIMIT_VIOLATED',
          severity: 'high',
          message: `Tick bucket ${bucket}: ${count} inputs (max ${maxInputsPerBucket})`,
          threshold: maxInputsPerBucket,
          actual: count,
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Validate tick monotonicity
   * Ensures ticks always increase, never decrease
   */
  static validateTickMonotonicity(inputs: any[]): { valid: boolean; issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = [];
    let lastTick = -1;

    for (const input of inputs) {
      if (input.tick <= lastTick) {
        issues.push({
          type: 'TICK_NOT_MONOTONIC',
          severity: 'critical',
          message: `Tick ${input.tick} is not greater than previous tick ${lastTick}`,
        });
      }
      lastTick = input.tick;
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Validate input timestamp ordering
   * Ensures timestamps are monotonically increasing and reasonable
   */
  static validateTimestampOrdering(inputs: any[]): { valid: boolean; issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = [];
    let lastTimestamp = 0;
    const now = Date.now();

    for (const input of inputs) {
      // Check monotonicity
      if (input.timestamp <= lastTimestamp) {
        issues.push({
          type: 'TIMESTAMP_NOT_MONOTONIC',
          severity: 'high',
          message: `Timestamp ${input.timestamp} is not greater than previous ${lastTimestamp}`,
        });
      }

      // Check if timestamp is in reasonable range (within match duration)
      if (input.timestamp < now - 1900000) {
        // More than 30min ago
        issues.push({
          type: 'TIMESTAMP_ANOMALY',
          severity: 'medium',
          message: `Input timestamp is suspiciously old`,
        });
      }

      lastTimestamp = input.timestamp;
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Validate a single match for suspicious patterns
   */
  static validateMatch(
    match: GuestMatch,
    playerStats?: any,
    matchHistory?: GuestMatch[]
  ): ValidationResult {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const checks = {
      reasonableness: true,
      consistency: true,
      anomaly: true,
      comparison: true,
      tickBased: true,
    };

    // Check 1: Tick-based rate limiting
    const tickRateCheck = this.validateTickBasedRates(match.inputs);
    if (!tickRateCheck.valid) {
      tickRateCheck.issues.forEach(issue => {
        if (issue.severity === 'critical' || issue.severity === 'high') {
          issues.push(issue);
        } else {
          warnings.push(issue);
        }
      });
      checks.tickBased = false;
    }

    // Check 2: Tick monotonicity
    const tickMonotonicCheck = this.validateTickMonotonicity(match.inputs);
    if (!tickMonotonicCheck.valid) {
      tickMonotonicCheck.issues.forEach(issue => issues.push(issue));
      checks.tickBased = false;
    }

    // Check 3: Timestamp ordering
    const timestampCheck = this.validateTimestampOrdering(match.inputs);
    if (!timestampCheck.valid) {
      timestampCheck.issues.forEach(issue => {
        if (issue.severity === 'critical' || issue.severity === 'high') {
          issues.push(issue);
        } else {
          warnings.push(issue);
        }
      });
    }

    // Check 4: Reasonableness (are the stats plausible?)
    const reasonCheck = this.checkReasonableness(match);
    if (!reasonCheck.valid) {
      reasonCheck.issues.forEach(issue => {
        if (issue.severity === 'critical' || issue.severity === 'high') {
          issues.push(issue);
        } else {
          warnings.push(issue);
        }
      });
      checks.reasonableness = false;
    }

    // Check 5: Consistency (do stats match game duration?)
    const consistencyCheck = this.checkConsistency(match);
    if (!consistencyCheck.valid) {
      consistencyCheck.issues.forEach(issue => {
        if (issue.severity === 'critical' || issue.severity === 'high') {
          issues.push(issue);
        } else {
          warnings.push(issue);
        }
      });
      checks.consistency = false;
    }

    // Check 6: Anomaly detection (is this player's performance unusual?)
    if (matchHistory && matchHistory.length > 0) {
      const anomalyCheck = this.checkAnomalies(match, matchHistory);
      if (anomalyCheck.detected) {
        anomalyCheck.issues.forEach(issue => {
          if (issue.severity === 'critical' || issue.severity === 'high') {
            issues.push(issue);
          } else {
            warnings.push(issue);
          }
        });
        checks.anomaly = false;
      }
    }

    // Check 7: Comparative analysis (vs player's average)
    if (matchHistory && matchHistory.length >= 5) {
      const comparisonCheck = this.checkComparison(match, matchHistory);
      if (!comparisonCheck.valid) {
        comparisonCheck.issues.forEach(issue => {
          warnings.push(issue);
        });
        checks.comparison = false;
      }
    }

    // Calculate score
    const score = this.calculateScore(issues, warnings);

    return {
      isValid: issues.length === 0,
      score,
      issues,
      warnings,
      timestamp: Date.now(),
      checksSummary: checks,
    };
  }

  /**
   * Check if match stats are reasonably achievable in real gameplay
   */
  private static checkReasonableness(match: GuestMatch): {
    valid: boolean;
    issues: ValidationIssue[];
  } {
    const issues: ValidationIssue[] = [];

    // Duration must be between 45-120 minutes (typical football match)
    if (match.duration < 45 || match.duration > 120) {
      issues.push({
        type: 'unrealistic_duration',
        severity: match.duration < 30 || match.duration > 150 ? 'high' : 'low',
        message: `Match duration ${match.duration}' is unusual. Typical: 45-120 minutes.`,
        threshold: 90,
        actual: match.duration,
      });
    }

    // Goals should be reasonable for match duration
    const maxGoalsPerHalf = Math.ceil(match.duration / 45) * 3; // ~3 goals per 45 min
    const totalTeamGoals = match.homeScore + match.awayScore;
    if (totalTeamGoals > maxGoalsPerHalf) {
      issues.push({
        type: 'excessive_goals',
        severity: totalTeamGoals > maxGoalsPerHalf * 2 ? 'high' : 'medium',
        message: `Total goals ${totalTeamGoals} seems high for ${match.duration}' match.`,
        threshold: maxGoalsPerHalf,
        actual: totalTeamGoals,
      });
    }

    // Player contribution shouldn't exceed team score
    const teamScore = match.playerTeam === 'home' ? match.homeScore : match.awayScore;
    if (match.playerGoals > teamScore) {
      issues.push({
        type: 'impossible_contribution',
        severity: 'critical',
        message: `Player goals (${match.playerGoals}) exceed team score (${teamScore}).`,
      });
    }

    // Assists shouldn't be excessive
    if (match.playerAssists > 10) {
      issues.push({
        type: 'excessive_assists',
        severity: match.playerAssists > 15 ? 'high' : 'medium',
        message: `${match.playerAssists} assists seems unrealistic for a ${match.duration}' match.`,
        threshold: 8,
        actual: match.playerAssists,
      });
    }

    // Ratio check: assists to goals
    if (match.playerGoals === 0 && match.playerAssists > 5) {
      issues.push({
        type: 'unlikely_assists_no_goals',
        severity: 'medium',
        message: `${match.playerAssists} assists with 0 goals is statistically unlikely.`,
      });
    }

    return {
      valid: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      issues,
    };
  }

  /**
   * Check if stats are consistent with match duration and team performance
   */
  private static checkConsistency(match: GuestMatch): {
    valid: boolean;
    issues: ValidationIssue[];
  } {
    const issues: ValidationIssue[] = [];

    // Goals per team per minute
    const homeGoalsPerMin = match.homeScore / Math.max(match.duration, 1);
    const awayGoalsPerMin = match.awayScore / Math.max(match.duration, 1);

    // Flag if one team scores 1+ goals per minute (unrealistic)
    if (homeGoalsPerMin > 0.5) {
      issues.push({
        type: 'unrealistic_scoring_pace',
        severity: 'high',
        message: `Home team scoring pace (${homeGoalsPerMin.toFixed(2)}/min) is unrealistic.`,
      });
    }
    if (awayGoalsPerMin > 0.5) {
      issues.push({
        type: 'unrealistic_scoring_pace',
        severity: 'high',
        message: `Away team scoring pace (${awayGoalsPerMin.toFixed(2)}/min) is unrealistic.`,
      });
    }

    // Player stats consistency
    const playerTeamScore = match.playerTeam === 'home' ? match.homeScore : match.awayScore;
    const playerContribution = match.playerGoals + match.playerAssists;
    const contributionRatio = playerContribution / Math.max(playerTeamScore, 1);

    // Player should contribute ~30-60% of team goals (not 0%, not 100%)
    if (playerTeamScore > 0) {
      if (contributionRatio > 0.9) {
        issues.push({
          type: 'excessive_player_contribution',
          severity: 'medium',
          message: `Player contributed ${(contributionRatio * 100).toFixed(0)}% of team's goals.`,
          threshold: 60,
          actual: Math.round(contributionRatio * 100),
        });
      }
      if (playerContribution === 0 && playerTeamScore > 2) {
        issues.push({
          type: 'unlikely_no_contribution',
          severity: 'low',
          message: `No goals/assists in a ${playerTeamScore}-goal team victory is unlikely but possible.`,
        });
      }
    }

    return {
      valid: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      issues,
    };
  }

  /**
   * Detect anomalies compared to player's match history
   */
  private static checkAnomalies(
    match: GuestMatch,
    matchHistory: GuestMatch[]
  ): {
    detected: boolean;
    issues: ValidationIssue[];
  } {
    const issues: ValidationIssue[] = [];

    if (matchHistory.length === 0) {
      return { detected: false, issues: [] };
    }

    // Calculate averages from recent 10 matches
    const recentMatches = matchHistory.slice(0, 10);
    const avgGoals =
      recentMatches.reduce((s, m) => s + m.playerGoals, 0) / recentMatches.length;
    const avgAssists =
      recentMatches.reduce((s, m) => s + m.playerAssists, 0) / recentMatches.length;
    const avgDuration =
      recentMatches.reduce((s, m) => s + m.duration, 0) / recentMatches.length;

    // Standard deviation for goals
    const goalVariance =
      recentMatches.reduce((s, m) => s + Math.pow(m.playerGoals - avgGoals, 2), 0) /
      recentMatches.length;
    const goalStdDev = Math.sqrt(goalVariance);

    // Flag if current match is 3+ standard deviations from average
    const goalsZScore = (match.playerGoals - avgGoals) / Math.max(goalStdDev, 0.1);
    if (Math.abs(goalsZScore) > 3) {
      issues.push({
        type: 'anomalous_goal_performance',
        severity: goalsZScore > 4 ? 'high' : 'medium',
        message: `Current match (${match.playerGoals} goals) is ${Math.abs(goalsZScore).toFixed(1)}σ from player average (${avgGoals.toFixed(1)}).`,
        threshold: Math.round(avgGoals + 3 * goalStdDev),
        actual: match.playerGoals,
      });
    }

    // Same for assists
    const assistVariance =
      recentMatches.reduce((s, m) => s + Math.pow(m.playerAssists - avgAssists, 2), 0) /
      recentMatches.length;
    const assistStdDev = Math.sqrt(assistVariance);
    const assistsZScore = (match.playerAssists - avgAssists) / Math.max(assistStdDev, 0.1);

    if (Math.abs(assistsZScore) > 3) {
      issues.push({
        type: 'anomalous_assist_performance',
        severity: assistsZScore > 4 ? 'high' : 'medium',
        message: `Current match (${match.playerAssists} assists) is ${Math.abs(assistsZScore).toFixed(1)}σ from player average (${avgAssists.toFixed(1)}).`,
        threshold: Math.round(avgAssists + 3 * assistStdDev),
        actual: match.playerAssists,
      });
    }

    // Duration anomaly
    if (
      Math.abs(match.duration - avgDuration) >
      avgDuration * 0.5
    ) {
      issues.push({
        type: 'anomalous_duration',
        severity: 'low',
        message: `Match duration ${match.duration}' differs significantly from average ${avgDuration.toFixed(0)}'.`,
      });
    }

    return {
      detected: issues.length > 0,
      issues,
    };
  }

  /**
   * Compare player's performance across matches for trends
   */
  private static checkComparison(
    match: GuestMatch,
    matchHistory: GuestMatch[]
  ): {
    valid: boolean;
    issues: ValidationIssue[];
  } {
    const issues: ValidationIssue[] = [];

    if (matchHistory.length < 5) {
      return { valid: true, issues: [] };
    }

    const allMatches = [match, ...matchHistory];
    const recent5 = allMatches.slice(0, 5);
    const earlier5 = allMatches.slice(5, 10);

    if (earlier5.length < 5) {
      return { valid: true, issues: [] };
    }

    // Calculate recent vs earlier averages
    const recentAvgGoals = recent5.reduce((s, m) => s + m.playerGoals, 0) / 5;
    const earlierAvgGoals = earlier5.reduce((s, m) => s + m.playerGoals, 0) / 5;

    // Flag if there's sudden jump in performance
    const goalImprovement = recentAvgGoals - earlierAvgGoals;
    if (goalImprovement > 3) {
      issues.push({
        type: 'sudden_performance_spike',
        severity: 'medium',
        message: `Recent performance (${recentAvgGoals.toFixed(1)} goals avg) up ${goalImprovement.toFixed(1)} from earlier (${earlierAvgGoals.toFixed(1)}).`,
      });
    }

    // Check for win rate spike (unlikely to have 5+ wins in a row with random opponents)
    const recentWins = recent5.filter(m => m.result === 'win').length;
    const earlierWins = earlier5.filter(m => m.result === 'win').length;

    if (recentWins >= 4 && earlierWins <= 2) {
      issues.push({
        type: 'unusual_win_streak',
        severity: 'low',
        message: `Recent win streak (4/5) contrasts with earlier (${earlierWins}/5). Could indicate skill improvement or luck.`,
      });
    }

    return {
      valid: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      issues,
    };
  }

  /**
   * Calculate overall validation score (0-100)
   */
  private static calculateScore(
    issues: ValidationIssue[],
    warnings: ValidationIssue[]
  ): number {
    let score = 100;

    // Deduct for each issue based on severity
    issues.forEach(issue => {
      if (issue.severity === 'critical') {
        score -= 25;
      } else if (issue.severity === 'high') {
        score -= 15;
      } else if (issue.severity === 'medium') {
        score -= 8;
      } else {
        score -= 3;
      }
    });

    // Deduct less for warnings
    warnings.forEach(warning => {
      if (warning.severity === 'high') {
        score -= 5;
      } else if (warning.severity === 'medium') {
        score -= 3;
      } else {
        score -= 1;
      }
    });

    return Math.max(0, score);
  }

  /**
   * Determine if match is suspicious enough to flag
   */
  static isSuspicious(validation: ValidationResult): boolean {
    return (
      validation.score < 70 ||
      validation.issues.filter(i => i.severity === 'critical').length > 0 ||
      validation.issues.filter(i => i.severity === 'high').length > 1
    );
  }

  /**
   * Generate human-readable validation report
   */
  static generateReport(validation: ValidationResult): string {
    const lines: string[] = [];

    lines.push(`VALIDATION REPORT`);
    lines.push(`==================`);
    lines.push(`Score: ${validation.score}/100`);
    lines.push(`Status: ${validation.isValid ? 'VALID' : 'INVALID'}`);
    lines.push(`Timestamp: ${new Date(validation.timestamp).toISOString()}`);
    lines.push(``);

    if (validation.issues.length > 0) {
      lines.push(`CRITICAL ISSUES (${validation.issues.length}):`);
      validation.issues.forEach(issue => {
        lines.push(`  [${issue.severity.toUpperCase()}] ${issue.type}`);
        lines.push(`  ${issue.message}`);
        if (issue.threshold !== undefined && issue.actual !== undefined) {
          lines.push(`  Expected ≤ ${issue.threshold}, Got ${issue.actual}`);
        }
        lines.push(``);
      });
    }

    if (validation.warnings.length > 0) {
      lines.push(`WARNINGS (${validation.warnings.length}):`);
      validation.warnings.forEach(warning => {
        lines.push(`  [${warning.severity.toUpperCase()}] ${warning.type}`);
        lines.push(`  ${warning.message}`);
        lines.push(``);
      });
    }

    lines.push(`CHECKS SUMMARY:`);
    lines.push(
      `  Reasonableness: ${validation.checksSummary.reasonableness ? '✓' : '✗'}`
    );
    lines.push(
      `  Consistency: ${validation.checksSummary.consistency ? '✓' : '✗'}`
    );
    lines.push(`  Anomaly Detection: ${validation.checksSummary.anomaly ? '✓' : '✗'}`);
    lines.push(
      `  Comparative Analysis: ${validation.checksSummary.comparison ? '✓' : '✗'}`
    );

    return lines.join('\n');
  }

  /**
   * Phase 7 Integration: Generate NFT rewards for match results
   * Creates achievement/cosmetic/stat NFTs based on match performance
   */
  static generateNFTRewards(
    match: GuestMatch,
    playerId: string,
    chainId: number = 8453 // Default to Base
  ): NFTRewardEarned[] {
    const rewards: NFTRewardEarned[] = [];

    // Achievement NFT for winning
    if (match.result === 'win') {
      const victorNFT = createBassBallNFT(
        'achievement',
        playerId,
        1,
        {
          name: 'Victory',
          description: `Won match against ${match.awayTeam}`,
          matchId: match.matchId,
          score: `${match.homeScore}-${match.awayScore}`,
          date: new Date(match.timestamp).toISOString(),
        },
        BigInt('500000000000000000') // 0.5 ETH
      );

      rewards.push({
        nftId: victorNFT.id,
        type: NFTRewardType.ACHIEVEMENT,
        metadata: {
          name: 'Victory',
          description: `Won match against ${match.awayTeam}`,
          rarity: 'common',
          value: '0.5',
        },
        earnedAt: Date.now(),
        chainId,
        contractAddress: '0x2222222222222222222222222222222222222221',
        eligible: true,
      });
    }

    // Player Stats NFT for high performance (3+ goals or 2+ assists)
    if (match.playerGoals >= 3 || match.playerAssists >= 2) {
      const statsNFT = createBassBallNFT(
        'player-stats',
        playerId,
        1,
        {
          name: `Match Stats - ${match.playerGoals}G ${match.playerAssists}A`,
          description: 'Exceptional match performance',
          goals: match.playerGoals,
          assists: match.playerAssists,
          matchId: match.matchId,
        },
        BigInt('1000000000000000000') // 1 ETH
      );

      rewards.push({
        nftId: statsNFT.id,
        type: NFTRewardType.PLAYER_STATS,
        metadata: {
          name: `Match Stats - ${match.playerGoals}G ${match.playerAssists}A`,
          description: 'Exceptional match performance',
          rarity: 'rare',
          value: '1.0',
        },
        earnedAt: Date.now(),
        chainId,
        contractAddress: '0x1111111111111111111111111111111111111111',
        eligible: true,
      });
    }

    // Cosmetic NFT for perfect match (clean sheet or all goals)
    if (match.playerGoals >= 5 || (match.result === 'win' && match.awayScore === 0)) {
      const cosmeticNFT = createBassBallNFT(
        'cosmetic',
        playerId,
        1,
        {
          name: 'Elite Jersey',
          description: 'Special edition jersey for exceptional play',
          rarity: 'legendary',
        },
        BigInt('2000000000000000000') // 2 ETH
      );

      rewards.push({
        nftId: cosmeticNFT.id,
        type: NFTRewardType.COSMETIC,
        metadata: {
          name: 'Elite Jersey',
          description: 'Special edition jersey for exceptional play',
          rarity: 'legendary',
          value: '2.0',
        },
        earnedAt: Date.now(),
        chainId,
        contractAddress: '0x3333333333333333333333333333333333333331',
        eligible: true,
      });
    }

    return rewards;
  }

  /**
   * Phase 7 Integration: Bridge earned NFTs to another chain
   * Supports both Wormhole (secure) and Stargate (fast) protocols
   */
  static async bridgeNFTReward(
    nft: NFTRewardEarned,
    destChainId: number,
    recipientAddress: string
  ): Promise<MatchBridgeTransaction> {
    // Check if NFT is eligible for bridging
    if (!nft.eligible || !isNFTEligibleForBridging({
      id: nft.nftId,
      chainId: nft.chainId,
      type: nft.type,
      contractAddress: nft.contractAddress,
      tokenId: '1',
      owner: recipientAddress,
      metadata: nft.metadata,
      value: BigInt(Math.floor(parseFloat(nft.metadata.value) * 1e18)),
    })) {
      throw new Error('NFT not eligible for bridging');
    }

    // Determine best bridge protocol based on value
    const nftValue = parseFloat(nft.metadata.value);
    const protocol = getBestBridgeForNFT(
      {
        id: nft.nftId,
        chainId: nft.chainId,
        type: nft.type,
        contractAddress: nft.contractAddress,
        tokenId: '1',
        owner: recipientAddress,
        metadata: nft.metadata,
        value: BigInt(Math.floor(nftValue * 1e18)),
      },
      destChainId
    );

    // Create bridge request based on protocol
    const bridgeRequest = protocol === 'wormhole'
      ? createWormholeNFTBridgeRequest(
          {
            id: nft.nftId,
            chainId: nft.chainId,
            type: nft.type,
            contractAddress: nft.contractAddress,
            tokenId: '1',
            owner: recipientAddress,
            metadata: nft.metadata,
            value: BigInt(Math.floor(nftValue * 1e18)),
          },
          destChainId,
          recipientAddress
        )
      : createStargateNFTBridgeRequest(
          {
            id: nft.nftId,
            chainId: nft.chainId,
            type: nft.type,
            contractAddress: nft.contractAddress,
            tokenId: '1',
            owner: recipientAddress,
            metadata: nft.metadata,
            value: BigInt(Math.floor(nftValue * 1e18)),
          },
          destChainId,
          recipientAddress
        );

    const fee = protocol === 'wormhole' ? '0.25%' : '0.15%';
    const estimatedTime = protocol === 'wormhole' ? 3600000 : 600000; // 60 min vs 10 min

    return {
      txHash: `0x${Math.random().toString(16).slice(2)}`, // Placeholder
      nftId: nft.nftId,
      fromChain: nft.chainId,
      toChain: destChainId,
      protocol,
      status: 'pending',
      progress: 0,
      estimatedCompletion: Date.now() + estimatedTime,
      fee,
      timestamp: Date.now(),
    };
  }

  /**
   * Phase 7 Integration: Monitor bridge transaction progress
   */
  static monitorBridgeProgress(
    bridge: MatchBridgeTransaction
  ): { status: string; progress: number; estimatedTime: number } {
    if (bridge.protocol === 'wormhole') {
      // Simulate Wormhole 13-validator consensus monitoring
      const elapsed = Date.now() - bridge.timestamp;
      const totalTime = 60 * 60 * 1000; // 60 minutes
      const progress = Math.min(100, Math.floor((elapsed / totalTime) * 100));

      return {
        status: progress < 30 ? 'pending' : progress < 70 ? 'confirmed' : 'finalized',
        progress,
        estimatedTime: Math.max(0, totalTime - elapsed),
      };
    } else {
      // Simulate Stargate liquidity pool bridging
      const elapsed = Date.now() - bridge.timestamp;
      const totalTime = 10 * 60 * 1000; // 10 minutes
      const progress = Math.min(100, Math.floor((elapsed / totalTime) * 100));

      return {
        status: progress < 50 ? 'pending' : progress < 100 ? 'confirmed' : 'completed',
        progress,
        estimatedTime: Math.max(0, totalTime - elapsed),
      };
    }
  }

  /**
   * Phase 7 Integration: Calculate total match rewards value
   */
  static calculateTotalRewardValue(rewards: NFTRewardEarned[]): string {
    const total = rewards.reduce((sum, reward) => {
      return sum + parseFloat(reward.metadata.value);
    }, 0);

    return total.toFixed(2);
  }

  /**
   * Phase 7 Integration: Create match reward summary
   */
  static createMatchRewardSummary(
    match: GuestMatch,
    playerId: string,
    chainId: number = 8453
  ): MatchNFTRewards {
    const rewards = this.generateNFTRewards(match, playerId, chainId);
    const totalValue = this.calculateTotalRewardValue(rewards);

    return {
      matchId: match.matchId,
      playerId,
      rewards,
      totalValue,
      claimedAt: Date.now(),
    };
  }
}
