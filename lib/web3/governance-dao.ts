/**
 * Bass Ball Governance & DAO Support
 * Decentralized platform management with governance tokens and voting
 * 
 * Features:
 * - Governance token management (OP, ARB, AAVE)
 * - Proposal creation and tracking
 * - Vote delegation and voting
 * - Snapshot integration for off-chain voting
 * - DAO treasury management
 */

import { formatUnits, parseUnits } from 'viem';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface GovernanceToken {
  id: string;
  symbol: string;
  name: string;
  contractAddress: string;
  decimals: number;
  chainId: number;
  totalSupply: number;
  circulating: number;
  imageUrl: string;
  description: string;
  socialLinks: {
    website?: string;
    twitter?: string;
    discord?: string;
    github?: string;
  };
}

export interface GovernanceTokenHolder {
  address: string;
  tokens: Record<string, number>; // tokenId -> balance
  votingPower: number; // Total voting power (can be delegated)
  delegatedTo?: string; // Address this voter delegates to
  delegatedFrom: string[]; // Addresses delegating to this address
  proposalsCrated: number;
  votesParticipated: number;
  lastActivity: number;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  ipfsHash: string;
  proposer: string;
  createdAt: number;
  startBlock: number;
  endBlock: number;
  currentBlock: number;
  status: 'pending' | 'active' | 'cancelled' | 'succeeded' | 'defeated' | 'executed' | 'expired';
  votingType: 'binary' | 'ranked-choice' | 'quadratic';
  proposalType: 'text' | 'executable' | 'economic' | 'operational';
  quorumRequired: number;
  supportRequired: number;
  actions: ProposalAction[];
  votes: ProposalVote[];
  votingStats: VotingStats;
  snapshotId?: string;
  discussionLink?: string;
}

export interface ProposalAction {
  id: string;
  target: string; // Contract address
  functionSignature: string;
  params: string[];
  value: number;
  description: string;
}

export interface ProposalVote {
  id: string;
  proposalId: string;
  voter: string;
  votingPower: number;
  choice: number; // 0=abstain, 1=against, 2=for (for binary)
  reason?: string;
  timestamp: number;
  blockNumber: number;
}

export interface VotingStats {
  totalVotes: number;
  votingPercentage: number;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  forPercentage: number;
  againstPercentage: number;
  leadingVotes: number;
  timeRemaining: number;
}

export interface DelegationEvent {
  id: string;
  delegator: string;
  delegatee: string;
  votingPower: number;
  tokenId: string;
  timestamp: number;
  blockNumber: number;
  txHash: string;
}

export interface DAOTreasuryAccount {
  address: string;
  name: string;
  purpose: string;
  balance: number; // USDC or other token
  tokenAddress: string;
  authorized: boolean;
  multisigAddress?: string;
  requiredSignatures?: number;
  signers: string[];
}

export interface DAOTreasuryTransaction {
  id: string;
  treasuryId: string;
  amount: number;
  tokenAddress: string;
  recipient: string;
  purpose: string;
  status: 'pending' | 'approved' | 'executed' | 'rejected' | 'cancelled';
  approvals: string[]; // Signer addresses
  createdAt: number;
  executedAt?: number;
  txHash?: string;
}

export interface SnapshotProposal {
  id: string;
  title: string;
  body: string;
  choices: string[];
  start: number;
  end: number;
  snapshot: number;
  state: 'pending' | 'active' | 'closed';
  author: string;
  scores: number[];
  scores_by_strategy: number[][];
  votes: number;
  link: string;
}

export interface GovernanceMetrics {
  totalProposals: number;
  activeProposals: number;
  successfulProposals: number;
  failedProposals: number;
  averageParticipation: number;
  uniqueVoters: number;
  averageQuorum: number;
  treasuryBalance: number;
  governanceTokenDistribution: Record<string, number>;
}

