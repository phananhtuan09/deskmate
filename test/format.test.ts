import assert from "node:assert/strict";
import test from "node:test";
import { createTask, emptyState, parseState, registerSession, serializeState, StateFormatError } from "../shared/core";

test("state survives a serialize and parse round trip", () => {
  const created = createTask(registerSession(emptyState(), { sessionId: "ag_1", label: "docs" }, new Date(2026, 9, 31, 12)).state, { title: "Write spec", note: "Details", dueDate: "2026-10-31", sessionIds: ["ag_1"] }, new Date(2026, 9, 31, 12), "t1");
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.deepEqual(parseState(serializeState(created.state)), created.state);
  assert.deepEqual(parseState(serializeState(emptyState())), emptyState());
});

test("a corrupt state file is rejected instead of being treated as empty", () => {
  assert.throws(() => parseState("{"), StateFormatError);
  assert.throws(() => parseState(JSON.stringify({ version: 2, tasks: [], projects: [], sessions: [], attention: [], dismissed: [] })), StateFormatError);
  const broken = parseState(serializeState(emptyState()));
  broken.tasks.push({ id: "t1", title: "Bad", dueDate: "2026-02-31", column: "todo", sessionIds: [], createdAt: "x", updatedAt: "x" });
  assert.throws(() => parseState(JSON.stringify(broken)), /calendar date/);
});

test("legacy waiting_for_user entries are dropped when the state is read", () => {
  const state = registerSession(emptyState(), { sessionId: "ag_1" }, new Date(2026, 9, 31)).state;
  const raw = JSON.parse(serializeState(state));
  raw.attention = [{ sessionId: "ag_1", reason: "waiting_for_user", since: "1" }, { sessionId: "ag_1", reason: "turn_failed", since: "2" }];
  raw.dismissed = [{ sessionId: "ag_1", reason: "waiting_for_user", since: "1" }];
  const parsed = parseState(JSON.stringify(raw));
  assert.deepEqual(parsed.attention.map((item) => item.reason), ["turn_failed"]);
  assert.deepEqual(parsed.dismissed, []);
});
