/**
 * Gas utility functions
 * 
 * Copyright (c) 2024 N42
 * Licensed under the MIT License
 */

export class Gwei {
  /**
   * Convert Gwei to Wei
   */
  static toWei(gwei: number): bigint {
    return BigInt(Math.floor(gwei * 1e9));
  }

  /**
   * Convert Wei to Gwei
   */
  static fromWei(wei: bigint): number {
    return Number(wei) / 1e9;
  }
}

export function parseGasValue(value: bigint | string | number | undefined): bigint | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'string') {
    // Support "2.5" gwei format
    if (value.includes('.')) {
      return Gwei.toWei(parseFloat(value));
    }
    return BigInt(value);
  }
  return BigInt(value);
}

