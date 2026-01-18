// Integration Guide: Anti-Cheat System Setup

import { GuestModeManager } from '@/lib/guestMode';
import { MatchValidator, ValidationResult } from '@/lib/matchValidator';
import type { MatchResult, GuestPlayer } from '@/lib/guestMode';

/**
 * STEP 1: Update guestMode.ts recordMatch() return type
 * 
 * Current:
 *   static recordMatch(...): GuestPlayer | null
 * 
 * New:
 *   static recordMatch(...): { player: GuestPlayer | null; validation: ValidationResult }
 * 
 * Already done in guestMode.ts - validation is now returned
 */

/**
 * STEP 2: Use in LiveMatch component when match ends
 */

// Example: After match completion in LiveMatch or GameEnd

export function handleMatchEnd(matchResult: MatchResult) {
  const player = GuestModeManager.getGuestPlayer();
  if (!player) return;

  // Record match with validation
  const { player: updatedPlayer, validation } = GuestModeManager.recordMatch(
    matchResult.homeTeam.name,
    matchResult.awayTeam.name,
    matchResult.homeTeam.goals,
    matchResult.awayTeam.goals,
    matchResult.playerTeam,
    matchResult.playerGoals,
    matchResult.playerAssists,
    matchResult.duration
  );

  if (!updatedPlayer) return;

  // Show validation result to player
  if (MatchValidator.isSuspicious(validation)) {
    console.warn('Match flagged:', validation);
    // Show warning banner: "This match has been flagged for review"
    // But still record it - don't block legitimate play
  }

  // Log validation for analytics
  console.log(`Match validation score: ${validation.score}/100`);
  if (validation.issues.length > 0) {
    console.log('Issues:', validation.issues);
  }
}

/**
 * STEP 3: Calculate fairness score for player profile
 */

export function calculatePlayerFairnessScore(player: GuestPlayer): number {
  if (player.matchHistory.length === 0) return 100;

  const validations = player.matchHistory.map((match) =>
    MatchValidator.validateMatch(match, undefined, player.matchHistory)
  );

  const avgScore = validations.reduce((sum, val) => sum + val.score, 0) / validations.length;
  return Math.round(avgScore);
}

/**
 * STEP 4: Generate validation report for a match
 */

export function generateValidationReport(match: any, validation: ValidationResult): string {
  const lines: string[] = [];
  lines.push('='.repeat(50));
  lines.push('MATCH VALIDATION REPORT');
  lines.push('='.repeat(50));
  lines.push(`Score: ${validation.score}/100`);
  lines.push(`Status: ${validation.isValid ? 'VALID' : 'INVALID'}`);
  lines.push(`Suspicious: ${MatchValidator.isSuspicious(validation) ? 'YES' : 'NO'}`);
  lines.push('');
  
  if (validation.issues.length > 0) {
    lines.push('ISSUES:');
    validation.issues.forEach(issue => {
      lines.push(`- [${issue.severity}] ${issue.message}`);
    });
  }
  
  return lines.join('\n');
}

/**
 * STEP 5: Filter players by fairness tier
 */

export function filterPlayersByFairness(
  players: GuestPlayer[],
  tier: 'all' | 'verified' | 'clean'
): GuestPlayer[] {
  return players.filter((player) => {
    const score = calculatePlayerFairnessScore(player);
    if (tier === 'verified') return score >= 90;
    if (tier === 'clean') return score >= 70;
    return true;
  });
}

/**
 * STEP 6: Generate admin stats
 */

export interface AdminStats {
  totalPlayers: number;
  totalMatches: number;
  avgFairnessScore: number;
  suspiciousPlayers: number;
}

export function generateAdminStats(players: GuestPlayer[]): AdminStats {
  let totalMatches = 0;
  let totalScore = 0;
  let suspiciousCount = 0;

  players.forEach((player) => {
    totalMatches += player.matchHistory.length;
    const score = calculatePlayerFairnessScore(player);
    totalScore += score;
    if (score < 70) suspiciousCount++;
  });

  return {
    totalPlayers: players.length,
    totalMatches,
    avgFairnessScore: players.length > 0 ? Math.round(totalScore / players.length) : 100,
    suspiciousPlayers: suspiciousCount,
  };
}

/**
 * INTEGRATION USAGE
 * 
 * 1. Record match with validation:
 *    const { player, validation } = GuestModeManager.recordMatch(...);
 * 
 * 2. Calculate fairness:
 *    const score = calculatePlayerFairnessScore(player);
 * 
 * 3. Generate report:
 *    const report = generateValidationReport(match, validation);
 * 
 * 4. Filter leaderboard:
 *    const cleanPlayers = filterPlayersByFairness(allPlayers, 'clean');
 * 
 * 5. Get admin stats:
 *    const stats = generateAdminStats(allPlayers);
 */
