'use client';

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useMatchStore } from '@/store/useMatchStore';
import { MatchScene, createGameConfig } from '@/lib/phaser';
import { initializeSocket } from '@/lib/socket';

export const GameCanvas: React.FC<{ matchId: string }> = ({ matchId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const { currentMatch, playerId, playerProfile } = useMatchStore();

  useEffect(() => {
    if (!containerRef.current || !currentMatch || !playerId) return;

    // Initialize Socket.IO connection if not already connected
    initializeSocket(playerId, playerProfile?.username || 'Guest');

    // Create Phaser game instance
    const config = createGameConfig();
    config.parent = containerRef.current;

    // Determine player team
    const playerTeam =
      currentMatch.homeTeam.players.some((p) => p.id === playerId) && currentMatch.homeTeam.formation
        ? 'home'
        : 'away';

    gameRef.current = new Phaser.Game({
      ...config,
      scene: {
        create: function () {
          const scene = this as MatchScene;
          scene.init({
            matchState: currentMatch,
            playerId,
            playerTeam,
          });
          scene.preload();
          scene.create();
        },
        update: function (time, delta) {
          const scene = this as MatchScene;
          scene.update(time, delta);
        },
      },
    });

    // Handle window resize with mobile optimization
    const handleResize = () => {
      if (gameRef.current) {
        const isMobile = window.innerWidth < 768;
        const height = isMobile ? window.innerHeight - 280 : window.innerHeight - 200;
        gameRef.current.scale.resize(window.innerWidth, Math.max(300, height));
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size calculation

    return () => {
      window.removeEventListener('resize', handleResize);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [currentMatch, playerId, playerProfile?.username]);

  return (
    <div
      ref={containerRef}
      id="phaser-container"
      className="w-full transition-all duration-300 ease-out bg-gradient-to-b from-green-800 to-green-900 rounded-none md:rounded-lg overflow-hidden shadow-lg animate-in fade-in"
      style={{
        height: 'clamp(300px, calc(100vh - 280px), calc(100vh - 200px))',
        aspectRatio: '16 / 9',
      }}
    />
  );
};

export default GameCanvas;
