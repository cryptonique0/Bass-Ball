'use client';

import React, { useState } from 'react';
import { Club } from '@/lib/clubRegistry';
import ClubSelector from '@/components/ClubSelector';
import { useClubSelector } from '@/hooks/useClubSelector';
import styles from './page.module.css';

export default function ClubSelectorPage() {
  const { selectedClub, selectClub, clearClub, favoriteClubs, addFavorite, removeFavorite, isFavorited } = useClubSelector();
  const [showDetails, setShowDetails] = useState(false);

  const handleClubSelect = (club: Club) => {
    selectClub(club);
    setShowDetails(true);
  };

  const handleToggleFavorite = (e: React.MouseEvent, club: Club) => {
    e.stopPropagation();
    if (isFavorited(club.id)) {
      removeFavorite(club.id);
    } else {
      addFavorite(club);
    }
  };

  return (
    <div className={styles.page}>
      <ClubSelector
        onSelectClub={handleClubSelect}
        selectedClubId={selectedClub?.id}
        title="⚽ Find Your Club"
        subtitle="Browse clubs from around the world by continent, league, country, and tier"
      />

      {/* Selected Club Details */}
      {selectedClub && showDetails && (
        <div className={styles.detailsPanel}>
          <div className={styles.detailsContent}>
            <button className={styles.closeButton} onClick={() => setShowDetails(false)}>
              ✕
            </button>

            <div className={styles.selectedClubHeader}>
              <div className={styles.crestLarge}>{selectedClub.crest}</div>
              <div className={styles.headerInfo}>
                <h1 className={styles.clubNameLarge}>{selectedClub.name}</h1>
                <p className={styles.clubCountry}>{selectedClub.country}</p>
              </div>
              <button
                className={`${styles.favoriteButton} ${
                  isFavorited(selectedClub.id) ? styles.favorited : ''
                }`}
                onClick={(e) => handleToggleFavorite(e, selectedClub)}
              >
                {isFavorited(selectedClub.id) ? '❤️' : '🤍'}
              </button>
            </div>

            <div className={styles.detailsGrid}>
              <div className={styles.detailCard}>
                <h3>Basic Info</h3>
                <dl>
                  <dt>Short Name:</dt>
                  <dd>{selectedClub.shortName}</dd>

                  <dt>Founded:</dt>
                  <dd>{selectedClub.foundedYear}</dd>

                  <dt>City:</dt>
                  <dd>{selectedClub.city}</dd>

                  <dt>Stadium:</dt>
                  <dd>{selectedClub.stadium}</dd>
                </dl>
              </div>

              <div className={styles.detailCard}>
                <h3>League & Tier</h3>
                <dl>
                  <dt>Continent:</dt>
                  <dd>{selectedClub.continent}</dd>

                  <dt>Country:</dt>
                  <dd>{selectedClub.country}</dd>

                  <dt>League:</dt>
                  <dd>{selectedClub.league}</dd>

                  <dt>Tier:</dt>
                  <dd>{selectedClub.tier}</dd>

                  {selectedClub.conference && (
                    <>
                      <dt>Conference:</dt>
                      <dd>{selectedClub.conference}</dd>
                    </>
                  )}
                </dl>
              </div>

              <div className={styles.detailCard}>
                <h3>Club Colors</h3>
                <div className={styles.colorPalette}>
                  <div className={styles.colorBox}>
                    <div
                      className={styles.colorSwatch}
                      style={{ backgroundColor: selectedClub.primaryColor }}
                    />
                    <p>Primary: {selectedClub.primaryColor}</p>
                  </div>
                  <div className={styles.colorBox}>
                    <div
                      className={styles.colorSwatch}
                      style={{ backgroundColor: selectedClub.secondaryColor }}
                    />
                    <p>Secondary: {selectedClub.secondaryColor}</p>
                  </div>
                </div>
              </div>

              <div className={styles.detailCard}>
                <h3>Fanbase</h3>
                <p className={styles.fanbaseNumber}>
                  {(selectedClub.fanBase / 1000000).toFixed(1)}M fans
                </p>
                <div className={styles.fanbaseBar}>
                  <div
                    className={styles.fanbaseProgress}
                    style={{
                      width: `${Math.min((selectedClub.fanBase / 80000000) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className={styles.historySection}>
              <h3>Club History</h3>
              <p>{selectedClub.history}</p>
            </div>

            <div className={styles.actionButtons}>
              <button className={styles.selectButton} onClick={() => {}}>
                ✓ Confirm Selection
              </button>
              <button className={styles.clearButton} onClick={() => setShowDetails(false)}>
                Back to Clubs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Favorites Panel */}
      {favoriteClubs.length > 0 && (
        <div className={styles.favoritesPanel}>
          <h2>⭐ Your Favorite Clubs ({favoriteClubs.length})</h2>
          <div className={styles.favoritesList}>
            {favoriteClubs.map((club) => (
              <div
                key={club.id}
                className={`${styles.favoriteItem} ${
                  selectedClub?.id === club.id ? styles.selected : ''
                }`}
                onClick={() => handleClubSelect(club)}
              >
                <span className={styles.favCrest}>{club.crest}</span>
                <div className={styles.favInfo}>
                  <p className={styles.favName}>{club.name}</p>
                  <p className={styles.favLeague}>{club.league}</p>
                </div>
                <button
                  className={styles.removeFavButton}
                  onClick={(e) => handleToggleFavorite(e, club)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
