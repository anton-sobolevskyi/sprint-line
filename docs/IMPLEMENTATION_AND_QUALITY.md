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
| 0–6 | **Done** |
| 7 Attachments | **Done** (`feature/attachments-phase-7`) |
| 8 Dashboard & polish | **Next** |

### Phase 7 — Attachments

| Capability | Notes |
|------------|--------|
| List | `GET /tasks/:taskId/attachments` |
| Upload | `POST` multipart `file` |
| Download | `GET /attachments/:id/download` → presigned URL |
| Delete | `DELETE /attachments/:id` (uploader) |
| Comment upload | API wired in `AttachmentsApiService` (UI optional later) |

UI: **Files** on task card → `sl-task-attachments-panel`.

---

## Definition of Done

1. Acceptance criteria met  
2. Spartan/helm only  
3. Loading / empty / error states  
4. Endpoints & copy via constants  
5. Types match OpenAPI schema  

---

*Last updated: 2026-10-23 — Phase 7 attachments on `feature/attachments-phase-7`.*
