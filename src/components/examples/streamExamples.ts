export const effectBackpressureExample = `// Effect Streams - Built-in backpressure handling
import { Stream, Effect } from 'effect'

// Fast producer, slow consumer scenario
const fastProducer = Stream.repeatEffect(
  Effect.succeed(Math.random() * 100)
)

const slowConsumer = fastProducer.pipe(
  // Automatic backpressure - producer slows when buffer full
  Stream.buffer({ capacity: 5 }),
  
  // Slow processing simulation
  Stream.mapEffect(value => 
    Effect.delay(
      Effect.succeed(value * 2),
      "200 millis" // Slow processing
    )
  ),
  
  // Throttle with backpressure strategy
  Stream.throttle({
    cost: 1,
    units: 1,
    duration: "50 millis",
    strategy: "backpressure" // 🛡️ Wait instead of drop
  })
)

// Result: NO DATA LOSS - producer automatically slows down`

export const traditionalBackpressureExample = `// Traditional approach - manual buffer management
import { EventEmitter } from 'events'

class ProducerConsumer extends EventEmitter {
  private buffer: number[] = []
  private readonly maxBuffer = 5
  
  startProducer() {
    setInterval(() => {
      const data = Math.random() * 100
      
      if (this.buffer.length >= this.maxBuffer) {
        // 💥 DROP DATA - no backpressure!
        const dropped = this.buffer.shift()
        console.log(\`Dropped: \${dropped}\`)
      }
      
      this.buffer.push(data)
      this.emit('data', data)
    }, 30) // Fast producer
  }
  
  startConsumer() {
    this.on('data', async (data) => {
      // Slow processing
      await new Promise(r => setTimeout(r, 200))
      const processed = this.buffer.shift()
      console.log(\`Processed: \${processed}\`)
    })
  }
}

// Result: DATA LOSS when consumer can't keep up`

export const streamErrorHandlingExample = `// Robust error handling in streams
const resilientStream = Stream.fromIterable(urls).pipe(
  Stream.mapEffect(
    url => fetchData(url),
    { concurrency: 5 }
  ),
  Stream.retry(Schedule.exponential("1 second")),
  Stream.catchAll(error => 
    Stream.make(\`Fallback for \${error.message}\`)
  ),
  Stream.ensuring(
    Effect.log("Stream processing completed")
  )
)

// Transform and aggregate with error boundaries
const analytics = dataStream.pipe(
  Stream.map(parseJSON),
  Stream.catchTag("ParseError", () => 
    Stream.empty
  ),
  Stream.groupByKey(item => item.category),
  Stream.mergeGroupBy(
    (key, stream) => stream.pipe(
      Stream.runFold(0, (acc, item) => acc + item.value)
    ),
    16 // Max concurrent groups
  )
)`

export const nodeStreamsExample = `// Node.js Streams - Manual everything
import { pipeline, Transform } from 'stream'
import { createReadStream } from 'fs'
import { parse } from 'csv-parse'

// Complex setup with manual error handling
const processCSV = new Promise((resolve, reject) => {
  let count = 0
  const batches: any[] = []
  
  const transformStream = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      try {
        if (chunk[2] === 'active') {
          batches.push(chunk)
          if (batches.length >= 100) {
            // Manual batching
            Database.insertBatch([...batches])
              .then(() => {
                count += batches.length
                batches.length = 0
                callback()
              })
              .catch(callback)
          } else {
            callback()
          }
        } else {
          callback()
        }
      } catch (error) {
        callback(error)
      }
    },
    flush(callback) {
      // Handle remaining items
      if (batches.length > 0) {
        Database.insertBatch(batches)
          .then(() => {
            count += batches.length
            callback()
          })
          .catch(callback)
      } else {
        callback()
      }
    }
  })
  
  pipeline(
    createReadStream('data.csv'),
    parse({ columns: false, from: 2 }),
    transformStream,
    (err) => {
      if (err) reject(err)
      else resolve(count)
    }
  )
})`

export const manualBackpressureExample = `// Manual backpressure and error handling
const { Readable, Writable } = require('stream')

class ThrottledStream extends Transform {
  constructor(delay) {
    super({ objectMode: true })
    this.delay = delay
    this.lastTime = 0
  }
  
  async _transform(chunk, encoding, callback) {
    const now = Date.now()
    const elapsed = now - this.lastTime
    
    if (elapsed < this.delay) {
      // Manual throttling
      await new Promise(r => 
        setTimeout(r, this.delay - elapsed)
      )
    }
    
    this.lastTime = Date.now()
    this.push(chunk)
    callback()
  }
}

// No built-in retry, must implement manually
async function retryStream(stream, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await processStream(stream)
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(r => 
        setTimeout(r, Math.pow(2, i) * 1000)
      )
    }
  }
}

// No resource safety guarantees
let fileHandle
try {
  fileHandle = await fs.open('data.csv')
  // Process stream...
} finally {
  // Manual cleanup
  await fileHandle?.close()
}`