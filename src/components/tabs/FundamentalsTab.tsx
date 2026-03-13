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
		title: '🧩 Services - Type-Safe Service Identifiers',
		description:
			'In v4, service identity is modeled with ServiceMap.Service classes. They are the keys you yield in Effects and provide with Layers.',
		code: `import { Effect, ServiceMap } from 'effect'

interface Logger {
  log: (message: string) => Effect.Effect<void>
  error: (message: string) => Effect.Effect<void>
}

class LoggerService extends ServiceMap.Service<LoggerService, Logger>()(
  "LoggerService"
) {}

console.log("Service key:", LoggerService.key) // "LoggerService"

const program = Effect.gen(function* () {
  const logger = yield* LoggerService
  yield* logger.log("Hello from Effect v4")
  yield* logger.error("Something went wrong")
})

// This program needs a LoggerService implementation
// provided via Layer or ServiceMap.`
	},

	context: {
		title: '📦 ServiceMap - Runtime Service Container',
		description:
			'ServiceMap is the immutable runtime container for service implementations. Build it directly or let Layer composition do it for you.',
		code: `import { Effect, ServiceMap, pipe } from 'effect'

interface Logger {
  log: (message: string) => Effect.Effect<void>
}
class LoggerService extends ServiceMap.Service<LoggerService, Logger>()("LoggerService") {}

interface Database {
  query: (sql: string) => Effect.Effect<unknown[]>
}
class DatabaseService extends ServiceMap.Service<DatabaseService, Database>()("DatabaseService") {}

const services = pipe(
  ServiceMap.make(LoggerService, {
    log: (msg) => Effect.sync(() => console.log(
      \`[LOG] \${msg}\`
    ))
  }),
  ServiceMap.add(DatabaseService, {
    query: () => Effect.succeed([{ id: 1, name: "Test" }])
  })
)

const program = Effect.gen(function* () {
  const logger = yield* LoggerService
  const db = yield* DatabaseService
  yield* logger.log("Querying database...")
  return yield* db.query("SELECT * FROM users")
})

Effect.runPromise(
  pipe(program, Effect.provideServices(services))
)`
	},

	layers: {
		title: '🏗️ Layers - Composable Service Factories',
		description:
			'Layers are still the preferred way to build and wire services. In v4, they target ServiceMap.Service keys.',
		code: `import { Effect, Layer, ServiceMap, pipe } from 'effect'

interface Logger {
  log: (message: string) => Effect.Effect<void>
  error: (message: string) => Effect.Effect<void>
}
class LoggerService extends ServiceMap.Service<LoggerService, Logger>()("LoggerService") {}

interface Config {
  logLevel: 'debug' | 'info' | 'error'
  apiUrl: string
}
class ConfigService extends ServiceMap.Service<ConfigService, Config>()("ConfigService") {}

const ConfigLayer = Layer.succeed(ConfigService, {
  logLevel: 'debug',
  apiUrl: 'https://api.example.com'
})

const ConsoleLoggerLayer = Layer.succeed(LoggerService, {
  log: (msg: string) => Effect.sync(() => console.log(msg)),
  error: (msg: string) => Effect.sync(() => console.error(msg))
})

const ConfigurableLoggerLayer = Layer.effect(
  LoggerService,
  Effect.gen(function* () {
    const config = yield* ConfigService

    return {
      log: (msg: string) => Effect.sync(() => {
        if (config.logLevel !== 'error') {
          console.log(\`[\${config.logLevel.toUpperCase()}] \${msg}\`)
        }
      }),
      error: (msg: string) => Effect.sync(() => console.error(msg))
    }
  })
)

const AppLayer = pipe(
  ConfigurableLoggerLayer,
  Layer.provide(ConfigLayer)
)`
	},

	composition: {
		title: '🔄 Real-World Composition Pattern',
		description:
			'ServiceMap keys and Layer wiring compose the same way as before, but with v4 service identities.',
		code: `import { Effect, Layer, ServiceMap, pipe } from 'effect'

interface Logger {
  log: (message: string) => Effect.Effect<void>
}
interface Config {
  apiUrl: string
}
interface AuthService {
  getToken: () => Effect.Effect<string, Error>
}
interface ApiClient {
  get: (path: string) => Effect.Effect<unknown, Error>
}

class LoggerService extends ServiceMap.Service<LoggerService, Logger>()("LoggerService") {}
class ConfigService extends ServiceMap.Service<ConfigService, Config>()("ConfigService") {}
class AuthServiceLive extends ServiceMap.Service<AuthServiceLive, AuthService>()("AuthService") {}
class ApiClientService extends ServiceMap.Service<ApiClientService, ApiClient>()("ApiClientService") {}

const AuthLayer = Layer.effect(
  AuthServiceLive,
  Effect.gen(function* () {
    const logger = yield* LoggerService
    let token = "initial-token"

    return {
      getToken: () => Effect.gen(function* () {
        yield* logger.log("Refreshing auth token...")
        token = \`token-\${Date.now()}\`
        return token
      })
    }
  })
)

const ApiClientLayer = Layer.effect(
  ApiClientService,
  Effect.gen(function* () {
    const config = yield* ConfigService
    const auth = yield* AuthServiceLive

    return {
      get: (path: string) => Effect.gen(function* () {
        const token = yield* auth.getToken()
        return { url: \`\${config.apiUrl}\${path}\`, token }
      })
    }
  })
)

const appLayer = Layer.mergeAll(
  Layer.succeed(ConfigService, { apiUrl: 'https://api.example.com' }),
  Layer.succeed(LoggerService, { log: (m: string) => Effect.sync(() => console.log(m)) }),
  pipe(AuthLayer),
  pipe(ApiClientLayer)
)

const fetchUserData = (userId: string) =>
  Effect.gen(function* () {
    const api = yield* ApiClientService
    return yield* api.get(\`/users/\${userId}\`)
  })

Effect.runPromise(fetchUserData('123').pipe(Effect.provide(appLayer)))`
	},

	comparison: {
		title: '🔀 Manual ServiceMap vs Effect.Service',
		description:
			'Both approaches are valid in v4. Manual ServiceMap classes are explicit; Effect.Service reduces boilerplate for common service patterns.',
		code: `import { Effect, Layer, ServiceMap } from 'effect'

interface PaymentApi {
  charge: (amount: number, currency: string) => Effect.Effect<string, Error>
  refund: (transactionId: string) => Effect.Effect<void, Error>
}

// MANUAL V4 APPROACH
class PaymentServiceManual extends ServiceMap.Service<
  PaymentServiceManual,
  PaymentApi
>()("PaymentService") {}

const PaymentLayerManual = Layer.effect(
  PaymentServiceManual,
  Effect.succeed({
    charge: (amount: number, currency: string) =>
      Effect.succeed(\`tx-\${amount}-\${currency}\`),
    refund: () => Effect.void
  })
)

// EFFECT.SERVICE APPROACH
class PaymentService extends Effect.Service<PaymentService>()(
  "PaymentService",
  {
    effect: Effect.succeed({
      charge: (amount: number, currency: string) =>
        Effect.succeed(\`tx-\${amount}-\${currency}\`),
      refund: () => Effect.void
    })
  }
) {}

const program = Effect.gen(function* () {
  const payment = yield* PaymentServiceManual
  return yield* payment.charge(99.99, "USD")
})

Effect.runPromise(program.pipe(Effect.provide(PaymentLayerManual)))`
	}
}

