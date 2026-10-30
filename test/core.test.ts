import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { applySessionEvent, isOverdue, localDate, type AttentionItem, type Task } from "../core";

const task = (patch: Partial<Task>): Task => ({ id: "t1", title: "Write spec", column: "todo", dueDate: "2026-10-30", sessionIds: [], createdAt: "", updatedAt: "", ...patch });

test("a task is overdue only after its due day ends and while it is not done or closed", () => {
  const due = task({ dueDate: "2026-10-30" });
  assert.equal(isOverdue(due, new Date(2026, 9, 30, 23, 59)), false);
  assert.equal(isOverdue(due, new Date(2026, 9, 31, 0, 0)), true);
  assert.equal(isOverdue({ ...due, column: "done" }, new Date(2026, 10, 5)), false);
  assert.equal(isOverdue({ ...due, column: "closed" }, new Date(2026, 10, 5)), false);
  assert.equal(isOverdue({ ...due, column: "pending" }, new Date(2026, 10, 5)), true);
  assert.equal(localDate(new Date(2026, 0, 5, 23, 30)), "2026-01-05", "the default due date is the local creation date");
});

test("attention follows permission and turn events of registered sessions only", () => {
  const registered = new Set(["a1"]);
  let items: AttentionItem[] = [];
  items = applySessionEvent(items, registered, { type: "permission_requested", sessionId: "a1", requestId: "p1", at: "1" });
  items = applySessionEvent(items, registered, { type: "permission_requested", sessionId: "x9", requestId: "p2", at: "1" });
  assert.deepEqual(items.map((item) => item.reason), ["permission_pending"]);
  items = applySessionEvent(items, registered, { type: "permission_resolved", sessionId: "a1", requestId: "p1", at: "2" });
  items = applySessionEvent(items, registered, { type: "turn_ended", sessionId: "a1", outcome: "completed", at: "3" });
  assert.deepEqual(items.map((item) => item.reason), ["waiting_for_user"]);
  items = applySessionEvent(items, registered, { type: "turn_started", sessionId: "a1", at: "4" });
  assert.deepEqual(items, [], "a new turn clears the wait");
  items = applySessionEvent(items, registered, { type: "turn_ended", sessionId: "a1", outcome: "failed", at: "5" });
  items = applySessionEvent(items, registered, { type: "session_ended", sessionId: "a1", at: "6" });
  assert.deepEqual(items.map((item) => item.reason), ["session_ended"]);
});

test("core stays host-independent", () => {
  const dir = path.join(__dirname, "..", "core");
  for (const file of readdirSync(dir)) assert.doesNotMatch(readFileSync(path.join(dir, file), "utf8"), /from ["']@getpaseo\//, file);
});
