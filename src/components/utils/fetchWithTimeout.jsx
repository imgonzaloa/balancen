/**
 * Wraps a promise with a timeout
 * Rejects if the promise doesn't resolve within the specified time
 */
export function withTimeout(promise, ms = 3000, errorMessage = 'Operation timed out') {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), ms)
    )
  ]);
}

/**
 * Wraps a fetch with timeout and error handling
 * Always returns { data, error } - never throws
 */
export async function safeFetch(fetchFn, timeoutMs = 3000) {
  try {
    const data = await withTimeout(fetchFn(), timeoutMs);
    return { data, error: null };
  } catch (err) {
    return { 
      data: null, 
      error: {
        message: err.message || 'Unknown error',
        code: err.code || 'FETCH_ERROR'
      }
    };
  }
}