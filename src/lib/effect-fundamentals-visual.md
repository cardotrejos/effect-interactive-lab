# Effect Fundamentals: Visual Guide to Tags, Context, and Layers

This guide provides visual explanations and comparisons to help understand Effect's core concepts before using `Effect.Service`.

## 🎯 The Problem We're Solving

Traditional dependency injection can be complex and error-prone:

```typescript
// Traditional approach - manual wiring
class UserService {
  constructor(
    private db: Database,
    private logger: Logger,
    private cache: Cache
  ) {}
}

// Somewhere else...
const logger = new ConsoleLogger()
const db = new PostgresDB(config)
const cache = new RedisCache(config)
const userService = new UserService(db, logger, cache) // Manual wiring! 😫
```

Effect solves this with **Tags**, **Context**, and **Layers**.

## 📌 1. Tags - Type-Safe Service Identifiers

Think of Tags as **labeled boxes** that hold a specific type of service:

```typescript
// A Tag is like a labeled box
┌─────────────────┐
│   📦 Logger     │  <-- Tag name
│ ─────────────── │
│  Type: Logger   │  <-- Type information
└─────────────────┘
```

### Code Example:

```typescript
import { Context } from 'effect'

// Define what goes in the box
interface Logger {
  log: (msg: string) => void
}

// Create the labeled box
const LoggerTag = Context.GenericTag<Logger>("Logger")
```

### Key Points:
- ✅ Type-safe: TypeScript knows what type this Tag holds
- ✅ Unique: The string "Logger" identifies this service globally
- ✅ Reusable: Use the same Tag across your entire application

## 📦 2. Context - The Service Container

Context is like a **warehouse** that stores all your service boxes:

```
Context (Runtime Container)
┌─────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ Logger   │  │ Database │  │ Cache  ││
│  │ ──────── │  │ ──────── │  │ ────── ││
│  │ Console  │  │ Postgres │  │ Redis  ││
│  └──────────┘  └──────────┘  └────────┘│
└─────────────────────────────────────────┘
```

### Building Context:

```typescript
// Start with an empty warehouse
const emptyContext = Context.empty()

// Add services one by one
const context1 = Context.make(LoggerTag, consoleLogger)

// Add more services (immutable - returns new Context)
const context2 = pipe(
  context1,
  Context.add(DatabaseTag, postgresDB)
)
```

### Visual Flow:

```
Empty Context → Add Logger → Add Database → Add Cache → Full Context
     ∅              📦           📦📦         📦📦📦        Ready!
```

## 🏗️ 3. Layers - Service Factories

Layers are **blueprints** for creating services:

```
Layer (Blueprint)
┌─────────────────────────┐
│ 📋 How to make Logger   │
│ ─────────────────────── │
│ 1. Get dependencies     │
│ 2. Initialize           │
│ 3. Return service       │
└─────────────────────────┘
```

### Layer Types Comparison:

| Layer Type | Use Case | Example |
|------------|----------|---------|
| `Layer.succeed` | Simple, no dependencies | Mock services |
| `Layer.effect` | Needs initialization | File logger |
| `Layer.scoped` | Needs cleanup | Database connection |

### Visual Example - Dependency Graph:

```
        ConfigLayer
             │
             ▼
    ┌────────┴────────┐
    │                 │
LoggerLayer    DatabaseLayer
    │                 │
    └────────┬────────┘
             │
             ▼
        ApiLayer
```

## 🔄 4. The Complete Flow

Here's how Tags, Context, and Layers work together:

```
1. Define Service Interface
   interface Logger { log: (msg: string) => void }
              ↓
2. Create Tag (Identifier)
   const LoggerTag = Context.GenericTag<Logger>("Logger")
              ↓
3. Create Layer (Factory)
   const LoggerLayer = Layer.succeed(LoggerTag, consoleLogger)
              ↓
4. Use in Program
   const program = Effect.gen(function* () {
     const logger = yield* LoggerTag  // Request service
     logger.log("Hello!")
   })
              ↓
5. Provide Layer at Runtime
   Effect.runPromise(
     pipe(program, Effect.provide(LoggerLayer))
   )
```

## 📊 5. Comparison: Manual vs Effect.Service

### Manual Approach (Understanding the Fundamentals):

```typescript
// 1. Interface
interface Logger {
  log: (msg: string) => Effect.Effect<void>
}

// 2. Tag
const LoggerTag = Context.GenericTag<Logger>("Logger")

// 3. Layer
const LoggerLayer = Layer.succeed(LoggerTag, {
  log: (msg) => Effect.sync(() => console.log(msg))
})

// 4. Usage
const program = Effect.gen(function* () {
  const logger = yield* LoggerTag
  yield* logger.log("Hello")
})
```

