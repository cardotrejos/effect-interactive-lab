import { Effect, Stream, Chunk, pipe } from 'effect'

export type StreamEventType = 
  | 'csv-row' 
  | 'transform' 
  | 'batch' 
  | 'complete' 
  | 'error' 
  | 'backpressure'
  | 'throttle'

export interface StreamEvent {
  type: StreamEventType
  message: string
  data?: unknown
  timestamp: number
}

export interface StreamDemoOptions {
  onEvent: (event: StreamEvent) => void
  processingSpeed: 'slow' | 'normal' | 'fast'
  enableBackpressure: boolean
  batchSize: number
}

// Simulate CSV data
const generateCSVData = (rows: number) => {
  const headers = ['id', 'name', 'status', 'value', 'timestamp']
  const statuses = ['active', 'inactive', 'pending']
  const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Henry']
  
  const data = [headers.join(',')]
  for (let i = 1; i <= rows; i++) {
    const row = [
      i,
      names[Math.floor(Math.random() * names.length)],
      statuses[Math.floor(Math.random() * statuses.length)],
      Math.floor(Math.random() * 1000),
      new Date().toISOString()
    ]
    data.push(row.join(','))
  }
  
  return data
}

// Simulate processing delay
const processDelay = (speed: 'slow' | 'normal' | 'fast') => {
  switch (speed) {
    case 'slow': return 200
    case 'normal': return 50
    case 'fast': return 10
  }
}

export const runCSVProcessingDemo = (options: StreamDemoOptions): Effect.Effect<number> =>
  Effect.gen(function* () {
    const { onEvent, processingSpeed, batchSize } = options
    
    const csvData = generateCSVData(100)
    let processedCount = 0
    // let activeStatusCount = 0
    
    yield* Effect.log('Starting CSV processing demo')
    onEvent({
      type: 'csv-row',
      message: `📄 Processing ${csvData.length - 1} CSV rows`,
      timestamp: Date.now()
    })
    
    const result = yield* pipe(
      Stream.fromIterable(csvData),
      // Skip header
      Stream.drop(1),
      // Parse CSV
      Stream.map(line => {
        const [id, name, status, value] = line.split(',')
        return { id: parseInt(id), name, status, value: parseInt(value) }
      }),
      // Log each row
      Stream.tap(row => 
        Effect.sync(() => {
          onEvent({
            type: 'csv-row',
            message: `Processing row ${row.id}: ${row.name}`,
            data: row,
            timestamp: Date.now()
          })
        })
      ),
      // Filter active status
      Stream.filter(row => {
        const isActive = row.status === 'active'
        // if (isActive) activeStatusCount++
        return isActive
      }),
      // Add processing delay
      Stream.mapEffect(
        row => Effect.delay(
          Effect.succeed(row),
          processDelay(processingSpeed)
        ),
        { concurrency: processingSpeed === 'fast' ? 5 : 1 }
      ),
      // Group into batches
      Stream.grouped(batchSize),
      Stream.tap(batch =>
        Effect.sync(() => {
          processedCount += batch.length
          onEvent({
            type: 'batch',
            message: `📦 Batch of ${batch.length} items ready (${processedCount} total)`,
            data: { batchSize: batch.length, total: processedCount },
            timestamp: Date.now()
          })
        })
      ),
      // Simulate database insert
      Stream.mapEffect(batch =>
        Effect.gen(function* () {
          yield* Effect.log(`Inserting batch of ${batch.length} items`)
          yield* Effect.delay(
            Effect.succeed(batch),
            processDelay(processingSpeed) * 2
          )
          return batch.length
        })
      ),
      Stream.runFold(0, (acc, count) => acc + count)
    )
    
    onEvent({
      type: 'complete',
      message: `✅ Processed ${result} active items out of ${csvData.length - 1} total`,
      data: { processed: result, total: csvData.length - 1 },
      timestamp: Date.now()
    })
    
    return result
  })

