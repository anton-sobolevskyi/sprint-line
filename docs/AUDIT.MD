# Quality Audit — SprintLine

---

## 1. Application context (fill in before handing over)

| Field | Value |
|---|---|
| Application name | SprintLine |
| Production URL | https://sprint-line.onrender.com/ |
| Hosting | Render (free tier — container sleeps after ~15 min idle) |
| Repository | https://github.com/anton-sobolevskyi/sprint-line |
| Angular version | 22.2.x (`@angular/core` ^22.2.0) |
| Change detection mode | Check for zoneless (`provideExperimentalZonelessChangeDetection` / absence of `zone.js` in bundle). Expected: zoneless or zone.js still present. |
| UI library | Tailwind CSS 4 + Spartan / Helm (`libs/ui`, `@spartan-ng/brain`) |
| State management | NgRx Store + Effects (auth / current user) + NgRx Signal Stores (`ProjectTasksStore`, `ProjectMembersStore`, …) |
| SSR / prerender | No (SPA, static build → nginx / Render static) |
| Test account (email) | `alice@example.com` *(replace with a real non-destructive account)* |
| Test password | *(do not commit real password; keep only in secure notes)* |
| Test account role | Regular member of at least one project (prefer non-owner) |
| Routes to audit | See list below |
| Audit date | 2026-10-30 |

### Real routes to audit

**Guest (public):**
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/not-found`

**Authenticated (behind `authGuard` + `MainLayout`):**
- `/` (Home dashboard — assigned work, due dates, recent projects)
- `/profile`
- `/projects` (projects list)
- `/projects/:id` (project detail — board + list views, members, settings)
- `/projects/:id/tasks/:taskId` (task detail — comments, attachments, status/priority)

### Access constraints

- Keep the account **read-only where possible**: do not delete projects/tasks/users, do not transfer ownership, do not change roles of other members, do not send real invitations, do not upload large files permanently.
- Allowed: sign in, navigate, open modals/dialogs, validate forms without submitting real destructive data, toggle filters (assigned to me / overdue / search), switch board ↔ list view, open command palette (`⌘K` / `Ctrl+K`), switch theme (light / dark / system), open task detail, expand comments.
- If a check requires a destructive action (delete task, remove member, transfer ownership), mark it as **"requires manual verification"** and describe the expected behaviour instead of performing it.
- Do **not** publish the test credentials in the report and do not quote the password.

---

## 2. Role and goal

You are a senior frontend auditor specialising in Angular (v17+ / v22), web performance, accessibility and modern SPA architecture. Your goal is to give the engineering team a **prioritised list of defects with evidence** (metric, screenshot, code fragment, axe rule name, network request) — not generic advice.

Working rules:

1. Back every claim with **evidence**: metric value, axe rule, HTTP header, code fragment, or exact reproduction steps.
2. If something cannot be checked (cold start only, no repo access for a specific file, field data missing), write `NOT VERIFIED` and state exactly what is needed.
3. Never invent numbers. If you did not measure a metric, do not report one.
4. Distinguish **lab** (Lighthouse / Playwright) from **field** (CrUX / RUM) metrics.
5. Facts first, interpretation second. Recommendations must name a concrete API, config, or file.

---

## 3. Method (follow this order)

### Stage 0. Environment setup

1. Warm up the instance:
   ```bash
   curl -s -o /dev/null -w '%{http_code} %{time_total}\n' https://sprint-line.onrender.com/
   ```
   Repeat until a stable 200. Record cold-start duration separately (infrastructure risk, not a code defect).
2. Prefer measuring against a **warmed instance** or a **local production build** (`npm run build` + static server / `npx serve dist/sprint-line/browser`).
3. Record measurement setup: browser + version, desktop/mobile, CPU throttling, network throttling, run count (min. 3, use median).

### Stage 1. Technical profile (unauthenticated)

- `view-source` / `curl` the root: empty shell (SPA) or any server-rendered content?
- Response headers: `Content-Encoding`, `Cache-Control`, `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options` / `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`.
- Stack detection: presence of `zone.js` in the main bundle, Angular version (`ng-version` attribute), Spartan/Helm markers, Tailwind.
- List every JS/CSS chunk with transfer size + parsed size, load order, and any `preload` / `modulepreload` / `prefetch`.

### Stage 2. Lighthouse (lab metrics)

- Chrome DevTools → Lighthouse: **mobile** (Moto G Power, Slow 4G) and **desktop**, ≥ 3 runs each.
- Record: LCP (and the LCP element), CLS (and shifting elements), TBT, TTFB, Speed Index, initial JS transfer, `unused-javascript` per chunk.
- Repeat for key authenticated routes (Home, Project board, Task detail) after sign-in.

### Stage 3. Authenticated audit (Playwright or manual + DevTools)

- Sign in with the test account.
- Visit every route listed in Section 1.
- Per route record: LCP, CLS, long tasks (> 50 ms), DOM node count, request count, total transfer size.
- Perform one real interaction (e.g. open task, change filter, open command palette) and note response latency (lab INP estimate).
- Run **axe-core** with tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`. Collect `id`, `impact`, `nodes.target`, `failureSummary`.

