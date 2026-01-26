import React, { useState, useEffect } from 'react';
import { MatchHighlightGenerator } from '@/lib/matchHighlightGenerator';

interface MatchHighlightsProps {
  matchId: string;
  matchEvents?: any[];
  onHighlightGenerated?: (highlightId: string) => void;
}

export const MatchHighlights: React.FC<MatchHighlightsProps> = ({
  matchId,
  matchEvents = [],
  onHighlightGenerated,
}) => {
  const [activeTab, setActiveTab] = useState<'highlights' | 'events' | 'stats'>('highlights');
  const [highlights, setHighlights] = useState<any>(null);
  const [selectedPreset, setSelectedPreset] = useState('preset_all');
  const [loading, setLoading] = useState(false);

  const presets = [
    { id: 'preset_all', name: 'Full Highlights', duration: '5 min' },
    { id: 'preset_goals', name: 'Goals Only', duration: '2 min' },
    { id: 'preset_attacking', name: 'Attacking Plays', duration: '4 min' },
    { id: 'preset_defensive', name: 'Defensive Highlights', duration: '3 min' },
  ];

  const generateHighlights = async () => {
    setLoading(true);
    const generator = MatchHighlightGenerator.getInstance();
    
    // Use provided events or generate sample events
    const eventsToUse = matchEvents.length > 0 ? matchEvents : generateSampleEvents();
    
    const generated = generator.generateHighlights(
      matchId,
      eventsToUse,
      selectedPreset
    );
    
    setHighlights(generated);
    onHighlightGenerated?.(generated.highlightId);
    setLoading(false);
  };

  const generateSampleEvents = () => {
    return [
      {
        eventId: 'event_1',
        eventType: 'goal',
        timestamp: 15,
        playerId: 'player_1',
        playerName: 'Cristiano',
        teamId: 'team_1',
        teamName: 'Team A',
        position: { x: 90, y: 50 },
        description: 'Left foot finish from close range',
        impact: 100,
      },
      {
        eventId: 'event_2',
        eventType: 'assist',
        timestamp: 15,
        playerId: 'player_2',
        playerName: 'Bruno',
        teamId: 'team_1',
        teamName: 'Team A',
        position: { x: 80, y: 40 },
        description: 'Perfect through ball',
        impact: 80,
      },
      {
        eventId: 'event_3',
        eventType: 'goal',
        timestamp: 45,
        playerId: 'player_3',
        playerName: 'De Bruyne',
        teamId: 'team_2',
        teamName: 'Team B',
        position: { x: 90, y: 60 },
        description: 'Powerful strike from outside box',
        impact: 100,
      },
      {
        eventId: 'event_4',
        eventType: 'save',
        timestamp: 60,
        playerId: 'player_4',
        playerName: 'Neuer',
        teamId: 'team_2',
        teamName: 'Team B',
        position: { x: 5, y: 50 },
        description: 'Incredible diving save',
        impact: 80,
      },
      {
        eventId: 'event_5',
        eventType: 'tackle',
        timestamp: 75,
        playerId: 'player_5',
        playerName: 'Ramos',
        teamId: 'team_1',
        teamName: 'Team A',
        position: { x: 20, y: 50 },
        description: 'Crucial defensive tackle',
        impact: 60,
      },
    ];
  };

  return (
    <div className="w-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {(['highlights', 'events', 'stats'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-3 font-semibold transition-all ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'highlights' && (
          <HighlightsView
            highlights={highlights}
            presets={presets}
            selectedPreset={selectedPreset}
            onPresetChange={setSelectedPreset}
            onGenerate={generateHighlights}
            loading={loading}
          />
        )}
        {activeTab === 'events' && (
          <EventsView events={matchEvents.length > 0 ? matchEvents : generateSampleEvents()} />
        )}
        {activeTab === 'stats' && highlights && (
          <StatsView highlights={highlights} />
        )}
      </div>
    </div>
  );
};

interface HighlightsViewProps {
  highlights: any | null;
  presets: any[];
  selectedPreset: string;
  onPresetChange: (presetId: string) => void;
  onGenerate: () => void;
  loading: boolean;
}

