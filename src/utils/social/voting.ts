/**
 * Voting & Governance System
 */

export interface VotingProposal {
  proposalId: string;
  title: string;
  description: string;
  createdBy: string;
  createdDate: number;
  endDate: number;
  votesFor: number;
  votesAgainst: number;
  voters: Set<string>;
  status: 'active' | 'passed' | 'failed';
}

export class VotingSystem {
  private proposals: Map<string, VotingProposal> = new Map();

  createProposal(
    createdBy: string,
    title: string,
    description: string,
    durationDays: number = 7
  ): VotingProposal {
    const endDate = Date.now() + durationDays * 24 * 60 * 60 * 1000;

    const proposal: VotingProposal = {
      proposalId: `prop_${Date.now()}`,
      title,
      description,
      createdBy,
      createdDate: Date.now(),
      endDate,
      votesFor: 0,
      votesAgainst: 0,
      voters: new Set(),
      status: 'active',
    };

    this.proposals.set(proposal.proposalId, proposal);
    return proposal;
  }

  vote(proposalId: string, userId: string, voteFor: boolean): boolean {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.voters.has(userId)) {
      return false;
    }

    if (voteFor) {
      proposal.votesFor++;
    } else {
      proposal.votesAgainst++;
    }

    proposal.voters.add(userId);
    this.updateProposalStatus(proposal);
    return true;
  }

  private updateProposalStatus(proposal: VotingProposal): void {
    if (Date.now() > proposal.endDate) {
      proposal.status = proposal.votesFor > proposal.votesAgainst ? 'passed' : 'failed';
    }
  }

  getProposal(proposalId: string): VotingProposal | undefined {
    return this.proposals.get(proposalId);
  }

  getActiveProposals(): VotingProposal[] {
    return Array.from(this.proposals.values()).filter((p) => p.status === 'active');
  }
}
