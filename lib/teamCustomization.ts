/**
 * Team Customization System
 * Custom badges, jersey colors, team visual identity
 */

/**
 * Jersey color set
 */
export interface JerseyColors {
  primary: string; // Main jersey color (hex)
  secondary: string; // Secondary jersey color (hex)
  accent: string; // Accent/trim color (hex)
  sleeves?: string; // Sleeve color (hex)
  socks?: string; // Sock color (hex)
}

/**
 * Custom badge design
 */
export interface CustomBadge {
  badgeId: string;
  teamId: string;
  design: 'classic' | 'modern' | 'geometric' | 'heritage' | 'custom';
  shape: 'circle' | 'shield' | 'hexagon' | 'rounded-square' | 'custom';
  colors: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
  text: {
    teamName: string;
    subtitle?: string;
    year?: number;
  };
  iconUrl?: string;
  imageUrl?: string;
  createdDate: number;
  appliedDate?: number;
  appliedBy: string;
  isActive: boolean;
}

/**
 * Team visual identity (customization)
 */
export interface TeamCustomization {
  teamId: string;
  teamName: string;

  // Jersey Settings
  jerseyHome: JerseyColors;
  jerseyAway?: JerseyColors;
  jerseyNeutral?: JerseyColors;
  defaultJersey: 'home' | 'away' | 'neutral';
  
  // Fan Merchandise
  allowFanOrders: boolean; // Enable fans to order team shirts
  merchandiseEnabled: boolean;

  // Badge
  currentBadge: CustomBadge | null;
  badgeHistory: CustomBadge[];
  badgeDesignerId: string; // Designer or team owner

  // Additional Customization
  teamStadium?: string;
  teamStadiumImageUrl?: string;
  teamCrest?: string;
  teamMotto?: string;
  teamColors: {
    primary: string;
    secondary: string;
    accent: string;
  };

  // Customization Rights
  owner: string; // Address of owner
  canCustomize: boolean;
  customizationCount: number;
  customizationLimit: number; // Can be unlimited

  // Dates
  createdDate: number;
  lastModifiedDate: number;
  modifiedBy: string;

  // Metadata
  customizationHistory: Array<{
    type: 'jersey' | 'badge' | 'colors' | 'details';
    timestamp: number;
    modifiedBy: string;
    description: string;
  }>;
}

/**
 * Badge design templates
 */
const BADGE_TEMPLATES: Record<
  string,
  { shape: string; defaultColors: Record<string, string>; complexity: number }
> = {
  classic: {
    shape: 'shield',
    defaultColors: { primary: '#1A1A1A', secondary: '#FFFFFF', accent: '#FFD700' },
    complexity: 1,
  },
  modern: {
    shape: 'rounded-square',
    defaultColors: { primary: '#0066FF', secondary: '#00CC99', accent: '#FFFFFF' },
    complexity: 2,
  },
  geometric: {
    shape: 'hexagon',
    defaultColors: { primary: '#FF6B35', secondary: '#004E89', accent: '#F7B801' },
    complexity: 3,
  },
  heritage: {
    shape: 'circle',
    defaultColors: { primary: '#8B0000', secondary: '#FFD700', accent: '#FFFFFF' },
    complexity: 2,
  },
};

/**
 * Predefined jersey color schemes
 */
const JERSEY_PRESETS: Record<string, JerseyColors> = {
  'real-madrid': {
    primary: '#FFFFFF',
    secondary: '#000000',
    accent: '#FFD700',
    sleeves: '#FFFFFF',
    socks: '#FFFFFF',
  },
  'manchester-blue': {
    primary: '#0066FF',
    secondary: '#FFFFFF',
    accent: '#FFD700',
    sleeves: '#0066FF',
    socks: '#0066FF',
  },
  'barcelona': {
    primary: '#004B87',
    secondary: '#FF6B1A',
    accent: '#FFFFFF',
    sleeves: '#004B87',
    socks: '#004B87',
  },
  'juventus': {
    primary: '#000000',
    secondary: '#FFFFFF',
    accent: '#000000',
    sleeves: '#FFFFFF',
    socks: '#000000',
  },
  'milan': {
    primary: '#FF0000',
    secondary: '#000000',
    accent: '#FFFFFF',
    sleeves: '#FF0000',
    socks: '#FF0000',
  },
  'liverpool': {
    primary: '#CC0000',
    secondary: '#FFFFFF',
    accent: '#FFD700',
    sleeves: '#CC0000',
    socks: '#FFFFFF',
  },
};

/**
 * TeamCustomizationManager - Manage team visual identity
 * Handles badges, jerseys, colors, team customization
 */
