/**
 * Effect Fundamentals (v4)
 *
 * This module keeps small, executable examples that use ServiceMap-based DI.
 */

import { Effect, Layer, ServiceMap, pipe } from 'effect'

interface Logger {
  readonly log: (message: string) => Effect.Effect<void>
}
class LoggerService extends ServiceMap.Service<LoggerService, Logger>()('LoggerService') {}

interface Database {
  readonly query: (sql: string) => Effect.Effect<readonly unknown[]>
}
class DatabaseService extends ServiceMap.Service<DatabaseService, Database>()('DatabaseService') {}

interface Config {
  readonly apiUrl: string
}
class ConfigService extends ServiceMap.Service<ConfigService, Config>()('ConfigService') {}

interface ApiClient {
  readonly get: (path: string) => Effect.Effect<unknown>
}
class ApiClientService extends ServiceMap.Service<ApiClientService, ApiClient>()('ApiClientService') {}

interface EmailService {
  readonly send: (to: string, subject: string, body: string) => Effect.Effect<void>
}
class EmailServiceKey extends ServiceMap.Service<EmailServiceKey, EmailService>()('EmailService') {}

export const ConsoleLoggerLayer = Layer.succeed(LoggerService, {
  log: (message: string) => Effect.sync(() => console.log(`[LOG] ${message}`))
})

const MockDatabaseLayer = Layer.succeed(DatabaseService, {
  query: (_sql: string) => Effect.succeed([{ id: 1, name: 'Ada' }])
})

const ConfigLayer = Layer.succeed(ConfigService, {
  apiUrl: 'https://api.example.com'
})

const ApiClientLayer = Layer.effect(
  ApiClientService,
  Effect.gen(function* () {
    const config = yield* ConfigService
    const logger = yield* LoggerService

    return {
      get: (path: string) =>
        Effect.gen(function* () {
          yield* logger.log(`GET ${config.apiUrl}${path}`)
          return { path, ok: true }
        })
    }
  })
)

const EmailLayer = Layer.succeed(EmailServiceKey, {
  send: (to: string, subject: string) =>
    Effect.sync(() => console.log(`Email sent to ${to}: ${subject}`))
})

export const FullAppLayer = Layer.mergeAll(
  ConsoleLoggerLayer,
  MockDatabaseLayer,
  ConfigLayer,
  pipe(ApiClientLayer, Layer.provide(ConsoleLoggerLayer), Layer.provide(ConfigLayer))
)

const baseProgram1 = Effect.gen(function* () {
  const logger = yield* LoggerService
  yield* logger.log('program1: logger available')
  return 'ok'
})

const baseProgram2 = Effect.gen(function* () {
  const db = yield* DatabaseService
  return yield* db.query('SELECT * FROM users')
})

const baseApiProgram = Effect.gen(function* () {
  const api = yield* ApiClientService
  return yield* api.get('/users/123')
})

const baseManualProgram = Effect.gen(function* () {
  const email = yield* EmailServiceKey
  yield* email.send('dev@example.com', 'Welcome', 'Thanks for signing up')
  return 'sent'
})

const baseServiceProgram = Effect.gen(function* () {
  const logger = yield* LoggerService
  yield* logger.log('serviceProgram: running with v4 ServiceMap')
  return 'done'
})

const program1 = baseProgram1.pipe(Effect.provide(ConsoleLoggerLayer))
const program2 = baseProgram2.pipe(Effect.provide(Layer.mergeAll(ConsoleLoggerLayer, MockDatabaseLayer)))
const apiProgram = baseApiProgram.pipe(Effect.provide(FullAppLayer))
const manualProgram = baseManualProgram.pipe(Effect.provide(EmailLayer))
const serviceProgram = baseServiceProgram.pipe(Effect.provide(ConsoleLoggerLayer))

export {
  program1,
  program2,
  apiProgram,
  manualProgram,
  serviceProgram,
  ConsoleLoggerLayer,
  FullAppLayer
}
