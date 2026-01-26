'use client';

import React, { useState, useEffect } from 'react';
import { ClubWarsManager, ClubWar, WarTier } from '@/lib/clubWarsSystem';
import { ClanManager } from '@/lib/clanSystem';
import { Trophy, Swords, TrendingUp, Calendar, Users, Award } from 'lucide-react';

/**
 * Club Wars UI Component
 * Browse, register, and manage club tournaments
 */
export function ClubWarsUI() {
  const warMgr = ClubWarsManager.getInstance();
  const clanMgr = ClanManager.getInstance();

  const [activeTab, setActiveTab] = useState<'active-wars' | 'leaderboard' | 'my-wars'>('active-wars');
  const [wars, setWars] = useState<ClubWar[]>([]);
  const [leaderboard, setLeaderboard] = useState<Array<{
    clubId: string;
    wins: number;
    losses: number;
    tier: WarTier;
    rating: number;
  }>>([]);
  const [myWars, setMyWars] = useState<ClubWar[]>([]);
  const [userId] = useState('player_1');
  const [userClubId, setUserClubId] = useState('');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  // Load initial data
  useEffect(() => {
    const club = clanMgr.getPlayerClub(userId);
    if (club) {
      setUserClubId(club.clubId);
    }

    const activeWars = warMgr.getCurrentSeasonWars();
    setWars(activeWars);

    const leaderboardData = warMgr.getGlobalLeaderboard();
    setLeaderboard(leaderboardData);

    // Get wars for user's club if they have one
    if (club) {
      const clubWars = activeWars.filter(w => 
        w.registeredClubs?.has(club.clubId)
      );
      setMyWars(clubWars);
    }
  }, []);

  // Refresh data every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const activeWars = warMgr.getCurrentSeasonWars();
      setWars(activeWars);

      const leaderboardData = warMgr.getGlobalLeaderboard();
      setLeaderboard(leaderboardData);

      if (userClubId) {
        const clubWars = activeWars.filter(w => 
          w.registeredClubs?.has(userClubId)
        );
        setMyWars(clubWars);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [userClubId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Swords size={32} className="text-amber-400" />
            Club Wars
          </h1>
          <p className="text-slate-400">Compete with your club and climb the rankings</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          {[
            { id: 'active-wars' as const, label: 'Active Wars', icon: <Swords size={18} /> },
            { id: 'leaderboard' as const, label: 'Leaderboard', icon: <Trophy size={18} /> },
            { id: 'my-wars' as const, label: 'My Wars', icon: <Award size={18} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === tab.id
                  ? 'text-amber-400 border-amber-400'
                  : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'active-wars' && <ActiveWarsTab wars={wars} onRegister={() => setShowRegistrationModal(true)} userClubId={userClubId} />}
        {activeTab === 'leaderboard' && <LeaderboardTab leaderboard={leaderboard} />}
        {activeTab === 'my-wars' && <MyWarsTab wars={myWars} userClubId={userClubId} />}

        {/* Registration Modal */}
        {showRegistrationModal && (
          <RegistrationModal
            onClose={() => setShowRegistrationModal(false)}
            onRegister={() => setShowRegistrationModal(false)}
            userClubId={userClubId}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Active Wars Tab
 */
function ActiveWarsTab({ wars, onRegister, userClubId }: { wars: ClubWar[]; onRegister: () => void; userClubId: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {wars.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <Swords size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">No active wars at the moment</p>
        </div>
      ) : (
        wars.map(war => (
          <WarCard
            key={war.warId}
            war={war}
            onRegister={onRegister}
            isRegistered={war.registeredClubs?.has(userClubId) || false}
          />
        ))
      )}
    </div>
  );
}

/**
 * War Card Component
 */
function WarCard({
  war,
  onRegister,
  isRegistered,
}: {
  war: ClubWar;
  onRegister: () => void;
  isRegistered: boolean;
}) {
  const tierColors: Record<string, string> = {
    bronze: 'from-amber-700 to-amber-900',
    silver: 'from-slate-500 to-slate-700',
    gold: 'from-yellow-500 to-amber-600',
    platinum: 'from-cyan-400 to-blue-500',
    diamond: 'from-purple-500 to-pink-500',
  };

  return (
    <div className={`bg-gradient-to-br ${tierColors[war.tier]} rounded-lg p-6 border border-slate-700 hover:border-slate-500 transition`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm font-semibold text-white/80 uppercase tracking-widest">{war.tier} Tier</div>
          <h3 className="text-2xl font-bold text-white mt-1">Season {war.season}</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
          war.status === 'active'
            ? 'bg-emerald-500/20 text-emerald-300'
            : war.status === 'registration'
            ? 'bg-blue-500/20 text-blue-300'
            : 'bg-slate-500/20 text-slate-300'
        }`}>
          {war.status.charAt(0).toUpperCase() + war.status.slice(1)}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-slate-100">
          <Users size={16} />
          <span>{war.registeredClubs?.size || 0} clubs registered</span>
        </div>
        <div className="flex items-center gap-2 text-slate-100">
          <Calendar size={16} />
          <span>Format: {war.format}</span>
        </div>
        {/* Rewards info unavailable in data model; adjust when prize pool is added */}
      </div>

      <button
        onClick={onRegister}
        disabled={isRegistered || war.status !== 'registration'}
        className={`w-full py-2 rounded-lg font-bold transition ${
          isRegistered
            ? 'bg-emerald-600/50 text-emerald-200 cursor-default'
            : war.status === 'registration'
            ? 'bg-amber-600 hover:bg-amber-700 text-white'
            : 'bg-slate-600 text-slate-400 cursor-not-allowed'
        }`}
      >
        {isRegistered ? '✓ Registered' : war.status === 'registration' ? 'Register Now' : 'Registration Closed'}
      </button>
    </div>
  );
}

/**
 * Leaderboard Tab
 */
function LeaderboardTab({ leaderboard }: { leaderboard: Array<{
  clubId: string;
  wins: number;
  losses: number;
  tier: WarTier;
  rating: number;
}> }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700/50 border-b border-slate-600">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-300">#</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-300">Club</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-300">Tier</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-slate-300">Wins</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-slate-300">Losses</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-slate-300">Win Rate</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-slate-300">Rating</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.slice(0, 20).map((metrics, index) => (
              <LeaderboardRow key={metrics.clubId} metrics={metrics} rank={index + 1} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Leaderboard Row Component
 */
function LeaderboardRow({ metrics, rank }: { metrics: { clubId: string; wins: number; losses: number; tier: WarTier; rating: number }; rank: number }) {
  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: 'bg-amber-600',
      silver: 'bg-slate-500',
      gold: 'bg-yellow-500',
      platinum: 'bg-cyan-400 text-slate-900',
      diamond: 'bg-purple-500',
    };
    return colors[tier] || 'bg-slate-500';
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  return (
    <tr className="border-b border-slate-700 hover:bg-slate-700/30 transition">
      <td className="px-6 py-4 text-white font-bold text-lg">{getMedalIcon(rank)}</td>
      <td className="px-6 py-4">
        <div className="text-white font-semibold">{metrics.clubId}</div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getTierColor(metrics.tier)}`}>
          {metrics.tier.toUpperCase()}
        </span>
      </td>
      <td className="px-6 py-4 text-right text-emerald-400 font-bold">{metrics.wins}</td>
      <td className="px-6 py-4 text-right text-red-400 font-bold">{metrics.losses}</td>
      <td className="px-6 py-4 text-right text-slate-300 font-semibold">
        {(((metrics.wins) / Math.max(metrics.wins + metrics.losses, 1)) * 100).toFixed(1)}%
      </td>
      <td className="px-6 py-4 text-right">
        <div className="text-white font-bold">{metrics.rating}</div>
      </td>
    </tr>
  );
}

/**
 * My Wars Tab
 */
function MyWarsTab({ wars, userClubId }: { wars: ClubWar[]; userClubId: string }) {
  return (
    <div className="space-y-6">
      {wars.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <Trophy size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">Your club isn't registered in any wars yet</p>
          <p className="text-slate-500 text-sm mt-2">Check Active Wars to register your club</p>
        </div>
      ) : (
        wars.map(war => (
          <MyWarCard key={war.warId} war={war} userClubId={userClubId} />
        ))
      )}
    </div>
  );
}

/**
 * My War Card Component
 */
function MyWarCard({ war, userClubId }: { war: ClubWar; userClubId: string }) {
  const warsManager = ClubWarsManager.getInstance();
  const metrics = warsManager.getClubMetrics(userClubId);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-sm text-amber-400 font-semibold uppercase tracking-widest">{war.tier} Tier • Season {war.season}</div>
          <h3 className="text-2xl font-bold text-white mt-2">{war.format}</h3>
        </div>
        <div className={`px-4 py-2 rounded-lg font-bold ${
          war.status === 'active'
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-slate-600 text-slate-300'
        }`}>
          {war.status.charAt(0).toUpperCase() + war.status.slice(1)}
        </div>
      </div>

      {/* Your Stats */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-700/30 rounded-lg">
          <StatBox label="Wins" value={metrics.wins} color="emerald" />
          <StatBox label="Losses" value={metrics.losses} color="red" />
          <StatBox label="Win Rate" value={`${(metrics.winRate * 100).toFixed(1)}%`} color="blue" />
          <StatBox label="Rating" value={metrics.rating} color="amber" />
        </div>
      )}

      {/* Matches */}
      <div className="mb-6">
        <h4 className="text-lg font-bold text-white mb-3">Recent Matches</h4>
        <div className="space-y-2">
          {war.matches?.slice(0, 3).map((match, idx) => (
            <MatchRow key={idx} match={match} userClubId={userClubId} />
          ))}
          {!war.matches || war.matches.length === 0 && (
            <p className="text-slate-400">No matches scheduled yet</p>
          )}
        </div>
      </div>

      <button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2">
        <Trophy size={18} />
        View Full War Details
      </button>
    </div>
  );
}

/**
 * Stat Box Component
 */
function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorClasses: Record<string, string> = {
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
  };

  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}

/**
 * Match Row Component
 */
function MatchRow({ match, userClubId }: { match: any; userClubId: string }) {
  const isHome = match.homeClubId === userClubId;
  const userScore = isHome ? match.homeScore : match.awayScore;
  const opponentScore = isHome ? match.awayScore : match.homeScore;

  return (
    <div className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between">
      <div className="flex-1">
        <p className="text-white font-semibold text-sm">{isHome ? 'Home' : 'Away'} Match</p>
        <p className="text-slate-400 text-xs mt-1">{match.status || 'Scheduled'}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-lg font-bold text-white">{userScore}</div>
          <div className="text-xs text-slate-400">Your Score</div>
        </div>
        <div className="text-slate-500 font-bold">vs</div>
        <div className="text-right">
          <div className="text-lg font-bold text-slate-300">{opponentScore}</div>
          <div className="text-xs text-slate-400">Opponent</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Registration Modal Component
 */
function RegistrationModal({
  onClose,
  onRegister,
  userClubId,
}: {
  onClose: () => void;
  onRegister: () => void;
  userClubId: string;
}) {
  const [selectedWar, setSelectedWar] = useState('');
  const warMgr = ClubWarsManager.getInstance();
  const wars = warMgr.getCurrentSeasonWars().filter(w => w.status === 'registration');

  const handleRegister = () => {
    if (selectedWar && userClubId) {
      warMgr.registerClubForWar(selectedWar, userClubId);
      onRegister();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-6">Register for War</h2>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300 mb-2">Select War</label>
          <select
            value={selectedWar}
            onChange={e => setSelectedWar(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">Choose a war...</option>
            {wars.map(war => (
              <option key={war.warId} value={war.warId}>
                {war.tier.toUpperCase()} - Season {war.season}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-300">
            <strong>Note:</strong> Your club will be placed in a tier based on its current rating.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleRegister}
            disabled={!selectedWar}
            className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 text-white font-bold py-2 rounded-lg transition"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}
