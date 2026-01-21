import { parseAbi, Abi } from 'viem';

/**
 * Game Token ERC20 Contract ABI
 * Standard ERC20 with minting and burning capabilities
 */
export const GAME_TOKEN_ABI = parseAbi([
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function mint(address to, uint256 amount) external',
  'function burn(uint256 amount) external',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const);

/**
 * BassBall Player NFT Contract ABI (ERC721)
 * Player card NFTs for the game
 */
export const BASSBALL_NFT_ABI = parseAbi([
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function safeTransferFrom(address from, address to, uint256 tokenId) external',
  'function transferFrom(address from, address to, uint256 tokenId) external',
  'function approve(address to, uint256 tokenId) external',
  'function setApprovalForAll(address operator, bool approved) external',
  'function getApproved(uint256 tokenId) external view returns (address)',
  'function isApprovedForAll(address owner, address operator) external view returns (bool)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function totalSupply() external view returns (uint256)',
  'function tokenByIndex(uint256 index) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  'function mint(address to, string calldata uri) external returns (uint256)',
  'function burn(uint256 tokenId) external',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
] as const);

/**
 * Marketplace Contract ABI
 * Handles buying/selling items and NFTs
 */
export const MARKETPLACE_ABI = parseAbi([
  'function listItem(address token, uint256 tokenId, uint256 price) external',
  'function delistItem(address token, uint256 tokenId) external',
  'function buyItem(address token, uint256 tokenId) external payable',
  'function getListings(address token) external view returns (tuple(uint256 tokenId, address seller, uint256 price, bool active)[])',
  'function getListing(address token, uint256 tokenId) external view returns (tuple(uint256 tokenId, address seller, uint256 price, bool active))',
  'function withdrawListingRevenue() external',
  'function getSellerRevenue(address seller) external view returns (uint256)',
  'function setFeePercent(uint256 feePercent) external',
  'function getFeePercent() external view returns (uint256)',
  'event ItemListed(address indexed token, uint256 indexed tokenId, address indexed seller, uint256 price)',
  'event ItemDelisted(address indexed token, uint256 indexed tokenId)',
  'event ItemSold(address indexed token, uint256 indexed tokenId, address indexed buyer, uint256 price)',
] as const);

/**
 * Staking Contract ABI
 * For staking tokens and earning rewards
 */
export const STAKING_ABI = parseAbi([
  'function stake(uint256 amount) external',
  'function unstake(uint256 amount) external',
  'function getStaked(address user) external view returns (uint256)',
  'function claimRewards() external',
  'function getRewards(address user) external view returns (uint256)',
  'function getRewardRate() external view returns (uint256)',
  'function totalStaked() external view returns (uint256)',
  'event Staked(address indexed user, uint256 amount)',
  'event Unstaked(address indexed user, uint256 amount)',
  'event RewardsClaimed(address indexed user, uint256 amount)',
] as const);

/**
 * Tournament Contract ABI
 * Manages tournament brackets and rewards
 */
export const TOURNAMENT_ABI = parseAbi([
  'function createTournament(string calldata name, uint256 entryFee, uint256 maxParticipants) external returns (uint256)',
  'function getTournament(uint256 tournamentId) external view returns (tuple(string name, address organizer, uint256 entryFee, uint256 maxParticipants, uint256 participants, bool active))',
  'function joinTournament(uint256 tournamentId) external payable',
  'function submitResult(uint256 tournamentId, address winner, address loser) external',
  'function claimPrize(uint256 tournamentId) external',
  'function cancelTournament(uint256 tournamentId) external',
  'event TournamentCreated(uint256 indexed tournamentId, string name, address organizer)',
  'event PlayerJoined(uint256 indexed tournamentId, address player)',
  'event ResultSubmitted(uint256 indexed tournamentId, address winner, address loser)',
] as const);

export interface ContractConfig {
  address: string;
  abi: Abi;
  chainId: number;
}

export interface ContractReadCall {
  address: string;
  abi: Abi;
  functionName: string;
  args?: any[];
}

export interface ContractWriteCall extends ContractReadCall {
  value?: bigint;
  account?: string;
}
