'use client';

import React, { useState } from 'react';
import { Tactics, WeatherConditions } from '@/lib/konamiFeatures';

interface TacticsEditorProps {
  tactics: Tactics;
  onUpdate: (tactics: Tactics) => void;
}

export function TacticsEditor({ tactics, onUpdate }: TacticsEditorProps) {
  const handleUpdate = (field: keyof Tactics, value: any) => {
    onUpdate({ ...tactics, [field]: value });
  };

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold mb-4">🎯 Team Tactics</h3>

      <div className="space-y-4">
        {/* Defensive Style */}
        <div>
          <label className="block text-sm font-bold mb-2">Defensive Style</label>
          <div className="flex gap-2">
            {['defensive', 'balanced', 'attacking'].map((style) => (
              <button
                key={style}
                onClick={() => handleUpdate('defensiveStyle', style)}
                className={`flex-1 py-2 px-3 rounded text-sm font-bold transition-colors ${
                  tactics.defensiveStyle === style
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Build Up Play */}
        <div>
          <label className="block text-sm font-bold mb-2">Build Up Play</label>
          <div className="flex gap-2">
            {['short-pass', 'balanced', 'long-ball'].map((play) => (
              <button
                key={play}
                onClick={() => handleUpdate('buildUpPlay', play)}
                className={`flex-1 py-2 px-3 rounded text-sm font-bold transition-colors ${
                  tactics.buildUpPlay === play
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {play.split('-').map((w) => w.charAt(0).toUpperCase()).join('')}
              </button>
            ))}
          </div>
        </div>

        {/* Pressure Mode */}
        <div>
          <label className="block text-sm font-bold mb-2">Pressure Mode</label>
          <div className="flex gap-2">
            {['low', 'medium', 'high'].map((pressure) => (
              <button
                key={pressure}
                onClick={() => handleUpdate('pressureMode', pressure)}
                className={`flex-1 py-2 px-3 rounded text-sm font-bold transition-colors ${
                  tactics.pressureMode === pressure
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {pressure.charAt(0).toUpperCase() + pressure.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Width Slider */}
        <div>
          <label className="block text-sm font-bold mb-2">
            Width: {tactics.width}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={tactics.width}
            onChange={(e) => handleUpdate('width', parseInt(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-400 mt-1">
            {tactics.width <= 3
              ? 'Narrow - Defensive width'
              : tactics.width <= 6
              ? 'Balanced'
              : 'Wide - Attacking width'}
          </p>
        </div>

        {/* Depth Slider */}
        <div>
          <label className="block text-sm font-bold mb-2">
            Depth: {tactics.depth}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={tactics.depth}
            onChange={(e) => handleUpdate('depth', parseInt(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-400 mt-1">
            {tactics.depth <= 3
              ? 'Deep - Defensive depth'
              : tactics.depth <= 6
              ? 'Balanced'
              : 'High - Offensive depth'}
          </p>
        </div>
      </div>

      <button className="w-full btn btn-primary mt-6">Save Tactics</button>
    </div>
  );
}

// Weather Display Component
interface WeatherDisplayProps {
  weather: WeatherConditions;
}

export function WeatherDisplay({ weather }: WeatherDisplayProps) {
  const getWeatherIcon = (type: string): string => {
    const icons: Record<string, string> = {
      clear: '☀️',
      rainy: '🌧️',
      snowy: '❄️',
      foggy: '🌫️',
      stormy: '⛈️',
    };
    return icons[type] || '🌤️';
  };

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold mb-4">🌤️ Weather Conditions</h3>

      <div className="space-y-4">
        {/* Weather Type */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Conditions</p>
            <p className="text-2xl">
              {getWeatherIcon(weather.type)}{' '}
              <span className="text-white">
                {weather.type.charAt(0).toUpperCase() + weather.type.slice(1)}
              </span>
            </p>
          </div>
        </div>

        {/* Weather Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-xs text-gray-400">Intensity</p>
            <p className="text-lg font-bold">{Math.round(weather.intensity * 100)}%</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-xs text-gray-400">Wind Speed</p>
            <p className="text-lg font-bold">{weather.windSpeed} m/s</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-xs text-gray-400">Temperature</p>
            <p className="text-lg font-bold">{weather.temperature}°C</p>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-xs text-gray-400">Pitch Quality</p>
            <p className="text-lg font-bold">Good</p>
          </div>
        </div>

        {/* Weather Effects */}
        <div className="border-t border-gray-700 pt-4">
          <p className="text-sm font-bold mb-2">Effects on Play:</p>
          <div className="space-y-1 text-sm">
            {weather.affectsBallControl && (
              <p className="text-yellow-500">⚠️ Ball control reduced</p>
            )}
            {weather.affectsPassing && <p className="text-yellow-500">⚠️ Passing accuracy reduced</p>}
            {weather.affectsShot && <p className="text-yellow-500">⚠️ Shot power affected</p>}
            {!weather.affectsBallControl && !weather.affectsPassing && !weather.affectsShot && (
              <p className="text-green-500">✓ No significant effects</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Tactics Presets
interface TacticsPresetsProps {
  onSelectTactics: (tactics: Tactics) => void;
}

export function TacticsPresets({ onSelectTactics }: TacticsPresetsProps) {
  const presets = [
    {
      name: 'Defensive',
      tactics: {
        defensiveStyle: 'defensive' as const,
        buildUpPlay: 'long-ball' as const,
        pressureMode: 'low' as const,
        width: 4,
        depth: 3,
      },
    },
    {
      name: 'Balanced',
      tactics: {
        defensiveStyle: 'balanced' as const,
        buildUpPlay: 'balanced' as const,
        pressureMode: 'medium' as const,
        width: 6,
        depth: 5,
      },
    },
    {
      name: 'Attacking',
      tactics: {
        defensiveStyle: 'attacking' as const,
        buildUpPlay: 'short-pass' as const,
        pressureMode: 'high' as const,
        width: 8,
        depth: 8,
      },
    },
    {
      name: 'Counter Attack',
      tactics: {
        defensiveStyle: 'defensive' as const,
        buildUpPlay: 'long-ball' as const,
        pressureMode: 'high' as const,
        width: 5,
        depth: 3,
      },
    },
  ];

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold mb-4">⚡ Tactic Presets</h3>
      <div className="grid grid-cols-2 gap-3">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onSelectTactics(preset.tactics)}
            className="btn btn-secondary text-sm"
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
