# Unit Test Creation Skill

Guide for creating unit tests in the Global-E Checkout Apps NX monorepo, with focus on ShipToStore and similar feature patterns.

## When to Use This Skill

Use this skill when:

- Adding tests for new features (ShipToStore, CollectionPoints, etc.)
- Testing React components that use Zustand store
- Testing business logic with complex state transitions
- Testing event dispatching/handling
- Testing conditional rendering based on store state

## How to Use This Skill

Follow this 3-step process when creating tests for a feature:

### Step 1: Gather Business Requirements

**Prompt the user** to describe the expected functionality in **generic, non-technical terms**.

**✅ Good examples:**

- "When I press the 'Change' button, the view should switch back to store selection"
- "When I select 'Collect in Store', the shipping address form should disappear"
- "When I switch from store pickup to home delivery, the selected store should be cleared"

**❌ Avoid:**

- "When I press the 'Change' button, the change handler should be called"
- "When I select 'Collect in Store', the setShippingType action should dispatch"

**Why?** Tests should verify **business outcomes**, not implementation details. The test name and assertions should reflect what the user experiences, not how the code works internally.

### Step 2: Locate Affected Areas

Identify all code areas that implement this business logic:

1. **Map the user flow** - trace the feature from UI entry point to completion
2. **Identify state transitions** - what state changes when the user acts?
3. **Find event handlers** - what events are dispatched/received?
4. **List all files** that handle this logic (components, hooks, helpers)
5. **Note integration points** - where does this feature connect to other systems?

**Document findings in a table:**

| File                           | Role in Feature                           | Key Logic                         |
| ------------------------------ | ----------------------------------------- | --------------------------------- |
| `delivery-options-section.tsx` | Shows delivery options, handles selection | Resets store on Basic selection   |
| `useDeliveryOption.ts`         | Syncs shipping type with delivery option  | Maps types, updates hidden field  |
| `collect-in-store-view.tsx`    | Store selection UI                        | Fetches stores, handles selection |

### Step 3: Add Tests Following AAA Pattern

1. **Scan existing tests** in the codebase for examples that follow the **AAA pattern** (Arrange-Act-Assert)

   - Look for tests with clear `// Arrange`, `// Act`, `// Assert` comments
   - Use tests from `delivery-options-section.spec.tsx` or `collect-in-store-view.spec.tsx` as templates

2. **Add tests for each business requirement** - focus on:

   - Conditional rendering (show/hide based on state)
   - User interactions (click, select, change)
   - State transitions (what changes when user acts)
   - Side effects (events dispatched, API calls)

3. **DO NOT test:**

   - Implementation details (specific function calls, internal handlers)
   - Store/state updates directly (e.g., `setSelectedStore`, `setState`) - **test UI behavior instead**
   - Obvious React behavior (props passing, basic rendering)
   - Third-party library internals

4. **DO test:**
   - Business requirements from Step 1
   - **UI behavior** (what the user sees and experiences)
   - Events that cross system boundaries
   - Edge cases (empty states, error conditions)

**Testing UI vs State:**

| ❌ Don't Test (Internal) | ✅ Do Test (User-Facing) |
|--------------------------|--------------------------|
| `store.setSelectedStore()` was called | Selected store details appear in UI |
| `setHiddenFormFieldValue()` was called | Hidden input has correct value in DOM |
| State updated to `ShipToStore` | Address form is hidden, store picker shows |
| `resetStoreSelection()` was called | Store details cleared from view |

**Exception:** Hidden fields are rendered by a designated component (`HiddenFieldOldView`), so testing that hidden inputs have correct values is valid - it verifies the contract with the monolith.

**Example workflow from ShipToStore:**

```
Step 1: User described 21 business scenarios
Step 2: Found 6 affected files with specific logic
Step 3: Created 37 tests across 6 test files
   - delivery-options-section.spec.tsx (5 tests)
   - delivery-options-section-validation.spec.tsx (6 tests)
   - useDeliveryOption.spec.ts (8 tests)
   - collect-in-store-view.spec.tsx (10 tests)
   - mapShippingTypeToDeliveryOptionType.spec.ts (5 tests)
   - address-form-section.spec.tsx (3 tests)
```

