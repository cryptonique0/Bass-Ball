/**
 * Match Validator & Anti-Cheat System
 * Validates match integrity and detects suspicious patterns
 */

import { MatchRecord } from './guestMode';
import { MatchStats } from './matchEngine';

/**
 * Validation result with detailed feedback
 */
export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100, lower is more suspicious
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
  timestamp: number;
}

export interface ValidationIssue {
  code: string;
  severity: 'critical' | 'high' | 'medium';
  message: string;
  data?: any;
}

export interface ValidationWarning {
  code: string;
  message: string;
  recommendation: string;
}

export interface PlayerAnomalyProfile {
  playerId: string;
  avgGoalsPerMatch: number;
  avgAssistsPerMatch: number;
  avgMatchDuration: number;
  totalMatches: number;
  anomalies: AnomalyRecord[];
}

export interface AnomalyRecord {
  matchId: string;
  anomalyType: string;
  severity: number; // 0-100
  details: string;
  timestamp: number;
}

/**
 * Main Anti-Cheat & Validation Manager
 */
export class MatchValidator {
  /**
   * Validate a match record for integrity
   */
  static validateMatch(
    match: MatchRecord,
    matchStats?: MatchStats,
    playerHistory?: MatchRecord[]
  ): ValidationResult {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    let validationScore = 100;

    // Core match data validation
    const scoreIssues = this.validateScores(match);
    issues.push(...scoreIssues.issues);
    warnings.push(...scoreIssues.warnings);
    validationScore -= scoreIssues.penalties;

    // Player performance validation
    const perfIssues = this.validatePlayerPerformance(match);
    issues.push(...perfIssues.issues);
    warnings.push(...perfIssues.warnings);
    validationScore -= perfIssues.penalties;

    // Match timing validation
    const timeIssues = this.validateMatchTiming(match);
    issues.push(...timeIssues.issues);
    warnings.push(...timeIssues.warnings);
    validationScore -= timeIssues.penalties;

    // Physical plausibility validation
    const physicsIssues = this.validatePhysicalPlausibility(match);
    issues.push(...physicsIssues.issues);
    warnings.push(...physicsIssues.warnings);
    validationScore -= physicsIssues.penalties;

    // Anomaly detection against player history
    if (playerHistory && playerHistory.length > 0) {
      const anomalyIssues = this.detectAnomalies(match, playerHistory);
      issues.push(...anomalyIssues.issues);
      warnings.push(...anomalyIssues.warnings);
      validationScore -= anomalyIssues.penalties;
    }

    // Statistical consistency check
    if (matchStats) {
      const statsIssues = this.validateStatisticalConsistency(match, matchStats);
      issues.push(...statsIssues.issues);
      warnings.push(...statsIssues.warnings);
      validationScore -= statsIssues.penalties;
    }

    // Ensure score is between 0-100
    validationScore = Math.max(0, Math.min(100, validationScore));

    return {
      isValid: issues.filter(i => i.severity === 'critical').length === 0,
      score: Math.round(validationScore),
      issues,
      warnings,
      timestamp: Date.now(),
    };
  }

  /**
   * Validate match scores for logical consistency
   */
  private static validateScores(match: MatchRecord): {
    issues: ValidationIssue[];
    warnings: ValidationWarning[];
    penalties: number;
  } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    let penalties = 0;

    const { homeScore, awayScore, playerGoals, playerTeam } = match;

    // Score must be non-negative
    if (homeScore < 0 || awayScore < 0) {
      issues.push({
        code: 'NEGATIVE_SCORE',
        severity: 'critical',
        message: 'Match contains negative scores, which is impossible',
        data: { homeScore, awayScore },
      });
      penalties += 25;
    }

    // Score must be reasonable (no 100+ goals)
    if (homeScore > 50 || awayScore > 50) {
      issues.push({
        code: 'UNREALISTIC_SCORE',
        severity: 'high',
        message: `Unrealistic score detected: ${homeScore}-${awayScore}`,
        data: { homeScore, awayScore },
      });
      penalties += 15;
    }

    // Player goals must not exceed team score
    if (playerGoals > (playerTeam === 'home' ? homeScore : awayScore)) {
      issues.push({
        code: 'PLAYER_GOALS_EXCEED_TEAM_SCORE',
        severity: 'critical',
        message: `Player goals (${playerGoals}) exceed team score (${playerTeam === 'home' ? homeScore : awayScore})`,
        data: { playerGoals, teamScore: playerTeam === 'home' ? homeScore : awayScore },
      });
      penalties += 25;
    }

