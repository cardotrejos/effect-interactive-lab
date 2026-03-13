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
		title: 'Dependency Injection: Choose the Right Service Pattern',
		summary: 'Both patterns are valid in v4. Use function keys by default; use class + make + static layer when constructors depend on services.',
		v3Code: `// Pattern A: function key (minimal, preferred)
import { Effect, Layer, ServiceMap } from "effect"

interface Database {
  readonly query: (sql: string) => Effect.Effect<readonly unknown[]>
}

const Database = ServiceMap.Service<Database>("Database")

const DatabaseLive = Layer.succeed(Database, {
  query: (_sql) => Effect.sync(() => [])
})

const program = Effect.gen(function* () {
  const db = yield* Database
  return yield* db.query("select * from users")
}).pipe(Effect.provide(DatabaseLive))`,
		v4Code: `// Pattern B: class key (constructor has dependencies)
import { Effect, Layer, ServiceMap } from "effect"

const Config = ServiceMap.Service<{ readonly table: string }>("Config")

class Database extends ServiceMap.Service<Database>()("Database", {
  make: Effect.gen(function* () {
    const config = yield* Config
    return {
      query: (sql: string) =>
        Effect.sync(() => [{ sql, table: config.table }] as const)
    } as const
  })
}) {
  static readonly layer = Layer.effect(this, this.make)
}

const program = Effect.gen(function* () {
  const db = yield* Database
  return yield* db.query("select * from users")
}).pipe(
  Effect.provide(Database.layer.pipe(
    Layer.provide(Layer.succeed(Config, { table: "users" }))
  ))
)`,
		takeaways: [
			'Function syntax keeps simple services concise.',
			'Class syntax shines when you need `make` + colocated layer wiring.',
			'In both cases, access services with `yield* ServiceKey`.'
		]
	},
	schema: {
		title: 'Schema: encode/decode and make changes',
		summary: 'v4 keeps schema modeling similar while making conversion and construction intent explicit.',
		v3Code: `// Earlier style
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  email: Schema.String
})

const parse = Schema.decode(User)
const serialize = Schema.encode(User)

const user = User.make({ id: "1", email: "dev@effect.app" })`,
		v4Code: `// v4 style
import { Effect, Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  email: Schema.String
})

const parse = Schema.decodeEffect(User)
const serialize = Schema.encodeEffect(User)

const safeProgram = Effect.gen(function* () {
  const user = yield* User.make({ id: "1", email: "dev@effect.app" })
  return yield* serialize(user)
})`,
		takeaways: [
			'Use `Schema.decodeEffect` and `Schema.encodeEffect` for effect-aware conversion.',
			'Use `yield* schema.make(...)` for validated construction in Effect code.',
			'Use `makeUnsafe` only when validation is intentionally bypassed.'
		]
	},
	'bundle-size': {
		title: 'Bundle Size Improvements',
		summary: 'v4 design focuses on better package shape and tree-shaking for frontend usage.',
		v3Code: `// Typical v3-era concern
// - larger browser payloads
// - more fragmented imports across packages`,
		v4Code: `// Typical v4 direction
// - single core package for most APIs
// - better tree-shaking opportunities
// - smaller client bundles in many apps`,
		takeaways: [
			'Bundle outcomes are app-specific, but v4 generally improves tree-shaking.',
			'Consolidated imports reduce accidental over-importing.',
			'Measure with your own build pipeline after migration.'
		]
	},
	'package-consolidation': {
		title: 'Package Consolidation',
		summary: 'v4 simplifies dependency management with a more unified package surface.',
		v3Code: `// Earlier ecosystem in many projects
{
  "dependencies": {
    "effect": "^3.x",
    "@effect/schema": "^0.x",
    "@effect/data": "^0.x"
  }
}`,
		v4Code: `// v4 direction
{
  "dependencies": {
    "effect": "^4.x"
  }
}

// import { Effect, Layer, ServiceMap, Schema } from "effect"`,
		takeaways: [
			'Fewer package boundaries simplify upgrades.',
			'Import paths become more consistent across examples.',
			'Migration effort is usually lowest when done incrementally by module.'
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
					Use this tab as a migration cheat sheet with side-by-side snippets for core Effect concepts.
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
				<CodeExample title="Pattern A" code={section.v3Code} language="typescript" />
				<CodeExample title="Pattern B" code={section.v4Code} language="typescript" />
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
