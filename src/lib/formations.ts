/**
 * Formation management system for team tactics
 * 
 * Provides predefined tactical formations with player positioning,
 * tactical attributes, and role assignments.
 */

/** Supported formation types */
export type FormationType =
  | '4-3-3'
  | '4-2-3-1'
  | '3-5-2'
  | '5-3-2'
  | '4-4-2'
  | '3-4-3';

/**
 * Player position within a formation
 * Coordinates are normalized (0-1) representing position on field
 */
export interface PlayerPosition {
  /** Position abbreviation (e.g., 'ST', 'CM', 'GK') */
  position: string;
  /** X coordinate (0 = left, 1 = right) */
  x: number;
  /** Y coordinate (0 = goalkeeper, 1 = attackers) */
  y: number;
  /** Role type (Keeper, Defender, Midfielder, Forward) */
  role: 'Keeper' | 'Defender' | 'Midfielder' | 'Forward';
}

/**
 * Complete formation definition with positioning and tactical attributes
 */
export interface Formation {
  /** Formation type identifier */
  type: FormationType;
  /** Display name */
  name: string;
  /** Tactical description */
  description: string;
  /** Player positions (always 11 for starting lineup) */
  positions: PlayerPosition[];
  /** Offensive mindset (0 = very defensive, 10 = very attacking) */
  aggressiveness: number;
  /** Defensive solidity (0 = weak defense, 10 = strong defense) */
  defenseFocus: number;
}

