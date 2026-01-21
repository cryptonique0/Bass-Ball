/**
 * Club Registry System
 * 
 * Comprehensive database of football clubs organized by:
 * - Continents
 * - Leagues/Competitions
 * - Countries
 * - Tiers/Divisions
 * - Conference/Regions
 */

export type Continent = 'Europe' | 'South America' | 'North America' | 'Africa' | 'Asia' | 'Oceania';
export type Tier = 'Premier' | 'First Division' | 'Second Division' | 'Third Division' | 'Amateur';
export type Conference = 'North' | 'South' | 'East' | 'West' | 'Central';

export interface Club {
  id: string;
  name: string;
  shortName: string;
  country: string;
  continent: Continent;
  league: string;
  tier: Tier;
  conference?: Conference;
  foundedYear: number;
  stadium: string;
  city: string;
  crest: string; // URL to club crest/logo
  primaryColor: string;
  secondaryColor: string;
  fanBase: number; // Estimated fans
  history: string; // Brief history
}

export interface ClubFilter {
  continents?: Continent[];
  countries?: string[];
  leagues?: string[];
  tiers?: Tier[];
  conferences?: Conference[];
  searchTerm?: string;
}

export interface GroupedClubs {
  continent: Continent;
  clubs: Club[];
}

export interface ClubsByLeague {
  league: string;
  country: string;
  tier: Tier;
  clubs: Club[];
}

