import { GameState, Player, Team, Ball, EnhancedGameState, Tactics, WeatherConditions, MatchEvent } from './konamiFeatures';

// Enhanced physics with Konami features
export class EnhancedGameEngine {
  private gameState: EnhancedGameState;
  private frameCount = 0;

  constructor(homeTeam: Team, awayTeam: Team, weather?: WeatherConditions) {
    this.gameState = {
      homeTeam,
      awayTeam,
      ball: { x: 52, y: 34, vx: 0, vy: 0, spin: 0 },
      matchTime: 0,
      possession: 'home',
      lastPossession: 'home',
      matchEvents: [],
      homeScore: 0,
      awayScore: 0,
      isActive: true,
      currentTactics: {
        defensiveStyle: 'balanced',
        buildUpPlay: 'balanced',
        pressureMode: 'medium',
        width: 6,
        depth: 5,
      },
      weather: weather || {
        type: 'clear',
        intensity: 0,
        windSpeed: 0,
        temperature: 20,
        affectsBallControl: false,
        affectsPassing: false,
        affectsShot: false,
      },
      difficulty: 'Professional',
      stadium: { name: 'Default Stadium', capacity: 60000, atmosphere: 75 },
      commentary: [],
    };
  }

  getGameState(): EnhancedGameState {
    return this.gameState;
  }

  // Apply weather effects to player stats
  private applyWeatherEffects(player: Player): Player {
    const weather = this.gameState.weather;
    let modifiedPlayer = { ...player };

    if (weather.affectsBallControl) {
      modifiedPlayer.stats.dribbling = Math.max(
        1,
        Math.round(modifiedPlayer.stats.dribbling * (1 - weather.intensity * 0.2))
      );
    }

    if (weather.affectsPassing) {
      modifiedPlayer.stats.passing = Math.max(
        1,
        Math.round(modifiedPlayer.stats.passing * (1 - weather.intensity * 0.15))
      );
    }

    if (weather.affectsShot) {
      modifiedPlayer.stats.shooting = Math.max(
        1,
        Math.round(modifiedPlayer.stats.shooting * (1 - weather.intensity * 0.25))
      );
    }

    return modifiedPlayer;
  }

  // Enhanced ball physics with wind
  private applyBallPhysics(): void {
    const ball = this.gameState.ball;
    const weather = this.gameState.weather;
    const windEffect = weather.windSpeed * 0.1;

    // Apply friction
    ball.vx *= 0.99;
    ball.vy *= 0.99;

    // Apply wind (only affects shots/crosses)
    if (Math.abs(ball.vx) > 2 || Math.abs(ball.vy) > 2) {
      ball.vx += windEffect * (Math.random() - 0.5);
    }

    // Update position
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Boundary checks
    if (ball.x < 0 || ball.x > 104) {
      ball.vx *= -0.8;
      ball.x = Math.max(0, Math.min(104, ball.x));
    }
    if (ball.y < 0 || ball.y > 68) {
      ball.vy *= -0.8;
      ball.y = Math.max(0, Math.min(68, ball.y));
    }

    // Goal detection
    this.checkGoal();
  }

  private checkGoal(): void {
    const ball = this.gameState.ball;
    const goalLineX = 104;
    const goalYMin = 30;
    const goalYMax = 38;

    if (ball.x >= goalLineX && ball.y > goalYMin && ball.y < goalYMax) {
      if (this.gameState.possession === 'away') {
        this.gameState.homeScore++;
        this.recordEvent({
          type: 'goal',
          time: this.gameState.matchTime,
          player: 'Away Player',
          team: 'away',
          details: 'Away goal scored',
        });
      }
      this.resetBall();
    }

    if (ball.x <= 0 && ball.y > goalYMin && ball.y < goalYMax) {
      if (this.gameState.possession === 'home') {
        this.gameState.awayScore++;
        this.recordEvent({
          type: 'goal',
          time: this.gameState.matchTime,
          player: 'Home Player',
          team: 'home',
          details: 'Home goal scored',
        });
      }
      this.resetBall();
    }
  }

  // Enhanced player positioning with tactics
  private updatePlayerPositions(): void {
    const ball = this.gameState.ball;
    const tactics = this.gameState.currentTactics;
    const team = this.gameState.possession === 'home' ? this.gameState.homeTeam : this.gameState.awayTeam;

    team.players.forEach((player) => {
      if (player.position === 'GK') return; // Don't move goalkeeper automatically

      // Calculate target based on position and tactics
      let targetX = player.x;
      let targetY = player.y;

      // Defensive positioning
      if (tactics.defensiveStyle === 'defensive') {
        targetX = Math.min(targetX, ball.x - 5);
      }
      // Attacking positioning
      else if (tactics.defensiveStyle === 'attacking') {
        targetX = Math.max(targetX, ball.x + 3);
      }

      // Apply width tactics
      const widthModifier = (tactics.width - 5) * 2;

      // Move towards target
      const moveSpeed = 0.5;
      if (Math.abs(targetX - player.x) > 0.5) {
        player.x += (targetX > player.x ? 1 : -1) * moveSpeed;
      }
      if (Math.abs(targetY - player.y) > 0.5) {
        player.y += (targetY > player.y ? 1 : -1) * moveSpeed * (tactics.width / 10);
      }

      // Boundary check
      player.x = Math.max(0, Math.min(104, player.x));
      player.y = Math.max(0, Math.min(68, player.y));
    });
  }

