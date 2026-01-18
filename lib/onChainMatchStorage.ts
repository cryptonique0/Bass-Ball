/**
 * On-Chain Match Result Storage
 * Stores minimal match summaries on blockchain for verification and permanence
 * Selective approach: Only final results, not full event logs
 */

import type { MatchLog } from './matchLogger';

/**
 * Minimal match summary for blockchain storage
 * Designed to be compact and gas-efficient
 */
export interface OnChainMatchSummary {
  // Core identifiers
  matchId: string;
  timestamp: number; // Block timestamp
  
  // Teams and result
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  
  // Top performers (summary only)
  topScorer?: string;
  topScorerGoals?: number;
  
  // Verification
  resultHash: string; // SHA-256 hash of result
  matchDataHash?: string; // Optional: hash of full match for later verification
}

/**
 * On-chain transaction record
 */
export interface OnChainTransaction {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  contractAddress: string;
  matchId: string;
  status: 'pending' | 'confirmed' | 'failed';
}

/**
 * On-chain storage configuration
 */
interface OnChainConfig {
  contractAddress: string;
  rpcUrl: string;
  chainId: number;
  gasLimit?: number;
  gasPrice?: string;
}

/**
 * OnChainMatchStorage - Manages blockchain storage of match results
 * Singleton pattern for consistent blockchain interaction
 */
