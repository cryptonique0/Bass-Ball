'use client';

import { useState, useCallback, useEffect } from 'react';
import { Club, ClubRegistry } from '@/lib/clubRegistry';

export interface UseClubSelectorResult {
  selectedClub: Club | null;
  selectClub: (club: Club) => void;
  clearClub: () => void;
  isClubSelected: boolean;
  favoriteClubs: Club[];
  addFavorite: (club: Club) => void;
  removeFavorite: (clubId: string) => void;
  isFavorited: (clubId: string) => boolean;
}

/**
 * Hook for managing club selection and favorites
 */
export const useClubSelector = (storageKey: string = 'selectedClub'): UseClubSelectorResult => {
  const registry = ClubRegistry;
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [favoriteClubs, setFavoriteClubs] = useState<Club[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const clubId = JSON.parse(saved);
        const club = registry.getClubById(clubId);
        if (club) {
          setSelectedClub(club);
        }
      }

      const favorites = localStorage.getItem(`${storageKey}_favorites`);
      if (favorites) {
        const favIds = JSON.parse(favorites);
        const clubs = favIds
          .map((id: string) => registry.getClubById(id))
          .filter((c: Club | undefined) => c !== undefined);
        setFavoriteClubs(clubs);
      }
    } catch (error) {
      console.error('Failed to load club selection from localStorage:', error);
    }
  }, [storageKey, registry]);

  // Save selected club to localStorage
  const selectClub = useCallback(
    (club: Club) => {
      setSelectedClub(club);
      try {
        localStorage.setItem(storageKey, JSON.stringify(club.id));
      } catch (error) {
        console.error('Failed to save club selection:', error);
      }
    },
    [storageKey]
  );

  const clearClub = useCallback(() => {
    setSelectedClub(null);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear club selection:', error);
    }
  }, [storageKey]);

  const addFavorite = useCallback(
    (club: Club) => {
      setFavoriteClubs((prev) => {
        const alreadyExists = prev.some((c) => c.id === club.id);
        if (alreadyExists) return prev;

        const updated = [...prev, club];
        try {
          localStorage.setItem(
            `${storageKey}_favorites`,
            JSON.stringify(updated.map((c) => c.id))
          );
        } catch (error) {
          console.error('Failed to save favorites:', error);
        }
        return updated;
      });
    },
    [storageKey]
  );

  const removeFavorite = useCallback(
    (clubId: string) => {
      setFavoriteClubs((prev) => {
        const updated = prev.filter((c) => c.id !== clubId);
        try {
          localStorage.setItem(
            `${storageKey}_favorites`,
            JSON.stringify(updated.map((c) => c.id))
          );
        } catch (error) {
          console.error('Failed to update favorites:', error);
        }
        return updated;
      });
    },
    [storageKey]
  );

  const isFavorited = useCallback(
    (clubId: string) => favoriteClubs.some((c) => c.id === clubId),
    [favoriteClubs]
  );

  return {
    selectedClub,
    selectClub,
    clearClub,
    isClubSelected: selectedClub !== null,
    favoriteClubs,
    addFavorite,
    removeFavorite,
    isFavorited,
  };
};

export default useClubSelector;
