# Deskmate version 1

## Goal

Ship version 1 of the [task board](../../product/task-board.md), [Projects](../../product/projects.md), and [Need attention](../../product/need-attention.md) without conversation review.

## Current state

- Done: host-independent rules live in `shared/core/`.
- The Paseo bundler rejects modules outside `client/`, `server/`, and `shared/`, so the core could not stay at the repository root.
- Done: JSON state under `~/.deskmate/`, an absolute-path setting, atomic replace, and RPC `deskmate.command`.
- Done: task, project, and session actions, attention refresh, dismiss, and reminder counts.
- Done: lifecycle mapping for permission, turn end, close, and archive.
- Startup refresh runs on the first handler that receives the daemon API, because plugin startup has no daemon client.
- Done: Board, Projects, and Attention on one screen, pasted-id registration, the `/deskmate` command, the sidebar count, and toasts.
- Done: Projects has a Sync action that adds or updates the projects Paseo already lists, without deleting local projects or editing tasks.
- Done: the local plugin reloads to `running`.
- Next: exercise the screens inside Paseo and capture light, dark, desktop, and compact screenshots.

## Material decisions

- The product is named Deskmate (chosen by the user on 2026-10-30).
- Dragging a card between columns is wired for wide web.
- Compact layouts and native apps change a column with Move to, including from the edit form, because those layouts do not show every column as a drop target.
- Board, Attention, and Projects stay on one screen, and the switch stays visible on compact so every view can be reached.
- Choosing an attention item or a registered session opens that agent and sends nothing to it.

## Validation

- `npm run typecheck` passed after the UI and the move into `shared/core/`.
- `npm test` passed, 19 tests, covering overdue boundaries, attention, dismiss, the atomic file store, and column hit testing.
- `paseo plugin ls` shows `deskmate` as `running` after `paseo plugin reload deskmate`.
- The plugin log records `Plugin ready`.
- Creating a task, dragging it, registering a session, receiving a permission or turn event, dismissing a reminder, and taking theme screenshots were not done in this session.
- The daemon was not restarted.