export class TeamCustomizationManager {
  private static instance: TeamCustomizationManager;
  private customizations: Map<string, TeamCustomization> = new Map();
  private badges: Map<string, CustomBadge> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TeamCustomizationManager {
    if (!TeamCustomizationManager.instance) {
      TeamCustomizationManager.instance = new TeamCustomizationManager();
    }
    return TeamCustomizationManager.instance;
  }

  /**
   * Create team customization
   */
  createTeamCustomization(
    teamId: string,
    teamName: string,
    primaryColor: string,
    secondaryColor: string,
    owner: string
  ): TeamCustomization {
    const jerseyColors: JerseyColors = {
      primary: primaryColor,
      secondary: secondaryColor,
      accent: '#FFD700',
    };

    const customization: TeamCustomization = {
      teamId,
      teamName,
      jerseyHome: jerseyColors,
      defaultJersey: 'home',
      currentBadge: null,
      badgeHistory: [],
      badgeDesignerId: owner,
      teamColors: {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: '#FFD700',
      },
      owner,
      canCustomize: true,
      customizationCount: 0,
      customizationLimit: -1, // Unlimited
      allowFanOrders: true,
      merchandiseEnabled: true,
      createdDate: Date.now(),
      lastModifiedDate: Date.now(),
      modifiedBy: owner,
      customizationHistory: [],
    };

    this.customizations.set(teamId, customization);
    this.saveToStorage();
    return customization;
  }

  /**
   * Update jersey colors
   */
  updateJerseyColors(
    teamId: string,
    jerseyType: 'home' | 'away' | 'neutral',
    colors: JerseyColors,
    modifiedBy: string
  ): TeamCustomization {
    const customization = this.getTeamCustomization(teamId);
    if (!customization) throw new Error(`Team ${teamId} not found`);

    if (jerseyType === 'home') {
      customization.jerseyHome = colors;
    } else if (jerseyType === 'away') {
      customization.jerseyAway = colors;
    } else {
      customization.jerseyNeutral = colors;
    }

    customization.lastModifiedDate = Date.now();
    customization.modifiedBy = modifiedBy;
    customization.customizationCount++;
    customization.customizationHistory.push({
      type: 'jersey',
      timestamp: Date.now(),
      modifiedBy,
      description: `Updated ${jerseyType} jersey colors`,
    });

    this.saveToStorage();
    return customization;
  }

  /**
   * Apply jersey preset
   */
  applyJerseyPreset(
    teamId: string,
    presetName: string,
    jerseyType: 'home' | 'away' | 'neutral',
    modifiedBy: string
  ): TeamCustomization {
    const preset = JERSEY_PRESETS[presetName];
    if (!preset) throw new Error(`Preset ${presetName} not found`);

    return this.updateJerseyColors(teamId, jerseyType, preset, modifiedBy);
  }

  /**
   * Create custom badge
   */
  createCustomBadge(
    teamId: string,
    design: string,
    colors: Record<string, string>,
    text: { teamName: string; subtitle?: string; year?: number },
    appliedBy: string
  ): CustomBadge {
    const template = BADGE_TEMPLATES[design] || BADGE_TEMPLATES['classic'];
    const badgeId = `badge_${teamId}_${Date.now()}`;

    const badge: CustomBadge = {
      badgeId,
      teamId,
      design: design as any,
      shape: template.shape as any,
      colors: {
        primary: colors.primary || template.defaultColors.primary,
        secondary: colors.secondary || template.defaultColors.secondary,
        accent: colors.accent || template.defaultColors.accent,
      },
      text,
      createdDate: Date.now(),
      appliedBy,
      isActive: true,
    };

    this.badges.set(badgeId, badge);

    // Apply to team customization
    const customization = this.getTeamCustomization(teamId);
    if (customization) {
      if (customization.currentBadge) {
        customization.currentBadge.isActive = false;
        customization.badgeHistory.push(customization.currentBadge);
      }

      badge.appliedDate = Date.now();
      customization.currentBadge = badge;
      customization.badgeDesignerId = appliedBy;
      customization.lastModifiedDate = Date.now();
      customization.modifiedBy = appliedBy;
      customization.customizationCount++;
      customization.customizationHistory.push({
        type: 'badge',
        timestamp: Date.now(),
        modifiedBy: appliedBy,
        description: `Applied ${design} badge design`,
      });

      this.saveToStorage();
    }

    return badge;
  }