## Test File Organization

### Location

- Co-locate test files with source files: `component.tsx` → `component.spec.tsx`
- Keep tests close to implementation for maintainability

### Naming Conventions

- `*.spec.tsx` for React components
- `*.spec.ts` for utilities, hooks, and helpers
- Match the source file name exactly

## Testing Stack

| Tool                                  | Purpose                              |
| ------------------------------------- | ------------------------------------ |
| Jest                                  | Test runner and assertions           |
| `@testing-library/react`              | Component rendering and interactions |
| `@testing-library/react` (renderHook) | Hook testing                         |
| React `act()`                         | State update wrapping                |

## Core Pattern: AAA (Arrange-Act-Assert)

Every test MUST follow this pattern with explicit comments:

```typescript
it("should do something specific", () => {
  // Arrange - Set up state, mocks, and test data
  const store = renderHook(() => useAddressFormStore());
  act(() => {
    store.result.current.setSomeState(value);
  });

  // Act - Execute the code being tested
  const { getByRole } = render(<Component {...props} />);
  fireEvent.click(getByRole("button"));

  // Assert - Verify expected outcomes
  expect(store.result.current.someState).toBe(expectedValue);
});
```

## Working with Zustand Store

### Store Reset Pattern

Always reset store state in `beforeEach` to ensure test isolation using `initialStoreState`:

```typescript
import { useAddressFormStore } from "@global-e/address-form-monolith";
import { act } from "react";

// Capture initial state once at module level
const initialStoreState = useAddressFormStore.getState();

describe("Feature", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useAddressFormStore.setState(initialStoreState, true);
    });
  });
});
```

**Why this pattern?**

- `useAddressFormStore.getState()` captures the complete initial state
- `setState(initialStoreState, true)` replaces the entire state (second arg `true` = replace, not merge)
- More reliable than manually resetting individual slices
- Ensures complete isolation between tests

### Manipulating Store State in Tests

Store manipulation should only happen in the **Arrange** phase to set up test scenarios. **Never assert on store state directly** - assert on UI behavior instead.

```typescript
// ✅ GOOD: Use store to SET UP test scenario (Arrange only)
const store = renderHook(() => useAddressFormStore());

act(() => {
  // Set up: User has selected a store
  store.result.current.setSelectedStore(mockStore);
  store.result.current.setAvailableDeliveryOptions([
    DeliveryOptionType.Basic,
    DeliveryOptionType.CollectInStore,
  ]);
});

// Act: Render component and interact
const { getByText, queryByText } = render(<DeliveryOptionsSection />);

// Assert: Check UI behavior (NOT store state)
expect(getByText(mockStore.name)).toBeInTheDocument(); // Store shown in UI
expect(queryByText(/select a store/i)).not.toBeInTheDocument(); // Picker hidden

// ❌ BAD: Asserting on store state directly
// expect(store.result.current.selectedStore?.id).toBe(123);
```

**Why?** Store state is an implementation detail. The UI is what users actually experience. If we refactor to use a different state management approach, the UI tests should still pass.

## Testing React Components

### Basic Component Test

```typescript
import { render } from "@testing-library/react";
import { useAddressFormStore } from "@global-e/address-form-monolith";

it("should render based on store state", () => {
  // Arrange
  const store = renderHook(() => useAddressFormStore());
  act(() => {
    store.result.current.setAvailableDeliveryOptions([
      DeliveryOptionType.Basic,
      DeliveryOptionType.CollectInStore,
    ]);
  });

  // Act
  const { container } = render(
    <DeliveryOptionsSection
      jsonData={{
        CultureCode: "en-GB",
        Resources: {},
        Settings: {},
        AvailableDeliveryOptions: [
          DeliveryOptionType.Basic,
          DeliveryOptionType.CollectInStore,
        ],
      }}
    />
  );

  // Assert
  expect(container.children.length).toBeGreaterThan(0);
});
```

