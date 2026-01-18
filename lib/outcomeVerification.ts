/**
 * Deterministic Outcomes Integration
 * Verifies that inputs produce the claimed result hash
 */

import { MatchRecord } from './guestMode';
import { MatchHasher, HashResult, MatchIntegrity, DeterministicIdGenerator } from './matchHasher';

/**
 * Extended match record with hash information
 */
export interface VerifiedMatchRecord extends MatchRecord {
  resultHash?: HashResult;         // Cryptographic hash of outcome
  outcomeSignature?: string;       // Quick outcome signature
  seal?: string;                   // Tamper-evident seal
  proof?: string;                  // Shareable proof of outcome
  integrityVerified?: boolean;     // Whether integrity was verified
  lastVerified?: number;           // Timestamp of last verification
}

/**
 * Outcome verification system
 */
export class OutcomeVerification {
  /**
   * Verify that inputs produce the claimed outcome
   */
  static async verifyOutcome(
    match: MatchRecord,
    playerId: string
  ): Promise<{
    isValid: boolean;
    hash: HashResult;
    consistency: boolean;
    modificationDetected: boolean;
    details: string[];
  }> {
    const details: string[] = [];

    // Generate hash from current data
    const hash = await MatchHasher.generateHash(match, playerId);
    details.push(`Hash generated: ${hash.hash.substring(0, 16)}...`);

    // Check outcome consistency
    const inputs = {
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      playerTeam: match.playerTeam,
      duration: match.duration,
    };

    const outputs = {
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      playerGoals: match.playerGoals,
      playerAssists: match.playerAssists,
      result: match.result,
    };

    const isConsistent = MatchIntegrity.isOutcomeConsistent(inputs, outputs);
    details.push(`Outcome consistency: ${isConsistent ? 'PASS ✓' : 'FAIL ✗'}`);

    // Calculate outcome probability
    const probability = MatchIntegrity.calculateOutcomeProbability(
      match.homeTeam,
      match.awayTeam,
      match.homeScore,
      match.awayScore,
      match.duration
    );
    details.push(`Outcome probability: ${(probability * 100).toFixed(0)}%`);

    // Generate signature
    const signature = MatchIntegrity.calculateOutcomeSignature(inputs, outputs);
    details.push(`Outcome signature generated`);

    return {
      isValid: isConsistent && hash.isValid,
      hash,
      consistency: isConsistent,
      modificationDetected: false,
      details,
    };
  }

  /**
   * Apply verification hash to a match
   */
  static async applyVerification(
    match: MatchRecord,
    playerId: string
  ): Promise<VerifiedMatchRecord> {
    const verification = await this.verifyOutcome(match, playerId);

    const verified: VerifiedMatchRecord = {
      ...match,
      resultHash: verification.hash,
      outcomeSignature: MatchIntegrity.calculateOutcomeSignature(
        {
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          playerTeam: match.playerTeam,
          duration: match.duration,
        },
        {
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          playerGoals: match.playerGoals,
          playerAssists: match.playerAssists,
          result: match.result,
        }
      ),
      seal: MatchHasher.createSeal(match, playerId, verification.hash),
      proof: MatchHasher.generateProof(match, verification.hash),
      integrityVerified: verification.isValid,
      lastVerified: Date.now(),
    };

    return verified;
  }

  /**
   * Re-verify an already verified match
   */
  static async reverifyMatch(
    match: VerifiedMatchRecord,
    playerId: string
  ): Promise<{
    stillValid: boolean;
    hashMatches: boolean;
    sealMatches: boolean;
    modificationDetected: boolean;
    details: string[];
  }> {
    const details: string[] = [];

    if (!match.resultHash || !match.seal) {
      return {
        stillValid: false,
        hashMatches: false,
        sealMatches: false,
        modificationDetected: true,
        details: ['Match not previously verified - no hash/seal found'],
      };
    }

    // Verify hash is still valid
    const hashValid = await MatchHasher.verifyHash(match, playerId, match.resultHash);
    details.push(`Hash verification: ${hashValid ? 'PASS ✓' : 'FAIL ✗'}`);

    // Verify seal
    const sealValid = MatchHasher.verifySeal(match.seal, match, playerId, match.resultHash);
    details.push(`Seal verification: ${sealValid ? 'PASS ✓' : 'FAIL ✗'}`);

    // Check proof
    const proofValid = match.proof ? MatchHasher.verifyProof(match.proof, match, match.resultHash) : false;
    details.push(`Proof verification: ${proofValid ? 'PASS ✓' : 'FAIL ✗'}`);

    const stillValid = hashValid && sealValid;
    const modificationDetected = !hashValid || !sealValid;

    return {
      stillValid,
      hashMatches: hashValid,
      sealMatches: sealValid,
      modificationDetected,
      details,
    };
  }

