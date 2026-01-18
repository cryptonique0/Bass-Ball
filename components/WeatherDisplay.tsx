'use client';

import React, { useState, useEffect } from 'react';
import { GameplayDynamicsManager, WeatherCondition, PlayerInjury, MatchConditions } from '@/lib/gameplayDynamicsSystem';

/**
 * Weather Display Component
 * Shows weather conditions and gameplay impacts
 */
export function WeatherDisplay({ matchId = 'match_001' }) {
  const dynamicsMgr = GameplayDynamicsManager.getInstance();
  const [conditions, setConditions] = useState<MatchConditions | null>(
    dynamicsMgr.getMatchConditions(matchId)
  );
  const [injuries, setInjuries] = useState<PlayerInjury[]>(dynamicsMgr.getAllActiveInjuries());

  useEffect(() => {
    const interval = setInterval(() => {
      const updated = dynamicsMgr.getMatchConditions(matchId);
      setConditions(updated);
      setInjuries(dynamicsMgr.getAllActiveInjuries());
    }, 5000);

    return () => clearInterval(interval);
  }, [matchId]);

  if (!conditions) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
        <div className="text-4xl mb-2">🌤️</div>
        <p className="text-slate-400">Match conditions not available</p>
      </div>
    );
  }

  const weather = conditions.weather;

  const weatherIcons: Record<string, string> = {
    clear: '☀️',
    rainy: '🌧️',
    snowy: '❄️',
    foggy: '🌫️',
    windy: '💨',
    stormy: '⛈️',
    extreme: '🌪️',
  };

  const backgroundClasses: Record<string, string> = {
    clear: 'bg-gradient-to-br from-blue-600 to-blue-700',
    rainy: 'bg-gradient-to-br from-slate-600 to-slate-700',
    snowy: 'bg-gradient-to-br from-cyan-600 to-blue-700',
    foggy: 'bg-gradient-to-br from-slate-600 to-slate-700',
    windy: 'bg-gradient-to-br from-blue-600 to-cyan-700',
    stormy: 'bg-gradient-to-br from-gray-700 to-slate-800',
    extreme: 'bg-gradient-to-br from-gray-800 to-slate-900',
  };

  const weatherIcon = weatherIcons[weather.type] || '🌤️';
  const backgroundClass = backgroundClasses[weather.type] || 'bg-gradient-to-br from-blue-600 to-blue-700';

  return (
    <div className="space-y-6">
      {/* Main Weather Card */}
      <div className={`rounded-lg p-8 text-white border border-opacity-30 ${backgroundClass}`}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm opacity-75 uppercase tracking-widest">{weather.type}</p>
            <h2 className="text-4xl font-bold mt-2 flex items-center gap-3">
              <span className="text-6xl">{weatherIcon}</span>
              {weather.temperature.toFixed(1)}°C
            </h2>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-75">Intensity</p>
            <p className="text-3xl font-bold">{weather.intensity.toFixed(0)}%</p>
          </div>
        </div>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <WeatherDetailBox label="Wind Speed" value={`${weather.windSpeed.toFixed(1)} km/h`} />
          <WeatherDetailBox label="Rainfall" value={`${weather.rainfall.toFixed(1)} mm/h`} />
          <WeatherDetailBox label="Visibility" value={`${weather.visibility.toFixed(0)}%`} />
          <WeatherDetailBox label="Pitch Condition" value={conditions.pitchCondition} />
        </div>

        {/* Weather Impact on Gameplay */}
        <div className="bg-black/30 rounded-lg p-6 backdrop-blur">
          <h3 className="font-bold text-lg mb-4">Gameplay Impact</h3>
          <div className="space-y-2">
            <ImpactBar
              label="Pass Accuracy"
              value={weather.effectMultipliers.passAccuracy * 100}
              color="blue"
            />
            <ImpactBar
              label="Shooting Accuracy"
              value={weather.effectMultipliers.shootingAccuracy * 100}
              color="red"
            />
            <ImpactBar
              label="Ball Control"
              value={weather.effectMultipliers.ballControl * 100}
              color="emerald"
            />
            <ImpactBar
              label="Player Speed"
              value={weather.effectMultipliers.playerSpeed * 100}
              color="amber"
            />
            <ImpactBar
              label="Tackle Strength"
              value={weather.effectMultipliers.tackleStrength * 100}
              color="orange"
            />
            <ImpactBar
              label="Stamina Drain"
              value={weather.effectMultipliers.staminaDrain * 100}
              color="red"
            />
          </div>
        </div>
      </div>

      {/* Pitch Condition */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Pitch Condition</h3>
        <PitchConditionDisplay condition={conditions.pitchCondition} weather={weather} />
      </div>

      {/* Crowd Impact */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Crowd Atmosphere</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-red-500 to-yellow-500 h-3 rounded-full"
                style={{ width: `${conditions.crowd}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{conditions.crowd.toFixed(0)}%</p>
            <p className="text-xs text-slate-400">Attendance</p>
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-4">
          {conditions.crowd > 75
            ? '🎊 Fantastic atmosphere - Team morale boost'
            : conditions.crowd > 50
            ? '👥 Good support from fans'
            : '😐 Sparse crowd - Limited atmosphere'}
        </p>
      </div>

      {/* Active Injuries */}
      {injuries.length > 0 && (
        <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-red-300 mb-4 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            Active Injuries ({injuries.length})
          </h3>
          <div className="space-y-3">
            {injuries.map(injury => (
              <InjuryCard key={injury.injuryId} injury={injury} />
            ))}
          </div>
        </div>
      )}

      {/* Tips based on weather */}
      <WeatherTips weather={weather} />
    </div>
  );
}

/**
 * Weather Detail Box Component
 */
function WeatherDetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
      <p className="text-xs opacity-75 mb-1">{label}</p>
      <p className="font-bold text-lg">{value}</p>
    </div>
  );
}

/**
 * Impact Bar Component
 */
function ImpactBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'blue' | 'red' | 'emerald' | 'amber' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    orange: 'bg-orange-500',
  };

  const normalizedValue = Math.max(0, Math.min(100, value));

  return (
    <div className="flex items-center justify-between text-sm mb-2">
      <span className="text-white flex-1">{label}</span>
      <div className="w-32 bg-black/20 rounded h-2 mx-4">
        <div
          className={`${colorClasses[color]} h-2 rounded transition-all`}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
      <span className={`font-bold w-12 text-right ${normalizedValue >= 80 ? 'text-emerald-400' : normalizedValue >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
        {normalizedValue.toFixed(0)}%
      </span>
    </div>
  );
}

/**
 * Pitch Condition Display Component
 */
function PitchConditionDisplay({
  condition,
  weather,
}: {
  condition: 'perfect' | 'good' | 'wet' | 'muddy' | 'icy';
  weather: WeatherCondition;
}) {
  const conditionDetails: Record<string, { icon: string; description: string; impact: string }> = {
    perfect: {
      icon: '⚽',
      description: 'Perfect playing surface with optimal grip',
      impact: 'All skills improved by 5%',
    },
    good: {
      icon: '🟩',
      description: 'Good pitch condition, suitable for all play styles',
      impact: 'Normal gameplay',
    },
    wet: {
      icon: '💧',
      description: 'Wet surface due to rain - slippery conditions',
      impact: 'Pass/Shot accuracy -8%, Ball control -5%',
    },
    muddy: {
      icon: '🟫',
      description: 'Muddy and heavy pitch - difficult footing',
      impact: 'Player speed -7%, Stamina drain +25%',
    },
    icy: {
      icon: '❄️',
      description: 'Icy conditions - very slippery',
      impact: 'All skills reduced 15-20%',
    },
  };

  const details = conditionDetails[condition];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="text-5xl">{details.icon}</div>
        <div>
          <h4 className="font-bold text-white text-lg capitalize">{condition} Pitch</h4>
          <p className="text-slate-400 text-sm mt-1">{details.description}</p>
          <p className="text-sm text-amber-300 mt-2 font-semibold">Impact: {details.impact}</p>
        </div>
      </div>

      {/* Weather-to-Pitch mapping */}
      <div className="bg-slate-700/30 rounded-lg p-4 text-sm text-slate-300">
        <p className="font-semibold mb-2">Caused by weather:</p>
        <ul className="space-y-1">
          {weather.rainfall > 10 && <li>• Heavy rainfall ({weather.rainfall.toFixed(0)}mm/h)</li>}
          {weather.intensity > 70 && <li>• Intense weather conditions ({weather.intensity.toFixed(0)}%)</li>}
          {weather.windSpeed > 30 && <li>• Strong winds ({weather.windSpeed.toFixed(0)} km/h)</li>}
          {weather.temperature < 0 && <li>• Below freezing temperature ({weather.temperature.toFixed(1)}°C)</li>}
        </ul>
      </div>
    </div>
  );
}

/**
 * Injury Card Component
 */
function InjuryCard({ injury }: { injury: PlayerInjury }) {
  const severityColor = {
    minor: 'text-yellow-400 bg-yellow-500/20',
    moderate: 'text-orange-400 bg-orange-500/20',
    severe: 'text-red-400 bg-red-500/20',
    critical: 'text-red-600 bg-red-700/20',
  };

  const daysRemaining = Math.ceil((injury.recoveryTime - (Date.now() - injury.timestamp)) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-slate-700/50 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-bold text-white">{injury.playerName}</h4>
          <p className="text-sm text-slate-400">{injury.location.replace('_', ' ')}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${severityColor[injury.severity]}`}>
          {injury.severity.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm mt-3">
        <div>
          <p className="text-slate-400 text-xs">Recovery: {injury.type}</p>
          <div className="w-24 bg-slate-600 rounded-full h-2 mt-1">
            <div
              className="bg-red-500 h-2 rounded-full"
              style={{
                width: `${Math.max(0, 100 - ((Date.now() - injury.timestamp) / injury.recoveryTime) * 100)}%`,
              }}
            />
          </div>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-xs">Est. Ready</p>
          <p className="font-semibold text-white">{daysRemaining}d</p>
        </div>
      </div>

      {/* Performance impact preview */}
      <div className="mt-3 pt-3 border-t border-slate-600 text-xs text-red-300">
        <p className="font-semibold mb-1">Performance Impact:</p>
        <p>Speed: {injury.performanceImpact.speed.toFixed(0)}% | Stamina: {injury.performanceImpact.stamina.toFixed(0)}%</p>
      </div>
    </div>
  );
}

/**
 * Weather Tips Component
 */
function WeatherTips({ weather }: { weather: WeatherCondition }) {
  const tips: Record<string, string[]> = {
    clear: [
      '✅ Perfect conditions for flowing football',
      '💡 Use possession-based tactics',
      '⚽ Increase crossing and long-range attempts',
    ],
    rainy: [
      '⚠️ Expect slippery conditions and unpredictable ball movement',
      '💡 Focus on short passing and ball control',
      '⚽ Be more conservative with long passes',
    ],
    snowy: [
      '❄️ Severe visibility and grip issues',
      '💡 Keep possession, avoid risky plays',
      '⚽ Increased chance of defensive errors',
    ],
    foggy: [
      '🌫️ Visibility significantly reduced',
      '💡 Use nearby passing, avoid long balls',
      '⚽ Expect more defensive mistakes',
    ],
    windy: [
      '💨 Wind affects ball trajectory',
      '💡 Avoid long-range shots into wind',
      '⚽ Be precise with set pieces',
    ],
    stormy: [
      '⛈️ Severe weather - extreme conditions',
      '💡 Defensive, possession-focused play recommended',
      '⚽ High risk of injuries - monitor player fitness',
    ],
  };

  const weatherTips = tips[weather.type] || tips.clear;

  return (
    <div className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-6">
      <h3 className="text-lg font-bold text-blue-300 mb-4">💡 Weather Recommendations</h3>
      <ul className="space-y-2">
        {weatherTips.map((tip, idx) => (
          <li key={idx} className="text-blue-100 text-sm">
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
