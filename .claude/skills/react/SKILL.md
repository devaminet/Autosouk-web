---
name: react
description: React 19 component guidance for AutoSouk. Use when creating or changing components, hooks, forms, state or effects, or when fixing rendering problems.
---

# React

## Components

- Write function components with typed props. Declare the props type next to the component.
- Keep components pure: the same props and state give the same output, with no side effects during render.
- Give each component one job. Split it when its JSX has unrelated sections or its logic needs a long explanation.
- Pass `children` rather than adding many configuration props.
- Use stable, unique `key` values from the data, never the array index for lists that can change.

## State

Choose the smallest tool that works:

| Kind of state | Where it lives |
|---|---|
| Can be computed from props or state | Compute it during render; don't store it |
| Used by one component | `useState` |
| Several related updates | `useReducer` |
| Filters, pages, the selected tab | The URL, so links can be shared |
| Data from the API | TanStack Query; never copy it into `useState` |
| Rarely changing app-wide values (language, session) | Context |

## Effects

An effect synchronizes with something outside React, such as a browser API or a subscription. You don't need one to:

- derive a value: compute it during render;
- respond to a click: use the event handler;
- reset state when a prop changes: pass a `key`.

Always clean up subscriptions and timers. Components render twice in `StrictMode` in development, which exposes missing cleanups.

## React 19

- `ref` is a normal prop for function components, so don't use `forwardRef` in new code.
- Use `useActionState` and `useFormStatus` for form submission and pending state, and `useOptimistic` for optimistic updates.
- `use` reads a promise or context during render. Pass it a promise from a cache or a parent, never one created during render.
- Render `<title>` and `<meta>` in a page component; React moves them to `<head>`.

## Performance

Measure before optimizing. Use `useMemo`, `useCallback` and `memo` for a measured problem or when a stable reference is required, not by default. Use `lazy` with `Suspense` to split code by route.
