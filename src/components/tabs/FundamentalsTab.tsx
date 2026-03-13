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
		title: '🧩 Services - Function Keys First',
		description:
			'In v4, the default service pattern is function syntax. Define a service key with ServiceMap.Service<T>(id), then use it with yield*.',
		code: `import { Effect, Layer, ServiceMap } from 'effect'

interface Logger {
  readonly log: (message: string) => Effect.Effect<void>
  readonly error: (message: string) => Effect.Effect<void>
}

const Logger = ServiceMap.Service<Logger>("Logger")

const LoggerLive = Layer.succeed(Logger, {
  log: (message) => Effect.sync(() => console.log(message)),
  error: (message) => Effect.sync(() => console.error(message))
})

const program = Effect.gen(function* () {
  const logger = yield* Logger
  yield* logger.log("Hello from Effect v4")
  yield* logger.error("Something went wrong")
})

Effect.runPromise(program.pipe(Effect.provide(LoggerLive)))`
	},

	context: {
		title: '📦 ServiceMap - Runtime Service Container',
		description:
			'ServiceMap is the immutable runtime map for service implementations. You can build it directly, then provide it to an Effect.',
		code: `import { Effect, ServiceMap } from 'effect'

interface Logger {
  readonly log: (message: string) => Effect.Effect<void>
}
const Logger = ServiceMap.Service<Logger>("Logger")

interface Database {
  readonly query: (sql: string) => Effect.Effect<unknown[]>
}
const Database = ServiceMap.Service<Database>("Database")

const services = ServiceMap.make(Logger, {
  log: (msg) => Effect.sync(() => console.log(\`[LOG] \${msg}\`))
}).pipe(
  ServiceMap.add(Database, {
    query: () => Effect.succeed([{ id: 1, name: "Test" }])
  })
)

const program = Effect.gen(function* () {
  const logger = yield* Logger
  const db = yield* Database
  yield* logger.log("Querying database...")
  return yield* db.query("SELECT * FROM users")
})

Effect.runPromise(program.pipe(Effect.provideServices(services)))`
	},

	layers: {
		title: '🏗️ Layers - Class + make for Dependencies',
		description:
			'Use class syntax when the service has an effectful constructor or explicit lifecycle. Define make, then expose a static layer.',
		code: `import { Effect, Layer, ServiceMap } from 'effect'

interface Config {
  readonly logLevel: 'debug' | 'info' | 'error'
}
const Config = ServiceMap.Service<Config>("Config")

class Logger extends ServiceMap.Service<Logger>()("Logger", {
  make: Effect.gen(function* () {
    const config = yield* Config
    return {
      log: (message: string) =>
        Effect.sync(() => console.log(\`[\${config.logLevel}] \${message}\`)),
      error: (message: string) =>
        Effect.sync(() => console.error(\`[error] \${message}\`))
    } as const
  })
}) {
  static readonly layer = Layer.effect(this, this.make)
}

const appLayer = Logger.layer.pipe(
  Layer.provide(Layer.succeed(Config, { logLevel: 'debug' as const }))
)`
	},

	composition: {
		title: '🔄 Real-World Composition Pattern',
		description:
			'Mix function keys and class services intentionally: function keys for plain contracts, class + make for dependent construction.',
		code: `import { Effect, Layer, ServiceMap } from 'effect'

interface HttpClient {
  readonly get: (path: string) => Effect.Effect<unknown, Error>
}
const HttpClient = ServiceMap.Service<HttpClient>("HttpClient")

interface Auth {
  readonly token: () => Effect.Effect<string>
}
class Auth extends ServiceMap.Service<Auth>()("Auth", {
  make: Effect.gen(function* () {
    const http = yield* HttpClient
    return {
      token: () => http.get("/token").pipe(Effect.as("token-123"))
    } as const
  })
}) {
  static readonly layer = Layer.effect(this, this.make)
}

const HttpClientLive = Layer.succeed(HttpClient, {
  get: (_path) => Effect.succeed({ ok: true })
})

const appLayer = Auth.layer.pipe(Layer.provide(HttpClientLive))

const fetchSession = Effect.gen(function* () {
  const auth = yield* Auth
  return yield* auth.token()
}).pipe(Effect.provide(appLayer))`
	},

	comparison: {
		title: '🔀 Function Keys vs Class Keys',
		description:
			'Use function keys by default. Use class keys when you need make and colocated static layers.',
		code: `import { Effect, Layer, ServiceMap } from 'effect'

interface PaymentApi {
  readonly charge: (amount: number) => Effect.Effect<string, Error>
}

// A) Preferred for simple services
const Payment = ServiceMap.Service<PaymentApi>("Payment")
const PaymentLayer = Layer.succeed(Payment, {
  charge: (amount) => Effect.succeed(\`tx-\${amount}\`)
})

// B) Useful when constructor has dependencies
const Config = ServiceMap.Service<{ readonly currency: string }>("Config")
class PaymentWithConfig extends ServiceMap.Service<PaymentWithConfig>()("PaymentWithConfig", {
  make: Effect.gen(function* () {
    const config = yield* Config
    return {
      charge: (amount: number) => Effect.succeed(\`tx-\${amount}-\${config.currency}\`)
    } as const
  })
}) {
  static readonly layer = Layer.effect(this, this.make)
}

const program = Effect.gen(function* () {
  const payment = yield* Payment
  return yield* payment.charge(99.99)
}).pipe(Effect.provide(PaymentLayer))`
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
					Effect v4 uses <code className="bg-white px-2 py-1 rounded">ServiceMap.Service</code> for
					service identity. Start with function keys, then move to class + <code>make</code> when
					service construction depends on other services.
				</p>
				<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
					<p className="text-sm">
						<strong>💡 Pro Tip:</strong> Function keys keep most services minimal; class keys are best
						for effectful constructors and static layers.
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
							<li>• Function syntax is the default in v4</li>
							<li>• Class syntax exists for make/static layer patterns</li>
							<li>• Replaces legacy Context/Tag style declarations</li>
							<li>• Use with yield* inside Effect.gen</li>
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
							<li>• Compose with provide/mergeAll</li>
						</ul>
					</div>
					<div className="bg-white p-4 rounded-lg">
						<h4 className="font-medium text-orange-600 mb-2">Generator Access</h4>
						<ul className="text-sm space-y-1 text-gray-600">
							<li>• Prefer yield* ServiceKey over accessor helpers</li>
							<li>• Keeps dependencies explicit in the program body</li>
							<li>• Works naturally with Effect.gen control flow</li>
							<li>• Improves readability for multi-service programs</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="bg-blue-50 p-6 rounded-lg">
				<h3 className="text-lg font-semibold mb-3">📚 Recommended Learning Path</h3>
				<ol className="space-y-2 text-sm">
					<li className="flex items-start">
						<span className="font-bold text-blue-600 mr-2">1.</span>
						<span>Start with function-style <strong>ServiceMap.Service</strong> keys</span>
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
						<span>Use <strong>yield*</strong> to access services in generators</span>
					</li>
					<li className="flex items-start">
						<span className="font-bold text-blue-600 mr-2">5.</span>
						<span>Adopt class + <strong>make</strong> only for effectful constructors</span>
					</li>
				</ol>
			</div>

			<div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
				<h3 className="text-lg font-semibold mb-4">🎯 Quick Reference</h3>
				<div className="grid md:grid-cols-2 gap-6">
					<div>
						<h4 className="font-medium text-purple-700 mb-2">Essential Imports</h4>
						<pre className="bg-white p-3 rounded text-xs overflow-x-auto">
{`import { Effect, ServiceMap, Layer } from 'effect'`}
						</pre>
					</div>
					<div>
						<h4 className="font-medium text-purple-700 mb-2">Default Pattern</h4>
						<pre className="bg-white p-3 rounded text-xs overflow-x-auto">
{`const ServiceKey = ServiceMap.Service<Service>("Service")
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
Layer.effect(Key, Effect)            // Effectful constructor
Layer.scoped(Key, ScopedEffect)      // Constructor with cleanup`}
						</pre>
					</div>
					<div>
						<h4 className="font-medium text-pink-700 mb-2">Class Pattern</h4>
						<pre className="bg-white p-3 rounded text-xs overflow-x-auto">
{`class Service extends ServiceMap.Service<Service>()("Service", {
  make: Effect.gen(function* () { /* ... */ })
}) {
  static readonly layer = Layer.effect(this, this.make)
}`}
						</pre>
					</div>
				</div>
			</div>
		</div>
	)
}
