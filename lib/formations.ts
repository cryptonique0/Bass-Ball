import { Player } from './gameEngine';

export type FormationType = '4-3-3' | '4-4-2' | '3-5-2' | '5-3-2' | '4-2-3-1';

export interface FormationConfig {
  name: string;
  description: string;
  positions: {
    GK: number;  // Goalkeeper
    DEF: number; // Defenders
    MID: number; // Midfielders
    FWD: number; // Forwards
  };
  layout: Array<{
    row: number;
    count: number;
  }>;
}

export const FORMATIONS: Record<FormationType, FormationConfig> = {
  '4-3-3': {
    name: '4-3-3',
    description: 'Balanced - 4 defenders, 3 midfielders, 3 forwards. Great for possession and control.',
    positions: { GK: 1, DEF: 4, MID: 3, FWD: 3 },
    layout: [
      { row: 0, count: 1 },  // GK
      { row: 1, count: 4 },  // DEF
      { row: 2, count: 3 },  // MID
      { row: 3, count: 3 },  // FWD
    ],
  },
  '4-4-2': {
    name: '4-4-2',
    description: 'Classic - 4 defenders, 4 midfielders, 2 forwards. Solid defense with width.',
    positions: { GK: 1, DEF: 4, MID: 4, FWD: 2 },
    layout: [
      { row: 0, count: 1 },  // GK
      { row: 1, count: 4 },  // DEF
      { row: 2, count: 4 },  // MID
      { row: 3, count: 2 },  // FWD
    ],
  },
  '3-5-2': {
    name: '3-5-2',
    description: 'Modern - 3 defenders, 5 midfielders, 2 forwards. Emphasis on midfield control.',
    positions: { GK: 1, DEF: 3, MID: 5, FWD: 2 },
    layout: [
      { row: 0, count: 1 },  // GK
      { row: 1, count: 3 },  // DEF
      { row: 2, count: 5 },  // MID
      { row: 3, count: 2 },  // FWD
    ],
  },
  '5-3-2': {
    name: '5-3-2',
    description: 'Defensive - 5 defenders, 3 midfielders, 2 forwards. Maximum defensive security.',
    positions: { GK: 1, DEF: 5, MID: 3, FWD: 2 },
    layout: [
      { row: 0, count: 1 },  // GK
      { row: 1, count: 5 },  // DEF
      { row: 2, count: 3 },  // MID
      { row: 3, count: 2 },  // FWD
    ],
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    description: 'Tactical - 4 defenders, 2 defensive mids, 3 attacking mids, 1 striker. Flexible and versatile.',
    positions: { GK: 1, DEF: 4, MID: 5, FWD: 1 },
    layout: [
      { row: 0, count: 1 },  // GK
      { row: 1, count: 4 },  // DEF
      { row: 2, count: 2 },  // DEF-MID
      { row: 3, count: 3 },  // ATT-MID
      { row: 4, count: 1 },  // FWD
    ],
  },
};

/**
 * Apply a formation to a team's players by repositioning them on the pitch
 * Pitch dimensions: 1050x680
 */
export function applyFormation(
  players: Player[],
  formation: FormationType,
  isHomeTeam: boolean
): Player[] {
  const config = FORMATIONS[formation];
  
  // Separate players by position
  const byPosition = {
    GK: players.filter(p => p.position === 'GK'),
    DEF: players.filter(p => p.position === 'DEF'),
    MID: players.filter(p => p.position === 'MID'),
    FWD: players.filter(p => p.position === 'FWD'),
  };

  const updated: Player[] = [];
  let positionIndex = { GK: 0, DEF: 0, MID: 0, FWD: 0 };

  // Calculate pitch zones based on home/away
  const pitchWidth = 1050;
  const pitchHeight = 680;
  const centerLine = pitchWidth / 2;
  
  // Home team defends left side (x: 50-250), Away team defends right side (x: 800-1000)
  const teamSide = isHomeTeam ? 1 : -1; // 1 for home (left side), -1 for away (right side)

  // Process each row of the formation
  for (const row of config.layout) {
    const playerCount = row.count;
    const positionType = getPositionTypeForRow(row.row, config);
    
    const playersForRow = byPosition[positionType as keyof typeof byPosition].slice(
      positionIndex[positionType as keyof typeof positionIndex],
      positionIndex[positionType as keyof typeof positionIndex] + playerCount
    );

    positionIndex[positionType as keyof typeof positionIndex] += playersForRow.length;

    // Position players in this row
    playersForRow.forEach((player, idx) => {
      const verticalPos = calculateVerticalPosition(row.row, idx, playerCount);
      const horizontalPos = calculateHorizontalPosition(row.row, isHomeTeam);

      updated.push({
        ...player,
        x: horizontalPos,
        y: verticalPos,
      });
    });
  }

  return updated;
}

/**
 * Determine which position type should be in a given formation row
 */
function getPositionTypeForRow(rowIndex: number, config: FormationConfig): string {
  if (rowIndex === 0) return 'GK';
  
  let count = 1; // After GK
  if (rowIndex <= count) return 'GK';
  
  count += config.positions.DEF;
  if (rowIndex <= count) return 'DEF';
  
  count += config.positions.MID;
  if (rowIndex <= count) return 'MID';
  
  return 'FWD';
}

/**
 * Calculate vertical position on pitch (y coordinate)
 * Distributes players evenly across the vertical space
 */
function calculateVerticalPosition(rowIndex: number, playerIndex: number, playerCount: number): number {
  const pitchHeight = 680;
  const topMargin = 50;
  const bottomMargin = 50;
  const availableHeight = pitchHeight - topMargin - bottomMargin;

  if (playerCount === 1) {
    return pitchHeight / 2; // Center
  }

  const spacing = availableHeight / (playerCount + 1);
  return topMargin + spacing * (playerIndex + 1);
}

/**
 * Calculate horizontal position on pitch (x coordinate)
 * Positions based on formation row depth
 */
function calculateHorizontalPosition(rowIndex: number, isHomeTeam: boolean): number {
  const pitchWidth = 1050;
  
  // Define depth zones for each row
  const depths = [
    50,      // GK (goal line)
    180,     // Defense
    350,     // Midfield
    550,     // Attack
    800,     // Forward positions
  ];

  const depth = depths[Math.min(rowIndex, depths.length - 1)];
  
  // Home team on left (attacking right toward x=1000)
  // Away team on right (attacking left toward x=50)
  return isHomeTeam ? depth : pitchWidth - depth;
}

/**
 * Get all available formations
 */
export function getAvailableFormations(): Array<{ type: FormationType; config: FormationConfig }> {
  return Object.entries(FORMATIONS).map(([type, config]) => ({
    type: type as FormationType,
    config,
  }));
}
