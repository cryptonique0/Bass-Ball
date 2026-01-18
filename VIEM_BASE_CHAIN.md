# ⛓️ Base Chain Interaction: Viem (Type-Safe Blockchain)

## Why Viem? (Not ethers.js)

### Comparison: Viem vs. ethers.js

| Feature | Viem ✅ | ethers.js | web3.js |
|---------|--------|-----------|---------|
| **Type Safety** | Perfect ✨ | Partial | Weak |
| **Bundle Size** | 25KB | 160KB | 180KB |
| **Performance** | 2x faster | Baseline | Slower |
| **TypeScript** | Native | After v6 | Weak |
| **Learning Curve** | Easy | Moderate | Hard |
| **Wagmi Integration** | Perfect ✅ | OK | No |
| **Modular** | Yes | Monolithic | Monolithic |
| **Modern API** | Yes | Older | Outdated |
| **Base Support** | Perfect ✅ | OK | OK |
| **Maintenance** | Active | Active | Slower |

### Why Viem is Better for Web3 Games

```typescript
// ethers.js (Weak typing)
const balance = await provider.getBalance(address);
// balance is any - no autocomplete, no type checking

// Viem (Strong typing)
const balance = await publicClient.getBalance({ address });
// balance is bigint - full IDE support, type-safe math
```

**Viem Benefits:**
- ✅ Full TypeScript support (no `any` types)
- ✅ Works perfectly with Wagmi
- ✅ 6x smaller bundle (25KB vs 160KB)
- ✅ Modular (import only what you need)
- ✅ Better error messages
- ✅ Made by Wagmi team (they work together)

---

## Installation

```bash
npm install viem
npm install --save-dev @types/node
```

That's it! No additional dependencies needed.

---

## Complete Viem Configuration for Base

### `lib/web3/viem-client.ts`

```typescript
import {
  createPublicClient,
  createWalletClient,
  http,
  publicActions,
  walletActions,
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Public client (read-only, no signer needed)
export const publicClientBase = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_BASE_RPC),
});

export const publicClientBaseSepolia = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC),
});

// Wallet client (for signing transactions)
export const createWalletClientForChain = (chainId: number = base.id) => {
  const chain = chainId === baseSepolia.id ? baseSepolia : base;

  return createWalletClient({
    chain,
    transport: http(chainId === baseSepolia.id 
      ? process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC 
      : process.env.NEXT_PUBLIC_BASE_RPC),
    account: undefined, // Will be set by Wagmi
  });
};

// Server-side client (with private key for backend operations)
export const createServerWalletClient = () => {
  const account = privateKeyToAccount(
    process.env.PRIVATE_KEY as `0x${string}`
  );

  return createWalletClient({
    account,
    chain: base,
    transport: http(process.env.NEXT_PUBLIC_BASE_RPC),
  });
};

// Get appropriate client based on chain
export const getPublicClient = (chainId?: number) => {
  if (chainId === baseSepolia.id) {
    return publicClientBaseSepolia;
  }
  return publicClientBase;
};
```

---

## Reading Data (No Signer Needed)

### Get Account Balance

**`lib/web3/read-operations.ts`**

```typescript
import { publicClientBase } from './viem-client';
import { formatEther } from 'viem';

// Get ETH balance
export const getBalance = async (address: string) => {
  const balance = await publicClientBase.getBalance({
    address: address as `0x${string}`,
  });

  return {
    raw: balance,
    formatted: formatEther(balance),
    usd: parseFloat(formatEther(balance)) * 2500, // Rough price
  };
};

// Get multiple balances
export const getMultipleBalances = async (addresses: string[]) => {
  const balances = await Promise.all(
    addresses.map((addr) => getBalance(addr))
  );

  return balances;
};
```

### Get Transaction Details

```typescript
import { publicClientBase } from './viem-client';

export const getTransaction = async (txHash: string) => {
  const tx = await publicClientBase.getTransaction({
    hash: txHash as `0x${string}`,
  });

  return {
    from: tx.from,
    to: tx.to,
    value: tx.value,
    gasPrice: tx.gasPrice,
    blockNumber: tx.blockNumber,
    status: 'pending', // Will be mined
  };
};

export const getTransactionReceipt = async (txHash: string) => {
  const receipt = await publicClientBase.getTransactionReceipt({
    hash: txHash as `0x${string}`,
  });

  return {
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed,
    status: receipt.status === 'success' ? '✅' : '❌',
    contractAddress: receipt.contractAddress,
  };
};
```

