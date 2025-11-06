/**
 * RPC Client for N42 blockchain
 * 
 * Copyright (c) 2024 N42
 * Licensed under the MIT License
 */

import { ethers } from 'ethers';
import { N42Config } from '../types';
import { withRetry } from '../utils/retry';
import { NetworkError } from '../errors';

export class RPCClient {
  private provider: ethers.JsonRpcProvider;
  private config: N42Config;

  constructor(config: N42Config) {
    const rpcUrl = typeof config.rpcUrl === 'string' ? config.rpcUrl : config.rpcUrl.toString();
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(rpcUrl, {
      chainId: config.chainId,
      name: 'n42',
    });
  }

  /**
   * Get provider instance
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  /**
   * Execute RPC call with retry
   */
  async call<T>(fn: () => Promise<T>, isIdempotent: boolean = true): Promise<T> {
    const retryConfig = this.config.retry || {
      type: 'exponential',
      baseMs: 300,
      maxMs: 3000,
    };

    try {
      return await withRetry(
        async () => {
          const timeout = this.config.timeoutMs || 12000;
          return await Promise.race([
            fn(),
            new Promise<T>((_, reject) =>
              setTimeout(() => reject(new NetworkError('Request timeout')), timeout)
            ),
          ]);
        },
        retryConfig,
        isIdempotent
      );
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      throw new NetworkError('RPC call failed', error as Error);
    }
  }

  /**
   * Get network info
   */
  async getNetwork(): Promise<ethers.Network> {
    return await this.call(() => this.provider.getNetwork());
  }

  /**
   * Get balance
   */
  async getBalance(address: string): Promise<bigint> {
    return await this.call(() => this.provider.getBalance(address));
  }

  /**
   * Get transaction count (nonce)
   */
  async getTransactionCount(address: string): Promise<number> {
    return await this.call(() => this.provider.getTransactionCount(address));
  }

  /**
   * Get gas price (EIP-1559)
   */
  async getFeeData(): Promise<ethers.FeeData> {
    return await this.call(() => this.provider.getFeeData());
  }

  /**
   * Estimate gas
   */
  async estimateGas(transaction: ethers.TransactionRequest): Promise<bigint> {
    return await this.call(() => this.provider.estimateGas(transaction));
  }

  /**
   * Send transaction
   */
  async sendTransaction(signedTx: string): Promise<ethers.TransactionResponse> {
    return await this.call(() => this.provider.broadcastTransaction(signedTx), false);
  }

  /**
   * Wait for transaction receipt
   */
  async waitForTransaction(
    txHash: string,
    confirmations?: number,
    timeout?: number
  ): Promise<ethers.TransactionReceipt | null> {
    return await this.call(
      () => this.provider.waitForTransaction(txHash, confirmations, timeout),
      false
    );
  }

  /**
   * Call contract method (read-only)
   */
  async callContract(
    address: string,
    abi: ethers.InterfaceAbi,
    method: string,
    params: any[] = []
  ): Promise<any> {
    const contract = new ethers.Contract(address, abi, this.provider);
    return await this.call(() => contract[method](...params));
  }
}