export interface DAOMember {
  address: string;
  joinDate: number;
  contributionLevel: 'bronze' | 'silver' | 'gold' | 'diamond' | 'founder';
  governance: {
    tokensHeld: Record<string, number>;
    votingPower: number;
    delegatedFrom: number;
    proposalsCreated: number;
    votesParticipated: number;
    participationRate: number;
  };
  contributions: {
    proposalsCreated: number;
    votesParticipated: number;
    treasuryContributions: number;
    bountyCompleted: number;
  };
}

// ============================================================================
// GOVERNANCE TOKEN DATA
// ============================================================================

export const GOVERNANCE_TOKENS: Record<string, GovernanceToken> = {
  OP: {
    id: 'optimism',
    symbol: 'OP',
    name: 'Optimism',
    contractAddress: '0x4200000000000000000000000000000000000042',
    decimals: 18,
    chainId: 10,
    totalSupply: 4294967296,
    circulating: 2000000000,
    imageUrl: '🔴',
    description: 'Optimism governance token for layer 2 protocol decisions',
    socialLinks: {
      website: 'optimism.io',
      twitter: '@optimismFnd',
      discord: 'optimism',
      github: 'ethereum-optimism',
    },
  },
  ARB: {
    id: 'arbitrum',
    symbol: 'ARB',
    name: 'Arbitrum',
    contractAddress: '0x912CE59144191c1204E64559FE8253a0e108FF4e',
    decimals: 18,
    chainId: 42161,
    totalSupply: 10000000000,
    circulating: 1260000000,
    imageUrl: '🔵',
    description: 'Arbitrum governance token for layer 2 protocol governance',
    socialLinks: {
      website: 'arbitrum.io',
      twitter: '@arbitrum',
      discord: 'arbitrum',
      github: 'offchainlabs',
    },
  },
  AAVE: {
    id: 'aave',
    symbol: 'AAVE',
    name: 'Aave',
    contractAddress: '0x7Fc66500c84A76Ad7e9c93437E434122A1f9AcDe',
    decimals: 18,
    chainId: 1,
    totalSupply: 16000000,
    circulating: 14600000,
    imageUrl: '🟣',
    description: 'Aave governance token for DeFi protocol governance',
    socialLinks: {
      website: 'aave.com',
      twitter: '@aaveaave',
      discord: 'aave',
      github: 'aavegotchi/aave-governance',
    },
  },
};

// ============================================================================
// GOVERNANCE & VOTING SYSTEM
// ============================================================================

/**
 * Get governance token details
 */
export const getGovernanceToken = (tokenSymbol: string): GovernanceToken | undefined => {
  return GOVERNANCE_TOKENS[tokenSymbol];
};

/**
 * Calculate voting power from token holdings
 */
export const calculateVotingPower = (
  holdings: Record<string, number>,
  weights?: Record<string, number>
): number => {
  let totalPower = 0;

  Object.entries(holdings).forEach(([tokenSymbol, amount]) => {
    const token = GOVERNANCE_TOKENS[tokenSymbol];
    if (token) {
      const weight = weights?.[tokenSymbol] || 1;
      totalPower += amount * weight;
    }
  });

  return totalPower;
};

/**
 * Create a new proposal
 */
