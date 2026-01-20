// Analytics tracking utilities
export interface AnalyticsEvent {
  name: string;
  timestamp: number;
  userId?: string;
  properties?: Record<string, any>;
}

class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];

  track(name: string, userId?: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name,
      timestamp: Date.now(),
      userId,
      properties,
    };

    this.events.push(event);

    // In production, send to analytics service
    console.debug('Analytics event:', event);
  }

  trackPageView(page: string, userId?: string): void {
    this.track('page_view', userId, { page });
  }

  trackUserAction(action: string, userId?: string, data?: Record<string, any>): void {
    this.track(`user_${action}`, userId, data);
  }

  trackGameEvent(eventType: string, matchId: string, data?: Record<string, any>): void {
    this.track('game_event', undefined, { eventType, matchId, ...data });
  }

  getEvents(): AnalyticsEvent[] {
    return this.events;
  }

  clear(): void {
    this.events = [];
  }
}

export const analytics = new AnalyticsTracker();