    // Score must match reported result
    const teamScore = playerTeam === 'home' ? homeScore : awayScore;
    const opponentScore = playerTeam === 'home' ? awayScore : homeScore;
    const expectedResult = teamScore > opponentScore ? 'win' : teamScore < opponentScore ? 'loss' : 'draw';

    if (match.result !== expectedResult) {
      issues.push({
        code: 'RESULT_MISMATCH',
        severity: 'critical',
        message: `Reported result (${match.result}) doesn't match scores (${teamScore}-${opponentScore})`,
        data: { reported: match.result, calculated: expectedResult },
      });
      penalties += 20;
    }

    return { issues, warnings, penalties };
  }

  /**
   * Validate player performance data
   */
  private static validatePlayerPerformance(match: MatchRecord): {
    issues: ValidationIssue[];
    warnings: ValidationWarning[];
    penalties: number;
  } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    let penalties = 0;

    const { playerGoals, playerAssists } = match;

    // Goals must be non-negative
    if (playerGoals < 0 || playerAssists < 0) {
      issues.push({
        code: 'NEGATIVE_STATS',
        severity: 'critical',
        message: 'Player stats contain negative values',
        data: { playerGoals, playerAssists },
      });
      penalties += 25;
    }

    // Goals/assists should be reasonable for single match
    if (playerGoals > 10) {
      issues.push({
        code: 'EXCESSIVE_GOALS',
        severity: 'high',
        message: `Player scored ${playerGoals} goals in one match (suspicious)`,
        data: { playerGoals },
      });
      penalties += 15;
    }

    if (playerAssists > 8) {
      issues.push({
        code: 'EXCESSIVE_ASSISTS',
        severity: 'high',
        message: `Player had ${playerAssists} assists in one match (suspicious)`,
        data: { playerAssists },
      });
      penalties += 10;
    }

    // Goals + assists sanity check
    const totalContribution = playerGoals + playerAssists;
    if (totalContribution > 15) {
      warnings.push({
        code: 'UNUSUAL_CONTRIBUTION',
        message: `Very high player contribution: ${totalContribution} goals+assists`,
        recommendation: 'Review match replay for accuracy',
      });
      penalties += 5;
    }

    return { issues, warnings, penalties };
  }

  /**
   * Validate match timing and duration
   */
  private static validateMatchTiming(match: MatchRecord): {
    issues: ValidationIssue[];
    warnings: ValidationWarning[];
    penalties: number;
  } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    let penalties = 0;

    const { duration, date } = match;

    // Duration must be reasonable (typically 45-180 minutes)
    if (duration < 0) {
      issues.push({
        code: 'NEGATIVE_DURATION',
        severity: 'critical',
        message: 'Match duration cannot be negative',
        data: { duration },
      });
      penalties += 20;
    }

    if (duration < 20) {
      warnings.push({
        code: 'VERY_SHORT_MATCH',
        message: `Match duration is only ${duration} minutes`,
        recommendation: 'Ensure match was not abandoned or forcefully ended',
      });
      penalties += 5;
    }

    if (duration > 200) {
      warnings.push({
        code: 'VERY_LONG_MATCH',
        message: `Match duration is ${duration} minutes (unusual)`,
        recommendation: 'Verify match includes extended time/overtime',
      });
      penalties += 3;
    }

    // Date should not be in future
    if (date > Date.now()) {
      issues.push({
        code: 'FUTURE_MATCH',
        severity: 'critical',
        message: 'Match date is in the future',
        data: { date, now: Date.now() },
      });
      penalties += 25;
    }

    // Date should not be too old (more than 2 years)
    if (Date.now() - date > 2 * 365 * 24 * 60 * 60 * 1000) {
      warnings.push({
        code: 'VERY_OLD_MATCH',
        message: 'Match is more than 2 years old',
        recommendation: 'Verify match date is accurate',
      });
      penalties += 2;
    }

    return { issues, warnings, penalties };
  }

  /**
   * Validate physical plausibility of match data
   */
  private static validatePhysicalPlausibility(match: MatchRecord): {
    issues: ValidationIssue[];
    warnings: ValidationWarning[];
    penalties: number;
  } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    let penalties = 0;

    const { homeScore, awayScore, duration, playerGoals, playerAssists } = match;

    // Goals per minute ratio check
    const totalGoals = homeScore + awayScore;
    const goalsPerMinute = duration > 0 ? totalGoals / duration : 0;

    // In realistic matches, usually 0.5-2 goals per 90 minutes
    // (0.0056-0.0222 per minute)
    if (goalsPerMinute > 0.1) {
      // More than 6 goals per minute
      issues.push({
        code: 'UNREALISTIC_GOAL_RATE',
        severity: 'high',
        message: `Goal rate (${(goalsPerMinute * 90).toFixed(1)} per 90 min) is unrealistic`,
        data: { totalGoals, duration, rate: goalsPerMinute },
      });
      penalties += 12;
    }

    // Player goal rate vs team performance
    if (duration > 0) {
      const playerGoalRate = playerGoals / duration;
      if (playerGoalRate > 0.05) {
        // More than 3 goals per 60 minutes
        warnings.push({
          code: 'PLAYER_GOAL_RATE_HIGH',
          message: `Player goal rate is exceptionally high`,
          recommendation: 'Verify player performance accuracy',
        });
        penalties += 5;
      }
    }

    // Logical consistency: assists should not exceed goals in most cases
    if (playerAssists > playerGoals && playerGoals > 0) {
      // This is possible but unusual
      warnings.push({
        code: 'MORE_ASSISTS_THAN_GOALS',
        message: `Player had more assists (${playerAssists}) than goals (${playerGoals})`,
        recommendation: 'This is unusual - verify player was active in creating plays',
      });
      penalties += 3;
    }

    return { issues, warnings, penalties };
  }

  /**
   * Detect anomalies by comparing to player history
   */
  private static detectAnomalies(
    match: MatchRecord,
    history: MatchRecord[]
  ): {
    issues: ValidationIssue[];
    warnings: ValidationWarning[];
    penalties: number;
  } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    let penalties = 0;

    if (history.length === 0) {
      return { issues, warnings, penalties };
    }

    // Calculate player statistics
    const stats = {
      avgGoals: history.reduce((sum, m) => sum + m.playerGoals, 0) / history.length,
      avgAssists: history.reduce((sum, m) => sum + m.playerAssists, 0) / history.length,
      avgDuration: history.reduce((sum, m) => sum + m.duration, 0) / history.length,
      winRate: (history.filter(m => m.result === 'win').length / history.length) * 100,
      maxGoalsInMatch: Math.max(...history.map(m => m.playerGoals)),
      maxAssistsInMatch: Math.max(...history.map(m => m.playerAssists)),
    };

    // Detect goal anomalies (more than 3 standard deviations above mean)
    const goalDeviation = (match.playerGoals - stats.avgGoals) / (Math.sqrt(stats.avgGoals) + 1);
    if (goalDeviation > 3 && match.playerGoals > stats.maxGoalsInMatch) {
      warnings.push({
        code: 'ANOMALY_GOALS',
        message: `Goals (${match.playerGoals}) significantly exceed historical average (${stats.avgGoals.toFixed(1)})`,
        recommendation: 'Review match highlights and player performance data',
      });
      penalties += 8;
    }

    // Detect assist anomalies
    const assistDeviation = (match.playerAssists - stats.avgAssists) / (Math.sqrt(stats.avgAssists) + 1);
    if (assistDeviation > 3 && match.playerAssists > stats.maxAssistsInMatch) {
      warnings.push({
        code: 'ANOMALY_ASSISTS',
        message: `Assists (${match.playerAssists}) significantly exceed historical average (${stats.avgAssists.toFixed(1)})`,
        recommendation: 'Review match highlights and passing accuracy',
      });
      penalties += 6;
    }

    // Detect win rate anomalies
    const previousWinRate = stats.winRate;
    const recentForm = history.slice(-10);
    const recentWinRate = (recentForm.filter(m => m.result === 'win').length / recentForm.length) * 100;

    if (match.result === 'win' && previousWinRate < 30 && recentWinRate < 25) {
      warnings.push({
        code: 'FORM_REVERSAL',
        message: `Win reported after poor win rate (${previousWinRate.toFixed(0)}%)`,
        recommendation: 'Ensure match outcome is correct',
      });
      penalties += 4;
    }

    // Detect sudden performance spike
    const performanceChange = match.playerGoals - stats.avgGoals + match.playerAssists - stats.avgAssists;
    if (performanceChange > stats.avgGoals + stats.avgAssists) {
      warnings.push({
        code: 'PERFORMANCE_SPIKE',
        message: 'Unusual performance spike detected',
        recommendation: 'Verify player effort and match circumstances',
      });
      penalties += 5;
    }

    // Check for pattern of impossible streaks
    const lastFiveMatches = history.slice(-5);
    const lastFiveWins = lastFiveMatches.filter(m => m.result === 'win').length;
    if (lastFiveWins === 5 && match.result === 'win') {
      // 6 consecutive wins - check if probability is reasonable
      const estimatedProb = Math.pow(stats.winRate / 100, 6);
      if (estimatedProb < 0.01) {
        // Less than 1% probability
        warnings.push({
          code: 'UNLIKELY_STREAK',
          message: 'Consecutive wins form statistically unlikely pattern',
          recommendation: 'Verify match authenticity and difficulty level',
        });
        penalties += 3;
      }
    }

    return { issues, warnings, penalties };
  }

  /**
   * Validate statistical consistency with match engine data
   */
  private static validateStatisticalConsistency(
    match: MatchRecord,
    stats: MatchStats
  ): {
    issues: ValidationIssue[];
    warnings: ValidationWarning[];
    penalties: number;
  } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    let penalties = 0;

    // Get team stats based on player's team
    const teamStats = match.playerTeam === 'home' ? stats.homeTeam : stats.awayTeam;
    const playerTeamScore = match.playerTeam === 'home' ? match.homeScore : match.awayScore;

    // Verify goals match
    if (teamStats.goals !== playerTeamScore) {
      issues.push({
        code: 'STATS_GOAL_MISMATCH',
        severity: 'critical',
        message: 'Match stats goals do not match recorded match score',
        data: { statsGoals: teamStats.goals, matchGoals: playerTeamScore },
      });
      penalties += 20;
    }

    // Verify assists are reasonable
    if (teamStats.assists < match.playerAssists) {
      issues.push({
        code: 'PLAYER_ASSISTS_EXCEED_TEAM',
        severity: 'high',
        message: `Player assists exceed team total assists`,
        data: { playerAssists: match.playerAssists, teamAssists: teamStats.assists },
      });
      penalties += 15;
    }

    // Check pass accuracy consistency
    if (teamStats.passAccuracy > 100 || teamStats.passAccuracy < 0) {
      issues.push({
        code: 'INVALID_PASS_ACCURACY',
        severity: 'high',
        message: `Invalid pass accuracy: ${teamStats.passAccuracy}%`,
        data: { passAccuracy: teamStats.passAccuracy },
      });
      penalties += 10;
    }

    // Verify possession adds up
    const totalPossession = stats.homeTeam.possession + stats.awayTeam.possession;
    if (Math.abs(totalPossession - 100) > 5) {
      warnings.push({
        code: 'POSSESSION_MISMATCH',
        message: `Total possession is ${totalPossession}%, not 100%`,
        recommendation: 'Verify possession tracking in match engine',
      });
      penalties += 3;
    }

    return { issues, warnings, penalties };
  }

  /**
   * Build player anomaly profile
   */
  static buildPlayerProfile(matchHistory: MatchRecord[]): PlayerAnomalyProfile {
    const playerId = matchHistory[0]?.id || 'unknown';

    const stats = {
      avgGoalsPerMatch: matchHistory.length > 0 ? matchHistory.reduce((sum, m) => sum + m.playerGoals, 0) / matchHistory.length : 0,
      avgAssistsPerMatch: matchHistory.length > 0 ? matchHistory.reduce((sum, m) => sum + m.playerAssists, 0) / matchHistory.length : 0,
      avgMatchDuration: matchHistory.length > 0 ? matchHistory.reduce((sum, m) => sum + m.duration, 0) / matchHistory.length : 0,
      totalMatches: matchHistory.length,
    };

    return {
      playerId,
      ...stats,
      anomalies: [],
    };
  }

  /**
   * Check if match validation result indicates cheating
   */
  static isSuspicious(result: ValidationResult): boolean {
    return (
      !result.isValid ||
      result.score < 40 ||
      result.issues.filter(i => i.severity === 'critical').length > 0
    );
  }

  /**
   * Get human-readable validation report
   */
  static generateReport(result: ValidationResult): string {
    const lines: string[] = [];

    lines.push(`Match Validation Report (Score: ${result.score}/100)`);
    lines.push(`Status: ${result.isValid ? '✓ VALID' : '✗ INVALID'}`);
    lines.push('');

    if (result.issues.length > 0) {
      lines.push('ISSUES:');
      result.issues.forEach(issue => {
        const icon = issue.severity === 'critical' ? '🚫' : '⚠️';
        lines.push(`  ${icon} [${issue.severity}] ${issue.code}: ${issue.message}`);
      });
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('WARNINGS:');
      result.warnings.forEach(warning => {
        lines.push(`  ⚠️ ${warning.code}: ${warning.message}`);
        lines.push(`     → ${warning.recommendation}`);
      });
      lines.push('');
    }

    if (result.isValid && result.warnings.length === 0) {
      lines.push('✓ All checks passed - Match is legitimate');
    }

    return lines.join('\n');
  }
}