### Get Block Information

```typescript
export const getBlockData = async () => {
  const block = await publicClientBase.getBlock();

  return {
    number: block.number,
    timestamp: block.timestamp,
    baseFeePerGas: block.baseFeePerGas,
    gasUsed: block.gasUsed,
    gasLimit: block.gasLimit,
  };
};

export const getGasPrice = async () => {
  const gasPrice = await publicClientBase.getGasPrice();

  return {
    standard: gasPrice,
    fast: (gasPrice * 120n) / 100n,
    instant: (gasPrice * 150n) / 100n,
  };
};
```

---

## Reading Smart Contract Data

### Setup Contract Interface

**`lib/web3/contracts.ts`**

```typescript
import { getAbiItem } from 'viem';

// ERC721 ABI (NFT)
export const ERC721_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'ownerOf',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'owner', type: 'address' }],
    stateMutability: 'view',
  },
  {
    name: 'tokenURI',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'uri', type: 'string' }],
    stateMutability: 'view',
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'transferFrom',
    type: 'function',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

// ERC20 ABI (Token)
export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

// Bass Ball NFT ABI
export const BASSBALL_NFT_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'getBadgesByPlayer',
    type: 'function',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: 'badges', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    name: 'claimBadge',
    type: 'function',
    inputs: [{ name: 'badgeType', type: 'string' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;
```

### Read Contract Functions

**`lib/web3/nft-reads.ts`**

```typescript
import { publicClientBase } from './viem-client';
import { ERC721_ABI } from './contracts';

export const getNFTBalance = async (
  contractAddress: string,
  userAddress: string
) => {
  const balance = await publicClientBase.readContract({
    address: contractAddress as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}`],
  });

  return balance as bigint;
};

export const getNFTOwner = async (
  contractAddress: string,
  tokenId: bigint
) => {
  const owner = await publicClientBase.readContract({
    address: contractAddress as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'ownerOf',
    args: [tokenId],
  });

  return owner as string;
};

export const getNFTMetadata = async (
  contractAddress: string,
  tokenId: bigint
) => {
  const uri = await publicClientBase.readContract({
    address: contractAddress as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'tokenURI',
    args: [tokenId],
  });

  // Fetch metadata from URI
  const response = await fetch(uri as string);
  const metadata = await response.json();

  return metadata;
};

export const getUserNFTs = async (
  contractAddress: string,
  userAddress: string
) => {
  const balance = await getNFTBalance(contractAddress, userAddress);
  const nfts = [];

  for (let i = 0n; i < balance; i++) {
    try {
      const metadata = await getNFTMetadata(contractAddress, i);
      nfts.push({
        tokenId: i,
        metadata,
      });
    } catch {
      // Token doesn't exist or not owned
    }
  }

  return nfts;
};
```

---

## Writing Transactions (With Signer)

### Estimate Gas

```typescript
import { publicClientBase } from './viem-client';

export const estimateTransactionGas = async (
  from: string,
  to: string,
  value: bigint,
  data?: string
) => {
  const gasEstimate = await publicClientBase.estimateGas({
    account: from as `0x${string}`,
    to: to as `0x${string}`,
    value,
    data: data as `0x${string}` | undefined,
  });

  return gasEstimate;
};

export const estimateContractGas = async (
  contractAddress: string,
  abi: any,
  functionName: string,
  args: any[],
  userAddress: string
) => {
  const gasEstimate = await publicClientBase.estimateContractGas({
    account: userAddress as `0x${string}`,
    address: contractAddress as `0x${string}`,
    abi,
    functionName,
    args,
  });

  return gasEstimate;
};
```

### Send Transaction with Wagmi

**`lib/hooks/useBaseTransaction.ts`**

```typescript
'use client';

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useCallback, useState } from 'react';
import { base } from 'viem/chains';

