import assert from "node:assert/strict";
import test from "node:test";
import { applyCommand, createProject, createTask, deleteProject, emptyState, moveTask, refreshSession, registerSession, reminderCount, reminderMessages, syncProjects, unregisterSession, updateProject, type DeskmateState, type SessionObservation } from "../shared/core";

const now = new Date(2026, 9, 31, 15, 0, 0);
const later = new Date(2026, 9, 31, 16, 0, 0);

function ids(prefix: string) {
  let n = 0;
  return () => `${prefix}${++n}`;
}

function command(state: DeskmateState, input: Parameters<typeof applyCommand>[1], at = now, createId = ids("id")) {
  return applyCommand(state, input, { now: at, createId });
}

const idle = (sessionId: string, patch: Partial<SessionObservation> = {}): SessionObservation => ({
  sessionId,
  at: "2026-10-31T14:00:00.000Z",
  ended: false,
  running: false,
  permissionRequestIds: [],
  turn: null,
  ...patch,
});

test("a new task starts in Todo and defaults its due date to the local creation date", () => {
  const created = command(emptyState(), { type: "createTask", title: "  Write spec  " });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const task = created.state.tasks[0];
  assert.equal(task.column, "todo");
  assert.equal(task.title, "Write spec");
  assert.equal(task.dueDate, "2026-10-31");
  assert.equal(task.createdAt, task.updatedAt);
  assert.equal(command(created.state, { type: "createTask", title: "   " }).ok, false);
});

test("editing a task keeps its column and creation time", () => {
  let state = command(emptyState(), { type: "createProject", name: "Deskmate", path: "/work/deskmate" }).state;
  state = command(state, { type: "registerSession", sessionId: "ag_1", label: "docs" }).state;
  state = command(state, { type: "createTask", title: "Write spec", dueDate: "2026-10-31" }).state;
  const createdAt = state.tasks[0].createdAt;
  const edited = command(state, { type: "updateTask", taskId: state.tasks[0].id, title: "Write the spec", note: "Short", projectId: state.projects[0].id, dueDate: "2026-11-02", sessionIds: ["ag_1"] }, later);
  assert.equal(edited.ok, true);
  if (!edited.ok) return;
  const task = edited.state.tasks[0];
  assert.equal(task.column, "todo");
  assert.equal(task.createdAt, createdAt);
  assert.notEqual(task.updatedAt, createdAt);
  assert.equal(task.projectId, state.projects[0].id);
  assert.deepEqual(task.sessionIds, ["ag_1"]);
  assert.equal(command(edited.state, { type: "updateTask", taskId: task.id, title: "Write the spec", dueDate: "2026-11-02", sessionIds: ["missing"] }).ok, false);
});

test("moving a task changes only its column, and clearing Closed leaves the other columns", () => {
  const createId = ids("task");
  let state = command(emptyState(), { type: "createTask", title: "Keep" }, now, createId).state;
  const keep = state.tasks[0].id;
  state = command(state, { type: "createTask", title: "Drop" }, now, createId).state;
  const drop = state.tasks[1].id;
  state = moveTask(state, keep, "doing", later).state;
  assert.equal(state.tasks.find((task) => task.id === keep)?.column, "doing");
  const same = moveTask(state, keep, "doing", new Date(2026, 10, 1));
  assert.equal(same.state.tasks.find((task) => task.id === keep)?.updatedAt, state.tasks.find((task) => task.id === keep)?.updatedAt);
  state = moveTask(state, drop, "closed", later).state;
  state = command(state, { type: "deleteClosed" }).state;
  assert.deepEqual(state.tasks.map((task) => task.id), [keep]);
});

test("renaming a project updates the name every linked task shows, and a used project cannot be deleted", () => {
  let state = createProject(emptyState(), { name: "Deskmate", path: "/work/deskmate" }, "p1").state;
  state = createTask(state, { title: "Notes", projectId: "p1", dueDate: "2026-10-31" }, now, "t1").state;
  state = updateProject(state, { projectId: "p1", name: "Deskmate app", path: "/work/deskmate" }).state;
  assert.equal(state.projects[0].name, "Deskmate app");
  assert.equal(state.tasks[0].projectId, "p1");
  const blocked = deleteProject(state, "p1");
  assert.equal(blocked.ok, false);
  if (blocked.ok) return;
  assert.match(blocked.error, /1 task/);
  state = moveTask(state, "t1", "closed", later).state;
  state = command(state, { type: "deleteClosed" }).state;
  assert.equal(deleteProject(state, "p1").ok, true);
  assert.equal(createProject(emptyState(), { name: "Relative", path: "work/deskmate" }, "p2").ok, false);
});

