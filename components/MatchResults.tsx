'use client';

import React from 'react';
import { MatchStats, MatchEvent } from '@/lib/matchEngine';

interface MatchResultsProps {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  matchStats: MatchStats;
  gameTime: number;
  onRestart?: () => void;
}

interface PlayerStats {
  name: string;
  goals: number;
  assists: number;
  shots: number;
  passes: number;
  tackles: number;
}

export const MatchResults: React.FC<MatchResultsProps> = ({
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  matchStats,
  gameTime,
  onRestart,
}) => {
  // Extract player statistics from events
  const getPlayerStats = (): { home: PlayerStats[]; away: PlayerStats[] } => {
    const homeStats = new Map<string, PlayerStats>();
    const awayStats = new Map<string, PlayerStats>();

    matchStats.events.forEach((event) => {
      const statsMap = event.team === 'home' ? homeStats : awayStats;
      if (!statsMap.has(event.player)) {
        statsMap.set(event.player, { name: event.player, goals: 0, assists: 0, shots: 0, passes: 0, tackles: 0 });
      }
      const stats = statsMap.get(event.player)!;

      if (event.type === 'goal') stats.goals++;
      if (event.type === 'shot') stats.shots++;
      if (event.type === 'pass') stats.passes++;
      if (event.type === 'tackle') stats.tackles++;
    });

    // Track assists separately
    matchStats.events.forEach((event) => {
      if (event.type === 'goal' && event.description.includes('(Assist:')) {
        const assistMatch = event.description.match(/\(Assist: (.+?)\)/);
        if (assistMatch) {
          const assistName = assistMatch[1];
          const statsMap = event.team === 'home' ? homeStats : awayStats;
          if (statsMap.has(assistName)) {
            statsMap.get(assistName)!.assists++;
          }
        }
      }
    });

    return {
      home: Array.from(homeStats.values()).sort((a, b) => b.goals - a.goals),
      away: Array.from(awayStats.values()).sort((a, b) => b.goals - a.goals),
    };
  };

  const playerStats = getPlayerStats();
  const winner = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw';

  // Find MVP (most goals, then assists, then overall impact)
  const getAllPlayers = () => [...playerStats.home.map(p => ({...p, team: 'home'})), ...playerStats.away.map(p => ({...p, team: 'away'}))];
  const mvp = getAllPlayers.sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    if (b.assists !== a.assists) return b.assists - a.assists;
    return (b.shots + b.passes + b.tackles) - (a.shots + a.passes + a.tackles);
  })[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
          FULL TIME
        </h1>
        <p className="text-gray-300 text-center text-lg">
          Match Duration: {Math.floor(gameTime)} minutes
        </p>
      </div>

      {/* Final Score */}
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-8 mb-8 border border-blue-500/30 shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1 text-center">
            <p className="text-gray-400 text-sm mb-2">HOME</p>
            <p className="text-white text-xl font-semibold mb-1">{homeTeamName}</p>
          </div>
          <div className="flex-1 text-center">
            <div className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              {homeScore}
            </div>
            <p className="text-gray-400 text-xs mt-2">-</p>
            <div className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              {awayScore}
            </div>
          </div>
          <div className="flex-1 text-center">
            <p className="text-gray-400 text-sm mb-2">AWAY</p>
            <p className="text-white text-xl font-semibold mb-1">{awayTeamName}</p>
          </div>
        </div>

        {/* Result Badge */}
        <div className="text-center">
          <span className={`inline-block px-6 py-2 rounded-full text-lg font-bold ${
            winner === 'draw' ? 'bg-gray-600/40 text-gray-200' :
            winner === 'home' ? 'bg-yellow-500/30 text-yellow-200' :
            'bg-cyan-500/30 text-cyan-200'
          }`}>
            {winner === 'draw' ? 'DRAW' : `${winner === 'home' ? homeTeamName : awayTeamName} WINS`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Home Team Stats */}
        <StatsPanel
          teamName={homeTeamName}
          teamColor="yellow"
          stats={matchStats.homeTeam}
          playerStats={playerStats.home}
          isWinner={winner === 'home'}
        />

        {/* Away Team Stats */}
        <StatsPanel
          teamName={awayTeamName}
          teamColor="cyan"
          stats={matchStats.awayTeam}
          playerStats={playerStats.away}
          isWinner={winner === 'away'}
        />
      </div>

      {/* MVP Section */}
      {mvp && (
        <div className="bg-gradient-to-r from-amber-900/40 to-yellow-900/40 rounded-2xl p-6 mb-8 border border-yellow-500/50 text-center">
          <p className="text-yellow-200 text-sm font-semibold mb-2">PLAYER OF THE MATCH</p>
          <p className="text-white text-3xl font-bold mb-1">{mvp.name}</p>
          <p className="text-gray-300">
            {mvp.goals} goals • {mvp.assists} assists • {mvp.shots} shots
          </p>
        </div>
      )}

      {/* Restart Button */}
      {onRestart && (
        <div className="text-center">
          <button
            onClick={onRestart}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300"
          >
            Return to Menu
          </button>
        </div>
      )}
    </div>
  );
};

