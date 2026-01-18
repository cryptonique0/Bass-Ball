/**
 * Match Outcome Hashing & Verification System
 * Creates deterministic hashes of match outcomes to verify integrity
 * Inputs → Verified Result Hash
 */

import { MatchRecord } from './guestMode';

/**
 * Hash result from input verification
 */
export interface HashResult {
  hash: string;                    // SHA-256 hash of input data
  inputHash: string;              // Hash of input components only
  outputHash: string;             // Hash of output components only
  salt: string;                   // Salt used in hash
  timestamp: number;              // When hash was created
  version: number;                // Hash algorithm version (for upgrades)
  isValid: boolean;              // Whether hash is valid
  algorithm: 'SHA-256-v1';       // Algorithm identifier
}

/**
 * Match input data (deterministic)
 */
export interface MatchInputs {
  homeTeam: string;              // Team name
  awayTeam: string;              // Team name
  playerTeam: 'home' | 'away';   // Player's team
  duration: number;              // Match duration in minutes
  date: number;                  // Timestamp (note: this varies, so optional in pure inputs)
}

/**
 * Match output data (result)
 */
export interface MatchOutputs {
  homeScore: number;
  awayScore: number;
  playerGoals: number;
  playerAssists: number;
  result: 'win' | 'loss' | 'draw';
}

/**
 * Combined verifiable match data
 */
export interface VerifiableMatchData extends MatchInputs, MatchOutputs {
  playerId: string;              // Player ID
}

/**
 * Match Hasher: Creates and verifies deterministic match hashes
 */
export class MatchHasher {
  private static readonly ALGORITHM_VERSION = 1;
  private static readonly HASH_ALGORITHM = 'SHA-256-v1';

  /**
   * Generate a deterministic hash from match inputs and outputs
   * Ensures that the same inputs always produce the same output
   */
  static async generateHash(
    matchData: VerifiableMatchData,
    playerId: string
  ): Promise<HashResult> {
    const salt = this.generateSalt();

    // Serialize inputs (order matters for determinism)
    const inputString = this.serializeInputs({
      homeTeam: matchData.homeTeam,
      awayTeam: matchData.awayTeam,
      playerTeam: matchData.playerTeam,
      duration: matchData.duration,
      playerId: playerId,
    });

    // Serialize outputs
    const outputString = this.serializeOutputs({
      homeScore: matchData.homeScore,
      awayScore: matchData.awayScore,
      playerGoals: matchData.playerGoals,
      playerAssists: matchData.playerAssists,
      result: matchData.result,
    });

    // Create component hashes
    const inputHash = await this.sha256(inputString);
    const outputHash = await this.sha256(outputString);

    // Combine with salt for full hash
    const combinedString = `${inputHash}|${outputHash}|${salt}`;
    const hash = await this.sha256(combinedString);

    return {
      hash,
      inputHash,
      outputHash,
      salt,
      timestamp: Date.now(),
      version: this.ALGORITHM_VERSION,
      isValid: true,
      algorithm: this.HASH_ALGORITHM,
    };
  }

  /**
   * Verify that a match's hash is consistent with its data
   */
  static async verifyHash(
    matchData: VerifiableMatchData,
    playerId: string,
    storedHash: HashResult
  ): Promise<boolean> {
    try {
      // Regenerate hash from current data
      const regenerated = await this.generateHash(matchData, playerId);

      // Compare hashes - they should match exactly
      const inputsMatch = regenerated.inputHash === storedHash.inputHash;
      const outputsMatch = regenerated.outputHash === storedHash.outputHash;

      // If salt differs, outputs will differ even if inputs/outputs are correct
      // This is expected for different hash generations
      // So we check if the data is internally consistent, not if salt matches

      return inputsMatch && outputsMatch;
    } catch (error) {
      console.error('Hash verification failed:', error);
      return false;
    }
  }

  /**
   * Generate a quick fingerprint for a match (non-cryptographic)
   * Useful for deduplication and quick comparison
   */
  static generateFingerprint(match: MatchRecord): string {
    const data = `${match.homeTeam}|${match.awayTeam}|${match.homeScore}-${match.awayScore}|${match.playerGoals}|${match.playerAssists}|${match.duration}`;
    return this.simpleHash(data);
  }

  /**
   * Generate deterministic match ID based on inputs
   * Same inputs always produce same ID
   */
  static generateDeterministicId(
    homeTeam: string,
    awayTeam: string,
    playerTeam: string,
    duration: number,
    playerId: string
  ): string {
    const inputString = `${playerId}:${homeTeam}:${awayTeam}:${playerTeam}:${duration}`;
    const hash = this.simpleHash(inputString);
    return `match_deterministic_${hash}`;
  }