test("syncing projects adds and updates them and leaves unrelated projects and tasks alone", () => {
  let state = createProject(emptyState(), { name: "Deskmate", path: "/work/deskmate" }, "local").state;
  state = createTask(state, { title: "Notes", projectId: "local", dueDate: "2026-10-31" }, now, "t1").state;
  const synced = syncProjects(state, [
    { id: "prj_desk", name: "Deskmate app", path: "/work/deskmate" },
    { id: "prj_foreman", name: "Foreman", path: "/work/foreman" },
    { id: "", name: "Skip", path: "/work/skip" },
    { id: "prj_bad", name: "Bad", path: "relative" },
  ]);
  assert.equal(synced.ok, true);
  if (!synced.ok) return;
  assert.deepEqual(synced.state.projects.map((project) => [project.id, project.name, project.path]), [
    ["local", "Deskmate app", "/work/deskmate"],
    ["prj_foreman", "Foreman", "/work/foreman"],
  ]);
  assert.equal(synced.state.tasks, state.tasks);
  const again = syncProjects(synced.state, [
    { id: "prj_desk", name: "Deskmate app", path: "/work/deskmate" },
    { id: "prj_foreman", name: "Foreman", path: "/work/moved" },
  ]);
  assert.equal(again.ok, true);
  if (!again.ok) return;
  assert.equal(again.state.projects[0].id, "local");
  assert.equal(again.state.projects.find((project) => project.id === "prj_foreman")?.path, "/work/moved");
  assert.equal(syncProjects(again.state, [{ id: "prj_foreman", name: "Foreman", path: "/work/moved" }]).state, again.state);
});

test("unregister stops observing a session and does not rewrite tasks", () => {
  let state = registerSession(emptyState(), { sessionId: "ag_1", label: "docs" }, now).state;
  state = createTask(state, { title: "Notes", sessionIds: ["ag_1"], dueDate: "2026-10-31" }, now, "t1").state;
  state = refreshSession(state, idle("ag_1", { permissionRequestIds: ["perm_1"], permissionDetail: "Run tests?" })).state;
  assert.equal(reminderCount(state, now), 1);
  state = unregisterSession(state, "ag_1").state;
  assert.deepEqual(state.sessions, []);
  assert.deepEqual(state.attention, []);
  assert.deepEqual(state.tasks[0].sessionIds, ["ag_1"]);
  assert.equal(reminderCount(state, now), 0);
});

test("startup refresh replaces stored attention with the current snapshot", () => {
  let state = registerSession(emptyState(), { sessionId: "ag_1" }, now).state;
  state = refreshSession(state, idle("ag_1", { permissionRequestIds: ["perm_old"] })).state;
  assert.deepEqual(state.attention.map((item) => item.requestId), ["perm_old"]);
  state = refreshSession(state, idle("ag_1")).state;
  assert.deepEqual(state.attention, [], "a resolved permission is not replayed from the stored item");
  state = refreshSession(state, idle("ag_1", { ended: true, turnDetail: "Session closed" })).state;
  assert.deepEqual(state.attention.map((item) => item.reason), ["session_ended"]);
  const ignored = refreshSession(state, idle("missing", { permissionRequestIds: ["perm_x"] }));
  assert.equal(ignored.state, state);
});

test("dismiss hides the current cause and a new occurrence shows up", () => {
  let state = registerSession(emptyState(), { sessionId: "ag_1", label: "docs" }, now).state;
  state = refreshSession(state, idle("ag_1", { at: "2026-10-31T14:00:00.000Z", permissionRequestIds: ["perm_1"] })).state;
  state = command(state, { type: "dismissAttention", sessionId: "ag_1", reason: "permission_pending", since: state.attention[0].since, requestId: "perm_1" }).state;
  assert.equal(reminderCount(state, now), 0);
  state = refreshSession(state, idle("ag_1", { at: "2026-10-31T14:00:00.000Z", permissionRequestIds: ["perm_1"] })).state;
  assert.equal(reminderCount(state, now), 0, "the same permission stays dismissed");
  state = refreshSession(state, idle("ag_1", { at: "2026-10-31T18:00:00.000Z", permissionRequestIds: ["perm_2"] })).state;
  assert.deepEqual(reminderMessages(state, now).map((reminder) => reminder.message), ["docs is waiting for permission"]);
  state = command(state, { type: "applyEvent", event: { type: "permission_resolved", sessionId: "ag_1", requestId: "perm_2", at: "2026-10-31T18:05:00.000Z" } }).state;
  assert.equal(reminderCount(state, now), 0);
});

test("a waiting turn stays dismissed until a later turn, and overdue tasks count with attention", () => {
  let state = registerSession(emptyState(), { sessionId: "ag_1", label: "docs" }, now).state;
  state = refreshSession(state, idle("ag_1", { at: "2026-10-31T14:00:00.000Z", turn: "completed" })).state;
  const since = state.attention[0].since;
  state = command(state, { type: "dismissAttention", sessionId: "ag_1", reason: "waiting_for_user", since }).state;
  state = refreshSession(state, idle("ag_1", { at: "2026-10-31T14:00:00.000Z", turn: "completed" })).state;
  assert.equal(reminderCount(state, now), 0);
  state = command(state, { type: "applyEvent", event: { type: "turn_ended", sessionId: "ag_1", outcome: "failed", at: "2026-10-31T19:00:00.000Z", detail: "tests failed" } }).state;
  assert.deepEqual(state.attention.map((item) => item.reason), ["turn_failed"]);
  state = createTask(state, { title: "Old note", dueDate: "2026-10-30" }, now, "t1").state;
  state = moveTask(state, "t1", "done", later).state;
  assert.equal(reminderMessages(state, new Date(2026, 10, 1, 0, 1)).some((reminder) => reminder.tone === "warning"), false);
  state = moveTask(state, "t1", "pending", later).state;
  const reminders = reminderMessages(state, new Date(2026, 10, 1, 0, 1));
  assert.deepEqual(reminders.map((reminder) => reminder.tone).sort(), ["info", "warning"]);
});
