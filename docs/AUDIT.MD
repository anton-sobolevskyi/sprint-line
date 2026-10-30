# Quality Audit

---

## 1. Application context (fill in before handing over)

| Field | Value |
|---|---|
| Application name | Sprint Line |
| Production URL | https://sprint-line.onrender.com/ |
| Hosting | Render (free tier — the container sleeps after ~15 min idle) |
| Repository | `<link or "no access">` |
| Angular version | `<e.g. 22.2.x — be exact>` |
| Change detection mode | `<zoneless / zone.js / unknown>` |
| UI library | `<Angular Material / PrimeNG / Tailwind / custom>` |
| State management | `<signals / NgRx / services + BehaviorSubject>` |
| SSR / prerender | `<yes / no>` |
| Test account (email) | `alice@example.com` |
| Test password | `YEwL52Co4dGaRPL7` |
| Test account role | `<admin / user / readonly>` |
| Routes to audit | `/login`, `/dashboard`, `<add real ones>` |
| Audit date | 2026-10-30 |

### Access constraints

- Keep the account **read-only where possible**: do not delete users, do not change settings,
  do not send invitations, do not make payments, do not trigger destructive actions.
- Allowed: sign in, navigate, open modals, validate forms **without** submitting real data,
  toggle filters, paginate, open DevTools.
- If a check requires a destructive action, describe it as "requires manual verification"
  instead of performing it.
- Do not publish the test credentials in the report and do not quote the password.

---

## 2. Role and goal

You are a senior frontend auditor specialising in Angular (v17+), web performance and
accessibility. Your goal is to give the engineering team a **prioritised list of defects with
evidence** (a metric, a screenshot, a code fragment, an axe rule name) — not generic advice.

Working rules:

1. Back every claim with **evidence**: a metric value, an axe rule name, an HTTP header,
   a code fragment, or exact reproduction steps.
2. If something cannot be checked (no repo access, metric requires field data), write
   `NOT VERIFIED` and state exactly what is needed to check it.
3. Never invent numbers. If you did not measure a metric, do not report one.
4. Distinguish **lab** (Lighthouse/Playwright) from **field** (CrUX/RUM) metrics.
5. Facts first, interpretation second. Recommendations must name a concrete API or config.

---

## 3. Method (follow this order)

### Stage 0. Environment setup

1. Warm up the instance: `curl -s -o /dev/null -w '%{http_code} %{time_total}\n' https://sprint-line.onrender.com/`.
   Repeat until a stable 200. Record the cold-start duration.
2. **Take all performance metrics against a warmed instance or a local production build**
   (`ng build --configuration production` + static server). Report the Render cold start
   separately as an infrastructure risk, not as a code defect.
3. Record the measurement setup: browser + version, desktop/mobile, CPU throttling,
   network throttling, run count (min. 3, use the median).

### Stage 1. Technical profile (unauthenticated)

- `view-source` or `curl` the root page: server-rendered HTML or an empty shell?
- Response headers: `Content-Encoding`, `Cache-Control`, `Strict-Transport-Security`,
  `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`,
  `Permissions-Policy`.
- Determine the stack: is `zone.js` present in the bundle, Angular version (`ng-version` in the
  DOM, marker comments, chunk names), UI library.
- List every JS/CSS chunk with size (transfer + parsed), load order, and presence of
  preload/prefetch/modulepreload.

### Stage 2. Lighthouse (lab metrics)

- Chrome DevTools → Lighthouse: **mobile** (Moto G Power, Slow 4G) and **desktop**, 3 runs each.
- Record separately: LCP + which element is the LCP candidate, CLS + which elements shift,
  TBT, TTFB, Speed Index, initial bundle size, and `unused-javascript` per chunk.
- Repeat for authenticated pages (via a signed-in profile or a Puppeteer script).

### Stage 3. Authenticated audit (Playwright)

- Sign in with the test account and visit every route from Section 1.
- Per route record: LCP, CLS, number of long tasks (>50 ms), DOM node count, request count,
  total transfer.
- Perform one real click on an interactive element and estimate response latency
  (an INP approximation; label it as a lab estimate).
