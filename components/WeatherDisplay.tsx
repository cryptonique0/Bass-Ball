'use client';

import React, { useState, useEffect } from 'react';
import { GameplayDynamicsManager, WeatherCondition, PlayerInjury, MatchConditions } from '@/lib/gameplayDynamicsSystem';
import { Cloud, AlertTriangle, Heart, Droplets, Wind, Eye } from 'lucide-react';

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
        <Cloud size={32} className="mx-auto text-slate-600 mb-2" />
        <p className="text-slate-400">Match conditions not available</p>
      </div>
    );
  }

  const weather = conditions.weather;