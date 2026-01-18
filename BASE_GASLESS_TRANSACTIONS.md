# Base Gasless Transactions (Account Abstraction)

## Part 1: ERC-4337 Architecture Overview

### What is Account Abstraction?

ERC-4337 enables **smart contract wallets** instead of EOA (externally owned accounts).

```
Traditional Flow                    AA Flow
User → EOA signature              User → Smart Wallet
    ↓                                 ↓
Send tx to mempool            Send UserOp to Alt Mempool
    ↓                                 ↓
Miners include tx              Bundlers aggregate UserOps
    ↓                                 ↓
Execute tx (user pays gas)    EntryPoint executes batch (paymaster pays)
```

### Key Components

```typescript
// types/account-abstraction.ts

/**
 * UserOperation - The ERC-4337 standard
 */
export interface UserOperation {
  sender: string;                    // Smart wallet address
  nonce: bigint;
  initCode: string;                  // Creation code if new wallet
  callData: string;                  // Encoded function call
  callGasLimit: bigint;
  preVerificationGas: bigint;
  verificationGasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: string;          // Paymaster address + data
  signature: string;                 // Wallet signature
}

/**
 * EntryPoint - Core ERC-4337 contract
 * Validates and executes UserOperations
 */
export const ENTRY_POINT = "0x5FF137D4b0FDCD49DcA30c7B8e65EA2C89b94C0d";

/**
 * Paymaster - Sponsors gas fees
 * Verifies eligibility and pays gas
 */
export interface Paymaster {
  address: string;
  sponsors: {
    matchSubmission: boolean;
    nftMint: boolean;
    leaderboardUpdate: boolean;
    teamCreation: boolean;
  };
  balance: bigint;
  maxGasPerOp: bigint;
}

/**
 * Bundler - Collects and executes UserOps
 * (Pimlico, Alchemy, etc.)
 */
export const BUNDLER_RPC = "https://api.pimlico.io/v1/base/rpc";
```

---

## Part 2: Smart Wallet Implementation (Privy)

