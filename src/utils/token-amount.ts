/**
 * TokenAmount utility for converting between human-readable and minimum units
 * 
 * Copyright (c) 2024 N42
 * Licensed under the MIT License
 */

import { TokenAmount } from '../types';

export class TokenAmountUtil {
  /**
   * Create TokenAmount from minimum units (wei/smallest unit)
   */
  static fromMinUnits(minUnits: bigint | string, decimals: number): TokenAmount {
    return {
      minUnits: typeof minUnits === 'string' ? BigInt(minUnits) : minUnits,
      decimals,
    };
  }

  /**
   * Create TokenAmount from decimal string (e.g., "123.4567")
   */
  static fromDecimal(decimal: string, decimals: number): TokenAmount {
    const [integerPart, decimalPart = ''] = decimal.split('.');
    const decimalPartPadded = decimalPart.padEnd(decimals, '0').slice(0, decimals);
    const minUnits = BigInt(integerPart + decimalPartPadded);
    return { minUnits, decimals };
  }

  /**
   * Convert to decimal string (human-readable)
   */
  static toDecimalString(amount: TokenAmount): string {
    const { minUnits, decimals } = amount;
    const divisor = BigInt(10 ** decimals);
    const quotient = minUnits / divisor;
    const remainder = minUnits % divisor;

    if (remainder === 0n) {
      return quotient.toString();
    }

    const remainderStr = remainder.toString().padStart(decimals, '0');
    const trimmedRemainder = remainderStr.replace(/0+$/, '');
    return trimmedRemainder ? `${quotient}.${trimmedRemainder}` : quotient.toString();
  }

  /**
   * Get minimum units as bigint
   */
  static toMinUnits(amount: TokenAmount): bigint {
    return amount.minUnits;
  }
}