### Stage 4. Manual checks (mandatory) — SprintLine-specific

**Keyboard & focus**
- Tab / Shift+Tab through login → home → projects → board → task detail.
- Visible focus indicator on every interactive element (especially Spartan components and icon buttons).
- Focus trap inside dialogs/modals; Escape closes them.
- Command palette (`⌘K` / `Ctrl+K`): opens, focuses search, Arrow keys navigate, Enter selects, Escape closes, focus returns correctly.
- Skip link (if present) or landmark navigation.

**Screen reader**
- Correct heading order (`h1` → `h2`…) on Home, Project, Task detail.
- Landmarks (`main`, `nav`, `complementary` if any).
- Accessible names of all icon-only buttons (theme toggle, command palette, filters, status badges, etc.).

**Forms & auth**
- Login / Register / Forgot / Reset: labels bound to inputs, error messages via `aria-live` or associated error elements, `autocomplete` attributes (`email`, `current-password`, `new-password`), correct `type` and `inputmode`.
- Password visibility toggle accessible.
- After successful login: session restored correctly on refresh (app initializer + refresh cookie).

**Application-specific flows**
- **Home dashboard**: loading / empty / error states; assigned tasks and due dates do not cause layout shift.
- **Projects list**: loading, empty, error; create project dialog (if present) validates without side effects.
- **Project board**:
  - Columns for `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`.
  - Filters (search, assigned to me, overdue) update the board without full page reload.
  - Quick-add / create task in column.
  - Task cards: priority, assignee, due date visible and not truncated in a way that loses meaning.
  - Board ↔ list view switch preserves context.
- **Task detail**: status & priority changes, comments list (loading / empty / error), file attachments (upload UI, size/type limits, error states). Do **not** upload large or sensitive files.
- **Members panel**: list, invite form validation (do not send real invites), role display.
- **Theme**: light / dark / system. Contrast in both themes (especially badges, status colours, disabled states). Preference persists (`localStorage` key `sprintline-theme` or equivalent).
- **Command palette**: finds routes, projects, tasks; keyboard-only usable; no focus loss.

**States & resilience**
- Loading, empty, error, 404, offline (DevTools → Network → Offline). Empty states must not cause CLS.
- Console: zero errors / unhandled rejections in production build.
- Angular DevTools → Profiler: component re-render count on a single filter change or status update.
- Application tab: where access token and refresh token live (prefer httpOnly Secure cookie for refresh; access token in memory is ideal). Check `SameSite`, `Secure`, `HttpOnly`.

**Angular / architecture quick checks** (repo access assumed)
- All routes use `loadComponent` (already true from `app.routes.ts`).
- Standalone components, `@if` / `@for` / `@switch`, `track` in `@for`.
- Signal-based state in feature stores; no unnecessary `mutate()`.
- No `bypassSecurityTrust*` on user-controlled content (comments, task titles, etc.).
- `NgOptimizedImage` (or equivalent) if any images are used for LCP.
- Bundle budgets respected (`angular.json`: initial warning 500 kB / error 1 MB).

---

## 4. Acceptance criteria (thresholds)

### P0 — release blockers

| Criterion | Threshold | How to check |
|---|---|---|
| LCP (p75, mobile) | ≤ 2.5 s | Lighthouse mobile / CrUX |
| INP (p75) | ≤ 200 ms | field preferred; lab estimate otherwise |
| CLS (p75) | ≤ 0.1 | Lighthouse + Layout Instability |
| Critical a11y violations | 0 `critical` | axe-core |
| WCAG 2.1/2.2 AA | 0 AA violations on audited routes | axe + manual |
| Console errors in production | 0 | DevTools Console on warm production build |
| HTTPS + HSTS | present | response headers |
| XSS vectors | none | no unsafe `innerHTML` / `bypassSecurityTrust*` with user content |
| Secrets in client bundle | none | search built chunks for API keys, private tokens |
| Auth session | works after refresh | app initializer + refresh endpoint |

### P1 — high priority

| Criterion | Threshold / practice |
|---|---|
| Lighthouse Performance (mobile) | ≥ 0.85 |
| Accessibility score | ≥ 0.95 |
| Best Practices score | ≥ 0.90 |
| TBT | ≤ 200 ms |
| Initial bundle (gzip) | within `angular.json` budgets (warn 500 kB) |
| Zone.js on Angular 22 | preferably absent (zoneless) |
| `serious` a11y violations | 0 |
| CSP | present and without `unsafe-eval` if possible |
| Token storage | refresh in httpOnly cookie; access token not in `localStorage` if avoidable |
| Lazy routes | 100 % of feature routes (already true) |
| Command palette | fully keyboard operable, focus managed |
| Theme contrast | both light and dark pass AA for text and status colours |
| Board filters & quick-add | no full reload, no major layout shift |

### P2 — medium priority (code & architecture quality for Angular 22)

