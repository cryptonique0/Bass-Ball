'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useMatchStore } from '@/store/useMatchStore';
import { useEffect, useState } from 'react';

export const WalletButton: React.FC = () => {
  const { login, logout, user, ready } = usePrivy();
  const { setPlayerId, setPlayerProfile, setIsGuest, setWalletAddress } = useMatchStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;

    // User is logged in
    const userId = user.id;
    setPlayerId(userId);
    setWalletAddress(user.wallet?.address || '');
    setIsGuest(false);

    // Create player profile with initial stats
    setPlayerProfile({
      id: userId,
      username: user.email?.address?.split('@')[0] || user.wallet?.address?.slice(0, 6) || 'Player',
      stats: {
        wins: 0,
        losses: 0,
        goalsScored: 0,
        goalsConceded: 0,
        assists: 0,
      },
      ranking: {
        rating: 1200,
        position: 0,
      },
      nfts: [],
      matchHistory: [],
    });
  }, [user, ready, setPlayerId, setPlayerProfile, setIsGuest, setWalletAddress]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      setPlayerId('');
      setWalletAddress('');
      setIsGuest(true);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAsGuest = () => {
    const guestId = `guest-${Date.now()}`;
    setPlayerId(guestId);
    setIsGuest(true);

    // Create guest player profile
    setPlayerProfile({
      id: guestId,
      username: 'Guest Player',
      stats: {
        wins: 0,
        losses: 0,
        goalsScored: 0,
        goalsConceded: 0,
        assists: 0,
      },
      ranking: {
        rating: 1000,
        position: 0,
      },
      nfts: [],
      matchHistory: [],
    });
  };

  if (!ready) {
    return (
      <div className="px-4 py-2 bg-gray-300 text-gray-700 rounded font-semibold animate-pulse">
        Loading...
      </div>
    );
  }

  if (user) {
    const displayAddress = user.wallet?.address
      ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
      : user.email?.address?.split('@')[0] || 'Connected';

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 truncate max-w-xs">{displayAddress}</span>
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded font-semibold transition-colors"
        >
          {isLoading ? 'Disconnecting...' : 'Disconnect'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded font-semibold transition-colors"
      >
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </button>
      <button
        onClick={handlePlayAsGuest}
        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold transition-colors"
      >
        Play as Guest
      </button>
    </div>
  );
};

export default WalletButton;
