// Enhanced game engine with Konami-style features
import { Player, Team, GameState } from './gameEngine';

// Game Modes
export type GameMode = 'quickmatch' | 'myclub' | 'master-league' | 'tournament' | 'online';

// Weather System
export type WeatherType = 'clear' | 'rainy' | 'snowy' | 'foggy' | 'stormy';

export interface WeatherConditions {
  type: WeatherType;
  intensity: number; // 0-1
  windSpeed: number;
  temperature: number;
  affectsBallControl: boolean;
  affectsShot: boolean;
  affectsPassing: boolean;
}

// Match Events
export type EventType = 'goal' | 'miss' | 'save' | 'yellow-card' | 'red-card' | 'injury' | 'substitution' | 'var-review' | 'corner' | 'freekick' | 'penalty' | 'offside';

export interface MatchEvent {
  time: number;
  type: EventType;
  player: Player;
  team: string;
  description: string;
  isReviewed?: boolean;
  var_decision?: 'goal' | 'no-goal' | 'card' | 'no-card';
}

// Tactics System
export interface Tactics {
  defensiveStyle: 'defensive' | 'balanced' | 'attacking';
  buildUpPlay: 'short-pass' | 'long-ball' | 'balanced';
  pressureMode: 'low' | 'medium' | 'high';
  width: number; // 1-10
  depth: number; // 1-10
}

// Player Contract
export interface PlayerContract {
  playerId: string;
  teamId: string;
  salary: number;
  yearsRemaining: number;
  releaseClause: number;
  loyalty: number; // 0-100
  minPlaying: number; // Minimum appearances expected
  bonusGoals: number;
  bonusAssists: number;
}

// Season/Career Mode
export interface Season {
  year: number;
  currentWeek: number;
  matches: ScheduledMatch[];
  standings: Standings[];
  budget: number;
  scouts: Scout[];
}

export interface ScheduledMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  week: number;
  played: boolean;
  result?: {
    home: number;
    away: number;
  };
}

export interface Standings {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface Scout {
  name: string;
  scouting: number; // Stat
  reputation: number;
  discoveredPlayers: string[];
}

// Training System
export interface TrainingSession {
  playerId: string;
  type: 'shooting' | 'passing' | 'defense' | 'dribbling' | 'pace' | 'strength';
  duration: number; // minutes
  effectiveness: number; // 0-1
  improvement: number; // stat increase
  fatigueGain: number;
}

// Tournament Structure
export interface Tournament {
  id: string;
  name: string;
  type: 'league' | 'cup' | 'champions';
  teams: string[];
  currentRound: number;
  matches: TournamentMatch[];
  winner?: string;
}

export interface TournamentMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  round: number;
  result?: {
    home: number;
    away: number;
    penalty?: boolean;
  };
  played: boolean;
}

// Stadium
export interface Stadium {
  id: string;
  name: string;
  capacity: number;
  condition: number; // 0-100
  atmosphere: number; // affects home advantage
  pitch: 'perfect' | 'good' | 'worn' | 'poor';
  homeTeamId: string;
}

// Commentary System
export const COMMENTARY_EVENTS = {
  goal: [
    'GOOOOAL! What a finish!',
    'GOOOOAL! They needed that!',
    'GOOOOAL! Absolutely brilliant!',
    'GOOOOAL! The net bulges!',
  ],
  miss: [
    'He should have scored!',
    'That was wasteful!',
    'So close! Wide!',
    'Shocking miss!',
  ],
  save: [
    'Fantastic save!',
    'What a save!',
    'Excellent goalkeeping!',
    'He kept his team in it!',
  ],
  injury: [
    'Oh no, he looks injured!',
    'We need the medical team here!',
    'That looks serious!',
  ],
  card: [
    'That\'s a yellow card!',
    'That\'s definitely a red card!',
    'The referee has to take action!',
  ],
};

