# Deskmate

Deskmate is a Paseo plugin that helps one user track their own tasks and reminds them when a registered Paseo agent session needs them.
It observes; it never dispatches, prompts, or steers agents.

## Authority

- `docs/README.md` indexes durable repository knowledge, and `docs/WORKFLOW.md` defines its authority and precedence rules.
- `docs/product/` holds accepted product behavior and `docs/decisions/` holds accepted architecture decisions.
- `docs/proposals/deskmate/proposal.md` holds working assumptions; do not treat them as accepted behavior.
- `docs/plans/active/` holds the resumable state of ongoing work.

## Code layout

- `core/` is host-independent: it MUST NOT import `@getpaseo/*` or any other host SDK.
- `index.client.tsx`, `index.server.ts`, `client/`, `server/`, and `shared/` are the Paseo adapter.
- Tests live in `test/` and run with `npm test`; type checking runs with `npm run typecheck`.

## Conventions

- Write code, identifiers, and comments in English.
- When substantially editing Markdown, put each complete sentence on its own line.
