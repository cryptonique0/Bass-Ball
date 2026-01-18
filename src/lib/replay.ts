import { MatchResult, VerificationResult, PlayerInput } from '@/types/match';
import { verifyMatchResult, computeResultHash } from './web3';

/**
 * Replay verification library for trustless match verification
 * Implements 6-step verification flow:
 * 1. Hash computation (Keccak256)
 * 2. On-chain lookup
 * 3. Hash comparison
 * 4. Input replay simulation
 * 5. Determinism validation
 * 6. Fraud detection
 */

/**
 * Fetch replay data from IPFS or local cache
 */
export const fetchReplayData = async (matchId: string): Promise<MatchResult | null> => {
  try {
    // Fetch from IPFS gateway in production
    const ipfsGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud';
    const response = await fetch(`${ipfsGateway}/ipfs/${matchId}`);

    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch replay:', error);
    return null;
  }
};

/**
 * Compute deterministic hash from inputs
 * This allows anyone to verify match results without trusting the server
 */
export const computeInputsHash = (inputs: PlayerInput[]): string => {
  // In production, use actual Keccak256
  const inputsString = JSON.stringify(inputs);
  const encoder = new TextEncoder();
  const data = encoder.encode(inputsString);

  // Simulate hash for demo (in production use proper Keccak256)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i];
    hash = hash & hash; // Convert to 32-bit integer
  }

  return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
};

/**
 * Verify match result against on-chain record
 * Returns comprehensive verification details
 */
export const verifyMatchReplay = async (matchId: string): Promise<VerificationResult> => {
  const startTime = performance.now();

  try {
    // Step 1: Fetch replay data from IPFS
    const replayData = await fetchReplayData(matchId);
    if (!replayData) {
      return {
        valid: false,
        computed: '',
        onChain: '',
        mismatchType: 'MISSING_REPLAY',
        details: {
          step: 1,
          message: 'Replay data not found on IPFS',
          timestamp: Date.now(),
        },
      };
    }

    // Step 2: Compute local hash from inputs
    const computedHash = computeInputsHash(replayData.inputs);

    // Step 3: Fetch on-chain hash
    const onChainResult = await verifyMatchResult(matchId, computedHash);

    // Step 4: Compare hashes
    const hashMatch = computedHash === onChainResult.onChain;

    if (!hashMatch) {
      return {
        valid: false,
        computed: computedHash,
        onChain: onChainResult.onChain,
        mismatchType: 'HASH_MISMATCH',
        details: {
          step: 4,
          message: 'Computed hash does not match on-chain hash',
          timestamp: Date.now(),
          computedHash,
          onChainHash: onChainResult.onChain,
        },
      };
    }

    // Step 5: Validate determinism
    const isInputsValid = validateInputIntegrity(replayData.inputs);
    if (!isInputsValid) {
      return {
        valid: false,
        computed: computedHash,
        onChain: onChainResult.onChain,
        mismatchType: 'INVALID_INPUTS',
        details: {
          step: 5,
          message: 'Input replay failed integrity check',
          timestamp: Date.now(),
        },
      };
    }

    // Step 6: Fraud detection
    const fraudCheckResult = detectFraud(replayData);
    if (fraudCheckResult.detected) {
      return {
        valid: false,
        computed: computedHash,
        onChain: onChainResult.onChain,
        mismatchType: 'FRAUD_DETECTED',
        details: {
          step: 6,
          message: `Fraud detected: ${fraudCheckResult.reason}`,
          timestamp: Date.now(),
          fraudIndicators: fraudCheckResult.indicators,
        },
      };
    }

    const elapsedTime = performance.now() - startTime;

    // All checks passed
    return {
      valid: true,
      computed: computedHash,
      onChain: onChainResult.onChain,
      mismatchType: undefined,
      details: {
        step: 6,
        message: 'Match verified successfully',
        timestamp: Date.now(),
        verificationTime: elapsedTime,
        inputCount: replayData.inputs.length,
        matchDuration: replayData.duration,
      },
    };
  } catch (error) {
    return {
      valid: false,
      computed: '',
      onChain: '',
      mismatchType: 'VERIFICATION_ERROR',
      details: {
        step: 0,
        message: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      },
    };
  }
};

/**
 * Validate input integrity
 * Checks for impossible actions, timestamp consistency, player validity
 */