  // Tactical card system
  private checkCardRisk(foul: boolean): 'yellow' | 'red' | null {
    if (!foul) return null;
    const random = Math.random();
    if (random < 0.08) return 'yellow';
    if (random < 0.01) return 'red';
    return null;
  }

  // Injury mechanism
  private checkInjuryRisk(playerPosition: string): boolean {
    const risk = playerPosition === 'ST' ? 0.005 : playerPosition === 'CB' ? 0.003 : 0.002;
    return Math.random() < risk;
  }

  // VAR Review system
  private checkVARReview(eventType: string): boolean {
    if (eventType === 'goal') return Math.random() < 0.15; // 15% chance for goal review
    if (eventType === 'red_card') return Math.random() < 0.5; // 50% chance for red card review
    return false;
  }

  private recordEvent(event: Omit<MatchEvent, 'varReview'>): void {
    const varReview = this.checkVARReview(event.type);
    this.gameState.matchEvents.push({
      ...event,
      varReview,
    });
  }

  private resetBall(): void {
    this.gameState.ball = { x: 52, y: 34, vx: 0, vy: 0, spin: 0 };
    this.gameState.possession = this.gameState.lastPossession === 'home' ? 'away' : 'home';
  }

  // Possession tracking with tactics influence
  private updatePossession(): void {
    const ball = this.gameState.ball;
    const homeTeam = this.gameState.homeTeam;
    const awayTeam = this.gameState.awayTeam;

    // Find closest player to ball
    let closestPlayer: Player | null = null;
    let closestDist = Infinity;
    let closestTeam: 'home' | 'away' = 'home';

    homeTeam.players.forEach((player) => {
      const dist = Math.sqrt(Math.pow(player.x - ball.x, 2) + Math.pow(player.y - ball.y, 2));
      if (dist < closestDist) {
        closestDist = dist;
        closestPlayer = player;
        closestTeam = 'home';
      }
    });

    awayTeam.players.forEach((player) => {
      const dist = Math.sqrt(Math.pow(player.x - ball.x, 2) + Math.pow(player.y - ball.y, 2));
      if (dist < closestDist) {
        closestDist = dist;
        closestPlayer = player;
        closestTeam = 'away';
      }
    });

    if (closestDist < 5) {
      this.gameState.possession = closestTeam;
      this.gameState.lastPossession = closestTeam;
    }
  }

  // Main simulation step
  public update(deltaTime: number = 1): void {
    if (!this.gameState.isActive) return;

    this.frameCount++;

    // Update every 10 frames
    if (this.frameCount % 10 === 0) {
      this.applyBallPhysics();
      this.updatePossession();
      this.updatePlayerPositions();

      // Check for events
      if (Math.random() < 0.01) {
        this.recordEvent({
          type: 'tackle',
          time: this.gameState.matchTime,
          player: 'Player Name',
          team: this.gameState.possession,
          details: 'Tackle made',
        });
      }

      this.gameState.matchTime += 0.1;

      // Match end
      if (this.gameState.matchTime >= 90) {
        this.gameState.isActive = false;
      }
    }
  }

  // Change tactics mid-match
  public setTactics(tactics: Tactics): void {
    this.gameState.currentTactics = tactics;
    this.recordEvent({
      type: 'substitution',
      time: this.gameState.matchTime,
      player: 'Manager',
      team: 'home',
      details: 'Tactics changed',
    });
  }

  // Get match statistics
  public getMatchStatistics() {
    const totalEvents = this.gameState.matchEvents.length;
    const homeGoals = this.gameState.homeScore;
    const awayGoals = this.gameState.awayScore;

    return {
      matchTime: this.gameState.matchTime,
      score: { home: homeGoals, away: awayGoals },
      possession: this.gameState.possession,
      homeTeamName: this.gameState.homeTeam.name,
      awayTeamName: this.gameState.awayTeam.name,
      eventsCount: totalEvents,
      weather: this.gameState.weather,
      stadium: this.gameState.stadium,
    };
  }
}

// Export for use in hooks
export { EnhancedGameState, Tactics, WeatherConditions, MatchEvent };
