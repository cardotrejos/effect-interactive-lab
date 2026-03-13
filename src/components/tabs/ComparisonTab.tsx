import React, { useState } from 'react'
import CodeExample from '../shared/CodeExample'

type ComparisonTopic =
	| 'dependency-injection'
	| 'schema'
	| 'bundle-size'
	| 'package-consolidation'

interface ComparisonSection {
	title: string
	summary: string
	v3Code: string
	v4Code: string
	takeaways: string[]
}

const comparisonSections: Record<ComparisonTopic, ComparisonSection> = {
	'dependency-injection': {
		title: 'Dependency Injection: ServiceMap Patterns',
		summary: 'v4 supports multiple DI styles: function-style ServiceMap keys and class-style ServiceMap keys.',
		v3Code: `// Effect v4: function-style key
import { Effect, Layer, ServiceMap } from "effect"

interface Database {
  readonly query: (sql: string) => Effect.Effect<readonly unknown[]>
}

const DatabaseService = ServiceMap.Service<Database>("DatabaseService")

const DatabaseLive = Layer.effect(
  DatabaseService,
  Effect.succeed({
    query: (_sql) => Effect.sync(() => [])
  })
)

const program = Effect.gen(function* () {
  const db = yield* DatabaseService
  return yield* db.query("select * from users")
}).pipe(Effect.provide(DatabaseLive))`,
		v4Code: `// Effect v4: class-style key
import { Effect, Layer, ServiceMap } from "effect"

interface Database {
  readonly query: (sql: string) => Effect.Effect<readonly unknown[]>
}

class DatabaseService extends ServiceMap.Service<DatabaseService, Database>()("DatabaseService") {}

const program = Effect.gen(function* () {
  const db = yield* DatabaseService
  return yield* db.query("select * from users")
}).pipe(Effect.provide(Layer.succeed(DatabaseService, {
  query: (_sql) => Effect.sync(() => [])
})))`,
		takeaways: [
			'Choose function-style keys for minimal setup and class-style keys for explicit identity.',
			'`Layer.succeed`, `Layer.effect`, and `Effect.provide` remain central patterns.',
			'Most runtime behavior remains the same across both styles.'
		]
	},
	schema: {
		title: 'Schema: encode/decode and make changes',
		summary: 'v4 makes conversion APIs explicitly effectful and clarifies safe versus unsafe constructors.',
		v3Code: `// Effect v3
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  email: Schema.String
})

const parse = Schema.decode(User)
const serialize = Schema.encode(User)

const user = User.make({ id: "1", email: "dev@effect.app" })`,
		v4Code: `// Effect v4
import { Effect, Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  email: Schema.String
})

const parse = Schema.decodeEffect(User)
const serialize = Schema.encodeEffect(User)

const unsafeUser = User.makeUnsafe({ id: "1", email: "dev@effect.app" })

const safeProgram = Effect.gen(function* () {
  return yield* User.make({ id: "1", email: "dev@effect.app" })
})`,
		takeaways: [
			'Use `Schema.decodeEffect` and `Schema.encodeEffect` for effectful conversions.',
			'Replace `schema.make()` with `schema.makeUnsafe()` or `yield* schema.make()`.',
			'Schema migration is usually search-and-replace with explicit runtime intent.'
		]
	},
	'bundle-size': {
		title: 'Bundle Size Improvements',
		summary: 'The v4 beta focuses heavily on tree-shaking and package shape, reducing browser payload size.',
		v3Code: `// Typical bundle profile in v3-era apps
// effect runtime + utility imports
// approx browser payload: ~70KB
//
// Example concern:
// - slower first load
// - larger JS parse/execute cost`,
		v4Code: `// Typical bundle profile in v4 beta notes
// unified package layout + improved tree-shaking
// approx browser payload: ~20KB
//
// Expected gain:
// - around 50KB reduction
// - faster load and startup`,
		takeaways: [
			'Reference metric from release notes: `70KB → 20KB`.',
			'The improvement is a practical reason to plan v4 migration for frontend apps.',
			'Run your own bundle analysis after migration to verify app-specific impact.'
		]
	},
	'package-consolidation': {
		title: 'Package Consolidation',
		summary: 'v4 simplifies dependency management by consolidating APIs under the `effect` package.',
		v3Code: `// v3-era ecosystem in many projects
// package.json
{
  "dependencies": {
    "effect": "^3.x",
    "@effect/schema": "^0.x",
    "@effect/data": "^0.x"
  }
}`,
		v4Code: `// v4 package direction
// package.json
{
  "dependencies": {
    "effect": "^4.x"
  }
}

// import { Effect, Schema, Layer } from "effect"`,
		takeaways: [
			'Fewer package boundaries make onboarding and upgrades simpler.',
			'Imports become more consistent across modules and examples.',
			'This project keeps v3 default now, but the tab demonstrates the v4 target shape.'
		]
	}
}

export default function ComparisonTab(): React.ReactElement {
	const [topic, setTopic] = useState<ComparisonTopic>('dependency-injection')
	const section = comparisonSections[topic]

	return (
		<div className="space-y-6">
			<div className="bg-gradient-to-r from-slate-50 to-cyan-50 p-6 rounded-lg">
				<h2 className="text-2xl font-bold mb-3">v3 vs v4 Comparison</h2>
				<p className="text-gray-700">
					Use this tab as a migration cheat sheet with before/after snippets for core Effect concepts.
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				{(Object.keys(comparisonSections) as ComparisonTopic[]).map((key) => (
					<button
						key={key}
						onClick={() => setTopic(key)}
						className={`px-4 py-2 rounded-lg font-medium transition-all ${
							topic === key
								? 'bg-cyan-600 text-white'
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
						}`}
					>
						{comparisonSections[key].title}
					</button>
				))}
			</div>

			<div className="space-y-2">
				<h3 className="text-xl font-semibold">{section.title}</h3>
				<p className="text-gray-600">{section.summary}</p>
			</div>

			<div className="grid lg:grid-cols-2 gap-4">
				<CodeExample
					title="Pattern A"
					code={section.v3Code}
					language="typescript"
				/>
				<CodeExample
					title="Pattern B"
					code={section.v4Code}
					language="typescript"
				/>
			</div>

			<div className="bg-gray-50 p-6 rounded-lg">
				<h3 className="text-lg font-semibold mb-3">What To Notice</h3>
				<ul className="space-y-2 text-sm text-gray-700">
					{section.takeaways.map((item) => (
						<li key={item}>• {item}</li>
					))}
				</ul>
			</div>
		</div>
	)
}