export default function FundamentalsTab(): React.ReactElement {
	const [selectedConcept, setSelectedConcept] = useState<FundamentalsConcept>('tags')
	const currentSection = conceptSections[selectedConcept]

	return (
		<div className="space-y-6">
			<div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
				<h2 className="text-2xl font-bold mb-3">Understanding ServiceMap and Layers</h2>
				<p className="text-gray-700 mb-4">
					Effect v4 replaces legacy tag declarations with{' '}
					<code className="bg-white px-2 py-1 rounded">ServiceMap.Service</code>. The dependency
					 injection model is the same, but service identity is now class-based.
				</p>
				<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
					<p className="text-sm">
						<strong>💡 Pro Tip:</strong> Learn the manual ServiceMap pattern first; then use
						 helper APIs where they reduce boilerplate.
					</p>
				</div>
			</div>

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

			<div className="space-y-4">
				<div>
					<h3 className="text-xl font-semibold mb-2">{currentSection.title}</h3>
					<p className="text-gray-600">{currentSection.description}</p>
				</div>

				<CodeExample title="Code Example" code={currentSection.code} language="typescript" />
			</div>

			<div className="bg-gray-50 p-6 rounded-lg space-y-4">
				<h3 className="text-lg font-semibold">🔑 Key Insights</h3>
				<div className="grid md:grid-cols-2 gap-4">
					<div className="bg-white p-4 rounded-lg">
						<h4 className="font-medium text-blue-600 mb-2">ServiceMap.Service</h4>
						<ul className="text-sm space-y-1 text-gray-600">
							<li>• Type-safe service identifiers</li>
							<li>• Class-based keys you can yield directly</li>
							<li>• Replaces legacy GenericTag declarations in v4</li>
							<li>• Works with Layer and Effect.provide</li>
						</ul>
					</div>
					<div className="bg-white p-4 rounded-lg">
						<h4 className="font-medium text-green-600 mb-2">ServiceMap</h4>
						<ul className="text-sm space-y-1 text-gray-600">
							<li>• Runtime container for service implementations</li>
							<li>• Immutable map of key → service</li>
							<li>• Built with make/add helpers</li>
							<li>• Usually managed through Layer composition</li>
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
							<li>• Optional helper for service classes</li>
							<li>• Reduces boilerplate for defaults</li>
							<li>• Integrates with Layer and Effect</li>
							<li>• Great for app-level services</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="bg-blue-50 p-6 rounded-lg">
				<h3 className="text-lg font-semibold mb-3">📚 Recommended Learning Path</h3>
				<ol className="space-y-2 text-sm">
					<li className="flex items-start">
						<span className="font-bold text-blue-600 mr-2">1.</span>
						<span>Start with <strong>ServiceMap.Service</strong> identifiers</span>
					</li>
					<li className="flex items-start">
						<span className="font-bold text-blue-600 mr-2">2.</span>
						<span>Learn how <strong>ServiceMap</strong> stores runtime services</span>
					</li>
					<li className="flex items-start">
						<span className="font-bold text-blue-600 mr-2">3.</span>
						<span>Master <strong>Layers</strong> for service construction</span>
					</li>
					<li className="flex items-start">
						<span className="font-bold text-blue-600 mr-2">4.</span>
						<span>Practice composition patterns with multiple dependencies</span>
					</li>
					<li className="flex items-start">
						<span className="font-bold text-blue-600 mr-2">5.</span>
						<span>Use <strong>Effect.Service</strong> when you want concise service definitions</span>
					</li>
				</ol>
			</div>

			<div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
				<h3 className="text-lg font-semibold mb-4">🎯 Quick Reference</h3>
				<div className="grid md:grid-cols-2 gap-6">
					<div>
						<h4 className="font-medium text-purple-700 mb-2">Essential Imports</h4>
						<pre className="bg-white p-3 rounded text-xs overflow-x-auto">
{`import { Effect, ServiceMap, Layer, pipe } from 'effect'`}
						</pre>
					</div>
					<div>
						<h4 className="font-medium text-purple-700 mb-2">Basic Pattern</h4>
						<pre className="bg-white p-3 rounded text-xs overflow-x-auto">
{`class ServiceKey extends ServiceMap.Service<ServiceKey, Service>()("Service") {}
const ServiceLayer = Layer.succeed(ServiceKey, impl)
const program = Effect.gen(function* () {
  const service = yield* ServiceKey
  // use service
})`}
						</pre>
					</div>
					<div>
						<h4 className="font-medium text-pink-700 mb-2">Layer Types</h4>
						<pre className="bg-white p-3 rounded text-xs overflow-x-auto">
{`Layer.succeed(Key, value)           // Simple
Layer.effect(Key, Effect)           // With init
Layer.scoped(Key, ScopedEffect)     // With cleanup`}
						</pre>
					</div>
					<div>
						<h4 className="font-medium text-pink-700 mb-2">Composition</h4>
						<pre className="bg-white p-3 rounded text-xs overflow-x-auto">
{`Layer.mergeAll(L1, L2, L3)          // Combine
pipe(Layer, Layer.provide(Dep))     // Provide deps
Effect.provide(program, Layer)      // Run with Layer`}
						</pre>
					</div>
				</div>
			</div>
		</div>
	)
}
