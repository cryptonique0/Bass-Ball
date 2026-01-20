// Type definitions for player and team
export interface PlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
}

export interface Player {
  id: string;
  name: string;
  position: 'GK' | 'LB' | 'CB' | 'RB' | 'LM' | 'CM' | 'RM' | 'LW' | 'ST' | 'RW' | 'CAM';
  number: number;
  age: number;
  nationality: string;
  stats: PlayerStats;
  stamina: number;
  morale: number;
  condition: 'fit' | 'fair' | 'poor';
  isOnPitch: boolean;
  joinedAt: number;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  logo?: string;
  players: Player[];
  formation: string;
  manager: string;
  createdAt: number;
}

export interface TeamFormation {
  name: string;
  description: string;
  positions: { position: string; x: number; y: number }[];
}
