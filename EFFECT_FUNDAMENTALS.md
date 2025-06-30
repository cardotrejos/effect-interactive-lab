# Effect Fundamentals: Tags, Context, and Layers

> **💡 Learning Recommendation**: I recommend learning how Tags, Context, and Layers all interact before diving into `Effect.Service` for anybody learning Effect. IMO, as a newbie, it's better to understand what the helper is doing before using the helper.

This guide explains the fundamental building blocks of Effect's dependency injection system. Understanding these concepts will make `Effect.Service` and other Effect patterns much clearer.

## 📋 Table of Contents

1. [Tags - Service Identifiers](#tags---service-identifiers)
2. [Context - The Service Container](#context---the-service-container)  
3. [Layers - Service Implementations](#layers---service-implementations)
4. [How They Work Together](#how-they-work-together)
5. [Practical Examples](#practical-examples)
6. [Common Patterns](#common-patterns)
7. [Ready for Effect.Service](#ready-for-effectservice)

---

## Tags - Service Identifiers

**What is a Tag?** A Tag is like a "key" or "identifier" that uniquely identifies a service type in Effect's dependency injection system.

### Basic Tag Creation

```typescript
import { Context } from 'effect'

// Define your service interface
interface HttpClient {
  readonly get: (url: string) => Effect.Effect<unknown, Error>
}

// Create a Tag for this service
export const HttpClient = Context.GenericTag<HttpClient>("HttpClient")
```

### What's happening here?

```typescript
// Think of a Tag like this:
const HttpClient = {
  key: "HttpClient",           // Unique identifier
  stack: () => new Error().stack, // For debugging
  // Internal Effect machinery...
}
```

### Tags vs Traditional DI

```typescript
// ❌ Traditional approach - manual passing
interface Services {
  httpClient: HttpClient
  database: Database
}

function myFunction(services: Services) {
  return services.httpClient.get("/api/data")
}

// ✅ Effect approach - Tags as identifiers
const HttpClient = Context.GenericTag<HttpClient>("HttpClient")
const Database = Context.GenericTag<Database>("Database")

const myEffect = Effect.flatMap(HttpClient, client => 
  client.get("/api/data")
)
```

---

## Context - The Service Container

**What is Context?** Context is Effect's "service container" - it holds all the available services that your Effect can access.

### Understanding Context

```typescript
// Context is like a Map<Tag, Service>
type MyContext = {
  HttpClient: HttpClientImpl
  Database: DatabaseImpl
  Logger: LoggerImpl
}
```

### Accessing Services from Context

```typescript
// Method 1: Using Effect.flatMap
const getUserEffect = Effect.flatMap(HttpClient, client =>
  client.get("/users/123")
)

// Method 2: Using Effect.gen (more readable)
const getUserEffect2 = Effect.gen(function* () {
  const client = yield* HttpClient
  const user = yield* client.get("/users/123")
  return user
})

// Method 3: Getting multiple services
const dashboardEffect = Effect.gen(function* () {
  const client = yield* HttpClient
  const db = yield* Database
  const logger = yield* Logger
  
  yield* logger.info("Loading dashboard...")
  const [user, orders] = yield* Effect.all([
    client.get("/users/123"),
    db.query("SELECT * FROM orders")
  ])
  
  return { user, orders }
})
```

### Context Requirements

```typescript
// This effect REQUIRES HttpClient and Database in context
const myEffect: Effect.Effect<
  Dashboard,           // Success type
  Error,              // Error type  
  HttpClient | Database  // Required context (services needed)
> = Effect.gen(function* () {
  const client = yield* HttpClient
  const db = yield* Database
  // ... use services
})
```

---

## Layers - Service Implementations

**What is a Layer?** A Layer provides the actual implementation of a service. It's how you "fill" the Context with real services.

### Basic Layer Creation

```typescript
// Create a Layer that provides HttpClient
export const LiveHttpClient = Layer.succeed(
  HttpClient,  // The Tag (what service this provides)
  {           // The Implementation
    get: (url: string) => 
      Effect.tryPromise({
        try: () => fetch(url).then(r => r.json()),
        catch: (error) => new Error(`HTTP error: ${error}`)
      })
  }
)
```

### Different Types of Layers

```typescript
// 1. Layer.succeed - Simple, synchronous service
const MockHttpClient = Layer.succeed(HttpClient, {
  get: (url: string) => Effect.succeed({ data: "mock" })
})

// 2. Layer.effect - Service that needs initialization
const LiveDatabase = Layer.effect(
  Database,
  Effect.gen(function* () {
    // Setup database connection
    const connection = yield* Effect.tryPromise(() => 
      createConnection({ host: "localhost", port: 5432 })
    )
    
    return {
      query: (sql: string) => Effect.tryPromise(() => 
        connection.query(sql)
      )
    }
  })
)

// 3. Layer.scoped - Service with cleanup
const FileSystemLayer = Layer.scoped(
  FileSystem,
  Effect.gen(function* () {
    const handle = yield* Effect.acquireRelease(
      Effect.sync(() => fs.openSync("file.txt", "r")),
      (fd) => Effect.sync(() => fs.closeSync(fd))
    )
    
    return {
      read: () => Effect.sync(() => fs.readFileSync(handle))
    }
  })
)
```

### Layer Dependencies

```typescript
// A service that depends on other services
const EmailService = Context.GenericTag<{
  send: (to: string, message: string) => Effect.Effect<void, Error>
}>("EmailService")

const LiveEmailService = Layer.effect(
  EmailService,
  Effect.gen(function* () {
    // This layer NEEDS HttpClient and Logger
    const client = yield* HttpClient
    const logger = yield* Logger
    
    return {
      send: (to: string, message: string) =>
        Effect.gen(function* () {
          yield* logger.info(`Sending email to ${to}`)
          yield* client.get(`/send-email?to=${to}&msg=${message}`)
        })
    }
  })
)

// The layer's requirements: HttpClient | Logger
const emailLayer: Layer.Layer<EmailService, never, HttpClient | Logger> = LiveEmailService
```

---

## How They Work Together

Here's how Tags, Context, and Layers work together in a complete example:

```typescript
// 1. DEFINE SERVICES (Tags + Interfaces)
interface HttpClient {
  get: (url: string) => Effect.Effect<unknown, Error>
}
const HttpClient = Context.GenericTag<HttpClient>("HttpClient")

interface Database {
  query: (sql: string) => Effect.Effect<unknown, Error>
}
const Database = Context.GenericTag<Database>("Database")

// 2. CREATE LAYERS (Implementations)
const LiveHttpClient = Layer.succeed(HttpClient, {
  get: (url) => Effect.tryPromise(() => fetch(url).then(r => r.json()))
})

const LiveDatabase = Layer.succeed(Database, {
  query: (sql) => Effect.tryPromise(() => db.execute(sql))
})

// 3. WRITE BUSINESS LOGIC (Using Tags)
const getUserDashboard = (userId: string) =>
  Effect.gen(function* () {
    const client = yield* HttpClient  // Get from context
    const db = yield* Database        // Get from context
    
    const [user, orders] = yield* Effect.all([
      client.get(`/users/${userId}`),
      db.query(`SELECT * FROM orders WHERE user_id = ${userId}`)
    ])
    
    return { user, orders }
  })

// 4. PROVIDE CONTEXT (Combine Layers)
const AppLayer = Layer.mergeAll(LiveHttpClient, LiveDatabase)

// 5. RUN THE PROGRAM
const program = getUserDashboard("123").pipe(
  Effect.provide(AppLayer)  // Provide the context
)

Effect.runPromise(program)
```

### The Flow Explained

```typescript
// What happens when you run this:

1. Effect.provide(AppLayer) creates a Context containing:
   {
     HttpClient: { get: (url) => fetch(url)... },
     Database: { query: (sql) => db.execute(sql)... }
   }

2. When getUserDashboard runs:
   - `yield* HttpClient` looks up the HttpClient service in Context
   - `yield* Database` looks up the Database service in Context
   - Both return the actual implementations from the Layers

3. Your business logic runs with real services!
```

---

## Practical Examples

### Example 1: Testing with Different Layers

```typescript
// Production layers
const ProdLayer = Layer.mergeAll(
  LiveHttpClient,
  LiveDatabase,
  LiveEmailService
)

// Test layers
const TestLayer = Layer.mergeAll(
  Layer.succeed(HttpClient, { get: () => Effect.succeed(mockData) }),
  Layer.succeed(Database, { query: () => Effect.succeed([]) }),
  Layer.succeed(EmailService, { send: () => Effect.succeed(void 0) })
)

// Same business logic, different implementations!
const businessLogic = Effect.gen(function* () {
  const client = yield* HttpClient
  const db = yield* Database
  const email = yield* EmailService
  
  const user = yield* client.get("/user/123")
  const orders = yield* db.query("SELECT * FROM orders")
  yield* email.send("user@example.com", "Welcome!")
  
  return { user, orders }
})

// Production
const prodProgram = businessLogic.pipe(Effect.provide(ProdLayer))

// Testing  
const testProgram = businessLogic.pipe(Effect.provide(TestLayer))
```

### Example 2: Conditional Service Implementation

```typescript
const createAppLayer = (environment: "dev" | "prod" | "test") => {
  const httpLayer = environment === "test" 
    ? MockHttpClient 
    : LiveHttpClient
    
  const dbLayer = environment === "dev"
    ? Layer.succeed(Database, { query: () => Effect.succeed(devData) })
    : LiveDatabase
    
  return Layer.mergeAll(httpLayer, dbLayer)
}

// Different environments, same business logic
const program = getUserDashboard("123").pipe(
  Effect.provide(createAppLayer("dev"))
)
```

### Example 3: Service Composition

```typescript
// Services can depend on other services
const CacheService = Context.GenericTag<{
  get: (key: string) => Effect.Effect<string | null, Error>
  set: (key: string, value: string) => Effect.Effect<void, Error>
}>("CacheService")

const CachedHttpClient = Layer.effect(
  HttpClient,
  Effect.gen(function* () {
    const cache = yield* CacheService  // Depends on CacheService
    
    return {
      get: (url: string) =>
        Effect.gen(function* () {
          // Try cache first
          const cached = yield* cache.get(url)
          if (cached) {
            return JSON.parse(cached)
          }
          
          // Fetch and cache
          const data = yield* Effect.tryPromise(() => 
            fetch(url).then(r => r.json())
          )
          yield* cache.set(url, JSON.stringify(data))
          return data
        })
    }
  })
)

// Layer dependency chain: CachedHttpClient needs CacheService
const AppLayer = Layer.mergeAll(
  LiveCacheService,    // Provides CacheService
  CachedHttpClient     // Provides HttpClient, needs CacheService
)
```

---

## Common Patterns

### Pattern 1: Service Interface + Tag + Layer

```typescript
// 1. Define the interface
interface Logger {
  readonly info: (message: string) => Effect.Effect<void>
  readonly error: (message: string) => Effect.Effect<void>
}

// 2. Create the Tag
const Logger = Context.GenericTag<Logger>("Logger")

// 3. Create Layer(s)
const ConsoleLogger = Layer.succeed(Logger, {
  info: (msg) => Effect.sync(() => console.log(`[INFO] ${msg}`)),
  error: (msg) => Effect.sync(() => console.error(`[ERROR] ${msg}`))
})

const FileLogger = Layer.effect(Logger, 
  Effect.gen(function* () {
    const fs = yield* FileSystem
    return {
      info: (msg) => fs.appendFile("app.log", `[INFO] ${msg}\n`),
      error: (msg) => fs.appendFile("app.log", `[ERROR] ${msg}\n`)
    }
  })
)
```

### Pattern 2: Environment-Based Layer Selection

```typescript
const createLogger = (env: string) => {
  switch (env) {
    case "production":
      return FileLogger
    case "development": 
      return ConsoleLogger
    case "test":
      return Layer.succeed(Logger, {
        info: () => Effect.succeed(void 0),
        error: () => Effect.succeed(void 0)
      })
    default:
      return ConsoleLogger
  }
}
```

### Pattern 3: Gradual Service Replacement

```typescript
// Start with a basic layer
const BasicAppLayer = Layer.mergeAll(
  LiveHttpClient,
  LiveDatabase
)

// Add caching
const CachedAppLayer = Layer.mergeAll(
  LiveCacheService,
  CachedHttpClient,  // Replaces LiveHttpClient
  LiveDatabase
)

// Add monitoring
const MonitoredAppLayer = Layer.mergeAll(
  LiveCacheService,
  CachedHttpClient,
  MonitoredDatabase,  // Replaces LiveDatabase
  LiveMetricsService
)
```

---

## Ready for Effect.Service?

Now that you understand Tags, Context, and Layers, `Effect.Service` is just a convenience helper that combines these concepts:

```typescript
// What you've learned (manual approach):
interface HttpClient {
  get: (url: string) => Effect.Effect<unknown, Error>
}
const HttpClient = Context.GenericTag<HttpClient>("HttpClient")
const LiveHttpClient = Layer.succeed(HttpClient, { /* impl */ })

// What Effect.Service does (helper approach):
class HttpClient extends Effect.Service<HttpClient>()("HttpClient", {
  effect: Effect.succeed({
    get: (url: string) => Effect.tryPromise(() => fetch(url))
  })
}) {}

// They're equivalent! Effect.Service just combines:
// 1. Interface definition
// 2. Tag creation  
// 3. Layer creation
// Into one convenient class
```

### The Mental Model

```typescript
Effect.Service = {
  interface: "What the service can do",
  tag: "How to identify the service", 
  layer: "How to implement the service"
}

// Versus manual approach:
const ManualService = {
  interface: ServiceInterface,
  tag: Context.GenericTag<ServiceInterface>("ServiceName"),
  layer: Layer.succeed(tag, implementation)
}
```

---

## Summary

**Tags** are identifiers that uniquely identify service types.

**Context** is the container that holds all available services.

**Layers** provide the actual implementations of services.

**Together**, they create Effect's powerful dependency injection system:

1. **Tags** let you reference services without importing implementations
2. **Context** automatically provides services to your Effects  
3. **Layers** let you swap implementations (prod vs test vs mock)

**Effect.Service** is just a convenience helper that combines all three concepts into one class.

Understanding this foundation makes Effect's dependency injection system much clearer and helps you debug issues, create custom patterns, and understand what's happening "under the hood" when you use Effect.Service!

---

*Ready to dive into Effect.Service? You now have the foundation to understand exactly what it's doing for you! 🚀*