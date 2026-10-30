# Replace the agent supervisor with a passive task companion

Status: Accepted
Date: 2026-10-30
Scope: Product direction of Deskmate and its relationship to the original Foreman repository

## Context

The original Foreman (`../foreman`) is a supervisor: the user talks to one Foreman session, which dispatches worker agents, supervises them through heartbeats, collects JSON reports, and escalates decisions.
In practice the user found the benefit smaller than the cost:

- With one to three agents, opening each agent directly is faster than going through Foreman.
- The user rarely runs four or more agents, because tokens are limited and many concurrent agents demand more of the user's own attention and decisions; routing them through Foreman also costs more tokens.
- Paseo workers answer Foreman in JSON, which makes it awkward for the user to step into a worker's chat.

## Decision

Deskmate is a passive companion for the user's own work rather than a supervisor of agents.
It keeps a task board that the user manages, and it observes agent sessions the user registers so it can remind the user when they are needed.
The user keeps talking to agents directly.

Deskmate is built in a new repository instead of reshaping the original one, and is named Deskmate to separate it from the supervisor.

## Constraints

- Deskmate never dispatches, prompts, steers, or recovers agents.
- Deskmate never imposes a report format on agents.
- The original Foreman repository is kept as reference only; code is carried over only when it fits this boundary.

## Consequences

- Positive: no supervisor LLM sits between the user and their agents, so the steady-state token cost and latency of supervision disappear.
- Positive: agents answer in natural language, so the user can step into any session directly.
- Positive: a new repository avoids unwinding the supervisor's dispatch, lease, recovery, and Herdr code and its supervisor-specific documentation.
- Negative: dispatch, automatic handoff, and heartbeat supervision are no longer available.
- Negative: git history, issues, and CI setup of the original repository do not carry over automatically.

## Alternatives considered

- Keep the supervisor and only let workers answer in natural text: rejected because it fixes the JSON friction but not the cost and scale mismatch.
- Freeze Foreman and use Paseo directly: rejected because the user still wants a durable task board and reminders across sessions.
- Reshape the original repository in place: rejected because most of its code and documentation serve the supervisor role being removed.

## References

- [Product boundary](../product/product-boundary.md)
