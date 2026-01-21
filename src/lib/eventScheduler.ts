/**
 * Event scheduling and calendar system
 */

export type EventType = 'match' | 'training' | 'tournament' | 'maintenance' | 'update';

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  location?: string;
  participants?: string[];
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

export interface EventCalendar {
  events: Map<string, GameEvent>;
  subscribers: Map<string, Set<string>>; // userId -> set of eventIds
}

export class EventScheduler {
  private calendar: EventCalendar = {
    events: new Map(),
    subscribers: new Map(),
  };

  /**
   * Schedule event
   */
  scheduleEvent(
    type: EventType,
    title: string,
    description: string,
    startTime: number,
    endTime: number,
    location?: string
  ): GameEvent {
    const id = `event-${Date.now()}-${Math.random()}`;
    const now = Date.now();

    const event: GameEvent = {
      id,
      type,
      title,
      description,
      startTime,
      endTime,
      location,
      participants: [],
      status: 'scheduled',
    };

    this.calendar.events.set(id, event);
    return { ...event };
  }

  /**
   * Get events for date range
   */
  getEventsByDateRange(startDate: number, endDate: number): GameEvent[] {
    return Array.from(this.calendar.events.values()).filter(
      (e) => e.startTime <= endDate && e.endTime >= startDate
    );
  }

  /**
   * Get upcoming events
   */
  getUpcomingEvents(limit: number = 10): GameEvent[] {
    const now = Date.now();
    return Array.from(this.calendar.events.values())
      .filter((e) => e.startTime > now && e.status !== 'cancelled')
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, limit);
  }

  /**
   * Subscribe to event
   */
  subscribeToEvent(userId: string, eventId: string): boolean {
    const event = this.calendar.events.get(eventId);
    if (!event) return false;

    if (!this.calendar.subscribers.has(userId)) {
      this.calendar.subscribers.set(userId, new Set());
    }

    this.calendar.subscribers.get(userId)!.add(eventId);
    if (event.participants) {
      event.participants.push(userId);
    }

    return true;
  }

  /**
   * Unsubscribe from event
   */
  unsubscribeFromEvent(userId: string, eventId: string): boolean {
    const subscribers = this.calendar.subscribers.get(userId);
    if (!subscribers) return false;

    const removed = subscribers.delete(eventId);

    if (removed) {
      const event = this.calendar.events.get(eventId);
      if (event && event.participants) {
        const index = event.participants.indexOf(userId);
        if (index !== -1) {
          event.participants.splice(index, 1);
        }
      }
    }

    return removed;
  }

  /**
   * Get user's subscribed events
   */
  getUserEvents(userId: string): GameEvent[] {
    const eventIds = this.calendar.subscribers.get(userId) || new Set();
    return Array.from(eventIds)
      .map((id) => this.calendar.events.get(id))
      .filter((e): e is GameEvent => !!e)
      .sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Update event status
   */
  updateEventStatus(eventId: string, status: GameEvent['status']): boolean {
    const event = this.calendar.events.get(eventId);
    if (!event) return false;

    event.status = status;
    return true;
  }

  /**
   * Cancel event
   */
  cancelEvent(eventId: string): boolean {
    const event = this.calendar.events.get(eventId);
    if (!event) return false;

    event.status = 'cancelled';
    return true;
  }

  /**
   * Get event details
   */
  getEvent(eventId: string): GameEvent | undefined {
    return this.calendar.events.get(eventId);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: EventType): GameEvent[] {
    return Array.from(this.calendar.events.values()).filter((e) => e.type === type);
  }

  /**
   * Get calendar statistics
   */
  getStatistics() {
    const now = Date.now();
    const all = Array.from(this.calendar.events.values());

    return {
      totalEvents: all.length,
      upcomingEvents: all.filter((e) => e.startTime > now).length,
      ongoingEvents: all.filter((e) => e.status === 'ongoing').length,
      completedEvents: all.filter((e) => e.status === 'completed').length,
      cancelledEvents: all.filter((e) => e.status === 'cancelled').length,
      totalSubscribers: this.calendar.subscribers.size,
    };
  }
}
