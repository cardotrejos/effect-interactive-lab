export const effectErrorHandlingExample = `// Effect - Automatic error handling & recovery
const dashboard = Effect.all({
  user: fetchUserProfile(userId),
  orders: queryDatabase(query),
  recs: getRecommendations(userId)
}, { concurrency: "unbounded" }).pipe(
  Effect.timeout("5 seconds"),
  Effect.retry({
    times: 3,
    delay: "exponential"
  }),
  Effect.catchTag("DatabaseError", () => 
    Effect.succeed({ orders: [] }) // Fallback
  )
)`

export const traditionalErrorHandlingExample = `// Async/await - Manual error handling everywhere
async function loadDashboard(userId: string) {
  try {
    const results = await Promise.race([
      Promise.all([
        fetchUserProfile(userId).catch(e => {
          console.error('User fetch failed:', e)
          throw e
        }),
        queryDatabase(query).catch(e => {
          if (e.name === 'DatabaseError') {
            return { orders: [] } // Fallback
          }
          throw e
        }),
        getRecommendations(userId).catch(e => {
          console.error('Recs failed:', e)
          throw e
        })
      ]),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ])
    
    return results
  } catch (error) {
    // Manual retry logic would go here...
    throw error
  }
}`