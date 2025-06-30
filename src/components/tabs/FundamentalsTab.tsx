import React, { useState } from 'react'
import CodeExample from '../shared/CodeExample'

type FundamentalsConcept = 'tags' | 'context' | 'layers' | 'composition' | 'comparison'

interface ConceptSection {
	title: string
	description: string
	code: string
}

const conceptSections: Record<FundamentalsConcept, ConceptSection> = {
	tags: {
		title: '📌 Tags - Type-Safe Service Identifiers',
		description: 'Tags are unique identifiers that let you request services in a type-safe way. Think of them as "keys" that know their value type.',
		code: `import { Context, Effect } from 'effect'

// Step 1: Define your service interface
interface Logger {
  log: (message: string) => Effect.Effect<void>
  error: (message: string) => Effect.Effect<void>
}

// Step 2: Create a Tag for this service
// The Tag acts as both:
// - A unique identifier (the string "Logger")
// - A type carrier (it knows the type is Logger)
const LoggerTag = Context.GenericTag<Logger>("Logger")

// Tags are reusable and globally unique
console.log("Tag identifier:", LoggerTag.key) // Output: "Logger"

// Using the Tag in a program
const program = Effect.gen(function* () {
  // Request the Logger service using its Tag
  const logger = yield* LoggerTag
  
  // TypeScript knows logger has log and error methods!
  yield* logger.log("Hello from Effect!")
  yield* logger.error("Something went wrong!")
})

// Note: This program can't run yet - we need to provide 
// the actual Logger implementation via Context or Layers`
	},
	
	context: {
		title: '📦 Context - Runtime Service Container',
		description: 'Context is an immutable container that holds your services at runtime. It\'s like a type-safe Map where Tags are keys.',
		code: `import { Context, Effect, pipe } from 'effect'

// Create a Logger implementation
const consoleLogger: Logger = {
  log: (msg) => Effect.sync(() => console.log(\`[LOG] \${msg}\`)),
  error: (msg) => Effect.sync(() => console.error(\`[ERROR] \${msg}\`))
}

// Create a Context with our service
const context1 = Context.make(LoggerTag, consoleLogger)

// Add multiple services to Context (immutable - returns new Context)
interface Database {
  query: (sql: string) => Effect.Effect<unknown[]>
}

const DatabaseTag = Context.GenericTag<Database>("Database")

const mockDatabase: Database = {
  query: (sql) => Effect.succeed([{ id: 1, name: "Test" }])
}

// Build up Context by adding services
const fullContext = pipe(
  context1,
  Context.add(DatabaseTag, mockDatabase)
)

// Use services from Context
const program = Effect.gen(function* () {
  const logger = yield* LoggerTag
  const db = yield* DatabaseTag
  
  yield* logger.log("Querying database...")
  const results = yield* db.query("SELECT * FROM users")
  yield* logger.log(\`Found \${results.length} users\`)
  
  return results
})

// Run the program with Context
Effect.runPromise(
  pipe(program, Effect.provideContext(fullContext))
)`
	},
	
	layers: {
		title: '🏗️ Layers - Composable Service Factories',
		description: 'Layers are "recipes" for creating services. They handle initialization, dependencies, and resource cleanup.',
		code: `import { Layer, Effect, Context } from 'effect'

// Simple Layer - no dependencies
const ConsoleLoggerLayer = Layer.succeed(
  LoggerTag,
  consoleLogger
)

// Layer with initialization logic
const FileLoggerLayer = Layer.effect(
  LoggerTag,
  Effect.gen(function* () {
    // Initialization logic runs when Layer is provided
    console.log("🚀 Initializing file logger...")
    
    return {
      log: (msg) => Effect.sync(() => {
        // In real app, write to file
        console.log(\`[FILE] \${msg}\`)
      }),
      error: (msg) => Effect.sync(() => {
        console.error(\`[FILE ERROR] \${msg}\`)
      })
    }
  })
)

// Layer with dependencies
interface Config {
  logLevel: 'debug' | 'info' | 'error'
  apiUrl: string
}

const ConfigTag = Context.GenericTag<Config>("Config")

// This Logger depends on Config
const ConfigurableLoggerLayer = Layer.effect(
  LoggerTag,
  Effect.gen(function* () {
    // Request the Config dependency
    const config = yield* ConfigTag
    
    return {
      log: (msg) => Effect.sync(() => {
        if (config.logLevel !== 'error') {
          console.log(\`[\${config.logLevel.toUpperCase()}] \${msg}\`)
        }
      }),
      error: (msg) => Effect.sync(() => {
        console.error(\`[ERROR] \${msg}\`)
      })
    }
  })
)

// Provide dependencies to Layers
const ConfigLayer = Layer.succeed(ConfigTag, { 
  logLevel: 'debug',
  apiUrl: 'https://api.example.com'
})

// Compose layers
const AppLayer = pipe(
  ConfigurableLoggerLayer,
  Layer.provide(ConfigLayer)
)`
	},
	
	composition: {
		title: '🔄 Real-World Composition Pattern',
		description: 'See how Tags, Context, and Layers work together in a real application with multiple services and dependencies.',
		code: `// Real-world example: API service with dependencies

// 1. Define service interfaces
interface ApiClient {
  get: (path: string) => Effect.Effect<unknown, Error>
  post: (path: string, data: unknown) => Effect.Effect<unknown, Error>
}

interface AuthService {
  getToken: () => Effect.Effect<string, Error>
  refreshToken: () => Effect.Effect<string, Error>
}

// 2. Create Tags
const ApiClientTag = Context.GenericTag<ApiClient>("ApiClient")
const AuthServiceTag = Context.GenericTag<AuthService>("AuthService")

// 3. Create Layers with dependencies
const AuthServiceLayer = Layer.effect(
  AuthServiceTag,
  Effect.gen(function* () {
    const config = yield* ConfigTag
    const logger = yield* LoggerTag
    
    let token = "initial-token"
    
    return {
      getToken: () => Effect.sync(() => token),
      refreshToken: () => Effect.gen(function* () {
        yield* logger.log("Refreshing auth token...")
        token = \`refreshed-\${Date.now()}\`
        return token
      })
    }
  })
)

const ApiClientLayer = Layer.effect(
  ApiClientTag,
  Effect.gen(function* () {
    const config = yield* ConfigTag
    const logger = yield* LoggerTag
    const auth = yield* AuthServiceTag
    
    return {
      get: (path) => Effect.gen(function* () {
        const token = yield* auth.getToken()
        yield* logger.log(\`GET \${config.apiUrl}\${path}\`)
        yield* logger.log(\`Authorization: Bearer \${token}\`)
        
        // Simulate API call
        return { data: "response", status: 200 }
      }),
      
      post: (path, data) => Effect.gen(function* () {
        const token = yield* auth.getToken()
        yield* logger.log(\`POST \${config.apiUrl}\${path}\`)
        yield* logger.log(\`Body: \${JSON.stringify(data)}\`)
        
        return { data: "created", status: 201 }
      })
    }
  })
)

// 4. Compose all layers
const AppLayers = Layer.mergeAll(
  ConfigLayer,
  ConsoleLoggerLayer,
  pipe(AuthServiceLayer, 
    Layer.provide(ConfigLayer),
    Layer.provide(ConsoleLoggerLayer)
  ),
  pipe(ApiClientLayer,
    Layer.provide(ConfigLayer),
    Layer.provide(ConsoleLoggerLayer),
    Layer.provide(AuthServiceLayer)
  )
)

// 5. Use in business logic
const fetchUserData = (userId: string) => Effect.gen(function* () {
  const api = yield* ApiClientTag
  const logger = yield* LoggerTag
  
  yield* logger.log(\`Fetching user \${userId}...\`)
  const user = yield* api.get(\`/users/\${userId}\`)
  
  return user
})

// 6. Run with all dependencies provided
Effect.runPromise(
  pipe(
    fetchUserData("123"),
    Effect.provide(AppLayers)
  )
)`
	},
	
	comparison: {
		title: '🔀 Manual vs Effect.Service Comparison',
		description: 'After understanding the fundamentals, see how Effect.Service simplifies the pattern while doing the same thing under the hood.',
		code: `// MANUAL APPROACH (what we've been learning)
// 1. Define interface
interface PaymentService {
  charge: (amount: number, currency: string) => Effect.Effect<string, Error>
  refund: (transactionId: string) => Effect.Effect<void, Error>
}

// 2. Create Tag
const PaymentServiceTag = Context.GenericTag<PaymentService>("PaymentService")

// 3. Create Layer
const PaymentServiceLayer = Layer.effect(
  PaymentServiceTag,
  Effect.gen(function* () {
    const logger = yield* LoggerTag
    const config = yield* ConfigTag
    
    return {
      charge: (amount, currency) => Effect.gen(function* () {
        yield* logger.log(\`Charging \${amount} \${currency}\`)
        // Payment logic here
        return \`transaction-\${Date.now()}\`
      }),
      
      refund: (transactionId) => Effect.gen(function* () {
        yield* logger.log(\`Refunding transaction \${transactionId}\`)
        // Refund logic here
      })
    }
  })
)

// 4. Usage
const manualProgram = Effect.gen(function* () {
  const payment = yield* PaymentServiceTag
  const transactionId = yield* payment.charge(99.99, "USD")
  return transactionId
})

// ═══════════════════════════════════════════════════════════

// EFFECT.SERVICE APPROACH (the convenient way)
class PaymentService extends Effect.Service<PaymentService>()("PaymentService", {
  dependencies: [LoggerService, ConfigService],
  effect: Effect.gen(function* () {
    const logger = yield* LoggerService
    const config = yield* ConfigService
    
    return {
      charge: (amount: number, currency: string) => 
        Effect.gen(function* () {
          yield* logger.log(\`Charging \${amount} \${currency}\`)
          return \`transaction-\${Date.now()}\`
        }),
      
      refund: (transactionId: string) => 
        Effect.gen(function* () {
          yield* logger.log(\`Refunding transaction \${transactionId}\`)
        })
    }
  })
}) {}

// Usage is almost identical!
const serviceProgram = Effect.gen(function* () {
  const payment = yield* PaymentService
  const transactionId = yield* payment.charge(99.99, "USD")
  return transactionId
})

// Effect.Service creates:
// - PaymentService (the class) is the Tag
// - PaymentService.Default is the Layer
// - Full type inference for the service

// Both approaches do the same thing!
// Effect.Service is just syntactic sugar.`
	}
}

