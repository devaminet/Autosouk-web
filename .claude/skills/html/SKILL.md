---
name: html
description: Semantic HTML and JSX markup guidance for AutoSouk. Use when writing or reviewing markup, choosing elements, building page structure, forms, tables, links or images.
---

# HTML

Choose the element by what the content means, not how it should look. Styling belongs in CSS, so see the `css` skill. For keyboard, focus and ARIA rules, see the `accessibility` skill.

## Choosing elements

| Content | Element |
|---|---|
| An action on this page | `<button type="button">` |
| Going to another URL | `<a href>` |
| Page regions | `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` |
| A self-contained item, such as a car card or a report | `<article>` |
| A titled part of a page | `<section>` with a heading |
| Search and filter controls | `<search>` containing a `<form>` |
| Search results or favourites | `<ul>` with `<li>` |
| Car specifications, label and value pairs | `<dl>`, `<dt>`, `<dd>` |
| Tabular data, such as an admin listing queue | `<table>` |
| A photo with a caption | `<figure>`, `<figcaption>` |
| A date | `<time dateTime="2026-11-04">` |

Use `<div>` and `<span>` only for layout and styling hooks, when no other element fits. Choose heading levels by document order, not by size.

## Buttons and links

- Always set `type` on a `<button>`. The default is `submit`, which submits any surrounding form.
- A link needs a real `href`, so it can open in a new tab. Never use `href="#"` for an action.
- With `target="_blank"`, tell the user in the link text that it opens a new tab.

## Forms

- Wrap inputs in a `<form>` with `onSubmit` or `action`, so the Enter key submits.
- Use the most specific `type` (`email`, `tel`, `password`, `search`, `number`). Use `number` only for quantities; for values like a phone number or a postal code, use `type="text"` with `inputMode="numeric"`.
- Set `autoComplete` on personal fields, with values such as `email`, `tel`, `name` and `current-password`.
- Give each input a `name`.
- Use `<select>` for a short list of options from `GET /api/lookups`, and radio buttons when all options should stay visible.
- Use `noValidate` on a form when showing the API's errors instead of the browser's, as the API is the source of truth.

## Images

```tsx
<img
  src={photo.url}
  alt={t("car.photoAlt", { make, model, year })}
  width={640}
  height={480}
  loading="lazy"
  decoding="async"
/>
```

- Always set `width` and `height`, or `aspect-ratio` in CSS, so the layout does not shift while the image loads.
- Use `loading="lazy"` below the fold. Don't use it on the main image of a page.
- Use `srcSet` and `sizes` when the API offers several sizes.

## Tables

- Give each table a `<caption>`, even if it is visually hidden, and use `<thead>` and `<tbody>`.
- Use `<th scope="col">` and `<th scope="row">` for headers.
- Keep a table a table on small screens: put it in a scrolling wrapper rather than replacing the markup with `<div>` elements.

## Text direction and language

- `lang` and `dir` belong on `<html>`, and change with the language.
- Wrap prices, mileage and counts in `<bdi dir="ltr">`.
- Wrap user-written text, such as a seller's description, in `<bdi>` or give its block `dir="auto"`, as its language can differ from the interface.
- Never use spaces, `<br>` or `&nbsp;` for layout.

## JSX

- Use `className`, `htmlFor`, `dateTime`, `autoComplete`, `inputMode` and `noValidate`.
- Don't nest interactive elements, such as a button inside a link. To make a whole card clickable, put one link in the card heading and stretch it over the card with CSS.
- Don't nest a block element, such as `<div>`, inside a `<p>`; React warns about the invalid markup.
- Use a fragment rather than a wrapper `<div>` when no wrapper is needed.

## Page metadata

Render `<title>` and `<meta name="description">` in each page component, as described in the `react` skill. Translate both.

## Before finishing

1. Read the markup with the styles ignored: does the structure still make sense?
2. Run `npm run lint`.
3. Check the rendered page with no invalid-nesting warnings in the browser console.
