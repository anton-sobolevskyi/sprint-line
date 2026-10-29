# SprintLine

SprintLine is a web app for small teams to plan work: projects, a kanban board, task assignments, comments, and file attachments.

It is an Angular single-page app. Accounts, projects, and tasks live on a separate HTTP API. In development the app calls that API at `http://localhost:3000`. The production build calls the hosted API configured in `src/environments/environment.ts`.

## Features

- Sign up, sign in, password reset, and email verification
- Home dashboard with assigned work, due dates, and recent projects
- Projects with a board and list, members and roles, and project settings
- Tasks with status (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`) and priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
- Comments and attachments on tasks
- Command palette (`⌘K` / `Ctrl+K`) and light, dark, or system theme

## Stack

- [Angular](https://angular.dev) 22, TypeScript, SCSS
- [NgRx](https://ngrx.io) for auth and the current user; signal stores for project screens
- [Tailwind CSS](https://tailwindcss.com) 4 and [Spartan](https://www.spartan.ng) (`libs/ui`) for UI
- [Zod](https://zod.dev) for form schemas
- [Vitest](https://vitest.dev) for unit tests and [Playwright](https://playwright.dev) for end-to-end tests
- ESLint, Stylelint, Prettier, Husky, and Commitlint

## Requirements

- Node.js 24 (see `mise.toml`)
- npm 11 (`package.json` `packageManager`)
- A running SprintLine API on port 3000 for local development

## Getting started

```bash
npm ci
npm start
```

The dev server is at [http://localhost:4200](http://localhost:4200). `ng serve` uses the development configuration, which points `apiUrl` at `http://localhost:3000`.

Sign-in uses a bearer access token and a refresh cookie (`withCredentials`). The API must allow the dev origin and credentials.

## Scripts

| Command               | What it does                                   |
| --------------------- | ---------------------------------------------- |
| `npm start`           | Dev server                                     |
| `npm run build`       | Production build in `dist/sprint-line/browser` |
| `npm test`            | Unit tests in watch mode                       |
| `npm run test:ci`     | Unit tests once                                |
| `npm run e2e`         | Playwright against the dev server              |
| `npm run lint`        | ESLint on `src`                                |
| `npm run lint:styles` | Stylelint on SCSS and CSS                      |
| `npm run typecheck`   | `tsc --noEmit`                                 |
| `npm run format`      | Prettier write                                 |

`npm run e2e` expects the app at `http://localhost:4200`, or set `PLAYWRIGHT_TEST_BASE_URL`.

Pre-commit runs lint-staged. Commit messages follow [Conventional Commits](https://www.conventionalcommits.org).

## Project layout

```text
src/app
  features/     screens (auth, home, profile, projects, tasks)
  core/         HTTP services, guards, interceptors
  components/   dialogs and shell widgets
  layout/       signed-in shell and auth shell
  store/        NgRx auth state
  constants/    API paths, copy, limits
src/environments   apiUrl per build configuration
src/types          generated OpenAPI types
libs/ui            Spartan Helm components
e2e                Playwright specs
```

Route components are lazy-loaded. `authGuard` protects the signed-in shell; `guestGuard` keeps signed-in users off the login and register pages. An app initializer restores the session by calling the refresh endpoint before the first navigation.

Path aliases (`@core/*`, `@constants/*`, `@utils`, `@types`, `@spartan-ng/helm/*`) are defined in `tsconfig.json`.

## API types

Request and response types come from the backend OpenAPI document. With the API running locally:

```bash
mise run fetch-openapi
```

That writes `src/types/api.schema.d.ts` from `http://localhost:3000/api-docs-yaml`.

## Environments

| File                                          | Used by                        | API                     |
| --------------------------------------------- | ------------------------------ | ----------------------- |
| `src/environments/environment.development.ts` | `ng serve`, development builds | `http://localhost:3000` |
| `src/environments/environment.ts`             | `npm run build`                | hosted API              |

There is no runtime env file. Change `apiUrl` in the environment file that matches the build you are shipping.

## Production

**Static host.** `render.yaml` builds with `npm ci && npm run build` and publishes `dist/sprint-line/browser`, rewriting every path to `index.html`.

**Docker.** The image builds the app, then nginx serves it (see `Dockerfile` and `config/nginx.conf`). Caddy terminates TLS in front of that container:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Set the site name in `Caddyfile` before exposing ports 80 and 443. nginx answers `GET /health` with `200`.

`mise run docker-prod`, `docker-prod-down`, and `docker-prod-logs` wrap those compose commands.
