// State management utilities for Zustand
import { create } from 'zustand';

export interface GameStore {
  matchId: string;
  homeScore: number;
  awayScore: number;
  matchTime: number;
  isLive: boolean;
  setMatchId: (id: string) => void;
  setHomeScore: (score: number) => void;
  setAwayScore: (score: number) => void;
  setMatchTime: (time: number) => void;
  setIsLive: (live: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>(set => ({
  matchId: '',
  homeScore: 0,
  awayScore: 0,
  matchTime: 0,
  isLive: false,
  setMatchId: (id: string) => set({ matchId: id }),
  setHomeScore: (score: number) => set({ homeScore: score }),
  setAwayScore: (score: number) => set({ awayScore: score }),
  setMatchTime: (time: number) => set({ matchTime: time }),
  setIsLive: (live: boolean) => set({ isLive: live }),
  reset: () => set({
    matchId: '',
    homeScore: 0,
    awayScore: 0,
    matchTime: 0,
    isLive: false,
  }),
}));
