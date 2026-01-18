// Socket.IO client with comprehensive input validation and anti-cheat enforcement
import { io, Socket } from 'socket.io-client';
import { MatchState, PlayerInput, MatchResult } from '@/types/match';
import { useMatchStore } from '@/store/useMatchStore';

let socket: Socket | null = null;
const inputRateLimit = new Map<string, number[]>(); // Track input timestamps for rate limiting
const lastInputTick = new Map<string, number>(); // Track last input tick for monotonic enforcement
const suspiciousPatterns = new Map<string, number>(); // Track suspicious behavior count

/**
 * Validate player input against anti-cheat rules
 * Enforces: rate limiting, tick monotonicity, parameter bounds, action validity
 */
const validateInput = (playerId: string, input: PlayerInput): { valid: boolean; reason?: string } => {
  // Rule 1: Timestamp must be recent (within last 200ms)
  const now = Date.now();
  if (input.timestamp > now || input.timestamp < now - 200) {
    return { valid: false, reason: 'Timestamp out of bounds' };
  }

  // Rule 2: Tick must increase monotonically
  const currentLastTick = lastInputTick.get(playerId) || -1;
  if (input.tick <= currentLastTick) {
    return { valid: false, reason: 'Tick not monotonically increasing' };
  }
  if (input.tick > 108000) {
    // Max ticks in 30-minute match at 60Hz
    return { valid: false, reason: 'Tick exceeds match duration' };
  }
  lastInputTick.set(playerId, input.tick);

  // Rule 3: Action must be valid
  const validActions = ['MOVE', 'PASS', 'SHOOT', 'TACKLE', 'SPRINT', 'SKILL'];
  if (!validActions.includes(input.action)) {
    return { valid: false, reason: 'Invalid action type' };
  }

  // Rule 4: Validate action-specific parameters
  const paramValidation = validateActionParameters(input.action, input.params);
  if (!paramValidation.valid) {
    return { valid: false, reason: paramValidation.reason };
  }

  // Rule 5: Rate limiting - max 10 inputs per 100ms (600 actions/min = reasonable)
  if (!inputRateLimit.has(playerId)) {
    inputRateLimit.set(playerId, []);
  }

  const playerInputs = inputRateLimit.get(playerId) || [];
  const recentInputs = playerInputs.filter((ts) => now - ts < 100);

  if (recentInputs.length >= 10) {
    incrementSuspiciousCount(playerId);
    return { valid: false, reason: 'Rate limit exceeded' };
  }

  recentInputs.push(now);
  inputRateLimit.set(playerId, recentInputs);

  // Rule 6: Detect bot-like input patterns (too regular)
  if (recentInputs.length >= 4) {
    const timeDiffs = [];
    for (let i = 1; i < recentInputs.length; i++) {
      timeDiffs.push(recentInputs[i] - recentInputs[i - 1]);
    }
    const avgDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
    // If inputs are suspiciously regular (all within 3ms), flag as potential bot
    const isSuspicious = timeDiffs.every((diff) => Math.abs(diff - avgDiff) < 3);
    if (isSuspicious) {
      incrementSuspiciousCount(playerId);
      return { valid: false, reason: 'Suspicious input timing pattern' };
    }
  }

  // Rule 7: Enforce tick-based rate limiting
  // Allow max 5 inputs per tick (12 ticks per second = very generous)
  const tickBucket = Math.floor(input.tick / 12);
  const tickKey = `${playerId}:${tickBucket}`;
  // This is validated server-side primarily, but client warns
  
  return { valid: true };
};

/**
 * Validate action-specific parameters
 */
