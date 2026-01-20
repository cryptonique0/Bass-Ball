// Player store for state management
import { create } from 'zustand';
import { Player } from '@/types/player';

export interface PlayerStore {
  players: Player[];
  selectedPlayerId: string | null;
  addPlayer: (player: Player) => void;
  removePlayer: (id: string) => void;
  updatePlayer: (id: string, player: Partial<Player>) => void;
  selectPlayer: (id: string | null) => void;
  getSelectedPlayer: () => Player | null;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  players: [],
  selectedPlayerId: null,
  
  addPlayer: (player: Player) =>
    set(state => ({
      players: [...state.players, player],
    })),
  
  removePlayer: (id: string) =>
    set(state => ({
      players: state.players.filter(p => p.id !== id),
    })),
  
  updatePlayer: (id: string, updates: Partial<Player>) =>
    set(state => ({
      players: state.players.map(p =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  
  selectPlayer: (id: string | null) =>
    set({ selectedPlayerId: id }),
  
  getSelectedPlayer: () => {
    const state = get();
    return state.players.find(p => p.id === state.selectedPlayerId) || null;
  },
}));