// Comprehensive club database
export const CLUBS_DATABASE: Club[] = [
  // EUROPE - PREMIER TIER
  // England - Premier League
  {
    id: 'mufc',
    name: 'Manchester United',
    shortName: 'MUN',
    country: 'England',
    continent: 'Europe',
    league: 'Premier League',
    tier: 'Premier',
    conference: 'North',
    foundedYear: 1878,
    stadium: 'Old Trafford',
    city: 'Manchester',
    crest: '🔴',
    primaryColor: '#DA291C',
    secondaryColor: '#F3F3F3',
    fanBase: 75000000,
    history: 'One of the most successful clubs in English football history, known for legendary manager Sir Alex Ferguson.',
  },
  {
    id: 'lfc',
    name: 'Liverpool FC',
    shortName: 'LIV',
    country: 'England',
    continent: 'Europe',
    league: 'Premier League',
    tier: 'Premier',
    conference: 'North',
    foundedYear: 1892,
    stadium: 'Anfield',
    city: 'Liverpool',
    crest: '🔴',
    primaryColor: '#C8102E',
    secondaryColor: '#F6EB61',
    fanBase: 60000000,
    history: 'Multiple European Cup winners with a storied history and passionate fanbase.',
  },
  {
    id: 'mci',
    name: 'Manchester City',
    shortName: 'MCI',
    country: 'England',
    continent: 'Europe',
    league: 'Premier League',
    tier: 'Premier',
    conference: 'North',
    foundedYear: 1880,
    stadium: 'Etihad Stadium',
    city: 'Manchester',
    crest: '⚽',
    primaryColor: '#6CABDA',
    secondaryColor: '#FDB913',
    fanBase: 50000000,
    history: 'Modern powerhouse with state-of-the-art facilities and world-class players.',
  },
  {
    id: 'cfc',
    name: 'Chelsea FC',
    shortName: 'CHE',
    country: 'England',
    continent: 'Europe',
    league: 'Premier League',
    tier: 'Premier',
    conference: 'South',
    foundedYear: 1905,
    stadium: 'Stamford Bridge',
    city: 'London',
    crest: '🔵',
    primaryColor: '#034694',
    secondaryColor: '#FFF44F',
    fanBase: 55000000,
    history: 'London club with multiple Premier League and European titles.',
  },
  {
    id: 'afc',
    name: 'Arsenal FC',
    shortName: 'ARS',
    country: 'England',
    continent: 'Europe',
    league: 'Premier League',
    tier: 'Premier',
    conference: 'South',
    foundedYear: 1886,
    stadium: 'Emirates Stadium',
    city: 'London',
    crest: '🔴',
    primaryColor: '#EF0107',
    secondaryColor: '#FFFFFF',
    fanBase: 48000000,
    history: 'Known for attractive football and the Invincibles era under Arsène Wenger.',
  },
  {
    id: 'tfc',
    name: 'Tottenham Hotspur',
    shortName: 'TOT',
    country: 'England',
    continent: 'Europe',
    league: 'Premier League',
    tier: 'Premier',
    conference: 'South',
    foundedYear: 1882,
    stadium: 'Tottenham Hotspur Stadium',
    city: 'London',
    crest: '⚪',
    primaryColor: '#FFFFFF',
    secondaryColor: '#12294B',
    fanBase: 42000000,
    history: 'North London club with passionate fans and competitive spirit.',
  },

  // Spain - La Liga
  {
    id: 'fcb',
    name: 'FC Barcelona',
    shortName: 'BAR',
    country: 'Spain',
    continent: 'Europe',
    league: 'La Liga',
    tier: 'Premier',
    conference: 'East',
    foundedYear: 1899,
    stadium: 'Camp Nou',
    city: 'Barcelona',
    crest: '🔵',
    primaryColor: '#004687',
    secondaryColor: '#A50044',
    fanBase: 70000000,
    history: 'La Liga powerhouse with legendary players like Messi, famous for tiki-taka football.',
  },
  {
    id: 'rmd',
    name: 'Real Madrid',
    shortName: 'RMA',
    country: 'Spain',
    continent: 'Europe',
    league: 'La Liga',
    tier: 'Premier',
    conference: 'Central',
    foundedYear: 1902,
    stadium: 'Santiago Bernabéu',
    city: 'Madrid',
    crest: '⚪',
    primaryColor: '#FFFFFF',
    secondaryColor: '#0051BA',
    fanBase: 75000000,
    history: 'Most successful club in European football with 14 Champions League titles.',
  },
  {
    id: 'ath',
    name: 'Atlético Madrid',
    shortName: 'ATM',
    country: 'Spain',
    continent: 'Europe',
    league: 'La Liga',
    tier: 'Premier',
    conference: 'Central',
    foundedYear: 1903,
    stadium: 'Wanda Metropolitano',
    city: 'Madrid',
    crest: '🔴',
    primaryColor: '#EF3B39',
    secondaryColor: '#FFFFFF',
    fanBase: 35000000,
    history: 'Madrid neighbor with strong defensive tradition and passionate supporters.',
  },

  // Italy - Serie A
  {
    id: 'jfc',
    name: 'Juventus',
    shortName: 'JUV',
    country: 'Italy',
    continent: 'Europe',
    league: 'Serie A',
    tier: 'Premier',
    conference: 'North',
    foundedYear: 1897,
    stadium: 'Allianz Stadium',
    city: 'Turin',
    crest: '⚪',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    fanBase: 65000000,
    history: 'Italy\'s most successful club with 36 Serie A titles and dominant period in 2010s.',
  },
  {
    id: 'acm',
    name: 'AC Milan',
    shortName: 'MIL',
    country: 'Italy',
    continent: 'Europe',
    league: 'Serie A',
    tier: 'Premier',
    conference: 'North',
    foundedYear: 1899,
    stadium: 'San Siro',
    city: 'Milan',
    crest: '🔴',
    primaryColor: '#ED1C24',
    secondaryColor: '#000000',
    fanBase: 50000000,
    history: 'European powerhouse with 7 Champions League titles and iconic history.',
  },
  {
    id: 'asm',
    name: 'AS Roma',
    shortName: 'ROM',
    country: 'Italy',
    continent: 'Europe',
    league: 'Serie A',
    tier: 'Premier',
    conference: 'South',
    foundedYear: 1927,
    stadium: 'Stadio Olimpico',
    city: 'Rome',
    crest: '🟡',
    primaryColor: '#FFCC00',
    secondaryColor: '#CC0000',
    fanBase: 40000000,
    history: 'Rome\'s biggest club with passionate Giallorossi supporters.',
  },

  // Germany - Bundesliga
  {
    id: 'fcb_b',
    name: 'FC Bayern Munich',
    shortName: 'BAY',
    country: 'Germany',
    continent: 'Europe',
    league: 'Bundesliga',
    tier: 'Premier',
    conference: 'South',
    foundedYear: 1900,
    stadium: 'Allianz Arena',
    city: 'Munich',
    crest: '🔴',
    primaryColor: '#DC052D',
    secondaryColor: '#FFFFFF',
    fanBase: 60000000,
    history: 'Germany\'s most successful club with 32 Bundesliga titles and 6 Champions League crowns.',
  },
  {
    id: 'bvb',
    name: 'Borussia Dortmund',
    shortName: 'DOR',
    country: 'Germany',
    continent: 'Europe',
    league: 'Bundesliga',
    tier: 'Premier',
    conference: 'North',
    foundedYear: 1909,
    stadium: 'Signal Iduna Park',
    city: 'Dortmund',
    crest: '🟡',
    primaryColor: '#FFED00',
    secondaryColor: '#000000',
    fanBase: 45000000,
    history: 'Known for dynamic attacking football and incredible fan atmosphere.',
  },

  // France - Ligue 1
  {
    id: 'psg',
    name: 'Paris Saint-Germain',
    shortName: 'PSG',
    country: 'France',
    continent: 'Europe',
    league: 'Ligue 1',
    tier: 'Premier',
    conference: 'North',
    foundedYear: 1970,
    stadium: 'Parc des Princes',
    city: 'Paris',
    crest: '🔴',
    primaryColor: '#004494',
    secondaryColor: '#FFD4E5',
    fanBase: 48000000,
    history: 'French powerhouse backed by investment, with world-class stars.',
  },

  // SOUTH AMERICA
  {
    id: 'boca',
    name: 'Boca Juniors',
    shortName: 'BOC',
    country: 'Argentina',
    continent: 'South America',
    league: 'Primera División',
    tier: 'Premier',
    conference: 'East',
    foundedYear: 1905,
    stadium: 'Bombonera',
    city: 'Buenos Aires',
    crest: '🔵',
    primaryColor: '#0066FF',
    secondaryColor: '#FFD700',
    fanBase: 40000000,
    history: 'Historic Argentine club with passionate fan culture and Bombonera stadium.',
  },
  {
    id: 'river',
    name: 'River Plate',
    shortName: 'RIV',
    country: 'Argentina',
    continent: 'South America',
    league: 'Primera División',
    tier: 'Premier',
    conference: 'East',
    foundedYear: 1901,
    stadium: 'Estadio Monumental',
    city: 'Buenos Aires',
    crest: '🔴',
    primaryColor: '#FFFFFF',
    secondaryColor: '#FF0000',
    fanBase: 35000000,
    history: 'Buenos Aires rival with numerous Copa Libertadores titles.',
  },
  {
    id: 'flm',
    name: 'Flamengo',
    shortName: 'FLA',
    country: 'Brazil',
    continent: 'South America',
    league: 'Série A',
    tier: 'Premier',
    conference: 'East',
    foundedYear: 1912,
    stadium: 'Estádio da Gávea',
    city: 'Rio de Janeiro',
    crest: '🔴',
    primaryColor: '#FF0000',
    secondaryColor: '#000000',
    fanBase: 50000000,
    history: 'Brazil\'s most popular club with 7 Copa Libertadores titles.',
  },
  {
    id: 'santos',
    name: 'Santos FC',
    shortName: 'SAN',
    country: 'Brazil',
    continent: 'South America',
    league: 'Série A',
    tier: 'Premier',
    conference: 'South',
    foundedYear: 1912,
    stadium: 'Estádio Vila Belmiro',
    city: 'Santos',
    crest: '⚪',
    primaryColor: '#FFFFFF',
    secondaryColor: '#000000',
    fanBase: 30000000,
    history: 'Birthplace of Pelé, legendary for beautiful football and academy.',
  },
  {
    id: 'spl',
    name: 'São Paulo FC',
    shortName: 'SAO',
    country: 'Brazil',
    continent: 'South America',
    league: 'Série A',
    tier: 'Premier',
    conference: 'South',
    foundedYear: 1930,
    stadium: 'Estádio do Morumbi',
    city: 'São Paulo',
    crest: '🔴',
    primaryColor: '#DC143C',
    secondaryColor: '#FFFFFF',
    fanBase: 35000000,
    history: 'São Paulo\'s biggest club with 3 Copa Libertadores titles.',
  },

  // NORTH AMERICA
  {
    id: 'lafc',
    name: 'LA FC',
    shortName: 'LAF',
    country: 'United States',
    continent: 'North America',
    league: 'MLS',
    tier: 'Premier',
    conference: 'West',
    foundedYear: 2014,
    stadium: 'Banc of California Stadium',
    city: 'Los Angeles',
    crest: '🔴',
    primaryColor: '#000000',
    secondaryColor: '#FFD700',
    fanBase: 15000000,
    history: 'Modern MLS club with growing fanbase and impressive facilities.',
  },
  {
    id: 'nycfc',
    name: 'New York City FC',
    shortName: 'NYC',
    country: 'United States',
    continent: 'North America',
    league: 'MLS',
    tier: 'Premier',
    conference: 'East',
    foundedYear: 2013,
    stadium: 'Yankee Stadium',
    city: 'New York',
    crest: '⚪',
    primaryColor: '#0066CC',
    secondaryColor: '#FF6600',
    fanBase: 12000000,
    history: 'New York\'s MLS representative playing in iconic Yankee Stadium.',
  },
  {
    id: 'cf',
    name: 'CF Montréal',
    shortName: 'MTL',
    country: 'Canada',
    continent: 'North America',
    league: 'MLS',
    tier: 'Premier',
    conference: 'East',
    foundedYear: 1992,
    stadium: 'Stade Saputo',
    city: 'Montréal',
    crest: '⚪',
    primaryColor: '#0066FF',
    secondaryColor: '#FFFFFF',
    fanBase: 8000000,
    history: 'Canadian MLS representative with strong supporter culture.',
  },

  // AFRICA
  {
    id: 'kac',
    name: 'Kaizer Chiefs',
    shortName: 'KAI',
    country: 'South Africa',
    continent: 'Africa',
    league: 'Premier Soccer League',
    tier: 'Premier',
    conference: 'North',
    foundedYear: 1970,
    stadium: 'FNB Stadium',
    city: 'Johannesburg',
    crest: '🟡',
    primaryColor: '#FFD700',
    secondaryColor: '#000000',
    fanBase: 25000000,
    history: 'South Africa\'s most successful club with passionate Amakosi supporters.',
  },
  {
    id: 'oc',
    name: 'Orlando Pirates',
    shortName: 'ORL',
    country: 'South Africa',
    continent: 'Africa',
    league: 'Premier Soccer League',
    tier: 'Premier',
    conference: 'North',
    foundedYear: 1937,
    stadium: 'Orlando Stadium',
    city: 'Johannesburg',
    crest: '⚪',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    fanBase: 20000000,
    history: 'African giants with rich history and continental success.',
  },
  {
    id: 'alahly',
    name: 'Al Ahly SC',
    shortName: 'AHA',
    country: 'Egypt',
    continent: 'Africa',
    league: 'Egyptian Premier League',
    tier: 'Premier',
    conference: 'North',
    foundedYear: 1920,
    stadium: 'Cairo International Stadium',
    city: 'Cairo',
    crest: '🔴',
    primaryColor: '#CC0000',
    secondaryColor: '#FFFFFF',
    fanBase: 30000000,
    history: 'Africa\'s most successful club with 42 Egyptian league titles.',
  },

  // ASIA
  {
    id: 'mufc_asia',
    name: 'Manchester United (Asia)',
    shortName: 'MUA',
    country: 'India',
    continent: 'Asia',
    league: 'Indian Super League',
    tier: 'First Division',
    conference: 'East',
    foundedYear: 2014,
    stadium: 'Jawaharlal Nehru Stadium',
    city: 'Mumbai',
    crest: '🔴',
    primaryColor: '#DA291C',
    secondaryColor: '#F3F3F3',
    fanBase: 8000000,
    history: 'Manchester United affiliated team in Indian Super League.',
  },
  {
    id: 'alain',
    name: 'Al-Ain',
    shortName: 'AIN',
    country: 'United Arab Emirates',
    continent: 'Asia',
    league: 'UAE Pro League',
    tier: 'Premier',
    conference: 'East',
    foundedYear: 1968,
    stadium: 'Hazza Bin Zayed Stadium',
    city: 'Al Ain',
    crest: '⚪',
    primaryColor: '#FFFFFF',
    secondaryColor: '#0066CC',
    fanBase: 5000000,
    history: 'UAE\'s most successful club with 13 league titles.',
  },

  // OCEANIA
  {
    id: 'sydney',
    name: 'Sydney FC',
    shortName: 'SYD',
    country: 'Australia',
    continent: 'Oceania',
    league: 'A-League',
    tier: 'Premier',
    conference: 'East',
    foundedYear: 2000,
    stadium: 'Allianz Stadium',
    city: 'Sydney',
    crest: '⚪',
    primaryColor: '#0066FF',
    secondaryColor: '#FFFFFF',
    fanBase: 5000000,
    history: 'A-League\'s most successful club with 6 championships.',
  },
];

