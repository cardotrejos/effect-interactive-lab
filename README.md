# Effect Framework Demo

An interactive React application showcasing the powerful capabilities of the [Effect](https://effect.website/) TypeScript library. This demo illustrates Effect's features through visual, hands-on examples that highlight its advantages over traditional async/await patterns.

![Effect Framework Demo](./Screenshot%202025-06-29%20at%209.20.25%20AM.png)

## 🌟 What is Effect?

Effect is a powerful TypeScript framework that provides a fully-fledged functional effect system with a rich standard library. It helps developers build robust, scalable applications with:

- **Advanced Concurrency**: Beyond Promise.all/race with fiber-based execution
- **Comprehensive Error Handling**: Typed errors with automatic recovery
- **Built-in Retries**: Exponential backoff and circuit breakers
- **Dependency Injection**: Type-safe service management
- **Powerful Streams**: Backpressure-aware data processing

## 🚀 Live Demo

[View the live demo](http://localhost:5174) (when running locally)

## 📋 Features Demonstrated

### 🔄 Advanced Concurrency Patterns
- **Effect.all**: Standard concurrent execution
- **Effect.bind**: Sequential pipeline with data flow
- **Fiber.fork/join**: Manual fiber control for low-level concurrency
- **Effect.race**: Racing with completion tracking
- **Effect.forEach**: Controlled batching with resource limits

### ⚠️ Error Handling & Resilience
- Typed error handling with automatic propagation
- Built-in timeout support
- Declarative retry strategies with exponential backoff
- Circuit breakers for fault tolerance
- Graceful error recovery with fallbacks

### 🔧 Dependency Injection
- Zero-boilerplate service injection
- Type-safe dependency management
- Easy testing with service mocking
- Composable service layers

### 🌊 Reactive Streams
- Backpressure-aware data processing
- Resource-safe stream operations
- Built-in batching and grouping
- Concurrent stream processing
- Error handling within streams

## 🛠️ Technology Stack

- **Frontend**: React 19.1.0 + TypeScript
- **Build Tool**: Vite 7.0.0
- **Styling**: Tailwind CSS
- **Visualization**: ReactFlow for interactive diagrams
- **Backend**: Express.js API server for realistic data
- **Effect**: v3.16.10 - The star of the show!

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/effect-demo.git
cd effect-demo

# Install dependencies
npm install

# Start both frontend and backend servers
npm run dev
```

## 🎮 Development Commands

```bash
# Install dependencies
npm install

# Start both frontend and backend servers
npm run dev

# Start only the frontend (Vite dev server)
npm run client

# Start only the backend (Node.js API server)
npm run server

# Build for production (runs TypeScript check first)
npm run build

# Preview production build locally
npm run preview

# Run ESLint
npm run lint
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── DashboardFlow.tsx          # Main app container
│   ├── tabs/                      # Individual feature tabs
│   │   ├── ConcurrencyTab.tsx     # Concurrency patterns demo
│   │   ├── ErrorHandlingTab.tsx   # Error handling examples
│   │   ├── RetriesTab.tsx         # Retry strategies
│   │   ├── DependencyInjectionTab.tsx
│   │   └── StreamsTab.tsx         # Stream processing demo
│   ├── shared/                    # Reusable components
│   │   ├── CodeExample.tsx        # Syntax-highlighted code blocks
│   │   ├── TabNavigation.tsx      # Tab switcher
│   │   └── StreamControls.tsx     # Stream demo controls
│   └── examples/                  # Code example definitions
├── hooks/
│   ├── useDashboard.ts           # Dashboard state management
│   └── useStreams.ts             # Stream demo logic
├── lib/
│   ├── dashboard.ts              # Effect dashboard implementation
│   └── streams.ts                # Effect streams implementation
├── types/
│   └── dashboard.ts              # TypeScript type definitions
└── server/
    └── index.js                  # Express API server
```

## 🖥️ Backend API

The demo includes a realistic Express.js backend that provides:

- **Port**: 3001 (http://localhost:3001)
- **Realistic Data**: Generated with Faker.js
- **Variable Delays**: 800ms - 4000ms to simulate real-world conditions
- **Occasional Failures**: 3-8% failure rate for error handling demos
- **CORS Enabled**: For frontend development

### API Endpoints

- `GET /api/users/:id` - User profile data
- `GET /api/orders/:userId` - User order history  
- `GET /api/recommendations/:userId` - ML-generated recommendations
- `GET /api/health` - Server health check

### Demo Data

Try these user IDs for consistent demo data: **42**, **123**, **456**, **789**

## 🎯 Key Demo Features

### Real vs Mock Toggle
Switch between real API calls and instant mocks to see the difference in concurrency patterns and performance.

### Interactive Controls
- Adjust concurrency modes in real-time
- Toggle backpressure on/off in stream demos
- Modify batch sizes and processing speeds
- Run performance comparisons

### Code Comparisons
Side-by-side comparisons showing:
- Effect implementation vs traditional async/await
- Automatic features vs manual implementation
- Clean, declarative code vs verbose error handling

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Effect Team](https://github.com/Effect-TS) for creating this amazing library
- [React Flow](https://reactflow.dev/) for the interactive diagrams
- [Tailwind CSS](https://tailwindcss.com/) for the styling system
- [Faker.js](https://fakerjs.dev/) for realistic demo data

## 📚 Learn More

- [Effect Documentation](https://effect.website/docs)
- [Effect GitHub Repository](https://github.com/Effect-TS/effect)
- [Why Effect?](https://effect.website/docs/getting-started/why-effect/)
- [Effect Community Discord](https://discord.gg/effect-ts)

## 🔗 Related Links

- [Effect Website](https://effect.website/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)

---

**Built with ❤️ to showcase the power of Effect in TypeScript applications**