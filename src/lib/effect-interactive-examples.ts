/**
 * Interactive Examples (v4)
 *
 * Minimal ServiceMap-based sample services exported for playground usage.
 */

import { Effect, Layer, ServiceMap } from 'effect'

interface Calculator {
  readonly add: (a: number, b: number) => number
  readonly multiply: (a: number, b: number) => number
}
class CalculatorTag extends ServiceMap.Service<CalculatorTag, Calculator>()('CalculatorService') {}

interface Logger {
  readonly log: (message: string) => Effect.Effect<void>
}
class LoggerTag extends ServiceMap.Service<LoggerTag, Logger>()('LoggerService') {}

interface Config {
  readonly baseUrl: string
}
class ConfigTag extends ServiceMap.Service<ConfigTag, Config>()('ConfigService') {}

interface ApiClient {
  readonly fetchUser: (id: string) => Effect.Effect<unknown>
}
class ApiClientTag extends ServiceMap.Service<ApiClientTag, ApiClient>()('ApiClientService') {}

interface Database {
  readonly findUser: (id: string) => Effect.Effect<unknown>
}
class DatabaseTag extends ServiceMap.Service<DatabaseTag, Database>()('DatabaseService') {}

interface UserRepository {
  readonly getById: (id: string) => Effect.Effect<unknown>
}
class UserRepositoryTag extends ServiceMap.Service<UserRepositoryTag, UserRepository>()('UserRepositoryService') {}

const CalculatorLayer = Layer.succeed(CalculatorTag, {
  add: (a: number, b: number) => a + b,
  multiply: (a: number, b: number) => a * b
})

const LoggerLayer = Layer.succeed(LoggerTag, {
  log: (message: string) => Effect.sync(() => console.log(`[LOG] ${message}`))
})

const ConfigLayer = Layer.succeed(ConfigTag, {
  baseUrl: 'https://api.example.com'
})

const ApiClientLayer = Layer.effect(
  ApiClientTag,
  Effect.gen(function* () {
    const config = yield* ConfigTag
    const logger = yield* LoggerTag

    return {
      fetchUser: (id: string) =>
        Effect.gen(function* () {
          yield* logger.log(`Fetching ${config.baseUrl}/users/${id}`)
          return { id, name: 'Demo User' }
        })
    }
  })
)

const DatabaseLayer = Layer.succeed(DatabaseTag, {
  findUser: (id: string) => Effect.succeed({ id, source: 'db' })
})

const UserRepositoryLayer = Layer.effect(
  UserRepositoryTag,
  Effect.gen(function* () {
    const db = yield* DatabaseTag
    const logger = yield* LoggerTag

    return {
      getById: (id: string) =>
        Effect.gen(function* () {
          yield* logger.log(`Repository lookup for ${id}`)
          return yield* db.findUser(id)
        })
    }
  })
)

const WiredApiClientLayer = ApiClientLayer.pipe(
  Layer.provide(LoggerLayer),
  Layer.provide(ConfigLayer)
)

const WiredUserRepositoryLayer = UserRepositoryLayer.pipe(
  Layer.provide(LoggerLayer),
  Layer.provide(DatabaseLayer)
)

const AppLayers = Layer.mergeAll(
  CalculatorLayer,
  LoggerLayer,
  ConfigLayer,
  WiredApiClientLayer
)

const RepositoryAppLayers = Layer.mergeAll(
  LoggerLayer,
  DatabaseLayer,
  WiredUserRepositoryLayer
)

export {
  CalculatorTag,
  LoggerTag,
  ConfigTag,
  ApiClientTag,
  DatabaseTag,
  UserRepositoryTag,
  AppLayers,
  RepositoryAppLayers
}
