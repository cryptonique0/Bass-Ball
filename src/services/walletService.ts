/**
 * NFT transfer and wallet service
 */

export interface WalletTransaction {
  from: string;
  to: string;
  amount: bigint;
  tokenAddress?: string;
  timestamp: number;
  hash?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface NFTTransfer {
  from: string;
  to: string;
  tokenId: string;
  contractAddress: string;
  timestamp: number;
  hash?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export class WalletService {
  private transactions: Map<string, WalletTransaction[]> = new Map();
  private nftTransfers: Map<string, NFTTransfer[]> = new Map();
  private balances: Map<string, bigint> = new Map();

  /**
   * Set balance for wallet
   */
  setBalance(wallet: string, amount: bigint): void {
    this.balances.set(wallet, amount);
  }

  /**
   * Get balance for wallet
   */
  getBalance(wallet: string): bigint {
    return this.balances.get(wallet) || BigInt(0);
  }

  /**
  /**
   * Transfer tokens
   */
  transfer(
    from: string,
    to: string,
    amount: bigint,
    tokenAddress?: string
  ): WalletTransaction {
    const transaction: WalletTransaction = {
      from,
      to,
      amount,
      tokenAddress,
      timestamp: Date.now(),
      status: 'pending',
    };

    if (!this.transactions.has(from)) {
      this.transactions.set(from, []);
    }

    this.transactions.get(from)!.push(transaction);

    if (!this.transactions.has(to)) {
      this.transactions.set(to, []);
    }

    this.transactions.get(to)!.push({ ...transaction });

    return transaction;
  }

  /**
   * Transfer NFT
   */
  transferNFT(
    from: string,
    to: string,
    tokenId: string,
    contractAddress: string
  ): NFTTransfer {
    const transfer: NFTTransfer = {
      from,
      to,
      tokenId,
      contractAddress,
      timestamp: Date.now(),
      status: 'pending',
    };

    if (!this.nftTransfers.has(from)) {
      this.nftTransfers.set(from, []);
    }

    this.nftTransfers.get(from)!.push(transfer);

    if (!this.nftTransfers.has(to)) {
      this.nftTransfers.set(to, []);
    }

    this.nftTransfers.get(to)!.push({ ...transfer });

    return transfer;
  }

  /**
   * Get wallet transactions
   */
  getTransactions(wallet: string): WalletTransaction[] {
    return this.transactions.get(wallet) || [];
  }

  /**
   * Get wallet NFT transfers
   */
  getNFTTransfers(wallet: string): NFTTransfer[] {
    return this.nftTransfers.get(wallet) || [];
  }

  /**
   * Confirm transaction
   */
  confirmTransaction(wallet: string, transactionIndex: number): boolean {
    const transactions = this.transactions.get(wallet);
    if (!transactions || !transactions[transactionIndex]) return false;

    transactions[transactionIndex].status = 'confirmed';
    transactions[transactionIndex].hash = `0x${Math.random().toString(16).slice(2)}`;
    return true;
  }

  /**
   * Confirm NFT transfer
   */
  confirmNFTTransfer(wallet: string, transferIndex: number): boolean {
    const transfers = this.nftTransfers.get(wallet);
    if (!transfers || !transfers[transferIndex]) return false;

    transfers[transferIndex].status = 'confirmed';
    transfers[transferIndex].hash = `0x${Math.random().toString(16).slice(2)}`;
    return true;
  }

  /**
   * Get transaction history
   */
  getTransactionHistory(wallet: string, limit: number = 100) {
    const txs = this.transactions.get(wallet) || [];
    const nftTxs = this.nftTransfers.get(wallet) || [];

    return {
      wallet,
      tokenTransactions: txs.slice(-limit),
      nftTransfers: nftTxs.slice(-limit),
      total: txs.length + nftTxs.length,
    };
  }
}
