# Complete Learning Guide: Tags, Context, and Layers in Effect

## 📚 Overview

Before using `Effect.Service`, it's crucial to understand the three fundamental building blocks of Effect's dependency injection system:

1. **Tags** - Type-safe service identifiers
2. **Context** - Runtime service container
3. **Layers** - Composable service factories

## 🎯 Quick Start Examples

### 1. Basic Example - Manual Approach

```typescript
import { Effect, Context, Layer } from 'effect'

// Step 1: Define your service interface
interface Logger {
  log: (message: string) => Effect.Effect<void>
}

// Step 2: Create a Tag (identifier)
const LoggerTag = Context.GenericTag<Logger>("Logger")

// Step 3: Create implementation
const consoleLogger: Logger = {
  log: (message) => Effect.sync(() => console.log(message))
}

// Step 4: Create Layer (factory)
const LoggerLayer = Layer.succeed(LoggerTag, consoleLogger)

// Step 5: Use in program
const program = Effect.gen(function* () {
  const logger = yield* LoggerTag // Request service
  yield* logger.log("Hello, Effect!")
})

// Step 6: Run with Layer
Effect.runPromise(
  Effect.provide(program, LoggerLayer)
)
```

### 2. With Dependencies

```typescript
// Config service
interface Config {
  apiUrl: string
}
const ConfigTag = Context.GenericTag<Config>("Config")

// ApiClient depends on Config and Logger
interface ApiClient {
  get: (path: string) => Effect.Effect<unknown, Error>
}
const ApiClientTag = Context.GenericTag<ApiClient>("ApiClient")

// Layer with dependencies
const ApiClientLayer = Layer.effect(
  ApiClientTag,
  Effect.gen(function* () {
    // Request dependencies
    const config = yield* ConfigTag
    const logger = yield* LoggerTag
    
    return {
      get: (path) => Effect.gen(function* () {
        yield* logger.log(`GET ${config.apiUrl}${path}`)
        // ... implementation
      })
    }
  })
)

// Compose all layers
const AppLayers = Layer.mergeAll(
  Layer.succeed(ConfigTag, { apiUrl: "https://api.example.com" }),
  LoggerLayer,
  ApiClientLayer.pipe(
    Layer.provide(Layer.succeed(ConfigTag, { apiUrl: "https://api.example.com" })),
    Layer.provide(LoggerLayer)
  )
)
```

### 3. Effect.Service - The Convenient Way

```typescript
// After understanding the manual approach, use Effect.Service for convenience
class ApiService extends Effect.Service<ApiService>()("ApiService", {
  dependencies: [ConfigService, LoggerService], // Automatic dependency injection
  effect: Effect.gen(function* () {
    const config = yield* ConfigService
    const logger = yield* LoggerService
    
    return {
      get: (path: string) => Effect.gen(function* () {
        yield* logger.log(`GET ${config.apiUrl}${path}`)
        // ... implementation
      })
    }
  })
}) {}
```

## 🔍 Detailed Breakdown

### Tags: The "What"

Tags answer: "What service am I looking for?"

```typescript
// A Tag is a typed identifier
const DatabaseTag = Context.GenericTag<Database>("Database")

// Tags are:
// - Type-safe (knows the service type)
// - Globally unique (identified by string)
// - Reusable across your app
```

### Context: The "Where"

Context answers: "Where are all my services stored?"

```typescript
// Context is an immutable map of Tag → Service
const context = Context.empty()
  .pipe(
    Context.add(LoggerTag, consoleLogger),
    Context.add(DatabaseTag, postgresDB)
  )

// Extract a service (rarely needed directly)
const logger = Context.get(context, LoggerTag)
```

### Layers: The "How"

Layers answer: "How do I create and wire services?"

```typescript
// Simple layer - no dependencies
const SimpleLayer = Layer.succeed(Tag, implementation)

// Layer with initialization
const InitLayer = Layer.effect(Tag, 
  Effect.sync(() => {
    // initialization logic
    return implementation
  })
)

// Layer with dependencies
const DependentLayer = Layer.effect(Tag,
  Effect.gen(function* () {
    const dep1 = yield* Dep1Tag
    const dep2 = yield* Dep2Tag
    return createService(dep1, dep2)
  })
)
```

## 🏗️ Architecture Patterns

