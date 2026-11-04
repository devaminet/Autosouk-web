---
name: css
description: CSS and Tailwind CSS v4 guidance for AutoSouk, including theme tokens, right-to-left layouts and responsive design. Use when styling components, adding theme values, building layouts, or reviewing class names.
---

# CSS

Styling uses Tailwind CSS v4 utility classes in `className`. There is no `tailwind.config.js`: the configuration lives in `src/index.css`.

## Theme

All colours, sizes and spacing come from the shared theme, in an `@theme` block in `src/index.css`:

```css
@import "tailwindcss";

@theme {
  --color-brand: oklch(55% 0.15 250); /* example only */
}
```

- A `--color-brand` token generates `bg-brand`, `text-brand`, `border-brand` and others. The `--font-*`, `--text-*` and `--radius-*` namespaces work the same way.
- Tokens come from the design, which is kept outside this repository. Ask the developer for a value rather than inventing one.
- Don't use arbitrary values such as `w-[37px]` or `text-[#c00]`. Add a token, or use the spacing scale.

## Logical properties only

Layouts must flip for Arabic, so use only logical utilities:

| Use | Never use |
|---|---|
| `ms-*`, `me-*` | `ml-*`, `mr-*` |
| `ps-*`, `pe-*` | `pl-*`, `pr-*` |
| `inset-s-*`, `inset-e-*` | `left-*`, `right-*` |
| `text-start`, `text-end` | `text-left`, `text-right` |
| `border-s`, `border-e` | `border-l`, `border-r` |
| `rounded-s-*`, `rounded-e-*` | `rounded-l-*`, `rounded-r-*` |
| `float-start`, `float-end` | `float-left`, `float-right` |

The same rule applies in plain CSS: use `margin-inline-start`, `inset-inline-end` and `text-align: start`.

Some things do not flip on their own, so use the `rtl:` variant:

- Directional icons: `rtl:-scale-x-100`. Don't mirror logos or media controls.
- Horizontal movement, as `translate-x-*` is physical: `translate-x-2 rtl:-translate-x-2`.

## Layout

- Use `flex` and `grid`, with `gap-*` for space between items. Flexbox and grid follow the text direction.
- Avoid fixed heights on anything that holds text. Translated text can be much longer, and French is often longer than English.
- Use `min-w-0` on a flex child that holds long text, so it can shrink.

## Responsive design

- Write mobile-first: unprefixed classes are for small screens, and `md:` and `lg:` add to them.
- Pages must work at 390px wide and at 200% zoom with no lost content.
- Use `rem`-based sizes, from the spacing and text scales, so text can scale. Avoid `px` for font sizes.

## Class names

Tailwind scans source files as plain text and generates only the complete class names it finds. Never build a class name from pieces:

```tsx
// Wrong: Tailwind never sees bg-warning or bg-success.
<span className={`bg-${tone}`} />

// Right: complete class names in a lookup, typed by the API's slugs.
// The token names are examples only.
const statusClass: Record<ListingStatus, string> = {
  draft: "bg-muted",
  pending: "bg-warning",
  approved: "bg-success",
  withdrawn: "bg-muted",
  rejected: "bg-danger",
  sold: "bg-muted",
};
```

- Combine classes with a plain template string. Add a helper library only when a component really needs one.
- Avoid conflicting utilities such as `p-2 p-4` on one element, as the result depends on the generated CSS order and not on the class order.
- Reuse through components, not `@apply`. If the same classes repeat, extract a component into `src/components/`.
- Add custom CSS only for what utilities cannot express, and put it in `src/index.css`.

## States and motion

- Style every state of an interactive element: `hover:`, `focus-visible:`, `active:` and `disabled:`. See the `accessibility` skill for focus rules.
- Don't show hover-only content: touch and keyboard users cannot reach it.
- Honour reduced motion with `motion-safe:` on animations, or `motion-reduce:transition-none` on transitions.
- Use `sr-only` for text that only screen readers need.

## Arabic text

- Don't use `tracking-*` on text that can be Arabic: letter spacing breaks the joined letters.
- Don't rely on `uppercase` or `italic` for emphasis, as Arabic has neither. Use weight or colour with a word.
- Arabic often needs more line height than Latin text, so check it on real content.

## Tests

Don't assert class names in tests. Test behaviour through roles and visible text, as described in the `testing` skill.

## Before finishing

1. Search the changed files for physical utilities (`ml-`, `pr-`, `left-`, `text-right`) and arbitrary values (`-[`).
2. View the screen in Arabic, at 390px wide, and at 200% zoom.
3. Run `npm run build`, as the Vite plugin generates the CSS.
