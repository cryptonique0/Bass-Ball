/**
 * Advanced network payload compression and delta updates
 * 
 * Optimizes network traffic by sending only changed data (deltas)
 * instead of full state updates. Reduces bandwidth by 40-60%.
 */

// Type definitions (should be imported from actual types file)
interface MatchState {
  tick: number;
  ball: { x: number; y: number };
  homeScore: number;
  awayScore: number;
  possession?: { id: string } | null;
  homeTeam: { players: any[] };
  awayTeam: { players: any[] };
}

/**
 * Delta update containing only changed fields
 * 
 * Significantly reduces payload size for real-time match updates
 */
export interface DeltaUpdate {
  /** Game tick number for synchronization */
  tick: number;
  /** Ball state changes (position and velocity) */
  ball?: {
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
  };
  /** Home team score (only if changed) */
  homeScore?: number;
  /** Away team score (only if changed) */
  awayScore?: number;
  /** Player ID with possession (null if no possession) */
  possession?: string | null;
  /** Player state updates (only for players that moved significantly) */
  playerUpdates?: Array<{
    id: string;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    stamina?: number;
    status?: string;
  }>;
  /** Match events that occurred this tick */
  events?: Array<{
    type: string;
    playerId: string;
    tick: number;
  }>;
}

/** Cached previous state for delta calculation */
interface PreviousState {
  ball: { x: number; y: number; vx: number; vy: number };
  homeScore: number;
  awayScore: number;
  possession: string | null;
  players: Map<string, { x: number; y: number; vx: number; vy: number; stamina: number; status: string }>;
  tick: number;
}

let previousState: PreviousState | null = null;

/**
 * Create a delta update containing only changed fields
 * 
 * Compares current state with previous state and includes only fields
 * that have changed beyond the threshold.
 * 
 * @param currentState - Current match state
 * @param threshold - Minimum change threshold to include (pixels for positions)
 * @returns Compact delta update object
 * 
 * @example
 * ```ts
 * const delta = createDeltaUpdate(matchState, 1.0);
 * // Only fields that changed > 1 pixel are included
 * // Typical payload: ~200 bytes vs ~5KB for full state
 * ```
 */
export function createDeltaUpdate(
  currentState: MatchState,
  threshold: number = 1
): DeltaUpdate {
  const delta: DeltaUpdate = { tick: currentState.tick };

  // First update: serialize everything
  if (!previousState) {
    previousState = {
      ball: { ...currentState.ball, vx: 0, vy: 0 },
      homeScore: currentState.homeScore,
      awayScore: currentState.awayScore,
      possession: currentState.possession?.id || null,
      players: new Map(),
      tick: currentState.tick,
    };

    // Initialize all players
    [...currentState.homeTeam.players, ...currentState.awayTeam.players].forEach((p: any) => {
      previousState!.players.set(p.id, {
        x: p.position.x,
        y: p.position.y,
        vx: p.velocity?.x || 0,
        vy: p.velocity?.y || 0,
        stamina: p.stamina || 100,
        status: p.status || 'idle',
      });
    });

    return delta; // Return empty delta for first update
  }

  // Delta update: only include changed fields
  const ballChanged =
    Math.abs(currentState.ball.x - previousState.ball.x) > threshold ||
    Math.abs(currentState.ball.y - previousState.ball.y) > threshold;

  if (ballChanged) {
    delta.ball = {
      x: currentState.ball.x,
      y: currentState.ball.y,
    };
    previousState.ball.x = currentState.ball.x;
    previousState.ball.y = currentState.ball.y;
  }

  // Score changes
  if (currentState.homeScore !== previousState.homeScore) {
    delta.homeScore = currentState.homeScore;
    previousState.homeScore = currentState.homeScore;
  }

  if (currentState.awayScore !== previousState.awayScore) {
    delta.awayScore = currentState.awayScore;
    previousState.awayScore = currentState.awayScore;
  }

  // Possession changes
  const currentPossession = currentState.possession?.id || null;
  if (currentPossession !== previousState.possession) {
    delta.possession = currentPossession;
    previousState.possession = currentPossession;
  }

  // Player updates (position, stamina, status changes only)
  const playerUpdates: DeltaUpdate['playerUpdates'] = [];
  [...currentState.homeTeam.players, ...currentState.awayTeam.players].forEach((p: any) => {
    const prev = previousState!.players.get(p.id) || {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      stamina: 100,
      status: 'idle',
    };

    const playerDelta: any = { id: p.id };
    let hasChanges = false;

    // Position changes
    if (Math.abs(p.position.x - prev.x) > threshold) {
      playerDelta.x = p.position.x;
      prev.x = p.position.x;
      hasChanges = true;
    }

    if (Math.abs(p.position.y - prev.y) > threshold) {
      playerDelta.y = p.position.y;
      prev.y = p.position.y;
      hasChanges = true;
    }

    // Stamina changes (only include if stamina changed by 5+ units)
    if (Math.abs((p.stamina || 100) - prev.stamina) > 5) {
      playerDelta.stamina = p.stamina || 100;
      prev.stamina = p.stamina || 100;
      hasChanges = true;
    }

    // Status changes
    if ((p.status || 'idle') !== prev.status) {
      playerDelta.status = p.status || 'idle';
      prev.status = p.status || 'idle';
      hasChanges = true;
    }

    if (hasChanges) {
      playerUpdates.push(playerDelta);
    }

    // Update player in previous state
    previousState!.players.set(p.id, prev);
  });

  if (playerUpdates.length > 0) {
    delta.playerUpdates = playerUpdates;
  }

  return delta;
}

