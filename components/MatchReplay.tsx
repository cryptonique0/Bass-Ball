/**
 * Match Replay Component
 * Displays match logs and enables interactive replay
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MatchLog, MatchEvent, MatchReplayer, MatchLogger } from '@/lib/matchLogger';

interface MatchReplayProps {
  match: MatchLog;
  compact?: boolean;
  autoPlay?: boolean;
}

/**
 * Timeline Scrubber Component
 */
function TimelineScrubber({
  duration,
  currentTime,
  progress,
  onSeek,
}: {
  duration: number;
  currentTime: number;
  progress: number;
  onSeek: (seconds: number) => void;
}) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const seconds = Math.floor(percentage * duration);
    onSeek(seconds);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      <div
        className="relative w-full h-2 bg-gray-200 rounded-full cursor-pointer hover:h-3 transition-all"
        onClick={handleClick}
      >
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 bg-blue-500 rounded-full shadow-lg"
          style={{ left: `${progress}%` }}
        />
        <div
          className="absolute left-0 top-0 h-full bg-blue-400 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-600">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration * 60)}</span>
      </div>
    </div>
  );
}

/**
 * Event Timeline Component
 */
function EventTimeline({ events }: { events: MatchEvent[] }) {
  const eventCounts = {
    goal: 0,
    assist: 0,
    card: 0,
    other: 0,
  };

  events.forEach(e => {
    if (e.type === 'goal') eventCounts.goal++;
    else if (e.type === 'assist') eventCounts.assist++;
    else if (e.type === 'card') eventCounts.card++;
    else eventCounts.other++;
  });

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">Event Summary</h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-green-50 p-2 rounded border border-green-200">
          <div className="text-green-700 font-bold">{eventCounts.goal}</div>
          <div className="text-green-600">Goals</div>
        </div>
        <div className="bg-blue-50 p-2 rounded border border-blue-200">
          <div className="text-blue-700 font-bold">{eventCounts.assist}</div>
          <div className="text-blue-600">Assists</div>
        </div>
        <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
          <div className="text-yellow-700 font-bold">{eventCounts.card}</div>
          <div className="text-yellow-600">Cards</div>
        </div>
        <div className="bg-gray-50 p-2 rounded border border-gray-200">
          <div className="text-gray-700 font-bold">{eventCounts.other}</div>
          <div className="text-gray-600">Other</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Event List Component
 */
function EventList({ events, currentTime }: { events: MatchEvent[]; currentTime: number }) {
  const currentSeconds = currentTime;
  const eventsBeforeCurrent = events.filter(e => e.timestamp / 1000 <= currentSeconds);

  const getEventColor = (type: MatchEvent['type']) => {
    switch (type) {
      case 'goal':
        return 'text-green-600 bg-green-50';
      case 'assist':
        return 'text-blue-600 bg-blue-50';
      case 'card':
        return 'text-yellow-600 bg-yellow-50';
      case 'shot':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getEventEmoji = (type: MatchEvent['type']) => {
    switch (type) {
      case 'goal':
        return '⚽';
      case 'assist':
        return '🎯';
      case 'card':
        return '🟡';
      case 'shot':
        return '🔫';
      case 'tackle':
        return '🛡️';
      case 'foul':
        return '⚠️';
      default:
        return '📝';
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">Match Events</h3>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {eventsBeforeCurrent.length === 0 ? (
          <div className="text-xs text-gray-500 italic">No events yet...</div>
        ) : (
          eventsBeforeCurrent.map((event, idx) => (
            <div
              key={idx}
              className={`p-2 rounded text-xs font-medium flex items-center gap-2 ${getEventColor(event.type)}`}
            >
              <span className="text-lg">{getEventEmoji(event.type)}</span>
              <span className="flex-1">
                <span className="font-bold">{event.player}</span>
                {event.type === 'card' && event.details?.card && (
                  <span className="ml-1">({event.details.card} card)</span>
                )}
              </span>
              <span className="text-xs opacity-75">{formatTime(event.timestamp)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Score Display Component
 */
function ScoreDisplay({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
}: {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="text-xs text-gray-600 font-medium">{homeTeam}</div>
          <div className="text-3xl font-bold text-blue-600">{homeScore}</div>
        </div>

        <div className="flex items-center gap-2 px-4">
          <div className="text-xl font-bold text-gray-400">vs</div>
        </div>

        <div className="text-center flex-1">
          <div className="text-xs text-gray-600 font-medium">{awayTeam}</div>
          <div className="text-3xl font-bold text-indigo-600">{awayScore}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Player Stats Panel Component
 */
function PlayerStatsPanel({ match }: { match: MatchLog }) {
  const stats = MatchLogger.getMatchStats(match);
  const sortedPlayers = Object.entries(match.playerStats).sort(
    (a, b) => (b[1].goals + b[1].assists) - (a[1].goals + a[1].assists)
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Player Stats</h3>

      {stats.topScorer && (
        <div className="bg-green-50 p-3 rounded border border-green-200">
          <div className="text-xs font-medium text-green-700">⚽ Top Scorer</div>
          <div className="text-sm font-bold text-green-900">
            {stats.topScorer.name} - {stats.topScorer.goals} goals
          </div>
        </div>
      )}

      {stats.topAssister && (
        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <div className="text-xs font-medium text-blue-700">🎯 Top Assister</div>
          <div className="text-sm font-bold text-blue-900">
            {stats.topAssister.name} - {stats.topAssister.assists} assists
          </div>
        </div>
      )}

      <div className="text-xs space-y-1">
        <div>Top Performers:</div>
        {sortedPlayers.slice(0, 5).map(([player, stats]) => (
          <div key={player} className="text-gray-600 ml-2">
            {player}: {stats.goals}G {stats.assists}A {stats.shots}S {stats.tackles}T
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Main Match Replay Component
 */
export const MatchReplay: React.FC<MatchReplayProps> = ({
  match,
  compact = false,
  autoPlay = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [displayScore, setDisplayScore] = useState({ home: 0, away: 0 });
  const replayerRef = useRef<MatchReplayer | null>(null);

  useEffect(() => {
    replayerRef.current = new MatchReplayer(match);

    return () => {
      replayerRef.current?.stop();
    };
  }, [match]);

  useEffect(() => {
    if (!replayerRef.current) return;

    if (isPlaying) {
      replayerRef.current.setSpeed(playbackSpeed);
      replayerRef.current.play((event) => {
        setCurrentTime(Math.floor(event.timestamp / 1000));

        if (event.type === 'goal') {
          setDisplayScore(prev => ({
            ...prev,
            [event.team === 'home' ? 'home' : 'away']: prev[event.team === 'home' ? 'home' : 'away'] + 1,
          }));
        }
      });
    } else {
      replayerRef.current.pause();
    }

    return () => {
      if (replayerRef.current) {
        replayerRef.current.pause();
      }
    };
  }, [isPlaying, playbackSpeed, match]);

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    if (replayerRef.current) {
      replayerRef.current.skipTo(seconds);

      // Update display score based on goals before seek time
      const goalsBeforeSeek = match.events.filter(
        e => e.type === 'goal' && e.timestamp / 1000 <= seconds
      );

      const homeGoals = goalsBeforeSeek.filter(e => e.team === 'home').length;
      const awayGoals = goalsBeforeSeek.filter(e => e.team === 'away').length;

      setDisplayScore({ home: homeGoals, away: awayGoals });
    }
  };

  const stats = MatchLogger.getMatchStats(match);
  const progress = (currentTime / (match.duration * 60)) * 100;

  if (compact) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
        <ScoreDisplay
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          homeScore={displayScore.home}
          awayScore={displayScore.away}
        />

        <div className="flex gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex-1 py-2 px-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm transition-colors"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={() => {
              setCurrentTime(0);
              setDisplayScore({ home: 0, away: 0 });
              if (replayerRef.current) replayerRef.current.stop();
            }}
            className="flex-1 py-2 px-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium text-sm transition-colors"
          >
            ⟲ Reset
          </button>
        </div>

        <TimelineScrubber
          duration={match.duration}
          currentTime={currentTime}
          progress={progress}
          onSeek={handleSeek}
        />

        <EventTimeline events={match.events} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Match Replay</h2>
        <ScoreDisplay
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          homeScore={displayScore.home}
          awayScore={displayScore.away}
        />
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>

          <button
            onClick={() => {
              setCurrentTime(0);
              setDisplayScore({ home: 0, away: 0 });
              if (replayerRef.current) replayerRef.current.stop();
              setIsPlaying(false);
            }}
            className="py-2 px-4 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium transition-colors"
          >
            ⟲ Reset
          </button>

          <div className="flex-1">
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm"
            >
              <option value={0.25}>0.25x Speed</option>
              <option value={0.5}>0.5x Speed</option>
              <option value={1}>1x Speed</option>
              <option value={1.5}>1.5x Speed</option>
              <option value={2}>2x Speed</option>
            </select>
          </div>
        </div>

        <TimelineScrubber
          duration={match.duration}
          currentTime={currentTime}
          progress={progress}
          onSeek={handleSeek}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Events Timeline */}
        <div className="col-span-2">
          <EventList events={match.events} currentTime={currentTime} />
        </div>

        {/* Stats Panel */}
        <div>
          <PlayerStatsPanel match={match} />
        </div>
      </div>

      {/* Match Stats */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Match Statistics</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Total Events</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalEvents}</div>
          </div>
          <div>
            <div className="text-gray-600">Total Goals</div>
            <div className="text-2xl font-bold text-green-600">{stats.totalGoals}</div>
          </div>
          <div>
            <div className="text-gray-600">Total Tackles</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalTackles}</div>
          </div>
          <div>
            <div className="text-gray-600">Total Passes</div>
            <div className="text-2xl font-bold text-purple-600">{stats.totalPasses}</div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            const json = MatchLogger.toJSON(match);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `match_${match.id}.json`;
            a.click();
          }}
          className="flex-1 py-2 px-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm font-medium transition-colors"
        >
          📥 Export JSON
        </button>

        <button
          onClick={() => {
            const csv = MatchLogger.toCSV(match);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `match_${match.id}.csv`;
            a.click();
          }}
          className="flex-1 py-2 px-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm font-medium transition-colors"
        >
          📊 Export CSV
        </button>

        <button
          onClick={() => {
            const report = MatchLogger.generateReport(match);
            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `match_${match.id}_report.txt`;
            a.click();
          }}
          className="flex-1 py-2 px-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium transition-colors"
        >
          📄 Export Report
        </button>
      </div>
    </div>
  );
};

export default MatchReplay;
