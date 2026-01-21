/**
 * Advanced React hook for match state management
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface MatchState {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  currentPeriod: number;
  timeElapsed: number;
  possession: 'home' | 'away';
  isActive: boolean;
}

export interface UseMatchStateReturn extends MatchState {
  updateScore: (team: 'home' | 'away', increment: number) => void;
  changePossession: (team: 'home' | 'away') => void;
  updateTime: (time: number) => void;
  startMatch: () => void;
  pauseMatch: () => void;
  resumeMatch: () => void;
  endMatch: () => void;
  reset: () => void;
}

const initialState: MatchState = {
  matchId: '',
  homeTeam: '',
  awayTeam: '',
  homeScore: 0,
  awayScore: 0,
  currentPeriod: 1,
  timeElapsed: 0,
  possession: 'home',
  isActive: false,
};

export function useMatchState(matchId: string = ''): UseMatchStateReturn {
  const [state, setState] = useState<MatchState>({
    ...initialState,
    matchId,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const updateScore = useCallback(
    (team: 'home' | 'away', increment: number = 1) => {
      setState((prev) => ({
        ...prev,
        [team === 'home' ? 'homeScore' : 'awayScore']:
          (prev[team === 'home' ? 'homeScore' : 'awayScore'] || 0) + increment,
      }));
    },
    []
  );

  const changePossession = useCallback((team: 'home' | 'away') => {
    setState((prev) => ({ ...prev, possession: team }));
  }, []);

  const updateTime = useCallback((time: number) => {
    setState((prev) => ({ ...prev, timeElapsed: time }));
  }, []);

  const startMatch = useCallback(() => {
    setState((prev) => ({ ...prev, isActive: true }));
    timerRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        timeElapsed: prev.timeElapsed + 1,
      }));
    }, 1000);
  }, []);

  const pauseMatch = useCallback(() => {
    setState((prev) => ({ ...prev, isActive: false }));
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const resumeMatch = useCallback(() => {
    setState((prev) => ({ ...prev, isActive: true }));
    timerRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        timeElapsed: prev.timeElapsed + 1,
      }));
    }, 1000);
  }, []);

  const endMatch = useCallback(() => {
    setState((prev) => ({ ...prev, isActive: false }));
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const reset = useCallback(() => {
    setState({ ...initialState, matchId });
    if (timerRef.current) clearInterval(timerRef.current);
  }, [matchId]);

  return {
    ...state,
    updateScore,
    changePossession,
    updateTime,
    startMatch,
    pauseMatch,
    resumeMatch,
    endMatch,
    reset,
  };
}
