/**
 * Retry utility with exponential backoff
 * 
 * Copyright (c) 2024 N42
 * Licensed under the MIT License
 */

import { RetryConfig } from '../types';

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
  isIdempotent: boolean = true
): Promise<T> {
  if (!isIdempotent) {
    // Non-idempotent operations (like transactions) should not be retried
    return fn();
  }

  const maxAttempts = config.maxAttempts || 5;
  let attempt = 0;
  let lastError: Error;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      attempt++;

      if (attempt >= maxAttempts) {
        throw lastError;
      }

      const delay = calculateDelay(config, attempt);
      await sleep(delay);
    }
  }

  throw lastError!;
}

function calculateDelay(config: RetryConfig, attempt: number): number {
  if (config.type === 'exponential') {
    const delay = Math.min(config.baseMs * Math.pow(2, attempt - 1), config.maxMs);
    return delay;
  }
  return config.baseMs;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

