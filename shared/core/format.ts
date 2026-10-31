import { isAttentionReason, type AttentionDismissal, type AttentionItem } from "./attention";
import { emptyState, type DeskmateState, type RegisteredSession } from "./state";
import { isCalendarDate, isTaskColumn, type Project, type Task, type TaskColumn } from "./task";

export class StateFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StateFormatError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new StateFormatError(`Deskmate state is missing ${label}.`);
  return value;
}

function optionalText(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") throw new StateFormatError(`Deskmate state has an empty ${label}.`);
  return value;
}

function stringList(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string" || entry.trim() === "")) {
    throw new StateFormatError(`Deskmate state has an invalid ${label} list.`);
  }
  return value;
}

function unique(ids: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) throw new StateFormatError(`Deskmate state has a duplicate ${label}.`);
    seen.add(id);
  }
}

function parseTask(value: unknown): Task {
  if (!isRecord(value)) throw new StateFormatError("Deskmate state has an invalid task.");
  const column = text(value.column, "task column");
  if (!isTaskColumn(column)) throw new StateFormatError("Deskmate state has an unknown task column.");
  const dueDate = text(value.dueDate, "due date");
  if (!isCalendarDate(dueDate)) throw new StateFormatError("Deskmate state has a due date that is not a calendar date.");
  const task: Task = {
    id: text(value.id, "task id"),
    title: text(value.title, "task title"),
    dueDate,
    column: column as TaskColumn,
    sessionIds: stringList(value.sessionIds, "task session"),
    createdAt: text(value.createdAt, "task createdAt"),
    updatedAt: text(value.updatedAt, "task updatedAt"),
  };
  const note = optionalText(value.note, "task note");
  const projectId = optionalText(value.projectId, "task project id");
  if (note) task.note = note;
  if (projectId) task.projectId = projectId;
  return task;
}

function parseProject(value: unknown): Project {
  if (!isRecord(value)) throw new StateFormatError("Deskmate state has an invalid project.");
  return { id: text(value.id, "project id"), name: text(value.name, "project name"), path: text(value.path, "project path") };
}

function parseSession(value: unknown): RegisteredSession {
  if (!isRecord(value)) throw new StateFormatError("Deskmate state has an invalid session.");
  const session: RegisteredSession = { id: text(value.id, "session id"), registeredAt: text(value.registeredAt, "session registeredAt") };
  const label = optionalText(value.label, "session label");
  const provider = optionalText(value.provider, "session provider");
  const workspace = optionalText(value.workspace, "session workspace");
  if (label) session.label = label;
  if (provider) session.provider = provider;
  if (workspace) session.workspace = workspace;
  return session;
}

// Earlier versions stored a "waiting_for_user" reason; those entries are dropped on load.
const LEGACY_REASON = "waiting_for_user";

function parseAttention(value: unknown): AttentionItem | null {
  if (!isRecord(value)) throw new StateFormatError("Deskmate state has an invalid attention item.");
  const reason = text(value.reason, "attention reason");
  if (reason === LEGACY_REASON) return null;
  if (!isAttentionReason(reason)) throw new StateFormatError("Deskmate state has an unknown attention reason.");
  const item: AttentionItem = { sessionId: text(value.sessionId, "attention session id"), reason, since: text(value.since, "attention since") };
  const requestId = optionalText(value.requestId, "attention request id");
  const detail = optionalText(value.detail, "attention detail");
  if (requestId) item.requestId = requestId;
  if (detail) item.detail = detail;
  return item;
}

function parseDismissal(value: unknown): AttentionDismissal | null {
  if (!isRecord(value)) throw new StateFormatError("Deskmate state has an invalid dismissal.");
  const reason = text(value.reason, "dismissal reason");
  if (reason === LEGACY_REASON) return null;
  if (!isAttentionReason(reason)) throw new StateFormatError("Deskmate state has an unknown dismissal reason.");
  const entry: AttentionDismissal = { sessionId: text(value.sessionId, "dismissal session id"), reason, since: text(value.since, "dismissal since") };
  const requestId = optionalText(value.requestId, "dismissal request id");
  if (requestId) entry.requestId = requestId;
  return entry;
}

function arrayOf<T>(value: unknown, label: string, parse: (entry: unknown) => T): T[] {
  if (!Array.isArray(value)) throw new StateFormatError(`Deskmate state is missing ${label}.`);
  return value.map(parse);
}

export function parseState(raw: string): DeskmateState {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new StateFormatError("Deskmate state is not valid JSON.");
  }
  if (!isRecord(value) || value.version !== 1) throw new StateFormatError("Deskmate state is not version 1.");
  const state: DeskmateState = {
    version: 1,
    tasks: arrayOf(value.tasks, "tasks", parseTask),
    projects: arrayOf(value.projects, "projects", parseProject),
    sessions: arrayOf(value.sessions, "sessions", parseSession),
    attention: arrayOf(value.attention, "attention", parseAttention).filter((item): item is AttentionItem => item !== null),
    dismissed: arrayOf(value.dismissed, "dismissed", parseDismissal).filter((entry): entry is AttentionDismissal => entry !== null),
  };
  unique(state.tasks.map((task) => task.id), "task id");
  unique(state.projects.map((project) => project.id), "project id");
  unique(state.sessions.map((session) => session.id), "session id");
  return state;
}

export function serializeState(state: DeskmateState): string {
  return `${JSON.stringify(state, null, 2)}\n`;
}

// Confirms a value that just went through JSON still parses. Used by the file store's callers in tests.
export function roundTripState(state: DeskmateState = emptyState()): DeskmateState {
  return parseState(serializeState(state));
}
