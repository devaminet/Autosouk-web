---
name: design-patterns
description: React architecture and design patterns for AutoSouk. Use when structuring a feature, deciding where code belongs, sharing logic between components, or building reusable components.
---

# Design patterns

Choose the simplest thing that works. Introduce a pattern when a real duplication or problem appears, usually on the third use, not in advance.

## Project structure

```text
src/
  app/              # providers, router, app-wide layout
  features/
    listings/
      api.ts        # API calls and their types
      hooks.ts      # data and behaviour hooks
      components/   # components used only by this feature
      pages/        # route-level components
  components/       # shared UI, such as Button, Input and Badge
  hooks/            # shared hooks
  lib/              # API client, formatting, i18n setup
```

- Dependencies point one way: `app` → `features` → shared code.
- A feature doesn't import another feature's internals. Move shared code up, or export a small public API.
- Move code to a shared folder only when a second feature needs it.

## Pages and UI components

Page components fetch data, read the URL and handle states. UI components receive props and render:

```tsx
function ListingsPage() {
  const listings = useListings();
  if (listings.isPending) return <ListingsSkeleton />;
  if (listings.isError) return <ErrorMessage error={listings.error} />;
  return <ListingGrid listings={listings.data} />;
}
```

This keeps UI components easy to test and reuse. Don't split a component that is simple and only used once.

## Custom hooks

Extract a hook to reuse stateful logic, or to give a complex component's logic a name. A hook named `useX` must call another hook; otherwise, write a plain function.

## Composition

Prefer `children` and slots to growing boolean props:

```tsx
// Avoid: <Card showHeader showFooter headerTitle="…" footerAction={…} />
<Card>
  <Card.Header>…</Card.Header>
  <Card.Body>…</Card.Body>
</Card>
```

Use compound components with context when parts share state, as in `Tabs`, `Stepper` and `Segmented`. Avoid render props when a hook does the job.

## API layer

- Components never call `fetch`. They use feature hooks, which use `features/<feature>/api.ts`, which uses one client in `lib/`.
- The client handles the base URL, language, access token, refresh and the error shape. It throws one typed error carrying `{ code, message, field, params }`.

## State

- Keep server data in TanStack Query, and don't duplicate it in global stores.
- Keep URL-worthy state in the URL.
- Use context for values that change rarely. Split contexts so that one update doesn't re-render everything.
- Add a global store only for a real need that these don't meet.

## Errors and loading

- Every data view handles its loading, empty and error states, using the discriminated-union approach from the `typescript` skill.
- Put error boundaries around routes, so one failure doesn't blank the whole app.

## Anti-patterns

- A component with many unrelated props or boolean flags.
- A wrapper that only passes props through.
- Props passed through several layers that don't use them: compose with `children`, or use context.
- Business rules duplicated from the API. The API decides; the UI reflects its answer.