export const runRealTimeStreamDemo = (options: StreamDemoOptions): Effect.Effect<{ processed: number; sum: number; backpressureEvents: number }, never, never> =>
  Effect.gen(function* () {
    const { onEvent, enableBackpressure, processingSpeed } = options
    
    yield* Effect.log('Starting real-time stream demo')
    onEvent({
      type: 'transform',
      message: `🚀 Simulating Producer/Consumer with ${enableBackpressure ? 'backpressure enabled' : 'NO backpressure'}`,
      timestamp: Date.now()
    })
    
    onEvent({
      type: 'transform',
      message: `📊 Producer: fast (every 30ms) | Consumer: ${processingSpeed} | Buffer: max 5 items`,
      timestamp: Date.now()
    })
    
    // Simulate realistic timing difference
    const BUFFER_LIMIT = 5
    const TOTAL_ITEMS = 20
    const producerInterval = 30  // Fast producer
    const consumerDelay = processDelay(processingSpeed) // Variable consumer
    
    let itemsGenerated = 0
    let itemsProcessed = 0
    let itemsDropped = 0
    let backpressureEvents = 0
    const buffer: number[] = []
    const results: number[] = []
    
    onEvent({
      type: 'transform',
      message: `⚖️ Timing: Producer ${producerInterval}ms vs Consumer ${consumerDelay}ms ${consumerDelay > producerInterval ? '(PRESSURE!)' : '(no pressure)'}`,
      timestamp: Date.now()
    })
    
    // Main simulation loop
    let cycles = 0
    const maxCycles = Math.max(TOTAL_ITEMS * 2, 60) // Ensure enough cycles
    
    while (cycles < maxCycles && itemsProcessed < TOTAL_ITEMS) {
      cycles++
      
      // PRODUCER PHASE: Try to generate data
      const shouldGenerate = itemsGenerated < TOTAL_ITEMS && cycles % Math.ceil(producerInterval / 10) === 0
      
      if (shouldGenerate) {
        if (enableBackpressure) {
          // WITH BACKPRESSURE: Check buffer capacity
          if (buffer.length < BUFFER_LIMIT) {
            const newValue = Math.floor(Math.random() * 100)
            buffer.push(newValue)
            itemsGenerated++
            
            onEvent({
              type: 'transform',
              message: `📤 Generated: ${newValue} → Buffer [${buffer.length}/${BUFFER_LIMIT}]`,
              data: { value: newValue, bufferSize: buffer.length },
              timestamp: Date.now()
            })
          } else {
            // Buffer full - backpressure activated
            backpressureEvents++
            onEvent({
              type: 'backpressure',
              message: `🛑 BACKPRESSURE! Buffer full [${buffer.length}/${BUFFER_LIMIT}] - Producer blocked`,
              data: { bufferSize: buffer.length },
              timestamp: Date.now()
            })
          }
        } else {
          // WITHOUT BACKPRESSURE: Always generate, drop if needed
          if (buffer.length >= BUFFER_LIMIT) {
            const dropped = buffer.shift() // Drop oldest
            itemsDropped++
            onEvent({
              type: 'error',
              message: `💥 OVERFLOW! Dropped: ${dropped} (Total lost: ${itemsDropped})`,
              data: { dropped, totalDropped: itemsDropped },
              timestamp: Date.now()
            })
          }
          
          const newValue = Math.floor(Math.random() * 100)
          buffer.push(newValue)
          itemsGenerated++
          
          onEvent({
            type: 'transform',
            message: `📤 Generated: ${newValue} → Buffer [${buffer.length}/${BUFFER_LIMIT}] ${buffer.length === BUFFER_LIMIT ? '(FULL!)' : ''}`,
            data: { value: newValue, bufferSize: buffer.length },
            timestamp: Date.now()
          })
        }
      }
      
      // CONSUMER PHASE: Process data every few cycles based on speed
      const shouldConsume = buffer.length > 0 && cycles % Math.ceil(consumerDelay / 10) === 0
      
      if (shouldConsume) {
        const value = buffer.shift()!
        const transformed = value * 2
        results.push(transformed)
        itemsProcessed++
        
        onEvent({
          type: 'transform',
          message: `📥 Processed: ${value} → ${transformed} | Buffer: [${buffer.length}/${BUFFER_LIMIT}] | Done: ${itemsProcessed}`,
          data: { value, transformed, bufferSize: buffer.length, processed: itemsProcessed },
          timestamp: Date.now()
        })
      }
      
      // Small delay between cycles
      yield* Effect.delay(Effect.void, 10)
    }
    
    const sum = results.reduce((acc, val) => acc + val, 0)
    
    onEvent({
      type: 'complete',
      message: `✅ Final: Generated ${itemsGenerated}, Processed ${itemsProcessed}, Lost ${itemsDropped}`,
      data: { 
        generated: itemsGenerated,
        processed: itemsProcessed,
        dropped: itemsDropped,
        sum,
        backpressureEvents
      },
      timestamp: Date.now()
    })
    
    if (enableBackpressure) {
      onEvent({
        type: 'complete',
        message: `💡 Backpressure prevented data loss (${backpressureEvents} blocks) - ${itemsDropped === 0 ? 'SUCCESS!' : 'Some loss occurred'}`,
        timestamp: Date.now()
      })
    } else {
      onEvent({
        type: 'complete', 
        message: `💡 No backpressure: ${itemsDropped > 0 ? `${itemsDropped} items LOST to overflow!` : 'No overflow (consumer kept up)'}`,
        timestamp: Date.now()
      })
    }
    
    return { processed: itemsProcessed, sum, backpressureEvents }
  })

