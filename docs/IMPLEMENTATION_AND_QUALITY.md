# SprintLine — Implementation Guide & Quality Requirements

Step-by-step frontend plan for [management_app_backend](https://github.com/anton-sobolevskyi/management_app_backend).

**Stack:** Angular 22 · spartan-ng · Tailwind v4 · NgRx · Zod · Signal Forms · openapi-typescript  
**a11y target:** WCAG 2.2 AA

---

## Conventions

| Concern | Approach |
|---------|----------|
| Global state | `@ngrx/store` |
| Local / UI state | component signals / SignalStore |
| Forms | Signal Forms + Zod |
| Endpoints | `API_PATHS` / `API_ENDPOINTS` (`as const`) |
| Copy | `*.messages.ts` (`as const`) |
| OpenAPI | `src/core/api/generated/schema.d.ts` → `src/types/api.schema.d.ts` |

---

## Phase status

| Phase | Status |
|-------|--------|
| 0 Foundation | Mostly done (Sonner pending) |
| 1 Auth | **Done** |
| 2 Profile | **Done** |
| 3 Projects | **Done** |
| 4 Members | **Done** |
| 5 Tasks / board | **Done** (`feature/tasks-phase-5`) |
| 6 Comments | **Next** |
| 7 Attachments | Pending |
| 8 Dashboard & polish | Pending |

### Phase 5 — Tasks / board

| Capability | Notes |
|------------|--------|
| List | `GET /projects/:id/tasks` → `PaginatedTaskResponseDto` |
| Create | title, optional description, priority |
| Board | Columns: TODO → IN_PROGRESS → IN_REVIEW → DONE |
| Status update | `PATCH /tasks/:id` |
| Soft-delete | `DELETE /tasks/:id` |

UI: `sl-project-tasks-board-panel` on project detail.

Filters (`status`, `q`, assignee, due dates) are supported in `TasksApiService` for later UI.

---

## Definition of Done

1. Acceptance criteria met  
2. Spartan/helm only  
3. Loading / empty / error states  
4. Endpoints & copy via constants  
5. Signal Forms + Zod; invalid submit disabled  
6. Types match OpenAPI schema  

---

*Last updated: 2026-10-23 — Phase 5 tasks board on `feature/tasks-phase-5`.*
