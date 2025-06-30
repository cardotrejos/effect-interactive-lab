# Contributing to Effect Framework Demo

Thank you for your interest in contributing to the Effect Framework Demo! This guide will help you get started with contributing to this project.

## 🎯 Project Goals

This project aims to:
- Showcase Effect's capabilities through interactive, educational examples
- Provide clear comparisons between Effect and traditional async/await patterns
- Maintain clean, well-organized code that serves as a reference
- Help developers understand Effect's benefits through hands-on exploration

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Getting Started

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub, then clone your fork
   git clone https://github.com/your-username/effect-demo.git
   cd effect-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```
   This starts both the frontend (Vite) and backend (Express) servers.

4. **Open your browser**
   Navigate to `http://localhost:5174` (or the port shown in terminal)

## 📁 Project Structure

```
src/
├── components/
│   ├── DashboardFlow.tsx          # Main container component
│   ├── tabs/                      # Feature demonstration tabs
│   ├── shared/                    # Reusable UI components
│   └── examples/                  # Code example definitions
├── hooks/                         # Custom React hooks
├── lib/                          # Effect implementations
├── types/                        # TypeScript type definitions
└── server/                       # Express.js API server
```

## 🎨 Code Style Guidelines

### TypeScript
- Use TypeScript for all new code
- Define proper types - avoid `any`
- Use interfaces for object shapes
- Prefer type unions over enums where appropriate

### React Components
- Use functional components with hooks
- Keep components focused on a single responsibility
- Extract reusable logic into custom hooks
- Use proper prop typing with TypeScript

### Effect Code
- Follow Effect's official patterns and conventions
- Use descriptive names for Effect operations
- Prefer Effect's built-in utilities over manual implementations
- Include proper error handling with typed errors

### Code Formatting
- Run `npm run lint` before committing
- Use TypeScript strict mode
- Follow the existing code organization patterns

## 📝 Adding New Examples

### Code Examples
1. **Create the example file** in `src/components/examples/`
2. **Export clear, well-commented functions**
3. **Include both Effect and traditional implementations**
4. **Add TypeScript types for better IntelliSense**

Example structure:
```typescript
// src/components/examples/newFeatureExamples.ts
export const effectExample = `// Effect - Clean and powerful
const result = Effect.gen(function* () {
  // Your Effect implementation
})`

export const traditionalExample = `// Traditional - More verbose
async function traditional() {
  // Traditional implementation
}`
```

### Interactive Demos
1. **Create a new tab component** in `src/components/tabs/`
2. **Use the shared components** from `src/components/shared/`
3. **Follow the existing tab patterns** for consistency
4. **Add proper state management** via custom hooks

### Adding New Features
1. **Update types** in `src/types/dashboard.ts`
2. **Add to the main navigation** in `TabNavigation.tsx`
3. **Implement the Effect logic** in `src/lib/`
4. **Create the UI components** following the existing patterns

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment details**
   - OS and version
   - Browser and version
   - Node.js version

2. **Steps to reproduce**
   - Clear, numbered steps
   - Expected vs actual behavior
   - Screenshots if relevant

3. **Console errors**
   - Browser console logs
   - Terminal output if relevant

## 💡 Feature Requests

We welcome feature requests! Please:

1. **Check existing issues** to avoid duplicates
2. **Describe the use case** - why would this be valuable?
3. **Propose an implementation** if you have ideas
4. **Consider Effect integration** - how does it showcase Effect?

## 🔄 Pull Request Process

### Before Submitting
1. **Test your changes thoroughly**
2. **Run the linter**: `npm run lint`
3. **Build successfully**: `npm run build`
4. **Update documentation** if needed

### Pull Request Guidelines
1. **Create a focused PR** - one feature or fix per PR
2. **Write a clear description**
   - What does this change?
   - Why is it needed?
   - How was it tested?
3. **Link related issues** with "Fixes #123" or "Relates to #456"
4. **Include screenshots** for UI changes

### Review Process
1. **Code review** by maintainers
2. **Testing** in different environments
3. **Documentation review** if applicable
4. **Merge** after approval

## 📋 Types of Contributions

### 🎯 High Impact Contributions
- **New Effect feature demonstrations**
- **Performance optimizations**
- **Accessibility improvements**
- **Mobile responsiveness fixes**

### 📚 Documentation & Examples
- **Improve code comments**
- **Add more comprehensive examples**
- **Update README with new features**
- **Create tutorial content**

### 🐛 Bug Fixes
- **Fix broken interactions**
- **Resolve console errors**
- **Improve error handling**
- **Cross-browser compatibility fixes**

### 🎨 UI/UX Improvements
- **Visual design enhancements**
- **Better responsive design**
- **Improved user experience**
- **Cleaner code organization**

## 🏷️ Commit Message Format

Use clear, descriptive commit messages:

```
type(scope): brief description

- More detailed explanation if needed
- Use bullet points for multiple changes
- Reference issues: Fixes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(streams): add backpressure visualization
fix(concurrency): resolve race condition in demo
docs(readme): update installation instructions
refactor(tabs): extract shared logic to hooks
```

## 🤝 Community Guidelines

### Be Respectful
- Use inclusive language
- Be patient with newcomers
- Provide constructive feedback
- Help others learn

### Be Collaborative
- Ask questions when unsure
- Share knowledge and resources
- Review others' pull requests
- Participate in discussions

## 🆘 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Effect Discord**: Join the [Effect community](https://discord.gg/effect-ts)
- **Documentation**: Check the [Effect docs](https://effect.website/docs)

## 🙏 Recognition

Contributors will be:
- Added to the project's contributors list
- Mentioned in release notes for significant contributions
- Recognized in the README acknowledgments

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make this project better! Every contribution, no matter how small, is valuable and appreciated. 🎉