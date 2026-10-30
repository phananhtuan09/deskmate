# Deskmate product boundary

Status: Active
Scope: Deskmate as a personal task companion for one user and the Paseo agent sessions that user chooses to register

## Purpose

Deskmate helps one user remember their own work and notice agent sessions that need them.
The user keeps doing the work and keeps talking to agents directly; Deskmate only remembers, observes, and reminds.
This boundary exists because a supervisor that dispatches and steers agents added cost, latency, and an extra layer between the user and their agents without enough benefit at the user's usual scale of one to three concurrent agents.

## Definitions

- User: the single person who owns the task board and the registered sessions.
- Task: a unit of the user's own work recorded on the task board.
- Agent session: a Paseo agent identified by its Paseo agent id.
- Registered session: an agent session the user explicitly asked Deskmate to observe.
- Attention item: a reminder that a registered session or a task needs the user.

## Rules

### Ownership

- The user owns task management: creating, editing, moving, prioritizing, and closing tasks.
- Deskmate owns durable storage of tasks and registered sessions, and the reminders derived from them.
- Agents and their sessions remain owned by the user and by Paseo.

### Goals

- Deskmate MUST provide a [task board](task-board.md) where the user records and tracks their own tasks.
- Deskmate MUST provide a [Need attention](need-attention.md) view that tells the user which registered sessions need them.
- Deskmate MUST provide a [Projects](projects.md) screen for the project labels used on tasks.
- Tasks, projects, and registered sessions MUST survive a restart of Paseo or of the plugin.

### Reminders

- Reminders MUST appear inside Paseo: a count on the Deskmate sidebar item, the items on the task board and Need attention screens, and a toast when a new reminder appears.
- The first version does not send operating-system or mobile notifications.

### Non-goals

- Deskmate MUST NOT dispatch, prompt, steer, cancel, or recover agents.
- Deskmate MUST NOT answer permission requests or otherwise act inside an agent session on the user's behalf.
- Deskmate MUST NOT require agents to answer in a structured report format; agents answer the user in natural language.
- Deskmate MUST NOT observe an agent session the user has not registered.
- Deskmate MUST NOT change a task's status, priority, or content on its own.
- Runtime backends other than Paseo, remote homes, relay channels, and multiple users are out of scope until they have their own accepted specification.

## References

- [Passive task companion decision](../decisions/2026-10-30-passive-task-companion.md)
- [Paseo plugin with a host-independent core decision](../decisions/2026-10-30-paseo-plugin-with-host-independent-core.md)
- [Deskmate proposal with open assumptions](../proposals/deskmate/proposal.md)
