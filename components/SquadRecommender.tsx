import React, { useState, useEffect } from 'react';
import { AISquadRecommendationSystem } from '@/lib/aiSquadRecommendations';

interface SquadRecommenderProps {
  matchType: 'league' | 'cup' | 'friendly' | 'derby' | 'crucial';
  homeAway: 'home' | 'away';
  onRecommendationSelected: (recommendationId: string) => void;
}

export const SquadRecommender: React.FC<SquadRecommenderProps> = ({
  matchType,
  homeAway,
  onRecommendationSelected,
}) => {
  const [activeTab, setActiveTab] = useState<'recommendation' | 'analysis' | 'squad'>('recommendation');
  const [recommendation, setRecommendation] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const system = AISquadRecommendationSystem.getInstance();
    
    // Generate recommendation based on context
    const samplePlayers = Array.from(system['playerDatabase']?.values() || []);
    if (samplePlayers.length > 0) {
      const rec = system.generateSquadRecommendation(samplePlayers, {
        budget: 50000000,
        matchType,
        homeAway,
      });
      setRecommendation(rec);
      onRecommendationSelected(rec.recommendationId);

      // Generate analysis
      const analysisResult = system.analyzeSquad('main_squad', samplePlayers);
      setAnalysis(analysisResult);
    }
    
    setLoading(false);
  }, [matchType, homeAway, onRecommendationSelected]);

  if (loading) {
    return <div className="text-white">Loading squad recommendations...</div>;
  }

  return (
    <div className="w-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {(['recommendation', 'analysis', 'squad'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-3 font-semibold transition-all ${
              activeTab === tab
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'recommendation' && recommendation && (
          <RecommendationView recommendation={recommendation} />
        )}
        {activeTab === 'analysis' && analysis && (
          <AnalysisView analysis={analysis} />
        )}
        {activeTab === 'squad' && recommendation && (
          <SquadView lineup={recommendation.recommendedStartingXI} bench={recommendation.recommendedBench} />
        )}
      </div>
    </div>
  );
};

interface RecommendationViewProps {
  recommendation: any;
}

