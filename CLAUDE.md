# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project

AutoSouk is a Morocco-focused marketplace for cars and independent mechanic inspections. This repository is the React client only. The API is a separate Node, Express and PostgreSQL project in the sibling folder `../AutoSouk`; run `/add-dir ../AutoSouk` to read its routes.

Roles, which are always enforced by the API and never by the client:

- **Buyer:** browses and filters cars, keeps favourites, requests inspections, reads reports.
- **Seller:** creates listings, adds a car with its photos and equipment, tracks listing status.
- **Mechanic:** manages a garage profile, handles inspection requests, submits reports.
- **Admin:** approves or rejects pending listings.

## Stack

React 19, Vite, TypeScript (strict), Tailwind CSS, self-hosted Fontsource fonts, Vitest with Testing Library, and Oxlint.

Not installed yet, and added with the first feature that needs them: React Router (routing), TanStack Query (API data), and `react-i18next` with `i18next-http-backend` (translations).

## Commands

```bash
npm run dev         # dev server on http://localhost:5173, proxies /api to http://localhost:8080
npm run build       # type-check, then build into dist/
npm run preview     # serve the production build
npm run lint        # Oxlint, including the jsx-a11y rules
npm run typecheck   # tsc -b
npm test            # run every test once
npm run test:watch  # run tests in watch mode
```

Run one test file with `npx vitest run src/App.test.tsx`, and one test by name with `npx vitest run -t "some test name"`.

Before calling work done, run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`.

## Conventions

- **Components:** function components in `PascalCase.tsx`, with one exported component per file. Keep them small, and pass data through props.
- **TypeScript:** no `any`; use `unknown` and narrow it. Validate API responses at the boundary. Use `import type` for types, and union types instead of `enum`.
- **Structure:** group code by feature (`src/features/<feature>/`). Put only code used by several features in `src/components/`, `src/hooks/` and `src/lib/`. All API calls go through one client module.
- **Styling:** values come from the shared theme. Use logical CSS properties only, so right-to-left layouts work.
- **Text:** never hard-code UI strings. The brand name is the only exception.
- **Tests:** put `Thing.test.tsx` next to `Thing.tsx`, and test behaviour through roles and visible text.

Use the project skills in `.claude/skills/`: `react`, `typescript`, `html`, `css`, `testing`, `accessibility` and `design-patterns`.

## Working with the API

- In development, call relative `/api/...` URLs; the Vite proxy forwards them.
- Send the user's language as `?lang=` or `Accept-Language`. Languages are `fr` (default), `en` and `ar`.
- Errors have the shape `{ errors: [{ code, message, field?, params? }] }`. Branch on `code`, show `message`, and attach it to the input named by `field`.
- Lookup values and statuses arrive as slugs. Translate them with the `enums` catalog from `GET /api/i18n/{locale}/enums`.
- Form options come from `GET /api/lookups`, `GET /api/makes`, `GET /api/models/{make_id}` and `GET /api/equipment`.
- The full contract is in `../AutoSouk/docs/frontend-i18n.md`, and the OpenAPI docs are at `http://localhost:8080/api-docs`.

## Design

Never add design files to this repository: no screenshots, no token exports, no design spec. They are kept outside it, and `design/` is in `.gitignore`. The theme in `src/index.css` is code, so it belongs here. Ask the developer when a task needs the design.

Rules for all UI work:

- Reuse existing components, and keep colours, sizes and spacing in one shared theme instead of repeating raw values.
- Support French (default), English and Arabic. Use logical CSS properties only, and flip directional icons in right-to-left layouts.
- Isolate numbers such as prices and mileage with `<bdi dir="ltr">`.
- Never hard-code UI strings.
- If the design and the API disagree, follow the API and flag the mismatch.

## Git

- Never commit, push, or create or merge pull requests; the developer does that. `.claude/settings.json` enforces this.
- Work on a branch, never directly on `main`.
- Make one change per commit, with a Conventional Commits message (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- After each step, propose the commit message for the developer to use.
