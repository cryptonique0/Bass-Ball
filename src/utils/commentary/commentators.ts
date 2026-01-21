/**
 * Commentator System - Multiple personalities and broadcasting styles
 */

export type CommentatorStyle = 'energetic' | 'analytical' | 'dramatic' | 'humorous' | 'cautious';
export type EventType = 'goal' | 'near_miss' | 'foul' | 'corner' | 'free_kick' | 'yellow_card' | 'red_card' | 'substitution' | 'save' | 'possession' | 'kickoff';

export interface Commentator {
  name: string;
  style: CommentatorStyle;
  accent: string;
  experience: number; // 1-10
  signature: string;
  catchphrases: string[];
}

export const COMMENTATORS: Record<string, Commentator> = {
  peter_drury: {
    name: 'Peter Drury',
    style: 'dramatic',
    accent: 'British',
    experience: 9,
    signature: 'Oh it is beautiful!',
    catchphrases: [
      'Oh it is beautiful!',
      'What a moment!',
      'Into the air, away from the play!',
      'Sensational!',
      'He can go all the way!',
      'This is special!',
      'He\'s done it!',
      'The breath catches in your throat!',
    ],
  },
  martin_tyler: {
    name: 'Martin Tyler',
    style: 'analytical',
    accent: 'British',
    experience: 9,
    signature: 'And that is that!',
    catchphrases: [
      'And that is that!',
      'There it is!',
      'The ball is in the net!',
      'Can he finish it?',
      'What a chance!',
      'The keeper has to save that!',
      'Brilliant play!',
      'Quality piece of play!',
    ],
  },
  gary_neville: {
    name: 'Gary Neville',
    style: 'analytical',
    accent: 'British',
    experience: 8,
    signature: 'You can see the quality!',
    catchphrases: [
      'You can see the quality!',
      'Hes a top player!',
      'Thats world class!',
      'The positioning is key!',
      'Look at that awareness!',
      'Thats intelligent play!',
      'You need experience for that!',
      'The intensity is crucial!',
    ],
  },
  legendary_commentator: {
    name: 'Legendary Commentator',
    style: 'energetic',
    accent: 'Neutral',
    experience: 10,
    signature: 'GOOOOOAAAAAALLLLL!',
    catchphrases: [
      'GOOOOOAAAAAALLLLL!',
      'WHAT A STRIKE!',
      'ABSOLUTELY MAGNIFICENT!',
      'THE CROWD IS ON THEIR FEET!',
      'THIS IS INCREDIBLE!',
      'HE SLOTS IT HOME!',
      'PURE CLASS!',
      'UNBELIEVABLE STUFF!',
    ],
  },
  tactical_analyst: {
    name: 'Tactical Analyst',
    style: 'cautious',
    accent: 'Neutral',
    experience: 8,
    signature: 'Tactically speaking...',
    catchphrases: [
      'Tactically speaking...',
      'From a defensive standpoint...',
      'The formations are interesting...',
      'Notice the positioning...',
      'The tactical approach is...',
      'Strategic-wise, they\'re...',
      'The game plan is clear...',
      'The shape is important here...',
    ],
  },
  humorous_commentator: {
    name: 'Humorous Commentator',
    style: 'humorous',
    accent: 'Neutral',
    experience: 7,
    signature: 'Well, that happened!',
    catchphrases: [
      'Well, that happened!',
      'I\'ve seen worse... maybe!',
      'Oh dear, oh dear!',
      'That\'s one way to do it!',
      'He\'s had better days!',
      'The goalkeeper will want that back!',
      'Not his finest moment!',
      'I think he meant to do that!',
    ],
  },
};

export class CommentatorSystem {
  private activeCommentator: Commentator;
  private commentaryHistory: Array<{ timestamp: number; text: string; intensity: number }> = [];
  private eventCommentary: Map<EventType, string[]> = new Map();

  constructor(commentatorKey: string = 'peter_drury') {
    this.activeCommentator = COMMENTATORS[commentatorKey] || COMMENTATORS['peter_drury'];
    this.initializeEventCommentary();
  }

  private initializeEventCommentary(): void {
    this.eventCommentary.set('goal', this.getGoalCommentary());
    this.eventCommentary.set('near_miss', this.getNearMissCommentary());
    this.eventCommentary.set('foul', this.getFoulCommentary());
    this.eventCommentary.set('yellow_card', this.getYellowCardCommentary());
    this.eventCommentary.set('save', this.getSaveCommentary());
    this.eventCommentary.set('possession', this.getPossessionCommentary());
  }

