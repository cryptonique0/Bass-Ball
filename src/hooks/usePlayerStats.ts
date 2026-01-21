/**
 * React hook for player statistics tracking
 */

import { useState, useCallback } from 'react';

export interface PlayerStats {
  playerId: string;
  passes: number;
  tackles: number;
  interceptions: number;
  shots: number;
  goals: number;
  assists: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  possessionTime: number;
  distance: number;
  topSpeed: number;
}

export interface UsePlayerStatsReturn extends PlayerStats {
  addPass: () => void;
  addTackle: () => void;
  addInterception: () => void;
  addShot: () => void;
  addGoal: () => void;
  addAssist: () => void;
  addFoul: () => void;
  addYellowCard: () => void;
  addRedCard: () => void;
  addPossessionTime: (time: number) => void;
  addDistance: (dist: number) => void;
  setTopSpeed: (speed: number) => void;
  getOverallRating: () => number;
  reset: () => void;
}

export function usePlayerStats(playerId: string): UsePlayerStatsReturn {
  const [stats, setStats] = useState<PlayerStats>({
    playerId,
    passes: 0,
    tackles: 0,
    interceptions: 0,
    shots: 0,
    goals: 0,
    assists: 0,
    fouls: 0,
    yellowCards: 0,
    redCards: 0,
    possessionTime: 0,
    distance: 0,
    topSpeed: 0,
  });

  const addPass = useCallback(() => {
    setStats((prev) => ({ ...prev, passes: prev.passes + 1 }));
  }, []);

  const addTackle = useCallback(() => {
    setStats((prev) => ({ ...prev, tackles: prev.tackles + 1 }));
  }, []);

  const addInterception = useCallback(() => {
    setStats((prev) => ({ ...prev, interceptions: prev.interceptions + 1 }));
  }, []);

  const addShot = useCallback(() => {
    setStats((prev) => ({ ...prev, shots: prev.shots + 1 }));
  }, []);

  const addGoal = useCallback(() => {
    setStats((prev) => ({
      ...prev,
      goals: prev.goals + 1,
      shots: prev.shots + 1,
    }));
  }, []);

  const addAssist = useCallback(() => {
    setStats((prev) => ({ ...prev, assists: prev.assists + 1 }));
  }, []);

  const addFoul = useCallback(() => {
    setStats((prev) => ({ ...prev, fouls: prev.fouls + 1 }));
  }, []);

  const addYellowCard = useCallback(() => {
    setStats((prev) => ({ ...prev, yellowCards: prev.yellowCards + 1 }));
  }, []);

  const addRedCard = useCallback(() => {
    setStats((prev) => ({ ...prev, redCards: prev.redCards + 1 }));
  }, []);

  const addPossessionTime = useCallback((time: number) => {
    setStats((prev) => ({ ...prev, possessionTime: prev.possessionTime + time }));
  }, []);

  const addDistance = useCallback((dist: number) => {
    setStats((prev) => ({ ...prev, distance: prev.distance + dist }));
  }, []);

  const setTopSpeed = useCallback((speed: number) => {
    setStats((prev) => ({
      ...prev,
      topSpeed: Math.max(prev.topSpeed, speed),
    }));
  }, []);

  const getOverallRating = useCallback(() => {
    const passRating = Math.min(stats.passes / 50, 1) * 10;
    const tackleRating = Math.min(stats.tackles / 10, 1) * 10;
    const interceptionRating = Math.min(stats.interceptions / 5, 1) * 10;
    const goalRating = Math.min(stats.goals / 3, 1) * 30;
    const assistRating = Math.min(stats.assists / 3, 1) * 10;

    const penalty = stats.fouls * 0.5 + stats.yellowCards * 1 + stats.redCards * 5;

    const rating =
      (passRating +
        tackleRating +
        interceptionRating +
        goalRating +
        assistRating) /
      5;

    return Math.max(0, Math.min(10, rating - penalty / 10));
  }, [stats]);

  const reset = useCallback(() => {
    setStats({
      playerId,
      passes: 0,
      tackles: 0,
      interceptions: 0,
      shots: 0,
      goals: 0,
      assists: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      possessionTime: 0,
      distance: 0,
      topSpeed: 0,
    });
  }, [playerId]);

  return {
    ...stats,
    addPass,
    addTackle,
    addInterception,
    addShot,
    addGoal,
    addAssist,
    addFoul,
    addYellowCard,
    addRedCard,
    addPossessionTime,
    addDistance,
    setTopSpeed,
    getOverallRating,
    reset,
  };
}
