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
| Confirms | `ConfirmDialogService` |
| Toasts | `appToast` + root `<hlm-toaster />` |

---

## Phase status

| Phase | Status |
|-------|--------|
| 0–8 Core product | **Done** |
| Improve: confirm + toasts | **Done** |
| Task detail | **Done** (`feat/task-detail`) |
| Next | Board filters / DnD (optional) |

### Task detail

- Route: `/projects/:projectId/tasks/:taskId`
- Edit: title, description, status, priority, due date, assignee
- Comments + files panels
- Soft-delete with confirm
- Board title links into detail

---

## Definition of Done

1. Acceptance criteria met  
2. Spartan/helm only  
3. Loading / empty / error states  
4. Endpoints & copy via constants  
5. Signal Forms + Zod where forms exist  
6. Types match OpenAPI schema  
7. Destructive actions use accessible confirm dialogs  

---

*Last updated: 2026-10-23 — task detail surface.*
