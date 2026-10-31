import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { emptyState, parseState, serializeState, type DeskmateState, type StateStore } from "../shared/core";

export function defaultStateDirectory(): string {
  return path.join(os.homedir(), ".deskmate");
}

export function resolveStateDirectory(override: string): { ok: true; directory: string } | { ok: false; error: string } {
  const trimmed = override.trim();
  if (!trimmed) return { ok: true, directory: defaultStateDirectory() };
  if (!path.isAbsolute(trimmed)) return { ok: false, error: "State directory must be a full path." };
  return { ok: true, directory: trimmed };
}

export function stateFile(directory: string): string {
  return path.join(directory, "state.json");
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

// Replaces the state file by renaming a finished temp file in the same directory, which is atomic on this machine.
export class FileStateStore implements StateStore {
  constructor(private readonly filePath: string) {}

  async read(): Promise<DeskmateState> {
    try {
      return parseState(await readFile(this.filePath, "utf8"));
    } catch (error) {
      if (isMissingFile(error)) return emptyState();
      throw error;
    }
  }

  async write(state: DeskmateState): Promise<void> {
    const directory = path.dirname(this.filePath);
    await mkdir(directory, { recursive: true });
    const temporary = path.join(directory, `.${path.basename(this.filePath)}.${process.pid}.${Date.now()}.tmp`);
    const handle = await open(temporary, "w");
    try {
      await handle.writeFile(serializeState(state), "utf8");
      await handle.sync();
      await handle.close();
    } catch (error) {
      await handle.close().catch(() => undefined);
      await rm(temporary, { force: true });
      throw error;
    }
    try {
      await rename(temporary, this.filePath);
    } catch (error) {
      await rm(temporary, { force: true });
      throw error;
    }
  }
}
