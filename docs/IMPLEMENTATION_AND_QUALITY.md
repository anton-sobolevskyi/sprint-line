# SprintLine — Implementation Guide & Quality Requirements

Step-by-step frontend plan for [management_app_backend](https://github.com/anton-sobolevskyi/management_app_backend).

**Stack:** Angular 22 · spartan-ng · Tailwind v4 · NgRx · Zod · Signal Forms · openapi-typescript  
**a11y target:** WCAG 2.2 AA

---

## Conventions

| Concern | Approach |
|---------|----------|
| Global state | `@ngrx/store` (auth, current user, …) |
| Local / UI state | SignalStore or component signals |
| Forms | Signal Forms + Zod (`validateStandardSchema`) |
| Submit buttons | Disabled when `form().invalid()` or request in flight |
| Endpoints | `API_PATHS` / `API_ENDPOINTS` (`as const`) |
| Copy | `*.messages.ts` (`as const`, i18n-ready) |

---

## Phase status

### Phase 0 — Foundation

| Step | Status |
|------|--------|
| 0.1 API client + interceptors | **Done** |
| 0.2 OpenAPI types | **Done** |
| 0.3 Global Sonner toast | Pending |
| 0.4 Design tokens (status/priority) | Partial |
| 0.5 Helm aliases | **Done** |

### Phase 1 — Authentication — **Done** (merged to `main`)

Login / register (Signal Forms + Zod), auth store, guards, session restore, logout.

### Phase 2 — Profile — **Done** (`feature/profile-phase-2`)

| Item | Status |
|------|--------|
| `/profile` name & email | **Done** |
| Change password → re-login | **Done** |
| Avatar upload (`file` multipart) | **Done** |
| Delete account + 409 messaging | **Done** |
| NgRx `user` feature + effects | **Done** |

### Phase 3 — Projects — **Done** (`feature/projects-phase-3`)

| Item | Status |
|------|--------|
| 3.1 Projects list | **Done** (`/projects`) |
| 3.2 Create project | **Done** (inline form) |
| 3.3 Project hub shell `/projects/:id` | **Done** (settings + hub hint) |
| 3.4 Update / soft-delete | **Done** |
| 3.5 Empty / loading / error states | **Done** |

Key paths: `src/app/core/projects/`, `src/app/features/projects/`.

### Phase 4 — Members — **Next**

Invite, roles, remove, transfer ownership.

### Later

5 Tasks / board · 6 Comments · 7 Attachments · 8 Dashboard & polish

---

## Definition of Done

1. Acceptance criteria met  
2. Spartan/helm only  
3. Loading / empty / error states  
4. Keyboard + basic a11y  
5. Tests where practical  
6. `lint` / `typecheck` / `test:ci`  
7. Auth/session safe  
8. Endpoints & copy via constants  
9. Signal Forms + Zod; invalid submit disabled  

---

## Commands

```bash
npm start
npm run lint && npm run typecheck && npm run test:ci
```

---

*Last updated: 2026-10-22 — Phase 3 projects on `feature/projects-phase-3` (includes Phase 2).*|
