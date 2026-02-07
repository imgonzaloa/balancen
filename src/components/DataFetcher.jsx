/**
 * Optimized data fetching with timeouts and fallback strategies
 * Prevents white screens and blocked navigation
 */

import { useQuery } from '@tanstack/react-query';

const FETCH_TIMEOUT = 8000; // 8 seconds max per request

/**
 * Wrap promise with timeout
 */
export function withTimeout(promise, ms = FETCH_TIMEOUT) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Fetch timeout')), ms)
    )
  ]);
}

/**
 * Fetch with automatic retry (max 2 times)
 */
export async function fetchWithRetry(fn, maxRetries = 2) {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await withTimeout(fn());
    } catch (err) {
      lastError = err;
      if (i < maxRetries) {
        await new Promise(r => setTimeout(r, 500 * (i + 1))); // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

/**
 * Safe query hook with timeout and fallback
 */
export function useSafeQuery(options) {
  return useQuery({
    ...options,
    retry: (failureCount, error) => {
      // Only retry on timeout, not on auth/not found
      if (error?.message === 'Fetch timeout' && failureCount < 2) {
        return true;
      }
      return false;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
    ...options
  });
}