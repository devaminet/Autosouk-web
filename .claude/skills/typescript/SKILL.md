---
name: typescript
description: Strict TypeScript guidance for AutoSouk. Use when writing or reviewing types, typing props and API responses, or fixing compiler errors.
---

# TypeScript

The project uses `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax` and `erasableSyntaxOnly`.

## Rules

- Never use `any`. Use `unknown` for values of unknown shape, and narrow them before use.
- Avoid `as` assertions. Prefer narrowing, or `satisfies` to check a value and keep its precise type. An assertion needs a reason.
- Avoid `!`. Handle the `null` or `undefined` case.
- Use `import type { Thing } from "./thing"` for types.
- Use union types, or an `as const` object, instead of `enum`, which `erasableSyntaxOnly` forbids.
- With `noUncheckedIndexedAccess`, `items[0]` can be `undefined`, so check it.

## Modelling

Make invalid states impossible with discriminated unions:

```ts
type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; code: string }
  | { status: "success"; data: T };
```

Check every case exhaustively:

```ts
const assertNever = (value: never): never => {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
};
```

Use literal unions for known values, for example `type Locale = "fr" | "en" | "ar"`.

## API data

- A response is `unknown` until validated. Check it at the API client boundary, so the rest of the code can trust its types.
- Keep API types in the feature that uses them, and match the API's field names.
- Model the error body once:

```ts
type ApiError = {
  code: string;
  message: string;
  field?: string;
  params?: Record<string, string | number>;
};
```

## React types

```tsx
type ButtonProps = {
  variant?: "primary" | "secondary";
} & React.ComponentProps<"button">;

function Button({ variant = "secondary", ...props }: ButtonProps) {
  return <button data-variant={variant} {...props} />;
}
```

- Use `React.ReactNode` for `children`.
- Let TypeScript infer what it can. Annotate exported functions, and `useState` when the initial value doesn't reveal the type: `useState<Listing | null>(null)`.
- Don't use `React.FC`.
