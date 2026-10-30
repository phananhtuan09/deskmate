# Store state as local JSON files written by the plugin server

Status: Accepted
Date: 2026-10-30
Scope: Persistence of tasks, projects, registered sessions, and attention items

## Context

Tasks, projects, and registered sessions must survive restarts of Paseo and of the plugin.
The Paseo plugin SDK provides no plugin data directory, but plugin server code can read and write local files.
Deskmate serves one user on one machine with small amounts of data.

## Decision

The Paseo adapter stores Deskmate state as JSON files under `~/.deskmate/`, and a plugin setting can override that location.
The plugin server is the only writer and replaces files atomically.
The storage format belongs to the host-independent core; the adapter only supplies the location and file access.

## Constraints

- Only one Paseo daemon writes a given state directory at a time; no cross-process lock is provided.
- Clients read and change state only through plugin RPCs, never by touching files directly.

## Consequences

- Positive: no database or extra service is needed, and the state is easy to inspect and back up.
- Negative: two daemons pointed at the same directory could overwrite each other's changes.

## Alternatives considered

- A database: rejected because the data is small and single-user.

## References

- [Paseo plugin with a host-independent core decision](2026-10-30-paseo-plugin-with-host-independent-core.md)
