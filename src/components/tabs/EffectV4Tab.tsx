import React, { useState } from 'react'
import CodeExample from '../shared/CodeExample'

type V4Feature = 'migration' | 'schema' | 'compatibility' | 'packaging'

interface FeatureSection {
	title: string
	description: string
	v3Code?: string
	v4Code?: string
	code?: string
	highlights: string[]
}

const featureSections: Record<V4Feature, FeatureSection> = {
	migration: {
		title: '🧭 Dependency Injection Migration',
		description:
			'Use function keys as the default service declaration. Use class syntax with make when the service constructor needs dependencies.',
		v3Code: `// Pattern A: function key (preferred for simple services)
import { Effect, Layer, ServiceMap } from "effect"

interface Logger {
  readonly log: (message: string) => Effect.Effect<void>
}

const Logger = ServiceMap.Service<Logger>("Logger")

const LoggerLive = Layer.succeed(Logger, {
  log: (message) => Effect.sync(() => console.log(message))
})

const program = Effect.gen(function* () {
  const logger = yield* Logger
  yield* logger.log("running function-style v4 program")
}).pipe(Effect.provide(LoggerLive))`,
		v4Code: `// Pattern B: class key + make + static layer (for dependencies)
import { Effect, Layer, ServiceMap } from "effect"

const Config = ServiceMap.Service<{ readonly prefix: string }>("Config")

class Logger extends ServiceMap.Service<Logger>()("Logger", {
  make: Effect.gen(function* () {
    const config = yield* Config
    return {
      log: (message: string) =>
        Effect.sync(() => console.log(\`[\${config.prefix}] \${message}\`))
    } as const
  })
}) {
  static readonly layer = Layer.effect(this, this.make)
}

const program = Effect.gen(function* () {
  const logger = yield* Logger
  yield* logger.log("running class-style v4 program")
}).pipe(
  Effect.provide(Logger.layer.pipe(
    Layer.provide(Layer.succeed(Config, { prefix: "app" }))
  ))
)`,
		highlights: [
			'Function keys are the normal v4 default.',
			'Use class + `make` when initialization depends on other services.',
			'Expose an explicit layer with `Layer.effect(this, this.make)`.'
		]
	},
	schema: {
		title: '📐 Schema API Changes',
		description:
			'v4 keeps schema construction familiar but makes decode/encode pipelines explicit and effect-friendly.',
		v3Code: `// Earlier schema style
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  email: Schema.String
})

const decodeUser = Schema.decode(User)
const encodeUser = Schema.encode(User)`,
		v4Code: `// v4 schema style
import { Effect, Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  email: Schema.String
})

const decodeUser = Schema.decodeEffect(User)
const encodeUser = Schema.encodeEffect(User)

const program = Effect.gen(function* () {
  const user = yield* User.make({
    id: "u_1",
    email: "team@example.com"
  })
  return yield* encodeUser(user)
})`,
		highlights: [
			'Use `Schema.decodeEffect` and `Schema.encodeEffect` for effectful conversion.',
			'Prefer `yield* schema.make(...)` when creation should be validated in-effect.',
			'Use `makeUnsafe` only when you intentionally skip validation.'
		]
	},
	compatibility: {
		title: '✅ Compatibility Notes',
		description:
			'Most business logic patterns stay the same: Effect.gen, Layer composition, and explicit dependencies.',
		code: `import { Effect, Layer, ServiceMap } from "effect"

interface Config {
  readonly baseUrl: string
}
const Config = ServiceMap.Service<Config>("Config")

const ConfigLive = Layer.succeed(Config, { baseUrl: "https://api.app" })

const program = Effect.gen(function* () {
  const config = yield* Config
  return \`calling \${config.baseUrl}\`
}).pipe(Effect.provide(ConfigLive))`,
		highlights: [
			'`Effect.gen` + `yield*` remains the main authoring style.',
			'`Layer.succeed`, `Layer.effect`, and `Layer.mergeAll` remain core APIs.',
			'Migrate service declarations first, then refine layer structure.'
		]
	},
	packaging: {
		title: '📦 Packaging & Bundle Size',
		description: 'v4 consolidates core APIs under `effect` and improves tree-shaking.',
		code: `// Package model
// v4: install one primary runtime package
// npm install effect@4.x

// Import style stays consistent:
// import { Effect, Layer, ServiceMap, Schema } from "effect"

// This usually yields smaller browser bundles than v3-era setups.`,
		highlights: [
			'Core APIs are unified under `effect`.',
			'Imports become simpler and more consistent.',
			'Tree-shaking improvements reduce client payload in many projects.'
		]
	}
}

export default function EffectV4Tab(): React.ReactElement {
	const [selectedFeature, setSelectedFeature] = useState<V4Feature>('migration')
	const currentSection = featureSections[selectedFeature]
	const hasComparison = Boolean(currentSection.v3Code && currentSection.v4Code)

	return (
		<div className="space-y-6">
			<div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg">
				<h2 className="text-2xl font-bold mb-3">⚡ Effect v4 Migration Guide</h2>
				<p className="text-gray-700 mb-4">
					This tab focuses on idiomatic v4 patterns and practical migration choices.
				</p>
				<div className="bg-white border border-purple-200 rounded p-4 text-sm text-gray-700">
					<p>
						<strong>Key changes to watch:</strong> function-first service declarations with
						<code> ServiceMap.Service</code>, class services with explicit <code>make</code> +
						<code> layer</code> for dependency-aware constructors, and generator access via
						<code> yield*</code>.
					</p>
				</div>
			</div>

			<div className="flex flex-wrap gap-2">
				{(Object.keys(featureSections) as V4Feature[]).map((feature) => (
					<button
						key={feature}
						onClick={() => setSelectedFeature(feature)}
						className={`px-4 py-2 rounded-lg font-medium transition-all ${
							selectedFeature === feature
								? 'bg-purple-600 text-white'
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
						}`}
					>
						{featureSections[feature].title}
					</button>
				))}
			</div>

			<div className="space-y-4">
				<div>
					<h3 className="text-xl font-semibold mb-2">{currentSection.title}</h3>
					<p className="text-gray-600">{currentSection.description}</p>
				</div>

				{hasComparison ? (
					<div className="grid lg:grid-cols-2 gap-4">
						<CodeExample title="Pattern A" code={currentSection.v3Code ?? ''} language="typescript" />
						<CodeExample title="Pattern B" code={currentSection.v4Code ?? ''} language="typescript" />
					</div>
				) : (
					<CodeExample title="Code Example" code={currentSection.code ?? ''} language="typescript" />
				)}
			</div>

			<div className="bg-gray-50 p-6 rounded-lg">
				<h3 className="text-lg font-semibold mb-3">Migration Notes</h3>
				<ul className="space-y-2 text-sm text-gray-700">
					{currentSection.highlights.map((item) => (
						<li key={item}>• {item}</li>
					))}
				</ul>
			</div>

			<div className="bg-gray-50 p-6 rounded-lg">
				<h3 className="text-lg font-semibold mb-3">References</h3>
				<ul className="space-y-2 text-sm">
					<li>
						<a
							href="https://github.com/Effect-TS/effect-smol/blob/main/migration/services.md"
							className="text-blue-600 hover:underline"
							target="_blank"
							rel="noreferrer"
						>
							Service Migration Guide →
						</a>
					</li>
					<li>
						<a
							href="https://effect.website/docs/requirements-management/services/"
							className="text-blue-600 hover:underline"
							target="_blank"
							rel="noreferrer"
						>
							Effect Services Docs →
						</a>
					</li>
				</ul>
			</div>
		</div>
	)
}
