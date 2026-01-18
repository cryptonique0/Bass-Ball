'use client';

import React, { useState, useEffect } from 'react';
import { TacticalSystem, TacticalSliders, TeamFormation } from '@/lib/tacticalSystem';
import { Sliders, Grid3x3, Settings, TrendingUp, Play, Pause } from 'lucide-react';

/**
 * Tactical Manager Component
 * Configure team formation, sliders, and tactical strategies
 */
export function TacticalManager() {
  const tacticalMgr = TacticalSystem.getInstance();
  const [matchId] = useState('match_001');
  const [teamId] = useState('team_001');
  
  const [activeTab, setActiveTab] = useState<'sliders' | 'formation' | 'presets' | 'analysis'>('sliders');
  const [tactics, setTactics] = useState(tacticalMgr.getMatchTactics(matchId));
  const [formations, setFormations] = useState(tacticalMgr.getAllFormations());
  const [selectedFormation, setSelectedFormation] = useState<TeamFormation | null>(null);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const updated = tacticalMgr.getMatchTactics(matchId);
    setTactics(updated);
    if (updated) {
      setSelectedFormation(updated.homeTeamTactics.formation);
    }
  }, [matchId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings size={32} className="text-cyan-400" />
            Tactical Management
          </h1>
          <p className="text-slate-400">Configure your team's formation, pressing, tempo, and width</p>
        </div>

        {/* Live Status Badge */}
        <div className="mb-6 flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
            isLive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
          }`}>
            {isLive ? <Play size={16} /> : <Pause size={16} />}
            {isLive ? 'Live Match' : 'Practice Mode'}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          {[
            { id: 'sliders' as const, label: 'Tactical Sliders', icon: <Sliders size={18} /> },
            { id: 'formation' as const, label: 'Formation', icon: <Grid3x3 size={18} /> },
            { id: 'presets' as const, label: 'Presets', icon: <Settings size={18} /> },
            { id: 'analysis' as const, label: 'Analysis', icon: <TrendingUp size={18} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === tab.id
                  ? 'text-cyan-400 border-cyan-400'
                  : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'sliders' && tactics && <SlidersTab tactics={tactics} teamId={teamId} />}
        {activeTab === 'formation' && <FormationTab selectedFormation={selectedFormation} formations={formations} />}
        {activeTab === 'presets' && <PresetsTab />}
        {activeTab === 'analysis' && tactics && <AnalysisTab tactics={tactics} teamId={teamId} />}
      </div>
    </div>
  );
}

/**
 * Sliders Tab Component
 */
function SlidersTab({ tactics, teamId }: { tactics: any; teamId: string }) {
  const tacticalMgr = TacticalSystem.getInstance();
  const sliders = tactics.homeTeamTactics.sliders;

  const [pressing, setPressing] = useState(sliders.pressing);
  const [tempo, setTempo] = useState(sliders.tempo);
  const [width, setWidth] = useState(sliders.width);
  const [defensiveLineHeight, setDefensiveLineHeight] = useState(sliders.defensiveLineHeight);
  const [offensiveAggression, setOffensiveAggression] = useState(sliders.offensiveAggression);
  const [buildUpPlay, setBuildUpPlay] = useState(sliders.buildUpPlay);
  const [transitionSpeed, setTransitionSpeed] = useState(sliders.transitionSpeed);
  const [creativity, setCreativity] = useState(sliders.creativity);

  const handleUpdate = () => {
    tacticalMgr.updateTacticalSliders(sliders.slidersId, {
      pressing,
      tempo,
      width,
      defensiveLineHeight,
      offensiveAggression,
      buildUpPlay,
      transitionSpeed,
      creativity,
    });
  };

  return (
    <div className="space-y-6">
      {/* Slider Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SliderCard
          label="Pressing Intensity"
          description="High pressure vs. Low pressure"
          icon="🎯"
          value={pressing}
          onChange={setPressing}
          min={0}
          max={100}
          lowLabel="Low Pressure"
          highLabel="High Pressure"
          color="emerald"
        />
        <SliderCard
          label="Tempo"
          description="Slow build-up vs. Fast counter"
          icon="⚡"
          value={tempo}
          onChange={setTempo}
          min={0}
          max={100}
          lowLabel="Slow Build"
          highLabel="Fast Counter"
          color="blue"
        />
        <SliderCard
          label="Width"
          description="Narrow/compact vs. Wide/expansive"
          icon="↔️"
          value={width}
          onChange={setWidth}
          min={0}
          max={100}
          lowLabel="Narrow"
          highLabel="Wide"
          color="purple"
        />
        <SliderCard
          label="Defensive Line Height"
          description="Deep defense vs. High press"
          icon="🛡️"
          value={defensiveLineHeight}
          onChange={setDefensiveLineHeight}
          min={0}
          max={100}
          lowLabel="Deep"
          highLabel="High Press"
          color="red"
        />
        <SliderCard
          label="Offensive Aggression"
          description="Passive vs. Aggressive attack"
          icon="⚔️"
          value={offensiveAggression}
          onChange={setOffensiveAggression}
          min={0}
          max={100}
          lowLabel="Passive"
          highLabel="Aggressive"
          color="orange"
        />
        <SliderCard
          label="Build-up Play"
          description="Long balls vs. Short passes"
          icon="🎮"
          value={buildUpPlay}
          onChange={setBuildUpPlay}
          min={0}
          max={100}
          lowLabel="Long Balls"
          highLabel="Short Passes"
          color="cyan"
        />
        <SliderCard
          label="Transition Speed"
          description="Slow possession vs. Fast transitions"
          icon="🔄"
          value={transitionSpeed}
          onChange={setTransitionSpeed}
          min={0}
          max={100}
          lowLabel="Slow"
          highLabel="Fast"
          color="amber"
        />
        <SliderCard
          label="Creativity"
          description="Structured play vs. Creative/risky"
          icon="🎨"
          value={creativity}
          onChange={setCreativity}
          min={0}
          max={100}
          lowLabel="Structured"
          highLabel="Creative"
          color="pink"
        />
      </div>

      {/* Summary & Apply */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Tactical Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <TacticSummaryBox label="Pressing" value={pressing} color="emerald" />
          <TacticSummaryBox label="Tempo" value={tempo} color="blue" />
          <TacticSummaryBox label="Width" value={width} color="purple" />
          <TacticSummaryBox label="D-Line Height" value={defensiveLineHeight} color="red" />
        </div>

        <button
          onClick={handleUpdate}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          <Settings size={20} />
          Apply Tactical Changes
        </button>
      </div>

      {/* Tips */}
      <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
        <h4 className="font-bold text-white mb-3">💡 Tactical Tips</h4>
        <ul className="space-y-2 text-sm text-slate-300">
          <li>• <strong>High Pressing + High D-Line:</strong> Aggressive attacking setup, risky in defense</li>
          <li>• <strong>Low Pressing + Deep D-Line:</strong> Defensive setup, good for countering</li>
          <li>• <strong>High Tempo + Wide:</strong> End-to-end attacking football</li>
          <li>• <strong>High Creativity + High Aggression:</strong> Exciting but unpredictable play</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Slider Card Component
 */
function SliderCard({
  label,
  description,
  icon,
  value,
  onChange,
  min,
  max,
  lowLabel,
  highLabel,
  color,
}: {
  label: string;
  description: string;
  icon: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  lowLabel: string;
  highLabel: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    emerald: 'from-emerald-600 to-emerald-700',
    blue: 'from-blue-600 to-blue-700',
    purple: 'from-purple-600 to-purple-700',
    red: 'from-red-600 to-red-700',
    orange: 'from-orange-600 to-orange-700',
    cyan: 'from-cyan-600 to-cyan-700',
    amber: 'from-amber-600 to-amber-700',
    pink: 'from-pink-600 to-pink-700',
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            {label}
          </h3>
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        </div>
        <div className={`bg-gradient-to-br ${colorClasses[color]} text-white px-4 py-2 rounded-lg font-bold text-lg`}>
          {value}
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
      />

      <div className="flex justify-between text-xs text-slate-400 mt-3">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

/**
 * Tactic Summary Box Component
 */
function TacticSummaryBox({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
  };

  return (
    <div className="bg-slate-700/50 rounded-lg p-4 text-center">
      <div className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-2">{label}</div>
    </div>
  );
}

/**
 * Formation Tab Component
 */
function FormationTab({ selectedFormation, formations }: { selectedFormation: TeamFormation | null; formations: TeamFormation[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {formations.map(formation => (
          <FormationCard
            key={formation.formationId}
            formation={formation}
            isSelected={selectedFormation?.formationId === formation.formationId}
          />
        ))}
      </div>

      {selectedFormation && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-white mb-2">{selectedFormation.name}</h2>
          <p className="text-slate-400 mb-8">{selectedFormation.description}</p>

          {/* Pitch Visualization */}
          <div className="bg-gradient-to-b from-green-600 to-green-700 rounded-lg p-8 aspect-video flex items-center justify-center mb-8 relative overflow-hidden">
            {/* Pitch markings */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-1/2 w-1 h-full bg-white transform -translate-x-1/2" />
              <div className="absolute top-1/2 left-0 w-full h-1 bg-white transform -translate-y-1/2" />
              <div className="absolute top-1/4 left-0 w-full h-1 border-t border-white opacity-30" />
              <div className="absolute top-3/4 left-0 w-full h-1 border-t border-white opacity-30" />
            </div>

            {/* Player positions */}
            <div className="relative w-full h-full">
              {Array.from(selectedFormation.positions.values()).map((pos, idx) => (
                <div
                  key={idx}
                  className="absolute w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {pos.shortName}
                </div>
              ))}
            </div>
          </div>

          {/* Position Details */}
          <h3 className="text-xl font-bold text-white mb-4">Player Positions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from(selectedFormation.positions.values()).map(pos => (
              <div key={pos.positionName} className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="font-bold text-white">{pos.positionName}</h4>
                <p className="text-sm text-slate-400 mt-1">{pos.responsibilities.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Formation Card Component
 */
function FormationCard({ formation, isSelected }: { formation: TeamFormation; isSelected: boolean }) {
  return (
    <div
      className={`rounded-lg p-6 border-2 transition cursor-pointer ${
        isSelected
          ? 'bg-cyan-600/20 border-cyan-400'
          : 'bg-slate-800 border-slate-700 hover:border-slate-500'
      }`}
    >
      <h3 className="text-2xl font-bold text-white mb-2">{formation.name}</h3>
      <p className="text-sm text-slate-400 mb-4">{formation.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {Array.from(formation.positions.values()).length} Players
        </span>
        {isSelected && <span className="text-emerald-400 font-bold text-sm">✓ Selected</span>}
      </div>
    </div>
  );
}

/**
 * Presets Tab Component
 */
function PresetsTab() {
  const tacticalMgr = TacticalSystem.getInstance();
  const presets = tacticalMgr.getAllPresets();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {presets.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <Settings size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">No presets created yet</p>
        </div>
      ) : (
        presets.map(preset => (
          <PresetCard key={preset.presetId} preset={preset} />
        ))
      )}
    </div>
  );
}

/**
 * Preset Card Component
 */
function PresetCard({ preset }: { preset: any }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-500 transition cursor-pointer">
      <h3 className="text-xl font-bold text-white mb-2">{preset.name}</h3>
      <p className="text-sm text-slate-400 mb-4">{preset.description}</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-700/50 rounded p-2 text-center">
          <div className="text-emerald-400 font-bold">{preset.sliders.pressing}</div>
          <div className="text-xs text-slate-400">Pressing</div>
        </div>
        <div className="bg-slate-700/50 rounded p-2 text-center">
          <div className="text-blue-400 font-bold">{preset.sliders.tempo}</div>
          <div className="text-xs text-slate-400">Tempo</div>
        </div>
        <div className="bg-slate-700/50 rounded p-2 text-center">
          <div className="text-purple-400 font-bold">{preset.sliders.width}</div>
          <div className="text-xs text-slate-400">Width</div>
        </div>
        <div className="bg-slate-700/50 rounded p-2 text-center">
          <div className="text-amber-400 font-bold">{Math.round((preset.winRate || 0) * 100)}%</div>
          <div className="text-xs text-slate-400">Win Rate</div>
        </div>
      </div>

      <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded-lg transition text-sm">
        Load Preset
      </button>
    </div>
  );
}

/**
 * Analysis Tab Component
 */
function AnalysisTab({ tactics, teamId }: { tactics: any; teamId: string }) {
  const tacticalMgr = TacticalSystem.getInstance();
  const analytics = tacticalMgr.getAnalytics(tactics.matchId, teamId);

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <TrendingUp size={48} className="mx-auto text-slate-600 mb-4" />
        <p className="text-slate-400">No tactical analysis available yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Formation Effectiveness</h3>
        <div className="space-y-2">
          {Object.entries(analytics.formationEffectiveness).map(([key, value]: [string, any]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-slate-300">{key}</span>
              <div className="w-32 bg-slate-700 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, value * 10))}%` }}
                />
              </div>
              <span className="text-emerald-400 font-bold text-sm">{(value * 10).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Key Metrics</h3>
        <div className="space-y-3">
          <MetricRow label="Pressure Success" value={analytics.pressureSuccess} color="emerald" />
          <MetricRow label="Possession Lost" value={analytics.possessionLost} color="red" />
          <MetricRow label="Creative Success" value={analytics.creativeSuccess} color="blue" />
          <MetricRow label="Defensive Errors" value={analytics.defensiveErrors} color="orange" />
        </div>
      </div>

      {analytics.adjustments.length > 0 && (
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">In-Match Adjustments</h3>
          <div className="space-y-2">
            {analytics.adjustments.slice(0, 5).map(adj => (
              <div key={adj.adjustmentId} className="bg-slate-700/50 rounded p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white font-semibold">Minute {adj.gameMinute}</span>
                  <span className={`font-bold ${adj.effectiveness > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {adj.effectiveness > 0 ? '+' : ''}{adj.effectiveness}
                  </span>
                </div>
                <p className="text-slate-400">{adj.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Metric Row Component
 */
function MetricRow({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
  };

  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-400">{label}</span>
      <span className={`font-bold text-lg ${colorClasses[color]}`}>{value.toFixed(1)}%</span>
    </div>
  );
}
