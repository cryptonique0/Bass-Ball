// Zustand store for match state management
import { create } from 'zustand';
import { MatchState, MatchResult, PlayerProfile } from '@/types/match';

interface MatchStoreState {
  // Match state
  currentMatch: MatchState | null;
  matchResult: MatchResult | null;
  isConnected: boolean;
  playerId: string | null;

  // Player data
  playerProfile: PlayerProfile | null;
  isGuest: boolean;
  walletAddress: string | null;

  // UI state
  isMatchStarted: boolean;
  isMatchEnded: boolean;
  showVerification: boolean;
  verificationStatus: 'idle' | 'verifying' | 'verified' | 'failed';

  // Actions
  setCurrentMatch: (match: MatchState) => void;
  updateMatchState: (tick: number, state: Partial<MatchState>) => void;
  setMatchResult: (result: MatchResult) => void;
  setConnected: (connected: boolean) => void;
  setPlayerId: (id: string) => void;
  setPlayerProfile: (profile: PlayerProfile) => void;
  setIsGuest: (isGuest: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  setMatchStarted: (started: boolean) => void;
  setMatchEnded: (ended: boolean) => void;
  setShowVerification: (show: boolean) => void;
  setVerificationStatus: (status: 'idle' | 'verifying' | 'verified' | 'failed') => void;
  reset: () => void;
}

export const useMatchStore = create<MatchStoreState>((set) => ({
  // Initial state
  currentMatch: null,
  matchResult: null,
  isConnected: false,
  playerId: null,
  playerProfile: null,
  isGuest: true,
  walletAddress: null,
  isMatchStarted: false,
  isMatchEnded: false,
  showVerification: false,
  verificationStatus: 'idle',

  // Actions
  setCurrentMatch: (match) => set({ currentMatch: match }),

  updateMatchState: (tick, state) =>
    set((store) => ({
      currentMatch: store.currentMatch
        ? {
            ...store.currentMatch,
            tick,
            ...state,
          }
        : null,
    })),

  setMatchResult: (result) => set({ matchResult: result }),

  setConnected: (connected) => set({ isConnected: connected }),

  setPlayerId: (id) => set({ playerId: id }),

  setPlayerProfile: (profile) => set({ playerProfile: profile }),

  setIsGuest: (isGuest) => set({ isGuest }),

  setWalletAddress: (address) => set({ walletAddress: address }),

  setMatchStarted: (started) => set({ isMatchStarted: started }),

  setMatchEnded: (ended) => set({ isMatchEnded: ended }),

  setShowVerification: (show) => set({ showVerification: show }),

  setVerificationStatus: (status) => set({ verificationStatus: status }),

  reset: () =>
    set({
      currentMatch: null,
      matchResult: null,
      isMatchStarted: false,
      isMatchEnded: false,
      showVerification: false,
      verificationStatus: 'idle',
    }),
}));
