---
name: react-best-practices
description: React coding best practices for clean, secure, resilient, maintainable, and readable code. Use when writing React components, reviewing React code, setting up React projects, or asking about React patterns and conventions in 2025.
---

# React Best Practices 2025

## Clean Code

### Component Design
- Keep components small and focused on a single responsibility
- Extract reusable logic into custom hooks prefixed with `use`
- Prefer function components over class components
- Compose components instead of using inheritance
- Limit component files to ~200 lines; split if larger

### File Structure
- Co-locate related files (component, styles, tests, types)
- Use barrel exports (`index.ts`) sparingly to avoid circular dependencies
- Group by feature/domain, not by file type

### Props Handling
- Destructure props at the function parameter level
- Define explicit TypeScript interfaces for props
- Use sensible defaults via destructuring or `defaultProps`
- Avoid passing too many props; consider composition or context

## Secure Code

### XSS Prevention
- Never use `dangerouslySetInnerHTML` unless absolutely necessary
- Sanitize any user-generated HTML with DOMPurify before rendering
- Escape dynamic values in URLs and attributes
- Validate and sanitize all user inputs

### Data Handling
- Never store sensitive data (tokens, passwords) in state or localStorage
- Use httpOnly cookies for authentication tokens
- Sanitize data before sending to APIs
- Implement proper CORS policies

### Dependency Management
- Audit dependencies regularly with `npm audit`
- Pin dependency versions in production
- Prefer well-maintained packages with active communities
- Review package permissions and supply chain security

## Resilient Code

### Error Boundaries
- Wrap major UI sections with error boundaries
- Provide meaningful fallback UIs
- Log errors to monitoring services (Sentry, etc.)
- Implement recovery mechanisms where possible

```tsx
class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logErrorToService(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
```

### Loading and Error States
- Always handle loading, error, and empty states
- Use Suspense for code-splitting and data fetching
- Implement skeleton loaders for better perceived performance
- Provide retry mechanisms for failed operations

### Defensive Programming
- Validate props with TypeScript and runtime checks where needed
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Provide fallback values for potentially undefined data
- Handle edge cases explicitly

## Maintainable Code

### TypeScript
- Enable strict mode in `tsconfig.json`
- Define explicit return types for functions
- Use discriminated unions for complex state
- Avoid `any`; use `unknown` when type is uncertain
- Create reusable type utilities

```tsx
interface Props {
  user: User;
  onUpdate: (user: User) => void;
  isLoading?: boolean;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

interface State {
  status: Status;
  data: Data | null;
  error: Error | null;
}
```

### State Management
- Start with local state; lift only when necessary
- Use React Context for low-frequency global state
- Choose external stores (Zustand, Jotai) for complex state
- Avoid prop drilling beyond 2-3 levels
- Keep state as close to where it's used as possible

### Testing
- Write unit tests for hooks and utility functions
- Use React Testing Library for component tests
- Test user behavior, not implementation details
- Mock external dependencies and API calls
- Aim for meaningful coverage, not 100%

## Readable Code

### Naming Conventions
- Use PascalCase for components: `UserProfile`
- Use camelCase for hooks: `useUserData`
- Use UPPER_SNAKE_CASE for constants: `MAX_ITEMS`
- Prefix boolean props with `is`, `has`, `should`: `isLoading`
- Name event handlers with `handle` prefix: `handleClick`
- Name callback props with `on` prefix: `onClick`

### JSX Clarity
- Extract complex conditions into named variables
- Keep JSX nesting shallow (max 3-4 levels)
- Use early returns for conditional rendering
- One component per file (except tightly coupled pairs)

```tsx
// Prefer this
const showEmptyState = !isLoading && items.length === 0;
const showContent = !isLoading && items.length > 0;

return (
  <div>
    {isLoading && <Spinner />}
    {showEmptyState && <EmptyState />}
    {showContent && <ItemList items={items} />}
  </div>
);
```

### Complexity Extraction
- Extract complex logic into custom hooks
- Move calculations into separate pure functions
- Use `useMemo` and `useCallback` only when profiling shows need
- Split large components into smaller, focused ones

## 2025-Specific Patterns

### React 19+ Features
- Use React Compiler (React Forget) for automatic memoization
- Leverage `use()` hook for promise and context reading
- Use Server Components for data fetching when applicable
- Implement Actions for form handling and mutations
- Use `useOptimistic` for optimistic UI updates
- Leverage `useFormStatus` for form state management

### Performance
- Use React DevTools Profiler to identify bottlenecks
- Implement virtualization for long lists (TanStack Virtual)
- Lazy load routes and heavy components with `React.lazy`
- Use `startTransition` for non-urgent state updates
- Optimize images with next/image or similar solutions

### Modern Tooling
- Use Vite for fast development builds
- Implement path aliases for cleaner imports
- Use Biome or ESLint + Prettier for linting/formatting
- Consider TanStack Query for server state management
- Use Zod for runtime schema validation

## Anti-Patterns to Avoid

### Component Anti-Patterns
- Avoid massive "god" components doing too much
- Don't mutate state directly; use immutable updates
- Never call hooks conditionally or inside loops
- Don't use array index as key for dynamic lists
- Avoid inline object/array creation in JSX props

### State Anti-Patterns
- Don't store derived data in state; compute it
- Avoid deeply nested state; normalize when needed
- Don't sync state with props (use key reset or effects carefully)
- Avoid excessive global state; prefer local first

### Performance Anti-Patterns
- Don't premature optimize; profile first
- Avoid creating functions inside render without need
- Don't fetch data in useEffect for initial loads (use frameworks/libraries)
- Avoid excessive re-renders from context at root level

### Code Organization Anti-Patterns
- Don't mix business logic with UI components
- Avoid circular dependencies between modules
- Don't import from deep internal paths of libraries
- Avoid magic strings; use constants or enums