export default function FundamentalsTab(): React.ReactElement {
	const [selectedConcept, setSelectedConcept] = useState<FundamentalsConcept>('tags')
	const currentSection = conceptSections[selectedConcept]
	
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
				<h2 className="text-2xl font-bold mb-3">
					Understanding Tags, Context, and Layers
				</h2>
				<p className="text-gray-700 mb-4">
					Before using <code className="bg-white px-2 py-1 rounded">Effect.Service</code>, 
					it's important to understand the fundamental building blocks that power Effect's 
					dependency injection system.
				</p>
				<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
					<p className="text-sm">
						<strong>💡 Pro Tip:</strong> Understanding these concepts helps you debug issues, 
						build complex architectures, and know when to use the manual approach vs helpers.
					</p>
				</div>
			</div>
			
			{/* Concept Navigation */}
			<div className="flex flex-wrap gap-2">
				{(Object.keys(conceptSections) as FundamentalsConcept[]).map((concept) => (
					<button
						key={concept}
						onClick={() => setSelectedConcept(concept)}
						className={`px-4 py-2 rounded-lg font-medium transition-all ${
							selectedConcept === concept
								? 'bg-blue-600 text-white'
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
						}`}
					>
						{conceptSections[concept].title.split(' - ')[0]}
					</button>
				))}
			</div>
			
			{/* Selected Concept */}
			<div className="space-y-4">
				<div>
					<h3 className="text-xl font-semibold mb-2">{currentSection.title}</h3>
					<p className="text-gray-600">{currentSection.description}</p>
				</div>
				
				<CodeExample
					title="Code Example"
					code={currentSection.code}
					language="typescript"
				/>
			</div>
			
			{/* Key Insights */}
			<div className="bg-gray-50 p-6 rounded-lg space-y-4">
				<h3 className="text-lg font-semibold">🔑 Key Insights</h3>
				<div className="grid md:grid-cols-2 gap-4">
					<div className="bg-white p-4 rounded-lg">
						<h4 className="font-medium text-blue-600 mb-2">Tags</h4>
						<ul className="text-sm space-y-1 text-gray-600">
							<li>• Type-safe service identifiers</li>
							<li>• Carry both identity and type information</li>
							<li>• Globally unique by string name</li>
							<li>• Used to request services</li>
						</ul>
					</div>
					<div className="bg-white p-4 rounded-lg">
						<h4 className="font-medium text-green-600 mb-2">Context</h4>
						<ul className="text-sm space-y-1 text-gray-600">
							<li>• Runtime container for services</li>
							<li>• Immutable Map&lt;Tag, Service&gt;</li>
							<li>• Built by adding services</li>
							<li>• Usually handled automatically</li>
						</ul>
					</div>
					<div className="bg-white p-4 rounded-lg">
						<h4 className="font-medium text-purple-600 mb-2">Layers</h4>
						<ul className="text-sm space-y-1 text-gray-600">
							<li>• Service factories/recipes</li>
							<li>• Handle initialization & cleanup</li>
							<li>• Support dependencies</li>
							<li>• Composable and reusable</li>
						</ul>
					</div>
					<div className="bg-white p-4 rounded-lg">
						<h4 className="font-medium text-orange-600 mb-2">Effect.Service</h4>
						<ul className="text-sm space-y-1 text-gray-600">
							<li>• Convenience helper</li>
							<li>• Creates Tag + Layer automatically</li>
							<li>• Same runtime behavior</li>
							<li>• Less boilerplate</li>
						</ul>
					</div>
				</div>
			</div>
			
			{/* Learning Path */}
			<div className="bg-blue-50 p-6 rounded-lg">
				<h3 className="text-lg font-semibold mb-3">📚 Recommended Learning Path</h3>
				<ol className="space-y-2 text-sm">
					<li className="flex items-start">
						<span className="font-bold text-blue-600 mr-2">1.</span>
						<span>Start with <strong>Tags</strong> to understand service identification</span>
					</li>
					<li className="flex items-start">
						<span className="font-bold text-blue-600 mr-2">2.</span>
						<span>Learn how <strong>Context</strong> stores services at runtime</span>
					</li>
					<li className="flex items-start">
						<span className="font-bold text-blue-600 mr-2">3.</span>
						<span>Master <strong>Layers</strong> for service creation and dependencies</span>
					</li>
					<li className="flex items-start">
						<span className="font-bold text-blue-600 mr-2">4.</span>
						<span>Practice <strong>Composition</strong> patterns with real examples</span>
					</li>
					<li className="flex items-start">
						<span className="font-bold text-blue-600 mr-2">5.</span>
						<span>Compare manual approach with <strong>Effect.Service</strong> helper</span>
					</li>
				</ol>
			</div>
			
			{/* Quick Reference Card */}
			<div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
				<h3 className="text-lg font-semibold mb-4">🎯 Quick Reference</h3>
				<div className="grid md:grid-cols-2 gap-6">
					<div>
						<h4 className="font-medium text-purple-700 mb-2">Essential Imports</h4>
						<pre className="bg-white p-3 rounded text-xs overflow-x-auto">
{`import { Effect, Context, Layer, pipe } from 'effect'`}
						</pre>
					</div>
					<div>
						<h4 className="font-medium text-purple-700 mb-2">Basic Pattern</h4>
						<pre className="bg-white p-3 rounded text-xs overflow-x-auto">
{`// 1. Tag
const ServiceTag = Context.GenericTag<Service>("Service")
// 2. Layer  
const ServiceLayer = Layer.succeed(ServiceTag, impl)
// 3. Use
const program = Effect.gen(function* () {
  const service = yield* ServiceTag
  // use service
})`}
						</pre>
					</div>
					<div>
						<h4 className="font-medium text-pink-700 mb-2">Layer Types</h4>
						<pre className="bg-white p-3 rounded text-xs overflow-x-auto">
{`Layer.succeed(Tag, value)         // Simple
Layer.effect(Tag, Effect)         // With init
Layer.scoped(Tag, ScopedEffect)   // With cleanup`}
						</pre>
					</div>
					<div>
						<h4 className="font-medium text-pink-700 mb-2">Composition</h4>
						<pre className="bg-white p-3 rounded text-xs overflow-x-auto">
{`Layer.mergeAll(L1, L2, L3)        // Combine
pipe(Layer, Layer.provide(Dep))   // Provide deps
Effect.provide(program, Layer)    // Run with Layer`}
						</pre>
					</div>
				</div>
			</div>
		</div>
	)
}