export const createProposal = (
  title: string,
  description: string,
  proposer: string,
  proposalType: 'text' | 'executable' | 'economic' | 'operational' = 'text',
  actions: ProposalAction[] = []
): Proposal => {
  return {
    id: `prop-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    description,
    ipfsHash: `Qm${Math.random().toString(36).slice(2, 46)}`,
    proposer,
    createdAt: Date.now(),
    startBlock: Math.floor(Date.now() / 12000), // Approximate block
    endBlock: Math.floor(Date.now() / 12000) + 50400, // ~7 days
    currentBlock: Math.floor(Date.now() / 12000),
    status: 'pending',
    votingType: proposalType === 'executable' ? 'binary' : 'binary',
    proposalType,
    quorumRequired: 0.4, // 40%
    supportRequired: 0.5, // 50%
    actions,
    votes: [],
    votingStats: {
      totalVotes: 0,
      votingPercentage: 0,
      forVotes: 0,
      againstVotes: 0,
      abstainVotes: 0,
      forPercentage: 0,
      againstPercentage: 0,
      leadingVotes: 0,
      timeRemaining: 7 * 24 * 60 * 60 * 1000,
    },
  };
};

/**
 * Cast a vote on a proposal
 */
export const castVote = (
  proposal: Proposal,
  voter: string,
  votingPower: number,
  choice: number, // 0=abstain, 1=against, 2=for
  reason?: string
): { proposal: Proposal; vote: ProposalVote } => {
  // Check if already voted
  const existingVote = proposal.votes.find(v => v.voter === voter);
  if (existingVote) {
    throw new Error('User has already voted on this proposal');
  }

  const vote: ProposalVote = {
    id: `vote-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    proposalId: proposal.id,
    voter,
    votingPower,
    choice,
    reason,
    timestamp: Date.now(),
    blockNumber: Math.floor(Date.now() / 12000),
  };

  // Update proposal stats
  const updatedProposal = { ...proposal };
  updatedProposal.votes.push(vote);

  const stats = updatedProposal.votingStats;
  stats.totalVotes += votingPower;

  if (choice === 1) stats.againstVotes += votingPower;
  else if (choice === 2) stats.forVotes += votingPower;
  else stats.abstainVotes += votingPower;

  const totalVoted = stats.forVotes + stats.againstVotes;
  if (totalVoted > 0) {
    stats.forPercentage = (stats.forVotes / totalVoted) * 100;
    stats.againstPercentage = (stats.againstVotes / totalVoted) * 100;
    stats.leadingVotes = Math.max(stats.forVotes, stats.againstVotes);
  }

  stats.votingPercentage = (stats.totalVotes / 100000) * 100; // Assume 100k total

  return { proposal: updatedProposal, vote };
};

/**
 * Get proposal status
 */
export const getProposalStatus = (
  proposal: Proposal,
  totalVotingPower: number
): Proposal['status'] => {
  const now = Date.now();
  const blockTime = 12000; // 12 seconds per block

  // Check if expired
  if (now > proposal.startBlock * blockTime + (30 * 24 * 60 * 60 * 1000)) {
    if (proposal.status === 'active') return 'expired';
  }

  // Check if voting period ended
  if (now > proposal.endBlock * blockTime) {
    if (proposal.status === 'pending' || proposal.status === 'active') {
      // Determine if passed
      const totalVotes = proposal.votingStats.totalVotes;
      const quorumMet = totalVotes >= (totalVotingPower * proposal.quorumRequired);
      const supportMet = proposal.votingStats.forPercentage >= (proposal.supportRequired * 100);

      if (quorumMet && supportMet) return 'succeeded';
      else return 'defeated';
    }
  }

  // Check if voting started
  if (now > proposal.startBlock * blockTime) {
    if (proposal.status === 'pending') return 'active';
  }

  return proposal.status;
};

/**
 * Get voting participation rate
 */
export const getVotingParticipation = (proposal: Proposal, totalVotingPower: number): number => {
  return (proposal.votingStats.totalVotes / totalVotingPower) * 100;
};

// ============================================================================
// VOTE DELEGATION
// ============================================================================

/**
 * Delegate voting power
 */
export const delegateVotingPower = (
  delegator: string,
  delegatee: string,
  votingPower: number,
  tokenId: string
): DelegationEvent => {
  if (delegator === delegatee) {
    throw new Error('Cannot delegate to yourself');
  }

  return {
    id: `deleg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    delegator,
    delegatee,
    votingPower,
    tokenId,
    timestamp: Date.now(),
    blockNumber: Math.floor(Date.now() / 12000),
    txHash: `0x${Math.random().toString(16).slice(2)}`,
  };
};

/**
 * Revoke delegation
 */
export const revokeDelegation = (
  delegator: string,
  delegatee: string,
  tokenId: string
): DelegationEvent => {
  return {
    id: `deleg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    delegator,
    delegatee,
    votingPower: 0, // Revoke
    tokenId,
    timestamp: Date.now(),
    blockNumber: Math.floor(Date.now() / 12000),
    txHash: `0x${Math.random().toString(16).slice(2)}`,
  };
};