export const runStreamCompositionDemo = (options: StreamDemoOptions): Effect.Effect<{ evenSum: number; oddSum: number }> =>
  Effect.gen(function* () {
    const { onEvent } = options
    
    yield* Effect.log('Starting stream composition demo')
    onEvent({
      type: 'transform',
      message: '🔄 Demonstrating stream composition and broadcasting',
      timestamp: Date.now()
    })
    
    // Create source stream
    const sourceStream = Stream.range(1, 20)
    
    // Branch 1: Even numbers
    const evenStream = pipe(
      sourceStream,
      Stream.filter(n => n % 2 === 0),
      Stream.map(n => ({ type: 'even', value: n, squared: n * n }))
    )
    
    // Branch 2: Odd numbers  
    const oddStream = pipe(
      sourceStream,
      Stream.filter(n => n % 2 !== 0),
      Stream.map(n => ({ type: 'odd', value: n, cubed: n * n * n }))
    )
    
    // Merge streams
    const mergedResults = yield* pipe(
      Stream.merge(evenStream, oddStream),
      Stream.tap(item =>
        Effect.sync(() => {
          if (item.type === 'even') {
            onEvent({
              type: 'transform',
              message: `Even: ${item.value}² = ${(item as { squared: number }).squared}`,
              data: item,
              timestamp: Date.now()
            })
          } else {
            onEvent({
              type: 'transform', 
              message: `Odd: ${item.value}³ = ${(item as { cubed: number }).cubed}`,
              data: item,
              timestamp: Date.now()
            })
          }
        })
      ),
      Stream.runCollect
    )
    
    const results = Chunk.toArray(mergedResults)
    const evenSum = results
      .filter(r => r.type === 'even')
      .reduce((acc, r) => acc + (r as { squared: number }).squared, 0)
    const oddSum = results
      .filter(r => r.type === 'odd')
      .reduce((acc, r) => acc + (r as { cubed: number }).cubed, 0)
    
    onEvent({
      type: 'complete',
      message: `✅ Composition complete: Even sum = ${evenSum}, Odd sum = ${oddSum}`,
      data: { evenSum, oddSum, totalItems: results.length },
      timestamp: Date.now()
    })
    
    return { evenSum, oddSum }
  }) 