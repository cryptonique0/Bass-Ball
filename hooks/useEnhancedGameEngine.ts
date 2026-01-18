'use client';

import { useState, useCallback, useEffect } from 'react';
import { EnhancedGameEngine, EnhancedGameState, Tactics, WeatherConditions } from '@/lib/enhancedGameEngine';
import { Team, Player } from '@/lib/konamiFeatures';

interface UseEnhancedGameEngineProps {
  homeTeam: Team;
  awayTeam: Team;
  weather?: WeatherConditions;
  difficulty?: 'Amateur' | 'Professional' | 'Legendary';
}

export function useEnhancedGameEngine({
  homeTeam,
  awayTeam,
  weather,
  difficulty = 'Professional',
}: UseEnhancedGameEngineProps) {
  const [engine] = useState(() => new EnhancedGameEngine(homeTeam, awayTeam, weather));
  const [gameState, setGameState] = useState<EnhancedGameState>(engine.getGameState());
  const [isPaused, setIsPaused] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);

  // Main game loop
  useEffect(() => {
    if (isPaused || !gameState.isActive) return;

    const interval = setInterval(() => {
      engine.update(1 / (60 / simulationSpeed));
      setGameState({ ...engine.getGameState() });
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [engine, isPaused, gameState.isActive, simulationSpeed]);

  // Control functions
  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);
  const togglePause = useCallback(() => setIsPaused((prev) => !prev), []);

  const changeTactics = useCallback((tactics: Tactics) => {
    engine.setTactics(tactics);
    setGameState({ ...engine.getGameState() });
  }, [engine]);

  const getMatchStats = useCallback(() => {
    return engine.getMatchStatistics();
  }, [engine]);

  const accelerateSimulation = useCallback(() => {
    setSimulationSpeed((prev) => Math.min(prev + 1, 4));
  }, []);

  const normalizeSimulation = useCallback(() => {
    setSimulationSpeed(1);
  }, []);

  return {
    gameState,
    isPaused,
    pause,
    resume,
    togglePause,
    changeTactics,
    getMatchStats,
    simulationSpeed,
    accelerateSimulation,
    normalizeSimulation,
    difficulty,
  };
}

// Hook for MyClub management
interface MyClubState {
  squadName: string;
  budget: number;
  players: Player[];
  formation: string;
  contracts: Map<string, { endDate: string; weeklyWage: number }>;
  overallRating: number;
}

export function useMyClub(initialBudget: number = 500000) {
  const [clubState, setClubState] = useState<MyClubState>({
    squadName: 'Your Club',
    budget: initialBudget,
    players: [],
    formation: '4-3-3',
    contracts: new Map(),
    overallRating: 0,
  });

  const addPlayer = useCallback(
    (player: Player, wage: number, contractYears: number) => {
      const transferFee = wage * 200;

      if (clubState.budget < transferFee) {
        return false;
      }

      setClubState((prev) => {
        const newPlayers = [...prev.players, player];
        const newContracts = new Map(prev.contracts);
        newContracts.set(player.id || player.name, {
          endDate: new Date(Date.now() + contractYears * 365 * 24 * 60 * 60 * 1000).toISOString(),
          weeklyWage: wage,
        });

        return {
          ...prev,
          players: newPlayers,
          budget: prev.budget - transferFee,
          contracts: newContracts,
          overallRating: calculateOverallRating(newPlayers),
        };
      });

      return true;
    },
    [clubState.budget]
  );

  const removePlayer = useCallback((playerId: string) => {
    setClubState((prev) => {
      const newPlayers = prev.players.filter((p) => (p.id || p.name) !== playerId);
      const newContracts = new Map(prev.contracts);
      newContracts.delete(playerId);

      return {
        ...prev,
        players: newPlayers,
        contracts: newContracts,
        overallRating: calculateOverallRating(newPlayers),
      };
    });
  }, []);

  const setFormation = useCallback((formation: string) => {
    setClubState((prev) => ({
      ...prev,
      formation,
    }));
  }, []);

  return {
    clubState,
    addPlayer,
    removePlayer,
    setFormation,
  };
}

// Hook for Master League
interface MasterLeagueState {
  season: number;
  week: number;
  totalWeeks: number;
  teamPosition: number;
  points: number;
  matches: {
    opponent: string;
    result: 'W' | 'L' | 'D' | null;
    scoreLine: string;
  }[];
  budget: number;
  transfers: { in: number; out: number };
}

export function useMasterLeague() {
  const [leagueState, setLeagueState] = useState<MasterLeagueState>({
    season: 2024,
    week: 1,
    totalWeeks: 38,
    teamPosition: 0,
    points: 0,
    matches: Array(38).fill(null).map(() => ({
      opponent: 'TBD',
      result: null,
      scoreLine: '0-0',
    })),
    budget: 500000,
    transfers: { in: 0, out: 0 },
  });

  const recordMatch = useCallback(
    (weekNumber: number, opponent: string, homeScore: number, awayScore: number) => {
      setLeagueState((prev) => {
        const newMatches = [...prev.matches];
        let result: 'W' | 'D' | 'L' = 'D';
        let pointsGained = 1;

        if (homeScore > awayScore) {
          result = 'W';
          pointsGained = 3;
        } else if (homeScore < awayScore) {
          result = 'L';
          pointsGained = 0;
        }

        newMatches[weekNumber - 1] = {
          opponent,
          result,
          scoreLine: `${homeScore}-${awayScore}`,
        };

        return {
          ...prev,
          week: Math.min(weekNumber + 1, prev.totalWeeks),
          matches: newMatches,
          points: prev.points + pointsGained,
        };
      });
    },
    []
  );

  const progressWeek = useCallback(() => {
    setLeagueState((prev) => ({
      ...prev,
      week: Math.min(prev.week + 1, prev.totalWeeks),
    }));
  }, []);

  return {
    leagueState,
    recordMatch,
    progressWeek,
  };
}

// Hook for Training management
interface TrainingSession {
  type: 'shooting' | 'passing' | 'dribbling' | 'defense' | 'physical' | 'speed';
  playerId: string;
  effectiveness: number;
  statGain: number;
}

export function useTraining() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [totalStamina, setTotalStamina] = useState(100);

  const startTrainingSession = useCallback(
    (type: TrainingSession['type'], playerId: string) => {
      const effectiveness = 50 + Math.random() * 50; // 50-100%
      const statGain = Math.round(effectiveness * 0.05);

      const session: TrainingSession = {
        type,
        playerId,
        effectiveness,
        statGain,
      };

      setSessions((prev) => [...prev, session]);
      setTotalStamina((prev) => Math.max(0, prev - effectiveness / 3));

      return session;
    },
    []
  );

  const restSquad = useCallback(() => {
    setTotalStamina(100);
  }, []);

  return {
    sessions,
    totalStamina,
    startTrainingSession,
    restSquad,
  };
}

