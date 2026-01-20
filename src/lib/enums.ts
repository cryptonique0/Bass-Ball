// Enum definitions for the game
export enum PlayerPosition {
  GK = 'GK',
  LB = 'LB',
  CB = 'CB',
  RB = 'RB',
  LM = 'LM',
  CM = 'CM',
  RM = 'RM',
  LW = 'LW',
  ST = 'ST',
  RW = 'RW',
  CAM = 'CAM',
}

export enum MatchState {
  IDLE = 'idle',
  LOADING = 'loading',
  FIRST_HALF = 'first_half',
  HALF_TIME = 'half_time',
  SECOND_HALF = 'second_half',
  FULL_TIME = 'full_time',
  ERROR = 'error',
}

export enum EventType {
  GOAL = 'goal',
  ASSIST = 'assist',
  TACKLE = 'tackle',
  FOUL = 'foul',
  YELLOW_CARD = 'yellow_card',
  RED_CARD = 'red_card',
  SUBSTITUTION = 'substitution',
}

export enum Rarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}