const RecommendationView: React.FC<RecommendationViewProps> = ({ recommendation }) => {
  return (
    <div className="space-y-6">
      {/* Formation & Confidence */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-2">Recommended Formation</p>
          <p className="text-3xl font-bold text-emerald-400">{recommendation.recommendedFormation}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-2">Confidence Score</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-bold text-blue-400">{recommendation.confidenceScore.toFixed(0)}%</p>
            <div className="flex-1 bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                style={{ width: `${recommendation.confidenceScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-2">Reasoning</h3>
        <p className="text-slate-300 text-sm">{recommendation.reasoning}</p>
      </div>

      {/* Tactics */}
      <TacticsView tactics={recommendation.tacticsSuggestion} />

      {/* Key Strategies */}
      <div>
        <h3 className="text-white font-semibold mb-3">Key Strategies</h3>
        <div className="space-y-2">
          {recommendation.keyStrategies.map((strategy: string, i: number) => (
            <div key={i} className="flex items-start gap-3 bg-slate-800 p-3 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </div>
              <p className="text-slate-300">{strategy}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Captain & Vice-Captain */}
      <div className="grid grid-cols-2 gap-4">
        <PlayerCard player={recommendation.captainSuggestion} role="Captain" />
        <PlayerCard player={recommendation.viceCaptainSuggestion} role="Vice-Captain" />
      </div>
    </div>
  );
};

interface TacticsViewProps {
  tactics: any;
}

const TacticsView: React.FC<TacticsViewProps> = ({ tactics }) => {
  const sliders = [
    { label: 'Pressing', value: tactics.pressing },
    { label: 'Tempo', value: tactics.tempo },
    { label: 'Width', value: tactics.width },
    { label: 'D-Line Height', value: tactics.defensiveLineHeight },
    { label: 'Offensive Aggression', value: tactics.offensiveAggression },
    { label: 'Build-up Play', value: tactics.buildUpPlay },
    { label: 'Transition Speed', value: tactics.transitionSpeed },
    { label: 'Creativity', value: tactics.creativity },
  ];

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4">Tactical Sliders</h3>
      <div className="space-y-3">
        {sliders.map((slider, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300 text-sm">{slider.label}</span>
              <span className="text-emerald-400 font-semibold">{slider.value}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full"
                style={{ width: `${slider.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface AnalysisViewProps {
  analysis: any;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis }) => {
  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <div className="grid grid-cols-4 gap-4">
        <ScoreCard label="Overall Rating" value={analysis.overallRating} color="emerald" />
        <ScoreCard label="Balance" value={analysis.balanceScore} color="blue" />
        <ScoreCard label="Chemistry" value={analysis.chemistryScore} color="purple" />
        <ScoreCard label="Fitness" value={analysis.fitnessScore} color="orange" />
      </div>

      {/* Strengths */}
      <div>
        <h3 className="text-white font-semibold mb-3">Squad Strengths</h3>
        <div className="space-y-2">
          {analysis.strengths.map((strength: any, i: number) => (
            <StrengthCard key={i} strength={strength} />
          ))}
        </div>
      </div>

      {/* Weaknesses */}
      <div>
        <h3 className="text-white font-semibold mb-3">Areas for Improvement</h3>
        <div className="space-y-2">
          {analysis.weaknesses.map((weakness: any, i: number) => (
            <WeaknessCard key={i} weakness={weakness} />
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Improvement Areas</h3>
        <ul className="space-y-2 text-slate-300">
          {analysis.recommendations.formImprovementAreas.map((area: string, i: number) => (
            <li key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              {area}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

interface SquadViewProps {
  lineup: any[];
  bench: any[];
}

const SquadView: React.FC<SquadViewProps> = ({ lineup, bench }) => {
  return (
    <div className="space-y-6">
      {/* Starting XI */}
      <div>
        <h3 className="text-white font-semibold mb-3">Starting XI</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {lineup.map((player, i) => (
            <PlayerLineItem key={i} player={player} />
          ))}
        </div>
      </div>

      {/* Bench */}
      <div>
        <h3 className="text-white font-semibold mb-3">Bench</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {bench.map((player, i) => (
            <PlayerLineItem key={i} player={player} isBench />
          ))}
        </div>
      </div>
    </div>
  );
};

interface PlayerCardProps {
  player: any;
  role: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, role }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-4 text-center">
      <p className="text-slate-400 text-sm mb-2">{role}</p>
      <p className="text-white font-bold text-lg">{player.playerName}</p>
      <p className="text-emerald-400 text-sm">{player.position}</p>
      <div className="mt-2 flex justify-center gap-2">
        <div className="text-center">
          <p className="text-slate-400 text-xs">Overall</p>
          <p className="text-white font-bold">{player.overall?.toFixed(0) || 'N/A'}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-xs">Form</p>
          <p className="text-blue-400 font-bold">{player.form?.toFixed(0) || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

interface PlayerLineItemProps {
  player: any;
  isBench?: boolean;
}

const PlayerLineItem: React.FC<PlayerLineItemProps> = ({ player, isBench }) => {
  return (
    <div className={`p-3 rounded-lg flex items-center justify-between ${isBench ? 'bg-slate-800 opacity-75' : 'bg-slate-800'}`}>
      <div className="flex-1">
        <p className="text-white font-semibold">{player.playerName}</p>
        <p className="text-slate-400 text-xs">{player.position}</p>
      </div>
      <div className="text-right">
        <p className="text-emerald-400 font-bold">{player.overall?.toFixed(0) || 'N/A'}</p>
        <p className="text-slate-400 text-xs">Overall</p>
      </div>
    </div>
  );
};

interface ScoreCardProps {
  label: string;
  value: number;
  color: 'emerald' | 'blue' | 'purple' | 'orange';
}

const ScoreCard: React.FC<ScoreCardProps> = ({ label, value, color }) => {
  const colorClass: { [key: string]: string } = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
  };

  return (
    <div className="bg-slate-800 rounded-lg p-3 text-center">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      <p className={`text-2xl font-bold ${colorClass[color]}`}>{value.toFixed(0)}</p>
    </div>
  );
};

interface StrengthCardProps {
  strength: any;
}

const StrengthCard: React.FC<StrengthCardProps> = ({ strength }) => {
  return (
    <div className="bg-emerald-900 bg-opacity-30 border border-emerald-700 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
        <p className="text-emerald-400 font-semibold">{strength.area}</p>
      </div>
      <p className="text-slate-300 text-sm">{strength.explanation}</p>
    </div>
  );
};

interface WeaknessCardProps {
  weakness: any;
}

const WeaknessCard: React.FC<WeaknessCardProps> = ({ weakness }) => {
  return (
    <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-red-400 font-semibold">{weakness.area}</p>
        <div className="w-12 bg-slate-700 rounded-full h-1.5">
          <div
            className="bg-red-500 h-full rounded-full"
            style={{ width: `${weakness.severity}%` }}
          />
        </div>
      </div>
      <p className="text-slate-300 text-sm mb-1">{weakness.explanation}</p>
      <p className="text-slate-400 text-xs italic">{weakness.suggestedFix}</p>
    </div>
  );
};