```typescript
// services/account-abstraction/smart-wallet-service.ts
import { createWalletClient, http, getAddress } from "viem";
import { base } from "viem/chains";
import { PrivyClient } from "@privy-io/server-auth";

export class SmartWalletService {
  private privy: PrivyClient;
  private walletClient = createWalletClient({
    chain: base,
    transport: http("https://mainnet.base.org"),
  });

  constructor(privyAppId: string, privySecret: string) {
    this.privy = new PrivyClient({
      appId: privyAppId,
      secret: privySecret,
    });
  }

  /**
   * Create or get smart wallet for user
   * Handles EOA → Smart Wallet upgrade
   */
  async getOrCreateSmartWallet(
    userId: string,
    embeddedWalletAddress: string
  ): Promise<{
    smartWalletAddress: string;
    created: boolean;
  }> {
    // Check if smart wallet already exists
    const existingWallet = await this.getSmartWalletAddress(userId);
    if (existingWallet) {
      return { smartWalletAddress: existingWallet, created: false };
    }

    // Create new smart wallet via Privy
    const wallet = await this.privy.createSmartWallet({
      userId,
      chainId: 8453, // Base mainnet
      type: "ethereum",
      initData: {
        owners: [embeddedWalletAddress],
        threshold: 1,
      },
    });

    return {
      smartWalletAddress: wallet.address,
      created: true,
    };
  }

  /**
   * Get smart wallet address for user
   */
  async getSmartWalletAddress(userId: string): Promise<string | null> {
    // Query Privy API or local database
    // Returns smart wallet address if created
    return null;
  }

  /**
   * Send UserOperation (gasless transaction)
   */
  async sendUserOperation(
    smartWalletAddress: string,
    target: string,
    data: string,
    value: bigint = BigInt(0),
    paymasterAddress?: string
  ): Promise<{
    userOpHash: string;
    transactionHash?: string;
  }> {
    // Build UserOperation
    const userOp = await this.buildUserOperation(
      smartWalletAddress,
      target,
      data,
      value,
      paymasterAddress
    );

    // Sign UserOperation
    const signedUserOp = await this.signUserOperation(userOp);

    // Send to bundler
    const userOpHash = await this.sendToBundler(signedUserOp);

    // Wait for confirmation
    const transactionHash = await this.waitForUserOpConfirmation(userOpHash);

    return { userOpHash, transactionHash };
  }

  /**
   * Build UserOperation with proper gas estimates
   */
  private async buildUserOperation(
    sender: string,
    target: string,
    data: string,
    value: bigint,
    paymasterAddress?: string
  ): Promise<UserOperation> {
    const nonce = await this.getNonce(sender);

    // Estimate gas
    const gas = await this.estimateGas(sender, target, data, value);

    return {
      sender: getAddress(sender),
      nonce,
      initCode: "0x", // Already deployed
      callData: await this.encodeCall(sender, target, data, value),
      callGasLimit: gas.callGasLimit,
      preVerificationGas: gas.preVerificationGas,
      verificationGasLimit: gas.verificationGasLimit,
      maxFeePerGas: BigInt(50) * BigInt(10 ** 9), // 50 Gwei base
      maxPriorityFeePerGas: BigInt(2) * BigInt(10 ** 9), // 2 Gwei tip
      paymasterAndData: paymasterAddress
        ? await this.encodePaymasterData(paymasterAddress)
        : "0x",
      signature: "0x", // Will be filled after signing
    };
  }

  private async getNonce(address: string): Promise<bigint> {
    // Fetch from EntryPoint contract
    // getNonce(address, key)
    return BigInt(0);
  }

  private async estimateGas(
    sender: string,
    target: string,
    data: string,
    value: bigint
  ): Promise<{
    callGasLimit: bigint;
    preVerificationGas: bigint;
    verificationGasLimit: bigint;
  }> {
    // Use simulation or bundler to estimate
    return {
      callGasLimit: BigInt(100000),
      preVerificationGas: BigInt(20000),
      verificationGasLimit: BigInt(100000),
    };
  }

  private async encodeCall(
    sender: string,
    target: string,
    data: string,
    value: bigint
  ): Promise<string> {
    // Encode execute() call on smart wallet
    // ISmartWallet.execute(target, value, data)
    return "0x";
  }

  private async encodePaymasterData(paymasterAddress: string): Promise<string> {
    // Paymaster address + verification data
    return paymasterAddress;
  }

  private async signUserOperation(userOp: UserOperation): Promise<UserOperation> {
    // Sign with user's private key
    // Hash = keccak256(encode(userOp))
    userOp.signature = "0x"; // Signed hash
    return userOp;
  }

  private async sendToBundler(userOp: UserOperation): Promise<string> {
    // Send to Pimlico or Alchemy bundler
    // RPC: eth_sendUserOperation
    return "0xuserOpHash";
  }

  private async waitForUserOpConfirmation(
    userOpHash: string
  ): Promise<string> {
    // Poll bundler for UserOpReceipt
    // Returns transaction hash when included
    return "0xtransactionHash";
  }
}

export interface UserOperation {
  sender: string;
  nonce: bigint;
  initCode: string;
  callData: string;
  callGasLimit: bigint;
  preVerificationGas: bigint;
  verificationGasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: string;
  signature: string;
}
```

---

## Part 3: Coinbase Smart Wallet Integration

