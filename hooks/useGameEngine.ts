import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameState,
  Player,
  Team,
  FORMATIONS,
  PITCH_WIDTH,
  PITCH_HEIGHT,
  BALL_RADIUS,
  PLAYER_RADIUS,
  MAX_BALL_SPEED,
  FRICTION,
  getDistanceBetweenPoints,
  getAngleBetweenPoints,
  clamp,
} from '@/lib/gameEngine';

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameRunning, setGameRunning] = useState(false);
  const animationRef = useRef<number>();

  const createTeam = useCallback((name: string, isHome: boolean): Team => {
    const formation = FORMATIONS['4-3-3'];
    const positions = isHome
      ? formation.positions
      : formation.positions.map((p) => ({
          ...p,
          x: 1 - p.x,
        }));

    const players: Player[] = positions.map((pos, idx) => ({
      id: `${name}-${idx}`,
      name: `${name} Player ${idx}`,
      position: pos.position as any,
      pace: 75 + Math.random() * 25,
      shooting: 70 + Math.random() * 30,
      passing: 75 + Math.random() * 25,
      dribbling: 70 + Math.random() * 30,
      defense: 70 + Math.random() * 30,
      physical: 75 + Math.random() * 25,
      x: pos.x * PITCH_WIDTH,
      y: pos.y * PITCH_HEIGHT,
      vx: 0,
      vy: 0,
      stamina: 100,
      selected: false,
    }));

    return {
      id: name,
      name,
      formation: '4-3-3',
      players,
      score: 0,
      possession: 0,
    };
  }, []);

  const initializeGame = useCallback(() => {
    const homeTeam = createTeam('Home', true);
    const awayTeam = createTeam('Away', false);

    setGameState({
      homeTeam,
      awayTeam,
      ballX: PITCH_WIDTH / 2,
      ballY: PITCH_HEIGHT / 2,
      ballVx: 0,
      ballVy: 0,
      possession: homeTeam.players[0].id,
      gameTime: 0,
      isPlaying: false,
      selectedPlayer: null,
    });
  }, [createTeam]);

  const updateGamePhysics = useCallback(() => {
    setGameState((prev) => {
      if (!prev) return null;

      const state = { ...prev };

      // Update ball physics
      state.ballX += state.ballVx;
      state.ballY += state.ballVy;
      state.ballVx *= FRICTION;
      state.ballVy *= FRICTION;

      // Ball boundary collision
      if (state.ballX - BALL_RADIUS < 0 || state.ballX + BALL_RADIUS > PITCH_WIDTH) {
        state.ballVx *= -0.8;
        state.ballX = clamp(state.ballX, BALL_RADIUS, PITCH_WIDTH - BALL_RADIUS);
      }

      if (state.ballY - BALL_RADIUS < 0 || state.ballY + BALL_RADIUS > PITCH_HEIGHT) {
        state.ballVy *= -0.8;
        state.ballY = clamp(state.ballY, BALL_RADIUS, PITCH_HEIGHT - BALL_RADIUS);
      }

      // Check for goals
      if (state.ballX - BALL_RADIUS < 0 && state.ballY > PITCH_HEIGHT * 0.3 && state.ballY < PITCH_HEIGHT * 0.7) {
        state.awayTeam.score++;
        resetBall(state);
      } else if (
        state.ballX + BALL_RADIUS > PITCH_WIDTH &&
        state.ballY > PITCH_HEIGHT * 0.3 &&
        state.ballY < PITCH_HEIGHT * 0.7
      ) {
        state.homeTeam.score++;
        resetBall(state);
      }

      // Update player positions with AI movement
      updatePlayerPositions(state);

      // Check ball possession
      checkBallPossession(state);

      state.gameTime += 1;

      return state;
    });
  }, []);

  const updatePlayerPositions = (state: GameState) => {
    [...state.homeTeam.players, ...state.awayTeam.players].forEach((player) => {
      // Simple AI: move towards ball
      const distToBall = getDistanceBetweenPoints(player.x, player.y, state.ballX, state.ballY);

      if (distToBall < 200) {
        const angle = getAngleBetweenPoints(player.x, player.y, state.ballX, state.ballY);
        const speed = 2 + player.pace / 100;
        player.vx = Math.cos(angle) * speed;
        player.vy = Math.sin(angle) * speed;
      }

      // Update position
      player.x += player.vx;
      player.y += player.vy;

      // Boundary collision
      player.x = clamp(player.x, PLAYER_RADIUS, PITCH_WIDTH - PLAYER_RADIUS);
      player.y = clamp(player.y, PLAYER_RADIUS, PITCH_HEIGHT - PLAYER_RADIUS);

      // Stamina recovery
      player.stamina = Math.min(100, player.stamina + 0.1);
    });
  };

  const checkBallPossession = (state: GameState) => {
    let closestPlayer: Player | null = null;
    let closestDistance = PLAYER_RADIUS * 2;

    [...state.homeTeam.players, ...state.awayTeam.players].forEach((player) => {
      const dist = getDistanceBetweenPoints(player.x, player.y, state.ballX, state.ballY);
      if (dist < closestDistance) {
        closestDistance = dist;
        closestPlayer = player;
      }
    });

    if (closestPlayer) {
      state.possession = closestPlayer.id;
      // Ball follows player
      const angle = getAngleBetweenPoints(closestPlayer.x, closestPlayer.y, state.ballX, state.ballY);
      const pullSpeed = 0.3;
      state.ballX -= Math.cos(angle) * pullSpeed;
      state.ballY -= Math.sin(angle) * pullSpeed;
    }
  };

  const resetBall = (state: GameState) => {
    state.ballX = PITCH_WIDTH / 2;
    state.ballY = PITCH_HEIGHT / 2;
    state.ballVx = 0;
    state.ballVy = 0;
  };

  const startMatch = useCallback(() => {
    if (!gameState) initializeGame();
    setGameRunning(true);
  }, [gameState, initializeGame]);

  const pauseMatch = useCallback(() => {
    setGameRunning(false);
  }, []);

  const resumeMatch = useCallback(() => {
    setGameRunning(true);
  }, []);

  const endMatch = useCallback(() => {
    setGameRunning(false);
  }, []);

  const selectPlayer = useCallback((player: Player) => {
    setGameState((prev) => {
      if (!prev) return null;
      if (prev.selectedPlayer?.id === player.id) {
        return { ...prev, selectedPlayer: null };
      }
      return { ...prev, selectedPlayer: player };
    });
  }, []);

  const passToPlayer = useCallback((targetPlayer: Player) => {
    setGameState((prev) => {
      if (!prev || !prev.selectedPlayer) return prev;

      const angle = getAngleBetweenPoints(
        prev.selectedPlayer.x,
        prev.selectedPlayer.y,
        targetPlayer.x,
        targetPlayer.y
      );

      const passSpeed = 8;
      const newState = { ...prev };
      newState.ballVx = Math.cos(angle) * passSpeed;
      newState.ballVy = Math.sin(angle) * passSpeed;
      newState.possession = targetPlayer.id;
      newState.selectedPlayer = null;

      return newState;
    });
  }, []);

  const shoot = useCallback(() => {
    setGameState((prev) => {
      if (!prev || !prev.selectedPlayer) return prev;

      const goalX = prev.selectedPlayer.x > PITCH_WIDTH / 2 ? 0 : PITCH_WIDTH;
      const angle = getAngleBetweenPoints(
        prev.selectedPlayer.x,
        prev.selectedPlayer.y,
        goalX,
        PITCH_HEIGHT / 2
      );

      const shootSpeed = 12 + prev.selectedPlayer.shooting / 10;
      const newState = { ...prev };
      newState.ballVx = Math.cos(angle) * shootSpeed;
      newState.ballVy = Math.sin(angle) * shootSpeed;
      newState.selectedPlayer = null;

      return newState;
    });
  }, []);

  // Main game loop
  useEffect(() => {
    if (!gameRunning) return;

    const gameLoop = () => {
      updateGamePhysics();
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameRunning, updateGamePhysics]);

  return {
    gameState,
    gameRunning,
    initializeGame,
    startMatch,
    pauseMatch,
    resumeMatch,
    endMatch,
    selectPlayer,
    passToPlayer,
    shoot,
  };
}
