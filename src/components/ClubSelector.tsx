'use client';

import React, { useState, useMemo } from 'react';
import { Club, ClubFilter, Continent, Tier } from '@/lib/clubRegistry';
import ClubRegistry from '@/lib/clubRegistry';
import styles from './ClubSelector.module.css';

export interface ClubSelectorProps {
  onSelectClub: (club: Club) => void;
  selectedClubId?: string;
  title?: string;
  subtitle?: string;
}

type FilterView = 'continents' | 'leagues' | 'countries' | 'tiers' | 'search';

export const ClubSelector: React.FC<ClubSelectorProps> = ({
  onSelectClub,
  selectedClubId,
  title = 'Select Your Club',
  subtitle = 'Choose from clubs around the world',
}) => {
  const registry = ClubRegistry;
  const [filterView, setFilterView] = useState<FilterView>('continents');
  const [selectedContinents, setSelectedContinents] = useState<Continent[]>([]);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<Tier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);

  // Get all filter options
  const continents = registry.getContinents();
  const leagues = registry.getLeagues();
  const countries = registry.getCountries();
  const tiers = registry.getTiers();

  // Filter clubs based on selected criteria
  const filteredClubs = useMemo(() => {
    const filter: ClubFilter = {
      continents: selectedContinents.length > 0 ? selectedContinents : undefined,
      leagues: selectedLeagues.length > 0 ? selectedLeagues : undefined,
      countries: selectedCountries.length > 0 ? selectedCountries : undefined,
      tiers: selectedTiers.length > 0 ? selectedTiers : undefined,
      searchTerm: searchTerm || undefined,
    };

    const clubs = registry.filterClubs(filter);

    if (showFavorites) {
      const topClubs = registry.getTopClubsByFanbase(10);
      const topIds = new Set(topClubs.map((c) => c.id));
      return clubs.filter((c) => topIds.has(c.id));
    }

    return clubs;
  }, [selectedContinents, selectedLeagues, selectedCountries, selectedTiers, searchTerm, showFavorites]);

  // Toggle filter selection
  const toggleContinentFilter = (continent: Continent) => {
    setSelectedContinents((prev) =>
      prev.includes(continent) ? prev.filter((c) => c !== continent) : [...prev, continent]
    );
  };

  const toggleLeagueFilter = (league: string) => {
    setSelectedLeagues((prev) =>
      prev.includes(league) ? prev.filter((l) => l !== league) : [...prev, league]
    );
  };

  const toggleCountryFilter = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
    );
  };

  const toggleTierFilter = (tier: Tier) => {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedContinents([]);
    setSelectedLeagues([]);
    setSelectedCountries([]);
    setSelectedTiers([]);
    setSearchTerm('');
    setShowFavorites(false);
  };

  const topClubs = registry.getTopClubsByFanbase(10);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <button className={styles.resetButton} onClick={resetFilters}>
          Reset Filters
        </button>
      </div>

      {/* Search Bar */}
      <div className={styles.searchSection}>
        <input
          type="text"
          placeholder="Search clubs by name, city, or country..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className={`${styles.favoritesToggle} ${showFavorites ? styles.active : ''}`}
          onClick={() => setShowFavorites(!showFavorites)}
          title="Show top 10 clubs by fanbase"
        >
          ⭐ Top Clubs ({topClubs.length})
        </button>
      </div>

      <div className={styles.main}>
        {/* Filter Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.filterNav}>
            <button
              className={`${styles.filterTab} ${filterView === 'continents' ? styles.active : ''}`}
              onClick={() => setFilterView('continents')}
            >
              🌍 Continents
            </button>
            <button
              className={`${styles.filterTab} ${filterView === 'leagues' ? styles.active : ''}`}
              onClick={() => setFilterView('leagues')}
            >
              🏆 Leagues
            </button>
            <button
              className={`${styles.filterTab} ${filterView === 'countries' ? styles.active : ''}`}
              onClick={() => setFilterView('countries')}
            >
              🚩 Countries
            </button>
            <button
              className={`${styles.filterTab} ${filterView === 'tiers' ? styles.active : ''}`}
              onClick={() => setFilterView('tiers')}
            >
              📊 Tiers
            </button>
          </div>

          <div className={styles.filterOptions}>
            {/* Continents Filter */}
            {filterView === 'continents' && (
              <div className={styles.optionList}>
                <h3>Select Continents:</h3>
                {continents.map((continent) => (
                  <label key={continent} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedContinents.includes(continent)}
                      onChange={() => toggleContinentFilter(continent)}
                    />
                    <span>{continent}</span>
                    <span className={styles.count}>
                      ({registry.getClubsByContinent(continent).length})
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Leagues Filter */}
            {filterView === 'leagues' && (
              <div className={styles.optionList}>
                <h3>Select Leagues:</h3>
                <div className={styles.scrollable}>
                  {leagues.map((league) => (
                    <label key={league} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedLeagues.includes(league)}
                        onChange={() => toggleLeagueFilter(league)}
                      />
                      <span>{league}</span>
                      <span className={styles.count}>
                        ({registry.getClubsByLeague(league).length})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Countries Filter */}
            {filterView === 'countries' && (
              <div className={styles.optionList}>
                <h3>Select Countries:</h3>
                <div className={styles.scrollable}>
                  {countries.map((country) => (
                    <label key={country} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedCountries.includes(country)}
                        onChange={() => toggleCountryFilter(country)}
                      />
                      <span>{country}</span>
                      <span className={styles.count}>
                        ({registry.getClubsByCountry(country).length})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tiers Filter */}
            {filterView === 'tiers' && (
              <div className={styles.optionList}>
                <h3>Select Tiers:</h3>
                {tiers.map((tier) => (
                  <label key={tier} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedTiers.includes(tier)}
                      onChange={() => toggleTierFilter(tier)}
                    />
                    <span>{tier}</span>
                    <span className={styles.count}>({registry.getClubsByTier(tier).length})</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clubs Grid */}
        <div className={styles.clubsSection}>
          <div className={styles.clubsHeader}>
            <h2>Available Clubs ({filteredClubs.length})</h2>
            {(selectedContinents.length > 0 ||
              selectedLeagues.length > 0 ||
              selectedCountries.length > 0 ||
              selectedTiers.length > 0) && (
              <div className={styles.activeFilters}>
                {selectedContinents.map((c) => (
                  <span key={c} className={styles.filterTag}>
                    {c} ✕
                  </span>
                ))}
                {selectedLeagues.map((l) => (
                  <span key={l} className={styles.filterTag}>
                    {l} ✕
                  </span>
                ))}
                {selectedCountries.map((c) => (
                  <span key={c} className={styles.filterTag}>
                    {c} ✕
                  </span>
                ))}
                {selectedTiers.map((t) => (
                  <span key={t} className={styles.filterTag}>
                    {t} ✕
                  </span>
                ))}
              </div>
            )}
          </div>

          {filteredClubs.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No clubs found matching your criteria.</p>
              <button className={styles.resetButton} onClick={resetFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className={styles.clubsGrid}>
              {filteredClubs.map((club) => (
                <div
                  key={club.id}
                  className={`${styles.clubCard} ${
                    selectedClubId === club.id ? styles.selected : ''
                  }`}
                  onClick={() => onSelectClub(club)}
                >
                  <div className={styles.clubCrest}>{club.crest}</div>
                  <div className={styles.clubInfo}>
                    <h3 className={styles.clubName}>{club.name}</h3>
                    <p className={styles.clubShortName}>{club.shortName}</p>
                    <div className={styles.clubDetails}>
                      <span className={styles.detail}>{club.country}</span>
                      <span className={styles.detail}>{club.league}</span>
                      <span className={styles.detail}>{club.tier}</span>
                    </div>
                    <p className={styles.clubCity}>{club.city}</p>
                    <p className={styles.clubHistory}>{club.history}</p>
                    <div className={styles.clubStats}>
                      <span className={styles.stat}>
                        👥 {(club.fanBase / 1000000).toFixed(1)}M fans
                      </span>
                      <span className={styles.stat}>🏟️ {club.stadium}</span>
                    </div>
                  </div>
                  <div
                    className={styles.clubColors}
                    style={{
                      background: `linear-gradient(135deg, ${club.primaryColor} 0%, ${club.secondaryColor} 100%)`,
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubSelector;
