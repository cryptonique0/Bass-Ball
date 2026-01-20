/**
 * All-EVM Wallet Integration Examples
 * Real-world usage patterns for multi-chain wallet support
 */

// ============================================================================
// EXAMPLE 1: Basic Wallet Connection
// ============================================================================

import { useAllEVMWallet } from '@/hooks/useAllEVMWallet';

export function BasicWalletExample() {
  const {
    address,
    formattedAddress,
    isConnected,
    chainName,
    balance,
  } = useAllEVMWallet();

  if (!isConnected) {
    return <div>Please connect your wallet</div>;
  }

  return (
    <div>
      <p>Wallet: {formattedAddress}</p>
      <p>Chain: {chainName}</p>
      <p>Balance: {balance} ETH</p>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Chain Switcher with Button
// ============================================================================

import { useChainSwitcher, useAllEVMWallet } from '@/hooks/useAllEVMWallet';

export function ChainSwitcherExample() {
  const { chainId } = useAllEVMWallet();
  const { switchChainSafely, isSwitching, error } = useChainSwitcher();

  const chains = [
    { id: 1, name: 'Ethereum' },
    { id: 137, name: 'Polygon' },
    { id: 42161, name: 'Arbitrum' },
    { id: 10, name: 'Optimism' },
    { id: 8453, name: 'Base' },
  ];

  return (
    <div>
      <div className="flex gap-2">
        {chains.map(chain => (
          <button
            key={chain.id}
            onClick={() => switchChainSafely(chain.id)}
            disabled={isSwitching || chainId === chain.id}
            className={`px-4 py-2 rounded ${
              chainId === chain.id ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            {chain.name}
          </button>
        ))}
      </div>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Multi-Chain Dashboard
// ============================================================================

import { useAllEVMWallet, useAvailableEVMChains } from '@/hooks/useAllEVMWallet';
import { MultiChainWalletDisplay } from '@/components/AllEVMWalletComponents';

export function MultiChainDashboard() {
  const {
    isConnected,
    formattedAddress,
    availableChainIds,
  } = useAllEVMWallet();
  const { chainsByCategory, totalSupported } = useAvailableEVMChains();

  if (!isConnected) {
    return (
      <div className="text-center p-8">
        <p>Connect your wallet to see multi-chain dashboard</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1>Multi-Chain Wallet Dashboard</h1>
        <p>Wallet: {formattedAddress}</p>
        <p>Supported Chains: {totalSupported}</p>
      </div>

      <MultiChainWalletDisplay />

      <div className="mt-6">
        <h2>Chain Availability</h2>
        {Object.entries(chainsByCategory).map(([category, chains]) => (
          <div key={category} className="mb-4">
            <h3>{category}</h3>
            <ul>
              {chains.map(chain => (
                <li key={chain.id}>✓ {chain.name}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Require Specific Chain
// ============================================================================

import { useWalletRequired } from '@/hooks/useAllEVMWallet';

export function ArbitrumFeature() {
  const { isReady, readyChecks } = useWalletRequired(42161); // Arbitrum

  if (!readyChecks.walletConnected) {
    return (
      <div className="p-4 bg-red-50 rounded">
        <p>Please connect your wallet to use this feature</p>
      </div>
    );
  }

  if (!readyChecks.correctChain) {
    return (
      <div className="p-4 bg-yellow-50 rounded">
        <p>Please switch to Arbitrum to use this feature</p>
      </div>
    );
  }

  if (isReady) {
    return (
      <div className="p-4 bg-green-50 rounded">
        <p>✓ You're ready to use Arbitrum features!</p>
        <p>Start trading, swapping, or staking...</p>
      </div>
    );
  }

  return null;
}

// ============================================================================
// EXAMPLE 5: Chain-Aware Component
// ============================================================================

import { useAllEVMWallet } from '@/hooks/useAllEVMWallet';
import { getChainMetadata } from '@/lib/wagmiAllEVMConfig';

export function ChainAwareComponent() {
  const { chainId, chainCategory, isCurrentChainSupported } = useAllEVMWallet();

  if (!isCurrentChainSupported) {
    return (
      <div className="p-4 bg-red-50 rounded">
        <p>⚠️ Current chain is not supported</p>
      </div>
    );
  }

  const metadata = chainId ? getChainMetadata(chainId) : null;

  return (
    <div>
      <h2>Chain Information</h2>
      {metadata && (
        <>
          <p>Network: {metadata.name}</p>
          <p>Category: {metadata.category}</p>
          <p>Type: {metadata.isMainnet ? 'Mainnet' : 'Testnet'}</p>
          <a href={`${metadata.explorer}`} target="_blank" rel="noopener noreferrer">
            View on Explorer
          </a>
        </>
      )}
      
      {chainCategory === 'L2' && (
        <div className="p-3 bg-blue-50 rounded mt-4">
          <p>✓ You're on Layer 2 - Enjoy lower gas fees!</p>
        </div>
      )}

      {chainCategory?.includes('Testnet') && (
        <div className="p-3 bg-yellow-50 rounded mt-4">
          <p>⚠️ You're on testnet - Use test funds only</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Chain Grid Display
// ============================================================================

import { AvailableChainsGrid } from '@/components/AllEVMWalletComponents';

export function ChainGridExample() {
  return (
    <div>
      <h1>Supported Networks</h1>
      <p>Click on a chain to switch</p>
      <AvailableChainsGrid />
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Header with Chain Switcher
// ============================================================================

import {
  AllEVMConnectButton,
  ChainSwitcher,
  WalletStatusBadge,
} from '@/components/AllEVMWalletComponents';

export function HeaderExample() {
  return (
    <header className="flex justify-between items-center p-4 bg-gray-900">
      <div>
        <h1>Bass Ball</h1>
      </div>

      <div className="flex items-center gap-4">
        <ChainSwitcher />
        <WalletStatusBadge />
        <AllEVMConnectButton />
      </div>
    </header>
  );
}

// ============================================================================
// EXAMPLE 8: Multiple Chain Operations
// ============================================================================

import { useAllEVMWallet } from '@/hooks/useAllEVMWallet';

interface ChainOperation {
  chainId: number;
  chainName: string;
  operation: string;
  status: 'pending' | 'complete' | 'failed';
}

export function MultiChainOperations() {
  const { switchToChain, isConnected } = useAllEVMWallet();
  const [operations, setOperations] = React.useState<ChainOperation[]>([]);

  const executeOnChain = React.useCallback(
    async (chainId: number, chainName: string, operation: string) => {
      setOperations(prev => [...prev, { chainId, chainName, operation, status: 'pending' }]);

      try {
        switchToChain(chainId);
        // Perform operation here
        await new Promise(resolve => setTimeout(resolve, 2000));

        setOperations(prev =>
          prev.map(op =>
            op.chainId === chainId ? { ...op, status: 'complete' } : op
          )
        );
      } catch (error) {
        setOperations(prev =>
          prev.map(op =>
            op.chainId === chainId ? { ...op, status: 'failed' } : op
          )
        );
      }
    },
    [switchToChain]
  );

  if (!isConnected) {
    return <p>Please connect wallet</p>;
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => executeOnChain(42161, 'Arbitrum', 'Swap')}>
          Swap on Arbitrum
        </button>
        <button onClick={() => executeOnChain(10, 'Optimism', 'Stake')}>
          Stake on Optimism
        </button>
        <button onClick={() => executeOnChain(8453, 'Base', 'Farm')}>
          Farm on Base
        </button>
      </div>

      <div>
        <h3>Operation History</h3>
        {operations.map(op => (
          <div key={`${op.chainId}-${op.operation}`}>
            <p>
              {op.operation} on {op.chainName} - {op.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 9: Conditional Rendering by Chain Category
// ============================================================================

import { useAllEVMWallet } from '@/hooks/useAllEVMWallet';

export function ConditionalChainFeatures() {
  const { chainCategory, isCurrentChainSupported } = useAllEVMWallet();

  if (!isCurrentChainSupported) {
    return <p>Unsupported chain</p>;
  }

  return (
    <div>
      {chainCategory === 'L1' && (
        <div>
          <h2>Layer 1 Features</h2>
          <p>• Direct settlement</p>
          <p>• Maximum security</p>
          <p>• Higher gas costs</p>
        </div>
      )}

      {chainCategory === 'L2' && (
        <div>
          <h2>Layer 2 Features</h2>
          <p>• Ultra-low fees</p>
          <p>• Fast transactions</p>
          <p>• Ethereum security</p>
        </div>
      )}

      {chainCategory?.includes('Testnet') && (
        <div>
          <h2>Testnet Notice</h2>
          <p>⚠️ Using test tokens - No real value</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 10: Complete Page with All Features
// ============================================================================

export function CompleteAllEVMPage() {
  return (
    <main>
      <HeaderExample />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        <div>
          <BasicWalletExample />
        </div>

        <div>
          <ChainAwareComponent />
        </div>

        <div>
          <ArbitrumFeature />
        </div>
      </div>

      <div className="p-6">
        <ChainGridExample />
      </div>

      <div className="p-6">
        <MultiChainDashboard />
      </div>

      <div className="p-6">
        <MultiChainOperations />
      </div>
    </main>
  );
}

export default {
  BasicWalletExample,
  ChainSwitcherExample,
  MultiChainDashboard,
  ArbitrumFeature,
  ChainAwareComponent,
  ChainGridExample,
  HeaderExample,
  MultiChainOperations,
  ConditionalChainFeatures,
  CompleteAllEVMPage,
};