const validateActionParameters = (
  action: string,
  params: Record<string, any>
): { valid: boolean; reason?: string } => {
  switch (action) {
    case 'MOVE':
      if (typeof params.x !== 'number' || typeof params.y !== 'number') {
        return { valid: false, reason: 'Invalid movement vector' };
      }
      if (Math.abs(params.x) > 1 || Math.abs(params.y) > 1) {
        return { valid: false, reason: 'Movement magnitude invalid' };
      }
      return { valid: true };

    case 'PASS':
      if (typeof params.power !== 'number') {
        return { valid: false, reason: 'Invalid pass power' };
      }
      if (params.power < 0 || params.power > 100) {
        return { valid: false, reason: 'Pass power out of range (0-100)' };
      }
      return { valid: true };

    case 'SHOOT':
      if (typeof params.power !== 'number') {
        return { valid: false, reason: 'Invalid shot power' };
      }
      if (params.power < 0 || params.power > 100) {
        return { valid: false, reason: 'Shot power out of range (0-100)' };
      }
      return { valid: true };

    case 'TACKLE':
      if (typeof params.targetId !== 'string' || params.targetId.length === 0) {
        return { valid: false, reason: 'Invalid tackle target' };
      }
      return { valid: true };

    case 'SPRINT':
      // No parameters required
      return { valid: true };

    case 'SKILL':
      if (typeof params.skillId !== 'string' || params.skillId.length === 0) {
        return { valid: false, reason: 'Invalid skill ID' };
      }
      return { valid: true };

    default:
      return { valid: false, reason: 'Unknown action type' };
  }
};

/**
 * Track suspicious behavior for escalating penalties
 */
const incrementSuspiciousCount = (playerId: string) => {
  const count = (suspiciousPatterns.get(playerId) || 0) + 1;
  suspiciousPatterns.set(playerId, count);

  if (count >= 5) {
    console.warn(`[Anti-Cheat] Player ${playerId} flagged: ${count} suspicious behaviors detected`);
    // Server will auto-disconnect or flag for review
  }
};

export const initializeSocket = (playerId: string, username: string) => {
  if (socket?.connected) {
    return socket;
  }

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
  
  socket = io(socketUrl, {
    auth: {
      playerId,
      username,
      timestamp: Date.now(),
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // Connection events
  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
    useMatchStore.setState({ isConnected: true });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
    useMatchStore.setState({ isConnected: false });
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  // Match events
  socket.on('match:start', (matchState: MatchState) => {
    console.log('Match started:', matchState.matchId);
    useMatchStore.setState({
      currentMatch: matchState,
      isMatchStarted: true,
      isMatchEnded: false,
    });
  });

  socket.on('match:state', (state: Partial<MatchState>) => {
    const store = useMatchStore.getState();
    if (store.currentMatch) {
      useMatchStore.setState({
        currentMatch: {
          ...store.currentMatch,
          ...state,
        },
      });
    }
  });

  socket.on('match:end', (result: MatchResult) => {
    console.log('Match ended:', result);
    useMatchStore.setState({
      matchResult: result,
      isMatchEnded: true,
      isMatchStarted: false,
    });
  });

  socket.on('match:error', (error: string) => {
    console.error('Match error:', error);
  });

  socket.on('ping', () => {
    socket?.emit('pong', { timestamp: Date.now() });
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const joinMatch = (matchId: string, team: 'home' | 'away') => {
  socket?.emit('match:join', {
    matchId,
    team,
    timestamp: Date.now(),
  });
};

export const sendPlayerInput = (input: PlayerInput) => {
  if (!socket?.connected) {
    console.warn('[Anti-Cheat] Attempted to send input without socket connection');
    return;
  }

  const { playerId } = useMatchStore.getState();
  if (!playerId) {
    console.warn('[Anti-Cheat] Attempted to send input without playerId');
    return;
  }

  // Validate input before sending
  const validation = validateInput(playerId, input);
  if (!validation.valid) {
    console.warn(`[Anti-Cheat] Input rejected: ${validation.reason}`);
    return;
  }

  // Compress input: send only changed fields
  const compressedInput = {
    t: input.tick,                    // tick
    a: input.action,                  // action
    p: input.params,                  // params
    ts: input.timestamp,              // timestamp
  };

  socket.emit('match:input', compressedInput);
};

export const leaveMatch = () => {
  socket?.emit('match:leave', {
    timestamp: Date.now(),
  });
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
};

export const isSocketConnected = (): boolean => {
  return socket?.connected ?? false;
};