- Run axe-core with tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`; collect
  `id`, `impact`, `nodes.target`, `failureSummary` for every violation.

### Stage 4. Manual checks (mandatory)

- Keyboard: Tab/Shift+Tab through every flow; visible focus; focus trap in modals;
  Escape closes dialogs; skip link.
- Screen reader (VoiceOver/NVDA): h1-h6 order, landmarks, accessible names of icon buttons.
- Forms: labels bound to inputs, error messages announced (`aria-live`), `autocomplete` on
  email/password, correct input types.
- States: loading, empty, error, 404, offline. Verify the empty state does not shift layout.
- Angular DevTools → Profiler: how many components re-render on a single click; any
  `ExpressionChangedAfterItHasBeenCheckedError` in the console.
- DevTools → Application: where the JWT/session lives (localStorage / sessionStorage / cookie),
  and whether the cookie sets `httpOnly`/`Secure`/`SameSite`.
- Console: any error or warning in production is a defect.

---

## 4. Acceptance criteria (thresholds)

### P0 — release blockers

| Criterion | Threshold | How to check |
|---|---|---|
| LCP (p75, mobile) | ≤ 2.5 s | Lighthouse mobile / CrUX |
| INP (p75) | ≤ 200 ms | field (CrUX/RUM); lab estimate otherwise |
| CLS (p75) | ≤ 0.1 | Lighthouse + Layout Instability API |
| Critical a11y violations | 0 `critical` | axe-core |
| WCAG AA | 0 AA-rule violations | axe + manual review |
| Console errors in production | 0 | DevTools Console |
| HTTPS + HSTS | enabled | response headers |
| XSS patterns | none | `bypassSecurityTrust*`, `[innerHTML]` with user content |
| Secrets in bundle | none | search chunks for API keys |

### P1 — high priority

| Criterion | Threshold / practice |
|---|---|
| Lighthouse performance score (mobile) | ≥ 0.85 |
| Accessibility score | ≥ 0.95 |
| Best-practices score | ≥ 0.90 |
| TBT | ≤ 200 ms |
| Initial bundle (gzip) | within `budgets` in `angular.json`; warning at 500 kB |
| Zone.js on v21+ | absent (zoneless) |
| `serious` a11y violations | 0 |
| CSP | present, no `unsafe-eval` |
| JWT in localStorage | httpOnly cookie preferred |
| Lazy-loaded routes | 100% of routes except the first screen |

### P2 — medium priority (code and architecture quality)

| Criterion | Expected state for v22 |
|---|---|
| Components | standalone, no NgModules |
| Change detection | `OnPush` (default in v22), not written explicitly |
| State | `signal()`, `computed()`, `linkedSignal()`, `input()`, `output()`, `model()`; no `mutate()` |
| Templates | `@if`/`@for`/`@switch`, no `*ngIf`/`*ngFor`; `track` required in `@for` |
| DI | `inject()`, `providedIn: 'root'`; avoid constructor injection where possible |
| Host logic | `host: {}`, no `@HostListener`/`@HostBinding` |
| Classes/styles | `[class.x]`/`[style.x]`, no `ngClass`/`ngStyle` |
| Imports | granular, no `CommonModule` |
| Forms | Signal Forms or reactive forms; no template-driven in complex forms |
| Images | `NgOptimizedImage`, `srcset`, `priority` on the LCP image |
| Heavy blocks | `@defer` (viewport/idle/interaction) |
| TypeScript | `strict: true`, no `any` (use `unknown`), no `@ts-ignore` |
| Linting | `angular-eslint` + Prettier, 0 errors |
| Tests | Vitest (`@angular/build:unit-test`), no `fakeAsync`/`tick()` in zoneless |
| Structure | one component = one responsibility; clear smart/presentational split |
| Subscriptions | no leaks: `takeUntilDestroyed`, `async` pipe, `toSignal` |
| Routing | lazy `loadComponent`/`loadChildren`, functional guards |
| Runtime change detection | no `ChangeDetectorRef.detectChanges()` as a patch |

---

## 5. Report format (follow this structure)

```markdown
# Sprint Line Audit — <date>

## 1. Executive summary
- Overall verdict: <ready to ship / ready with caveats / not ready>
- Defect count: P0 — N, P1 — N, P2 — N
- Top 3 risks (one line each)
- What is done well (min. 3 items)

## 2. Measurement setup
Browser, device, throttling, run count, instance state (warm/cold),
URLs and routes, whether a local production build was measured.

## 3. Metrics (table)
| Route | LCP | CLS | TBT | TTFB | DOM nodes | Transfer | Performance | A11y |
(one row per route; label every number's source: Lighthouse/Playwright/field)

## 4. Defects
### P0-1. <short title>
- **Category:** performance / accessibility / security / architecture
- **Route / component:** ...
- **Evidence:** metric or axe rule (`color-contrast`, nodes: `...`), screenshot, code fragment
- **Impact:** on the user and on the business
- **Root cause:** the cause, not the symptom
- **Fix:** concrete code/API/config
- **Estimate:** S / M / L
- **Verification after fix:** command or step

(repeat per defect, sorted by severity)

## 5. Technical profile
Angular version, zone.js yes/no, bundles (table: chunk / size / gzip / when loaded),
security headers (table: header / value / verdict).

## 6. Gaps
What could not be checked and why; what is needed from the team (repo access, staging, RUM).

## 7. Remediation plan
| # | Action | Severity | Effort | Expected effect |
Start with the cheapest wins that have the largest effect.
```

---

## 6. Severity scale

- **P0 (blocker)** — breaks the product for part of the users, creates a security risk, or fails
  Core Web Vitals. Fix before release.
- **P1 (major)** — noticeably degrades UX or maintainability but does not block. Fix this sprint.
- **P2 (minor)** — quality debt, deviation from best practices. Plan it.
- **P3 (nit)** — style, consistency, taste. Do not let it distract from the rest.

---

## 7. Forbidden

- Writing "improve performance" without a number and a concrete step.
- Suggesting a rewrite from scratch or a framework change.
- Recommending libraries without stating what they solve and how much they weigh.
- Performing destructive actions in the application.
- Publishing the test account password in the report.
- Presenting lab metrics as field metrics.
- Repeating the same defect across multiple sections.

---

## 8. Definition of done for the audit

- [ ] Measurement setup recorded
- [ ] Every route from Section 1 visited
- [ ] Lighthouse mobile + desktop run, metrics in the table
- [ ] axe scan run on every route
- [ ] Manual checks from Stage 4 completed (keyboard, forms, states, DevTools)
- [ ] Every defect has evidence, root cause and a concrete fix
- [ ] Remediation plan exists with priorities and effort
- [ ] Gaps explicitly listed, along with what is needed to close them