/**
 * Get total delegated power
 */
export const getTotalDelegatedPower = (
  delegatee: string,
  delegations: DelegationEvent[]
): number => {
  return delegations
    .filter(d => d.delegatee === delegatee && d.votingPower > 0)
    .reduce((sum, d) => sum + d.votingPower, 0);
};

/**
 * Get delegation chain
 */
export const getDelegationChain = (
  address: string,
  delegations: DelegationEvent[],
  visited: Set<string> = new Set()
): string[] => {
  if (visited.has(address)) return [];
  visited.add(address);

  const delegatedTo = delegations.find(d => d.delegator === address && d.votingPower > 0);
  if (!delegatedTo) return [address];

  return [address, ...getDelegationChain(delegatedTo.delegatee, delegations, visited)];
};

// ============================================================================
// DAO TREASURY
// ============================================================================

/**
 * Create treasury account
 */
export const createTreasuryAccount = (
  name: string,
  purpose: string,
  tokenAddress: string,
  multisigAddress?: string,
  signers: string[] = []
): DAOTreasuryAccount => {
  return {
    address: `0x${Math.random().toString(16).slice(2)}`,
    name,
    purpose,
    balance: 0,
    tokenAddress,
    authorized: false,
    multisigAddress,
    requiredSignatures: Math.ceil((signers.length + 1) / 2), // Majority
    signers,
  };
};

/**
 * Propose treasury transaction
 */
export const proposeTreasuryTransaction = (
  treasuryId: string,
  amount: number,
  tokenAddress: string,
  recipient: string,
  purpose: string
): DAOTreasuryTransaction => {
  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    treasuryId,
    amount,
    tokenAddress,
    recipient,
    purpose,
    status: 'pending',
    approvals: [],
    createdAt: Date.now(),
  };
};

/**
 * Approve treasury transaction
 */
export const approveTreasuryTransaction = (
  transaction: DAOTreasuryTransaction,
  signer: string
): DAOTreasuryTransaction => {
  if (transaction.approvals.includes(signer)) {
    throw new Error('Already approved by this signer');
  }

  return {
    ...transaction,
    approvals: [...transaction.approvals, signer],
  };
};

/**
 * Execute treasury transaction
 */
export const executeTreasuryTransaction = (
  transaction: DAOTreasuryTransaction,
  requiredSignatures: number
): DAOTreasuryTransaction => {
  if (transaction.approvals.length < requiredSignatures) {
    throw new Error(`Need ${requiredSignatures} approvals, have ${transaction.approvals.length}`);
  }

  return {
    ...transaction,
    status: 'executed',
    executedAt: Date.now(),
    txHash: `0x${Math.random().toString(16).slice(2)}`,
  };
};

/**
 * Get treasury balance
 */
export const getTreasuryBalance = (transactions: DAOTreasuryTransaction[]): number => {
  return transactions
    .filter(t => t.status === 'executed')
    .reduce((balance, t) => {
      // Deposits (negative amounts) add to balance
      return balance + t.amount;
    }, 0);
};

// ============================================================================
// SNAPSHOT INTEGRATION
// ============================================================================

/**
 * Create snapshot proposal
 */
export const createSnapshotProposal = (
  title: string,
  body: string,
  choices: string[],
  proposer: string,
  startTime: number,
  endTime: number
): SnapshotProposal => {
  return {
    id: `snapshot-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    body,
    choices,
    start: Math.floor(startTime / 1000),
    end: Math.floor(endTime / 1000),
    snapshot: Math.floor(Date.now() / 1000),
    state: 'pending',
    author: proposer,
    scores: choices.map(() => 0),
    scores_by_strategy: [],
    votes: 0,
    link: `snapshot.org/#/proposal/${Math.random().toString(36).slice(2, 10)}`,
  };
};

/**
 * Vote on snapshot proposal
 */
export const voteOnSnapshot = (
  proposal: SnapshotProposal,
  choice: number,
  votingPower: number
): SnapshotProposal => {
  const updated = { ...proposal };
  updated.scores[choice] = (updated.scores[choice] || 0) + votingPower;
  updated.votes += 1;
  updated.state = 'active';
  return updated;
};

