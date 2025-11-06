/**
 * N42 SDK Main Class
 * 
 * Copyright (c) 2024 N42
 * Licensed under the MIT License
 */

import { N42Config, TransactionReceipt } from './types';
import { RPCClient } from './rpc/client';
import { WSClient } from './ws/client';
import { ERC20 } from './erc20/erc20';
import { NetworkError } from './errors';

export class N42SDK {
  private config: N42Config;
  private rpcClient: RPCClient;
  private wsClient: WSClient;

  private constructor(config: N42Config) {
    this.config = config;
    this.rpcClient = new RPCClient(config);
    this.wsClient = new WSClient(config);
  }

  /**
   * Initialize SDK
   */
  static async initialize(config: N42Config): Promise<N42SDK> {
    const sdk = new N42SDK(config);
    
    // Test connection
    try {
      await sdk.rpcClient.getNetwork();
    } catch (error) {
      throw new NetworkError('Failed to connect to RPC endpoint', error as Error);
    }

    // Connect WebSocket (non-blocking)
    sdk.wsClient.connect().catch(error => {
      console.warn('WebSocket connection failed, events may not work:', error);
    });

    return sdk;
  }

  /**
   * Get ERC-20 token instance
   */
  erc20(address: string): ERC20 {
    return new ERC20(address, this.rpcClient, this.wsClient);
  }

  /**
   * Wait for transaction receipt
   */
  async waitForReceipt(
    txHash: string,
    timeoutSec: number = 120
  ): Promise<TransactionReceipt> {
    const receipt = await this.rpcClient.waitForTransaction(
      txHash,
      1, // confirmations
      timeoutSec * 1000
    );

    if (!receipt) {
      throw new NetworkError('Transaction receipt not found');
    }

    return {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber || 0,
      blockHash: receipt.blockHash,
      status: receipt.status === 1 ? 'success' : 'failed',
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.gasPrice || 0n,
    };
  }

  /**
   * Simulate transaction (dry run)
   */
  async simulate(
    to: string,
    data: string,
    from: string
  ): Promise<{ success: boolean; gasEstimate: bigint; revertReason?: string }> {
    try {
      const gasEstimate = await this.rpcClient.estimateGas({
        to,
        data,
        from,
      });
      return { success: true, gasEstimate };
    } catch (error: any) {
      return {
        success: false,
        gasEstimate: 0n,
        revertReason: error.reason || error.message,
      };
    }
  }

  /**
   * Speed up transaction (replace with higher fee)
   */
  async speedUp(
    txHash: string,
    newMaxFeePerGas: bigint,
    newMaxPriorityFeePerGas: bigint
  ): Promise<string> {
    // Get original transaction
    const provider = this.rpcClient.getProvider();
    const originalTx = await provider.getTransaction(txHash);
    
    if (!originalTx) {
      throw new Error('Transaction not found');
    }

    if (!originalTx.from) {
      throw new Error('Cannot determine transaction sender');
    }

    // Get current nonce
    const nonce = await this.rpcClient.getTransactionCount(originalTx.from);

    // Build replacement transaction with higher fees
    const replacementTx = {
      ...originalTx,
      maxFeePerGas: newMaxFeePerGas,
      maxPriorityFeePerGas: newMaxPriorityFeePerGas,
      nonce: originalTx.nonce, // Same nonce
    };

    // Note: This requires the wallet to sign again
    // In a real implementation, you'd need to pass the wallet
    throw new Error('speedUp requires wallet - implement in higher level API');
  }

  /**
   * Cancel transaction (send 0 ETH to self with higher fee)
   */
  async cancel(
    txHash: string,
    from: string,
    newMaxFeePerGas: bigint,
    newMaxPriorityFeePerGas: bigint
  ): Promise<string> {
    const provider = this.rpcClient.getProvider();
    const originalTx = await provider.getTransaction(txHash);
    
    if (!originalTx) {
      throw new Error('Transaction not found');
    }

    const nonce = originalTx.nonce;

    // Create cancel transaction (0 ETH to self)
    const cancelTx = {
      to: from,
      value: 0n,
      maxFeePerGas: newMaxFeePerGas,
      maxPriorityFeePerGas: newMaxPriorityFeePerGas,
      nonce,
      chainId: await (await provider.getNetwork()).chainId,
    };

    // Note: This requires the wallet to sign
    throw new Error('cancel requires wallet - implement in higher level API');
  }

  /**
   * Cleanup resources
   */
  disconnect(): void {
    this.wsClient.disconnect();
  }
}

