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
		description: 'Service identity moves from Context.Tag values to ServiceMap.Service definitions in v4. Core Effect and Layer composition patterns still transfer directly.',
		v3Code: `// Effect v3: Context.GenericTag + Layer.effect
import { Context, Effect, Layer } from "effect"

interface Logger {
  log: (message: string) => Effect.Effect<void>
}

const LoggerTag = Context.GenericTag<Logger>("Logger")

const LoggerLive = Layer.succeed(LoggerTag, {
  log: (message) => Effect.sync(() => console.log(message))
})

const program = Effect.gen(function* () {
  const logger = yield* LoggerTag
  yield* logger.log("running v3 program")
}).pipe(Effect.provide(LoggerLive))`,
		v4Code: `// Effect v4: ServiceMap.Service identity
import { Effect, Layer, ServiceMap } from "effect"

interface Logger {
  readonly log: (message: string) => Effect.Effect<void>
}

class LoggerService extends ServiceMap.Service<LoggerService>()(
  "LoggerService",
  { effect: Effect.succeed({
      log: (message: string) => Effect.sync(() => console.log(message))
    })
  }
) {}

const program = Effect.gen(function* () {
  const logger = yield* LoggerService
  yield* logger.log("running v4 program")
}).pipe(Effect.provide(Layer.succeed(LoggerService, {
  log: (message) => Effect.sync(() => console.log(message))
})))`,
		highlights: [
			'`Context.GenericTag` becomes `ServiceMap.Service` for service identity.',
			'`Layer.succeed` and `Effect.provide` still work; composition stays familiar.',
			'Migration is mostly mechanical: update tag/service declarations.'
		]
	},
	schema: {
		title: '📐 Schema API Changes',
		description: 'v4 makes schema encoding/decoding effectful and introduces explicit construction APIs for safe vs unsafe object creation.',
		v3Code: `// Effect v3 schema style
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  email: Schema.String
})

const decodeUser = Schema.decode(User)
const encodeUser = Schema.encode(User)

const user = User.make({
  id: "u_1",
  email: "team@example.com"
})`,
		v4Code: `// Effect v4 schema style
import { Effect, Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  email: Schema.String
})

const decodeUser = Schema.decodeEffect(User)
const encodeUser = Schema.encodeEffect(User)

const userUnsafe = User.makeUnsafe({
  id: "u_1",
  email: "team@example.com"
})

const program = Effect.gen(function* () {
  const user = yield* User.make({
    id: "u_1",
    email: "team@example.com"
  })
  return user
})`,
		highlights: [
			'`Schema.encode/decode` moves to `Schema.encodeEffect/decodeEffect`.',
			'`schema.make()` now has explicit options: `makeUnsafe()` or `yield* schema.make()`.',
			'Decode and encode paths become explicit in types and runtime flow.'
		]
	},
	compatibility: {
		title: '✅ Compatibility Notes',
		description: 'Many everyday patterns remain stable, so you can migrate incrementally instead of rewriting the application architecture.',
		code: `import { Effect, Layer, Schema } from "effect"

// These patterns stay valid in both v3 and v4:
// - Effect.gen / Effect.flatMap / Effect.map
// - Layer.succeed / Layer.effect / Layer.mergeAll
// - Existing service wiring strategy with provide/provideSome

const ConfigLive = Layer.succeed("Config", { baseUrl: "https://api.app" })

const program = Effect.gen(function* () {
  // your business logic stays inside Effect programs
  return "still works with familiar Layer + Effect patterns"
})`,
		highlights: [
			'Existing `Layer.succeed` and `Layer.effect` usage remains valid.',
			'Most business logic inside `Effect.gen` can be carried forward unchanged.',
			'Focus migration effort on DI identity and schema constructor changes first.'
		]
	},
	packaging: {
		title: '📦 Packaging & Bundle Size',
		description: 'v4 consolidates package distribution under `effect@4.x` and improves tree-shaking for much smaller client bundles.',
		code: `// Package model
// v3 ecosystem: multiple packages and heavier browser payloads
// v4 ecosystem: unified package under effect@4.x

// npm install effect@4.x

// Expected browser bundle impact (from Effect v4 beta notes):
// - before: ~70KB
// - after:  ~20KB
// - delta:  ~50KB reduction

// Result: smaller JS payloads and faster startup for interactive apps`,
		highlights: [
			'Package consolidation: all core APIs are unified under `effect@4.x`.',
			'Reported bundle impact: roughly `70KB → 20KB` in browser-focused builds.',
			'Smaller bundles make v4 attractive even before full feature migration.'
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
					This tab keeps v3 as the default path and explains how to migrate safely to v4. Use the
					sections below to compare old and new APIs with concrete code.
				</p>
				<div className="bg-white border border-purple-200 rounded p-4 text-sm text-gray-700">
					<p>
						<strong>Key changes to watch:</strong> `Context.GenericTag` to `ServiceMap.Service`,
						`Schema.encode/decode` to effectful variants, constructor updates with `makeUnsafe`,
						and package consolidation with better bundle size.
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
						<CodeExample
							title="Effect v3 (Before)"
							code={currentSection.v3Code ?? ''}
							language="typescript"
						/>
						<CodeExample
							title="Effect v4 (After)"
							code={currentSection.v4Code ?? ''}
							language="typescript"
						/>
					</div>
				) : (
					<CodeExample
						title="Code Example"
						code={currentSection.code ?? ''}
						language="typescript"
					/>
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
							href="https://effect.website/blog/releases/effect/40-beta/"
							className="text-blue-600 hover:underline"
							target="_blank"
							rel="noreferrer"
						>
							Effect v4 Beta Blog Post →
						</a>
					</li>
					<li>
						<a
							href="https://github.com/Effect-TS/effect-smol/blob/main/MIGRATION.md"
							className="text-blue-600 hover:underline"
							target="_blank"
							rel="noreferrer"
						>
							Effect Migration Guide →
						</a>
					</li>
				</ul>
			</div>
		</div>
	)
}