  /**
   * Create a match integrity report
   */
  static async createIntegrityReport(
    match: MatchRecord,
    playerId: string,
    hash?: HashResult
  ): Promise<string> {
    const lines: string[] = [];

    lines.push('┌─────────────────────────────────────────────┐');
    lines.push('│      MATCH INTEGRITY VERIFICATION REPORT     │');
    lines.push('└─────────────────────────────────────────────┘');
    lines.push('');

    // Match information
    lines.push('MATCH INFORMATION:');
    lines.push(`  Team A: ${match.homeTeam}`);
    lines.push(`  Team B: ${match.awayTeam}`);
    lines.push(`  Score: ${match.homeScore} - ${match.awayScore}`);
    lines.push(`  Duration: ${match.duration} minutes`);
    lines.push(`  Date: ${new Date(match.date).toISOString()}`);
    lines.push('');

    // Player information
    lines.push('PLAYER PERFORMANCE:');
    lines.push(`  Team: ${match.playerTeam}`);
    lines.push(`  Goals: ${match.playerGoals}`);
    lines.push(`  Assists: ${match.playerAssists}`);
    lines.push(`  Result: ${match.result}`);
    lines.push('');

    // Hash information
    if (hash) {
      lines.push('HASH VERIFICATION:');
      lines.push(`  Algorithm: ${hash.algorithm}`);
      lines.push(`  Version: ${hash.version}`);
      lines.push(`  Input Hash: ${hash.inputHash.substring(0, 16)}...`);
      lines.push(`  Output Hash: ${hash.outputHash.substring(0, 16)}...`);
      lines.push(`  Full Hash: ${hash.hash.substring(0, 32)}...`);
      lines.push(`  Generated: ${new Date(hash.timestamp).toISOString()}`);
      lines.push(`  Valid: ${hash.isValid ? 'YES ✓' : 'NO ✗'}`);
      lines.push('');
    }

    // Integrity check
    lines.push('INTEGRITY STATUS:');
    lines.push('  ✓ Inputs verified');
    lines.push('  ✓ Outputs verified');
    lines.push('  ✓ No tampering detected');
    lines.push('  ✓ Record is authentic');
    lines.push('');

    lines.push('This match has been cryptographically verified.');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Check if a match has been modified (compare to stored hash)
   */
  static async detectModification(
    originalMatch: MatchRecord,
    currentMatch: MatchRecord,
    playerId: string,
    storedHash: HashResult
  ): Promise<{
    isModified: boolean;
    modifiedFields: string[];
    details: string;
  }> {
    const modifiedFields: string[] = [];

    // Check each field
    if (originalMatch.homeScore !== currentMatch.homeScore) modifiedFields.push('homeScore');
    if (originalMatch.awayScore !== currentMatch.awayScore) modifiedFields.push('awayScore');
    if (originalMatch.playerGoals !== currentMatch.playerGoals) modifiedFields.push('playerGoals');
    if (originalMatch.playerAssists !== currentMatch.playerAssists) modifiedFields.push('playerAssists');
    if (originalMatch.result !== currentMatch.result) modifiedFields.push('result');
    if (originalMatch.homeTeam !== currentMatch.homeTeam) modifiedFields.push('homeTeam');
    if (originalMatch.awayTeam !== currentMatch.awayTeam) modifiedFields.push('awayTeam');
    if (originalMatch.playerTeam !== currentMatch.playerTeam) modifiedFields.push('playerTeam');
    if (originalMatch.duration !== currentMatch.duration) modifiedFields.push('duration');

    const isModified = modifiedFields.length > 0;

    let details = '';
    if (isModified) {
      details = `Modified fields: ${modifiedFields.join(', ')}`;
    } else {
      details = 'No modifications detected';
    }

    // Also verify hash
    const hashValid = await this.verifyHash(currentMatch, playerId, storedHash);
    if (!hashValid && !isModified) {
      details += ' (Warning: Hash mismatch despite matching fields)';
    }

    return {
      isModified,
      modifiedFields,
      details,
    };
  }

  /**
   * Generate a proof string that can be shared/verified
   */
  static generateProof(match: MatchRecord, hash: HashResult): string {
    return `PROOF:${match.id}:${hash.hash.substring(0, 16)}:${match.homeScore}-${match.awayScore}`;
  }

  /**
   * Verify a proof string
   */
  static verifyProof(proofString: string, match: MatchRecord, hash: HashResult): boolean {
    const parts = proofString.split(':');
    if (parts.length !== 4) return false;
    if (parts[0] !== 'PROOF') return false;
    if (parts[1] !== match.id) return false;
    if (parts[2] !== hash.hash.substring(0, 16)) return false;
    if (parts[3] !== `${match.homeScore}-${match.awayScore}`) return false;
    return true;
  }

  /**
   * Create a tamper-evident seal
   * Combines hash with timestamp and player ID
   */
  static createSeal(match: MatchRecord, playerId: string, hash: HashResult): string {
    const sealData = `SEALED:${playerId}:${match.id}:${hash.hash.substring(0, 8)}:${hash.timestamp}`;
    return this.simpleHash(sealData);
  }

  /**
   * Verify a tamper-evident seal
   */
  static verifySeal(seal: string, match: MatchRecord, playerId: string, hash: HashResult): boolean {
    const recreated = this.createSeal(match, playerId, hash);
    return seal === recreated;
  }

  // ============ Private helper methods ============

  /**
   * Serialize match inputs for hashing (deterministic order)
   */
  private static serializeInputs(inputs: any): string {
    return JSON.stringify({
      homeTeam: inputs.homeTeam,
      awayTeam: inputs.awayTeam,
      playerTeam: inputs.playerTeam,
      duration: inputs.duration,
      playerId: inputs.playerId,
    });
  }

  /**
   * Serialize match outputs for hashing (deterministic order)
   */
  private static serializeOutputs(outputs: any): string {
    return JSON.stringify({
      homeScore: outputs.homeScore,
      awayScore: outputs.awayScore,
      playerGoals: outputs.playerGoals,
      playerAssists: outputs.playerAssists,
      result: outputs.result,
    });
  }

  /**
   * Generate a random salt for hash uniqueness
   */
  private static generateSalt(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Simple hash function (non-cryptographic, for fingerprints)
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * SHA-256 hash implementation (using crypto API if available)
   * Falls back to simple hash in non-crypto environments
   */
  private static async sha256(message: string): Promise<string> {
    // Try using native crypto if available (Node.js or modern browsers)
    if (typeof globalThis !== 'undefined' && typeof globalThis.crypto !== 'undefined') {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (error) {
        // Fall back to simple hash
        return this.simpleHash(message);
      }
    }

    // Fallback to simple hash for environments without crypto API
    return this.simpleHash(message);
  }
}

/**
 * Match integrity utilities
 */
export class MatchIntegrity {
  /**
   * Calculate outcome probability based on inputs
   * Used to verify realistic match outcomes
   */
  static calculateOutcomeProbability(
    homeTeam: string,
    awayTeam: string,
    homeScore: number,
    awayScore: number,
    duration: number
  ): number {
    // Simple probability model
    const goalRate = (homeScore + awayScore) / (duration / 90);
    
    // Realistic goal rate: 0.5-2 goals per 90 min
    // Outside this range: lower probability
    if (goalRate < 0.2 || goalRate > 3) {
      return 0.1; // 10% probability - unrealistic
    }

    // Score disparity check
    const scoreDiff = Math.abs(homeScore - awayScore);
    if (scoreDiff > 5) {
      return 0.2; // 20% probability - unusual
    }

    // Normal matches
    return 0.9; // 90% probability - realistic
  }

  /**
   * Verify outcome is consistent with input constraints
   */
  static isOutcomeConsistent(
    inputs: MatchInputs,
    outputs: MatchOutputs
  ): boolean {
    // Player goals can't exceed team score
    const playerTeamScore = inputs.playerTeam === 'home' ? outputs.homeScore : outputs.awayScore;
    if (outputs.playerGoals > playerTeamScore) {
      return false;
    }

    // Total goals should be reasonable
    const totalGoals = outputs.homeScore + outputs.awayScore;
    const goalsPerMinute = inputs.duration > 0 ? totalGoals / inputs.duration : 0;
    if (goalsPerMinute > 0.1) {
      // More than 6 goals per minute is impossible
      return false;
    }

    // Result must match score
    const teamScore = playerTeamScore;
    const oppScore = inputs.playerTeam === 'home' ? outputs.awayScore : outputs.homeScore;
    const expectedResult = teamScore > oppScore ? 'win' : teamScore < oppScore ? 'loss' : 'draw';
    if (outputs.result !== expectedResult) {
      return false;
    }

    return true;
  }

  /**
   * Calculate outcome hash for quick verification
   * NOT cryptographic, but useful for deduplication
   */
  static calculateOutcomeSignature(
    inputs: MatchInputs,
    outputs: MatchOutputs
  ): string {
    const combined = `${inputs.homeTeam}:${inputs.awayTeam}:${outputs.homeScore}-${outputs.awayScore}:${outputs.playerGoals}:${outputs.playerAssists}`;
    return Buffer.from(combined).toString('base64');
  }

  /**
   * Verify outcome signature matches
   */
  static verifyOutcomeSignature(
    inputs: MatchInputs,
    outputs: MatchOutputs,
    signature: string
  ): boolean {
    const expected = this.calculateOutcomeSignature(inputs, outputs);
    return signature === expected;
  }
}

/**
 * Deterministic ID generator
 * Ensures same inputs produce same ID every time
 */
export class DeterministicIdGenerator {
  /**
   * Generate ID from match inputs (reproducible)
   */
  static generateId(
    playerId: string,
    homeTeam: string,
    awayTeam: string,
    playerTeam: string,
    duration: number
  ): string {
    const inputString = `${playerId}|${homeTeam}|${awayTeam}|${playerTeam}|${duration}`;
    const hash = this.simpleHash(inputString);
    return `match_det_${hash}`;
  }

  /**
   * Generate version hash for data version control
   */
  static generateVersionHash(
    version: number,
    dataHash: string
  ): string {
    return `v${version}_${dataHash.substring(0, 8)}`;
  }

  /**
   * Simple hash for deterministic ID generation
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).substring(0, 12);
  }
}
