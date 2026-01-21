/**
 * Player Agent System - Negotiates contracts and represents players
 */

export interface PlayerAgent {
  agentId: string;
  name: string;
  reputation: number; // 0-100
  experienceYears: number;
  clientList: string[]; // player IDs
  commission: number; // percentage
}

export interface ContractNegotiation {
  negotiationId: string;
  playerId: string;
  agentId: string;
  teamId: string;
  baseSalary: number;
  proposedSalary: number;
  performanceBonus: number;
  releaseClause: number;
  contractLength: number;
  status: 'negotiating' | 'agreed' | 'failed';
  rounds: number;
}

export class PlayerAgentSystem {
  private agents: Map<string, PlayerAgent> = new Map();
  private negotiations: Map<string, ContractNegotiation> = new Map();

  createAgent(name: string, reputation: number, experienceYears: number, commission: number): PlayerAgent {
    const agent: PlayerAgent = {
      agentId: `agent_${Date.now()}`,
      name,
      reputation: Math.max(0, Math.min(100, reputation)),
      experienceYears,
      clientList: [],
      commission: Math.max(0, Math.min(0.2, commission)), // Max 20%
    };

    this.agents.set(agent.agentId, agent);
    return agent;
  }

  signPlayerToAgent(playerId: string, agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    agent.clientList.push(playerId);
    return true;
  }

  startNegotiation(
    playerId: string,
    agentId: string,
    teamId: string,
    baseSalary: number,
    contractLength: number
  ): ContractNegotiation | null {
    const agent = this.agents.get(agentId);
    if (!agent || !agent.clientList.includes(playerId)) {
      return null;
    }

    const negotiation: ContractNegotiation = {
      negotiationId: `neg_${Date.now()}`,
      playerId,
      agentId,
      teamId,
      baseSalary,
      proposedSalary: baseSalary * (1 + agent.reputation / 100),
      performanceBonus: baseSalary * 0.1,
      releaseClause: baseSalary * contractLength * 2,
      contractLength,
      status: 'negotiating',
      rounds: 0,
    };

    this.negotiations.set(negotiation.negotiationId, negotiation);
    return negotiation;
  }

  continueNegotiation(negotiationId: string, teamCounterOffer: number): boolean {
    const negotiation = this.negotiations.get(negotiationId);
    if (!negotiation || negotiation.status !== 'negotiating') {
      return false;
    }

    const agent = this.agents.get(negotiation.agentId);
    if (!agent) return false;

    negotiation.rounds++;

    // Move towards middle ground based on agent negotiation skill
    const agentInfluence = agent.reputation / 100;
    const newSalary = negotiation.proposedSalary - (negotiation.proposedSalary - teamCounterOffer) * (1 - agentInfluence);

    // Agreement reached if within 5%
    const diff = Math.abs(newSalary - teamCounterOffer) / teamCounterOffer;
    if (diff < 0.05) {
      negotiation.status = 'agreed';
      negotiation.proposedSalary = (newSalary + teamCounterOffer) / 2;
      agent.reputation = Math.min(100, agent.reputation + 5);
      return true;
    }

    // Negotiations fail after 5 rounds
    if (negotiation.rounds > 5) {
      negotiation.status = 'failed';
      agent.reputation = Math.max(0, agent.reputation - 3);
      return false;
    }

    negotiation.proposedSalary = newSalary;
    return false;
  }

  getAgentClients(agentId: string): string[] {
    const agent = this.agents.get(agentId);
    return agent ? [...agent.clientList] : [];
  }

  getPlayerAgent(playerId: string): PlayerAgent | undefined {
    for (const agent of this.agents.values()) {
      if (agent.clientList.includes(playerId)) {
        return agent;
      }
    }
    return undefined;
  }

  getAgentReputation(agentId: string): number {
    const agent = this.agents.get(agentId);
    return agent ? agent.reputation : 0;
  }

  improveAgentReputation(agentId: string, amount: number): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.reputation = Math.max(0, Math.min(100, agent.reputation + amount));
    }
  }

  getOngoingNegotiations(agentId: string): ContractNegotiation[] {
    return Array.from(this.negotiations.values()).filter(
      (n) => n.agentId === agentId && n.status === 'negotiating'
    );
  }

  getNegotiationHistory(playerId: string): ContractNegotiation[] {
    return Array.from(this.negotiations.values()).filter((n) => n.playerId === playerId && n.status !== 'negotiating');
  }
}