  private getGoalCommentary(): string[] {
    const base = this.activeCommentator.catchphrases;

    const additional = [
      `${this.activeCommentator.name} would approve of that finish!`,
      'The net ripples! It\'s a goal!',
      'That\'s gone in! The ball is in the back of the net!',
      'Absolutely clinical finishing!',
      'One-on-one with the keeper and he doesn\'t disappoint!',
      'The goalkeeper had no chance with that!',
      'What composure in front of goal!',
      'That\'s a quality strike!',
    ];

    return [...base, ...additional];
  }

  private getNearMissCommentary(): string[] {
    return [
      'Oh, so close!',
      'Just wide!',
      'The post saves it!',
      'He should have done better there!',
      'A chance goes begging!',
      'Just inches away!',
      'The keeper gets a hand to it!',
      'That could have been it!',
      'Frustration there!',
      'He\'ll be disappointed with that!',
    ];
  }

  private getFoulCommentary(): string[] {
    return [
      'That\'s a foul!',
      'Referee sees it!',
      'A challenge is made!',
      'He goes down!',
      'Contact there!',
      'The referee blows up!',
      'A free kick is awarded!',
      'That\'s too strong!',
      'Unnecessary roughness!',
      'The contact is evident!',
    ];
  }

  private getYellowCardCommentary(): string[] {
    return [
      'And it\'s a yellow card!',
      'The referee shows the yellow!',
      'A caution is given!',
      'He\'s in the book!',
      'That\'s a booking!',
      'Yellow card for that challenge!',
      'The first card of the game!',
      'He\'ll be more careful now!',
      'A warning issued!',
      'Into the referee\'s notebook!',
    ];
  }

  private getSaveCommentary(): string[] {
    return [
      'What a save!',
      'Excellent goalkeeping!',
      'The keeper denies him!',
      'A reflex save!',
      'Brilliantly kept out!',
      'The keeper pulls off a stunner!',
      'Instinctive play from the goalkeeper!',
      'He has to be sharp!',
      'Tipped over the bar!',
      'Spectacular goalkeeping!',
    ];
  }

  private getPossessionCommentary(): string[] {
    return [
      'They\'re in control now!',
      'The rhythm of the game has changed!',
      'Possession is shifting!',
      'They\'re dominating the ball!',
      'Building pressure here!',
      'The tempo increases!',
      'More of the ball for them now!',
      'They\'re keeping it well!',
      'The intensity rises!',
      'A spell of possession!',
    ];
  }

  generateCommentary(eventType: EventType, matchContext?: { score: [number, number]; time: number; intensity?: number }): string {
    const commentaryList = this.eventCommentary.get(eventType) || ['Interesting play!'];
    const baseCommentary = commentaryList[Math.floor(Math.random() * commentaryList.length)];

    let finalCommentary = baseCommentary;
    const intensity = matchContext?.intensity || 0.5;

    // Add style-specific modifiers
    if (this.activeCommentator.style === 'dramatic' && intensity > 0.7) {
      finalCommentary = finalCommentary.toUpperCase();
    } else if (this.activeCommentator.style === 'energetic' && intensity > 0.6) {
      finalCommentary += '!'.repeat(Math.ceil(intensity * 3));
    } else if (this.activeCommentator.style === 'humorous') {
      const jokes = ['... or not!', ' ...or maybe not!', ' ...we think!'];
      if (Math.random() > 0.6) {
        finalCommentary += jokes[Math.floor(Math.random() * jokes.length)];
      }
    }

    // Add time-based context
    if (matchContext) {
      const { time, score } = matchContext;
      if (time > 80 && score[0] === score[1]) {
        finalCommentary += ' The pressure is mounting!';
      } else if (score[0] > score[1]) {
        finalCommentary += ' They need to find an equalizer!';
      }
    }

    this.commentaryHistory.push({
      timestamp: Date.now(),
      text: finalCommentary,
      intensity,
    });

    return finalCommentary;
  }

  switchCommentator(commentatorKey: string): boolean {
    if (COMMENTATORS[commentatorKey]) {
      this.activeCommentator = COMMENTATORS[commentatorKey];
      return true;
    }
    return false;
  }

  getCommentatorInfo(): Commentator {
    return this.activeCommentator;
  }

  getCommentaryHistory(): Array<{ timestamp: number; text: string; intensity: number }> {
    return [...this.commentaryHistory];
  }

  clearHistory(): void {
    this.commentaryHistory = [];
  }

  getRandomSignature(): string {
    return this.activeCommentator.signature;
  }

  getAllCommentators(): Commentator[] {
    return Object.values(COMMENTATORS);
  }
}
