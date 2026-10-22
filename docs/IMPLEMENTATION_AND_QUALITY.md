# SprintLine — Implementation Guide & Quality Requirements

Step-by-step frontend implementation plan based on the [management_app_backend](https://github.com/anton-sobolevskyi/management_app_backend) API, plus quality requirements (UX, accessibility, code, tests).

**UI stack:** Angular 22 · spartan-ng (brain + helm) · Tailwind CSS v4 · NgRx · Zod · openapi-typescript  
**Accessibility target:** WCAG 2.2 Level AA

---

## 1. Dependency & setup checklist

### Required (installed)

| Package | Purpose |
|---------|---------|
| `@spartan-ng/brain` | Accessible headless primitives |
| `@spartan-ng/cli` | Generate helm components |
| `tailwindcss` + `@tailwindcss/postcss` + `postcss` | Tailwind v4 pipeline |
| `clsx`, `class-variance-authority`, `tailwind-merge` | Class utilities |
| `tw-animate-css` | Animation preset |
| `@angular/cdk`, `@angular/aria` | Focus, overlays, a11y primitives |
| `@ng-icons/core` + Lucide / Phosphor | Icons |
| `luxon` | Date picker / due dates |
| NgRx (store, effects, entity, signals, router-store) | State |
| `zod` + `openapi-typescript` | Validation / API types |

### Configuration (in repo)

- [x] `.postcssrc.json` → `@tailwindcss/postcss`
- [x] `src/styles.scss` → Tailwind layers + `@spartan-ng/brain/hlm-tailwind-preset.css` + CSS variables (light/dark)
- [x] `components.json` → helm path `libs/ui`, style `maia`
- [x] `libs/ui/*` → copied helm components

### Recommendations / risks

1. **Angular Material is still in dependencies.** Build new screens only with spartan/helm. Remove Material once unused so the app does not mix two design systems.
2. **Icon package versions:** `@ng-icons/lucide` (^32) vs `@ng-icons/core` (^36) — align major versions to avoid peer conflicts.
3. **Tailwind / PostCSS in `dependencies`.** Fine if production images always install them; otherwise move to `devDependencies` when the build stage always has devDeps.
4. **Docker:** after `package.json` changes, refresh the named volume: `docker compose down -v && docker compose up --build`.

### Quick verification

```bash
npm run typecheck
npm run lint
npm run build
node -e "require.resolve('@tailwindcss/postcss'); require.resolve('@spartan-ng/brain')"
```

---

## 2. Implementation phases

Order follows API capabilities and UX priority (shortest path to a usable board).

### Phase 0 — Foundation

| Step | Work | Status | Notes |
|------|------|--------|-------|
| 0.1 | API client: `environment.apiUrl`, interceptors (Bearer, refresh cookie, 401) | **Done** | `src/app/core/` — see below |
| 0.2 | OpenAPI types (`fetch-openapi` / equivalent) | Done | `src/types/api.schema.d.ts` |
| 0.3 | App shell: layout, router outlets, global error toast (Sonner) | Pending | |
| 0.4 | Design tokens: task status, priority colors, focus ring | Partial | Theme CSS variables in `styles.scss`; status/priority tokens TBD |
| 0.5 | Path alias `@spartan-ng/helm` → `libs/ui` in `tsconfig` | Done | Per-component path map in `tsconfig.json` |

#### Phase 0.1 — delivered files

| File | Responsibility |
|------|----------------|
| `src/app/core/auth/access-token.store.ts` | In-memory access token (signal) |
| `src/app/core/auth/auth-session.service.ts` | Serialized `/auth/refresh` + apply/clear session |
| `src/app/core/auth/auth-api.service.ts` | `register` / `login` / `logout` / `refresh` HTTP API |
| `src/app/core/http/auth.interceptor.ts` | `withCredentials`, `Authorization: Bearer`, 401 → refresh → retry once |
| `src/app/core/api/api-error.ts` | Parse backend `{ code, message }` error bodies |
| `src/app/app.config.ts` | `provideHttpClient(withInterceptors([authInterceptor]))` |

**Behaviour notes (aligned with backend):**

- Access token is never written to `localStorage` / `sessionStorage`.
- Refresh token is an HttpOnly cookie (`path=/auth`); all API calls use `withCredentials: true`.
- Concurrent 401s share one in-flight refresh (`shareReplay`); a failed refresh clears the session.
- `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout` do not trigger the refresh-retry loop.

### Phase 1 — Authentication

| Step | Screens / logic | Acceptance |
|------|-----------------|------------|
| 1.1 | `/login`, `/register` | Validation (email, password 8+ with letter + number); API errors shown |
| 1.2 | Auth store (NgRx signals or feature store) | Access token in memory; refresh via HttpOnly cookie |
| 1.3 | Guards: auth / guest | Protected routes redirect to login |
| 1.4 | Logout | Revokes refresh; clears client state |

**a11y:** labels, `aria-invalid`, focus first error after submit, visible focus.

**Depends on:** Phase 0.1 (`AuthApiService`, `AccessTokenStore`, interceptor).

### Phase 2 — Profile

| Step | Work | Acceptance |
|------|------|------------|
| 2.1 | `/profile` — name, email (read), avatar | GET/PATCH `/users/me` |
| 2.2 | Change password | PATCH password; all sessions invalidated |
| 2.3 | Avatar upload | Backend S3 flow; preview |
| 2.4 | Delete account | Confirm dialog; handle 409 (sole OWNER) |

### Phase 3 — Projects

| Step | Work | Acceptance |
|------|------|------------|
| 3.1 | Projects list | Cards: name, role, memberCount, task summary |
| 3.2 | Create project | Dialog/sheet; optimistic or list invalidation |
| 3.3 | Project hub `/projects/:id` | Tabs: Board / List / Members / Settings |
| 3.4 | Update / soft-delete project | OWNER only (UI + API errors) |
| 3.5 | Empty states | CTA “Create first project” |

### Phase 4 — Project members

| Step | Work | Acceptance |
|------|------|------------|
| 4.1 | Members table | Avatar, name, email, role, joined |
| 4.2 | Invite by email | Default role MEMBER |
| 4.3 | Change role / remove / leave | Confirm destructive actions |
| 4.4 | Transfer ownership | Dedicated confirm |

### Phase 5 — Tasks (core product)

| Step | Work | Acceptance |
|------|------|------------|
| 5.1 | Board: TODO → IN_PROGRESS → IN_REVIEW → DONE | Drag status (CDK DragDrop) + PATCH |
| 5.2 | Task card | Title, priority badge, assignee, due (overdue style), counts |
| 5.3 | Create task (inline / dialog) | Required title + projectId |
| 5.4 | Task detail **sheet/drawer** | Status, priority, assignee, due, description |
| 5.5 | List view + filters | `q`, status, assignedToId, dueBefore/After; pagination meta |
| 5.6 | Soft-delete task | Confirm; remove from board |

**UX:** optimistic status/assignee; skeleton while board loads; keyboard path to change status (not drag-only).

### Phase 6 — Comments

| Step | Work | Acceptance |
|------|------|------------|
| 6.1 | Thread in task sheet | Chronological list, author, timestamps |
| 6.2 | Create / edit / delete | Author or ADMIN/OWNER |
| 6.3 | Optimistic add | Rollback + toast on failure |

### Phase 7 — Attachments

| Step | Work | Acceptance |
|------|------|------------|
| 7.1 | Upload to task/comment | Progress; enforce API type/size rules |
| 7.2 | List + download | Presigned URL; image preview |
| 7.3 | Delete | Uploader or OWNER/ADMIN |

### Phase 8 — Dashboard & polish

| Step | Work | Acceptance |
|------|------|------------|
| 8.1 | Dashboard | Projects overview + “My open tasks” |
| 8.2 | Global search (optional MVP+) | Projects + tasks |
| 8.3 | Dark mode toggle | `.dark` on `html` / `:root` |
| 8.4 | Responsive | Board horizontal scroll; list → cards on mobile |
| 8.5 | Remove Material if unused | Single design system |

---

## 3. Architecture rules

### Suggested structure

```text
src/
  app/
    core/           # auth, http, guards, interceptors
    shared/         # pipes, ui wrappers, utils
    features/
      auth/
      profile/
      projects/
      tasks/
      members/
  libs/ui/          # spartan helm (owned styles)
  types/            # OpenAPI + env
```

### State & data

- **Server state:** one approach per project (prefer NgRx SignalStore per feature or clear feature stores) with explicit cache invalidation after mutations.
- **Auth token:** access token in memory; refresh only via cookie; single in-flight refresh across tabs.
- **Forms:** typed forms + Zod (or API-shaped messages: `message: string | string[]`).
- **Dates:** ISO 8601; due-date UX must match backend UTC date-only rules.

### UI

- Interactive components: **spartan brain + helm**.
- Do not mix Material components on the same screens.
- Toasts: Sonner (helm).
- Destructive actions: Alert Dialog with the entity name stated clearly.

---

## 4. Quality requirements

### 4.1 Accessibility (WCAG 2.2 AA)

| Requirement | How |
|-------------|-----|
| Keyboard operable | All actions without a mouse; logical tab order |
| Focus visible | Do not remove outlines; use `:focus-visible` / ring token |
| Focus trap | Dialog / sheet / menu — brain + manual check |
| Name, Role, Value | Labels; no clickable bare `div`s |
| Errors | Text + `aria-describedby` / `aria-invalid`; focus first error |
| Contrast | Text ≥ 4.5:1; UI components ≥ 3:1; verify theme variables |
| Status messages | Toasts / live regions for success and failure |
| Motion | Respect `prefers-reduced-motion` where animations exist |
| Drag-and-drop | Keyboard alternative (e.g. “Move to status” menu) |

**Required checks before merging a feature:**

- [ ] axe DevTools / Lighthouse a11y on touched pages
- [ ] Keyboard-only path: login → project → board → task sheet → comment
- [ ] One screen-reader pass (VoiceOver or NVDA) on auth + task detail

### 4.2 UX / product

- Empty, loading (skeleton), and error states on every list.
- Optimistic UI only where rollback is easy (status, assignee, comment add).
- Roles: hide unavailable actions; on 403 show a clear toast, not a silent failure.
- Avoid full-screen blocking spinners unless necessary.

### 4.3 Code

- Standalone components; strict TypeScript.
- ESLint + Prettier + Stylelint clean (`max-warnings=0` on staged files).
- Conventional commits (commitlint).
- No unexplained `any` in feature code.
- Do not store tokens in `localStorage` unless consciously decided with a threat model.

### 4.4 Tests

| Level | Tool | Minimum |
|-------|------|---------|
| Unit / component | Vitest | Auth store, feature stores, pure utils, critical pipes |
| Component a11y | Vitest + testing-library (if used) | Form labels, dialog open/close focus |
| E2E | Playwright | Login, create project, create task, change status, comment |
| CI | Existing pipeline | lint, typecheck, unit, build; e2e on PRs when feasible |

### 4.5 Performance

- Lazy-load feature routes.
- `track` / trackBy for board and list rows.
- Do not import all helm entry points globally — import per feature.
- Avatars/images: sized correctly, lazy-loaded.

### 4.6 Client security

- XSS: do not render API HTML without sanitization (description/comments — plain text or safe markdown).
- CSRF: refresh/logout aligned with backend Origin allow-list.
- Never log tokens in production consoles.

---

## 5. Definition of Done (any user-facing feature)

1. Meets acceptance criteria in this document / the feature spec.
2. UI uses spartan/helm (no new Material APIs).
3. Loading / empty / error states covered.
4. Keyboard + basic axe pass on changed screens.
5. Unit tests for new business logic; E2E if the feature introduces a new happy path.
6. `lint`, `typecheck`, and `test:ci` are green.
7. No auth regression (refresh / logout).

---

## 6. Useful commands

```bash
# Dev
npm start
# or
docker compose up --build

# Quality
npm run lint
npm run lint:styles
npm run typecheck
npm run test:ci
npm run e2e
npm run build

# Spartan: add a component
npx ng g @spartan-ng/cli:ui
```

---

## 7. References

- Backend API / Swagger: `https://management-app-backend-qs3u.onrender.com/api-docs`
- Backend repo: https://github.com/anton-sobolevskyi/management_app_backend
- spartan docs: https://spartan.ng/documentation/installation
- Tailwind v4 + PostCSS: https://tailwindcss.com/docs/installation/using-postcss
- WCAG 2.2: https://www.w3.org/TR/WCAG22/

---

*Last updated: 2026-10-22 — Phase 0.1 API foundation implemented on branch `feature/api-foundation`.*
