/**
 * React hook for game configuration and settings
 */

import { useState, useCallback } from 'react';

export interface GameSettings {
  difficulty: 'easy' | 'normal' | 'hard' | 'expert';
  audioEnabled: boolean;
  musicVolume: number;
  effectsVolume: number;
  subtitlesEnabled: boolean;
  resolution: '720p' | '1080p' | '1440p' | '4k';
  frameRate: 30 | 60 | 120 | 144;
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
  vsyncEnabled: boolean;
  gamepadEnabled: boolean;
  controlScheme: 'default' | 'custom1' | 'custom2';
}

export interface UseGameSettingsReturn extends GameSettings {
  setDifficulty: (difficulty: GameSettings['difficulty']) => void;
  toggleAudio: () => void;
  setMusicVolume: (volume: number) => void;
  setEffectsVolume: (volume: number) => void;
  toggleSubtitles: () => void;
  setResolution: (resolution: GameSettings['resolution']) => void;
  setFrameRate: (rate: 30 | 60 | 120 | 144) => void;
  setGraphicsQuality: (quality: GameSettings['graphicsQuality']) => void;
  toggleVSync: () => void;
  toggleGamepad: () => void;
  setControlScheme: (scheme: GameSettings['controlScheme']) => void;
  resetToDefaults: () => void;
  saveSettings: () => void;
}

const defaultSettings: GameSettings = {
  difficulty: 'normal',
  audioEnabled: true,
  musicVolume: 70,
  effectsVolume: 80,
  subtitlesEnabled: false,
  resolution: '1080p',
  frameRate: 60,
  graphicsQuality: 'high',
  vsyncEnabled: true,
  gamepadEnabled: true,
  controlScheme: 'default',
};

export function useGameSettings(): UseGameSettingsReturn {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);

  const setDifficulty = useCallback((difficulty: GameSettings['difficulty']) => {
    setSettings((prev) => ({ ...prev, difficulty }));
  }, []);

  const toggleAudio = useCallback(() => {
    setSettings((prev) => ({ ...prev, audioEnabled: !prev.audioEnabled }));
  }, []);

  const setMusicVolume = useCallback((volume: number) => {
    setSettings((prev) => ({ ...prev, musicVolume: Math.max(0, Math.min(100, volume)) }));
  }, []);

  const setEffectsVolume = useCallback((volume: number) => {
    setSettings((prev) => ({ ...prev, effectsVolume: Math.max(0, Math.min(100, volume)) }));
  }, []);

  const toggleSubtitles = useCallback(() => {
    setSettings((prev) => ({ ...prev, subtitlesEnabled: !prev.subtitlesEnabled }));
  }, []);

  const setResolution = useCallback((resolution: GameSettings['resolution']) => {
    setSettings((prev) => ({ ...prev, resolution }));
  }, []);

  const setFrameRate = useCallback((rate: 30 | 60 | 120 | 144) => {
    setSettings((prev) => ({ ...prev, frameRate: rate }));
  }, []);

  const setGraphicsQuality = useCallback((quality: GameSettings['graphicsQuality']) => {
    setSettings((prev) => ({ ...prev, graphicsQuality: quality }));
  }, []);

  const toggleVSync = useCallback(() => {
    setSettings((prev) => ({ ...prev, vsyncEnabled: !prev.vsyncEnabled }));
  }, []);

  const toggleGamepad = useCallback(() => {
    setSettings((prev) => ({ ...prev, gamepadEnabled: !prev.gamepadEnabled }));
  }, []);

  const setControlScheme = useCallback((scheme: GameSettings['controlScheme']) => {
    setSettings((prev) => ({ ...prev, controlScheme: scheme }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings({ ...defaultSettings });
  }, []);

  const saveSettings = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gameSettings', JSON.stringify(settings));
    }
  }, [settings]);

  return {
    ...settings,
    setDifficulty,
    toggleAudio,
    setMusicVolume,
    setEffectsVolume,
    toggleSubtitles,
    setResolution,
    setFrameRate,
    setGraphicsQuality,
    toggleVSync,
    toggleGamepad,
    setControlScheme,
    resetToDefaults,
    saveSettings,
  };
}
