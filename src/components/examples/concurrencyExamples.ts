import type { ConcurrencyMode } from '../../types/dashboard'

export function getConcurrencyExample(mode: ConcurrencyMode): string {
	switch (mode) {
		case 'concurrent':
			return `// Standard concurrent - all tasks start immediately
const dashboard = Effect.all({
  user: fetchUserProfile(userId),
  orders: queryDatabase("SELECT * FROM orders"),
  recs: getRecommendations(userId)
}, { 
  concurrency: "unbounded"  // All tasks run in parallel
})`

		case 'sequential':
			return `// Sequential pipeline - tasks run one after another
const dashboard = Effect.Do.pipe(
  Effect.bind('user', () => fetchUserProfile(userId)),
  Effect.bind('orders', () => queryDatabase("...")),
  Effect.bind('recs', () => getRecommendations(userId))
)
// 1st: user → 2nd: orders → 3rd: recs`

		case 'fibers':
			return `// Manual fiber control - fork and join
const dashboard = Effect.gen(function* () {
  // Fork each task into its own fiber
  const userFiber = yield* Effect.fork(fetchUserProfile(userId))
  const ordersFiber = yield* Effect.fork(queryDatabase("..."))
  const recsFiber = yield* Effect.fork(getRecommendations(userId))

  // Join all fibers (wait for completion)
  const user = yield* Fiber.join(userFiber)
  const orders = yield* Fiber.join(ordersFiber)
  const recs = yield* Fiber.join(recsFiber)

  return { user, orders, recs }
})`

		case 'racing':
			return `// Racing pattern - first wins, others continue
const dashboard = Effect.race(
  fetchUserProfile(userId).pipe(
    Effect.map(user => ({ type: 'user', user }))
  ),
  Effect.race(
    queryDatabase("...").pipe(
      Effect.map(orders => ({ type: 'orders', orders }))
    ),
    getRecommendations(userId).pipe(
      Effect.map(recs => ({ type: 'recs', recs }))
    )
  )
).pipe(
  Effect.flatMap(winner => {
    // Continue with remaining tasks after winner
    const remaining = winner.type === 'user' 
      ? Effect.all({ orders: queryDatabase("..."), recs: getRecommendations(userId) })
      : // ... handle other winners
    return remaining.pipe(Effect.map(rest => ({ ...winner, ...rest })))
  })
)`

		case 'batched':
			return `// Controlled batching - limit concurrent operations
const dashboard = Effect.forEach(
  [
    { key: 'user', task: fetchUserProfile(userId) },
    { key: 'orders', task: queryDatabase("...") },
    { key: 'recs', task: getRecommendations(userId) }
  ],
  ({ task }) => task,
  { concurrency: 2 } // Limit to 2 concurrent operations
).pipe(
  Effect.map(([user, orders, recs]) => ({ user, orders, recs }))
)`

		default:
			return ''
	}
}

export function getTraditionalExample(mode: ConcurrencyMode): string {
	switch (mode) {
		case 'concurrent':
			return `// Promise.all - basic but no control over execution
async function loadDashboard(userId: string) {
  const [user, orders, recs] = await Promise.all([
    fetchUserProfile(userId),
    queryDatabase("SELECT * FROM orders WHERE user=" + userId),
    getRecommendations(userId)
  ])
  
  return { user, orders, recs }
}`

		case 'sequential':
			return `// Sequential async/await - natural but limited
async function loadDashboard(userId: string) {
  const user = await fetchUserProfile(userId)
  const orders = await queryDatabase("SELECT * FROM orders WHERE user=" + userId)
  const recs = await getRecommendations(userId)
  
  return { user, orders, recs }
}`

		case 'fibers':
			return `// Manual thread/worker management - very complex!
import { Worker } from 'worker_threads'

async function loadDashboard(userId: string) {
  const workers = [
    new Worker('./fetch-user-worker.js', { workerData: { userId } }),
    new Worker('./db-query-worker.js', { workerData: { userId } }),
    new Worker('./recs-worker.js', { workerData: { userId } })
  ]
  
  const results = await Promise.all(
    workers.map(worker => new Promise((resolve, reject) => {
      worker.on('message', resolve)
      worker.on('error', reject)
      worker.on('exit', code => {
        if (code !== 0) reject(new Error(\`Worker exited with code \${code}\`))
      })
    }))
  )
  
  // Manual cleanup
  workers.forEach(w => w.terminate())
  
  return { user: results[0], orders: results[1], recs: results[2] }
}`

		case 'racing':
			return `// Promise.race with manual continuation - error-prone
async function loadDashboard(userId: string) {
  const tasks = [
    fetchUserProfile(userId).then(user => ({ type: 'user', user })),
    queryDatabase("...").then(orders => ({ type: 'orders', orders })),
    getRecommendations(userId).then(recs => ({ type: 'recs', recs }))
  ]
  
  const winner = await Promise.race(tasks)
  
  // Manual logic to continue with remaining tasks
  const remaining = tasks.filter(t => {
    // How do we know which task won? Complex state tracking needed...
  })
  
  const remainingResults = await Promise.all(remaining)
  
  // Manual merging logic...
  return mergeResults(winner, remainingResults)
}`

		case 'batched':
			return `// Custom batching - lots of manual coordination
class BatchProcessor {
  private queue: Task[] = []
  private running = 0
  private readonly maxConcurrency = 2
  
  async process(tasks: Task[]) {
    return new Promise((resolve, reject) => {
      this.queue.push(...tasks)
      this.processBatch(resolve, reject)
    })
  }
  
  private async processBatch(resolve: Function, reject: Function) {
    while (this.queue.length > 0 && this.running < this.maxConcurrency) {
      const task = this.queue.shift()!
      this.running++
      
      try {
        const result = await task.execute()
        // Manual result collection and coordination...
        this.running--
        
        if (this.queue.length === 0 && this.running === 0) {
          resolve(/* collected results */)
        }
      } catch (error) {
        this.running--
        reject(error)
      }
    }
  }
}

// Usage - requires manual setup
const processor = new BatchProcessor()
const results = await processor.process([
  { execute: () => fetchUserProfile(userId) },
  { execute: () => queryDatabase("...") },
  { execute: () => getRecommendations(userId) }
])`

		default:
			return ''
	}
}

export function getConcurrencyTitle(mode: ConcurrencyMode): string {
	switch (mode) {
		case 'concurrent':
			return 'Effect.all - Standard Concurrent'
		case 'sequential':
			return 'Effect.bind - Sequential Pipeline'
		case 'fibers':
			return 'Fiber.fork - Manual Control'
		case 'racing':
			return 'Effect.race - Winner Takes All'
		case 'batched':
			return 'Effect.forEach - Controlled Batching'
		default:
			return ''
	}
}

export function getTraditionalTitle(mode: ConcurrencyMode): string {
	switch (mode) {
		case 'concurrent':
			return 'Promise.all - Basic Concurrent'
		case 'sequential':
			return 'Async/Await - Sequential'
		case 'fibers':
			return 'Manual Threading (Complex!)'
		case 'racing':
			return 'Promise.race + Manual Logic'
		case 'batched':
			return 'Custom Batching Implementation'
		default:
			return ''
	}
}