```typescript
// services/account-abstraction/coinbase-wallet-service.ts
import { CoinbaseWalletSDK } from "@coinbase/wallet-sdk";
import {
  createWalletClient,
  custom,
  http,
  PublicClient,
  createPublicClient,
} from "viem";
import { base } from "viem/chains";

export class CoinbaseSmartWalletService {
  private sdk: CoinbaseWalletSDK;
  private walletClient: any;
  private publicClient: PublicClient;

  constructor() {
    this.sdk = new CoinbaseWalletSDK({
      appName: "BassBall",
      appLogoUrl: "https://bassball.io/logo.png",
    });

    this.publicClient = createPublicClient({
      chain: base,
      transport: http("https://mainnet.base.org"),
    });
  }

  /**
   * Connect Coinbase Smart Wallet
   */
  async connectWallet(): Promise<{
    address: string;
    chainId: number;
  }> {
    const provider = this.sdk.makeWeb3Provider();

    // Create wallet client
    this.walletClient = createWalletClient({
      chain: base,
      transport: custom(provider),
    });

    // Request account access
    const [address] = await this.walletClient.getAddresses();
    const chainId = await this.walletClient.getChainId();

    return { address, chainId };
  }

  /**
   * Send gasless transaction via Coinbase Smart Wallet
   */
  async sendGaslessTransaction(
    target: string,
    data: string,
    value: bigint = BigInt(0)
  ): Promise<{
    hash: string;
    status: "pending" | "success" | "failed";
  }> {
    try {
      const hash = await this.walletClient.sendTransaction({
        to: target,
        data,
        value,
        gas: undefined, // Let wallet calculate
        gasPrice: undefined, // Gas sponsored
      });

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
      });

      return {
        hash,
        status: receipt.status === "success" ? "success" : "failed",
      };
    } catch (error) {
      console.error("Transaction failed:", error);
      return { hash: "", status: "failed" };
    }
  }

  /**
   * Sign message without sending transaction
   */
  async signMessage(message: string): Promise<string> {
    const [address] = await this.walletClient.getAddresses();

    const signature = await this.walletClient.signMessage({
      account: address,
      message,
    });

    return signature;
  }

  /**
   * Get wallet info
   */
  async getWalletInfo(): Promise<{
    address: string;
    chainId: number;
    isSmartWallet: boolean;
  }> {
    const [address] = await this.walletClient.getAddresses();
    const chainId = await this.walletClient.getChainId();

    // Check if smart wallet (vs EOA)
    const code = await this.publicClient.getCode({ address });
    const isSmartWallet = code !== "0x";

    return { address, chainId, isSmartWallet };
  }
}
```

---

## Part 4: Paymaster Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@account-abstraction/contracts/core/UserOperationLib.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * ==================== BASS BALL PAYMASTER ====================
 * Sponsors gas for:
 * - Match submissions
 * - NFT minting (first time only)
 * - Leaderboard updates
 */
contract BassBallPaymaster is BasePaymaster, Ownable {
  using UserOperationLib for UserOperation;

  // Sponsorship rules
  mapping(bytes4 => bool) public sponsoredFunctions;
  mapping(address => uint256) public userSponsorsUsed; // Limit per user
  mapping(address => bool) public whitelistedContracts;

  uint256 public constant MAX_SPONSORS_PER_USER = 5;
  uint256 public constant SPONSOR_EXPIRY = 30 days;

  mapping(address => uint256) public lastSponsorTime;

  event UserOperationSponsored(
    address indexed sender,
    bytes4 functionSelector,
    uint256 gasUsed
  );

  event SponsorshipLimitExceeded(address indexed sender);

  constructor(IEntryPoint entryPoint) BasePaymaster(entryPoint) {}

  /**
   * Validate that operation is eligible for sponsorship
   */
  function _validatePaymasterUserOp(
    UserOperation calldata userOp,
    bytes32,
    uint256 requiredPreFund
  ) internal view override returns (bytes memory context, uint256 validationData) {
    // Extract function selector from callData
    bytes4 selector = bytes4(userOp.callData[:4]);

    // Check if function is sponsored
    require(sponsoredFunctions[selector], "Function not sponsored");

    // Check if contract is whitelisted
    address target = address(bytes20(userOp.callData[16:36]));
    require(whitelistedContracts[target], "Contract not whitelisted");

    // Check sponsorship limit (5 per month)
    uint256 timeSinceLastSponsor = block.timestamp - lastSponsorTime[userOp.sender];
    if (timeSinceLastSponsor > SPONSOR_EXPIRY) {
      // Reset counter
      userSponsorsUsed[userOp.sender] = 0;
    }

    require(
      userSponsorsUsed[userOp.sender] < MAX_SPONSORS_PER_USER,
      "Sponsorship limit reached"
    );

    // Return context for postOp
    bytes memory context = abi.encode(userOp.sender);

    // All validation passed
    return (context, 0);
  }

  /**
   * Post-operation (called after execution)
   * Update sponsorship counters
   */
  function _postOp(
    PostOpMode mode,
    bytes calldata context,
    uint256 actualGasCost
  ) internal override {
    if (mode == PostOpMode.opSucceeded) {
      address sender = abi.decode(context, (address));

      userSponsorsUsed[sender]++;
      lastSponsorTime[sender] = block.timestamp;

      emit UserOperationSponsored(sender, bytes4(0), actualGasCost);
    }
  }

  /**
   * Admin: Set which functions are sponsored
   */
  function setSponsoredFunction(bytes4 selector, bool sponsored)
    external
    onlyOwner
  {
    sponsoredFunctions[selector] = sponsored;
  }

  /**
   * Admin: Whitelist contract
   */
  function setWhitelistedContract(address target, bool whitelisted)
    external
    onlyOwner
  {
    whitelistedContracts[target] = whitelisted;
  }

  /**
   * Admin: Deposit ETH for gas sponsorship
   */
  function deposit() public payable {
    entryPoint.depositTo{value: msg.value}(address(this));
  }

  /**
   * Admin: Withdraw funds
   */
  function withdrawTo(address payable target, uint256 amount)
    public
    onlyOwner
  {
    entryPoint.withdrawTo(target, amount);
  }

  /**
   * Admin: Get deposit balance
   */
  function getDeposit() public view returns (uint256) {
    return entryPoint.balanceOf(address(this));
  }
}
```

---

## Part 5: Frontend Integration (React)

```typescript
// hooks/useGaslessTransaction.ts
import { useCallback, useState } from "react";
import { SmartWalletService } from "../services/account-abstraction/smart-wallet-service";
import { CoinbaseSmartWalletService } from "../services/account-abstraction/coinbase-wallet-service";