const HighlightsView: React.FC<HighlightsViewProps> = ({
  highlights,
  presets,
  selectedPreset,
  onPresetChange,
  onGenerate,
  loading,
}) => {
  return (
    <div className="space-y-6">
      {/* Preset Selection */}
      <div>
        <h3 className="text-white font-semibold mb-3">Highlight Preset</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {presets.map(preset => (
            <button
              key={preset.id}
              onClick={() => onPresetChange(preset.id)}
              className={`p-3 rounded-lg transition-all border-2 ${
                selectedPreset === preset.id
                  ? 'border-blue-500 bg-blue-900 bg-opacity-30'
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'
              }`}
            >
              <p className="text-white font-semibold">{preset.name}</p>
              <p className="text-slate-400 text-sm">{preset.duration}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold py-3 rounded-lg transition-all"
      >
        {loading ? 'Generating Highlights...' : 'Generate AI Highlights'}
      </button>

      {/* Highlights Display */}
      {highlights && (
        <div className="space-y-4">
          {/* Player of the Match */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg p-4">
            <p className="text-slate-200 text-sm mb-2">Player of the Match</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-lg">{highlights.playerOfTheMatch.playerName}</p>
                <p className="text-amber-100 text-sm">Rating: {highlights.playerOfTheMatch.rating.toFixed(1)}/100</p>
              </div>
              <div className="text-right">
                <p className="text-amber-100 text-sm">Quality</p>
                <p className="text-white font-bold">{highlights.generationQuality.toFixed(0)}%</p>
              </div>
            </div>
          </div>

          {/* Key Moments */}
          <div>
            <h3 className="text-white font-semibold mb-3">Key Moments</h3>
            <div className="space-y-2">
              {highlights.keyMoments.map((moment: any, i: number) => (
                <KeyMomentCard key={i} moment={moment} />
              ))}
            </div>
          </div>

          {/* Highlight Sequences */}
          <div>
            <h3 className="text-white font-semibold mb-3">Highlight Sequences ({highlights.highlightReel.length})</h3>
            <div className="space-y-2">
              {highlights.highlightReel.slice(0, 5).map((seq: any, i: number) => (
                <HighlightSequenceCard key={i} sequence={seq} index={i + 1} />
              ))}
            </div>
          </div>

          {/* Narrative */}
          {highlights.narrativeCommentary.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Commentary</h3>
              <div className="space-y-2 text-slate-300">
                {highlights.narrativeCommentary.slice(0, 3).map((line: string, i: number) => (
                  <p key={i} className="text-sm">{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface EventsViewProps {
  events: any[];
}

const EventsView: React.FC<EventsViewProps> = ({ events }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-white font-semibold">All Match Events</h3>
      <div className="space-y-2">
        {events.map((event, i) => (
          <EventCard key={i} event={event} />
        ))}
      </div>
    </div>
  );
};

interface StatsViewProps {
  highlights: any;
}

const StatsView: React.FC<StatsViewProps> = ({ highlights }) => {
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Total Events" value={highlights.statistics.totalEvents} />
        <StatBox label="Selected" value={highlights.statistics.selectedEvents} />
        <StatBox label="Coverage" value={`${highlights.statistics.coverage.toFixed(0)}%`} />
        <StatBox label="Duration" value={`${(highlights.totalDuration / 60).toFixed(1)}m`} />
      </div>

      {/* Team Statistics */}
      <div>
        <h3 className="text-white font-semibold mb-3">Team Statistics</h3>
        <div className="space-y-3">
          {highlights.teamStatistics.map((team: any, i: number) => (
            <TeamStatCard key={i} team={team} />
          ))}
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-2">Generation Quality</p>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold text-blue-400">{highlights.generationQuality.toFixed(0)}%</p>
            <div className="flex-1 bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-full rounded-full"
                style={{ width: `${highlights.generationQuality}%` }}
              />
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-2">AI Confidence</p>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold text-emerald-400">{highlights.aiConfidence.toFixed(0)}%</p>
            <div className="flex-1 bg-slate-700 rounded-full h-2">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${highlights.aiConfidence}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface KeyMomentCardProps {
  moment: any;
}

const KeyMomentCard: React.FC<KeyMomentCardProps> = ({ moment }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-3 border-l-4 border-amber-500">
      <div className="flex items-start justify-between mb-2">
        <p className="text-white font-semibold">{moment.description}</p>
        <span className="text-xs bg-amber-600 text-white px-2 py-1 rounded">{moment.minute}'</span>
      </div>
      <p className="text-slate-400 text-sm">{moment.significance}</p>
    </div>
  );
};

interface HighlightSequenceCardProps {
  sequence: any;
  index: number;
}

const HighlightSequenceCard: React.FC<HighlightSequenceCardProps> = ({ sequence, index }) => {
  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      goal: 'bg-green-600',
      assist: 'bg-blue-600',
      save: 'bg-purple-600',
      tackle: 'bg-orange-600',
      chance_creation: 'bg-amber-600',
    };
    return colors[type] || 'bg-slate-600';
  };

  return (
    <div className="bg-slate-800 rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <div className={`w-10 h-10 rounded-full ${getTypeColor(sequence.type)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
          {index}
        </div>
        <div>
          <p className="text-white font-semibold capitalize">{sequence.type.replace('_', ' ')}</p>
          <p className="text-slate-400 text-sm">{sequence.narrative}</p>
        </div>
      </div>
      <div className="text-right ml-4">
        <p className="text-slate-400 text-xs mb-1">Intensity</p>
        <div className="w-16 bg-slate-700 rounded-full h-1.5">
          <div
            className="bg-red-500 h-full rounded-full"
            style={{ width: `${sequence.emotionalIntensity}%` }}
          />
        </div>
      </div>
    </div>
  );
};

interface EventCardProps {
  event: any;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const getEventIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      goal: '⚽',
      assist: '🎯',
      shot: '🔫',
      save: '🧤',
      tackle: '🛑',
      interception: '✋',
      yellow_card: '🟨',
      red_card: '🟥',
    };
    return icons[type] || '📍';
  };

  return (
    <div className="bg-slate-800 rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getEventIcon(event.eventType)}</span>
        <div>
          <p className="text-white font-semibold">{event.playerName}</p>
          <p className="text-slate-400 text-sm">{event.description}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-slate-300 font-semibold">{event.timestamp}'</p>
        <p className={`text-sm ${event.impact > 50 ? 'text-emerald-400' : event.impact > 0 ? 'text-blue-400' : 'text-orange-400'}`}>
          Impact: {event.impact > 0 ? '+' : ''}{event.impact}
        </p>
      </div>
    </div>
  );
};

interface StatBoxProps {
  label: string;
  value: string | number;
}

const StatBox: React.FC<StatBoxProps> = ({ label, value }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-3 text-center">
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-white font-bold text-2xl">{value}</p>
    </div>
  );
};

interface TeamStatCardProps {
  team: any;
}

const TeamStatCard: React.FC<TeamStatCardProps> = ({ team }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h4 className="text-white font-semibold mb-3">{team.teamName}</h4>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="text-center">
          <p className="text-slate-400 mb-1">Goals</p>
          <p className="text-emerald-400 font-bold text-lg">{team.goals}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 mb-1">Shots on Target</p>
          <p className="text-blue-400 font-bold text-lg">{team.shotsOnTarget}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 mb-1">Possession</p>
          <p className="text-purple-400 font-bold text-lg">{team.possessionPercentage}%</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm mt-3">
        <div className="text-center">
          <p className="text-slate-400 mb-1">Tackles</p>
          <p className="text-orange-400 font-bold">{team.tackles}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 mb-1">Interceptions</p>
          <p className="text-orange-400 font-bold">{team.interceptions}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 mb-1">Saves</p>
          <p className="text-orange-400 font-bold">{team.saves}</p>
        </div>
      </div>
    </div>
  );
};