export const FORMATIONS: Record<FormationType, Formation> = {
  '4-3-3': {
    type: '4-3-3',
    name: 'Classic 4-3-3',
    description: 'Balanced formation with 3 attackers',
    positions: [
      { position: 'GK', x: 0.5, y: 0.05, role: 'Keeper' },
      { position: 'CB', x: 0.25, y: 0.2, role: 'Defender' },
      { position: 'CB', x: 0.75, y: 0.2, role: 'Defender' },
      { position: 'RB', x: 0.9, y: 0.3, role: 'Defender' },
      { position: 'LB', x: 0.1, y: 0.3, role: 'Defender' },
      { position: 'CDM', x: 0.5, y: 0.45, role: 'Midfielder' },
      { position: 'CM', x: 0.3, y: 0.55, role: 'Midfielder' },
      { position: 'CM', x: 0.7, y: 0.55, role: 'Midfielder' },
      { position: 'LW', x: 0.15, y: 0.75, role: 'Forward' },
      { position: 'ST', x: 0.5, y: 0.9, role: 'Forward' },
      { position: 'RW', x: 0.85, y: 0.75, role: 'Forward' },
    ],
    aggressiveness: 7,
    defenseFocus: 5,
  },
  '4-2-3-1': {
    type: '4-2-3-1',
    name: 'Defensive 4-2-3-1',
    description: 'Two defensive midfielders',
    positions: [
      { position: 'GK', x: 0.5, y: 0.05, role: 'Keeper' },
      { position: 'CB', x: 0.25, y: 0.2, role: 'Defender' },
      { position: 'CB', x: 0.75, y: 0.2, role: 'Defender' },
      { position: 'RB', x: 0.9, y: 0.3, role: 'Defender' },
      { position: 'LB', x: 0.1, y: 0.3, role: 'Defender' },
      { position: 'CDM', x: 0.35, y: 0.45, role: 'Midfielder' },
      { position: 'CDM', x: 0.65, y: 0.45, role: 'Midfielder' },
      { position: 'CAM', x: 0.5, y: 0.6, role: 'Midfielder' },
      { position: 'LM', x: 0.2, y: 0.65, role: 'Midfielder' },
      { position: 'RM', x: 0.8, y: 0.65, role: 'Midfielder' },
      { position: 'ST', x: 0.5, y: 0.85, role: 'Forward' },
    ],
    aggressiveness: 5,
    defenseFocus: 8,
  },
  '3-5-2': {
    type: '3-5-2',
    name: 'Wing-back 3-5-2',
    description: 'Three center backs with wing backs',
    positions: [
      { position: 'GK', x: 0.5, y: 0.05, role: 'Keeper' },
      { position: 'CB', x: 0.2, y: 0.2, role: 'Defender' },
      { position: 'CB', x: 0.5, y: 0.15, role: 'Defender' },
      { position: 'CB', x: 0.8, y: 0.2, role: 'Defender' },
      { position: 'WB', x: 0.05, y: 0.45, role: 'Midfielder' },
      { position: 'CM', x: 0.35, y: 0.55, role: 'Midfielder' },
      { position: 'CM', x: 0.65, y: 0.55, role: 'Midfielder' },
      { position: 'WB', x: 0.95, y: 0.45, role: 'Midfielder' },
      { position: 'ST', x: 0.35, y: 0.8, role: 'Forward' },
      { position: 'ST', x: 0.65, y: 0.8, role: 'Forward' },
    ],
    aggressiveness: 6,
    defenseFocus: 6,
  },
  '5-3-2': {
    type: '5-3-2',
    name: 'Defensive 5-3-2',
    description: 'Five defenders, very defensive',
    positions: [
      { position: 'GK', x: 0.5, y: 0.05, role: 'Keeper' },
      { position: 'CB', x: 0.15, y: 0.2, role: 'Defender' },
      { position: 'CB', x: 0.35, y: 0.15, role: 'Defender' },
      { position: 'CB', x: 0.5, y: 0.18, role: 'Defender' },
      { position: 'CB', x: 0.65, y: 0.15, role: 'Defender' },
      { position: 'CB', x: 0.85, y: 0.2, role: 'Defender' },
      { position: 'CM', x: 0.3, y: 0.5, role: 'Midfielder' },
      { position: 'CM', x: 0.5, y: 0.55, role: 'Midfielder' },
      { position: 'CM', x: 0.7, y: 0.5, role: 'Midfielder' },
      { position: 'ST', x: 0.4, y: 0.8, role: 'Forward' },
      { position: 'ST', x: 0.6, y: 0.8, role: 'Forward' },
    ],
    aggressiveness: 3,
    defenseFocus: 10,
  },
  '4-4-2': {
    type: '4-4-2',
    name: 'Classic 4-4-2',
    description: 'Traditional balanced formation',
    positions: [
      { position: 'GK', x: 0.5, y: 0.05, role: 'Keeper' },
      { position: 'CB', x: 0.25, y: 0.2, role: 'Defender' },
      { position: 'CB', x: 0.75, y: 0.2, role: 'Defender' },
      { position: 'RB', x: 0.9, y: 0.3, role: 'Defender' },
      { position: 'LB', x: 0.1, y: 0.3, role: 'Defender' },
      { position: 'RM', x: 0.85, y: 0.55, role: 'Midfielder' },
      { position: 'CM', x: 0.35, y: 0.55, role: 'Midfielder' },
      { position: 'CM', x: 0.65, y: 0.55, role: 'Midfielder' },
      { position: 'LM', x: 0.15, y: 0.55, role: 'Midfielder' },
      { position: 'ST', x: 0.4, y: 0.8, role: 'Forward' },
      { position: 'ST', x: 0.6, y: 0.8, role: 'Forward' },
    ],
    aggressiveness: 6,
    defenseFocus: 5,
  },
  '3-4-3': {
    type: '3-4-3',
    name: 'Attacking 3-4-3',
    description: 'Three attackers, very offensive',
    positions: [
      { position: 'GK', x: 0.5, y: 0.05, role: 'Keeper' },
      { position: 'CB', x: 0.2, y: 0.2, role: 'Defender' },
      { position: 'CB', x: 0.5, y: 0.15, role: 'Defender' },
      { position: 'CB', x: 0.8, y: 0.2, role: 'Defender' },
      { position: 'RM', x: 0.9, y: 0.4, role: 'Midfielder' },
      { position: 'CM', x: 0.35, y: 0.55, role: 'Midfielder' },
      { position: 'CM', x: 0.65, y: 0.55, role: 'Midfielder' },
      { position: 'LM', x: 0.1, y: 0.4, role: 'Midfielder' },
      { position: 'LW', x: 0.15, y: 0.75, role: 'Forward' },
      { position: 'ST', x: 0.5, y: 0.85, role: 'Forward' },
      { position: 'RW', x: 0.85, y: 0.75, role: 'Forward' },
    ],
    aggressiveness: 9,
    defenseFocus: 3,
  },
};

export class FormationManager {
  private currentFormation: Formation;

  constructor(formationType: FormationType = '4-3-3') {
    this.currentFormation = { ...FORMATIONS[formationType] };
  }

  /**
   * Change formation
   */
  changeFormation(formationType: FormationType): void {
    this.currentFormation = { ...FORMATIONS[formationType] };
  }

  /**
   * Get current formation
   */
  getFormation(): Formation {
    return { ...this.currentFormation };
  }

  /**
   * Get player position for a player index
   */
  getPlayerPosition(playerIndex: number): PlayerPosition | null {
    if (playerIndex < 0 || playerIndex >= this.currentFormation.positions.length) {
      return null;
    }
    return { ...this.currentFormation.positions[playerIndex] };
  }

  /**
   * Get all positions
   */
  getAllPositions(): PlayerPosition[] {
    return this.currentFormation.positions.map((p) => ({ ...p }));
  }

  /**
   * Adjust aggressiveness
   */
  adjustAggressiveness(delta: number): void {
    this.currentFormation.aggressiveness = Math.max(
      0,
      Math.min(10, this.currentFormation.aggressiveness + delta)
    );
  }

  /**
   * Adjust defense focus
   */
  adjustDefenseFocus(delta: number): void {
    this.currentFormation.defenseFocus = Math.max(
      0,
      Math.min(10, this.currentFormation.defenseFocus + delta)
    );
  }
}