/**
 * Get snapshot proposal winner
 */
export const getSnapshotWinner = (proposal: SnapshotProposal): { choice: string; votes: number } => {
  const maxVotes = Math.max(...proposal.scores);
  const winningIndex = proposal.scores.indexOf(maxVotes);
  return {
    choice: proposal.choices[winningIndex],
    votes: maxVotes,
  };
};

// ============================================================================
// GOVERNANCE ANALYTICS
// ============================================================================

/**
 * Calculate governance metrics
 */
export const getGovernanceMetrics = (
  proposals: Proposal[],
  holders: GovernanceTokenHolder[],
  treasuryBalance: number
): GovernanceMetrics => {
  const successfulProposals = proposals.filter(p => p.status === 'succeeded').length;
  const failedProposals = proposals.filter(p => p.status === 'defeated').length;
  const activeProposals = proposals.filter(p => p.status === 'active').length;

  const allVotes = proposals.flatMap(p => p.votes);
  const uniqueVoters = new Set(allVotes.map(v => v.voter)).size;

  const avgParticipation = proposals.length > 0
    ? proposals.reduce((sum, p) => sum + p.votingStats.votingPercentage, 0) / proposals.length
    : 0;

  const avgQuorum = proposals.length > 0
    ? proposals.reduce((sum, p) => sum + (p.votingStats.totalVotes / 100000), 0) / proposals.length
    : 0;

  const tokenDistribution: Record<string, number> = {};
  Object.values(GOVERNANCE_TOKENS).forEach(token => {
    tokenDistribution[token.symbol] = token.circulating;
  });

  return {
    totalProposals: proposals.length,
    activeProposals,
    successfulProposals,
    failedProposals,
    averageParticipation: avgParticipation,
    uniqueVoters,
    averageQuorum: avgQuorum * 100,
    treasuryBalance,
    governanceTokenDistribution: tokenDistribution,
  };
};

/**
 * Analyze proposal voting patterns
 */
export const analyzeVotingPattern = (proposal: Proposal): {
  consensus: number;
  engagement: number;
  sentiment: 'strongly-for' | 'for' | 'neutral' | 'against' | 'strongly-against';
} => {
  const stats = proposal.votingStats;
  const totalVotes = stats.forVotes + stats.againstVotes;

  let consensus = 0;
  if (totalVotes > 0) {
    const maxVotes = Math.max(stats.forVotes, stats.againstVotes);
    consensus = (maxVotes / totalVotes) * 100;
  }

  const engagement = proposal.votingStats.votingPercentage;

  let sentiment: 'strongly-for' | 'for' | 'neutral' | 'against' | 'strongly-against' = 'neutral';
  if (stats.forPercentage > 75) sentiment = 'strongly-for';
  else if (stats.forPercentage > 60) sentiment = 'for';
  else if (stats.againstPercentage > 75) sentiment = 'strongly-against';
  else if (stats.againstPercentage > 60) sentiment = 'against';

  return { consensus, engagement, sentiment };
};

/**
 * Predict proposal outcome
 */
export const predictProposalOutcome = (
  proposal: Proposal,
  timeRemaining: number,
  totalVotingPower: number
): {
  passProability: number;
  quorumLikelihood: number;
  recommendation: string;
} => {
  const stats = proposal.votingStats;
  const currentParticipation = stats.totalVotes / totalVotingPower;
  const quorumNeeded = proposal.quorumRequired;

  // Calculate pass probability
  const supportPercentage = stats.forPercentage / 100;
  const passProability = supportPercentage >= proposal.supportRequired ? 0.95 : 0.2;

  // Calculate quorum likelihood
  const timeProgress = (7 * 24 * 60 * 60 * 1000 - timeRemaining) / (7 * 24 * 60 * 60 * 1000);
  const expectedParticipation = currentParticipation / Math.max(timeProgress, 0.1);
  const quorumLikelihood = Math.min(expectedParticipation / quorumNeeded, 1);

  let recommendation = 'Vote based on merits';
  if (passProability > 0.8 && quorumLikelihood > 0.8) recommendation = 'Likely to pass';
  else if (passProability < 0.3 && quorumLikelihood > 0.8) recommendation = 'Likely to fail';
  else if (quorumLikelihood < 0.5) recommendation = 'May fail due to low participation';

  return { passProability, quorumLikelihood, recommendation };
};