### Effect.Service Approach (The Convenience Helper):

```typescript
// All-in-one!
class Logger extends Effect.Service<Logger>()("Logger", {
  succeed: {
    log: (msg: string) => Effect.sync(() => console.log(msg))
  }
}) {}

// Usage (same as manual!)
const program = Effect.gen(function* () {
  const logger = yield* Logger
  yield* logger.log("Hello")
})
```

### What Effect.Service Does for You:

```
Effect.Service creates:
┌─────────────────┐
│ 1. Tag ✓        │ → Logger (the class) is the Tag
│ 2. Layer ✓      │ → Logger.Default is the Layer  
│ 3. Type ✓       │ → Full type inference
└─────────────────┘
```

## 🎨 6. Real-World Example: Building a Todo App

Let's see how these concepts work in practice:

```typescript
// Step 1: Define your services
interface TodoRepo {
  findAll: () => Effect.Effect<Todo[]>
  save: (todo: Todo) => Effect.Effect<void>
}

interface NotificationService {
  notify: (msg: string) => Effect.Effect<void>
}

// Step 2: Create Tags
const TodoRepoTag = Context.GenericTag<TodoRepo>("TodoRepo")
const NotificationTag = Context.GenericTag<NotificationService>("NotificationService")

// Step 3: Create Layers
const InMemoryTodoRepo = Layer.sync(TodoRepoTag, () => {
  const todos: Todo[] = []
  return {
    findAll: () => Effect.succeed(todos),
    save: (todo) => Effect.sync(() => { todos.push(todo) })
  }
})

const ConsoleNotifications = Layer.succeed(NotificationTag, {
  notify: (msg) => Effect.sync(() => console.log(`🔔 ${msg}`))
})

// Step 4: Business Logic
const createTodo = (title: string) => Effect.gen(function* () {
  const repo = yield* TodoRepoTag
  const notify = yield* NotificationTag
  
  const todo = { id: "1", title, completed: false }
  yield* repo.save(todo)
  yield* notify.notify(`Created: ${title}`)
  
  return todo
})

// Step 5: Wire Everything
const AppLayers = Layer.mergeAll(
  InMemoryTodoRepo,
  ConsoleNotifications
)

const program = pipe(
  createTodo("Learn Effect"),
  Effect.provide(AppLayers)
)
```

### Dependency Flow Visualization:

```
createTodo (Business Logic)
    │
    ├── Requires: TodoRepoTag
    │   └── Provided by: InMemoryTodoRepo Layer
    │
    └── Requires: NotificationTag
        └── Provided by: ConsoleNotifications Layer
```

## 🧠 7. Mental Models

### Tag = Service ID Card
```
┌──────────────────┐
│   ID: "Logger"   │
│ Type: Logger     │
│ Used to request  │
│ this service     │
└──────────────────┘
```

### Context = Service Registry
```
┌─────────────────────────┐
│ Tag → Implementation    │
│ ─────────────────────── │
│ Logger → ConsoleLogger  │
│ Database → PostgresDB   │
│ Cache → RedisCache      │
└─────────────────────────┘
```

### Layer = Service Recipe
```
┌────────────────────────┐
│ Recipe: Logger         │
│ ────────────────────── │
│ Ingredients:           │
│ - Config (dependency)  │
│                        │
│ Instructions:          │
│ 1. Read config         │
│ 2. Create logger       │
│ 3. Return service      │
└────────────────────────┘
```

## 🎯 8. When to Use What

| Scenario | Use This | Why |
|----------|----------|-----|
| Simple service, no deps | `Layer.succeed` | Quick and easy |
| Service needs setup | `Layer.effect` | Can run Effects during creation |
| Service needs cleanup | `Layer.scoped` | Handles resource lifecycle |
| Service depends on others | `Layer.effect` + dependencies | Proper dependency injection |
| Want convenience | `Effect.Service` | Less boilerplate |
| Need full control | Manual Tags + Layers | Maximum flexibility |

## 💡 9. Key Takeaways

1. **Tags** identify services (think: service name tags)
2. **Context** stores services at runtime (think: service container)
3. **Layers** create services (think: service factories)
4. **Effect.Service** combines all three for convenience

Understanding these fundamentals helps you:
- Debug dependency issues
- Build complex service architectures  
- Know when to use manual approach vs helpers
- Compose services effectively

## 🚀 10. Next Steps

Now that you understand the fundamentals:

1. Start with manual Tags/Context/Layers for learning
2. Move to `Effect.Service` for production code
3. Use Layers for complex dependency graphs
4. Remember: It's all the same system underneath!

---

*Remember: `Effect.Service` is just syntactic sugar over Tags + Context + Layers. Master the fundamentals first!*