  /**
   * Update team colors (primary scheme)
   */
  updateTeamColors(
    teamId: string,
    primary: string,
    secondary: string,
    accent: string,
    modifiedBy: string
  ): TeamCustomization {
    const customization = this.getTeamCustomization(teamId);
    if (!customization) throw new Error(`Team ${teamId} not found`);

    customization.teamColors = { primary, secondary, accent };
    customization.lastModifiedDate = Date.now();
    customization.modifiedBy = modifiedBy;
    customization.customizationCount++;
    customization.customizationHistory.push({
      type: 'colors',
      timestamp: Date.now(),
      modifiedBy,
      description: 'Updated team color scheme',
    });

    this.saveToStorage();
    return customization;
  }

  /**
   * Update team details
   */
  updateTeamDetails(
    teamId: string,
    details: {
      stadium?: string;
      stadiumImageUrl?: string;
      crest?: string;
      motto?: string;
    },
    modifiedBy: string
  ): TeamCustomization {
    const customization = this.getTeamCustomization(teamId);
    if (!customization) throw new Error(`Team ${teamId} not found`);

    if (details.stadium) customization.teamStadium = details.stadium;
    if (details.stadiumImageUrl) customization.teamStadiumImageUrl = details.stadiumImageUrl;
    if (details.crest) customization.teamCrest = details.crest;
    if (details.motto) customization.teamMotto = details.motto;

    customization.lastModifiedDate = Date.now();
    customization.modifiedBy = modifiedBy;
    customization.customizationCount++;
    customization.customizationHistory.push({
      type: 'details',
      timestamp: Date.now(),
      modifiedBy,
      description: 'Updated team details',
    });

    this.saveToStorage();
    return customization;
  }

  /**
   * Get team customization
   */
  getTeamCustomization(teamId: string): TeamCustomization | undefined {
    return this.customizations.get(teamId);
  }

  /**
   * Get badge by ID
   */
  getBadge(badgeId: string): CustomBadge | undefined {
    return this.badges.get(badgeId);
  }

  /**
   * Get all badges for team
   */
  getTeamBadges(teamId: string): CustomBadge[] {
    return Array.from(this.badges.values()).filter((b) => b.teamId === teamId);
  }

  /**
   * Get available jersey presets
   */
  getJerseyPresets(): Record<string, JerseyColors> {
    return JERSEY_PRESETS;
  }

  /**
   * Get available badge designs
   */
  getBadgeDesigns(): Record<string, any> {
    return BADGE_TEMPLATES;
  }

  /**
   * Validate color (hex format)
   */
  validateColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  /**
   * Get customization history
   */
  getCustomizationHistory(teamId: string): Array<{
    type: string;
    timestamp: number;
    modifiedBy: string;
    description: string;
  }> {
    const customization = this.getTeamCustomization(teamId);
    return customization?.customizationHistory || [];
  }

  /**
   * Export customization as JSON
   */
  exportCustomization(teamId: string): string {
    const customization = this.getTeamCustomization(teamId);
    if (!customization) throw new Error(`Team ${teamId} not found`);
    return JSON.stringify(customization, null, 2);
  }

  /**
   * Export badge design
   */
  exportBadgeDesign(badgeId: string): string {
    const badge = this.getBadge(badgeId);
    if (!badge) throw new Error(`Badge ${badgeId} not found`);
    return JSON.stringify(badge, null, 2);
  }

  /**
   * Get all customizations
   */
  getAllCustomizations(): TeamCustomization[] {
    return Array.from(this.customizations.values());
  }

  /**
   * Get all badges
   */
  getAllBadges(): CustomBadge[] {
    return Array.from(this.badges.values());
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        customizations: Array.from(this.customizations.entries()),
        badges: Array.from(this.badges.entries()),
      };
      localStorage.setItem('team_customization', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save team customization:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage.getItem('team_customization') || '{}');
      if (data.customizations) {
        this.customizations = new Map(data.customizations);
      }
      if (data.badges) {
        this.badges = new Map(data.badges);
      }
    } catch (error) {
      console.error('Failed to load team customization:', error);
    }
  }
}

/**
 * Create team customization
 */
export function createTeamCustomization(
  teamId: string,
  teamName: string,
  primaryColor: string,
  secondaryColor: string,
  owner: string
): TeamCustomization {
  const manager = TeamCustomizationManager.getInstance();
  return manager.createTeamCustomization(teamId, teamName, primaryColor, secondaryColor, owner);
}

/**
 * Create custom badge
 */
export function createCustomBadge(
  teamId: string,
  design: string,
  colors: Record<string, string>,
  text: { teamName: string; subtitle?: string; year?: number },
  appliedBy: string
): CustomBadge {
  const manager = TeamCustomizationManager.getInstance();
  return manager.createCustomBadge(teamId, design, colors, text, appliedBy);
}
