/**
 * ERC-20 Token Interface
 * 
 * Copyright (c) 2024 N42
 * Licensed under the MIT License
 */

import { ethers } from 'ethers';
import { Contract } from 'ethers';
import { RPCClient } from '../rpc/client';
import { WSClient } from '../ws/client';
import {
  ERC20Transfer,
  ERC20Approve,
  TxOptions,
  TransferEvent,
  ApprovalEvent,
  TransactionReceipt,
  EventCallback,
  EventSubscription,
} from '../types';
import { Wallet } from '../wallet/wallet';
import { parseGasValue } from '../utils/gas';
import {
  InsufficientFundsError,
  TransactionRevertedError,
  NonceError,
} from '../errors';

// Standard ERC-20 ABI
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const;

export class ERC20 {
  private contract: Contract;
  private rpcClient: RPCClient;
  private wsClient: WSClient;
  private address: string;

  constructor(address: string, rpcClient: RPCClient, wsClient: WSClient) {
    this.address = address;
    this.rpcClient = rpcClient;
    this.wsClient = wsClient;
    const provider = rpcClient.getProvider();
    this.contract = new Contract(address, ERC20_ABI, provider);
  }

  /**
   * Get token name
   */
  async name(): Promise<string> {
    return await this.rpcClient.call(() => this.contract.name());
  }

  /**
   * Get token symbol
   */
  async symbol(): Promise<string> {
    return await this.rpcClient.call(() => this.contract.symbol());
  }

  /**
   * Get token decimals
   */
  async decimals(): Promise<number> {
    return await this.rpcClient.call(() => this.contract.decimals());
  }

  /**
   * Get total supply
   */
  async totalSupply(): Promise<bigint> {
    return await this.rpcClient.call(() => this.contract.totalSupply());
  }

  /**
   * Get balance of address
   */
  async balanceOf(address: string): Promise<bigint> {
    return await this.rpcClient.call(() => this.contract.balanceOf(address));
  }

  /**
   * Transfer tokens
   */
  async transfer(
    transfer: ERC20Transfer,
    from: Wallet,
    options?: TxOptions
  ): Promise<string> {
    const provider = this.rpcClient.getProvider();
    const wallet = from.connect(provider);

    // Get fee data
    const feeData = await this.rpcClient.getFeeData();
    const maxFeePerGas =
      parseGasValue(options?.maxFeePerGas) ||
      feeData.maxFeePerGas ||
      20000000000n; // 20 gwei default
    const maxPriorityFeePerGas =
      parseGasValue(options?.maxPriorityFeePerGas) ||
      feeData.maxPriorityFeePerGas ||
      1000000000n; // 1 gwei default

    // Get nonce
    let nonce: number;
    if (options?.nonce === 'auto' || options?.nonce === undefined) {
      nonce = await this.rpcClient.getTransactionCount(wallet.address);
    } else {
      nonce = options.nonce;
    }

    // Estimate gas
    let gasLimit: bigint;
    if (options?.gasLimit === 'auto' || options?.gasLimit === undefined) {
      try {
        gasLimit = await this.rpcClient.estimateGas({
          to: this.address,
          from: wallet.address,
          data: this.contract.interface.encodeFunctionData('transfer', [
            transfer.to,
            transfer.amount,
          ]),
        });
        // Add 20% buffer
        gasLimit = (gasLimit * 120n) / 100n;
      } catch (error) {
        throw new TransactionRevertedError(
          'Failed to estimate gas',
          (error as Error).message
        );
      }
    } else {
      gasLimit = parseGasValue(options.gasLimit) || 21000n;
    }

    // Check balance
    const balance = await this.balanceOf(wallet.address);
    if (balance < transfer.amount) {
      throw new InsufficientFundsError(
        `Insufficient token balance. Required: ${transfer.amount}, Available: ${balance}`
      );
    }

    // Check ETH balance for gas
    const ethBalance = await this.rpcClient.getBalance(wallet.address);
    const gasCost = gasLimit * maxFeePerGas;
    if (ethBalance < gasCost) {
      throw new InsufficientFundsError(
        `Insufficient ETH for gas. Required: ${gasCost}, Available: ${ethBalance}`
      );
    }

    // Build transaction
    const txRequest: ethers.TransactionRequest = {
      to: this.address,
      data: this.contract.interface.encodeFunctionData('transfer', [
        transfer.to,
        transfer.amount,
      ]),
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce,
    };

    // Sign and send
    try {
      const signedTx = await wallet.signTransaction(txRequest);
      const response = await this.rpcClient.sendTransaction(signedTx);
      return response.hash;
    } catch (error: any) {
      if (error.code === 'NONCE_EXPIRED' || error.message?.includes('nonce')) {
        throw new NonceError(error.message);
      }
      throw error;
    }
  }

