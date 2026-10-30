# Deskmate version 1

## Goal

Ship version 1 of the [task board](../../product/task-board.md), [Projects](../../product/projects.md), and [Need attention](../../product/need-attention.md) without conversation review.

## Current state

- Done: repository created with the documentation contracts copied from the original Foreman repository.
- Done: product boundary, task board, projects, Need attention, three decisions, and the Draft proposal with no open assumptions.
- Done: base scaffold with the host-independent `core/` (task and attention model, overdue and attention rules, store interface) and an empty Paseo plugin entry.
- Next: file store in the Paseo adapter (local JSON state store decision).
- Next: task board screen with drag between columns, delete-all for `Closed`, and the overdue count on the sidebar item.
- Next: Projects screen.
- Next: session registration (paste id and in-chat action) and lifecycle-event mapping with startup refresh.
- Next: Need attention screen and toasts.

## Material decisions

- The product is named Deskmate (chosen by the user on 2026-10-30).

## Validation

- `npm run typecheck` and `npm test` pass on the base scaffold.
- Installing the plugin into a live Paseo daemon has not been done yet.
