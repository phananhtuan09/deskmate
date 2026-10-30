# Ship as a Paseo plugin with a host-independent core

Status: Accepted
Date: 2026-10-30
Scope: Runtime host, code boundary, and portability of Deskmate

## Context

The user works in Paseo today and wants Deskmate to run entirely as a Paseo plugin.
The user may later want Deskmate to run in other forms outside Paseo and does not want that move to require large changes to the shared parts.
The Paseo plugin SDK (`@getpaseo/plugin` 0.11.2) offers screens and sidebar items for UI, plugin RPCs for daemon-side work such as local files, and server lifecycle events for agents, including turn ended and permission requested.

## Decision

Deskmate runs as a Paseo plugin.
Its code is split into a host-independent core and a Paseo adapter:

- The core holds the task and attention model, storage format, and the rules that turn tasks and session events into reminders.
- The Paseo adapter translates Paseo lifecycle events into core events, renders the UI with the plugin SDK, and supplies the storage location.

Only the Paseo adapter is built now.

## Constraints

- Core code MUST NOT import `@getpaseo/*` or any other host SDK.
- Core events and records MUST NOT depend on Paseo-specific shapes beyond the opaque agent id string.
- A second adapter is added only when a concrete non-Paseo host is requested.

## Consequences

- Positive: a later host reuses the core and needs only a new adapter.
- Positive: core rules can be tested without Paseo running.
- Negative: the adapter must translate every Paseo event into a core event, which adds a small mapping layer.
- Negative: Paseo-only capabilities that the core does not model stay inside the adapter.

## Alternatives considered

- Write everything directly against the Paseo SDK: rejected because the user asked for reuse when moving to another host.
- Build a general multi-host framework now: rejected because only one host is a current requirement.

## References

- [Product boundary](../product/product-boundary.md)
- [Paseo plugin documentation](https://paseo.sh/docs/plugins/reference.md)
