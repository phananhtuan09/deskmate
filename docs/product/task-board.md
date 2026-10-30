# Task board

Status: Active
Scope: The user's own tasks recorded in Deskmate

## Purpose

The task board lets the user write down their own work in one place, see it as a kanban board, and be reminded of work that is overdue.
Deskmate remembers and reminds; it does not manage the work.

## Definitions

- Status: the kanban column a task is in.

## Rules

### Columns

- The board MUST show five columns in this order: `Todo`, `Doing`, `Done`, `Pending`, `Closed`.
- The user MUST be able to change a task's status by dragging its card to another column.
- The `Closed` column MUST offer one action that deletes every task currently in `Closed`.
- Deleting tasks MUST happen only through an explicit user action.

### Task fields

- A task MUST have a title.
- A task MAY have a note.
- A task MAY have a project label, chosen from a dropdown of the [registered projects](projects.md).
- A task MUST have a due date that is a calendar date (day, month, year) with no time of day.
- When the user does not choose a due date, the due date MUST default to the date the task was created.
- A task MUST record its creation time and last update time; Deskmate sets both automatically and shows them as read-only text.
- A task MAY link to zero or more registered sessions, and attention items of a linked session MUST also appear on the task card.

### Editing

- The user MUST be able to create a task from inside Paseo and have it stored by Deskmate.
- A new task MUST start in `Todo`.
- The user MUST be able to edit a task's fields.
- Deskmate MUST NOT move, close, delete, reprioritize, or rewrite a task without an explicit user action.

### Overdue reminders

- A task is overdue when the end of its due date in the user's local time zone has passed and the task is not in `Done` or `Closed`.
- A task in `Pending` still becomes overdue, so waiting work keeps prompting a follow-up.
- Deskmate MUST mark overdue tasks on the board and remind the user about them as described in the [product boundary](product-boundary.md#reminders).

## References

- [Product boundary](product-boundary.md)
- [Projects](projects.md)
- [Need attention](need-attention.md)
