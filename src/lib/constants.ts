// Game constants and configuration
export const GAME_CONFIG = {
  MAX_PLAYERS: 22,
  MATCH_DURATION: 5400, // 90 minutes in seconds
  HALF_DURATION: 2700,
  TEAM_PLAYERS: 11,
  FIELD_WIDTH: 120,
  FIELD_HEIGHT: 80,
  MAX_STAMINA: 100,
  MIN_STAMINA_TO_SPRINT: 20,
  STAMINA_RECOVERY_RATE: 0.5,
  STAMINA_SPRINT_DRAIN: 2.5,
  STAMINA_JOG_DRAIN: 0.8,
} as const;

export const PLAYER_POSITIONS = ['GK', 'LB', 'CB', 'RB', 'LM', 'CM', 'RM', 'LW', 'ST', 'RW', 'CAM'] as const;

export const PLAYER_STATS = {
  MIN: 1,
  MAX: 99,
  DEFAULT: 75,
} as const;

export const FORMATION_TYPES = ['4-3-3', '4-2-3-1', '3-5-2', '5-3-2', '4-4-2', '3-4-3'] as const;

export const MATCH_STATES = {
  NOT_STARTED: 'not_started',
  FIRST_HALF: 'first_half',
  HALF_TIME: 'half_time',
  SECOND_HALF: 'second_half',
  FULL_TIME: 'full_time',
  PAUSED: 'paused',
} as const;

export const REWARD_MULTIPLIERS = {
  WIN: 3,
  DRAW: 1,
  LOSS: 0,
  CLEAN_SHEET: 1.5,
  ASSIST: 0.5,
  GOAL: 2,
} as const;