// Hook for Online Divisions
interface DivisionRankState {
  division: string;
  points: number;
  rank: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
}

export function useDivisionRanking() {
  const [rankState, setRankState] = useState<DivisionRankState>({
    division: 'Division 3',
    points: 0,
    rank: 50000,
    wins: 0,
    draws: 0,
    losses: 0,
    winRate: 0,
  });

  const recordOnlineMatch = useCallback((result: 'W' | 'D' | 'L') => {
    setRankState((prev) => {
      let newPoints = prev.points;
      let newWins = prev.wins;
      let newDraws = prev.draws;
      let newLosses = prev.losses;

      if (result === 'W') {
        newPoints += 3;
        newWins += 1;
      } else if (result === 'D') {
        newPoints += 1;
        newDraws += 1;
      } else {
        newLosses += 1;
      }

      const totalMatches = newWins + newDraws + newLosses;
      const newWinRate = totalMatches > 0 ? (newWins / totalMatches) * 100 : 0;

      // Division progression
      let newDivision = prev.division;
      if (newPoints >= 3000 && prev.division === 'Division 3') {
        newDivision = 'Division 2';
      } else if (newPoints >= 2500 && prev.division === 'Division 2') {
        newDivision = 'Division 1';
      }

      return {
        ...prev,
        points: newPoints,
        wins: newWins,
        draws: newDraws,
        losses: newLosses,
        winRate: Math.round(newWinRate),
        division: newDivision,
        rank: Math.max(1, prev.rank - (result === 'W' ? 50 : 0)),
      };
    });
  }, []);

  return {
    rankState,
    recordOnlineMatch,
  };
}

// Helper function
function calculateOverallRating(players: Player[]): number {
  if (players.length === 0) return 0;

  const avgStats = players.reduce(
    (acc, player) => {
      return {
        pace: acc.pace + player.stats.pace,
        shooting: acc.shooting + player.stats.shooting,
        passing: acc.passing + player.stats.passing,
        dribbling: acc.dribbling + player.stats.dribbling,
        defense: acc.defense + player.stats.defense,
        physical: acc.physical + player.stats.physical,
      };
    },
    { pace: 0, shooting: 0, passing: 0, dribbling: 0, defense: 0, physical: 0 }
  );

  const overall =
    (avgStats.pace +
      avgStats.shooting +
      avgStats.passing +
      avgStats.dribbling +
      avgStats.defense +
      avgStats.physical) /
    (players.length * 6);

  return Math.round(overall);
}

export type {
  UseEnhancedGameEngineProps,
  MyClubState,
  MasterLeagueState,
  DivisionRankState,
  TrainingSession,
};
