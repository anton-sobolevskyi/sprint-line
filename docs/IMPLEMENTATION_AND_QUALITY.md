# SprintLine — Implementation Guide & Quality Requirements

Step-by-step frontend implementation plan based on the [management_app_backend](https://github.com/anton-sobolevskyi/management_app_backend) API, plus quality requirements (UX, accessibility, code, tests).

**UI stack:** Angular 22 · spartan-ng (brain + helm) · Tailwind CSS v4 · NgRx · Zod · openapi-typescript · Signal Forms  
**Accessibility target:** WCAG 2.2 Level AA

---

## Conventions (project-wide)

| Concern | Approach |
|---------|----------|
| Global state | `@ngrx/store` feature reducers (auth, current user, …) |
| Local / UI state | `@ngrx/signals` SignalStore or component signals |
| Forms | **Signal Forms** (`form()`, `[formField]`) + **Zod** via `validateStandardSchema` |
| Submit buttons | Disabled while `form().invalid()` or request in flight |
| API paths / URLs | `API_PATHS` / `API_ENDPOINTS` (`as const`); URL in a local `const` before `http.*` |
| User-visible strings | `*.messages.ts` with `as const` (i18n-ready) |

---

## Phase status

### Phase 0 — Foundation

| Step | Status |
|------|--------|
| 0.1 API client + interceptors | **Done** |
| 0.2 OpenAPI types | **Done** |
| 0.3 App shell + global Sonner | Partial (routes exist; Sonner pending) |
| 0.4 Design tokens | Partial |
| 0.5 Helm path aliases | **Done** |

### Phase 1 — Authentication — **Done**

| Step | Status |
|------|--------|
| Login / register (Signal Forms + Zod) | **Done** |
| Global auth NgRx store + interceptor | **Done** |
| `authGuard` / `guestGuard` | **Done** |
| Logout + session restore on bootstrap | **Done** |

Key paths: `src/app/features/auth/`, `src/app/core/auth/`.

### Phase 2 — Profile — **Done** (`feature/profile-phase-2`)

| Step | Status |
|------|--------|
| 2.1 `/profile` — name, email | **Done** |
| 2.2 Change password | **Done** (then re-login) |
| 2.3 Avatar upload | **Done** (`POST /users/avatar`) |
| 2.4 Delete account | **Done** (confirm + 409 handling via API message) |

#### Delivered files

| File | Role |
|------|------|
| `src/app/core/api/api-endpoints.ts` | `users.*`, attachment download URL helper |
| `src/app/core/users/users-api.service.ts` | HTTP for me / password / avatar / delete |
| `src/app/core/users/user.actions.ts` | NgRx actions |
| `src/app/core/users/user.reducer.ts` | Global `currentUser` feature |
| `src/app/core/users/user.effects.ts` | `loadMe` effect |
| `src/app/features/profile/*` | Page, messages, Zod schemas |

**Behaviour:**

- Profile details & password use Signal Forms + Zod; submit disabled when invalid.
- Password change clears session and navigates to `/login` (backend revokes refresh tokens).
- Delete uses `confirm()`; API errors (e.g. sole OWNER 409) surface via `getApiErrorMessage`.
- Avatar: multipart `file` field; then `UserActions.loadMe`.

### Phase 3 — Projects — **Next**

| Step | Work |
|------|------|
| 3.1 | Projects list |
| 3.2 | Create project |
| 3.3 | Project hub `/projects/:id` |
| 3.4 | Update / soft-delete |
| 3.5 | Empty states |

### Later phases

4 Members · 5 Tasks / board · 6 Comments · 7 Attachments · 8 Dashboard & polish

---

## Architecture snapshot

```text
src/app/
  core/
    api/          # endpoints, errors
    auth/         # global auth store, interceptors, guards
    users/        # global current user store + API
    http/
    messages/
  features/
    auth/
    profile/
    home/
```

---

## Definition of Done

1. Acceptance criteria met  
2. Spartan/helm only (no new Material)  
3. Loading / empty / error states  
4. Keyboard + basic a11y  
5. Tests for new business logic where practical  
6. `lint` / `typecheck` / `test:ci` green  
7. Auth/session safe  
8. Endpoints & copy via `as const` maps  
9. Forms: Signal Forms + Zod; invalid submit disabled  

---

## Commands

```bash
npm start
npm run lint && npm run typecheck && npm run test:ci
npm run build
```

---

## References

- Backend: https://github.com/anton-sobolevskyi/management_app_backend  
- Swagger: `https://management-app-backend-qs3u.onrender.com/api-docs`  
- Signal Forms + Zod: https://angular.dev/guide/forms/signals/validation  
- WCAG 2.2: https://www.w3.org/TR/WCAG22/  

---

*Last updated: 2026-10-22 — Phase 2 profile on branch `feature/profile-phase-2`.*