export const useBaseTransaction = () => {
  const { address, chain } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });
  const [error, setError] = useState<string | null>(null);

  // Verify correct chain
  const isCorrectChain = chain?.id === base.id;

  const sendContractTransaction = useCallback(
    async (
      contractAddress: string,
      abi: any,
      functionName: string,
      args: any[],
      value?: bigint
    ) => {
      try {
        if (!address) {
          throw new Error('Wallet not connected');
        }

        if (!isCorrectChain) {
          throw new Error(`Please switch to Base network`);
        }

        setError(null);

        return await writeContract({
          account: address,
          address: contractAddress as `0x${string}`,
          abi,
          functionName,
          args,
          value,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      }
    },
    [address, isCorrectChain, writeContract]
  );

  return {
    sendContractTransaction,
    hash,
    isPending,
    isConfirming,
    receipt,
    error,
    isSuccess: !!receipt?.transactionHash,
  };
};
```

---

## NFT Operations (Complete Example)

### Claim NFT Badge

**`lib/web3/nft-write.ts`**

```typescript
import { publicClientBase } from './viem-client';
import { BASSBALL_NFT_ABI } from './contracts';

export const claimBadge = async (
  contractAddress: string,
  badgeType: string
) => {
  // This requires Wagmi + wallet, so we just return the call data
  return {
    address: contractAddress as `0x${string}`,
    abi: BASSBALL_NFT_ABI,
    functionName: 'claimBadge',
    args: [badgeType],
  };
};

export const getPlayerBadges = async (
  contractAddress: string,
  playerAddress: string
) => {
  const badges = await publicClientBase.readContract({
    address: contractAddress as `0x${string}`,
    abi: BASSBALL_NFT_ABI,
    functionName: 'getBadgesByPlayer',
    args: [playerAddress as `0x${string}`],
  });

  return badges as bigint[];
};
```

### React Component: NFT Claim

**`components/nft/ClaimBadge.tsx`**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useBaseTransaction } from '@/lib/hooks/useBaseTransaction';
import { claimBadge } from '@/lib/web3/nft-write';
import { BASSBALL_NFT_ABI } from '@/lib/web3/contracts';

interface ClaimBadgeProps {
  badgeType: string;
  badgeName: string;
  icon: string;
  contractAddress: string;
}

export const ClaimBadge = ({
  badgeType,
  badgeName,
  icon,
  contractAddress,
}: ClaimBadgeProps) => {
  const { sendContractTransaction, isPending, isConfirming, error, isSuccess } =
    useBaseTransaction();
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleClaim = useCallback(async () => {
    try {
      const txHash = await sendContractTransaction(
        contractAddress,
        BASSBALL_NFT_ABI,
        'claimBadge',
        [badgeType]
      );

      setTxHash(txHash);
    } catch (err) {
      console.error('Claim failed:', err);
    }
  }, [badgeType, contractAddress, sendContractTransaction]);

  if (isSuccess) {
    return (
      <div className="p-4 bg-green-900 rounded-lg border border-green-700 text-green-100">
        <p className="font-bold">✅ {badgeName} Claimed!</p>
        {txHash && (
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-300 hover:underline"
          >
            View on Basescan →
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-800 rounded-lg border border-slate-700">
      <div className="text-4xl mb-2">{icon}</div>
      <h3 className="font-bold mb-4">{badgeName}</h3>

      <button
        onClick={handleClaim}
        disabled={isPending || isConfirming}
        className={`w-full py-2 rounded-lg font-medium transition ${
          isPending || isConfirming
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isPending ? '⏳ Claiming...' : isConfirming ? '🔄 Confirming...' : 'Claim NFT'}
      </button>

      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  );
};
```

---

## Advanced: Multi-Call (Read Multiple Contracts at Once)

```typescript
import { publicClientBase } from './viem-client';

export const multicall = async (calls: any[]) => {
  const results = await publicClientBase.multicall({
    contracts: calls,
  });

  return results;
};

