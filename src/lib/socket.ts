// Socket.IO client setup and event handlers
import { io, Socket } from 'socket.io-client';
import { MatchState, PlayerInput, MatchResult } from '@/types/match';
import { useMatchStore } from '@/store/useMatchStore';

let socket: Socket | null = null;

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
  socket?.emit('match:input', input);
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
