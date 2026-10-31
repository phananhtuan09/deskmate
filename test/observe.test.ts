import assert from "node:assert/strict";
import test from "node:test";
import { attentionForTask, createTask, emptyState, parseState, refreshSession, registerSession, serializeState } from "../shared/core";
import { deskmateStateSchema } from "../shared/contract";
import { goneObservation, observationFromAgent, type HostAgentSnapshot } from "../server/observe";

const agent = (patch: Partial<HostAgentSnapshot>): HostAgentSnapshot => ({ status: "idle", ...patch });

test("a snapshot becomes the current attention and never a canceled turn", () => {
  const permission = observationFromAgent("ag_1", agent({ attentionReason: "permission", attentionTimestamp: "2026-10-31T14:00:00.000Z", pendingPermissions: [{ id: "perm_1", title: "Run tests?" }] }), "now");
  assert.deepEqual(permission.permissionRequestIds, ["perm_1"]);
  assert.equal(permission.turn, null);
  assert.equal(permission.permissionDetail, "Run tests?");

  const running = observationFromAgent("ag_1", agent({ status: "running", attentionReason: "finished", pendingPermissions: [{ id: "perm_1", name: "shell" }] }), "now");
  assert.equal(running.running, true);
  assert.equal(running.turn, "completed");

  const failed = observationFromAgent("ag_1", agent({ status: "error", attentionReason: "error", lastError: "boom", attentionTimestamp: "2026-10-31T15:00:00.000Z" }), "now");
  assert.equal(failed.turn, "failed");
  assert.notEqual(failed.turn, "canceled");
  assert.equal(failed.turnDetail, "boom");

  const closed = observationFromAgent("ag_1", agent({ status: "closed", pendingPermissions: [{ id: "perm_1", name: "shell" }] }), "now");
  assert.equal(closed.ended, true);
  assert.deepEqual(closed.permissionRequestIds, []);
  assert.equal(closed.turnDetail, "Session closed");

  const archived = observationFromAgent("ag_1", agent({ status: "idle", archivedAt: "2026-10-31T16:00:00.000Z" }), "now");
  assert.equal(archived.ended, true);
  assert.equal(archived.turnDetail, "Session archived");
  assert.equal(archived.at, "2026-10-31T16:00:00.000Z");
});

test("refresh from a snapshot keeps linked-task attention and drops history the snapshot does not show", () => {
  let state = registerSession(emptyState(), { sessionId: "ag_1", label: "docs" }, new Date(2026, 9, 31, 8)).state;
  state = createTask(state, { title: "Review", sessionIds: ["ag_1"], dueDate: "2026-10-31" }, new Date(2026, 9, 31, 8), "t1").state;
  state = refreshSession(state, observationFromAgent("ag_1", agent({ attentionReason: "finished", attentionTimestamp: "2026-10-31T14:00:00.000Z", title: "docs-sweep", provider: "claude", cwd: "/work/deskmate" }), "now")).state;
  assert.equal(state.sessions[0].label, "docs-sweep");
  assert.deepEqual(attentionForTask(state, state.tasks[0]), [], "a finished turn is not an attention item");
  state = refreshSession(state, observationFromAgent("ag_1", agent({ status: "running" }), "now")).state;
  assert.deepEqual(attentionForTask(state, state.tasks[0]), []);
  state = refreshSession(state, goneObservation("ag_1", "2026-10-31T18:00:00.000Z")).state;
  assert.deepEqual(state.attention.map((item) => item.reason), ["session_ended"]);
  assert.equal(deskmateStateSchema.parse(JSON.parse(serializeState(state))).sessions[0].label, "docs-sweep");
  assert.deepEqual(parseState(serializeState(state)).attention, state.attention);
});
