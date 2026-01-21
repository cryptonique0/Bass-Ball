/**
 * useCommentary Hook - React integration for commentator system
 */

import { useState, useCallback, useRef } from 'react';
import { CommentatorSystem, Commentator, EventType } from '@/utils/commentary/commentators';

interface CommentaryState {
  currentCommentary: string;
  commentator: Commentator;
  isPlaying: boolean;
  volume: number;
  history: Array<{ timestamp: number; text: string; intensity: number }>;
}

export function useCommentary(initialCommentator: string = 'peter_drury') {
  const systemRef = useRef(new CommentatorSystem(initialCommentator));
  const [state, setState] = useState<CommentaryState>({
    currentCommentary: '',
    commentator: systemRef.current.getCommentatorInfo(),
    isPlaying: false,
    volume: 0.8,
    history: [],
  });

  const generateCommentary = useCallback(
    (eventType: EventType, matchContext?: { score: [number, number]; time: number; intensity?: number }) => {
      const commentary = systemRef.current.generateCommentary(eventType, matchContext);
      setState((prev) => ({
        ...prev,
        currentCommentary: commentary,
        history: systemRef.current.getCommentaryHistory(),
        isPlaying: true,
      }));

      // Auto-stop after commentary duration
      setTimeout(() => {
        setState((prev) => ({ ...prev, isPlaying: false }));
      }, 3000 + commentary.length * 50); // Rough estimate based on text length

      return commentary;
    },
    []
  );

  const switchCommentator = useCallback((commentatorKey: string) => {
    const success = systemRef.current.switchCommentator(commentatorKey);
    if (success) {
      setState((prev) => ({
        ...prev,
        commentator: systemRef.current.getCommentatorInfo(),
        currentCommentary: '',
      }));
    }
    return success;
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState((prev) => ({
      ...prev,
      volume: Math.max(0, Math.min(1, volume)),
    }));
  }, []);

  const getAvailableCommentators = useCallback(() => {
    return systemRef.current.getAllCommentators();
  }, []);

  const clearHistory = useCallback(() => {
    systemRef.current.clearHistory();
    setState((prev) => ({
      ...prev,
      history: [],
    }));
  }, []);

  const speak = useCallback(
    (text: string) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = state.commentator.experience / 10;
        utterance.volume = state.volume;

        // Attempt to use accent if available
        const voices = window.speechSynthesis.getVoices();
        const accentMap: Record<string, string> = {
          British: 'en-GB',
          Neutral: 'en-US',
        };
        const voiceName = accentMap[state.commentator.accent] || 'en-US';
        const matchingVoice = voices.find((v) => v.lang.startsWith(voiceName));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);

        setState((prev) => ({ ...prev, isPlaying: true }));
      }
    },
    [state.commentator, state.volume]
  );

  const stopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  return {
    ...state,
    generateCommentary,
    switchCommentator,
    setVolume,
    getAvailableCommentators,
    clearHistory,
    speak,
    stopSpeech,
  };
}
