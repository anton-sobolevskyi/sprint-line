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
| OpenAPI types | `src/core/api/generated/schema.d.ts` (generated) → re-exported as `src/types/api.schema.d.ts` |

---

## OpenAPI schema notes (2026-10-22)

Regenerated schema on `feature/projects-phase-3` (`src/core/api/generated/schema.d.ts`).

### Breaking / important changes vs previous frontend assumptions

| Endpoint | Change | Frontend impact |
|----------|--------|-----------------|
| `GET /projects` | Response is **`PaginatedProjectResponseDto`** `{ data, meta }`, not a bare array | `ProjectsApiService.findAll` + list page updated |
| `GET /projects` query | Optional `page`, `limit` | Passed as `HttpParams` |
| Members list | `PaginatedProjectMemberResponseDto` | Use in Phase 4 |
| Tasks / comments lists | Paginated wrappers | Use in Phase 5–6 |
| `GET /attachments/{id}/download` | Signed URL (`DownloadUrlResponseDto`) | Path already correct in `API_ENDPOINTS` |
| Avatar upload | `POST /users/avatar`, multipart field **`file`** | Unchanged |

### Pagination meta shape

```ts
PaginationMetaDto: { total, page, limit, totalPages }
```

### Project list payload notes

- Each project may include up to **20** `members` plus **`memberCount`**.
- Full member list: `GET /projects/{projectId}/members` (paginated).

### After regenerating schema

1. Overwrite `src/core/api/generated/schema.d.ts` from backend OpenAPI (`openapi-typescript`).
2. Keep `src/types/api.schema.d.ts` as `export type * from '../core/api/generated/schema'`.
3. Fix any TypeScript errors in API services / pages.

---

## Phase status

### Phase 0 — Foundation

| Step | Status |
|------|--------|
| 0.1 API client + interceptors | **Done** |
| 0.2 OpenAPI types | **Done** (generated + re-export) |
| 0.3 Global Sonner toast | Pending |
| 0.4 Design tokens (status/priority) | Partial |
| 0.5 Helm aliases | **Done** |

### Phase 1 — Authentication — **Done**

Login / register (Signal Forms + Zod), auth store, guards, session restore, logout.

### Phase 2 — Profile — **Done**

`/profile`, password change (re-login), avatar, delete account, NgRx `user` feature.

### Phase 3 — Projects — **Done** (aligned with paginated schema)

| Item | Status |
|------|--------|
| 3.1 Projects list | **Done** (`data` + `meta`) |
| 3.2 Create project | **Done** |
| 3.3 Project hub shell `/projects/:id` | **Done** |
| 3.4 Update / soft-delete | **Done** |
| 3.5 Empty / loading / error states | **Done** |
| List UI pagination controls | Optional follow-up (API ready) |

### Phase 4 — Members — **Next**

Invite, roles, remove, transfer ownership — use `PaginatedProjectMemberResponseDto`.

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

*Last updated: 2026-10-22 — schema pagination alignment on `feature/projects-phase-3`.*
