/**
 * Advanced Commentary Engine - Contextual and dynamic commentary
 */

export interface CommentaryContext {
  eventType: string;
  playerName?: string;
  teamName?: string;
  score?: [number, number];
  time?: number;
  intensity?: number;
  momentum?: 'home' | 'away' | 'balanced';
  weather?: string;
}

export class CommentaryEngine {
  private contextStack: CommentaryContext[] = [];

  generateContextualCommentary(context: CommentaryContext, commentaryStyle: string): string {
    this.contextStack.push(context);

    let commentary = this.buildCommentary(context, commentaryStyle);

    // Adjust based on momentum
    if (context.momentum) {
      const momentumContext = context.momentum as 'home' | 'away' | 'balanced';
      commentary = this.addMomentumContext(commentary, momentumContext, commentaryStyle);
    }

    // Adjust based on time
    if (context.time !== undefined) {
      commentary = this.addTimeContext(commentary, context.time, commentaryStyle);
    }

    return commentary;
  }

  private buildCommentary(context: CommentaryContext, style: string): string {
    const { eventType, playerName, teamName, intensity } = context;

    const templates: Record<string, string[]> = {
      goal: [
        `${playerName} has scored! What a moment for ${teamName}!`,
        `It's in! ${playerName} finds the back of the net!`,
        `The ball is in the net! ${playerName} finishes brilliantly!`,
        `Sensational! ${playerName} puts ${teamName} ahead!`,
        `${playerName} does it! The crowd erupts!`,
      ],
      shot: [
        `${playerName} shoots... ${intensity && intensity > 0.7 ? 'and what a strike!' : 'onto target'}!`,
        `A strike from ${playerName}... the keeper had to be alert!`,
        `${playerName} has a go... testing the goalkeeper!`,
      ],
      tackle: [
        `${playerName} makes a vital interception!`,
        `Excellent defensive work from ${playerName}!`,
        `${playerName} reads the play perfectly!`,
      ],
      pass: [
        `Beautiful pass from ${playerName}!`,
        `${playerName} spreads it wide!`,
        `The vision of ${playerName}!`,
      ],
      injury: [
        `${playerName} goes down and there could be an injury here!`,
        `${playerName} is in trouble! Medical staff are attending!`,
      ],
    };

    const commentary = templates[eventType];
    if (!commentary) return `${playerName || teamName} in action!`;

    return commentary[Math.floor(Math.random() * commentary.length)];
  }

  private addMomentumContext(commentary: string, momentum: string, style: string): string {
    const momentumTexts: Record<string, string[]> = {
      home: [
        ' The home team is on top!',
        ' Momentum is building for the home side!',
        ' They are dominating this spell!',
      ],
      away: [
        ' The visitors are in the ascendancy!',
        ' Away team pressing hard!',
        ' They are creating the opportunities!',
      ],
      balanced: [
        ' It is very evenly matched!',
        ' Both sides are competing fiercely!',
        ' The intensity is high!',
      ],
    };

    const texts = momentumTexts[momentum] || [];
    if (texts.length > 0) {
      return commentary + texts[Math.floor(Math.random() * texts.length)];
    }
    return commentary;
  }

  private addTimeContext(commentary: string, time: number, style: string): string {
    if (time > 85 && time < 90) {
      return commentary + ' Late drama here!';
    } else if (time >= 90) {
      return commentary + ' In injury time!';
    } else if (time < 5) {
      return commentary + ' Early in the match!';
    } else if (time > 45 && time < 47) {
      return commentary + ' Just after the interval!';
    }
    return commentary;
  }

  getContextStack(): CommentaryContext[] {
    return [...this.contextStack];
  }

  clearContextStack(): void {
    this.contextStack = [];
  }
}
