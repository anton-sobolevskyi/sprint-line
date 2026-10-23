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
| OpenAPI types | `src/core/api/generated/schema.d.ts` → re-exported as `src/types/api.schema.d.ts` |

---

## OpenAPI schema notes

**Source of truth:** `src/core/api/generated/schema.d.ts`  
**App imports:** `import type { components } from '.../types/api.schema'`

### 2026-10-23 update

| Area | Change | Frontend |
|------|--------|----------|
| Auth | `POST /auth/forgot-password` (always 204) | `AuthApiService.forgotPassword`, `/forgot-password` |
| Auth | `POST /auth/reset-password` (`token` + `newPassword`, 204) | `/reset-password?token=` |
| Auth | `POST /auth/verify-email` (`token`, 204) | `/verify-email?token=` |
| Auth | `POST /auth/resend-verification` (auth required, 204) | Profile resend button |
| User | `UserResponseDto.emailVerifiedAt?: string \| null` | Profile verified status |
| Projects | List remains `PaginatedProjectResponseDto` | Already aligned |
| Projects | `memberCount` + members cap (20 list / 100 detail) | Docs only |

**Public auth paths** (no 401 refresh loop): register, login, refresh, logout, forgot-password, reset-password, verify-email.  
**Not public:** `resend-verification` (needs Bearer).

Email reset/verify links are expected as `?token=` query params.

### 2026-10-22 update

| Endpoint | Change |
|----------|--------|
| `GET /projects` | `{ data, meta }` + optional `page` / `limit` |
| Members / tasks / comments lists | Paginated wrappers |

### After regenerating schema

1. Replace `src/core/api/generated/schema.d.ts`.
2. Keep `src/types/api.schema.d.ts` as `export * from '../core/api/generated/schema'`.
3. Fix TypeScript in API services and pages.

---

## Phase status

### Phase 0 — Foundation

| Step | Status |
|------|--------|
| 0.1 API client + interceptors | **Done** |
| 0.2 OpenAPI types | **Done** |
| 0.3 Global Sonner toast | Pending |
| 0.4 Design tokens | Partial |
| 0.5 Helm aliases | **Done** |

### Phase 1 — Authentication — **Done** (+ email flows)

Login, register, guards, session restore, logout, **forgot / reset / verify email**.

### Phase 2 — Profile — **Done**

Account details, password change, avatar, delete, **emailVerifiedAt + resend**.

### Phase 3 — Projects — **Done**

List (paginated), create, detail settings, soft-delete.

### Phase 4 — Members — **Next**

Invite, roles, remove, transfer — `PaginatedProjectMemberResponseDto`.

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
10. Types match current OpenAPI schema  

---

## Commands

```bash
npm start
npm run lint && npm run typecheck && npm run test:ci
```

---

*Last updated: 2026-10-23 — email verification & password-reset flows aligned with API schema on `feature/projects-phase-3`.*
