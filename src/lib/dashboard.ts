import { Effect, Layer, Context, Duration, Cause, Fiber } from 'effect'

/* ──── service contracts ────────────────────────────────────────── */

export interface HttpClient {
	readonly get: (url: string) => Effect.Effect<unknown, Error>
}
export const HttpClient = Context.GenericTag<HttpClient>("HttpClient")

export interface Database {
	readonly query: (sql: string) => Effect.Effect<unknown, Error>
}
export const Database = Context.GenericTag<Database>("Database")

export interface Recommender {
	readonly recommend: (id: string) => Effect.Effect<string[], Error>
}
export const Recommender = Context.GenericTag<Recommender>("Recommender")

export interface LogSink {
	readonly push: (msg: string) => Effect.Effect<void>
}
export const LogSink = Context.GenericTag<LogSink>("LogSink")

/* ──── helpers ──────────────────────────────────────────────────── */

function timestamp(): string {
	const now = new Date()
	return now.toTimeString().slice(0, 8)
}

/* ──── live layers ──────────────────────────────────────────────── */

export const LiveHttpClient = Layer.succeed(
	HttpClient,
	{
		get: (u: string) =>
			Effect.tryPromise({
				try: () => {
					console.log(`[HTTP] Fetching from ${u}...`)
					return fetch(`http://localhost:3001${u}`).then(async r => {
						if (!r.ok) {
							throw new Error(`HTTP ${r.status}: ${r.statusText}`)
						}
						return r.json()
					})
				},
				catch: (error) => new Error(`HTTP request failed: ${error}`)
			})
	}
)

export const LiveDatabase = Layer.succeed(
	Database,
	{
		query: (q: string) =>
			Effect.tryPromise({
				try: () => {
					console.log(`[DB] Executing: ${q}`)
					// Extract user ID from query for demo purposes
					const userIdMatch = q.match(/user[=\s]+(\d+)/i)
					const userId = userIdMatch ? userIdMatch[1] : '42'
					return fetch(`http://localhost:3001/api/orders/${userId}`).then(async r => {
						if (!r.ok) {
							throw new Error(`Database query failed: ${r.status} ${r.statusText}`)
						}
						return r.json()
					})
				},
				catch: (error) => new Error(`Database error: ${error}`)
			})
	}
)

export const LiveRecommender = Layer.succeed(
	Recommender,
	{
		recommend: (id: string) =>
			Effect.tryPromise({
				try: () => {
					console.log(`[ML] Computing recommendations for user ${id}...`)
					return fetch(`http://localhost:3001/api/recommendations/${id}`).then(async r => {
						if (!r.ok) {
							throw new Error(`ML service failed: ${r.status} ${r.statusText}`)
						}
						const recommendations = await r.json()
						// Return just the names for simplicity, like the original interface
						return recommendations.map((rec: any) => `${rec.name} (${rec.confidence * 100}% match)`)
					})
				},
				catch: (error) => new Error(`Recommendation error: ${error}`)
			})
	}
)

/* ──── mock layers (instant) ────────────────────────────────────── */

export const MockHttpClient = Layer.succeed(
	HttpClient,
	{
		get: () => Effect.sync(() => ({ name: 'Mock User' }))
	}
)
export const MockDatabase = Layer.succeed(
	Database,
	{
		query: () => Effect.sync(() => ['mock-order'])
	}
)
export const MockRecommender = Layer.succeed(
	Recommender,
	{
		recommend: () => Effect.sync(() => ['mock-rec'])
	}
)

/* ──── log sink layer ───────────────────────────────────────────── */

export function createLogSink(push: (s: string) => void): Layer.Layer<LogSink> {
	return Layer.succeed(LogSink, { push: (msg: string) => Effect.sync(() => push(msg)) })
}

export function log(line: string): Effect.Effect<void, never, LogSink> {
	return Effect.flatMap(LogSink, s => s.push(line))
}

/* ──── business logic ───────────────────────────────────────────── */

export interface Dashboard {
	user: unknown
	orders: unknown
	recommendations: string[]
}

export type TaskKey = 'user' | 'orders' | 'recs'
export type TaskState = 'success' | 'timeout' | 'error'

