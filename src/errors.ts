/**
 * N42 SDK Error Types
 * 
 * Copyright (c) 2024 N42
 * Licensed under the MIT License
 */

export class N42Error extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'N42Error';
  }
}

export class NetworkError extends N42Error {
  constructor(message: string, cause?: Error) {
    super(message, 'NetworkTimeout', cause);
    this.name = 'NetworkError';
  }
}

export class InsufficientFundsError extends N42Error {
  constructor(message: string = 'Insufficient funds for transaction') {
    super(message, 'InsufficientFunds');
    this.name = 'InsufficientFundsError';
  }
}

export class NonceError extends N42Error {
  constructor(message: string = 'Nonce too low') {
    super(message, 'NonceTooLow');
    this.name = 'NonceError';
  }
}

export class TransactionRevertedError extends N42Error {
  constructor(message: string, public reason?: string) {
    super(message, 'Reverted');
    this.name = 'TransactionRevertedError';
  }
}

export class ReplacementUnderpricedError extends N42Error {
  constructor(message: string = 'Replacement transaction underpriced') {
    super(message, 'ReplacementUnderpriced');
    this.name = 'ReplacementUnderpricedError';
  }
}

export const Errors = {
  NetworkTimeout: 'NetworkTimeout',
  NonceTooLow: 'NonceTooLow',
  ReplacementUnderpriced: 'ReplacementUnderpriced',
  InsufficientFunds: 'InsufficientFunds',
  Reverted: 'Reverted',
} as const;

