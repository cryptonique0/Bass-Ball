/**
 * CommentaryBox Component - Display live commentary during matches
 */

'use client';

import React, { useEffect } from 'react';
import { useCommentary } from '../hooks/useCommentary';
import styles from './CommentaryBox.module.css';

interface CommentaryBoxProps {
  onCommentaryChange?: (commentary: string) => void;
  autoSpeak?: boolean;
  enableHistory?: boolean;
}

export function CommentaryBox({
  onCommentaryChange,
  autoSpeak = true,
  enableHistory = true,
}: CommentaryBoxProps) {
  const commentary = useCommentary('peter_drury');

  useEffect(() => {
    onCommentaryChange?.(commentary.currentCommentary);
  }, [commentary.currentCommentary, onCommentaryChange]);

  useEffect(() => {
    if (autoSpeak && commentary.isPlaying) {
      commentary.speak(commentary.currentCommentary);
    }
  }, [commentary.currentCommentary, autoSpeak, commentary]);

  const handleSwitchCommentator = (commentatorKey: string) => {
    commentary.switchCommentator(commentatorKey);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Live Commentary</h2>
        <div className={styles.commentatorInfo}>
          <span className={styles.commentatorName}>{commentary.commentator.name}</span>
          <span className={styles.experience}>★ {commentary.commentator.experience}/10</span>
        </div>
      </div>

      <div className={styles.commentaryDisplay}>
        <p
          className={`${styles.commentaryText} ${
            commentary.isPlaying ? styles.active : styles.inactive
          }`}
        >
          {commentary.currentCommentary || 'Awaiting next match event...'}
        </p>
      </div>

      <div className={styles.controls}>
        <button
          className={`${styles.button} ${commentary.isPlaying ? styles.playing : ''}`}
          onClick={() => (commentary.isPlaying ? commentary.stopSpeech() : null)}
        >
          {commentary.isPlaying ? '🔊 Speaking' : '🔇 Silent'}
        </button>

        <div className={styles.volumeControl}>
          <label htmlFor="volume">Volume:</label>
          <input
            id="volume"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={commentary.volume}
            onChange={(e) => commentary.setVolume(parseFloat(e.target.value))}
            className={styles.volumeSlider}
          />
          <span>{Math.round(commentary.volume * 100)}%</span>
        </div>
      </div>

      <div className={styles.commentatorSelector}>
        <h3 className={styles.selectorTitle}>Choose Commentator:</h3>
        <div className={styles.commentatorGrid}>
          {commentary.getAvailableCommentators().map((comm) => (
            <button
              key={comm.name}
              className={`${styles.commentatorButton} ${
                commentary.commentator.name === comm.name ? styles.active : ''
              }`}
              onClick={() => handleSwitchCommentator(comm.name.toLowerCase().replace(/\s+/g, '_'))}
              title={`${comm.style.charAt(0).toUpperCase() + comm.style.slice(1)} - ${comm.accent}`}
            >
              {comm.name}
            </button>
          ))}
        </div>
      </div>

      {enableHistory && commentary.history.length > 0 && (
        <div className={styles.history}>
          <h3 className={styles.historyTitle}>Recent Commentary</h3>
          <div className={styles.historyList}>
            {commentary.history.slice(-5).map((entry, idx) => (
              <div key={idx} className={styles.historyItem}>
                <span className={styles.timestamp}>
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span className={styles.historyText}>{entry.text}</span>
              </div>
            ))}
          </div>
          <button className={styles.clearButton} onClick={() => commentary.clearHistory()}>
            Clear History
          </button>
        </div>
      )}
    </div>
  );
}
