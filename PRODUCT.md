# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Deskmate renders inside the Paseo app as a React Native plugin; the same design language runs on Paseo desktop and Paseo mobile, so it is recorded as `web` rather than a per-OS native language.

## Users

One person who runs one to three Paseo coding-agent sessions at a time while doing their own work.
They open Deskmate to see what they still owe themselves (tasks, overdue items) and which of their registered agent sessions are waiting on them.
They use it on desktop and mobile equally (confirmed 2026-10-31).

## Product Purpose

Deskmate is a personal task board plus a "Need attention" view for registered Paseo agent sessions.
It remembers and reminds; it never dispatches, prompts, steers, or answers agents.
Success: the user never forgets a task or leaves a registered agent waiting without noticing.

## Positioning

A passive companion, not a supervisor: no LLM sits between the user and their agents, and agents answer the user in natural language.
Accepted behavior lives in `docs/product/` (task board, projects, need attention, product boundary).

## Operating Context

- Surfaces in v1: task board (kanban `Todo`, `Doing`, `Done`, `Pending`, `Closed`, drag to move), Projects screen, Need attention screen, a sidebar item with a reminder count, and in-app toasts.
- Attention reasons: waiting for permission, finished a turn and waiting for reply, turn failed or canceled, session closed or archived.
- Tasks have title, optional note, optional project, date-only due date (defaults to creation date), read-only created/updated times, and zero or more linked sessions.

## Capabilities and Constraints

- UI is React Native inside Paseo, rendered through the Paseo plugin SDK (`@getpaseo/plugin` 0.11.2).
- Colors come from the host theme tokens (`surface0-2`, `border`, `foreground`, `foregroundMuted`, `accent`, `accentForeground`, `statusSuccess`, `statusWarning`, `statusDanger`) so the plugin works in every Paseo light and dark theme.
- Layout must work on both wide desktop and compact mobile (`layout.compact`).
- No operating-system or mobile push notifications in v1.

## Brand Commitments

- Name: Deskmate.
- Uses only Paseo's theme color tokens so it works in every Paseo theme.
- UI direction chosen on 2026-10-31: the standard kanban convention, played straight (Linear / Trello-style board with rounded cards, status pills, and a "Needs attention" strip above the board), over three more distinctive directions.
- Reference mockup: `.impeccable/mocks/deskmate-ui/d-standard.html` (desktop and mobile, light and dark).

## Evidence on Hand

No real user data, screenshots, or brand assets exist yet; mockups use labeled synthetic tasks and sessions.

## Product Principles

- Observe, never act: no control in Deskmate may send anything to an agent.
- The user owns every task change; nothing moves without an explicit action.
- What needs the user now is visible first; everything else waits.
