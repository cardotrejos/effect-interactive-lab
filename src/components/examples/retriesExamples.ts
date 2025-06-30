export const effectRetriesExample = `// Effect - Declarative retry with backoff
const resilientFetch = Effect.retry(
  fetchUserProfile(userId),
  {
    times: 3,
    delay: Schedule.exponential("100 millis"),
    while: (error) => !isFatal(error)
  }
)

// With circuit breaker
const protected = Effect.all([
  apiCall1.pipe(Effect.withCircuitBreaker(breaker)),
  apiCall2.pipe(Effect.withCircuitBreaker(breaker)),
  apiCall3.pipe(Effect.withCircuitBreaker(breaker))
])`

export const traditionalRetriesExample = `// Async/await - Complex manual retry logic
async function fetchWithRetry<T>(
  fn: () => Promise<T>, 
  retries = 3
): Promise<T> {
  let lastError: Error
  let delay = 100
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (isFatal(error) || i === retries - 1) throw error
      
      await new Promise(r => setTimeout(r, delay))
      delay *= 2 // exponential backoff
    }
  }
  
  throw lastError!
}

// Usage requires wrapping every call
const user = await fetchWithRetry(() => fetchUserProfile(userId))`