/**
 * Club Registry Manager
 */
export class ClubRegistry {
  private static instance: ClubRegistry;
  private clubsIndex: Map<string, Club> = new Map();
  private clubsByContinent: Map<Continent, Club[]> = new Map();
  private clubsByLeague: Map<string, Club[]> = new Map();
  private clubsByCountry: Map<string, Club[]> = new Map();
  private clubsByTier: Map<Tier, Club[]> = new Map();

  private constructor() {
    this.buildIndexes();
  }

  static getInstance(): ClubRegistry {
    if (!ClubRegistry.instance) {
      ClubRegistry.instance = new ClubRegistry();
    }
    return ClubRegistry.instance;
  }

  private buildIndexes(): void {
    // Index by ID
    CLUBS_DATABASE.forEach((club) => {
      this.clubsIndex.set(club.id, club);
    });

    // Index by continent
    const continents = new Set<Continent>();
    CLUBS_DATABASE.forEach((club) => continents.add(club.continent));
    continents.forEach((continent) => {
      this.clubsByContinent.set(
        continent,
        CLUBS_DATABASE.filter((c) => c.continent === continent).sort((a, b) => a.name.localeCompare(b.name))
      );
    });

    // Index by league
    const leagues = new Set<string>();
    CLUBS_DATABASE.forEach((club) => leagues.add(club.league));
    leagues.forEach((league) => {
      this.clubsByLeague.set(
        league,
        CLUBS_DATABASE.filter((c) => c.league === league).sort((a, b) => a.name.localeCompare(b.name))
      );
    });

    // Index by country
    const countries = new Set<string>();
    CLUBS_DATABASE.forEach((club) => countries.add(club.country));
    countries.forEach((country) => {
      this.clubsByCountry.set(
        country,
        CLUBS_DATABASE.filter((c) => c.country === country).sort((a, b) => a.name.localeCompare(b.name))
      );
    });

    // Index by tier
    const tiers = new Set<Tier>();
    CLUBS_DATABASE.forEach((club) => tiers.add(club.tier));
    tiers.forEach((tier) => {
      this.clubsByTier.set(
        tier,
        CLUBS_DATABASE.filter((c) => c.tier === tier).sort((a, b) => a.name.localeCompare(b.name))
      );
    });
  }