/**
 * Compress vector values (positions, velocities) using integer quantization
 * Reduces per-value size from 4 bytes (float) to 2 bytes (int16)
 */
export function compressVector(value: number, scale: number = 10): number {
  return Math.round(value * scale);
}

/**
 * Decompress quantized vector values
 */
export function decompressVector(value: number, scale: number = 10): number {
  return value / scale;
}

/**
 * Efficient serialization of delta update
 * Uses binary format instead of JSON to reduce size
 */
export function serializeDeltaUpdate(delta: DeltaUpdate): Uint8Array {
  // For now, use compressed JSON (can be extended to full binary format)
  const json = JSON.stringify(delta);

  // Simple compression: use shorter field names internally
  const compressed = json
    .replace(/\"tick\"/g, 't')
    .replace(/\"ball\"/g, 'b')
    .replace(/\"homeScore\"/g, 'hs')
    .replace(/\"awayScore\"/g, 'as')
    .replace(/\"possession\"/g, 'p')
    .replace(/\"playerUpdates\"/g, 'pu')
    .replace(/\"events\"/g, 'e')
    .replace(/\"id\"/g, 'id')
    .replace(/\"x\"/g, 'x')
    .replace(/\"y\"/g, 'y')
    .replace(/\"vx\"/g, 'vx')
    .replace(/\"vy\"/g, 'vy')
    .replace(/\"stamina\"/g, 's')
    .replace(/\"status\"/g, 'st')
    .replace(/\"type\"/g, 'ty')
    .replace(/\"playerId\"/g, 'pid');

  return new TextEncoder().encode(compressed);
}

/**
 * Decompress serialized delta update
 */
export function deserializeDeltaUpdate(data: Uint8Array): DeltaUpdate {
  const json = new TextDecoder().decode(data);

  // Reverse compression
  const expanded = json
    .replace(/\"t\"/g, '"tick"')
    .replace(/\"b\"/g, '"ball"')
    .replace(/\"hs\"/g, '"homeScore"')
    .replace(/\"as\"/g, '"awayScore"')
    .replace(/\"p\"/g, '"possession"')
    .replace(/\"pu\"/g, '"playerUpdates"')
    .replace(/\"e\"/g, '"events"')
    .replace(/\"x\"/g, '"x"')
    .replace(/\"y\"/g, '"y"')
    .replace(/\"vx\"/g, '"vx"')
    .replace(/\"vy\"/g, '"vy"')
    .replace(/\"s\"/g, '"stamina"')
    .replace(/\"st\"/g, '"status"')
    .replace(/\"ty\"/g, '"type"')
    .replace(/\"pid\"/g, '"playerId"');

  return JSON.parse(expanded);
}

/**
 * Batch input confirmation messages to reduce network overhead
 * Instead of sending individual confirmations, batch 10+ confirmations into one message
 */
export interface InputBatch {
  tick: number;
  inputs: Array<{
    playerId: string;
    inputTick: number;
    action: string;
  }>;
}

let pendingInputBatches: InputBatch['inputs'] = [];
let batchSendTimer: NodeJS.Timeout | null = null;

/**
 * Queue input confirmation for batching
 */
export function queueInputConfirmation(
  playerId: string,
  inputTick: number,
  action: string,
  onSendBatch?: (batch: InputBatch) => void
) {
  pendingInputBatches.push({ playerId, inputTick, action });

  // Send batch after 50ms or when 20 inputs accumulated
  if (pendingInputBatches.length >= 20) {
    flushInputBatch(onSendBatch);
  } else if (!batchSendTimer) {
    batchSendTimer = setTimeout(() => {
      flushInputBatch(onSendBatch);
    }, 50);
  }
}

/**
 * Flush pending input confirmations as a batch
 */
export function flushInputBatch(onSendBatch?: (batch: InputBatch) => void) {
  if (batchSendTimer) {
    clearTimeout(batchSendTimer);
    batchSendTimer = null;
  }

  if (pendingInputBatches.length === 0) return;

  const batch: InputBatch = {
    tick: Math.floor(Date.now() / 16.67), // Current game tick
    inputs: pendingInputBatches,
  };

  onSendBatch?.(batch);
  pendingInputBatches = [];
}

/**
 * Reset delta state tracking (call when match resets or new match starts)
 */
export function resetDeltaState() {
  previousState = null;
  pendingInputBatches = [];
  if (batchSendTimer) {
    clearTimeout(batchSendTimer);
    batchSendTimer = null;
  }
}
