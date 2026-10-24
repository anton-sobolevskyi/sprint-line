# SprintLine — UX/UI Improvement Guide

**Version:** 1.0  
**Date:** 2026-10-24  
**Scope:** Frontend (`sprint-line`) visual design, information architecture, interaction patterns, and page-level content  
**Audience:** Product owner, frontend engineers, design collaborators  
**Related:** [sprint-line README](https://github.com/anton-sobolevskyi/sprint-line), [IMPLEMENTATION_AND_QUALITY.md](https://github.com/anton-sobolevskyi/sprint-line/blob/main/docs/IMPLEMENTATION_AND_QUALITY.md)

---

## 1. Executive summary

SprintLine is a lightweight project management client (projects, Kanban tasks, members, comments, attachments) built with Angular 22, spartan-ng, and Tailwind CSS v4. The architecture and feature set are solid. The main opportunity is **product polish**: visual hierarchy, density, speed of interaction, and purposeful page content so the app feels closer to Linear and Asana than to a generic template.

**North star:** Fast, calm, keyboard-friendly task tool for small product/engineering teams — not an all-in-one work OS.

**Primary references**

| Reference | Steal this |
|-----------|------------|
| **Linear** | Density, board + list, command palette, keyboard-first, calm dark UI |
| **Asana** | Clear hierarchy, useful home, approachable empty states |
| **Trello** | Readable cards, drag feedback, simple column mental model |

**Out of scope for this phase:** Gantt, goals/OKRs, time tracking, AI chat, complex automations.

---

## 2. Current state (brief)

| Area | Status | Notes |
|------|--------|--------|
| Stack | Strong | Spartan helm, Tailwind v4, Signal Forms, NgRx |
| Theme | Good | Light / dark / system; FOUC handled |
| Shell | Good base | Collapsible sidebar, verification banner |
| Board | Functional | Filters, quick-add, status DnD, optimistic updates |
| Auth | Solid | Full flows + HttpOnly refresh |
| Home / empty content | Weak | Feels placeholder; limited “what should I do next?” |
| Visual density | Loose | Generous spacing; cards can feel template-like |
| Keyboard / command | Missing | High-ROI gap vs Linear |

---

## 3. Design principles

1. **Speed over decoration** — Every action should feel instant; prefer optimistic UI and keyboard paths.
2. **Calm density** — More information per screen without clutter; 4–8px rhythm, subtle borders.
3. **One primary action** — Each screen has a clear “main” CTA; secondary actions stay quiet.
4. **Status is visible** — Priority, due date, assignee readable at a glance on cards and lists.
5. **Empty states are actionable** — Short copy + one CTA; no competing buttons.
6. **Accessibility remains a requirement** — WCAG 2.2 AA; focus rings, labels, confirm dialogs for destructive actions.

---

## 4–16. Full plan

The complete document (visual system, IA, page specs for Home / Board / Task detail, keyboard map, Phases A–D roadmap, metrics, and checklist) lives in the repository artifact and is mirrored here in full in the working tree.

**Phase A (in progress on this branch)**

- Formalize status + priority design tokens (light/dark)
- Tighter global radius
- Board column + task-card utilities (`.sl-board-column`, `.sl-task-card`, priority accent + chips)
- Denser Kanban card layout

**Phase B (next)** — Home dashboard (My work + recent projects), Board ↔ List toggle, task detail layout polish  
**Phase C** — Command palette (`⌘K`), keyboard shortcuts, project switcher  
**Phase D** — Empty-state audit, micro-interactions, optional slide-over task detail

See also `docs/IMPLEMENTATION_AND_QUALITY.md` for phase status table.

---

*For the full long-form guide (sections 4–16 with wireframes and component touch map), open the version committed with the complete body or the local `artifacts/SprintLine_UX_UI_Improvement_Guide.md` export.*