  /**
   * Get club by ID
   */
  getClubById(clubId: string): Club | undefined {
    return this.clubsIndex.get(clubId);
  }

  /**
   * Get all clubs
   */
  getAllClubs(): Club[] {
    return [...CLUBS_DATABASE];
  }

  /**
   * Get clubs by continent
   */
  getClubsByContinent(continent: Continent): Club[] {
    return this.clubsByContinent.get(continent) || [];
  }

  /**
   * Get all continents
   */
  getContinents(): Continent[] {
    return Array.from(this.clubsByContinent.keys()).sort();
  }

  /**
   * Get clubs by league
   */
  getClubsByLeague(league: string): Club[] {
    return this.clubsByLeague.get(league) || [];
  }

  /**
   * Get all leagues
   */
  getLeagues(): string[] {
    return Array.from(this.clubsByLeague.keys()).sort();
  }

  /**
   * Get clubs by country
   */
  getClubsByCountry(country: string): Club[] {
    return this.clubsByCountry.get(country) || [];
  }

  /**
   * Get all countries
   */
  getCountries(): string[] {
    return Array.from(this.clubsByCountry.keys()).sort();
  }

  /**
   * Get clubs by tier
   */
  getClubsByTier(tier: Tier): Club[] {
    return this.clubsByTier.get(tier) || [];
  }

