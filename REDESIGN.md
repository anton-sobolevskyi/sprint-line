# SprintLine redesign notes

Design source: the canvas "SprintLine - Redesign" (tokens, sitemap and 15+ screens).
Logic, services, store, routing and API calls are unchanged except where listed under "Small logic changes".

## Design system (src/styles.scss)
- One brick accent, warm neutrals; light and dark token sets (`:root`, `:root.dark`).
- Status = coloured dot (`.sl-status`, `.sl-board-column h3::before`). Priority = bars icon (`.sl-priority-chip`). Neither relies on colour alone.
- Fonts: Bricolage Grotesque (headings) and Inter (UI). Radius: 8px controls, 12px cards (Spartan `rounded-4xl` replaced in `libs/ui`).
- Helpers: `.sl-surface`, `.sl-notice(-success|-danger)`, `.sl-eyebrow`, `.sl-task-card`.
- Dark theme primary is a light coral (`#f08a5d`) with dark text for AA contrast, slightly different from the dark mock-ups.

## Screens changed
Login, Register (split layout, show/hide password, live rules), Forgot, Reset (live rules), Verify email,
app shell (sidebar, compact dismissible verification banner, platform-aware Ctrl K / Cmd K hint), Home (counters, tasks grouped by due date, project progress),
Projects (search, progress), Project (breadcrumb, underline tabs, typed-name delete confirmation), Board and List, Task drawer, Comments, Members, Profile.

## Bugs fixed on the way
- Select triggers showed raw values (`IN_PROGRESS`, user id): `itemToString` added on drawer and create-task selects.
- List/board native status `<select>` showed "To do": options now use `[selected]`.
- Stray literal `\n` after the search shortcut hint.
- Sole owner no longer sees a "Leave project" button that cannot work (hint shown instead).
- Unused `RouterLink` import in the task page; indigo favicon replaced with the brand mark.

## Small logic changes
- Home: groups/counters derived from `GET /users/me/tasks` (limit 20); `recentMemberSeats` removed.
- Projects list: client-side search over the loaded page.
- Submit buttons are no longer disabled when a form is invalid (handlers already validate and show errors).
- Comments show author initials and relative time (`createdAt`).

## Second pass
- New project and New task are now modal dialogs (`HlmDialogService` opens the existing forms from an `<ng-template>`; Esc, backdrop and the close button all reset state).
- Board on small screens: one status column at a time with status tabs, plus a floating "+" button for a new task. From `md` up the board is the same grid as before.
- Command palette searches tasks (server-side `q`, debounced) while you are inside a project.

## Third pass
- Task drawer autosaves (700 ms after the last edit, and when you close the drawer). The form is not reset after a save, so typing is never overwritten. A status line shows "Saving…", "All changes saved", "Unsaved changes" or an error. Invalid input is not sent.
- New task dialog has status, due date and assignee. The create endpoint has no status field, so the store moves the task to the chosen status right after creating it (same approach as the board quick-add).
- Mobile bottom navigation (Home, Projects, Search, Profile); the sidebar sheet is still available from the header.

## Not done (needs backend work or a decision)
- Labels, subtasks, notifications, activity log, sorting: not in the API.
- Palette task search covers the current project only (the API lists tasks per project).

## Checks run
`ng build` (development) OK, `ng test` 22/22, `ng lint` shows the same 7 errors that were already in the project
(confirm-dialog types, theme spec, stores, command palette), none from this change.
Production build only fails offline because Angular inlines Google Fonts; initial bundle 690 kB vs 693 kB before (budget warning is pre-existing).
Not checked in a browser: dialogs (focus, Esc, submit), autosave timing, mobile tabs and bottom bar, drag and drop, drawer selects, dark theme contrast, Playwright e2e (needs the backend).
