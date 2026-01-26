/**
 * Farcaster Mini-Match Frame Component
 * Interactive mini-games playable inside Farcaster Frames
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FarcasterFrameProvider } from '@/lib/farcasterFrameProvider';
import type { FrameGameState, FrameAction } from '@/lib/farcasterFrameProvider';

interface FarcasterMiniMatchFrameProps {
  playerId: string;
  playerName: string;
  farcasterToken: string;
}

export const FarcasterMiniMatchFrame: React.FC<FarcasterMiniMatchFrameProps> = ({
  playerId,
  playerName,
  farcasterToken,
}) => {
  const [gameState, setGameState] = useState<FrameGameState | null>(null);
  const [screen, setScreen] = useState<'menu' | 'game' | 'result' | 'leaderboard'>('menu');
  const [selectedGameType, setSelectedGameType] = useState<'quick_tap' | 'rhythm_match' | 'deck_duel' | 'tournament'>('quick_tap');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | 'expert'>('easy');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const provider = FarcasterFrameProvider.getInstance();
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const tapAreaRef = useRef<HTMLDivElement>(null);

  // Initialize session
  useEffect(() => {
    const session = provider.createSession(playerId, farcasterToken);
    console.log('Frame session created:', session.sessionId);
  }, []);

  const startNewGame = () => {
    setLoading(true);
    try {
      const newGame = provider.createGameSession(
        playerId,
        playerName,
        selectedGameType,
        selectedDifficulty
      );

      const started = provider.startGame(newGame.gameId);
      if (started) {
        setGameState(started);
        setScreen('game');
        setMessage('Game started! Go go go!');
        startGameLoop(started.gameId);
      }
    } catch (error) {
      setMessage('Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const startGameLoop = (gameId: string) => {
    let actionCount = 0;
    const targetActions = 10; // Need to complete 10 actions to win

    gameLoopRef.current = setInterval(() => {
      const game = provider.getGame(gameId);
      if (!game || game.status !== 'active') {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        return;
      }

      const elapsed = Date.now() - game.startTime;
      const gameDuration = game.duration * 1000;

      if (elapsed >= gameDuration) {
        // Game time is up
        endGame(gameId, actionCount >= targetActions ? 'win' : 'loss');
      } else {
        setGameState({ ...game });
      }
    }, 100);
  };

  const handleTap = () => {
    if (!gameState || gameState.status !== 'active') return;

    // Simulate accuracy (random 70-100%)
    const accuracy = 70 + Math.random() * 30;

    const action = provider.recordAction(
      gameState.gameId,
      playerId,
      'tap',
      undefined,
      accuracy
    );

    if (action && gameState) {
      setGameState(prev => prev ? {
        ...prev,
        score: gameState.score,
        combo: gameState.combo,
        multiplier: gameState.multiplier,
        lives: gameState.lives,
      } : null);

      // Visual feedback
      if (accuracy > 80) {
        setMessage('💯 Perfect!');
      } else if (accuracy > 60) {
        setMessage('✓ Good!');
      } else {
        setMessage('✗ Miss');
      }

      setTimeout(() => setMessage(''), 500);
    }
  };

  const endGame = (gameId: string, result: 'win' | 'loss' | 'tie' | 'abandoned') => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);

    const ended = provider.endGame(gameId, result);
    if (ended) {
      setGameState(ended);
      setScreen('result');
    }
  };

  const handlePause = () => {
    if (gameState) {
      gameState.status = 'paused';
      setGameState({ ...gameState });
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
  };

  const handleResume = () => {
    if (gameState) {
      gameState.status = 'active';
      setGameState({ ...gameState });
      startGameLoop(gameState.gameId);
    }
  };

  const handleQuit = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    endGame(gameState!.gameId, 'abandoned');
  };

  const timeRemaining = gameState
    ? Math.max(0, gameState.duration - Math.floor((Date.now() - gameState.startTime) / 1000))
    : 0;

  return (
    <div className="w-full max-w-md mx-auto bg-gradient-to-br from-purple-900 via-blue-900 to-black rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-center">
        <h1 className="text-2xl font-bold text-white">Bass Ball Frame</h1>
        <p className="text-purple-200 text-sm">Play mini-matches in Farcaster</p>
      </div>

      <div className="p-6 space-y-4">
        {/* Menu Screen */}
        {screen === 'menu' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-white text-lg font-semibold mb-2">Select Game Type</p>
              <p className="text-purple-300 text-xs">Choose your challenge</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'quick_tap' as const, name: '⚡ Quick Tap', emoji: '⚡' },
                { id: 'rhythm_match' as const, name: '🎵 Rhythm', emoji: '🎵' },
                { id: 'deck_duel' as const, name: '🃏 Deck', emoji: '🃏' },
                { id: 'tournament' as const, name: '🏆 Tournament', emoji: '🏆' },
              ].map(game => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGameType(game.id)}
                  className={`p-3 rounded-lg font-semibold transition-all ${
                    selectedGameType === game.id
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : 'bg-purple-800 text-purple-200 hover:bg-purple-700'
                  }`}
                >
                  {game.emoji}
                  <div className="text-xs mt-1">{game.name.split(' ')[1]}</div>
                </button>
              ))}
            </div>

            <div className="text-center mb-4">
              <p className="text-white text-sm font-semibold mb-2">Difficulty</p>
              <div className="flex justify-center gap-2">
                {['easy', 'medium', 'hard', 'expert'].map(diff => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff as any)}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                      selectedDifficulty === diff
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startNewGame}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 rounded-lg transition-all text-lg"
            >
              {loading ? '🔄 Starting...' : '▶ Play Now'}
            </button>
          </div>
        )}

        {/* Game Screen */}
        {screen === 'game' && gameState && (
          <div className="space-y-4">
            {/* Score Display */}
            <div className="grid grid-cols-3 gap-2 bg-black/40 rounded-lg p-3">
              <div className="text-center">
                <p className="text-purple-400 text-xs">Score</p>
                <p className="text-white text-2xl font-bold">{gameState.score}</p>
              </div>
              <div className="text-center border-l border-r border-purple-500">
                <p className="text-blue-400 text-xs">Combo</p>
                <p className="text-white text-2xl font-bold">{gameState.combo}x</p>
              </div>
              <div className="text-center">
                <p className="text-pink-400 text-xs">Lives</p>
                <p className="text-white text-2xl font-bold">❤️ {gameState.lives}</p>
              </div>
            </div>

            {/* Timer */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-3 text-center">
              <p className="text-white font-bold text-lg">
                ⏱ {timeRemaining}s remaining
              </p>
              <div className="w-full bg-black/30 h-2 rounded mt-2">
                <div
                  className="bg-white h-full rounded transition-all"
                  style={{ width: `${(timeRemaining / gameState.duration) * 100}%` }}
                />
              </div>
            </div>

            {/* Tap Area */}
            <div
              ref={tapAreaRef}
              onClick={handleTap}
              className="relative w-full aspect-square bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl cursor-pointer hover:from-blue-500 hover:to-purple-500 transition-all active:scale-95 flex items-center justify-center border-4 border-purple-400"
            >
              <div className="text-center">
                <p className="text-white text-4xl font-bold mb-2">TAP HERE!</p>
                <p className="text-purple-200 text-sm">Click as fast as you can</p>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className="text-center text-white text-2xl font-bold animate-pulse">
                {message}
              </div>
            )}

            {/* Controls */}
            {gameState.status === 'paused' ? (
              <button
                onClick={handleResume}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-all"
              >
                ▶ Resume
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 rounded-lg transition-all"
              >
                ⏸ Pause
              </button>
            )}

            <button
              onClick={handleQuit}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-all text-sm"
            >
              ✕ Quit Game
            </button>
          </div>
        )}

        {/* Result Screen */}
        {screen === 'result' && gameState && (
          <div className="space-y-4 text-center">
            <div className={`text-6xl font-bold mb-4 ${
              gameState.result === 'win' ? 'text-green-400' : 'text-red-400'
            }`}>
              {gameState.result === 'win' ? '🎉 VICTORY!' : gameState.result === 'loss' ? '😢 DEFEAT' : '⏸ ABANDONED'}
            </div>

            <div className="bg-black/40 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-white">
                <span>Final Score:</span>
                <span className="font-bold text-2xl text-yellow-400">{gameState.finalScore}</span>
              </div>
              <div className="flex justify-between text-white">
                <span>Max Combo:</span>
                <span className="font-bold text-xl text-purple-400">{gameState.combo}x</span>
              </div>
              {gameState.reward && (
                <>
                  <div className="flex justify-between text-white">
                    <span>Coins Earned:</span>
                    <span className="font-bold text-xl text-yellow-300">💰 {gameState.reward.coins}</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>XP Earned:</span>
                    <span className="font-bold text-xl text-blue-300">⭐ {gameState.reward.xp}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setScreen('menu');
                  setGameState(null);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-all"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => setScreen('leaderboard')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-all"
              >
                🏆 Scores
              </button>
            </div>
          </div>
        )}

        {/* Leaderboard Screen */}
        {screen === 'leaderboard' && (
          <div className="space-y-4">
            <h2 className="text-white text-xl font-bold text-center">🏆 Leaderboard</h2>

            <div className="bg-black/40 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="flex justify-between items-center bg-purple-800/50 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-yellow-400 text-lg">#{idx + 1}</span>
                    <span className="text-white text-sm">Player {idx + 1}</span>
                  </div>
                  <span className="text-green-400 font-bold">{Math.floor(Math.random() * 5000 + 1000)}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setScreen('menu')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition-all"
            >
              ← Back to Menu
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-black/50 px-6 py-3 text-center border-t border-purple-500">
        <p className="text-purple-300 text-xs">
          💎 Mini-matches • Share to earn rewards • Play on Base
        </p>
      </div>
    </div>
  );
};

export default FarcasterMiniMatchFrame;