/**
 * Get DAO member profile
 */
export const getDAOMemberProfile = (
  address: string,
  holdings: Record<string, number>,
  delegations: DelegationEvent[],
  proposals: Proposal[],
  votes: ProposalVote[]
): DAOMember => {
  const votingPower = calculateVotingPower(holdings);
  const delegatedFromTotal = getTotalDelegatedPower(address, delegations);
  const memberProposals = proposals.filter(p => p.proposer === address);
  const memberVotes = votes.filter(v => v.voter === address);

  const totalMatches = memberVotes.length;
  const participationRate = totalMatches > 0 ? (memberVotes.length / Math.max(proposals.length, 1)) * 100 : 0;

  let contributionLevel: 'bronze' | 'silver' | 'gold' | 'diamond' | 'founder' = 'bronze';
  if (votingPower > 1000000) contributionLevel = 'founder';
  else if (votingPower > 500000) contributionLevel = 'diamond';
  else if (votingPower > 100000) contributionLevel = 'gold';
  else if (votingPower > 10000) contributionLevel = 'silver';

  return {
    address,
    joinDate: Date.now(),
    contributionLevel,
    governance: {
      tokensHeld: holdings,
      votingPower,
      delegatedFrom: delegations.filter(d => d.delegatee === address && d.votingPower > 0).length,
      proposalsCreated: memberProposals.length,
      votesParticipated: memberVotes.length,
      participationRate,
    },
    contributions: {
      proposalsCreated: memberProposals.length,
      votesParticipated: memberVotes.length,
      treasuryContributions: 0,
      bountyCompleted: 0,
    },
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format voting power
 */
export const formatVotingPower = (power: number): string => {
  if (power >= 1000000) return `${(power / 1000000).toFixed(2)}M`;
  if (power >= 1000) return `${(power / 1000).toFixed(2)}K`;
  return power.toFixed(2);
};

/**
 * Get proposal status color
 */
export const getProposalStatusColor = (status: Proposal['status']): string => {
  const colors: Record<Proposal['status'], string> = {
    pending: '#95a5a6',
    active: '#3498db',
    cancelled: '#e74c3c',
    succeeded: '#27ae60',
    defeated: '#e74c3c',
    executed: '#9b59b6',
    expired: '#f39c12',
  };
  return colors[status];
};

/**
 * Get voting choice name
 */
export const getVotingChoiceName = (choice: number): string => {
  const names = {
    0: 'Abstain',
    1: 'Against',
    2: 'For',
  };
  return names[choice as keyof typeof names] || 'Unknown';
};

/**
 * Calculate time remaining
 */
export const getTimeRemaining = (endBlock: number): { days: number; hours: number; minutes: number } => {
  const blockTime = 12000; // 12 seconds per block
  const endTime = endBlock * blockTime;
  const now = Date.now();
  const remaining = Math.max(0, endTime - now);

  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  return { days, hours, minutes };
};

/**
 * Export governance state for audit
 */
export const exportGovernanceState = (
  proposals: Proposal[],
  holders: GovernanceTokenHolder[],
  delegations: DelegationEvent[]
): string => {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    summary: {
      totalProposals: proposals.length,
      totalHolders: holders.length,
      totalDelegations: delegations.length,
    },
    proposals: proposals.map(p => ({
      id: p.id,
      title: p.title,
      status: p.status,
      votingStats: p.votingStats,
    })),
    governance: {
      totalVotingPower: holders.reduce((sum, h) => sum + h.votingPower, 0),
      uniqueVoters: new Set(delegations.map(d => d.delegator)).size,
    },
  }, null, 2);
};
