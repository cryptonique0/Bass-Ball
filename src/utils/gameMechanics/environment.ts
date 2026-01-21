/**
 * Match Events System - Weather, field conditions, injuries during play
 */

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
export type FieldCondition = 'perfect' | 'good' | 'wet' | 'muddy' | 'icy' | 'poor';

export interface WeatherState {
  type: WeatherType;
  windSpeed: number; // m/s
  windDirection: number; // 0-360 degrees
  temperature: number; // celsius
  humidity: number; // 0-100 percent
}

export interface FieldState {
  condition: FieldCondition;
  wetness: number; // 0-1
  damageLevel: number; // 0-1
  ballGrip: number; // 0-1, affects ball control
}

export interface InjuryEvent {
  playerId: string;
  type: string;
  severity: 'minor' | 'moderate' | 'severe';
  recoveryTime: number; // minutes
  timestamp: number;
}

export class MatchEnvironmentSystem {
  private weather: WeatherState;
  private fieldState: FieldState;
  private injuries: InjuryEvent[] = [];
  private eventLog: Array<{ timestamp: number; type: string; data: unknown }> = [];

  constructor(initialWeather?: WeatherType) {
    this.weather = this.generateWeather(initialWeather || 'sunny');
    this.fieldState = this.generateFieldState('perfect');
  }

  private generateWeather(type: WeatherType): WeatherState {
    const weatherProfiles: Record<WeatherType, { windSpeed: number; temperature: number; humidity: number }> = {
      sunny: { windSpeed: 5, temperature: 22, humidity: 60 },
      cloudy: { windSpeed: 8, temperature: 18, humidity: 70 },
      rainy: { windSpeed: 12, temperature: 15, humidity: 85 },
      stormy: { windSpeed: 20, temperature: 12, humidity: 95 },
      snowy: { windSpeed: 15, temperature: -2, humidity: 90 },
    };

    const profile = weatherProfiles[type];

    return {
      type,
      windSpeed: profile.windSpeed,
      windDirection: Math.random() * 360,
      temperature: profile.temperature,
      humidity: profile.humidity,
    };
  }

  private generateFieldState(condition: FieldCondition): FieldState {
    const conditions: Record<FieldCondition, { wetness: number; damageLevel: number; ballGrip: number }> = {
      perfect: { wetness: 0, damageLevel: 0, ballGrip: 0.95 },
      good: { wetness: 0.1, damageLevel: 0.05, ballGrip: 0.9 },
      wet: { wetness: 0.6, damageLevel: 0.2, ballGrip: 0.75 },
      muddy: { wetness: 0.8, damageLevel: 0.4, ballGrip: 0.65 },
      icy: { wetness: 0.5, damageLevel: 0.15, ballGrip: 0.4 },
      poor: { wetness: 0.9, damageLevel: 0.7, ballGrip: 0.5 },
    };

    const profile = conditions[condition];

    return {
      condition,
      wetness: profile.wetness,
      damageLevel: profile.damageLevel,
      ballGrip: profile.ballGrip,
    };
  }

  updateWeather(deltaTime: number): void {
    // Gradually transition weather
    const transitionProbability = 0.001;

    if (Math.random() < transitionProbability) {
      const weatherTypes: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy'];
      const newWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
      this.weather = this.generateWeather(newWeather);
      this.logEvent('WEATHER_CHANGE', { weather: newWeather });
    }

    // Wind direction changes
    this.weather.windDirection = (this.weather.windDirection + (Math.random() - 0.5) * 5) % 360;

    // Temperature gradually changes
    const tempChange = (Math.random() - 0.5) * 0.1;
    this.weather.temperature += tempChange;

    // Field condition deteriorates with time
    this.fieldState.damageLevel = Math.min(1, this.fieldState.damageLevel + 0.0001);
  }

  simulateInjury(playerId: string): InjuryEvent | null {
    const injuryProbability = this.fieldState.damageLevel * 0.01 + this.weather.windSpeed * 0.005;

    if (Math.random() < injuryProbability) {
      const severity: ('minor' | 'moderate' | 'severe')[] = ['minor', 'moderate', 'severe'];
      const injuryTypes = ['muscle strain', 'sprain', 'contusion', 'laceration', 'dislocation'];

      const event: InjuryEvent = {
        playerId,
        type: injuryTypes[Math.floor(Math.random() * injuryTypes.length)],
        severity: severity[Math.floor(Math.random() * severity.length)],
        recoveryTime: Math.random() * 60 + 30, // 30-90 minutes
        timestamp: Date.now(),
      };

      this.injuries.push(event);
      this.logEvent('INJURY', event);
      return event;
    }

    return null;
  }

  getEnvironmentImpact(): {
    ballControl: number;
    passAccuracy: number;
    shootingAccuracy: number;
    speed: number;
  } {
    const weatherImpact = this.getWeatherImpact();
    const fieldImpact = this.getFieldImpact();

    return {
      ballControl: weatherImpact.ballControl * fieldImpact.ballControl,
      passAccuracy: weatherImpact.passAccuracy * fieldImpact.passAccuracy,
      shootingAccuracy: weatherImpact.shootingAccuracy * fieldImpact.shootingAccuracy,
      speed: weatherImpact.speed * fieldImpact.speed,
    };
  }

  private getWeatherImpact(): {
    ballControl: number;
    passAccuracy: number;
    shootingAccuracy: number;
    speed: number;
  } {
    const windFactor = Math.min(this.weather.windSpeed / 20, 1);

    return {
      ballControl: 1 - windFactor * 0.15,
      passAccuracy: 1 - windFactor * 0.1,
      shootingAccuracy: 1 - windFactor * 0.2,
      speed: 1 - windFactor * 0.05,
    };
  }

  private getFieldImpact(): {
    ballControl: number;
    passAccuracy: number;
    shootingAccuracy: number;
    speed: number;
  } {
    const damage = this.fieldState.damageLevel;

    return {
      ballControl: 1 - damage * 0.3,
      passAccuracy: 1 - damage * 0.15,
      shootingAccuracy: 1 - damage * 0.2,
      speed: 1 - damage * 0.25,
    };
  }

  getWeather(): WeatherState {
    return this.weather;
  }

  getFieldState(): FieldState {
    return this.fieldState;
  }

  getActiveInjuries(): InjuryEvent[] {
    return this.injuries;
  }

  private logEvent(type: string, data: unknown): void {
    this.eventLog.push({ timestamp: Date.now(), type, data });
  }
}