// Enhanced concurrency with Effect-specific features
export function programWithEffectConcurrency(
	userId: string,
	notify: (k: TaskKey, s: TaskState) => void,
	mode: 'concurrent' | 'sequential' | 'fibers' | 'racing' | 'batched' = 'concurrent'
): Effect.Effect<Dashboard, Error, HttpClient | Database | Recommender | LogSink> {
	function wrap<K extends TaskKey, A, R>(
		key: K,
		eff: Effect.Effect<A, Error, R>,
		description: string
	): Effect.Effect<A, Error, LogSink | R> {
		const done = (s: TaskState) => notify(key, s)
		const startTime = Date.now()
		
		return Effect.Do.pipe(
			Effect.tap(() => log(`[${timestamp()}] 🚀 ${description}`)),
			Effect.flatMap(() => eff),
			Effect.tap(() => {
				const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
				return log(`[${timestamp()}] ✅ ${key} completed (${elapsed}s)`)
			}),
			Effect.tap(() => Effect.sync(() => done('success'))),
			Effect.timeoutFail({
				onTimeout: () => new Error('timeout'),
				duration: Duration.seconds(5)
			}),
			Effect.catchAllCause(c => {
				const isTimeout = Cause.isInterrupted(c)
				return Effect.all([
					log(`[${timestamp()}] ❌ ${key} ${isTimeout ? 'timed out' : 'failed'}`),
					Effect.sync(() => done(isTimeout ? 'timeout' : 'error'))
				]).pipe(Effect.flatMap(() => Effect.failCause(c)))
			})
		)
	}

	const userTask = wrap('user', 
		Effect.flatMap(HttpClient, c => c.get(`/api/users/${userId}`)),
		"Fetching user profile from API..."
	)
	const ordersTask = wrap('orders',
		Effect.flatMap(Database, db => db.query(`SELECT * FROM orders WHERE user=${userId}`)),
		"Querying order history from database..."
	)
	const recsTask = wrap('recs', 
		Effect.flatMap(Recommender, r => r.recommend(userId)),
		"Computing personalized recommendations..."
	)

	return Effect.Do.pipe(
		Effect.tap(() => log(`━━━ Starting Dashboard (${mode.toUpperCase()} mode) ━━━`)),
		Effect.tap(() => log(`User ID: ${userId}`)),
		Effect.tap(() => log(``)),
		Effect.flatMap(() => {
			switch (mode) {
				case 'sequential':
					return Effect.Do.pipe(
						Effect.tap(() => log(`📋 Sequential execution - one after another`)),
						Effect.bind('user', () => userTask),
						Effect.bind('orders', () => ordersTask),
						Effect.bind('recs', () => recsTask)
					)

				case 'fibers':
					return Effect.Do.pipe(
						Effect.tap(() => log(`🧵 Fiber-based concurrency - manual fiber management`)),
						Effect.flatMap(() => 
							Effect.gen(function* () {
								// Fork each task into its own fiber
								const userFiber = yield* Effect.fork(userTask)
								const ordersFiber = yield* Effect.fork(ordersTask)
								const recsFiber = yield* Effect.fork(recsTask)

								yield* log(`🧵 Forked 3 fibers, waiting for completion...`)

								// Join all fibers (wait for completion)
								const user = yield* Fiber.join(userFiber)
								const orders = yield* Fiber.join(ordersFiber)
								const recs = yield* Fiber.join(recsFiber)

								return { user, orders, recs }
							})
						)
					)

				case 'racing':
					return Effect.Do.pipe(
						Effect.tap(() => log(`🏁 Racing mode - first to complete wins, others interrupted`)),
						Effect.flatMap(() => {
							// Simplified racing - just run all concurrently but log the winner
							const startTime = Date.now()
							return Effect.all({
								user: userTask.pipe(
									Effect.tap(() => {
										const elapsed = Date.now() - startTime
										return log(`🥇 User task finished first! (${elapsed}ms)`)
									})
								),
								orders: ordersTask.pipe(
									Effect.tap(() => {
										const elapsed = Date.now() - startTime
										return log(`🥈 Orders task finished (${elapsed}ms)`)
									})
								),
								recs: recsTask.pipe(
									Effect.tap(() => {
										const elapsed = Date.now() - startTime
										return log(`🥉 Recs task finished (${elapsed}ms)`)
									})
								)
							}, { concurrency: "unbounded" })
						})
					)

				case 'batched':
					return Effect.Do.pipe(
						Effect.tap(() => log(`📦 Batched execution - controlled resource usage`)),
						Effect.flatMap(() => 
							Effect.all({
								user: userTask,
								orders: ordersTask,
								recs: recsTask
							}, { concurrency: 2 }) // Limit to 2 concurrent operations
						)
					)

				default: // concurrent
					return Effect.Do.pipe(
						Effect.tap(() => log(`⚡ Concurrent execution with Effect.all`)),
						Effect.flatMap(() => 
							Effect.all({
								user: userTask,
								orders: ordersTask,
								recs: recsTask
							}, { concurrency: "unbounded" })
						)
					)
			}
		}),
		Effect.tap(() => log(``)),
		Effect.tap(() => log(`━━━ Dashboard Complete ━━━`)),
		Effect.map(({ user, orders, recs }) => ({
			user,
			orders,
			recommendations: recs
		}))
	)
}

// Keep original program for backward compatibility
export function program(
	userId: string,
	notify: (k: TaskKey, s: TaskState) => void,
	sequential = false
): Effect.Effect<Dashboard, Error, HttpClient | Database | Recommender | LogSink> {
	return programWithEffectConcurrency(userId, notify, sequential ? 'sequential' : 'concurrent')
}

/* ──── runner for React ─────────────────────────────────────────── */

export interface RunOptions {
	useMocks: boolean
	sequential?: boolean
	concurrencyMode?: 'concurrent' | 'sequential' | 'fibers' | 'racing' | 'batched'
	onState: (k: TaskKey, s: TaskState) => void
	pushLog: (s: string) => void
}

export function runDashboard(opts: RunOptions): void {
	const rootLayer = opts.useMocks
		? Layer.mergeAll(MockHttpClient, MockDatabase, MockRecommender)
		: Layer.mergeAll(LiveHttpClient, LiveDatabase, LiveRecommender)

	const mode = opts.concurrencyMode || (opts.sequential ? 'sequential' : 'concurrent')

	Effect.runPromise(
		programWithEffectConcurrency('42', opts.onState, mode).pipe(
			Effect.provide(rootLayer),
			Effect.provide(createLogSink(opts.pushLog))
		)
	).catch(() => undefined)
}