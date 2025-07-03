/**
 * Interactive Examples: Tags, Context, and Layers in Effect
 * 
 * Run these examples to see how each concept works in practice.
 * Each example builds on the previous one.
 */

import { Effect, Context, Layer, pipe, Console } from 'effect'

// ═══════════════════════════════════════════════════════════════════════════
// Example 1: Understanding Tags
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n=== EXAMPLE 1: Understanding Tags ===\n")

// Step 1: Define a service interface
interface Calculator {
  add: (a: number, b: number) => number
  multiply: (a: number, b: number) => number
}

// Step 2: Create a Tag for this service
const CalculatorTag = Context.GenericTag<Calculator>("Calculator")

// The Tag has a unique identifier
console.log("Tag identifier:", CalculatorTag.key) // Output: "Calculator"

// Tags are just identifiers - they don't contain implementations
console.log("Tag is just an ID, not the service:", CalculatorTag)

// ═══════════════════════════════════════════════════════════════════════════
// Example 2: Creating and Using Context
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n=== EXAMPLE 2: Creating and Using Context ===\n")

// Create an implementation
const basicCalculator: Calculator = {
  add: (a, b) => a + b,
  multiply: (a, b) => a * b
}

// Create a Context with our service
const contextWithCalculator = Context.make(CalculatorTag, basicCalculator)

// Extract service from Context (for demonstration)
const extractedCalc = Context.get(contextWithCalculator, CalculatorTag)
console.log("2 + 3 =", extractedCalc.add(2, 3)) // Output: 5

// ═══════════════════════════════════════════════════════════════════════════
// Example 3: Using Services in Effect Programs
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n=== EXAMPLE 3: Using Services in Effect Programs ===\n")

// Create a program that uses the Calculator service
const calculationProgram = Effect.gen(function* () {
  // Request the Calculator service
  const calc = yield* CalculatorTag
  
  // Use the service
  const sum = calc.add(10, 20)
  const product = calc.multiply(5, 6)
  
  return { sum, product }
})

// Run the program with Context
Effect.runPromise(
  pipe(
    calculationProgram,
    Effect.provideContext(contextWithCalculator)
  )
).then(result => {
  console.log("Calculation results:", result) // { sum: 30, product: 30 }
})

// ═══════════════════════════════════════════════════════════════════════════
// Example 4: Multiple Services in Context
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n=== EXAMPLE 4: Multiple Services in Context ===\n")

// Define another service
interface Logger {
  info: (message: string) => Effect.Effect<void>
  error: (message: string) => Effect.Effect<void>
}

const LoggerTag = Context.GenericTag<Logger>("Logger")

// Create implementations
const consoleLogger: Logger = {
  info: (msg) => Console.log(`[INFO] ${msg}`),
  error: (msg) => Console.error(`[ERROR] ${msg}`)
}

// Build Context with multiple services
const fullContext = pipe(
  Context.empty(),
  Context.add(CalculatorTag, basicCalculator),
  Context.add(LoggerTag, consoleLogger)
)

// Program using multiple services
const multiServiceProgram = Effect.gen(function* () {
  const calc = yield* CalculatorTag
  const logger = yield* LoggerTag
  
  yield* logger.info("Starting calculations...")
  
  const result = calc.add(100, 200)
  
  yield* logger.info(`Result: ${result}`)
  
  return result
})

// Run with full context
Effect.runPromise(
  pipe(
    multiServiceProgram,
    Effect.provideContext(fullContext)
  )
)

// ═══════════════════════════════════════════════════════════════════════════
// Example 5: Introduction to Layers
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n=== EXAMPLE 5: Introduction to Layers ===\n")

// Layers are "recipes" for creating services

// Simple Layer
const CalculatorLayer = Layer.succeed(
  CalculatorTag,
  basicCalculator
)

// Layer with initialization
const LoggerLayer = Layer.effect(
  LoggerTag,
  Effect.gen(function* () {
    yield* Console.log("🚀 Initializing Logger...")
    
    return {
      info: (msg: string) => Console.log(`[INFO] ${msg}`),
      error: (msg: string) => Console.error(`[ERROR] ${msg}`)
    }
  })
)