| Criterion | Expected state |
|---|---|
| Components | standalone, no NgModules |
| Change detection | OnPush / zoneless defaults |
| State | `signal` / `computed` / `linkedSignal` / `input` / `output` / `model`; Signal Stores for features |
| Templates | control flow (`@if`/`@for`/`@switch`), `track` required |
| DI | `inject()` preferred |
| Host bindings | `host: {}` object |
| Class/style binding | `[class.x]` / `[style.x]`, no `ngClass`/`ngStyle` where possible |
| Forms | Signal Forms or reactive + Zod schemas (already used) |
| Images | `NgOptimizedImage` + `priority` on LCP candidates |
| Heavy UI | `@defer` where appropriate (board columns, task detail panels) |
| TypeScript | `strict: true`, no `any`, no unnecessary `@ts-ignore` |
| Linting | `angular-eslint` + Stylelint + Prettier, 0 errors |
| Tests | Vitest unit + Playwright e2e; no reliance on `fakeAsync` if zoneless |
| Subscriptions | `takeUntilDestroyed` / `async` pipe / `toSignal` |
| Routing | functional guards (`authGuard`, `guestGuard`), lazy `loadComponent` |
| OpenAPI types | generated types used; no hand-written DTO drift |

---

## 5. Report format (follow this structure)

```markdown
# SprintLine Audit — <date>

## 1. Executive summary
- Overall verdict: <ready to ship / ready with caveats / not ready>
- Defect count: P0 — N, P1 — N, P2 — N, P3 — N
- Top 3 risks (one line each)
- What is done well (min 3 concrete points)

## 2. Measurement setup
Browser, throttling, run count, instance state (warm/cold),
URLs and routes, whether a local production build was measured.

## 3. Metrics (table)
| Route | LCP | CLS | TBT | TTFB | DOM nodes | Transfer | Performance | A11y |
(one row per route; label every number's source: Lighthouse / Playwright / field)

## 4. Defects
### P0-1. <short title>
- **Category:** performance / accessibility / security / architecture / UX
- **Route / component:** ...
- **Evidence:** metric or axe rule (`color-contrast`, nodes: `...`), screenshot, code fragment, network request
- **Impact:** on the user and on the business
- **Root cause:** the cause, not the symptom
- **Fix:** concrete code / API / config change
- **Estimate:** S / M / L
- **Verification after fix:** command or step

(repeat per defect, sorted by severity)

## 5. Technical profile
- Angular version, zone.js present/absent
- Bundles table: chunk / size (transfer + gzip) / when loaded
- Security headers table: header / value / verdict
- Auth token storage model
- Theme persistence mechanism

## 6. Gaps
What could not be checked and why; what is needed from the team
(repo access for specific files, staging with always-on instance, RUM/CrUX data, real non-destructive test account).

## 7. Remediation plan
| # | Action | Severity | Effort | Expected effect |
Start with the cheapest wins that have the largest effect.
```

---

## 6. Severity scale

- **P0 (blocker)** — breaks the product for part of the users, creates a security risk, or fails Core Web Vitals. Fix before release.
- **P1 (major)** — noticeably degrades UX or maintainability. Fix this sprint.
- **P2 (minor)** — quality debt, deviation from Angular 22 / project best practices. Plan it.
- **P3 (nit)** — style, consistency, taste. Do not let it distract from higher priorities.

---

## 7. Forbidden

- Writing “improve performance” without a number and a concrete step.
- Suggesting a rewrite from scratch or a framework change.
- Recommending libraries without stating what they solve and their size impact.
- Performing destructive actions in the application.
- Publishing the test account password in the report.
- Presenting lab metrics as field metrics.
- Repeating the same defect across multiple sections.

---

## 8. Definition of done for the audit

- [ ] Measurement setup recorded (warm vs cold, local build vs production)
- [ ] Every route from Section 1 visited
- [ ] Lighthouse mobile + desktop run, metrics in the table
- [ ] axe-core scan run on every key route (login, home, project board, task detail)
- [ ] Manual checks from Stage 4 completed (keyboard, command palette, theme, forms, states, board filters)
- [ ] Auth session restore and token storage examined
- [ ] Every defect has evidence, root cause and a concrete fix
- [ ] Remediation plan exists with priorities and effort
- [ ] Gaps explicitly listed, along with what is needed to close them

---

## 9. SprintLine-specific extras (things easy to miss)

Add these to the defect list or Gaps section if not covered above:

1. **Cold start on Render free tier** — treat as infrastructure risk; document expected sleep behaviour and any user-facing “waking up…” experience.
2. **Command palette discoverability & a11y** — keyboard shortcut advertised? Focus management perfect?
3. **Kanban column empty states + drag-and-drop** (if DnD exists) — keyboard alternative, live region announcements.
4. **File attachments** — client-side size/type validation, progress, error recovery, accessible file list.
5. **Optimistic updates / error rollback** on status change, comment post, filter apply.
6. **Theme flash** on first load (FOUC / wrong theme before `localStorage` is read).
7. **Mobile board usability** — horizontal scroll, card density, filter drawer.
8. **OpenAPI type drift** — regenerate types and check for `any` / mismatched DTOs.
9. **Bundle composition** — how much of the initial payload is Spartan / icons / charts vs application code.
10. **Offline / API-down behaviour** — clear error UI vs silent failures when the separate backend is unreachable.
