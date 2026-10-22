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
| 0.1 | API client: `environment.apiUrl`, interceptors (Bearer, refresh cookie, 401) | **Done** | `src/app/core/` |
| 0.2 | OpenAPI types | Done | `src/types/api.schema.d.ts` |
| 0.3 | App shell: layout, global error toast (Sonner) | Partial | Router outlet + auth pages; Sonner still pending |
| 0.4 | Design tokens: task status, priority colors | Partial | Theme variables in `styles.scss` |
| 0.5 | Path alias `@spartan-ng/helm` → `libs/ui` | Done | `tsconfig.json` |

### Phase 1 — Authentication — **Done** (`feature/auth-phase-1`)

| Step | Screens / logic | Status |
|------|-----------------|--------|
| 1.1 | `/login`, `/register` | **Done** |
| 1.2 | Wire UI to global auth store + `AuthApiService` | **Done** |
| 1.3 | Guards: `authGuard` / `guestGuard` | **Done** |
| 1.4 | Logout + session restore on bootstrap | **Done** |

#### Delivered files

| File | Responsibility |
|------|----------------|
| `src/app/features/auth/auth.messages.ts` | All auth UI copy (`as const`, i18n-ready) |
| `src/app/features/auth/auth.validators.ts` | Shared validators + error key helper |
| `src/app/features/auth/login/*` | Login page (helm card/field/input/button) |
| `src/app/features/auth/register/*` | Register page |
| `src/app/features/home/*` | Placeholder home + logout |
| `src/app/core/auth/auth.guards.ts` | `authGuard`, `guestGuard` |
| `src/app/core/auth/auth-initializer.ts` | `restoreAuthSession` via `/auth/refresh` |
| `src/app/app.routes.ts` | Lazy routes + guards |
| `src/index.html` | Root host fixed to `sl-root` |

**Behaviour:**

- Client validation: email; password 8+ (register also letter + number).
- Server errors via `getApiErrorMessage` + `role="alert"`.
- Labels, `aria-invalid`, `aria-describedby` on fields.
- Access token only in NgRx store; refresh cookie restored on app init.
- Logout clears local session even if the HTTP call fails.

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
    core/
      api/            # endpoints, error helpers
      auth/           # global NgRx auth feature + session/API services
      http/           # interceptors
      messages/       # shared user-facing strings (i18n-ready)
    shared/           # pipes, ui wrappers, utils
    features/
      auth/           # screens + auth.messages.ts
      home/
      profile/
      projects/
      tasks/
      members/
  libs/ui/            # spartan helm (owned styles)
  types/              # OpenAPI + env
```

### State & data

- **Global state:** `@ngrx/store` — e.g. auth session.
- **Local / feature UI state:** `@ngrx/signals` SignalStore when needed; simple component signals OK for one-off form flags.
- **Auth token:** NgRx auth store only; refresh via HttpOnly cookie; session restore on bootstrap.
- **Endpoints:** `API_PATHS` + `API_ENDPOINTS` (`as const`).
- **Copy:** `*.messages.ts` with `as const` for future i18n.

### UI

- Interactive components: **spartan brain + helm**.
- Toasts: Sonner (helm) — still to wire globally.
- Destructive actions: Alert Dialog with the entity name stated clearly.

---

## 4. Quality requirements

(See previous sections — unchanged.)

### Definition of Done (any user-facing feature)

1. Meets acceptance criteria in this document / the feature spec.
2. UI uses spartan/helm (no new Material APIs).
3. Loading / empty / error states covered.
4. Keyboard + basic axe pass on changed screens.
5. Unit tests for new business logic; E2E if the feature introduces a new happy path.
6. `lint`, `typecheck`, and `test:ci` are green.
7. No auth regression (refresh / logout).
8. New endpoints/strings follow `as const` maps (no raw URL/copy in call sites).

---

## 5. Useful commands

```bash
npm start
npm run lint && npm run typecheck && npm run test:ci
npm run build
```

---

## 6. References

- Backend API / Swagger: `https://management-app-backend-qs3u.onrender.com/api-docs`
- Backend repo: https://github.com/anton-sobolevskyi/management_app_backend
- spartan docs: https://spartan.ng/documentation/installation
- WCAG 2.2: https://www.w3.org/TR/WCAG22/

---

*Last updated: 2026-10-22 — Phase 1 authentication implemented on branch `feature/auth-phase-1`.*
