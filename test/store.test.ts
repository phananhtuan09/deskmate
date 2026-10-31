import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createTask, emptyState, registerSession } from "../shared/core";
import { defaultStateDirectory, FileStateStore, resolveStateDirectory, stateFile } from "../server/store";

async function tempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "deskmate-store-"));
}

test("the default directory is ~/.deskmate and a setting must be a full path", () => {
  assert.equal(defaultStateDirectory(), path.join(os.homedir(), ".deskmate"));
  const fallback = resolveStateDirectory("  ");
  assert.equal(fallback.ok, true);
  if (fallback.ok) assert.equal(fallback.directory, defaultStateDirectory());
  const relative = resolveStateDirectory("deskmate");
  assert.equal(relative.ok, false);
  const absolute = resolveStateDirectory(path.join(os.tmpdir(), "deskmate-custom"));
  assert.equal(absolute.ok, true);
  if (absolute.ok) assert.equal(stateFile(absolute.directory), path.join(absolute.directory, "state.json"));
});

test("a write is atomic and a new store reads it after a restart", async () => {
  const directory = await tempDir();
  try {
    const file = stateFile(directory);
    const first = new FileStateStore(file);
    assert.deepEqual(await first.read(), emptyState());
    const saved = createTask(registerSession(emptyState(), { sessionId: "ag_1" }, new Date(2026, 9, 31, 8)).state, { title: "Write spec", dueDate: "2026-10-31" }, new Date(2026, 9, 31, 8), "t1").state;
    await first.write(saved);
    const restarted = new FileStateStore(file);
    assert.deepEqual(await restarted.read(), saved);
    const replaced = { ...saved, tasks: [] };
    await restarted.write(replaced);
    assert.deepEqual(await new FileStateStore(file).read(), replaced);
    const names = await readdir(directory);
    assert.deepEqual(names.filter((name) => name.includes(".tmp")), []);
    const raw = await readFile(file, "utf8");
    assert.equal(raw.endsWith("\n"), true);
    assert.doesNotThrow(() => JSON.parse(raw));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("a leftover temp file is not read as the state", async () => {
  const directory = await tempDir();
  try {
    const file = stateFile(directory);
    const store = new FileStateStore(file);
    const saved = createTask(emptyState(), { title: "Keep", dueDate: "2026-10-31" }, new Date(2026, 9, 31, 8), "t1").state;
    await store.write(saved);
    await writeFile(path.join(directory, ".state.json.999.tmp"), "{partial");
    assert.deepEqual(await new FileStateStore(file).read(), saved);
    await writeFile(file, "{partial");
    await assert.rejects(new FileStateStore(file).read(), /not valid JSON/);
    assert.match(await readFile(file, "utf8"), /partial/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
