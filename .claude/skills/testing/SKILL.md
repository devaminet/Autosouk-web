---
name: testing
description: Testing guidance for AutoSouk with Vitest and React Testing Library. Use when writing, fixing or reviewing tests, or when adding a feature that needs them.
---

# Testing

The tools are Vitest, React Testing Library, `@testing-library/user-event` and `@testing-library/jest-dom`, with a jsdom environment. Import `describe`, `it`, `expect` and `vi` from `vitest`.

## What to test

Test what a user sees and does, not the implementation:

- what is on the screen, after each interaction;
- loading, empty and error states, including the API's `message` next to its `field`;
- permissions as shown in the UI, such as a seller-only action.

Don't test private functions, internal state, or CSS class names. Test pure logic (formatting, validation) directly, in plain unit tests.

## Queries

Use this order; the first ones also check accessibility:

1. `getByRole("button", { name: "…" })`
2. `getByLabelText`
3. `getByText`, `getByPlaceholderText`, `getByDisplayValue`
4. `getByTestId`, only when nothing else fits

Use `getBy*` when the element must exist, `queryBy*` to assert it's absent, and `await findBy*` when it appears later.

## Example

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FavoriteButton } from "./FavoriteButton";

describe("FavoriteButton", () => {
  it("reports the click", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<FavoriteButton label="Add to favourites" onToggle={onToggle} />);

    await user.click(screen.getByRole("button", { name: "Add to favourites" }));

    expect(onToggle).toHaveBeenCalledOnce();
  });
});
```

## Rules

- Use `userEvent`, not `fireEvent`, so tests behave like real input.
- Don't use `waitFor` with a side effect inside, and don't use fixed delays. Prefer `findBy*`.
- Mock at the network boundary. Add MSW once the API client exists, and don't mock the component's own modules.
- Each test sets up its own data and passes alone. Avoid snapshot tests.
- For a bug fix, write a test that fails first, then fix the bug.
- Test translated and right-to-left behaviour for logic that depends on the language, such as `dir` and number formatting.

## Running

```bash
npm test
npm run test:watch
npx vitest run src/App.test.tsx
npx vitest run -t "some test name"
```

After building a screen, also render it in a browser; jsdom can't check layout.
