# SprintLine — Implementation Guide & Quality Requirements

Step-by-step frontend plan for [management_app_backend](https://github.com/anton-sobolevskyi/management_app_backend).

**Stack:** Angular 22 · spartan-ng · Tailwind v4 · NgRx · Zod · Signal Forms · openapi-typescript  
**a11y target:** WCAG 2.2 AA

---

## Conventions

| Concern | Approach |
|---------|----------|
| Global state | `@ngrx/store` (auth, current user) |
| Feature data | `@ngrx/signals` `signalStore` (tasks, members) |
| Local / UI state | component signals (forms, expand panels) |
| Forms | Signal Forms + Zod |
| Endpoints | `API_PATHS` / `API_ENDPOINTS` (`as const`) |
| Copy | `*.messages.ts` (`as const`) |
| Confirms | `ConfirmDialogService` |
| Toasts | `appToast` + root `<hlm-toaster />` |
| Theme | `ThemeService` + `localStorage` (`sprintline-theme`) |

---

## Phase status

| Phase | Status |
|-------|--------|
| 0–8 product features | **Done** |
| Feature SignalStores (tasks, members) | **Done** |
| UI brand + shell + dark mode | **Done** |
| Board UX (filters, quick-add, slim cards) | **Done** |
| Shell project context + recent projects | **Done** |
| Next (optional) | Authenticated Playwright e2e · Helm Select forms |

See README **UI design system** for tokens and patterns.

### Feature SignalStores

| Store | Scope | Responsibilities |
|-------|--------|------------------|
| `ProjectTasksStore` | board panel (`providers`) | tasks, filters, create, `createInColumn`, status, delete |
| `ProjectMembersStore` | members panel (`providers`) | members, invite, role, remove, transfer |

UI-only state (create form, draft filters, quick-add draft) stays on the component.

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

*Last updated: 2026-10-24 — UI refresh, shell recent projects.*