// Match Statistics
export interface MatchStats {
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  possession: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passAccuracy: number;
  tackles: number;
  fouls: number;
  corners: number;
  offsides: number;
}

export interface TeamStats {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passAccuracy: number;
  tackles: number;
  fouls: number;
  corners: number;
  offsides: number;
  injuries: string[];
  redCards: string[];
  yellowCards: string[];
}

// Player Performance Rating
export interface PlayerPerformance {
  playerId: string;
  matchId: string;
  rating: number; // 5.0-10.0
  goals: number;
  assists: number;
  passes: number;
  passAccuracy: number;
  tackles: number;
  interceptions: number;
  fouls: number;
  shots: number;
  shotsOnTarget: number;
}

// Enhanced Game State
export interface EnhancedGameState extends GameState {
  mode: GameMode;
  weather: WeatherConditions;
  matchEvents: MatchEvent[];
  tactics: {
    home: Tactics;
    away: Tactics;
  };
  matchStats: MatchStats;
  commentary: string[];
  var_available: boolean;
  var_review_in_progress: boolean;
  stadium: Stadium;
  attendance: number;
  season?: Season;
}

// Difficulty Settings
export interface GameDifficulty {
  name: string;
  aiLevel: number; // 1-10
  playerSpeedBoost: number;
  injuryRate: number;
  cardRate: number;
}

export const DIFFICULTIES = {
  amateur: { name: 'Amateur', aiLevel: 2, playerSpeedBoost: 1.1, injuryRate: 0.02, cardRate: 0.05 },
  professional: { name: 'Professional', aiLevel: 6, playerSpeedBoost: 1.0, injuryRate: 0.05, cardRate: 0.15 },
  legendary: { name: 'Legendary', aiLevel: 10, playerSpeedBoost: 0.95, injuryRate: 0.08, cardRate: 0.25 },
};

// Helper functions for Konami features

export function getWeatherEffect(weather: WeatherConditions, stat: string): number {
  let multiplier = 1.0;
  
  if (weather.type === 'rainy') {
    if (stat === 'passing') multiplier = 0.9;
    if (stat === 'dribbling') multiplier = 0.85;
    if (stat === 'shooting') multiplier = 0.95;
  } else if (weather.type === 'snowy') {
    multiplier = 0.8;
  } else if (weather.type === 'foggy') {
    if (stat === 'passing') multiplier = 0.85;
  } else if (weather.type === 'stormy') {
    multiplier = 0.75;
  }
  
  return multiplier;
}

export function calculateCardRisk(player: Player, intensity: 'low' | 'medium' | 'high'): number {
  const baseRisk = 0.05;
  const defenseMultiplier = 1 - player.defense / 200;
  const intensityMap = { low: 0.5, medium: 1.0, high: 1.5 };
  
  return baseRisk * defenseMultiplier * intensityMap[intensity];
}

export function calculateInjuryRisk(player: Player, fatigue: number): number {
  const baseRisk = 0.02;
  const fatigueMultiplier = fatigue / 100;
  const physicalResistance = player.physical / 100;
  
  return baseRisk * fatigueMultiplier / physicalResistance;
}

export function calculateFormBonus(recentPerformance: number[]): number {
  if (recentPerformance.length === 0) return 1.0;
  
  const average = recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length;
  return 0.9 + (average / 10) * 0.2; // Range 0.9-1.1
}

export function getStadiumBonus(stadium: Stadium, isHome: boolean): number {
  if (!isHome) return 1.0;
  
  const atmosphereBonus = stadium.atmosphere / 100 * 0.05;
  const capacityBonus = Math.min(stadium.capacity / 100000, 1) * 0.03;
  
  return 1.0 + atmosphereBonus + capacityBonus;
}

export function generateMatchCommentary(event: MatchEvent): string {
  const comments = COMMENTARY_EVENTS[event.type] || [];
  return comments[Math.floor(Math.random() * comments.length)] || event.description;
}
