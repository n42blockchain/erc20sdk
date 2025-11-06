/**
 * N42 SDK Type Definitions
 * 
 * Copyright (c) 2024 N42
 * Licensed under the MIT License
 */

export interface N42Config {
  rpcUrl: string | URL;
  wsUrl: string | URL;
  chainId: number;
  timeoutMs?: number;
  retry?: RetryConfig;
}

export interface RetryConfig {
  type: 'exponential';
  baseMs: number;
  maxMs: number;
  maxAttempts?: number;
}

export interface TokenAmount {
  minUnits: bigint;
  decimals: number;
}

export interface TxOptions {
  maxFeePerGas?: bigint | string; // in wei or gwei string
  maxPriorityFeePerGas?: bigint | string;
  nonce?: number | 'auto';
  gasLimit?: bigint | string | 'auto';
}

export interface ERC20Transfer {
  to: string;
  amount: bigint;
}

export interface ERC20Approve {
  spender: string;
  amount: bigint;
}

export interface TransferEvent {
  from: string;
  to: string;
  value: bigint;
  blockNumber?: number;
  transactionHash?: string;
}

export interface ApprovalEvent {
  owner: string;
  spender: string;
  value: bigint;
  blockNumber?: number;
  transactionHash?: string;
}

export interface TransactionReceipt {
  hash: string;
  blockNumber: number;
  blockHash: string;
  status: 'success' | 'failed';
  gasUsed: bigint;
  effectiveGasPrice: bigint;
}

export interface WalletInfo {
  address: string;
  mnemonic?: string; // Only available if imported/created
}

export type EventCallback<T> = (event: T) => void;

export interface EventSubscription {
  cancel: () => void;
}