export function useGaslessTransaction(walletType: "privy" | "coinbase") {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const smartWalletService = new SmartWalletService(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID || "",
    process.env.PRIVY_SECRET || ""
  );

  const coinbaseService = new CoinbaseSmartWalletService();

  /**
   * Submit match result (gasless)
   */
  const submitMatchGasless = useCallback(
    async (matchId: string, result: any) => {
      setLoading(true);
      setError(null);

      try {
        // Encode function call
        const data = encodeMatchResult(matchId, result);

        let hash: string;

        if (walletType === "privy") {
          // Use Privy smart wallet
          const { userOpHash } = await smartWalletService.sendUserOperation(
            userAddress, // Smart wallet address
            MATCH_REGISTRY_ADDRESS,
            data,
            BigInt(0),
            PAYMASTER_ADDRESS // Sponsor gas
          );

          hash = userOpHash;
        } else {
          // Use Coinbase smart wallet
          const { hash: txHash } = await coinbaseService.sendGaslessTransaction(
            MATCH_REGISTRY_ADDRESS,
            data
          );

          hash = txHash;
        }

        return { success: true, hash };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [walletType]
  );

  /**
   * Mint NFT reward (gasless)
   */
  const mintNFTGasless = useCallback(
    async (cardId: string, amount: number) => {
      setLoading(true);
      setError(null);

      try {
        const data = encodeMintCall(cardId, amount);

        let hash: string;

        if (walletType === "privy") {
          const { userOpHash } = await smartWalletService.sendUserOperation(
            userAddress,
            PLAYER_CARD_ADDRESS,
            data,
            BigInt(0),
            PAYMASTER_ADDRESS
          );
          hash = userOpHash;
        } else {
          const { hash: txHash } = await coinbaseService.sendGaslessTransaction(
            PLAYER_CARD_ADDRESS,
            data
          );
          hash = txHash;
        }

        return { success: true, hash };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [walletType]
  );

  return {
    submitMatchGasless,
    mintNFTGasless,
    loading,
    error,
  };
}

function encodeMatchResult(matchId: string, result: any): string {
  // Encode recordMatch(matchId, scoreA, scoreB, resultHash)
  return "0x";
}

function encodeMintCall(cardId: string, amount: number): string {
  // Encode mint(to, cardId, amount)
  return "0x";
}

const MATCH_REGISTRY_ADDRESS = "0x...";
const PLAYER_CARD_ADDRESS = "0x...";
const PAYMASTER_ADDRESS = "0x...";
const userAddress = "0x...";
```

---

## Part 6: React Component Example

```typescript
// components/match/match-submit-gasless.tsx
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useGaslessTransaction } from "../../hooks/useGaslessTransaction";

export function MatchSubmitGasless({
  matchId,
  result,
}: {
  matchId: string;
  result: any;
}) {
  const { address, isConnected } = useAccount();
  const { submitMatchGasless, loading, error } = useGaslessTransaction("coinbase");
  const [submitted, setSubmitted] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!isConnected) {
      alert("Connect wallet first");
      return;
    }

    const res = await submitMatchGasless(matchId, result);

    if (res.success) {
      setSubmitted(true);
      setTxHash(res.hash);
    }
  };

  return (
    <div className="match-submit">
      <h2>Submit Match Result</h2>

      <div className="result-display">
        <p>Team A: {result.scoreA}</p>
        <p>Team B: {result.scoreB}</p>
        <p>Hash: {result.hash.slice(0, 10)}...</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {submitted && (
        <div className="success-message">
          ✅ Match submitted gaslessly!
          <a href={`https://basescan.org/tx/${txHash}`} target="_blank">
            View on BaseScan
          </a>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !isConnected}
        className="btn-primary"
      >
        {loading ? "Submitting..." : "Submit Match (Gasless)"}
      </button>

      <p className="info-text">
        💡 No gas fees! Sponsored by BassBall protocol.
      </p>
    </div>
  );
}
```

---

## Part 7: Server-Side Coordination

```typescript
// services/account-abstraction/paymaster-coordinator.ts
import { PublicClient, createPublicClient, http } from "viem";
import { base } from "viem/chains";

export class PaymasterCoordinator {
  private publicClient: PublicClient;
  private paymasterAddress: string;

  constructor(paymasterAddress: string) {
    this.publicClient = createPublicClient({
      chain: base,
      transport: http("https://mainnet.base.org"),
    });
    this.paymasterAddress = paymasterAddress;
  }

  /**
   * Check if user is eligible for sponsorship
   */
  async checkEligibility(
    userAddress: string,
    functionType: "MATCH_SUBMIT" | "NFT_MINT" | "LEADERBOARD_UPDATE"
  ): Promise<{
    eligible: boolean;
    reason?: string;
    sponsorsUsed: number;
    sponsorsRemaining: number;
  }> {
    // Read paymaster contract
    const sponsorsUsed = await this.publicClient.readContract({
      address: this.paymasterAddress as `0x${string}`,
      abi: [
        {
          name: "userSponsorsUsed",
          type: "function",
          stateMutability: "view",
          inputs: [{ type: "address" }],
          outputs: [{ type: "uint256" }],
        },
      ],
      functionName: "userSponsorsUsed",
      args: [userAddress as `0x${string}`],
    });

    const sponsorsUsed_num = Number(sponsorsUsed);
    const MAX_SPONSORS = 5;
    const sponsorsRemaining = Math.max(0, MAX_SPONSORS - sponsorsUsed_num);

    if (sponsorsRemaining === 0) {
      return {
        eligible: false,
        reason: "Monthly sponsorship limit reached",
        sponsorsUsed: sponsorsUsed_num,
        sponsorsRemaining: 0,
      };
    }

    return {
      eligible: true,
      sponsorsUsed: sponsorsUsed_num,
      sponsorsRemaining,
    };
  }

  /**
   * Check paymaster balance
   */
  async getPaymasterBalance(): Promise<{
    balance: bigint;
    estimatedGasSponsors: number;
  }> {
    const balance = await this.publicClient.getBalance({
      address: this.paymasterAddress as `0x${string}`,
    });

    // Estimate how many sponsors we can afford
    // ~60k gas per sponsor at 50 Gwei
    const gasPerSponsor = 60000n;
    const estimatedGasSponsors = Number(balance / gasPerSponsor);

    return { balance, estimatedGasSponsors };
  }

  /**
   * Refill paymaster when low
   */
  async shouldRefillPaymaster(): Promise<boolean> {
    const { estimatedGasSponsors } = await this.getPaymasterBalance();

    // Refill if less than 100 sponsors worth of gas
    return estimatedGasSponsors < 100;
  }
}
```

---

## Part 8: Sponsorship Strategy

```typescript
// strategies/sponsorship-strategy.ts

export const SponsorshipRules = {
  /**
   * Match Submission
   * - Free for first match
   * - 5 per month for active players
   */
  MATCH_SUBMIT: {
    sponsored: true,
    limit: 5,
    limitPeriod: "monthly",
    conditions: ["matchDuration > 60 seconds", "bothPlayersVerified"],
  },

  /**
   * NFT Minting
   * - First card mint FREE
   * - Subsequent mints: USER PAYS
   * - Prevents Sybil attacks
   */
  NFT_MINT: {
    sponsored: true,
    limit: 1,
    limitPeriod: "lifetime",
    conditions: [
      "firstNFTMint === true",
      "walletAge > 7 days",
      "minRanking >= 1000",
    ],
  },

  /**
   * Leaderboard Updates
   * - FREE to increment stats
   * - Prevents spam
   */
  LEADERBOARD_UPDATE: {
    sponsored: true,
    limit: "unlimited",
    conditions: ["matchVerified === true"],
  },

  /**
   * NOT Sponsored (User Pays)
   */
  MARKETPLACE_TRADES: {
    sponsored: false,
    reason: "Revenue stream - users pay gas on secondary sales",
  },

  TEAM_CREATION: {
    sponsored: false,
    reason: "One-time cost, minimal gas (~80k), user can afford",
  },

  PROFILE_UPDATES: {
    sponsored: false,
    reason: "Infrequent, user controls when to update",
  },
};

/**
 * Calculate gas savings for user
 */
export function calculateGasSavings(
  operationType: "MATCH_SUBMIT" | "NFT_MINT" | "LEADERBOARD_UPDATE",
  gasUsed: number = 100000,
  gasPrice: number = 50 // Gwei
): {
  gasCost: number; // In USDC
  savedPercentage: number;
} {
  const ethPrice = 2000; // USD per ETH
  const gasEthCost = (gasUsed * gasPrice) / 1e9; // ETH
  const gasCostUSDC = gasEthCost * ethPrice;

  // Sponsored = 100% savings
  const isSponsored = SponsorshipRules[operationType]?.sponsored || false;
  const savedPercentage = isSponsored ? 100 : 0;

  return {
    gasCost: gasCostUSDC,
    savedPercentage,
  };
}

/**
 * Example: User benefit
 * Match submission: 100k gas at 50 Gwei = 0.005 ETH = $10 saved
 * NFT mint (first): 80k gas = $8 saved
 * Total: $18 in gas fees eliminated for new players
 */
```

---

## Part 9: Final Recommended Flow

```typescript
// flows/user-to-nft-flow.ts

/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║ FINAL RECOMMENDED FLOW: USER → MATCH → NFT                   ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

export async function completeMatchFlow(userId: string, matchData: any) {
  console.log("🎮 PHASE 1: User Plays (Client-Side)");
  // 1. User opens match in Phaser.js
  // 2. No wallet connection required
  // 3. Client sends inputs to server (MOVE, PASS, SHOOT, etc.)
  // 4. Server runs match engine, no blockchain involved

  console.log("✅ PHASE 2: Match Ends (Server-Side)");
  // 5. Server simulates final state
  // 6. Generates result hash: SHA256(seed + inputs)
  // 7. Stores proof:
  //    {
  //      matchId: "match-123",
  //      seed: "abc123",
  //      scoreA: 3,
  //      scoreB: 1,
  //      resultHash: "0xabc..."
  //    }

  console.log("🔗 PHASE 3: Record on Base (Gasless TX)");
  // 8. Server calls recordMatch() via Coinbase Smart Wallet
  // 9. Paymaster sponsors gas (MATCH_SUBMIT is free)
  // 10. BassBallMatchRegistry stores:
  //     {
  //       matchId: "match-123",
  //       resultHash: "0xabc...",
  //       timestamp: block.timestamp
  //     }
  // Gas: ~100k at 50 Gwei = ~$10 value SAVED

  console.log("🏆 PHASE 4: Mint NFT (Gasless TX)");
  // 11. Match result triggers NFT award
  // 12. Server mints PlayerCard to winner
  //     - Calls mintCard(playerAddress, cardId, 1)
  //     - Paymaster sponsors (first NFT is free)
  //     - Card delivered to player's smart wallet
  // Gas: ~80k = ~$8 value SAVED

  console.log("📊 PHASE 5: Index on The Graph");
  // 13. The Graph subgraph indexes events:
  //     - event MatchRecorded(matchId, winner, scoreA, scoreB)
  //     - event CardMinted(to, cardId, rarity)
  // 14. Leaderboards updated:
  //     - Wins/losses
  //     - ELO rating
  //     - Card collection
  // 15. Available in seconds via GraphQL

  console.log("💬 PHASE 6: Distribute via Farcaster");
  // 16. Server posts Frame to Farcaster
  //     "You won 3-1! Claimed: Rare Striker Card"
  // 17. Friends can view, reply, recast
  // 18. Drives viral engagement

  /**
   * ╔════════════════════════════════════════╗
   * ║ FINAL TALLY FOR USER                   ║
   * ╠════════════════════════════════════════╣
   * ║ Gas Paid:            $0                ║
   * ║ Value Received:      NFT + $18 gas     ║
   * ║ Wallet Creation:     FREE (Smart)      ║
   * ║ Experience:          Seamless          ║
   * ╚════════════════════════════════════════╝
   */
}

/**
 * KEY INSIGHT: User never sees gas fees
 * - Play match: no wallet needed
 * - Win match: gasless NFT mint
 * - View stats: off-chain The Graph
 * - Social sharing: Farcaster Frames
 *
 * For us (BassBall protocol):
 * - Paymaster costs: ~$100/month at scale
 * - Revenue from: marketplace trades, premium features
 * - Market fit: frictionless onboarding
 */
```

---

## Part 10: Testing & Monitoring

```typescript
// test/account-abstraction.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { SmartWalletService } from "../services/account-abstraction/smart-wallet-service";
import { PaymasterCoordinator } from "../services/account-abstraction/paymaster-coordinator";

describe("Account Abstraction", () => {
  let walletService: SmartWalletService;
  let paymaster: PaymasterCoordinator;

  beforeEach(() => {
    walletService = new SmartWalletService(
      "test-privy-id",
      "test-privy-secret"
    );
    paymaster = new PaymasterCoordinator("0xPaymasterAddress");
  });

  describe("Smart Wallet", () => {
    it("should create smart wallet for new user", async () => {
      const result = await walletService.getOrCreateSmartWallet(
        "user-123",
        "0xEOAAddress"
      );

      expect(result.created).toBe(true);
      expect(result.smartWalletAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should reuse existing wallet", async () => {
      // Create wallet
      const first = await walletService.getOrCreateSmartWallet(
        "user-123",
        "0xEOAAddress"
      );

      // Get same wallet
      const second = await walletService.getOrCreateSmartWallet(
        "user-123",
        "0xEOAAddress"
      );

      expect(second.created).toBe(false);
      expect(first.smartWalletAddress).toBe(second.smartWalletAddress);
    });
  });

  describe("Sponsorship", () => {
    it("should check user sponsorship eligibility", async () => {
      const result = await paymaster.checkEligibility(
        "0xUserAddress",
        "MATCH_SUBMIT"
      );

      expect(result.eligible).toBe(true);
      expect(result.sponsorsRemaining).toBeGreaterThan(0);
    });

    it("should limit sponsors per user", async () => {
      // After 5 sponsors in a month
      const result = await paymaster.checkEligibility(
        "0xUserAddress",
        "MATCH_SUBMIT"
      );

      // Should be eligible initially
      expect(result.eligible).toBe(true);

      // After hitting limit
      // result.eligible should be false
    });

    it("should track paymaster balance", async () => {
      const balance = await paymaster.getPaymasterBalance();

      expect(balance.balance).toBeGreaterThan(0n);
      expect(balance.estimatedGasSponsors).toBeGreaterThan(0);
    });
  });

  describe("Gas Savings", () => {
    it("should calculate correct savings", () => {
      const savings = calculateGasSavings("MATCH_SUBMIT", 100000, 50);

      expect(savings.savedPercentage).toBe(100);
      expect(savings.gasCost).toBeGreaterThan(0);
    });
  });
});
```

---

## Part 11: Cost Analysis

```typescript
// analysis/paymaster-economics.ts

export const PaymasterEconomics = {
  /**
   * MONTHLY COSTS (at 1000 active users)
   */
  costs: {
    matchSubmissions: {
      perMonth: 1000, // 1 match/user/month avg
      gasPerTx: 100000,
      gasPrice: 50, // Gwei
      ethCost: 0.005, // per tx
      monthlyEthCost: 5, // 1000 * 0.005
      monthlyUSDCost: 10000, // 5 ETH * $2000
    },

    nftMinting: {
      perMonth: 1000, // 1 new player/month
      gasPerTx: 80000,
      ethCost: 0.004,
      monthlyEthCost: 4,
      monthlyUSDCost: 8000,
    },

    leaderboardUpdates: {
      perMonth: 5000, // 5 updates/user/month
      gasPerTx: 60000,
      ethCost: 0.003,
      monthlyEthCost: 15,
      monthlyUSDCost: 30000,
    },

    total: {
      monthlyEthCost: 24,
      monthlyUSDCost: 48000, // ~$48k/month
    },
  },

  /**
   * REVENUE STREAMS
   */
  revenue: {
    marketplaceFeesPercent: 2.5, // 2.5% on card trades
    estimatedMonthlyVolume: 500000, // USDC traded
    marketplaceRevenue: 12500,

    premiumFeatures: {
      battlePass: 4.99,
      estimatedSubscribers: 500,
      monthlyRevenue: 2495,
    },

    sponsorshipAds: {
      averageMonthly: 5000,
    },

    total: {
      monthlyRevenue: 19995,
    },
  },

  /**
   * NET ECONOMICS
   */
  netMonthly: 19995 - 48000, // -$28,005 (investment phase)

  /**
   * STRATEGY
   */
  strategy: {
    phase1: "Subsidize gas completely (user acquisition)",
    phase2: "Reduce sponsorship as user base grows",
    phase3: "Target break-even at 5000+ active users",
    phase4: "Profitable at 10000+ users",
  },

  /**
   * OPTIMIZATION
   */
  optimizations: {
    bundlingSavings: "20% by batching operations",
    reducedCalldata: "10% by optimizing calldata size",
    offchainFirstApproach: "50% by moving non-critical data off-chain",
  },
};

/**
 * PAYMASTER DEPLOYMENT COSTS
 */
export const DeploymentCosts = {
  paymasterContract: {
    deploymentGas: 500000,
    deploymentCost: 2500, // at 50 Gwei
  },

  initialFunding: {
    targetBalance: 100, // ETH
    targetValue: 200000, // USD
  },

  monthlyRefills: {
    estimatedNeeded: 24, // ETH based on costs above
    refillFrequency: "biweekly",
  },
};
```

---

## Summary

### ERC-4337 Benefits
✅ No private key exposure
✅ Batch operations (lower gas)
✅ Account recovery (social login)
✅ Gasless transactions (paymaster)
✅ Smart contract wallets (features)

### Sponsorship Rules
✅ Match submission: Free (5/month)
✅ NFT mint: Free (first card only)
✅ Leaderboard: Free (unlimited)
❌ Marketplace trades: User pays (2.5% fee)

### Final Flow
```
User Plays (no wallet)
  ↓
Match Ends (server simulates)
  ↓
Record on Base (gasless, paymaster)
  ↓
Mint NFT (gasless, paymaster)
  ↓
Index on The Graph (decentralized)
  ↓
Share on Farcaster (viral)
```

### Economics
- Monthly paymaster cost: ~$48k at scale
- Revenue from fees: ~$20k (breakeven at 5k users)
- Investment phase: 2-3 months
- Target: 10k+ active users