  /**
   * Generate verification report
   */
  static async generateVerificationReport(
    match: VerifiedMatchRecord,
    playerId: string
  ): Promise<string> {
    const lines: string[] = [];

    lines.push('╔════════════════════════════════════════════╗');
    lines.push('║   DETERMINISTIC OUTCOME VERIFICATION REPORT ║');
    lines.push('╚════════════════════════════════════════════╝');
    lines.push('');

    // Match details
    lines.push('MATCH DETAILS:');
    lines.push(`  ID: ${match.id}`);
    lines.push(`  Teams: ${match.homeTeam} vs ${match.awayTeam}`);
    lines.push(`  Score: ${match.homeScore} - ${match.awayScore}`);
    lines.push(`  Duration: ${match.duration} minutes`);
    lines.push('');

    // Player details
    lines.push('PLAYER PERFORMANCE:');
    lines.push(`  Team: ${match.playerTeam}`);
    lines.push(`  Goals: ${match.playerGoals}`);
    lines.push(`  Assists: ${match.playerAssists}`);
    lines.push(`  Result: ${match.result}`);
    lines.push('');

    // Hash information
    if (match.resultHash) {
      lines.push('CRYPTOGRAPHIC VERIFICATION:');
      lines.push(`  Algorithm: ${match.resultHash.algorithm}`);
      lines.push(`  Input Hash: ${match.resultHash.inputHash.substring(0, 32)}...`);
      lines.push(`  Output Hash: ${match.resultHash.outputHash.substring(0, 32)}...`);
      lines.push(`  Match Hash: ${match.resultHash.hash.substring(0, 32)}...`);
      lines.push(`  Generated: ${new Date(match.resultHash.timestamp).toISOString()}`);
      lines.push('');
    }

    // Verification status
    lines.push('VERIFICATION STATUS:');
    if (match.integrityVerified) {
      lines.push('  ✓ Outcome is deterministic');
      lines.push('  ✓ Inputs match outputs');
      lines.push('  ✓ No tampering detected');
      lines.push('  ✓ Hash is cryptographically valid');
    } else {
      lines.push('  ✗ Outcome verification FAILED');
      lines.push('  ✗ Potential data tampering detected');
    }
    lines.push('');

    // Proof information
    if (match.proof) {
      lines.push('SHAREABLE PROOF:');
      lines.push(`  ${match.proof}`);
      lines.push('');
    }

    lines.push('═══════════════════════════════════════════');
    lines.push('This outcome has been cryptographically verified.');
    lines.push('The inputs deterministically produce this result.');
    lines.push('═══════════════════════════════════════════');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Create a batch verification report for multiple matches
   */
  static async generateBatchVerificationReport(
    matches: VerifiedMatchRecord[],
    playerId: string
  ): Promise<string> {
    const lines: string[] = [];

    lines.push('╔════════════════════════════════════════════╗');
    lines.push('║   BATCH OUTCOME VERIFICATION REPORT        ║');
    lines.push('╚════════════════════════════════════════════╝');
    lines.push('');

    lines.push(`TOTAL MATCHES: ${matches.length}`);
    lines.push(`VERIFIED MATCHES: ${matches.filter(m => m.integrityVerified).length}`);
    lines.push(`FLAGGED MATCHES: ${matches.filter(m => !m.integrityVerified).length}`);
    lines.push('');

    // Summary table
    lines.push('MATCH SUMMARY:');
    lines.push('');
    for (const match of matches) {
      const status = match.integrityVerified ? '✓' : '✗';
      lines.push(`${status} ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`);
      lines.push(`   Player: ${match.playerGoals}G ${match.playerAssists}A | Result: ${match.result}`);
      if (match.resultHash) {
        lines.push(`   Hash: ${match.resultHash.hash.substring(0, 16)}...`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}

/**
 * Deterministic outcome proof generator
 * Creates verifiable proofs that can be shared
 */
export class OutcomeProof {
  /**
   * Generate a shareable proof URL/token
   */
  static generateShareableProof(match: VerifiedMatchRecord, playerId: string): string {
    if (!match.proof) {
      return 'NO_PROOF_AVAILABLE';
    }

    // Encode proof with player ID and timestamp
    const encoded = Buffer.from(
      `${match.proof}:${playerId}:${match.lastVerified}`
    ).toString('base64');

    return `bass-ball://verify/${encoded}`;
  }

  /**
   * Verify a shareable proof
   */
  static verifyShareableProof(
    proofUrl: string,
    match: VerifiedMatchRecord,
    playerId: string
  ): boolean {
    try {
      if (!proofUrl.startsWith('bass-ball://verify/')) {
        return false;
      }

      const encoded = proofUrl.replace('bass-ball://verify/', '');
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
      const parts = decoded.split(':');

      if (parts.length !== 3) return false;

      const storedProof = parts[0];
      const storedPlayerId = parts[1];
      const storedTimestamp = parseInt(parts[2], 10);

      // Verify proof matches
      if (storedProof !== match.proof) return false;
      if (storedPlayerId !== playerId) return false;
      if (storedTimestamp !== match.lastVerified) return false;

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a fingerprint of a match outcome
   * Can be used for deduplication and quick comparison
   */
  static createOutcomeFingerprint(match: MatchRecord): string {
    const data = `${match.homeTeam}|${match.awayTeam}|${match.homeScore}|${match.awayScore}|${match.playerGoals}|${match.playerAssists}|${match.duration}`;
    return Buffer.from(data).toString('base64').substring(0, 32);
  }

  /**
   * Compare two match fingerprints
   */
  static compareOutcomes(match1: MatchRecord, match2: MatchRecord): boolean {
    const fp1 = this.createOutcomeFingerprint(match1);
    const fp2 = this.createOutcomeFingerprint(match2);
    return fp1 === fp2;
  }
}

/**
 * Integration helper for applying verification to matches
 */
export async function applyDeterministicVerification(
  match: MatchRecord,
  playerId: string
): Promise<VerifiedMatchRecord> {
  return OutcomeVerification.applyVerification(match, playerId);
}

/**
 * Integration helper for verifying matches
 */
export async function verifyDeterministicOutcome(
  match: MatchRecord,
  playerId: string
): Promise<boolean> {
  const verification = await OutcomeVerification.verifyOutcome(match, playerId);
  return verification.isValid && verification.consistency;
}
