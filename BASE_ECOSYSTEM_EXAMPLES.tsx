/**
 * Base Ecosystem Integration Examples
 * Real-world usage examples for the Base ecosystem features
 * Copy and modify these examples for your use case
 */

import { useBaseEcosystem, useBaseGasMonitor, useBaseCostComparison } from '@/hooks/useBaseEcosystem';
import { 
  getBaseNetworkStats, 
  estimateBaseGasPrice,
  calculateBaseSavings,
  BASE_ECOSYSTEM
} from '@/lib/web3/base-ecosystem';
import { 
  UNISWAP_V3_POOL_QUERY,
  UNISWAP_V3_SWAP_QUERY,
  LP_POSITIONS_QUERY,
  calculateLPAPY,
  parsePoolData
} from '@/lib/web3/base-graph-queries';

// ============================================================================
// EXAMPLE 1: Basic Ecosystem Status Display
// ============================================================================

export function BaseEcosystemStatusExample() {
  const {
    blockNumber,
    gasPrice,
    isBase,
    estimatedTxCost,
    bridges,
    dexs,
    isLoading,
    error,
  } = useBaseEcosystem();

  if (isLoading) return <div>Loading Base ecosystem data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Base Ecosystem Status</h1>
      
      {/* Network Status */}
      <section>
        <h2>Network Status</h2>
        <p>Block: {blockNumber}</p>
        <p>Gas Price: {gasPrice} Gwei</p>
        <p>Connected: {isBase ? '✅ Yes' : '❌ No'}</p>
        <p>Est. TX Cost: ${estimatedTxCost}</p>
      </section>

      {/* Available Bridges */}
      <section>
        <h2>Bridges ({bridges.length})</h2>
        {bridges.map(bridge => (
          <div key={bridge.id}>
            <h3>{bridge.name}</h3>
            <a href={bridge.url} target="_blank" rel="noopener noreferrer">
              Visit {bridge.name}
            </a>
          </div>
        ))}
      </section>

      {/* Available DEXs */}
      <section>
        <h2>DEXs ({dexs.length})</h2>
        {dexs.map(dex => (
          <div key={dex.id}>
            <h3>{dex.name}</h3>
            <p>Router: {dex.router}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Gas Price Monitoring with Trend Analysis
// ============================================================================

export function GasMonitoringExample() {
  const {
    currentGasPrice,
    gasAverage,
    gasTrend,
    recommendation,
    historyLength,
  } = useBaseGasMonitor();

  return (
    <div>
      <h2>Gas Price Monitor</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3>Current</h3>
          <p className="text-3xl font-bold">{currentGasPrice} Gwei</p>
        </div>

        <div>
          <h3>Average (24h)</h3>
          <p className="text-3xl font-bold">{gasAverage} Gwei</p>
        </div>

        <div>
          <h3>Trend</h3>
          <p className="text-2xl capitalize">
            {gasTrend}
            {gasTrend === 'increasing' && ' 📈'}
            {gasTrend === 'decreasing' && ' 📉'}
            {gasTrend === 'stable' && ' ➡️'}
          </p>
        </div>

        <div>
          <h3>Recommendation</h3>
          <p className="text-2xl capitalize font-bold">
            {recommendation === 'low' && '🟢 Low'}
            {recommendation === 'standard' && '🟡 Standard'}
            {recommendation === 'fast' && '🔴 Fast'}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-4">
        Data points collected: {historyLength} / 60
      </p>

      {/* Usage Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h4>💡 Usage Tips:</h4>
        <ul>
          <li>✓ Wait for 🟢 Low gas prices for non-urgent transactions</li>
          <li>✓ Use 🟡 Standard for normal operations</li>
          <li>✓ Use 🔴 Fast only for time-critical transactions</li>
          <li>✓ Monitor 📈 trend before submitting transactions</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Cost Comparison vs Ethereum L1
// ============================================================================

export function CostComparisonExample() {
  const comparisonSimple = useBaseCostComparison('simple');
  const comparisonComplex = useBaseCostComparison('complex');

  return (
    <div>
      <h2>💰 Cost Savings on Base vs Ethereum</h2>

      {/* Simple Transaction */}
      <section className="mb-6">
        <h3>Simple Transfer (21,000 gas)</h3>
        {comparisonSimple && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Ethereum L1</p>
              <p className="text-2xl font-bold">{comparisonSimple.ethereumCost}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Base Chain</p>
              <p className="text-2xl font-bold text-green-600">
                {comparisonSimple.baseCost}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Complex Transaction */}
      <section>
        <h3>Complex Smart Contract (100,000 gas)</h3>
        {comparisonComplex && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Ethereum L1</p>
              <p className="text-2xl font-bold">{comparisonComplex.ethereumCost}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Base Chain</p>
              <p className="text-2xl font-bold text-green-600">
                {comparisonComplex.baseCost}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Savings Summary */}
      {comparisonComplex && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
          <p className="text-lg font-bold text-green-700">
            💰 Save {comparisonComplex.savedAmount} on complex transactions!
          </p>
          <p className="text-sm text-green-600">
            That's {comparisonComplex.savingsPercent} cheaper than Ethereum L1
          </p>
          {comparisonComplex.isSignificant && (
            <p className="text-sm text-green-700 font-semibold mt-2">
              ✅ Savings are very significant!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Bridge Integration for Cross-Chain Assets
// ============================================================================

export function BridgeIntegrationExample() {
  const { getBridgeLink } = useBaseEcosystem();

  // Example: Bridge 100 USDC to Base
  const bridgeUsdc = getBridgeLink('STARGATE', 'USDC', '100');

  return (
    <div>
      <h2>🌉 Bridge Assets to Base</h2>

      {/* Bridge Option 1: Stargate */}
      <div className="mb-4">
        <h3>Stargate Finance</h3>
        <p>Bridge USDC from Ethereum to Base</p>
        <a
          href={bridgeUsdc}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Bridge 100 USDC via Stargate
        </a>
      </div>

      {/* Bridge Option 2: Across */}
      <div className="mb-4">
        <h3>Across Protocol</h3>
        <p>Fast relayed bridge for any token</p>
        <a
          href={getBridgeLink('ACROSS')}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Open Across Protocol
        </a>
      </div>

      {/* Bridge Option 3: Optimism Bridge */}
      <div>
        <h3>Optimism Bridge</h3>
        <p>Native bridge between OP and Base (both OP Stack)</p>
        <a
          href={getBridgeLink('OPTIMISM')}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Open Optimism Bridge
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: DEX Integration & Swaps
// ============================================================================

export function DexIntegrationExample() {
  const { getSwapLink } = useBaseEcosystem();

  return (
    <div>
      <h2>📊 Swap on Base DEXs</h2>

      {/* Uniswap V3 Example */}
      <section className="mb-6">
        <h3>Uniswap V3</h3>
        <p>Swap ETH for USDC</p>
        <a
          href={getSwapLink('UNISWAP_V3', 'ETH', 'USDC')}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Swap on Uniswap V3
        </a>
      </section>

      {/* Aerodrome Example */}
      <section>
        <h3>Aerodrome Finance</h3>
        <p>Base's native DEX with optimized routing</p>
        <a
          href={getSwapLink('AERODROME', 'ETH', 'USDC')}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Swap on Aerodrome
        </a>
      </section>
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Server-Side Network Stats
// ============================================================================

export async function getBaseStatsServerExample() {
  // This can be called in a server component or API route
  const stats = await getBaseNetworkStats();

  return {
    blockNumber: stats.blockNumber,
    gasPrice: stats.gasPrice,
    isConnected: stats.isBase,
    timestamp: stats.timestamp,
  };
}

// ============================================================================
// EXAMPLE 7: Gas Price Estimation in API Route
// ============================================================================

export async function estimateTransactionCostAPI() {
  try {
    const gasEstimate = await estimateBaseGasPrice();

    return {
      gasPrice: gasEstimate.gasPrice,
      estimatedTxCost: gasEstimate.priceInUSD,
      recommendation: gasEstimate.recommendation,
      recommendation_icon: 
        gasEstimate.recommendation === 'low' ? '🟢' :
        gasEstimate.recommendation === 'fast' ? '🔴' :
        '🟡',
    };
  } catch (error) {
    return {
      error: 'Failed to estimate gas price',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// EXAMPLE 8: Calculate Savings for Marketing
// ============================================================================

export function SavingsCalculatorExample() {
  // Compare costs
  const simpleTransfer = calculateBaseSavings(50, 'simple');
  const complexSwap = calculateBaseSavings(50, 'complex');

  return (
    <div>
      <h2>Why Base?</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Simple Transfer */}
        <div className="p-4 border rounded">
          <h3>Simple Transfer</h3>
          <p>Ethereum: {simpleTransfer.l1Cost.toFixed(2)} USD</p>
          <p>Base: <strong>{simpleTransfer.baseCost.toFixed(2)} USD</strong></p>
          <p className="text-green-600 font-bold">
            Save: {simpleTransfer.savingsPercent.toFixed(0)}%
          </p>
        </div>

        {/* Complex Operation */}
        <div className="p-4 border rounded">
          <h3>Complex Operation</h3>
          <p>Ethereum: {complexSwap.l1Cost.toFixed(2)} USD</p>
          <p>Base: <strong>{complexSwap.baseCost.toFixed(2)} USD</strong></p>
          <p className="text-green-600 font-bold">
            Save: {complexSwap.savingsPercent.toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded">
        <p className="font-bold">🎯 Key Selling Points:</p>
        <ul>
          <li>✅ {simpleTransfer.savingsPercent.toFixed(0)}% cheaper than Ethereum</li>
          <li>✅ Secured by Coinbase and OP Stack</li>
          <li>✅ 2-second block times</li>
          <li>✅ Full EVM compatibility</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 9: Token Information Display
// ============================================================================

export function TokenInfoExample() {
  const { getTokenInfo } = useBaseEcosystem();

  // Get info for major tokens
  const tokens = ['ETH', 'USDC', 'USDT', 'DAI', 'CBETH'];

  return (
    <div>
      <h2>Supported Tokens on Base</h2>

      <table>
        <thead>
          <tr>
            <th>Token</th>
            <th>Address</th>
            <th>Decimals</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map(symbol => {
            const token = getTokenInfo(symbol);
            if (!token) return null;
            
            return (
              <tr key={symbol}>
                <td>{symbol}</td>
                <td className="font-mono">{token.address}</td>
                <td>{token.decimals}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// EXAMPLE 10: Complete Integration in a Page
// ============================================================================

export function CompleteBasePage() {
  return (
    <main>
      <h1>🌊 Base Ecosystem Hub</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div>
          <BaseEcosystemStatusExample />
        </div>

        {/* Right Column */}
        <div>
          <GasMonitoringExample />
        </div>
      </div>

      <hr />

      <div className="mt-6">
        <CostComparisonExample />
      </div>

      <hr />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <BridgeIntegrationExample />
        <DexIntegrationExample />
      </div>

      <hr />

      <div className="mt-6">
        <SavingsCalculatorExample />
      </div>

      <hr />

      <div className="mt-6">
        <TokenInfoExample />
      </div>
    </main>
  );
}

export default CompleteBasePage;
