import { Player, Team } from '@/types/player';

export interface PlayerRepository {
  findById(id: string): Player | null;
  findByName(name: string): Player[];
  findByTeam(teamId: string): Player[];
  create(player: Player): void;
  update(id: string, data: Partial<Player>): void;
  delete(id: string): void;
}

export class InMemoryPlayerRepository implements PlayerRepository {
  private players: Map<string, Player> = new Map();

  findById(id: string): Player | null {
    return this.players.get(id) || null;
  }

  findByName(name: string): Player[] {
    return Array.from(this.players.values()).filter(p => 
      p.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  findByTeam(teamId: string): Player[] {
    return Array.from(this.players.values()).filter(p => p.id.startsWith(teamId));
  }

  create(player: Player): void {
    this.players.set(player.id, player);
  }

  update(id: string, data: Partial<Player>): void {
    const player = this.players.get(id);
    if (player) {
      this.players.set(id, { ...player, ...data });
    }
  }

  delete(id: string): void {
    this.players.delete(id);
  }
}