class OnChainMatchStorage {
  private static instance: OnChainMatchStorage;
  private config: OnChainConfig | null = null;
  private txCache: Map<string, OnChainTransaction> = new Map();
  private resultCache: Map<string, OnChainMatchSummary> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): OnChainMatchStorage {
    if (!OnChainMatchStorage.instance) {
      OnChainMatchStorage.instance = new OnChainMatchStorage();
    }
    return OnChainMatchStorage.instance;
  }

  /**
   * Initialize blockchain configuration
   * Must be called before storing matches
   */
  initialize(config: OnChainConfig): void {
    this.config = config;
    console.log(`OnChainMatchStorage initialized for chain ${config.chainId}`);
  }

  /**
   * Create match summary from full match log
   * Extracts only essential data for blockchain storage
   */
  createMatchSummary(match: MatchLog): OnChainMatchSummary {
    // Find top scorer
    let topScorer = '';
    let topScorerGoals = 0;
    Object.entries(match.playerStats).forEach(([player, stats]) => {
      if (stats.goals > topScorerGoals) {
        topScorer = player;
        topScorerGoals = stats.goals;
      }
    });

    // Calculate result hash
    const resultData = {
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.finalScore?.home || 0,
      awayScore: match.finalScore?.away || 0,
      timestamp: match.timestamp,
    };

    return {
      matchId: match.id,
      timestamp: Math.floor(match.timestamp / 1000), // Convert to seconds
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.finalScore?.home || 0,
      awayScore: match.finalScore?.away || 0,
      topScorer: topScorer || undefined,
      topScorerGoals: topScorerGoals > 0 ? topScorerGoals : undefined,
      resultHash: this.hashObject(resultData),
      matchDataHash: this.hashObject(match), // Full match hash for verification
    };
  }

  /**
   * Store match summary to blockchain
   * In production, this would call actual blockchain
   * Currently simulates with local cache
   */
  async storeMatchResult(match: MatchLog): Promise<OnChainTransaction> {
    if (!this.config) {
      throw new Error('OnChainMatchStorage not initialized. Call initialize() first.');
    }

    const summary = this.createMatchSummary(match);

    // Simulate blockchain transaction
    const txHash = this.generateTransactionHash();
    const blockNumber = await this.getLatestBlockNumber();

    const transaction: OnChainTransaction = {
      txHash,
      blockNumber,
      timestamp: Math.floor(Date.now() / 1000),
      contractAddress: this.config.contractAddress,
      matchId: match.id,
      status: 'confirmed', // In production, would track actual status
    };

    // Cache the transaction and summary
    this.txCache.set(match.id, transaction);
    this.resultCache.set(match.id, summary);

    // Persist to localStorage
    this.persistToStorage(match.id, summary, transaction);

    console.log(`Match ${match.id} stored on-chain: ${txHash}`);

    return transaction;
  }

  /**
   * Verify match result against on-chain record
   * Checks if stored hash matches current match data
   */
  async verifyMatchResult(match: MatchLog): Promise<boolean> {
    const summary = this.createMatchSummary(match);
    const storedSummary = this.resultCache.get(match.id);

    if (!storedSummary) {
      const stored = this.loadFromStorage(match.id);
      if (!stored) {
        console.warn(`No on-chain record found for match ${match.id}`);
        return false;
      }
      return stored.summary.resultHash === summary.resultHash;
    }

    // Verify hash matches
    const hashMatch = storedSummary.resultHash === summary.resultHash;

    if (!hashMatch) {
      console.warn(`Hash mismatch for match ${match.id}`);
      console.warn(`Stored: ${storedSummary.resultHash}`);
      console.warn(`Current: ${summary.resultHash}`);
    }

    return hashMatch;
  }

  /**
   * Get on-chain transaction for match
   */
  getTransaction(matchId: string): OnChainTransaction | undefined {
    if (this.txCache.has(matchId)) {
      return this.txCache.get(matchId);
    }
    const stored = this.loadFromStorage(matchId);
    return stored?.transaction;
  }

  /**
   * Get stored summary for match
   */
  getSummary(matchId: string): OnChainMatchSummary | undefined {
    if (this.resultCache.has(matchId)) {
      return this.resultCache.get(matchId);
    }
    const stored = this.loadFromStorage(matchId);
    return stored?.summary;
  }

  /**
   * Get all stored matches
   */
  getAllStoredMatches(): Array<{ matchId: string; summary: OnChainMatchSummary; tx: OnChainTransaction }> {
    const stored: Array<{ matchId: string; summary: OnChainMatchSummary; tx: OnChainTransaction }> = [];

    // From cache
    this.resultCache.forEach((summary, matchId) => {
      const tx = this.txCache.get(matchId);
      if (tx) {
        stored.push({ matchId, summary, tx });
      }
    });

    // From storage
    const keys = Object.keys(localStorage).filter((key) => key.startsWith('on_chain_match_'));
    keys.forEach((key) => {
      const matchId = key.replace('on_chain_match_', '');
      if (!this.resultCache.has(matchId)) {
        const loaded = this.loadFromStorage(matchId);
        if (loaded) {
          stored.push({
            matchId,
            summary: loaded.summary,
            tx: loaded.transaction,
          });
        }
      }
    });

    return stored;
  }

  /**
   * Generate summary report for blockchain record
   */
  generateSummaryReport(summary: OnChainMatchSummary): string {
    const lines = [
      '=== On-Chain Match Summary ===',
      `Match ID: ${summary.matchId}`,
      `Timestamp: ${new Date(summary.timestamp * 1000).toISOString()}`,
      '',
      `${summary.homeTeam} ${summary.homeScore} - ${summary.awayScore} ${summary.awayTeam}`,
      '',
    ];

    if (summary.topScorer) {
      lines.push(`Top Scorer: ${summary.topScorer} (${summary.topScorerGoals} goals)`);
    }

    lines.push('');
    lines.push(`Result Hash: ${summary.resultHash}`);
    if (summary.matchDataHash) {
      lines.push(`Full Data Hash: ${summary.matchDataHash}`);
    }

    return lines.join('\n');
  }

  /**
   * Simple SHA-256 hash simulation
   * In production, use crypto.subtle.digest or ethers.utils.keccak256
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  /**
   * Generate mock transaction hash
   */
  private generateTransactionHash(): string {
    return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  /**
   * Get latest block number
   * Mock implementation
   */
  private async getLatestBlockNumber(): Promise<number> {
    // In production, query blockchain
    return Math.floor(Date.now() / 12000) + 15000000; // Simulate block number
  }

  /**
   * Persist to localStorage
   */
  private persistToStorage(
    matchId: string,
    summary: OnChainMatchSummary,
    transaction: OnChainTransaction
  ): void {
    const key = `on_chain_match_${matchId}`;
    const data = { summary, transaction, storedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(data));
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(matchId: string): { summary: OnChainMatchSummary; transaction: OnChainTransaction } | null {
    const key = `on_chain_match_${matchId}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
}

/**
 * Helper function to create and store match in one call
 */
export async function storeMatchOnChain(match: MatchLog): Promise<OnChainTransaction> {
  const storage = OnChainMatchStorage.getInstance();
  return storage.storeMatchResult(match);
}

/**
 * Helper function to verify match
 */
export async function verifyMatchOnChain(match: MatchLog): Promise<boolean> {
  const storage = OnChainMatchStorage.getInstance();
  return storage.verifyMatchResult(match);
}

/**
 * Helper function to initialize
 */
export function initializeOnChainStorage(config: OnChainConfig): void {
  const storage = OnChainMatchStorage.getInstance();
  storage.initialize(config);
}

export default OnChainMatchStorage;
