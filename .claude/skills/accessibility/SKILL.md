---
name: accessibility
description: Web accessibility guidance for AutoSouk, targeting WCAG 2.2 AA, including right-to-left Arabic. Use when building or reviewing any UI, form, dialog, navigation or interactive component.
---

# Accessibility

The target is WCAG 2.2 AA, in French, English and Arabic. `npm run lint` runs the `jsx-a11y` rules, which catch only part of this, so also test with the keyboard.

## Semantic HTML first

- Use `<button>` for actions and `<a href>` for navigation, never a clickable `<div>`.
- Use `<header>`, `<nav>`, `<main>` and `<footer>`, with one `<main>` per page.
- Use one `<h1>` per page, and don't skip heading levels.
- Use ARIA only when HTML has no equivalent. Incorrect ARIA is worse than none.

## Keyboard and focus

- Everything must work with the keyboard, in a logical order. Never use a positive `tabindex`.
- Keep a visible focus style, using `:focus-visible`; never remove it without a replacement.
- After a route change, move focus to the new page's heading or `<main>`.
- Use the native `<dialog>` with `showModal()` for modals. Return focus to the trigger when it closes.

## Forms

- Every input has a `<label>`; a placeholder is not a label.
- Show the API's error `message` next to the input named by its `field`, and connect them:

```tsx
<>
  <label htmlFor="email">{t("fields.email")}</label>
  <input
    id="email"
    type="email"
    autoComplete="email"
    aria-invalid={Boolean(error)}
    aria-describedby={error ? "email-error" : undefined}
  />
  {error && <p id="email-error">{error}</p>}
</>
```

- On a failed submit, move focus to the first invalid input or an error summary.
- Group radio buttons and checkboxes with `<fieldset>` and `<legend>`.
- Don't disable the submit button to signal errors; let users submit and see them.

## Content and images

- Give informative images useful `alt` text. For car photos, use the make, model and year. Use `alt=""` for decorative images.
- Give icon-only buttons an accessible name with `aria-label`, translated like other text.
- Never use colour alone for meaning. Status badges always carry a word.
- Keep contrast at 4.5:1 for text and 3:1 for large text and UI parts. Check any new colour pair.
- Make targets at least 24×24 CSS pixels.

## Dynamic content

- Announce results and errors that appear without a page change with `role="status"` (polite) or `role="alert"` (urgent). The element must exist before its content changes.
- Show loading states as text for screen readers, not just a spinner.
- Honour `prefers-reduced-motion` for animations.

## Languages and right to left

- Keep `lang` and `dir` on `<html>` in sync with the language (`dir="rtl"` for Arabic).
- Use logical CSS properties (`margin-inline-start`, `inset-inline-end`, `text-align: start`).
- Mirror directional icons (arrows, chevrons, back) in RTL, but not logos or media controls.
- Wrap prices, mileage and counts in `<bdi dir="ltr">`. Also mark text in another language with its own `lang`.

## Before finishing

1. Complete the task using only the keyboard.
2. Zoom to 200%, and view at 390px wide, with no lost content.
3. Check the screen in Arabic.
4. Run `npm run lint`.