### 1. Repository Pattern

```typescript
// Domain layer
interface User {
  id: string
  name: string
}

// Infrastructure layer
interface UserRepository {
  findById: (id: string) => Effect.Effect<User | null, Error>
  save: (user: User) => Effect.Effect<void, Error>
}

const UserRepositoryTag = Context.GenericTag<UserRepository>("UserRepository")

// Implementation depends on Database
const PostgresUserRepository = Layer.effect(
  UserRepositoryTag,
  Effect.gen(function* () {
    const db = yield* DatabaseTag
    
    return {
      findById: (id) => db.query(`SELECT * FROM users WHERE id = $1`, [id]),
      save: (user) => db.query(`INSERT INTO users...`, [user.id, user.name])
    }
  })
)
```

### 2. Service Layer Pattern

```typescript
// Business logic layer
const UserService = Layer.effect(
  UserServiceTag,
  Effect.gen(function* () {
    const repo = yield* UserRepositoryTag
    const logger = yield* LoggerTag
    const events = yield* EventBusTag
    
    return {
      createUser: (data: CreateUserDto) => Effect.gen(function* () {
        yield* logger.log(`Creating user: ${data.email}`)
        
        const user = { id: generateId(), ...data }
        yield* repo.save(user)
        yield* events.publish("user.created", user)
        
        return user
      })
    }
  })
)
```

## 📋 Best Practices

### 1. Layer Organization

```typescript
// layers/config.ts
export const ConfigLayer = Layer.effect(ConfigTag, loadConfig)

// layers/database.ts
export const DatabaseLayer = Layer.scoped(DatabaseTag, 
  Effect.acquireRelease(
    connectToDatabase,
    (conn) => Effect.sync(() => conn.close())
  )
)

// layers/index.ts
export const AppLayers = Layer.mergeAll(
  ConfigLayer,
  DatabaseLayer,
  LoggerLayer,
  // ... other layers
)
```

### 2. Testing with Mock Layers

```typescript
// Mock implementations for testing
const MockDatabaseLayer = Layer.succeed(DatabaseTag, {
  query: () => Effect.succeed([{ id: "1", name: "Test User" }])
})

// In tests
const testProgram = pipe(
  userService.findUser("1"),
  Effect.provide(MockDatabaseLayer)
)
```

### 3. Environment-specific Layers

```typescript
const createAppLayers = (env: "development" | "production") => {
  const databaseLayer = env === "production" 
    ? PostgresDatabaseLayer 
    : InMemoryDatabaseLayer
    
  const loggerLayer = env === "production"
    ? CloudLoggerLayer
    : ConsoleLoggerLayer
    
  return Layer.mergeAll(databaseLayer, loggerLayer)
}
```

## 🎓 Learning Path

### Step 1: Master the Fundamentals
1. Create simple Tags and use them with Context
2. Build basic Layers without dependencies
3. Compose Layers with dependencies
4. Understand Layer lifecycle (effect vs scoped)

### Step 2: Build Real Applications
1. Implement repository pattern
2. Add service layers
3. Handle cross-cutting concerns (logging, auth)
4. Test with mock layers

### Step 3: Use Effect.Service
1. Refactor manual implementations to Effect.Service
2. Understand what it's doing under the hood
3. Know when to use manual vs Service approach

## 🚀 When to Use What

| Scenario | Approach | Why |
|----------|----------|-----|
| Learning Effect | Manual Tags + Layers | Understand fundamentals |
| Simple services | Effect.Service | Less boilerplate |
| Complex dependencies | Manual Layers | Full control |
| Testing | Mock Layers | Easy to swap implementations |
| Multiple environments | Layer factories | Environment-specific configs |

## 💡 Key Takeaways

1. **Tags** are just typed identifiers - they don't do anything by themselves
2. **Context** is where services live at runtime - usually handled automatically
3. **Layers** are the real workhorses - they create and wire services
4. **Effect.Service** is syntactic sugar that creates all three for you
5. Understanding the manual approach helps debug issues and build complex systems

## 📚 Resources

- Run the interactive examples in `effect-interactive-examples.ts`
- Study the visual guide in `effect-fundamentals-visual.md`
- Explore the complete examples in `effect-fundamentals.ts`

Remember: **Master the fundamentals first, then use the conveniences!**