### Testing User Interactions

```typescript
import { render, fireEvent } from "@testing-library/react";

it("should handle button click", () => {
  // Arrange
  const { getByRole } = render(<Component />);

  // Act
  const button = getByRole("button", { name: /click me/i });
  fireEvent.click(button);

  // Assert
  // Verify state change or event dispatch
});
```

### Testing Conditional Rendering

```typescript
describe("Conditional display", () => {
  it("should not render when condition is met", () => {
    // Arrange
    const store = renderHook(() => useAddressFormStore());
    act(() => {
      store.result.current.setAvailableDeliveryOptions([
        DeliveryOptionType.Basic,
      ]);
    });

    // Act
    const { container } = render(<Component />);

    // Assert
    expect(container.children.length).toBe(0);
  });

  it("should render when condition is met", () => {
    // Arrange
    const store = renderHook(() => useAddressFormStore());
    act(() => {
      store.result.current.setAvailableDeliveryOptions([
        DeliveryOptionType.Basic,
        DeliveryOptionType.CollectInStore,
      ]);
    });

    // Act
    const { container } = render(<Component />);

    // Assert
    expect(container.children.length).toBeGreaterThan(0);
  });
});
```

## Testing Hooks

### Custom Hook Test

```typescript
import { renderHook, act } from "@testing-library/react";

it("should return expected values from hook", () => {
  // Arrange & Act
  const { result } = renderHook(() => useCustomHook());

  // Assert
  expect(result.current.someValue).toBe(expectedValue);
});

it("should update when action is called", () => {
  // Arrange
  const { result } = renderHook(() => useCustomHook());

  // Act
  act(() => {
    result.current.someAction();
  });

  // Assert
  expect(result.current.someValue).toBe(newValue);
});
```

## Testing Events

### Spying on Event Dispatch

```typescript
it("should dispatch custom event", () => {
  // Arrange
  const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");

  // Act
  // ... trigger the event dispatch

  // Assert
  const customEvents = dispatchEventSpy.mock.calls.filter(
    (call) =>
      call[0] instanceof CustomEvent && call[0].type === "ExpectedEventName"
  );
  expect(customEvents.length).toBe(1);

  // Cleanup
  dispatchEventSpy.mockRestore();
});
```

### Testing Event Handling

```typescript
it("should respond to custom event", () => {
  // Arrange
  const store = renderHook(() => useAddressFormStore());
  render(<Component />);

  // Act
  act(() => {
    window.dispatchEvent(new CustomEvent("ExpectedEvent"));
  });

  // Assert
  expect(store.result.current.someState).toBe(expectedValue);
});
```

## Testing Async Operations

### Waiting for Async State Updates

```typescript
import { waitFor } from "@testing-library/react";

it("should update after async operation", async () => {
  // Arrange
  const { getByText } = render(<Component />);

  // Act
  fireEvent.click(getByText("Load Data"));

  // Assert
  await waitFor(() => {
    expect(store.result.current.data).toBeDefined();
  });
});
```

## Mocking Dependencies

### Mocking External Functions

For action creators that return functions (like thunks), use this pattern:

```typescript
// At the top of the test file
import { loadStoresAction } from "./helpers/loadStores";

jest.mock("./helpers/loadStores", () => ({
  loadStoresAction: jest.fn(() => jest.fn()),
}));

// In test
describe("Store fetching", () => {
  it("should fetch stores when country changes", async () => {
    // Arrange - set up the mock implementation
    const mockLoadStores = jest.fn();
    (loadStoresAction as jest.Mock).mockReturnValue(() => mockLoadStores);

    const store = renderHook(() => useAddressFormStore());
    act(() => {
      store.result.current.setFormData(FormType.Shipping, { CountryId: "1" });
    });

    // Act
    render(<CollectInStoreView />);

    // Assert
    await waitFor(() => {
      expect(mockLoadStores).toHaveBeenCalledWith("1");
    });
  });
});
```

