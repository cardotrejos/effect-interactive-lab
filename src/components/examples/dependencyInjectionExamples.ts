export const effectDependencyInjectionExample = `// Effect - Type-safe dependency injection
interface Services {
  readonly api: HttpClient
  readonly db: Database  
  readonly ml: Recommender
  readonly logger: Logger
}

const program = Effect.gen(function* () {
  const { api, db, ml, logger } = yield* Effect.all({
    api: HttpClient,
    db: Database,
    ml: Recommender,
    logger: Logger
  })
  
  yield* logger.info("Starting dashboard load")
  
  const results = yield* Effect.all({
    user: api.get("/users/" + userId),
    orders: db.query("SELECT * FROM orders"),
    recs: ml.recommend(userId)
  })
  
  return results
})

// Provide different implementations
const test = program.pipe(
  Effect.provide(TestServices)
)

const live = program.pipe(
  Effect.provide(LiveServices)
)`

export const traditionalDependencyInjectionExample = `// Async/await - Manual dependency passing
interface Services {
  api: HttpClient
  db: Database  
  ml: Recommender
  logger: Logger
}

async function loadDashboard(
  userId: string,
  services: Services // Must pass everywhere
) {
  const { api, db, ml, logger } = services
  
  await logger.info("Starting dashboard load")
  
  const [user, orders, recs] = await Promise.all([
    api.get("/users/" + userId),
    db.query("SELECT * FROM orders"),
    ml.recommend(userId)
  ])
  
  return { user, orders, recs }
}

// Testing requires mocking
const mockServices = {
  api: { get: jest.fn() },
  db: { query: jest.fn() },
  ml: { recommend: jest.fn() },
  logger: { info: jest.fn() }
}

await loadDashboard("123", mockServices)`