// Example: Get balances from 5 tokens in one call
export const getMultipleTokenBalances = async (
  userAddress: string,
  tokenAddresses: string[]
) => {
  const calls = tokenAddresses.map((tokenAddress) => ({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}`],
  }));

  const balances = await multicall(calls);
  return balances;
};
```

---

## Error Handling

### Type-Safe Error Handling

```typescript
import {
  ContractFunctionExecutionError,
  EstimateGasExecutionError,
  TransactionExecutionError,
} from 'viem';

export const handleViemError = (error: unknown) => {
  if (error instanceof ContractFunctionExecutionError) {
    console.error('Contract error:', error.message);
    return 'Contract call failed';
  }

  if (error instanceof EstimateGasExecutionError) {
    console.error('Gas estimation error:', error.message);
    return 'Not enough gas';
  }

  if (error instanceof TransactionExecutionError) {
    console.error('Transaction error:', error.message);
    return 'Transaction failed';
  }

  return 'Unknown error';
};
```

### Common Errors

```typescript
// Insufficient balance
if (error.message.includes('insufficient funds')) {
  return 'Insufficient balance';
}

// Contract reverted
if (error.message.includes('execution reverted')) {
  return 'Transaction reverted (contract issue)';
}

// User rejected
if (error.message.includes('User rejected')) {
  return 'Transaction cancelled';
}

// Out of gas
if (error.message.includes('out of gas')) {
  return 'Transaction ran out of gas';
}
```

---

## Format Utilities

```typescript
import {
  formatEther,
  formatGwei,
  formatUnits,
  parseEther,
  parseGwei,
  parseUnits,
} from 'viem';

// ETH conversions
const ethValue = formatEther(1000000000000000000n); // "1.0"
const wei = parseEther('1.5'); // 1500000000000000000n

// Token conversions (18 decimals)
const tokenValue = formatUnits(1000000000000000000n, 18); // "1.0"
const tokenWei = parseUnits('1000', 18); // 1000000000000000000000n

// Gas price conversions
const gasPrice = formatGwei(30000000000n); // "30"
const gasPriceWei = parseGwei('30'); // 30000000000n
```

---

## Testing with Local Hardhat Node

```bash
# Terminal 1: Start local blockchain
npx hardhat node

# Terminal 2: Deploy contract
npx hardhat run scripts/deploy.ts --network localhost

# Terminal 3: Run your app
npm run dev
```

**Test contract calls:**

```typescript
// lib/__tests__/viem.test.ts
import { publicClientBase } from '@/lib/web3/viem-client';
import { getBalance } from '@/lib/web3/read-operations';

describe('Viem', () => {
  it('should get account balance', async () => {
    const balance = await getBalance('0x1234567890123456789012345678901234567890');
    expect(balance.raw).toBeGreaterThanOrEqual(0n);
  });

  it('should handle transaction', async () => {
    const tx = await publicClientBase.getTransaction({
      hash: '0x' + '0'.repeat(64),
    });
    expect(tx).toBeDefined();
  });
});
```

---

## Environment Variables

### `.env.local`

```env
# RPC Endpoints
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org

# Smart Contracts
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_MATCH_CONTRACT_ADDRESS=0x...

# Backend (private key for server operations)
PRIVATE_KEY=0x... (NEVER expose in frontend)
```

---

## Performance Optimization

### Caching with TanStack Query

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getBalance } from '@/lib/web3/read-operations';

export const useUserBalance = (address: string) => {
  return useQuery({
    queryKey: ['balance', address],
    queryFn: () => getBalance(address),
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // 30 seconds
  });
};
```

### Batch Operations

```typescript
// Instead of sequential calls
for (const address of addresses) {
  await getBalance(address); // Slow
}

// Use batch
const balances = await getMultipleBalances(addresses); // Fast
```

---

## Best Practices

### DO ✅
- Use `publicClientBase` for reads (no signer)
- Use Wagmi hooks for writes (with wallet)
- Check chain ID before transactions
- Handle gas estimation errors
- Validate addresses before sending
- Use type-safe contract ABIs

### DON'T ❌
- Don't use ethers.js anymore
- Don't hardcode contract ABIs
- Don't skip gas estimation
- Don't assume transaction success
- Don't expose private keys in env
- Don't make blockchain calls on every render

---

## Summary

| Aspect | Viem | ethers.js |
|--------|------|-----------|
| **Type Safety** | ✅ Perfect | Partial |
| **Bundle Size** | 25KB | 160KB |
| **Wagmi Integration** | Perfect | OK |
| **Learning** | Easy | Moderate |
| **Performance** | Fast | Slower |
| **Base Support** | Perfect | Good |

---

## Resources

- **Viem Docs:** https://viem.sh/
- **Viem API Reference:** https://viem.sh/docs/contract
- **Base RPC Endpoints:** https://docs.base.org/
- **Wagmi Integration:** https://wagmi.sh/react/api/useContractRead

---

**Type-safe blockchain interaction in just 25KB** 🎯