**Key points:**

- `jest.mock` at the top of the file (before imports)
- The mock returns `jest.fn(() => jest.fn())` because `loadStoresAction` is a factory that returns the actual function
- Cast to `jest.Mock` to access mock methods like `mockReturnValue`
- Use `waitFor` for async operations

### Mocking Console Methods

```typescript
beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {
    // Suppress expected console errors
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

## Test Organization

### Nested Describe Blocks

Organize tests by feature/scenario:

```typescript
describe("ComponentName", () => {
  describe("Initial render", () => {
    it("should show when conditions met", () => {});
    it("should hide when conditions not met", () => {});
  });

  describe("User interactions", () => {
    it("should handle click", () => {});
    it("should handle selection change", () => {});
  });

  describe("State transitions", () => {
    it("should transition from A to B", () => {});
    it("should not reset other state on transition", () => {});
  });

  describe("Error handling", () => {
    it("should show error on validation failure", () => {});
    it("should clear error on valid input", () => {});
  });
});
```

## What to Test (Business Logic Focus)

### ✅ Do Test:

- **UI behavior** (conditional rendering, visibility, text content)
- User interactions (click, select, input) and their visible effects
- Event dispatching/handling (cross-system communication)
- Hidden field values (DOM elements rendered by designated components)
- Edge cases (empty states, error conditions)
- Business rule enforcement through UI outcomes

### ❌ Don't Test:

- Store/state updates directly (e.g., `setSelectedStore`, `setState` was called)
- Implementation details (internal function calls, private methods)
- Third-party library internals
- Simple prop passing
- React framework behavior
- Styling details (unless critical)

### UI vs State Testing Examples

| ❌ Don't Assert (Internal State) | ✅ Do Assert (UI Behavior) |
|----------------------------------|---------------------------|
| `store.selectedStore.id === 123` | Store name appears in the document |
| `setHiddenFormFieldValue called` | Hidden input element has value "123" |
| `shippingType === ShipToStore` | Shipping address form is not visible |
| `resetStoreSelection called` | "Select a store" message appears |
| `validationErrors.length > 0` | Error message is displayed to user |

**Remember:** Users experience the UI, not the store. Test what they see and can interact with.

## Running Tests

```bash
# Run all tests for a library
nx test publishable-components-address-form-container

# Run specific test file
nx test publishable-components-address-form-container --testPathPattern=delivery-options-section

# Run tests matching pattern
nx test publishable-components-address-form-container --testNamePattern="should render"

# Watch mode
nx test publishable-components-address-form-container --watch

# With coverage
nx test publishable-components-address-form-container --coverage
```

## Troubleshooting

### Common Issues

1. **"act()" warnings**: Wrap state updates in `act()`
2. **State leaking between tests**: Ensure `beforeEach` resets store state
3. **Event not dispatched**: Check spy is set up before component render
4. **Async test failures**: Use `waitFor` for async assertions

### Debug Tips

```typescript
// Log store state
console.log(store.result.current);

// Log dispatched events
const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");
console.log(dispatchEventSpy.mock.calls);

// Pause in test
debugger; // eslint-disable-line
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Zustand Testing](https://docs.pmnd.rs/zustand/guides/testing)
- Global-E codebase examples:
  - `delivery-options-section.spec.tsx` - Component with store interactions
  - `useDeliveryOption.spec.ts` - Hook with store sync
  - `collect-in-store-view.spec.tsx` - Complex component with events

## Checklist for New Tests

- [ ] Test file co-located with source
- [ ] Follows AAA pattern with comments
- [ ] Store state reset using `initialStoreState` pattern in beforeEach
- [ ] Business-focused test descriptions
- [ ] Mocks cleaned up (restoreMocks)
- [ ] All business requirements covered
- [ ] Edge cases included
- [ ] No implementation details in assertions
