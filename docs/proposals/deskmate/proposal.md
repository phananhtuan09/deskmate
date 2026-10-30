# Deskmate: task board and Need attention

Status: Draft

## Goal

Give one user a place inside Paseo to record their own tasks and to be reminded when a task is overdue or a registered agent session needs them.
Accepted behavior lives in [product](../../product/) and [decisions](../../decisions/); this proposal holds only what is still open.

## Verified facts

These were checked against `@getpaseo/plugin` 0.11.2 installed in `../foreman/paseo-plugins/foreman-dashboard` on 2026-10-30.

- Server lifecycle events include `agent.turn_started`, `agent.turn_ended`, `agent.permission_requested`, `agent.permission_resolved`, `agent.session_open`, `agent.closed`, and `agent.archived`.
- `agent.turn_ended` carries the agent, the outcome (`completed`, `failed`, or `canceled`), and the turn's timeline items.
- A plugin can add screens, sidebar items, Command Center items, composer pills, settings screens, and plugin RPCs.
- The client can show in-app toasts through `useToast`.
- No plugin API for operating-system or mobile push notifications was found in the SDK types.
- No plugin-provided data directory was found in the SDK types; the existing Foreman plugin reads and writes local files from its server code with `node:fs`.

## Approval record

On 2026-10-30 the user reviewed working assumptions A1–A12.
A1 and A2 were changed by the user (five columns, project dropdown, date-only due date defaulting to the creation date, automatic read-only timestamps, drag to change status), A4 was extended to the new `Closed` column, the user added a Projects screen, and A3 and A5–A12 were accepted as proposed.
The user named the product Deskmate on the same day.
The accepted behavior now lives in:

- [Task board](../../product/task-board.md): five columns, delete-all for `Closed`, drag to change status, task fields, due date defaulting to the creation date.
- [Projects](../../product/projects.md): name and full folder path, used as the task's project dropdown.
- [Need attention](../../product/need-attention.md): registration, deterministic attention items, startup refresh, deferred conversation review.
- [Product boundary](../../product/product-boundary.md#reminders): in-app reminders only.
- [Local JSON state store decision](../../decisions/2026-10-30-local-json-state-store.md).

## Assumptions

None open.
On 2026-10-30 the user delegated working defaults B1–B3 to the implementer; they were accepted into [Task board](../../product/task-board.md) (a new task starts in `Todo`, `Pending` tasks still become overdue) and [Projects](../../product/projects.md) (renames follow tasks, a project in use cannot be deleted).

## Unresolved decisions

- Whether conversation review should run per ended turn automatically or only on demand.
- Whether operating-system notifications are worth an external helper (for example `notify-send`).
