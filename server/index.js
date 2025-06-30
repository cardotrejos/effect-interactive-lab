import express from 'express'
import cors from 'cors'
import { faker } from '@faker-js/faker'

const app = express()
const port = 3001

// Enable CORS for frontend
app.use(cors())
app.use(express.json())

// Helper function to simulate variable network delays
const delay = (min = 500, max = 2000) => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Helper function to occasionally simulate failures
const maybeThrow = (errorRate = 0.1) => {
  if (Math.random() < errorRate) {
    throw new Error('Simulated server error')
  }
}

// Generate consistent user data for a given ID
const generateUser = (userId) => {
  faker.seed(parseInt(userId) || 42) // Consistent data for same ID
  return {
    id: userId,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      country: faker.location.country(),
      zipCode: faker.location.zipCode()
    },
    phone: faker.phone.number(),
    company: faker.company.name(),
    jobTitle: faker.person.jobTitle(),
    bio: faker.person.bio(),
    createdAt: faker.date.past({ years: 2 }),
    preferences: {
      theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
      notifications: faker.datatype.boolean(),
      newsletter: faker.datatype.boolean()
    }
  }
}

// Generate orders for a user
const generateOrders = (userId) => {
  faker.seed(parseInt(userId) * 1000 || 42000)
  const orderCount = faker.number.int({ min: 5, max: 20 })
  
  return Array.from({ length: orderCount }, (_, i) => {
    faker.seed(parseInt(userId) * 1000 + i)
    return {
      id: `order_${userId}_${i + 1}`,
      userId,
      status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
      total: parseFloat(faker.commerce.price({ min: 10, max: 500, dec: 2 })),
      currency: 'USD',
      items: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
        name: faker.commerce.productName(),
        price: parseFloat(faker.commerce.price({ min: 5, max: 100, dec: 2 })),
        quantity: faker.number.int({ min: 1, max: 3 }),
        category: faker.commerce.department()
      })),
      shippingAddress: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        country: faker.location.country(),
        zipCode: faker.location.zipCode()
      },
      orderDate: faker.date.past({ years: 1 }),
      estimatedDelivery: faker.date.future({ days: 7 })
    }
  })
}

// Generate recommendations for a user
const generateRecommendations = (userId) => {
  faker.seed(parseInt(userId) * 10000 || 420000)
  const recCount = faker.number.int({ min: 8, max: 15 })
  
  return Array.from({ length: recCount }, (_, i) => {
    faker.seed(parseInt(userId) * 10000 + i)
    return {
      id: `rec_${userId}_${i + 1}`,
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 15, max: 300, dec: 2 })),
      image: faker.image.url({ width: 200, height: 200 }),
      category: faker.commerce.department(),
      rating: parseFloat(faker.number.float({ min: 3.0, max: 5.0, multipleOf: 0.1 }).toFixed(1)),
      reviews: faker.number.int({ min: 10, max: 500 }),
      confidence: parseFloat(faker.number.float({ min: 0.6, max: 0.95, multipleOf: 0.01 }).toFixed(2)),
      reason: faker.helpers.arrayElement([
        'Based on your purchase history',
        'Trending in your area', 
        'Similar customers also bought',
        'Perfect match for your interests',
        'Limited time offer',
        'Recommended by our AI'
      ])
    }
  })
}

// API Routes

// Get user profile
app.get('/api/users/:id', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] 📤 GET /api/users/${req.params.id}`)
    
    // Simulate network delay
    await delay(800, 2500)
    
    // Occasionally fail to test error handling
    maybeThrow(0.05) // 5% failure rate
    
    const user = generateUser(req.params.id)
    
    console.log(`[${new Date().toISOString()}] ✅ User profile sent for ID: ${req.params.id}`)
    res.json(user)
  } catch (error) {
    console.log(`[${new Date().toISOString()}] ❌ User API error:`, error.message)
    res.status(500).json({ error: 'Failed to fetch user profile', message: error.message })
  }
})

// Get user orders
app.get('/api/orders/:userId', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] 📦 GET /api/orders/${req.params.userId}`)
    
    // Simulate database query delay
    await delay(1000, 3000)
    
    // Occasionally fail
    maybeThrow(0.03) // 3% failure rate
    
    const orders = generateOrders(req.params.userId)
    
    console.log(`[${new Date().toISOString()}] ✅ ${orders.length} orders sent for user: ${req.params.userId}`)
    res.json(orders)
  } catch (error) {
    console.log(`[${new Date().toISOString()}] ❌ Orders API error:`, error.message)
    res.status(500).json({ error: 'Failed to fetch orders', message: error.message })
  }
})

// Get recommendations
app.get('/api/recommendations/:userId', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] 🤖 GET /api/recommendations/${req.params.userId}`)
    
    // Simulate ML computation delay
    await delay(1200, 4000)
    
    // Occasionally fail
    maybeThrow(0.08) // 8% failure rate (ML is more prone to failures)
    
    const recommendations = generateRecommendations(req.params.userId)
    
    console.log(`[${new Date().toISOString()}] ✅ ${recommendations.length} recommendations sent for user: ${req.params.userId}`)
    res.json(recommendations)
  } catch (error) {
    console.log(`[${new Date().toISOString()}] ❌ Recommendations API error:`, error.message)
    res.status(500).json({ error: 'Failed to generate recommendations', message: error.message })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Start server
app.listen(port, () => {
  console.log(`🚀 Effect Demo Server running at http://localhost:${port}`)
  console.log('📊 Available endpoints:')
  console.log('  GET /api/users/:id          - Get user profile')
  console.log('  GET /api/orders/:userId     - Get user orders')  
  console.log('  GET /api/recommendations/:userId - Get recommendations')
  console.log('  GET /api/health             - Health check')
  console.log('')
  console.log('💡 The server simulates realistic delays and occasional failures')
  console.log('🎯 Try user IDs: 42, 123, 456, 789 for consistent demo data')
})