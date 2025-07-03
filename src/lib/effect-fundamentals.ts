/**
 * Effect Fundamentals: Understanding Tags, Context, and Layers
 * 
 * This guide explains the core concepts that power Effect's dependency injection
 * system BEFORE using the convenient Effect.Service helper.
 */

import { Effect, Context, Layer, pipe } from 'effect'

// ═══════════════════════════════════════════════════════════════════════════
// 1. TAGS - Type-safe identifiers for services
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A Tag is like a "key" that identifies a service in the Effect system.
 * Think of it as a type-safe string that points to a specific service.
 * 
 * Tags solve the problem: "How do I request a specific service?"
 */

// Define a service interface
interface Logger {
  log: (message: string) => Effect.Effect<void>
}

// Create a Tag for this service
// This Tag acts as both:
// 1. A unique identifier (the string "Logger")
// 2. A type carrier (it knows the type is Logger)
const LoggerTag = Context.GenericTag<Logger>("Logger")

// Tags are reusable and globally unique
console.log("Tag identifier:", LoggerTag.key) // "Logger"

// ═══════════════════════════════════════════════════════════════════════════
// 2. CONTEXT - The runtime container for services
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Context is like a Map that holds services at runtime.
 * It's immutable and type-safe.
 * 
 * Context solves: "Where do I store all my services?"
 */

// Create a Logger implementation
const consoleLogger: Logger = {
  log: (message) => Effect.sync(() => console.log(`[LOG] ${message}`))
}

// Create a Context with our service
const context1 = Context.make(LoggerTag, consoleLogger)

// You can add multiple services to a Context
interface Database {
  query: (sql: string) => Effect.Effect<unknown[]>
}

const DatabaseTag = Context.GenericTag<Database>("Database")

const mockDatabase: Database = {
  query: (sql) => Effect.succeed([{ id: 1, name: "Test" }])
}

// Contexts are immutable - adding returns a new Context
const context2 = pipe(
  context1,
  Context.add(DatabaseTag, mockDatabase)
)

// ═══════════════════════════════════════════════════════════════════════════
// 3. USING SERVICES - How to access services from Context
// ═══════════════════════════════════════════════════════════════════════════

/**
 * To use a service, you need to:
 * 1. Request it using its Tag
 * 2. Provide the Context that contains it
 */

// Example 1: Basic service usage
const program1 = Effect.gen(function* () {
  // Request the Logger service using its Tag
  const logger = yield* LoggerTag
  
  // Use the service
  yield* logger.log("Hello from Effect!")
  
  return "Done"
})

// To run this program, we need to provide the Context
Effect.runPromise(
  pipe(
    program1,
    Effect.provideContext(context1) // Provide the Context containing Logger
  )
)

// Example 2: Using multiple services
const program2 = Effect.gen(function* () {
  const logger = yield* LoggerTag
  const db = yield* DatabaseTag
  
  yield* logger.log("Querying database...")
  const results = yield* db.query("SELECT * FROM users")
  yield* logger.log(`Found ${results.length} users`)
  
  return results
})

// This needs a Context with BOTH services
Effect.runPromise(
  pipe(
    program2,
    Effect.provideContext(context2) // context2 has both Logger and Database
  )
)

// ═══════════════════════════════════════════════════════════════════════════
// 4. LAYERS - Composable service construction
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Layers are "recipes" for creating services.
 * They handle:
 * - Service initialization
 * - Dependency management
 * - Resource cleanup
 * 
 * Layers solve: "How do I manage service creation and dependencies?"
 */

// Example 1: Simple Layer
const ConsoleLoggerLayer = Layer.succeed(
  LoggerTag,
  consoleLogger
)

// Example 2: Layer with initialization logic
const FileLoggerLayer = Layer.effect(
  LoggerTag,
  Effect.sync(() => {
    console.log("Initializing file logger...")
    
    return {
      log: (message) => Effect.sync(() => {
        // In real app, write to file
        console.log(`[FILE] ${message}`)
      })
    }
  })
)

// Example 3: Layer with dependencies
interface Config {
  logLevel: 'debug' | 'info' | 'error'
}

const ConfigTag = Context.GenericTag<Config>("Config")

// This Logger depends on Config
const ConfigurableLoggerLayer = Layer.effect(
  LoggerTag,
  Effect.gen(function* () {
    // Request the Config dependency
    const config = yield* ConfigTag
    
    return {
      log: (message) => Effect.sync(() => {
        if (config.logLevel === 'debug') {
          console.log(`[DEBUG] ${message}`)
        } else {
          console.log(`[${config.logLevel.toUpperCase()}] ${message}`)
        }
      })
    }
  })
)

// To use ConfigurableLoggerLayer, we need to provide Config
const ConfigLayer = Layer.succeed(ConfigTag, { logLevel: 'debug' })

// Compose layers
const AppLayer = pipe(
  ConfigurableLoggerLayer,
  Layer.provide(ConfigLayer) // Provide Config to Logger
)

// ═══════════════════════════════════════════════════════════════════════════
// 5. LAYER COMPOSITION - Building complex dependency graphs
// ═══════════════════════════════════════════════════════════════════════════

// Real-world example: API service that depends on Logger and Config
interface ApiClient {
  get: (url: string) => Effect.Effect<unknown, Error>
}

const ApiClientTag = Context.GenericTag<ApiClient>("ApiClient")

