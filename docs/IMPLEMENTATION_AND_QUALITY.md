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
| 0 Foundation | Done (Sonner optional) |
| 1 Auth | **Done** |
| 2 Profile | **Done** |
| 3 Projects | **Done** |
| 4 Members | **Done** |
| 5 Tasks / board | **Done** |
| 6 Comments | **Done** |
| 7 Attachments | **Done** |
| 8 Dashboard & polish | **Done** (`feature/dashboard-phase-8`) |

### Phase 8 — Dashboard & polish

| Item | Notes |
|------|--------|
| App shell | Sticky header: Home · Projects · Profile · Sign out |
| Nested routes | Authenticated pages under `AppShellLayout` |
| Dashboard | Greeting, project count, quick actions, recent projects |
| Empty / error | Loading, retry, empty workspace CTA |

Auth pages (login, register, password reset, verify) stay full-screen without the shell.

---

## Definition of Done

1. Acceptance criteria met  
2. Spartan/helm only  
3. Loading / empty / error states  
4. Endpoints & copy via constants  
5. Signal Forms + Zod where forms exist  
6. Types match OpenAPI schema  

---

*Last updated: 2026-10-23 — Phase 8 dashboard & shell complete.*
