/**
 * Tutorial and onboarding system
 */

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  targetElement?: string;
  highlightArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  skippable: boolean;
  completionCondition?: () => boolean;
}

export interface TutorialProgress {
  playerId: string;
  completedSteps: Set<string>;
  currentStep: string | null;
  tutorialCompleted: boolean;
  startedAt: number;
  completedAt?: number;
}

export const TUTORIALS: Record<string, TutorialStep[]> = {
  'basics': [
    {
      id: 'welcome',
      title: 'Welcome to Bass-Ball',
      description: 'Learn the basics of the game',
      instructions: [
        'Press WASD or Arrow Keys to move',
        'Press SPACE to shoot',
        'Press E to pass',
        'Press Q for special skills',
      ],
      skippable: true,
    },
    {
      id: 'movement',
      title: 'Movement Controls',
      description: 'Master player movement',
      instructions: [
        'Use WASD keys to move around the field',
        'Hold SHIFT to sprint faster',
        'Double-press to perform a quick dash',
      ],
      skippable: false,
    },
    {
      id: 'passing',
      title: 'Passing the Ball',
      description: 'Learn how to pass effectively',
      instructions: [
        'Press E to pass to nearby teammates',
        'Hold E to charge a long pass',
        'Look at teammates before passing',
      ],
      skippable: false,
    },
    {
      id: 'shooting',
      title: 'Shooting and Scoring',
      description: 'Score goals for your team',
      instructions: [
        'Press SPACE to shoot when near goal',
        'Hold SPACE to charge for more power',
        'Aim carefully for accuracy',
      ],
      skippable: false,
    },
  ],
  'intermediate': [
    {
      id: 'formations',
      title: 'Team Formations',
      description: 'Understand team tactics',
      instructions: [
        '4-3-3 is balanced for attack and defense',
        '5-3-2 is very defensive',
        '3-4-3 is very offensive',
      ],
      skippable: true,
    },
    {
      id: 'defense',
      title: 'Defensive Play',
      description: 'Defend against opponents',
      instructions: [
        'Position between opponent and goal',
        'Press X to slide tackle',
        'Intercept passes before they reach attackers',
      ],
      skippable: true,
    },
  ],
};

export class TutorialService {
  private progress: Map<string, TutorialProgress> = new Map();

  /**
   * Start tutorial for player
   */
  startTutorial(playerId: string, tutorialId: string): TutorialProgress {
    const tutorial = TUTORIALS[tutorialId];
    if (!tutorial) throw new Error(`Tutorial ${tutorialId} not found`);

    const progress: TutorialProgress = {
      playerId,
      completedSteps: new Set(),
      currentStep: tutorial[0].id,
      tutorialCompleted: false,
      startedAt: Date.now(),
    };

    this.progress.set(`${playerId}-${tutorialId}`, progress);
    return progress;
  }

  /**
   * Get tutorial progress
   */
  getProgress(playerId: string, tutorialId: string): TutorialProgress | undefined {
    return this.progress.get(`${playerId}-${tutorialId}`);
  }

  /**
   * Complete tutorial step
   */
  completeStep(playerId: string, tutorialId: string, stepId: string): boolean {
    const key = `${playerId}-${tutorialId}`;
    const progress = this.progress.get(key);

    if (!progress) return false;

    progress.completedSteps.add(stepId);

    const tutorial = TUTORIALS[tutorialId];
    const currentIndex = tutorial.findIndex((s) => s.id === progress.currentStep);

    // Move to next step
    if (currentIndex < tutorial.length - 1) {
      progress.currentStep = tutorial[currentIndex + 1].id;
    } else {
      // Tutorial complete
      progress.tutorialCompleted = true;
      progress.completedAt = Date.now();
      progress.currentStep = null;
    }

    return true;
  }

  /**
   * Skip step if allowed
   */
  skipStep(playerId: string, tutorialId: string): boolean {
    const key = `${playerId}-${tutorialId}`;
    const progress = this.progress.get(key);

    if (!progress || !progress.currentStep) return false;

    const tutorial = TUTORIALS[tutorialId];
    const currentStep = tutorial.find((s) => s.id === progress.currentStep);

    if (!currentStep || !currentStep.skippable) return false;

    return this.completeStep(playerId, tutorialId, progress.currentStep);
  }

  /**
   * Get current step
   */
  getCurrentStep(playerId: string, tutorialId: string): TutorialStep | undefined {
    const progress = this.progress.get(`${playerId}-${tutorialId}`);
    if (!progress || !progress.currentStep) return undefined;

    const tutorial = TUTORIALS[tutorialId];
    return tutorial.find((s) => s.id === progress.currentStep);
  }

  /**
   * Get all available tutorials
   */
  getAvailableTutorials(): string[] {
    return Object.keys(TUTORIALS);
  }

  /**
   * Check if tutorial is completed
   */
  isTutorialCompleted(playerId: string, tutorialId: string): boolean {
    const progress = this.progress.get(`${playerId}-${tutorialId}`);
    return progress?.tutorialCompleted || false;
  }

  /**
   * Get tutorial statistics
   */
  getStatistics(playerId: string) {
    const playerTutorials = Array.from(this.progress.entries())
      .filter(([key]) => key.startsWith(playerId))
      .map(([, progress]) => progress);

    return {
      playerId,
      totalTutorialsStarted: playerTutorials.length,
      completedTutorials: playerTutorials.filter((p) => p.tutorialCompleted).length,
      tutorialsInProgress: playerTutorials.filter((p) => !p.tutorialCompleted).length,
    };
  }
}