interface StatsPanelProps {
  teamName: string;
  teamColor: 'yellow' | 'cyan';
  stats: MatchStats['homeTeam'];
  playerStats: PlayerStats[];
  isWinner: boolean;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ teamName, teamColor, stats, playerStats, isWinner }) => {
  const colorClasses = teamColor === 'yellow'
    ? { bg: 'bg-yellow-900/20', border: 'border-yellow-500/30', text: 'text-yellow-200', header: 'from-yellow-600/30 to-yellow-800/20' }
    : { bg: 'bg-cyan-900/20', border: 'border-cyan-500/30', text: 'text-cyan-200', header: 'from-cyan-600/30 to-cyan-800/20' };

  return (
    <div className={`${colorClasses.bg} rounded-xl border ${colorClasses.border} p-6`}>
      <h3 className={`text-xl font-bold ${colorClasses.text} mb-6 flex items-center gap-2`}>
        {isWinner && <span className="text-2xl">👑</span>}
        {teamName}
      </h3>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatBox label="Goals" value={stats.goals} color={teamColor} />
        <StatBox label="Assists" value={stats.assists} color={teamColor} />
        <StatBox label="Shots" value={stats.shots} color={teamColor} />
        <StatBox label="On Target" value={stats.shotsOnTarget} color={teamColor} />
        <StatBox label="Passes" value={stats.passes} color={teamColor} />
        <StatBox label="Accuracy" value={`${stats.passAccuracy}%`} color={teamColor} />
        <StatBox label="Tackles" value={stats.tackles} color={teamColor} />
        <StatBox label="Fouls" value={stats.fouls} color={teamColor} />
        <StatBox label="Possession" value={`${stats.possession}%`} color={teamColor} />
        <StatBox label="Yellow" value={stats.yellowCards} color={teamColor} />
        <StatBox label="Red" value={stats.redCards} color={teamColor} />
      </div>

      {/* Top Players */}
      {playerStats.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">TOP PERFORMERS</h4>
          <div className="space-y-2">
            {playerStats.slice(0, 3).map((player, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-white font-medium">{player.name}</span>
                <span className={`text-xs font-semibold ${colorClasses.text}`}>
                  {player.goals > 0 && `${player.goals}⚽`}
                  {player.assists > 0 && ` ${player.assists}⭐`}
                  {player.goals === 0 && player.assists === 0 && `${player.shots}🎯`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface StatBoxProps {
  label: string;
  value: string | number;
  color: 'yellow' | 'cyan';
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, color }) => {
  const colorClass = color === 'yellow' ? 'text-yellow-300' : 'text-cyan-300';
  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
};
