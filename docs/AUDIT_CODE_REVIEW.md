# Audit code-review baseline — 2026-10-30

Static review of `main` (+ hardening on `chore/audit-p0-hardening`).  
**Not a substitute for Lighthouse / axe lab runs** — those still need Phase 0 measurement.

## Already in good shape (helps pass AUDIT.MD)

| Area | Evidence |
|------|----------|
| Lazy routes | `app.routes.ts` — all feature screens use `loadComponent` |
| Auth model | Access token in NgRx memory (`auth.reducer`); refresh via `withCredentials` cookie (`Session.refresh`) |
| Session restore | `provideAppInitializer(restoreAuthSession)` in `app.config.ts` |
| Theme FOUC | Inline boot script in `index.html` + `Theme` service + `STORAGE_KEY` |
| Login a11y | Labels, `autocomplete`, `aria-invalid`, `aria-describedby`, `role="alert"` errors |
| Skeletons / CLS hygiene | Home + project detail use `hlmSkeleton` + `aria-busy` while loading |
| Command palette | Dialog + `aria-modal`, search label, `role="listbox"` / `option` |
| Functional guards | `authGuard` / `guestGuard` |
| Production HSTS | Present on `https://sprint-line.onrender.com/` (Cloudflare edge) |
| Bundle budgets | `angular.json` initial warn 500 kB / error 1 MB |

## Changes in this PR

1. **Security headers (Docker nginx)** — HSTS, CSP, Permissions-Policy (plus existing nosniff / XFO / Referrer).
2. **Security headers (Render static)** — same policy family via `render.yaml` `headers`.
3. **Sidebar trigger/rail** — explicit `aria-label` (`messages.sidebarToggle`).
4. **Auth copy** — clearer password show/hide strings; fixed a few "Dialog …" typos → "Confirm …".

## Remaining gaps (need measurement or more work)

### Must measure (lab)

- LCP / CLS / TBT / Performance score on warm prod + local production build  
- axe-core on `/login`, `/`, `/projects/:id`, task detail  
- Console errors on production build  
- Bundle composition (Spartan / icons / charts vs app code)

### Likely follow-ups

| Item | Severity | Notes |
|------|----------|-------|
| CSP uses `'unsafe-inline'` for script/style | P1 residual | Needed for theme boot script + Angular styles until nonces |
| Confirm Spartan `hlmSidebarTrigger` exposes name to AT | P1 | We set `aria-label`; verify in axe after deploy |
| DnD board keyboard alternative | P1/P2 | Documented in AUDIT.MD extras |
| Offline / API-down UX | P1 | Distinct from empty states |
| Playwright + axe in CI | process | Make re-audit cheap |
| Zoneless migration | P1/P2 | Confirm whether `zone.js` is still in the client bundle |
| OpenAPI type drift check | P2 | `mise run fetch-openapi` in CI |

## Production header snapshot (before this deploy)

```
strict-transport-security: max-age=315360000; includeSubdomains; preload
x-content-type-options: nosniff
```

Missing on edge at review time: `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` (addressed in `render.yaml` for next deploy from this branch/main).

## Suggested next PR order

1. Merge this hardening PR and redeploy Render → re-check response headers.  
2. Run Lighthouse + axe; file defects with evidence into issues.  
3. CLS/LCP fixes only where metrics fail.  
4. Add Playwright smoke + `@axe-core/playwright` on login + one authenticated shell route.