  /**
   * Get all tiers
   */
  getTiers(): Tier[] {
    return Array.from(this.clubsByTier.keys()) as Tier[];
  }

  /**
   * Filter clubs based on criteria
   */
  filterClubs(filter: ClubFilter): Club[] {
    let filtered = [...CLUBS_DATABASE];

    if (filter.continents && filter.continents.length > 0) {
      filtered = filtered.filter((c) => filter.continents!.includes(c.continent));
    }

    if (filter.countries && filter.countries.length > 0) {
      filtered = filtered.filter((c) => filter.countries!.includes(c.country));
    }

    if (filter.leagues && filter.leagues.length > 0) {
      filtered = filtered.filter((c) => filter.leagues!.includes(c.league));
    }

    if (filter.tiers && filter.tiers.length > 0) {
      filtered = filtered.filter((c) => filter.tiers!.includes(c.tier));
    }

    if (filter.conferences && filter.conferences.length > 0) {
      filtered = filtered.filter((c) => c.conference && filter.conferences!.includes(c.conference));
    }

    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.shortName.toLowerCase().includes(term) ||
          c.city.toLowerCase().includes(term) ||
          c.country.toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get clubs grouped by continent
   */
  getClubsGroupedByContinent(): GroupedClubs[] {
    const continents = this.getContinents();
    return continents.map((continent) => ({
      continent,
      clubs: this.getClubsByContinent(continent),
    }));
  }

  /**
   * Get clubs grouped by league
   */
  getClubsGroupedByLeague(): ClubsByLeague[] {
    const result: ClubsByLeague[] = [];
    const leagues = this.getLeagues();

    leagues.forEach((league) => {
      const clubs = this.getClubsByLeague(league);
      if (clubs.length > 0) {
        const firstClub = clubs[0];
        result.push({
          league,
          country: firstClub.country,
          tier: firstClub.tier,
          clubs,
        });
      }
    });

    return result.sort((a, b) => {
      if (a.tier !== b.tier) {
        const tierOrder: Record<Tier, number> = {
          Premier: 1,
          'First Division': 2,
          'Second Division': 3,
          'Third Division': 4,
          Amateur: 5,
        };
        return tierOrder[a.tier] - tierOrder[b.tier];
      }
      return a.league.localeCompare(b.league);
    });
  }

  /**
   * Get top clubs by fanbase
   */
  getTopClubsByFanbase(limit: number = 10): Club[] {
    return [...CLUBS_DATABASE].sort((a, b) => b.fanBase - a.fanBase).slice(0, limit);
  }

  /**
   * Search clubs
   */
  searchClubs(searchTerm: string): Club[] {
    return this.filterClubs({ searchTerm });
  }
}

export default ClubRegistry.getInstance();