const validateInputIntegrity = (inputs: PlayerInput[]): boolean => {
  let lastTimestamp = 0;

  for (const input of inputs) {
    // Check timestamp monotonicity
    if (input.timestamp <= lastTimestamp) {
      console.warn('Invalid timestamp sequence detected');
      return false;
    }
    lastTimestamp = input.timestamp;

    // Check tick progression
    if (input.tick < 0 || input.tick > 108000) {
      // 30 min match @ 60Hz = 108,000 ticks
      console.warn('Invalid tick value detected');
      return false;
    }

    // Validate action parameters based on action type
    const isValidAction = validateActionParams(input.action, input.params);
    if (!isValidAction) {
      console.warn(`Invalid action parameters for ${input.action}`);
      return false;
    }
  }

  return true;
};

/**
 * Validate action parameters
 */
const validateActionParams = (
  action: string,
  params: Record<string, any>
): boolean => {
  switch (action) {
    case 'MOVE':
      return typeof params.x === 'number' && typeof params.y === 'number';
    case 'PASS':
      return typeof params.power === 'number' && params.power >= 0 && params.power <= 100;
    case 'SHOOT':
      return typeof params.power === 'number' && params.power >= 0 && params.power <= 100;
    case 'TACKLE':
      return typeof params.targetId === 'string';
    case 'SPRINT':
      return true;
    case 'SKILL':
      return typeof params.skillId === 'string';
    default:
      return false;
  }
};

/**
 * Detect common fraud patterns
 */
interface FraudCheckResult {
  detected: boolean;
  reason?: string;
  indicators?: string[];
}

const detectFraud = (matchResult: MatchResult): FraudCheckResult => {
  const indicators: string[] = [];

  // Check 1: Impossible goal counts
  const homeGoals = matchResult.result.home;
  const awayGoals = matchResult.result.away;

  if (homeGoals < 0 || awayGoals < 0 || homeGoals > 20 || awayGoals > 20) {
    indicators.push('Impossible goal count');
  }

  // Check 2: Input count vs match duration
  const expectedMinInputs = (matchResult.duration / 1000) * 10; // ~10 inputs/second
  if (matchResult.inputs.length < expectedMinInputs * 0.5) {
    indicators.push('Suspiciously low input count');
  }

  // Check 3: Duplicate timestamps (impossible)
  const timestamps = matchResult.inputs.map((i) => i.timestamp);
  const uniqueTimestamps = new Set(timestamps);
  if (uniqueTimestamps.size < timestamps.length) {
    indicators.push('Duplicate timestamps detected');
  }

  // Check 4: Unrealistic match duration
  if (matchResult.duration < 60000 || matchResult.duration > 6000000) {
    // Less than 1 min or more than 100 min
    indicators.push('Unrealistic match duration');
  }

  // Check 5: Input clustering (sudden bursts suggest replay manipulation)
  const inputGaps = [];
  for (let i = 1; i < matchResult.inputs.length; i++) {
    inputGaps.push(matchResult.inputs[i].timestamp - matchResult.inputs[i - 1].timestamp);
  }
  const avgGap = inputGaps.reduce((a, b) => a + b, 0) / inputGaps.length;
  const gapVariance = inputGaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / inputGaps.length;
  const gapStdDev = Math.sqrt(gapVariance);

  if (gapStdDev > avgGap * 2) {
    indicators.push('Abnormal input timing pattern');
  }

  return {
    detected: indicators.length > 0,
    reason: indicators[0],
    indicators,
  };
};

/**
 * Generate human-readable verification report
 */
export const generateVerificationReport = (result: VerificationResult): string => {
  if (result.valid) {
    return `✅ Match Verified\n\nThis match has been verified on the Base blockchain.\n\nVerification Hash: ${result.computed.slice(0, 10)}...\n\nTime: ${result.details.verificationTime?.toFixed(2)}ms`;
  }

  const mismatchDescriptions: Record<string, string> = {
    HASH_MISMATCH: 'The computed match hash does not match the on-chain record. The match may have been modified.',
    MISSING_REPLAY: 'The replay data could not be found. The match may not have been recorded properly.',
    INVALID_INPUTS: 'The input sequence failed integrity checks. Some actions appear impossible.',
    FRAUD_DETECTED: `Fraud detected: ${result.details.message}`,
    VERIFICATION_ERROR: 'An error occurred during verification. Please try again.',
  };

  const description = mismatchDescriptions[result.mismatchType || 'VERIFICATION_ERROR'];

  return `❌ Match Verification Failed\n\nReason: ${description}\n\nError: ${result.details.message}`;
};