const ApiClientLayer = Layer.effect(
  ApiClientTag,
  Effect.gen(function* () {
    const logger = yield* LoggerTag
    const config = yield* ConfigTag
    
    yield* logger.log("Initializing API client...")
    
    return {
      get: (url) => Effect.gen(function* () {
        yield* logger.log(`GET ${url}`)
        
        // Simulate API call
        if (config.logLevel === 'debug') {
          yield* logger.log(`Headers: { Authorization: Bearer ... }`)
        }
        
        return { data: "response" }
      })
    }
  })
)

// Compose all layers for the application
const FullAppLayer = Layer.mergeAll(
  ConfigLayer,
  ConsoleLoggerLayer,
  pipe(ApiClientLayer, Layer.provide(ConfigLayer), Layer.provide(ConsoleLoggerLayer))
)

// Use in a program
const apiProgram = Effect.gen(function* () {
  const api = yield* ApiClientTag
  const logger = yield* LoggerTag
  
  yield* logger.log("Starting API calls...")
  const result = yield* api.get("/users")
  
  return result
})

// ═══════════════════════════════════════════════════════════════════════════
// 6. COMPARISON: Manual vs Effect.Service
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Now that you understand Tags, Context, and Layers, 
 * let's see how Effect.Service simplifies this pattern
 */

// MANUAL APPROACH (what we've been doing):
// 1. Define interface
interface EmailService {
  send: (to: string, subject: string) => Effect.Effect<void, Error>
}

// 2. Create Tag
const EmailServiceTag = Context.GenericTag<EmailService>("EmailService")

// 3. Create Layer
const EmailServiceLayer = Layer.succeed(EmailServiceTag, {
  send: (to, subject) => Effect.sync(() => 
    console.log(`Sending email to ${to}: ${subject}`)
  )
})

// 4. Use in program
const manualProgram = Effect.gen(function* () {
  const email = yield* EmailServiceTag
  yield* email.send("user@example.com", "Welcome!")
})

// WITH Effect.Service (the convenient helper):
class EmailServiceClass extends Effect.Service<EmailServiceClass>()("EmailService", {
  succeed: {
    send: (to: string, subject: string) => 
      Effect.sync(() => console.log(`Sending email to ${to}: ${subject}`))
  }
}) {}

// That's it! Effect.Service creates:
// - The Tag (EmailServiceClass is the Tag)
// - The Layer (EmailServiceClass.Default)
// - Type inference for the service

const serviceProgram = Effect.gen(function* () {
  const email = yield* EmailServiceClass
  yield* email.send("user@example.com", "Welcome!")
})

// ═══════════════════════════════════════════════════════════════════════════
// 7. KEY INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 1. TAGS are type-safe identifiers for services
 *    - They're like "keys" in a type-safe map
 *    - They carry both identity and type information
 * 
 * 2. CONTEXT is the runtime container
 *    - It's an immutable Map<Tag, Service>
 *    - You build it up by adding services
 * 
 * 3. LAYERS are service factories
 *    - They describe how to create services
 *    - They can depend on other services
 *    - They're composable and reusable
 * 
 * 4. Effect.Service is just a convenience
 *    - It bundles Tag + Layer creation
 *    - Under the hood, it uses the same Context system
 *    - You lose some flexibility but gain convenience
 * 
 * Understanding these fundamentals helps you:
 * - Debug dependency injection issues
 * - Create more complex service architectures
 * - Know when to use manual approach vs Effect.Service
 */

// ═══════════════════════════════════════════════════════════════════════════
// 8. PRACTICAL EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════

// Example: Building a small app with proper separation
namespace TodoApp {
  // Domain types
  interface Todo {
    id: string
    title: string
    completed: boolean
  }

  // Service interfaces
  interface TodoRepository {
    findAll: () => Effect.Effect<Todo[]>
    save: (todo: Todo) => Effect.Effect<void>
  }

  interface NotificationService {
    notify: (message: string) => Effect.Effect<void>
  }

  // Tags
  const TodoRepositoryTag = Context.GenericTag<TodoRepository>("TodoRepository")
  const NotificationServiceTag = Context.GenericTag<NotificationService>("NotificationService")

  // Layer implementations
  const InMemoryTodoRepository = Layer.sync(TodoRepositoryTag, () => {
    const todos: Todo[] = []
    
    return {
      findAll: () => Effect.succeed(todos),
      save: (todo) => Effect.sync(() => { todos.push(todo) })
    }
  })

  const ConsoleNotificationService = Layer.succeed(NotificationServiceTag, {
    notify: (message) => Effect.sync(() => console.log(`🔔 ${message}`))
  })

  // Business logic that uses services
  const createTodo = (title: string) => Effect.gen(function* () {
    const repo = yield* TodoRepositoryTag
    const notifications = yield* NotificationServiceTag
    
    const todo: Todo = {
      id: Math.random().toString(),
      title,
      completed: false
    }
    
    yield* repo.save(todo)
    yield* notifications.notify(`New todo created: ${title}`)
    
    return todo
  })

  // Compose all layers
  const AppLayers = Layer.mergeAll(
    InMemoryTodoRepository,
    ConsoleNotificationService
  )

  // Run the application
  const program = pipe(
    createTodo("Learn Effect Tags, Context, and Layers"),
    Effect.provide(AppLayers)
  )

  // Effect.runPromise(program)
}

// Export example functions for testing
export { 
  program1, 
  program2, 
  apiProgram,
  manualProgram,
  serviceProgram,
  ConsoleLoggerLayer,
  FullAppLayer
}