// Use Layers instead of Context
const layeredProgram = Effect.gen(function* () {
  const logger = yield* LoggerTag
  const calc = yield* CalculatorTag
  
  yield* logger.info("Using services from Layers!")
  return calc.multiply(7, 8)
})

// Provide Layers to program
Effect.runPromise(
  pipe(
    layeredProgram,
    Effect.provide(Layer.merge(CalculatorLayer, LoggerLayer))
  )
).then(result => {
  console.log("Result from layered program:", result)
})

// ═══════════════════════════════════════════════════════════════════════════
// Example 6: Layers with Dependencies
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n=== EXAMPLE 6: Layers with Dependencies ===\n")

// Config service
interface Config {
  apiUrl: string
  timeout: number
}

const ConfigTag = Context.GenericTag<Config>("Config")

// API Client that depends on Config
interface ApiClient {
  get: (path: string) => Effect.Effect<unknown, Error>
}

const ApiClientTag = Context.GenericTag<ApiClient>("ApiClient")

// Layer with dependencies
const ApiClientLayer = Layer.effect(
  ApiClientTag,
  Effect.gen(function* () {
    // Request the Config dependency
    const config = yield* ConfigTag
    const logger = yield* LoggerTag
    
    yield* logger.info(`Initializing API client with URL: ${config.apiUrl}`)
    
    return {
      get: (path: string) => Effect.gen(function* () {
        yield* logger.info(`GET ${config.apiUrl}${path}`)
        // Simulate API call
        return { data: "mock response" }
      })
    }
  })
)

// Create config layer
const ConfigLayer = Layer.succeed(ConfigTag, {
  apiUrl: "https://api.example.com",
  timeout: 5000
})

// Compose layers with dependencies
const AppLayers = Layer.mergeAll(
  ConfigLayer,
  LoggerLayer,
  pipe(
    ApiClientLayer,
    // Provide dependencies to ApiClientLayer
    Layer.provide(ConfigLayer),
    Layer.provide(LoggerLayer)
  )
)

// Use the composed services
const apiProgram = Effect.gen(function* () {
  const api = yield* ApiClientTag
  const logger = yield* LoggerTag
  
  yield* logger.info("Making API request...")
  const response = yield* api.get("/users")
  
  return response
})

Effect.runPromise(
  pipe(
    apiProgram,
    Effect.provide(AppLayers)
  )
).then(response => {
  console.log("API Response:", response)
})

// ═══════════════════════════════════════════════════════════════════════════
// Example 7: Comparing Manual Approach vs Effect.Service
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n=== EXAMPLE 7: Manual vs Effect.Service ===\n")

// MANUAL APPROACH (what we've been doing)
namespace Manual {
  // 1. Interface
  interface PaymentService {
    charge: (amount: number) => Effect.Effect<string, Error>
  }
  
  // 2. Tag
  export const PaymentServiceTag = Context.GenericTag<PaymentService>("PaymentService")
  
  // 3. Layer
  export const PaymentServiceLayer = Layer.succeed(PaymentServiceTag, {
    charge: (amount) => Effect.succeed(`Charged $${amount}`)
  })
  
  // 4. Usage
  export const program = Effect.gen(function* () {
    const payment = yield* PaymentServiceTag
    return yield* payment.charge(99.99)
  })
}

// EFFECT.SERVICE APPROACH
namespace WithService {
  // All in one class!
  export class PaymentService extends Effect.Service<PaymentService>()("PaymentService", {
    succeed: {
      charge: (amount: number) => Effect.succeed(`Charged $${amount}`)
    }
  }) {}
  
  // Usage is almost identical
  export const program = Effect.gen(function* () {
    const payment = yield* PaymentService
    return yield* payment.charge(99.99)
  })
}

// Run both approaches
Promise.all([
  Effect.runPromise(pipe(Manual.program, Effect.provide(Manual.PaymentServiceLayer))),
  Effect.runPromise(pipe(WithService.program, Effect.provide(WithService.PaymentService.Default)))
]).then(([manual, service]) => {
  console.log("Manual approach result:", manual)
  console.log("Effect.Service result:", service)
  console.log("Both approaches produce the same result!")
})

