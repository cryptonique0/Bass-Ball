'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, Team, Player } from '@/lib/gameEngine';
import { MatchEngine, MatchStats, EventType } from '@/lib/matchEngine';

interface UseMatchEngineProps {
  homeTeam: Team;
  awayTeam: Team;
  isAI?: boolean; // true = vs AI, false = PvP
}

export function useMatchEngine({ homeTeam, awayTeam, isAI = true }: UseMatchEngineProps) {
  const [gameState, setGameState] = useState<GameState>({
    homeTeam,
    awayTeam,
    ballX: 525,
    ballY: 340,
    ballVx: 0,
    ballVy: 0,
    possession: null,
    gameTime: 0,
    isPlaying: true,
    selectedPlayer: null,
  });

  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const matchEngineRef = useRef<MatchEngine | null>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize match engine
  useEffect(() => {
    matchEngineRef.current = new MatchEngine(gameState);
  }, []);

  // Main game loop
  useEffect(() => {
    if (isPaused || !gameState.isPlaying) return;

    gameLoopRef.current = setInterval(() => {
      if (matchEngineRef.current) {
        matchEngineRef.current.update();

        // Update state every 100ms
        setGameState((prev) => ({
          ...prev,
          ...matchEngineRef.current!,
        }));

        setMatchStats(matchEngineRef.current.getStats());
      }
    }, 1000 / 60); // 60 FPS

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPaused, gameState.isPlaying]);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);
  const togglePause = useCallback(() => setIsPaused((prev) => !prev), []);

  const selectPlayer = useCallback(
    (player: Player) => {
      setGameState((prev) => ({
        ...prev,
        selectedPlayer: player,
      }));
    },
    []
  );

  const deselectPlayer = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      selectedPlayer: null,
    }));
  }, []);

  const shoot = useCallback((strength: number = 10) => {
    if (!matchEngineRef.current) return;
    matchEngineRef.current.manualShoot(strength);
  }, []);

  const pass = useCallback((targetX: number, targetY: number) => {
    if (!matchEngineRef.current) return;
    matchEngineRef.current.manualPass(targetX, targetY);
  }, []);

  const getAIMove = useCallback(() => {
    if (!matchEngineRef.current) return null;
    return matchEngineRef.current.getAIMove();
  }, []);

  const resetMatch = useCallback(() => {
    setGameState({
      homeTeam: { ...homeTeam, score: 0 },
      awayTeam: { ...awayTeam, score: 0 },
      ballX: 525,
      ballY: 340,
      ballVx: 0,
      ballVy: 0,
      possession: null,
      gameTime: 0,
      isPlaying: true,
      selectedPlayer: null,
    });

    if (matchEngineRef.current) {
      matchEngineRef.current = new MatchEngine(gameState);
    }
  }, [homeTeam, awayTeam, gameState]);

  return {
    gameState,
    matchStats,
    isPaused,
    pause,
    resume,
    togglePause,
    selectPlayer,
    deselectPlayer,
    shoot,
    pass,
    getAIMove,
    resetMatch,
    matchEngine: matchEngineRef.current,
  };
}

// Hook for PvP match between two players
export function usePvPMatch(homeTeam: Team, awayTeam: Team) {
  const { gameState, matchStats, isPaused, pause, resume, togglePause, selectPlayer, shoot, pass, resetMatch } =
    useMatchEngine({
      homeTeam,
      awayTeam,
      isAI: false,
    });

  const [activePlayer, setActivePlayer] = useState<'home' | 'away'>('home');

  const switchPlayer = useCallback(() => {
    setActivePlayer((prev) => (prev === 'home' ? 'away' : 'home'));
  }, []);

  return {
    gameState,
    matchStats,
    isPaused,
    pause,
    resume,
    togglePause,
    selectPlayer,
    shoot,
    pass,
    resetMatch,
    activePlayer,
    switchPlayer,
  };
}

// Hook for AI match
export function useAIMatch(homeTeam: Team, awayTeam: Team) {
  const { gameState, matchStats, isPaused, pause, resume, togglePause, selectPlayer, shoot, pass, resetMatch, getAIMove } =
    useMatchEngine({
      homeTeam,
      awayTeam,
      isAI: true,
    });

  // AI automatically makes moves
  useEffect(() => {
    if (isPaused || !gameState.isPlaying) return;

    const aiTimer = setInterval(() => {
      const move = getAIMove();
      if (!move) return;

      if (move.type === 'shoot') {
        shoot(8 + Math.random() * 4);
      } else if (move.type === 'pass') {
        // Random pass
        const randomX = Math.random() * 1050;
        const randomY = Math.random() * 680;
        pass(randomX, randomY);
      }
    }, 2000); // AI makes a decision every 2 seconds

    return () => clearInterval(aiTimer);
  }, [isPaused, gameState.isPlaying, getAIMove, shoot, pass]);

  return {
    gameState,
    matchStats,
    isPaused,
    pause,
    resume,
    togglePause,
    selectPlayer,
    shoot,
    pass,
    resetMatch,
  };
}
