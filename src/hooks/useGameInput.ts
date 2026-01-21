/**
 * React hook for game input and keyboard handling
 */

import { useState, useEffect, useCallback } from 'react';

export type GameInput = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
  pass: boolean;
  sprint: boolean;
  skill: boolean;
  pause: boolean;
};

export interface UseGameInputReturn extends GameInput {
  resetInput: () => void;
  getInputVector: () => { x: number; y: number };
}

const defaultInput: GameInput = {
  up: false,
  down: false,
  left: false,
  right: false,
  shoot: false,
  pass: false,
  sprint: false,
  skill: false,
  pause: false,
};

const keyMap: Record<string, keyof GameInput> = {
  w: 'up',
  arrowup: 'up',
  s: 'down',
  arrowdown: 'down',
  a: 'left',
  arrowleft: 'left',
  d: 'right',
  arrowright: 'right',
  ' ': 'shoot',
  e: 'pass',
  shift: 'sprint',
  q: 'skill',
  escape: 'pause',
};

export function useGameInput(): UseGameInputReturn {
  const [input, setInput] = useState<GameInput>(defaultInput);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = keyMap[e.key.toLowerCase()];
      if (key) {
        e.preventDefault();
        setInput((prev) => ({ ...prev, [key]: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = keyMap[e.key.toLowerCase()];
      if (key) {
        e.preventDefault();
        setInput((prev) => ({ ...prev, [key]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const resetInput = useCallback(() => {
    setInput({ ...defaultInput });
  }, []);

  const getInputVector = useCallback(
    (): { x: number; y: number } => {
      let x = 0;
      let y = 0;

      if (input.left) x -= 1;
      if (input.right) x += 1;
      if (input.up) y -= 1;
      if (input.down) y += 1;

      return { x, y };
    },
    [input]
  );

  return {
    ...input,
    resetInput,
    getInputVector,
  };
}
