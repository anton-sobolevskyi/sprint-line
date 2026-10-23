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
| OpenAPI | generated schema → `src/types/api.schema.d.ts` |
| Confirms | `ConfirmDialogService` |
| Toasts | `appToast` + root `<hlm-toaster />` |

---

## Phase status

| Phase | Status |
|-------|--------|
| 0–8 Core product | **Done** |
| Confirm + toasts | **Done** |
| Task detail | **Done** |
| Board filters | **Done** (`feat/board-filters`) |
| Next (optional) | Drag-and-drop status, SignalStores, e2e |

### Board filters

Server-side via `GET /projects/:id/tasks`:

| Filter | Query param |
|--------|-------------|
| Search | `q` |
| Assigned to me | `assignedToId` = current user |
| Overdue only | `dueBefore` = now (ISO) |

UI: Apply / Clear. Cards show due date (destructive style when overdue).

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

*Last updated: 2026-10-23 — board filters.*
