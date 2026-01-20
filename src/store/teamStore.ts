// Team store for state management
import { create } from 'zustand';
import { Team } from '@/types/player';

export interface TeamStore {
  homeTeam: Team | null;
  awayTeam: Team | null;
  setHomeTeam: (team: Team | null) => void;
  setAwayTeam: (team: Team | null) => void;
  swapTeams: () => void;
}

export const useTeamStore = create<TeamStore>(set => ({
  homeTeam: null,
  awayTeam: null,
  
  setHomeTeam: (team: Team | null) => set({ homeTeam: team }),
  setAwayTeam: (team: Team | null) => set({ awayTeam: team }),
  
  swapTeams: () =>
    set(state => ({
      homeTeam: state.awayTeam,
      awayTeam: state.homeTeam,
    })),
}));
