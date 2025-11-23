# Testing Guide - Blockchain Investigator Frontend

## Installation

Ensure all dependencies are installed:

```bash
pnpm install
```

## Running Tests

### All Tests

```bash
pnpm test
```

### With Interactive UI

```bash
pnpm test:ui
```

Opens an excellent Vitest visual interface where you can see tests in real-time.

### With Coverage Report

```bash
pnpm test:coverage
```

The report will be saved in the `coverage/` directory - open `coverage/index.html` in your browser.

### Watch Mode (Auto-updating)

```bash
pnpm test
```

Vitest runs in watch mode by default - it will automatically rerun when files change.

### Running Specific Tests

```bash
# Run a single test file
pnpm test src/lib/services/__tests__/blockchain-service.test.ts

# Run tests by pattern
pnpm test blockchain

# Run a specific test
pnpm test -t "should validate Bitcoin address"
```

## Test Structure

```
src/
├── __tests__/
│   ├── setup.ts                    # Global test setup
│   ├── __mocks__/
│   │   └── handlers.ts            # Mock data for tests
│   └── utils/
│       └── test-utils.tsx         # React testing utilities
├── lib/
│   ├── api/
│   │   └── __tests__/
│   │       └── backend-client.test.ts     # API client tests
│   └── services/
│       └── __tests__/
│           └── blockchain-service.test.ts  # Utility function tests
└── components/
    ├── Graph/
    │   └── __tests__/
    │       └── BlockchainGraph.test.tsx    # Graph component tests
    ├── AddressDetails/
    │   └── __tests__/
    │       └── AddressDetailsPanel.test.tsx
    ├── ApiLog/
    │   └── __tests__/
    │       └── ApiLogWindow.test.tsx
    └── ErrorBoundary/
        └── __tests__/
            └── ErrorBoundary.test.tsx
```

## Code Coverage

Target: **60-70%** code coverage

Tests cover:
- ✅ Utility functions (formatting, validation)
- ✅ API client (fetch, error handling, logging)
- ✅ Graph data merging
- ✅ React components (rendering, props, state)
- ✅ Error boundaries
- ✅ Loading states
- ✅ Error states

## Technologies

- **Vitest** - Fast and modern testing framework
- **@testing-library/react** - React component testing
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Additional matchers
- **happy-dom** - Lightweight and fast DOM environment

## Test Examples

### Unit Test - Utility Function

```typescript
import { describe, it, expect } from 'vitest';
import { formatSatoshisToBTC } from '../blockchain-service';

describe('formatSatoshisToBTC', () => {
  it('should format 1 BTC correctly', () => {
    expect(formatSatoshisToBTC(100000000)).toBe('1.00000000');
  });
});
```

### Component Test

```typescript
import { render, screen } from '@/__tests__/utils/test-utils';
import MyComponent from '../MyComponent';

it('should render correctly', () => {
  render(<MyComponent title="Test" />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

### Mock API Calls

```typescript
import { vi } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

mockFetch.mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' }),
});
```

## Tips

1. **Fast Execution**: Vitest is very fast - no need to run only specific tests
2. **Watch Mode**: Keep `pnpm test` running in the background - it will only run tests that changed
3. **UI Mode**: Use `pnpm test:ui` for an excellent visual experience
4. **Coverage**: Run coverage periodically to ensure all code is covered
5. **Mocking**: Use `vi.mock()` to mock dependencies

## Common Issues

### "Cannot find module @/..."

Ensure `vitest.config.ts` defines the aliases correctly:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### "document is not defined"

Ensure you've set `environment: 'happy-dom'` in `vitest.config.ts`.

### Tests Failing with Timeout

Increase the timeout:

```typescript
it('test', async () => {
  // ...
}, { timeout: 10000 }); // 10 seconds
```

### Coverage Too Low

If coverage is below 60%, tests will fail. This is configured in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 60,
    functions: 60,
    branches: 60,
    statements: 60,
  },
}
```

## CI/CD

You can add tests to GitHub Actions:

```yaml
- name: Install dependencies
  run: pnpm install

- name: Run tests
  run: pnpm test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Available Scripts

```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

## Test Statistics

- **Total Tests**: 78+ tests
- **Test Suites**: 10 test files
- **Coverage Target**: 60-70%

### Test Breakdown

**Unit Tests (48 tests):**
- `blockchain-service.test.ts` - 48 tests
  - Graph data merging (6 tests)
  - BTC formatting (5 tests)
  - Timestamp formatting (2 tests)
  - Relative time formatting (8 tests)
  - Bitcoin address validation (11 tests)

**Service Tests (22 tests):**
- `backend-client.test.ts` - 22 tests
  - Address details fetching (7 tests)
  - Graph data fetching (7 tests)
  - API log management (8 tests)

**Component Tests (30 tests):**
- `BlockchainGraph.test.tsx` - 10 tests
- `AddressDetailsPanel.test.tsx` - 8 tests
- `ApiLogWindow.test.tsx` - 8 tests
- `ErrorBoundary.test.tsx` - 3 tests

## Debugging Tests

### Run Tests in Debug Mode

```bash
# Run with verbose output
pnpm test --reporter=verbose

# Run with specific reporter
pnpm test --reporter=json
```

### View Test Output

```bash
# Show all console.log statements
pnpm test -- --silent=false
```

### Inspect Failed Tests

When tests fail, Vitest provides:
- Clear error messages
- Stack traces
- Diff of expected vs actual values
- File and line number of failure

## Best Practices

1. **Test Organization**: Group related tests using `describe` blocks
2. **Clear Test Names**: Use descriptive test names that explain what is being tested
3. **Arrange-Act-Assert**: Structure tests in three parts:
   - Arrange: Set up test data
   - Act: Execute the code being tested
   - Assert: Verify the results
4. **Mock External Dependencies**: Always mock API calls and external services
5. **Clean Up**: Tests should not affect each other - use `beforeEach`/`afterEach` for cleanup
6. **Test Edge Cases**: Don't just test happy paths - test error conditions too

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest UI](https://vitest.dev/guide/ui.html)
- [Testing Best Practices](https://testingjavascript.com/)