  /**
   * Approve spender
   */
  async approve(
    approve: ERC20Approve,
    from: Wallet,
    options?: TxOptions
  ): Promise<string> {
    const provider = this.rpcClient.getProvider();
    const wallet = from.connect(provider);

    const feeData = await this.rpcClient.getFeeData();
    const maxFeePerGas =
      parseGasValue(options?.maxFeePerGas) ||
      feeData.maxFeePerGas ||
      20000000000n;
    const maxPriorityFeePerGas =
      parseGasValue(options?.maxPriorityFeePerGas) ||
      feeData.maxPriorityFeePerGas ||
      1000000000n;

    let nonce: number;
    if (options?.nonce === 'auto' || options?.nonce === undefined) {
      nonce = await this.rpcClient.getTransactionCount(wallet.address);
    } else {
      nonce = options.nonce;
    }

    let gasLimit: bigint;
    if (options?.gasLimit === 'auto' || options?.gasLimit === undefined) {
      try {
        gasLimit = await this.rpcClient.estimateGas({
          to: this.address,
          from: wallet.address,
          data: this.contract.interface.encodeFunctionData('approve', [
            approve.spender,
            approve.amount,
          ]),
        });
        gasLimit = (gasLimit * 120n) / 100n;
      } catch (error) {
        throw new TransactionRevertedError(
          'Failed to estimate gas',
          (error as Error).message
        );
      }
    } else {
      gasLimit = parseGasValue(options.gasLimit) || 46000n;
    }

    const ethBalance = await this.rpcClient.getBalance(wallet.address);
    const gasCost = gasLimit * maxFeePerGas;
    if (ethBalance < gasCost) {
      throw new InsufficientFundsError(
        `Insufficient ETH for gas. Required: ${gasCost}, Available: ${ethBalance}`
      );
    }

    const txRequest: ethers.TransactionRequest = {
      to: this.address,
      data: this.contract.interface.encodeFunctionData('approve', [
        approve.spender,
        approve.amount,
      ]),
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce,
    };

    try {
      const signedTx = await wallet.signTransaction(txRequest);
      const response = await this.rpcClient.sendTransaction(signedTx);
      return response.hash;
    } catch (error: any) {
      if (error.code === 'NONCE_EXPIRED' || error.message?.includes('nonce')) {
        throw new NonceError(error.message);
      }
      throw error;
    }
  }

  /**
   * Get allowance
   */
  async allowance(owner: string, spender: string): Promise<bigint> {
    return await this.rpcClient.call(() =>
      this.contract.allowance(owner, spender)
    );
  }

