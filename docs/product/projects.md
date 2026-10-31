# Projects

Status: Active
Scope: The list of projects the user labels tasks with in Deskmate

## Purpose

Projects give tasks a consistent label so the user picks from a list instead of typing a name each time.
A project records where its code lives so the user can tell similarly named projects apart.

## Rules

- Deskmate MUST provide a Projects screen.
- A project MUST have a name and the full path of its folder.
- The user MUST be able to add and edit projects on the Projects screen.
- The project dropdown on a task MUST list the projects on the Projects screen.
- Renaming a project MUST update the project shown on every task that uses it.
- The user MAY delete a project only when no task uses it; otherwise Deskmate MUST refuse and say how many tasks still use it.
- The Projects screen MUST offer one action that adds or updates every project currently known to Paseo.
- That action matches an existing Deskmate project by Paseo project id, or by the same folder path when the project was added by hand.
- It MUST NOT delete a Deskmate project that Paseo does not list, and it MUST NOT change tasks.

## References

- [Task board](task-board.md)
