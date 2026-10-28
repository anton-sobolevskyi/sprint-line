# SprintLine

Frontend for a lightweight project management app: teams collaborate on **projects**, move **tasks** across a status board, discuss work in **comments**, and attach **files**.

This repository is the Angular client. The API lives in a separate backend:

- **Frontend (this repo):** [anton-sobolevskyi/sprint-line](https://github.com/anton-sobolevskyi/sprint-line)
- **Backend:** [anton-sobolevskyi/management_app_backend](https://github.com/anton-sobolevskyi/management_app_backend)

Implementation notes and quality conventions: [`docs/IMPLEMENTATION_AND_QUALITY.md`](docs/IMPLEMENTATION_AND_QUALITY.md).

---

## What it does

| Area              | Capabilities                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------- |
| **Auth**          | Register, login, logout, forgot / reset password, email verification                          |
| **Profile**       | Name, email, password, avatar, resend verification                                            |
| **Projects**      | Create, list, open, update settings, soft-delete                                              |
| **Members**       | Invite by email, change role, remove, transfer ownership, leave                               |
| **Tasks**         | Kanban board (To do → Done), filters, read-only cards, status changes in the task detail page |
| **Collaboration** | Comments and file attachments on tasks                                                        |

**Roles:** `OWNER` · `ADMIN` · `MEMBER` (permissions enforced by the API; the UI reflects what the current member can do).

---

## Stack

| Layer         | Choice                                                             |
| ------------- | ------------------------------------------------------------------ |
| Framework     | Angular 22 (standalone)                                            |
| UI            | [spartan-ng](https://spartan.ng/) (brain + helm) · Tailwind CSS v4 |
| Global state  | NgRx Store (session / current user)                                |
| Feature state | NgRx SignalStore (tasks board, members)                            |
| Forms         | Angular Signal Forms + Zod                                         |
| API types     | openapi-typescript generated schema                                |
| Tooling       | ESLint · Prettier · Stylelint · Husky · Playwright (scaffolded)    |

**Accessibility target:** WCAG 2.2 AA (labels, alerts, focusable controls, confirm dialogs for destructive actions).

---

## UI design system

| Token / pattern  | Notes                                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Brand**        | Indigo primary (`oklch` in `src/styles.scss`), Plus Jakarta Sans, checkmark-line logo mark                                                |
| **Shell**        | Collapsible left sidebar (`hlm-sidebar`), user footer, theme toggle, email verification banner                                            |
| **Theme**        | `ThemeService` — light / dark / system; preference in `localStorage` (`sprintline-theme`); FOUC avoided via inline script in `index.html` |
| **Auth**         | Centered card, soft primary wash, brand mark, theme toggle on guest pages                                                                 |
| **Board**        | Instant filters (debounced search + chips), header “New task” dialog, read-only cards, priority chips                                     |
| **Empty states** | Dashed card, brand icon, short copy + primary CTA                                                                                         |
| **Copy**         | User-facing strings in `*.messages.ts` (`as const`)                                                                                       |

---

## Main user stories

Stories are written from the end-user perspective. Priorities reflect product value, not sprint order.

### Account & access

1. **As a new user**, I want to register with name, email, and password so that I can start using SprintLine.
2. **As a registered user**, I want to sign in and stay signed in (refresh via HttpOnly cookie) so that I do not re-enter credentials on every visit.
3. **As a user who forgot my password**, I want to request a reset link and set a new password so that I can regain access.
4. **As a signed-in user**, I want to verify my email (and resend the link if needed) so that my account is trusted.
5. **As a signed-in user**, I want to sign out from any authenticated screen so that others cannot use my session on a shared device.

### Profile

6. **As a signed-in user**, I want to update my display name and email so that teammates recognize me.
7. **As a signed-in user**, I want to change my password so that I can keep my account secure.
8. **As a signed-in user**, I want to upload an avatar so that I am identifiable in the team list.
9. **As a signed-in user**, I want a clear indication whether my email is verified, with an option to resend verification.

### Projects

10. **As a signed-in user**, I want to create a project with a name (and optional description) so that I can organize work.
11. **As a member of projects**, I want to see a list of my projects and open one so that I can continue work.
12. **As a project owner or admin**, I want to edit project name and description so that the workspace stays accurate.
13. **As a project owner**, I want to soft-delete a project so that it is removed from active work without accidental hard loss (per API rules).

### Members & roles

14. **As an owner or admin**, I want to invite a user by email and assign a role (`ADMIN` / `MEMBER`) so that the team can collaborate.
15. **As an owner or admin**, I want to change a member’s role so that permissions match responsibilities.
16. **As an owner**, I want to transfer ownership to another member so that the project can continue without me as owner.
17. **As an owner or admin**, I want to remove a member so that they no longer access the project.
18. **As a member**, I want to leave a project so that I am no longer associated with it.

### Tasks & board

19. **As a project member**, I want to create a task with title, optional description, and priority so that work is tracked.
20. **As a project member**, I want to see tasks grouped by status (To do, In progress, In review, Done) so that I understand flow.
21. **As a project member**, I want to change a task's status from its detail page (the board cards are read-only) so that the board stays calm and accidental moves are avoided.
22. **As a project member**, I want to filter the board by search text, “assigned to me”, and overdue so that I find relevant work quickly.
23. **As a project member**, I want to open a task detail page to edit title, description, status, priority, due date, and assignee.
24. **As a project member**, I want to soft-delete a task (with confirmation) so that obsolete work is cleared from the board.

### Comments & attachments

25. **As a project member**, I want to add, edit, and delete comments on a task so that discussion stays next to the work.
26. **As a project member**, I want to upload files to a task, download them, and remove attachments I no longer need.

### Orientation & feedback

27. **As a signed-in user**, I want a home dashboard with a greeting, project count, quick actions, and recent projects so that I know where to go next.
28. **As a signed-in user**, I want clear loading, empty, and error states (with retry) so that I understand what the app is doing.
29. **As a signed-in user**, I want confirmation before destructive actions and short success/error toasts so that mistakes are harder and outcomes are visible.

---

## Application map

```
/login, /register, /forgot-password, /reset-password, /verify-email   (guest)
/                         Home (dashboard)
/projects                 Project list + create
/projects/:id             Project: board, members, settings
/projects/:id/tasks/:id   Task detail
/profile                  Account settings
```

---

## Getting started

### Prerequisites

- Node.js (see `packageManager` / tooling in the repo)
- Running backend API (default local URL is configured for the Nest app)

### Install & run

```bash
npm install
npm start
```

App: `http://localhost:4200` (or the port shown by the CLI).

### Docker (dev)

```bash
docker compose up --build
```

If dependencies fail to resolve inside the container after changing packages, reset the named `node_modules` volume (`docker compose down -v`) and rebuild.

### Useful scripts

| Script              | Purpose          |
| ------------------- | ---------------- |
| `npm start`         | Dev server       |
| `npm run build`     | Production build |
| `npm run lint`      | ESLint           |
| `npm run format`    | Prettier         |
| `npm run typecheck` | `tsc --noEmit`   |

---

## Project structure (high level)

```
src/app/
  core/           API clients, auth, interceptors, shared UI (toast, confirm, theme)
  features/       auth, home, profile, projects (board, members, task detail)
  layout/         Authenticated shell (sidebar, theme toggle, verification banner)
libs/ui/          Spartan helm primitives used by the app
docs/             Implementation & quality guide
```

---

## Conventions (short)

- **Endpoints** in `API_PATHS` / `API_ENDPOINTS` (`as const`).
- **User-facing copy** in `*.messages.ts` (`as const`) for future i18n.
- **Forms:** Signal Forms + Zod; submit disabled while invalid.
- **Global vs feature state:** NgRx Store for auth/user; SignalStore for board/members data.

See [`docs/IMPLEMENTATION_AND_QUALITY.md`](docs/IMPLEMENTATION_AND_QUALITY.md) for the full checklist.

---

## Related

| Resource             | Link                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------- |
| Backend API          | [management_app_backend](https://github.com/anton-sobolevskyi/management_app_backend) |
| Implementation guide | [docs/IMPLEMENTATION_AND_QUALITY.md](docs/IMPLEMENTATION_AND_QUALITY.md)              |

---

## License

Private / unlicensed unless stated otherwise by the repository owner.
