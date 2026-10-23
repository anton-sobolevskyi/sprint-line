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
| OpenAPI types | `src/core/api/generated/schema.d.ts` → `src/types/api.schema.d.ts` |

---

## Phase status

| Phase | Status |
|-------|--------|
| 0 Foundation | Mostly done (Sonner pending) |
| 1 Auth (+ email verify / password reset) | **Done** |
| 2 Profile | **Done** |
| 3 Projects | **Done** |
| 4 Members | **Done** (`feature/members-phase-4`) |
| 5 Tasks / board | **Next** |
| 6 Comments | Pending |
| 7 Attachments | Pending |
| 8 Dashboard & polish | Pending |

### Phase 4 — Members (delivered)

| Capability | Notes |
|------------|--------|
| List | `GET /projects/:id/members` → `PaginatedProjectMemberResponseDto` |
| Invite | email + role `MEMBER` \| `ADMIN` (Signal Forms + Zod) |
| Change role | `PATCH .../members/:userId` |
| Remove / leave | `DELETE .../members/:userId` |
| Transfer ownership | `POST .../transfer-ownership` (OWNER only) |

UI: `sl-project-members-panel` on project detail. Permissions derived from current user’s membership role.

---

## OpenAPI notes (recent)

- Projects & members lists are **paginated** (`data` + `meta`).
- Auth: forgot / reset / verify / resend verification.
- `UserResponseDto.emailVerifiedAt`.

---

## Definition of Done

1. Acceptance criteria met  
2. Spartan/helm only  
3. Loading / empty / error states  
4. Keyboard + basic a11y  
5. `lint` / `typecheck` / `test:ci`  
6. Auth/session safe  
7. Endpoints & copy via constants  
8. Signal Forms + Zod; invalid submit disabled  
9. Types match OpenAPI schema  

---

*Last updated: 2026-10-23 — Phase 4 members on `feature/members-phase-4`.*
