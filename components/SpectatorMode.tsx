'use client';

import React, { useState, useEffect } from 'react';
import { SpectatorManager, LiveMatchEvent, MatchReplay } from '@/lib/spectatorSystem';
import { Eye, Play, Pause, Share2, Download, Volume2, Maximize, Clock } from 'lucide-react';

/**
 * Spectator Mode Component
 * Watch live matches and replays
 */
export function SpectatorMode() {
  const spectatorMgr = SpectatorManager.getInstance();
  const [matchId, setMatchId] = useState('match_001');
  const [events, setEvents] = useState<LiveMatchEvent[]>([]);
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [isSpectating, setIsSpectating] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [userId] = useState('player_1');
  const [userName] = useState('Player Name');
  const [isPlaying, setIsPlaying] = useState(true);
  const [replayTime, setReplayTime] = useState(0);
  const [volume, setVolume] = useState(100);

  useEffect(() => {
    if (isSpectating) {
      const session = spectatorMgr.joinSpectator(matchId, userId, userName);
      setSessionId(session.sessionId);

      const interval = setInterval(() => {
        const liveEvents = spectatorMgr.getLiveEvents(matchId);
        setEvents(liveEvents);
        setSpectatorCount(spectatorMgr.getSpectatorCount(matchId));
      }, 1000);

      return () => {
        clearInterval(interval);
        spectatorMgr.leaveSpectator(matchId, session.sessionId);
      };
    }
  }, [isSpectating, matchId]);

  const handleStartSpectating = () => {
    setIsSpectating(true);
  };

  const handleStopSpectating = () => {
    setIsSpectating(false);
  };

  const handleCreateReplay = () => {
    const replay = spectatorMgr.createReplay(matchId, true);
    console.log('Replay created:', replay);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Eye size={32} className="text-emerald-400" />
            Spectator Mode
          </h1>
          <p className="text-slate-400">Watch live matches and review replays</p>
        </div>

        {isSpectating ? (
          <div className="space-y-6">
            {/* Live Match Viewer */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              {/* Video Player */}
              <div className="bg-black aspect-video flex items-center justify-center relative group">
                <div className="text-center">
                  <div className="text-6xl text-slate-600 mb-4">▶</div>
                  <p className="text-slate-400">Live Match Feed</p>
                </div>

                {/* Player Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="text-white hover:text-emerald-400 transition"
                    >
                      {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </button>

                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={replayTime}
                        onChange={e => setReplayTime(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-white text-sm">
                        {Math.floor(replayTime / 60)}:{String(replayTime % 60).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Volume2 size={20} className="text-white" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={e => setVolume(Number(e.target.value))}
                        className="w-20"
                      />
                    </div>

                    <button className="text-white hover:text-emerald-400 transition">
                      <Maximize size={20} />
                    </button>
                  </div>
                </div>

                {/* Spectator Badge */}
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>

                {/* Spectator Count */}
                <div className="absolute top-4 left-4 bg-slate-800/80 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Eye size={16} />
                  <span>{spectatorCount} watching</span>
                </div>
              </div>

              {/* Controls */}
              <div className="p-4 bg-slate-700/50 border-t border-slate-600 flex gap-3">
                <button
                  onClick={handleStopSpectating}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  Stop Watching
                </button>
                <button
                  onClick={handleCreateReplay}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
                >
                  <Download size={16} />
                  Save Replay
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition">
                  <Share2 size={16} />
                  Share
                </button>
              </div>
            </div>

            {/* Match Events */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Events Timeline */}
              <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Match Events</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {events.length === 0 ? (
                    <p className="text-slate-400">No events yet</p>
                  ) : (
                    events.map(event => (
                      <EventTimeline key={event.eventId} event={event} />
                    ))
                  )}
                </div>
              </div>

              {/* Match Info */}
              <div className="space-y-4">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Match Info</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Match ID</span>
                      <span className="text-white font-semibold text-sm">{matchId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <span className="text-emerald-400 font-semibold">LIVE</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Spectators</span>
                      <span className="text-white font-semibold">{spectatorCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Events</span>
                      <span className="text-white font-semibold">{events.length}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Stats</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Home Team Score</span>
                      <span className="text-emerald-400 font-bold">3</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Away Team Score</span>
                      <span className="text-blue-400 font-bold">2</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Possession</span>
                      <span className="text-white font-bold">55% - 45%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Shots on Target</span>
                      <span className="text-white font-bold">6 - 4</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
            <Eye size={64} className="mx-auto text-slate-600 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Ready to Watch?</h2>
            <p className="text-slate-400 mb-6">Join a live match and spectate with other players</p>

            <div className="flex gap-4 justify-center mb-6">
              <input
                type="text"
                value={matchId}
                onChange={e => setMatchId(e.target.value)}
                placeholder="Enter match ID"
                className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleStartSpectating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
              >
                <Eye size={20} />
                Start Spectating
              </button>
            </div>

            {/* Featured Matches */}
            <div className="mt-12">
              <h3 className="text-xl font-bold text-white mb-6">Featured Matches</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FeaturedMatch title="Championship Final" team1="Team A" team2="Team B" score="2 - 1" spectators={156} />
                <FeaturedMatch title="League Match" team1="Team C" team2="Team D" score="1 - 1" spectators={89} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Event Timeline Component
 */
function EventTimeline({ event }: { event: LiveMatchEvent }) {
  const eventIcons: Record<string, string> = {
    goal: '⚽',
    card: '🟨',
    substitution: '🔄',
    injury: '🤕',
    foul: '⚠️',
    possession: '👟',
    other: '📍',
  };

  return (
    <div className="flex gap-3 pb-3 border-b border-slate-700 last:border-b-0">
      <div className="text-2xl flex-shrink-0">{eventIcons[event.type]}</div>
      <div className="flex-1">
        <p className="text-white text-sm font-semibold">{event.description}</p>
        {event.playerName && <p className="text-slate-400 text-xs">{event.playerName}</p>}
      </div>
      <div className="text-slate-500 text-xs flex items-center gap-1">
        <Clock size={12} />
        {Math.floor(event.timestamp / 60000)}m
      </div>
    </div>
  );
}

/**
 * Featured Match Component
 */
function FeaturedMatch({
  title,
  team1,
  team2,
  score,
  spectators,
}: {
  title: string;
  team1: string;
  team2: string;
  score: string;
  spectators: number;
}) {
  return (
    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition cursor-pointer">
      <div className="text-sm text-emerald-400 font-semibold mb-3">LIVE</div>
      <h4 className="text-lg font-bold text-white mb-4">{title}</h4>

      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <p className="text-white font-semibold">{team1}</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-white">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">{team2}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400 border-t border-slate-600 pt-3">
        <span className="flex items-center gap-1">
          <Eye size={16} />
          {spectators} watching
        </span>
        <button className="text-emerald-400 hover:text-emerald-300 font-semibold">Watch Now</button>
      </div>
    </div>
  );
}
