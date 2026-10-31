import assert from "node:assert/strict";
import test from "node:test";
import { columnAtPoint } from "../client/drag";

const frames = {
  todo: { x: 0, y: 0, width: 100, height: 200 },
  doing: { x: 112, y: 0, width: 100, height: 200 },
};

test("a drop lands on the column under the pointer, including the gap", () => {
  assert.equal(columnAtPoint(frames, ["todo", "doing"], 20, 40), "todo");
  assert.equal(columnAtPoint(frames, ["todo", "doing"], 106, 40), "todo");
  assert.equal(columnAtPoint(frames, ["todo", "doing"], 150, 10), "doing");
  assert.equal(columnAtPoint(frames, ["todo", "doing"], 150, 400), null);
  assert.equal(columnAtPoint(frames, ["doing"], 20, 40), null);
});