  /**
   * Transfer from (requires approval)
   */
  async transferFrom(
    from: string,
    to: string,
    amount: bigint,
    wallet: Wallet,
    options?: TxOptions
  ): Promise<string> {
    const provider = this.rpcClient.getProvider();
    const connectedWallet = wallet.connect(provider);

    const feeData = await this.rpcClient.getFeeData();
    const maxFeePerGas =
      parseGasValue(options?.maxFeePerGas) ||
      feeData.maxFeePerGas ||
      20000000000n;
    const maxPriorityFeePerGas =
      parseGasValue(options?.maxPriorityFeePerGas) ||
      feeData.maxPriorityFeePerGas ||
      1000000000n;

    let nonce: number;
    if (options?.nonce === 'auto' || options?.nonce === undefined) {
      nonce = await this.rpcClient.getTransactionCount(connectedWallet.address);
    } else {
      nonce = options.nonce;
    }

    let gasLimit: bigint;
    if (options?.gasLimit === 'auto' || options?.gasLimit === undefined) {
      try {
        gasLimit = await this.rpcClient.estimateGas({
          to: this.address,
          from: connectedWallet.address,
          data: this.contract.interface.encodeFunctionData('transferFrom', [
            from,
            to,
            amount,
          ]),
        });
        gasLimit = (gasLimit * 120n) / 100n;
      } catch (error) {
        throw new TransactionRevertedError(
          'Failed to estimate gas',
          (error as Error).message
        );
      }
    } else {
      gasLimit = parseGasValue(options.gasLimit) || 65000n;
    }

    const ethBalance = await this.rpcClient.getBalance(connectedWallet.address);
    const gasCost = gasLimit * maxFeePerGas;
    if (ethBalance < gasCost) {
      throw new InsufficientFundsError(
        `Insufficient ETH for gas. Required: ${gasCost}, Available: ${ethBalance}`
      );
    }

    const txRequest: ethers.TransactionRequest = {
      to: this.address,
      data: this.contract.interface.encodeFunctionData('transferFrom', [
        from,
        to,
        amount,
      ]),
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce,
    };

    try {
      const signedTx = await connectedWallet.signTransaction(txRequest);
      const response = await this.rpcClient.sendTransaction(signedTx);
      return response.hash;
    } catch (error: any) {
      if (error.code === 'NONCE_EXPIRED' || error.message?.includes('nonce')) {
        throw new NonceError(error.message);
      }
      throw error;
    }
  }

  /**
   * Events subscription
   */
  events = {
    /**
     * Subscribe to Transfer events
     */
    transfer: (
      from: string | null,
      to: string | null,
      callback: EventCallback<TransferEvent>
    ): EventSubscription => {
      // Subscribe via WebSocket if available, otherwise use provider events
      const provider = this.rpcClient.getProvider();
      const filter = this.contract.filters.Transfer(from, to);

      const eventHandler = (fromAddress: string, toAddress: string, value: bigint, event: ethers.Log) => {
        callback({
          from: fromAddress,
          to: toAddress,
          value,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
        });
      };

      // Listen for past events
      this.contract.on(filter, eventHandler);

      // Also set up WebSocket subscription if available
      let wsUnsubscribe: (() => void) | null = null;
      this.wsClient.connect().then(() => {
        wsUnsubscribe = this.wsClient.subscribe('Transfer', (data: any) => {
          if (
            (from === null || data.from.toLowerCase() === from.toLowerCase()) &&
            (to === null || data.to.toLowerCase() === to.toLowerCase())
          ) {
            callback(data);
          }
        });
      }).catch(() => {
        // WebSocket subscription failed, continue with provider events only
      });

      return {
        cancel: () => {
          this.contract.off(filter, eventHandler);
          wsUnsubscribe?.();
        },
      };
    },

    /**
     * Subscribe to Approval events
     */
    approval: (
      owner: string | null,
      spender: string | null,
      callback: EventCallback<ApprovalEvent>
    ): EventSubscription => {
      const filter = this.contract.filters.Approval(owner, spender);

      const eventHandler = (
        ownerAddress: string,
        spenderAddress: string,
        value: bigint,
        event: ethers.Log
      ) => {
        callback({
          owner: ownerAddress,
          spender: spenderAddress,
          value,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
        });
      };

      this.contract.on(filter, eventHandler);

      let wsUnsubscribe: (() => void) | null = null;
      this.wsClient.connect().then(() => {
        wsUnsubscribe = this.wsClient.subscribe('Approval', (data: any) => {
          if (
            (owner === null || data.owner.toLowerCase() === owner.toLowerCase()) &&
            (spender === null || data.spender.toLowerCase() === spender.toLowerCase())
          ) {
            callback(data);
          }
        });
      }).catch(() => {
        // WebSocket subscription failed
      });

      return {
        cancel: () => {
          this.contract.off(filter, eventHandler);
          wsUnsubscribe?.();
        },
      };
    },
  };
}

