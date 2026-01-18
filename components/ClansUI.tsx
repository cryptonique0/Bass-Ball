'use client';

import React, { useState, useEffect } from 'react';
import { ClanManager, Club, ClubMember, ClubInvite } from '@/lib/clanSystem';
import { Users, Plus, Mail, Settings, Wallet, Trash2, LogOut, Search, X } from 'lucide-react';

/**
 * Clans UI Component
 * Manage clubs/clans
 */
export function ClansUI() {
  const clanMgr = ClanManager.getInstance();
  const [activeTab, setActiveTab] = useState<'browse' | 'my-clan' | 'invites'>('browse');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [playerClub, setPlayerClub] = useState<Club | null>(null);
  const [invites, setInvites] = useState<ClubInvite[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [userId] = useState('player_1');
  const [userName] = useState('Player Name');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setClubs(clanMgr.getAllClubs());
    setPlayerClub(clanMgr.getPlayerClub(userId) || null);
    setInvites(clanMgr.getPlayerInvites(userId));
  };

  const handleCreateClub = (name: string, description: string, joinPolicy: any) => {
    const newClub = clanMgr.createClub(userId, userName, name, description, joinPolicy);
    setPlayerClub(newClub);
    setShowCreateModal(false);
    loadData();
  };

  const handleAcceptInvite = (inviteId: string) => {
    const invite = invites.find(i => i.inviteId === inviteId);
    if (invite && clanMgr.acceptInvite(inviteId, userId, userName)) {
      loadData();
    }
  };

  const handleLeaveClub = () => {
    if (playerClub && playerClub.owner !== userId) {
      clanMgr.removeMember(playerClub.clubId, userId, playerClub.owner);
      setPlayerClub(null);
      loadData();
    }
  };

  const filteredClubs = searchQuery
    ? clanMgr.searchClubs(searchQuery)
    : clubs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Clans & Clubs</h1>
            <p className="text-slate-400">Join a club, recruit friends, compete together</p>
          </div>
          {!playerClub && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <Plus size={20} />
              Create Club
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition ${
              activeTab === 'browse'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Users size={20} />
            Browse Clubs
          </button>
          {playerClub && (
            <button
              onClick={() => setActiveTab('my-clan')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition ${
                activeTab === 'my-clan'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Settings size={20} />
              My Club
            </button>
          )}
          {invites.length > 0 && (
            <button
              onClick={() => setActiveTab('invites')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition relative ${
                activeTab === 'invites'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Mail size={20} />
              Invites
              <span className="absolute top-1 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {invites.length}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-500" size={20} />
                <input
                  type="text"
                  placeholder="Search clubs..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map(club => (
                <ClubCard
                  key={club.clubId}
                  club={club}
                  isPlayerClub={playerClub?.clubId === club.clubId}
                  onSelect={() => {
                    setSelectedClub(club);
                    setShowJoinModal(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* My Club Tab */}
        {activeTab === 'my-clan' && playerClub && (
          <MyClubView
            club={playerClub}
            userId={userId}
            onLeave={handleLeaveClub}
            onRefresh={loadData}
          />
        )}

        {/* Invites Tab */}
        {activeTab === 'invites' && (
          <div className="space-y-4">
            {invites.map(invite => (
              <InviteCard
                key={invite.inviteId}
                invite={invite}
                onAccept={() => handleAcceptInvite(invite.inviteId)}
                onDecline={() => clanMgr.declineInvite(invite.inviteId) && loadData()}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Club Modal */}
      {showCreateModal && (
        <CreateClubModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateClub}
        />
      )}

      {/* Join Club Modal */}
      {showJoinModal && selectedClub && (
        <JoinClubModal
          club={selectedClub}
          onClose={() => setShowJoinModal(false)}
          onJoin={() => {
            setShowJoinModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

/**
 * Club Card Component
 */
function ClubCard({
  club,
  isPlayerClub,
  onSelect,
}: {
  club: Club;
  isPlayerClub: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6">
        <h3 className="text-2xl font-bold text-white mb-2">{club.name}</h3>
        <div className="flex items-center justify-between text-sm text-emerald-100">
          <span>Level {club.level}</span>
          <span>{club.members.size}/{club.maxMembers} Members</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-slate-400 mb-4 line-clamp-2">{club.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Wins</div>
            <div className="text-2xl font-bold text-white">{club.stats.totalWins}</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Win Rate</div>
            <div className="text-2xl font-bold text-emerald-400">
              {(club.stats.averageWinRate * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Owner Info */}
        <div className="mb-6 pb-6 border-b border-slate-700">
          <div className="text-xs text-slate-400 mb-1">Owner</div>
          <div className="text-white font-semibold">{club.ownerName}</div>
        </div>

        {/* Action Button */}
        {isPlayerClub ? (
          <button className="w-full bg-slate-700 text-slate-300 py-2 rounded-lg font-semibold cursor-not-allowed">
            ✓ Your Club
          </button>
        ) : (
          <button
            onClick={onSelect}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-semibold transition"
          >
            View & Join
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * My Club View Component
 */
function MyClubView({
  club,
  userId,
  onLeave,
  onRefresh,
}: {
  club: Club;
  userId: string;
  onLeave: () => void;
  onRefresh: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'treasury'>('overview');

  return (
    <div className="space-y-6">
      {/* Club Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-8">
          <h2 className="text-3xl font-bold text-white mb-2">{club.name}</h2>
          <div className="flex gap-6 text-emerald-100 text-sm">
            <span>Level {club.level}</span>
            <span>{club.experience} XP</span>
            <span>{club.members.size}/{club.maxMembers} Members</span>
          </div>
        </div>

        <div className="p-6 flex gap-4">
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition">
            Invite Players
          </button>
          {club.owner !== userId && (
            <button
              onClick={onLeave}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <LogOut size={16} />
              Leave Club
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-slate-700">
        {(['overview', 'members', 'treasury'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 border-b-2 transition capitalize ${
              activeTab === tab
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-2">Total Wins</div>
            <div className="text-4xl font-bold text-white">{club.stats.totalWins}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-2">Total Losses</div>
            <div className="text-4xl font-bold text-white">{club.stats.totalLosses}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-2">Win Rate</div>
            <div className="text-4xl font-bold text-emerald-400">
              {(club.stats.averageWinRate * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="divide-y divide-slate-700">
            {Array.from(club.members.values())
              .sort((a, b) => {
                const roleOrder = { owner: 0, leader: 1, officer: 2, member: 3 };
                return roleOrder[a.role] - roleOrder[b.role];
              })
              .map(member => (
                <div key={member.playerId} className="p-4 flex items-center justify-between hover:bg-slate-700/50">
                  <div>
                    <div className="font-semibold text-white">{member.playerName}</div>
                    <div className="text-sm text-slate-400 capitalize">{member.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">W: {member.wins} L: {member.losses}</div>
                    <div className="text-xs text-slate-500">Joined {new Date(member.joinedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {activeTab === 'treasury' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Wallet size={20} />
                Soft Currency
              </h3>
            </div>
            <div className="text-4xl font-bold text-yellow-400 mb-4">{club.treasury.softBalance.toLocaleString()}</div>
            {club.owner === userId && (
              <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-semibold transition">
                Manage
              </button>
            )}
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Wallet size={20} />
                Hard Currency
              </h3>
            </div>
            <div className="text-4xl font-bold text-blue-400 mb-4">{club.treasury.hardBalance.toFixed(2)}</div>
            {club.owner === userId && (
              <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-semibold transition">
                Manage
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Invite Card Component
 */
function InviteCard({
  invite,
  onAccept,
  onDecline,
}: {
  invite: ClubInvite;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const daysLeft = Math.ceil((invite.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex items-center justify-between">
      <div>
        <h3 className="text-xl font-bold text-white mb-1">{invite.clubName}</h3>
        <p className="text-slate-400 mb-2">Invited by {invite.invitedBy}</p>
        {invite.message && <p className="text-slate-300 text-sm">{invite.message}</p>}
        <div className="text-xs text-slate-500 mt-2">Expires in {daysLeft} days</div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onAccept}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold transition"
        >
          Accept
        </button>
        <button
          onClick={onDecline}
          className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-semibold transition"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

/**
 * Create Club Modal
 */
function CreateClubModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, description: string, joinPolicy: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [joinPolicy, setJoinPolicy] = useState('approval');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create Club</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Club Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter club name"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your club"
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Join Policy</label>
            <select
              value={joinPolicy}
              onChange={e => setJoinPolicy(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="open">Open (Anyone can join)</option>
              <option value="approval">Approval Required</option>
              <option value="private">Private (Invite only)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name, description, joinPolicy)}
            disabled={!name.trim() || !description.trim()}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Join Club Modal
 */
function JoinClubModal({
  club,
  onClose,
  onJoin,
}: {
  club: Club;
  onClose: () => void;
  onJoin: () => void;
}) {
  const clanMgr = ClanManager.getInstance();
  const [userId] = useState('player_1');
  const [message, setMessage] = useState('');

  const handleRequestJoin = () => {
    // TODO: Send join request based on join policy
    onJoin();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{club.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
            <X size={24} />
          </button>
        </div>

        <p className="text-slate-400 mb-6">{club.description}</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-slate-400">Members</div>
            <div className="text-lg font-bold text-white">
              {club.members.size}/{club.maxMembers}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-slate-400">Level</div>
            <div className="text-lg font-bold text-white">{club.level}</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-slate-400">Win Rate</div>
            <div className="text-lg font-bold text-emerald-400">
              {(club.stats.averageWinRate * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {club.joinPolicy === 'approval' && (
          <div>
            <label className="block text-sm text-slate-400 mb-2">Message (Optional)</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Tell the owner why you want to join..."
              rows={2}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 mb-4"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleRequestJoin}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Request to Join
          </button>
        </div>
      </div>
    </div>
  );
}