// ═══════════════════════════════════════════════════════════════════════════
// Example 8: Real-World Pattern - Repository with Database
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n=== EXAMPLE 8: Real-World Repository Pattern ===\n")

// Domain model
interface User {
  id: string
  name: string
  email: string
}

// Database service
interface Database {
  query: <T>(sql: string, params: unknown[]) => Effect.Effect<T[], Error>
}

const DatabaseTag = Context.GenericTag<Database>("Database")

// User repository that depends on Database
interface UserRepository {
  findById: (id: string) => Effect.Effect<User | null, Error>
  save: (user: User) => Effect.Effect<void, Error>
}

const UserRepositoryTag = Context.GenericTag<UserRepository>("UserRepository")

// Database Layer (mock implementation)
const MockDatabaseLayer = Layer.succeed(DatabaseTag, {
  query: <T>(sql: string, params: unknown[]) => {
    console.log(`[DB] Executing: ${sql} with params:`, params)
    // Mock response
    if (sql.includes("SELECT")) {
      return Effect.succeed([{ id: "1", name: "John", email: "john@example.com" }] as T[])
    }
    return Effect.succeed([])
  }
})

// Repository Layer that depends on Database
const UserRepositoryLayer = Layer.effect(
  UserRepositoryTag,
  Effect.gen(function* () {
    const db = yield* DatabaseTag
    const logger = yield* LoggerTag
    
    return {
      findById: (id: string) => Effect.gen(function* () {
        yield* logger.info(`Finding user with id: ${id}`)
        const results = yield* db.query<User>(
          "SELECT * FROM users WHERE id = ?",
          [id]
        )
        return results[0] || null
      }),
      
      save: (user: User) => Effect.gen(function* () {
        yield* logger.info(`Saving user: ${user.name}`)
        yield* db.query(
          "INSERT INTO users (id, name, email) VALUES (?, ?, ?)",
          [user.id, user.name, user.email]
        )
      })
    }
  })
)

// Application layers
const RepositoryAppLayers = Layer.mergeAll(
  LoggerLayer,
  MockDatabaseLayer,
  pipe(
    UserRepositoryLayer,
    Layer.provide(MockDatabaseLayer),
    Layer.provide(LoggerLayer)
  )
)

// Business logic using repository
const findUserProgram = Effect.gen(function* () {
  const userRepo = yield* UserRepositoryTag
  const logger = yield* LoggerTag
  
  yield* logger.info("Starting user lookup...")
  
  const user = yield* userRepo.findById("1")
  
  if (user) {
    yield* logger.info(`Found user: ${user.name}`)
  } else {
    yield* logger.error("User not found")
  }
  
  return user
})

// Run the program
Effect.runPromise(
  pipe(
    findUserProgram,
    Effect.provide(RepositoryAppLayers)
  )
).then(user => {
  console.log("Final result:", user)
})

// ═══════════════════════════════════════════════════════════════════════════
// Summary: Key Concepts Demonstrated
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n=== SUMMARY ===\n")

console.log(`
Key Concepts Demonstrated:

1. TAGS are type-safe identifiers
   - Created with Context.GenericTag
   - Carry both identity and type information

2. CONTEXT is the runtime container
   - Built with Context.make or Context.add
   - Immutable - operations return new contexts

3. LAYERS are service factories
   - Layer.succeed for simple services
   - Layer.effect for services with initialization
   - Can depend on other services

4. DEPENDENCY INJECTION
   - Services can depend on other services
   - Layers handle the wiring automatically
   - Type-safe throughout

5. EFFECT.SERVICE
   - Convenience wrapper that creates Tag + Layer
   - Same runtime behavior, less boilerplate
   - Good for production code

Remember: Start with manual Tags/Context/Layers to understand,
then use Effect.Service for convenience in production!
`)

// Export for use in other files
export {
  CalculatorTag,
  LoggerTag,
  ConfigTag,
  ApiClientTag,
  DatabaseTag,
  UserRepositoryTag,
  AppLayers,
  RepositoryAppLayers
}