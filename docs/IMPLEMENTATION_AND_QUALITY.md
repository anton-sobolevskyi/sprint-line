# SprintLine — Implementation Guide & Quality Requirements

Step-by-step frontend plan for [management_app_backend](https://github.com/anton-sobolevskyi/management_app_backend).

**Stack:** Angular 22 · spartan-ng · Tailwind v4 · NgRx · Zod · Signal Forms · openapi-typescript  
**a11y target:** WCAG 2.2 AA

---

## Conventions

| Concern | Approach |
|---------|----------|
| Global state | `@ngrx/store` |
| Local / UI state | component signals |
| Forms | Signal Forms + Zod |
| Endpoints | `API_PATHS` / `API_ENDPOINTS` (`as const`) |
| Copy | `*.messages.ts` (`as const`) |
| OpenAPI | `src/core/api/generated/schema.d.ts` → `src/types/api.schema.d.ts` |

---

## Phase status

| Phase | Status |
|-------|--------|
| 0–5 | **Done** |
| 6 Comments | **Done** (`feature/comments-phase-6`) |
| 7 Attachments | **Next** |
| 8 Dashboard & polish | Pending |

### Phase 6 — Comments

| Capability | Notes |
|------------|--------|
| List | `GET /tasks/:taskId/comments` paginated |
| Create | `POST` with `content` |
| Update | `PATCH /comments/:id` (author) |
| Soft-delete | `DELETE /comments/:id` (author) |

UI: expand **Comments** on a task card → `sl-task-comments-panel`.

---

## Definition of Done

1. Acceptance criteria met  
2. Spartan/helm only  
3. Loading / empty / error states  
4. Endpoints & copy via constants  
5. Signal Forms + Zod; invalid submit disabled  
6. Types match OpenAPI schema  

---

*Last updated: 2026-10-23 — Phase 6 comments on `feature/comments-phase-6`.*
