# Test Suite Documentation

This directory contains comprehensive tests for the UI enhancements feature, covering all new components, utilities, hooks, and integration scenarios.

## Test Structure

### Unit Tests

#### Component Tests
- **`components/IconManager.test.tsx`** - Tests for icon management components (IconManager, IconSelector, EditableTitleIcon)
- **`components/ProjectNavigation.test.tsx`** - Tests for project navigation components (ProjectPage, BreadcrumbNavigation, loading/error states)
- **`components/CalendarView.test.tsx`** - Tests for calendar view component with all view modes and interactions

#### Utility Tests
- **`attachments.test.ts`** - Tests for file attachment utilities (validation, upload simulation, preview generation)
- **`calendar.test.ts`** - Tests for calendar utilities (date generation, event conversion, navigation)
- **`comments.test.ts`** - Tests for comment utilities (creation, validation, sorting, sanitization)
- **`error-handling.test.tsx`** - Tests for error boundaries and fallback components

#### Hook Tests
- **`hooks/useRetry.test.ts`** - Tests for retry hook with exponential backoff
- **`hooks/useAttachments.test.ts`** - Tests for attachment management hook
- **`hooks/useComments.test.ts`** - Tests for comment management hook with optimistic updates

### Integration Tests

#### Feature Integration
- **`integration/icon-management.test.tsx`** - End-to-end icon management workflow tests
- **`integration/project-navigation.test.tsx`** - Project navigation integration tests
- **`integration/task-enhancements.test.tsx`** - Complete task enhancement workflow tests

### Performance Tests

#### Rendering Performance
- **`performance/calendar-rendering.test.ts`** - Calendar rendering performance with large datasets
- **`performance/file-upload.test.ts`** - File upload and validation performance tests

### End-to-End Tests

#### User Workflows
- **`e2e/task-enhancement-flow.test.tsx`** - Complete user workflow from task creation to enhancement

## Test Coverage

### Components Tested
- ✅ IconManager and related components
- ✅ ProjectPage and navigation components
- ✅ CalendarView with all view modes
- ✅ Enhanced TaskCard components
- ✅ Error boundaries and loading states
- ✅ File attachment components
- ✅ Comment system components

### Utilities Tested
- ✅ Calendar utilities (date generation, navigation, event conversion)
- ✅ Attachment utilities (validation, upload, preview)
- ✅ Comment utilities (creation, validation, formatting)
- ✅ Error handling utilities

### Hooks Tested
- ✅ useRetry with exponential backoff
- ✅ useAttachments with localStorage persistence
- ✅ useComments with optimistic updates

### Integration Scenarios
- ✅ Icon selection and persistence workflow
- ✅ Project navigation with task filtering
- ✅ Calendar view switching and event interaction
- ✅ Task enhancement with comments and attachments
- ✅ File upload with drag-and-drop
- ✅ Error recovery and retry mechanisms

### Performance Scenarios
- ✅ Calendar rendering with large datasets (10,000+ tasks)
- ✅ File validation with multiple files
- ✅ Memory usage optimization
- ✅ Concurrent operations handling

## Test Configuration

### Jest Configuration
- Environment: jsdom for DOM testing
- Setup: Custom setup with React Testing Library
- Mocks: localStorage, File API, URL API, fetch
- Coverage: Comprehensive coverage collection

### Testing Libraries Used
- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom Jest matchers

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- calendar.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should handle"
```

## Test Patterns

### Component Testing Pattern
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<ComponentName {...props} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    render(<ComponentName {...props} />);
    
    await user.click(screen.getByRole('button'));
    expect(mockCallback).toHaveBeenCalled();
  });
});
```

### Hook Testing Pattern
```typescript
describe('useHookName', () => {
  it('should return expected values', () => {
    const { result } = renderHook(() => useHookName(params));
    
    expect(result.current.value).toBe(expectedValue);
  });

  it('should handle state updates', async () => {
    const { result } = renderHook(() => useHookName(params));
    
    await act(async () => {
      await result.current.updateFunction(newValue);
    });
    
    expect(result.current.value).toBe(newValue);
  });
});
```

### Performance Testing Pattern
```typescript
describe('Performance Tests', () => {
  it('should complete within time threshold', async () => {
    const start = performance.now();
    
    await performOperation();
    
    const end = performance.now();
    expect(end - start).toBeLessThan(THRESHOLD_MS);
  });
});
```

## Mock Strategies

### localStorage Mock
```typescript
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});
```

### File API Mock
```typescript
Object.defineProperty(global, 'File', {
  value: class MockFile {
    constructor(parts, name, options = {}) {
      this.name = name;
      this.type = options.type || '';
      this.size = parts.reduce((acc, part) => acc + part.length, 0);
    }
  }
});
```

### URL API Mock
```typescript
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'blob:mock-url'),
    revokeObjectURL: jest.fn()
  }
});
```

## Test Data Patterns

### Task Mock Data
```typescript
const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  status: 'todo',
  priority: 'high',
  createdAt: '2024-01-01T00:00:00Z',
  description: 'Test task description'
};
```

### Comment Mock Data
```typescript
const mockComment: TaskComment = {
  id: 'comment-1',
  taskId: 'task-1',
  content: 'Test comment',
  author: 'Test User',
  createdAt: '2024-01-01T10:00:00Z'
};
```

### Attachment Mock Data
```typescript
const mockAttachment: TaskAttachment = {
  id: 'att-1',
  taskId: 'task-1',
  fileName: 'test.txt',
  fileSize: 1024,
  fileType: 'text/plain',
  uploadedAt: '2024-01-01T09:00:00Z',
  downloadUrl: 'https://example.com/test.txt',
  isSecure: false,
  downloadCount: 0
};
```

## Coverage Goals

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

## Continuous Integration

Tests are designed to run in CI environments with:
- Consistent timing (using fake timers)
- Deterministic results (proper mocking)
- Fast execution (optimized test data)
- Clear error messages (descriptive test names)

## Maintenance

### Adding New Tests
1. Follow existing patterns and naming conventions
2. Include both happy path and error scenarios
3. Add performance tests for computationally intensive features
4. Update this README when adding new test categories

### Updating Tests
1. Keep tests in sync with component changes
2. Update mocks when APIs change
3. Maintain performance thresholds as features evolve
4. Review and update test data regularly