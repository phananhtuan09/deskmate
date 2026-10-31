import { applyObservation, dismissMatch, reduceAttention, type AttentionReason, type SessionEvent, type SessionObservation } from "./attention";
import type { DeskmateState, RegisteredSession } from "./state";
import { isCalendarDate, isFullPath, isTaskColumn, localDate, type Task, type TaskColumn } from "./task";

export type ActionResult = { ok: true; state: DeskmateState } | { ok: false; error: string; state: DeskmateState };

export type DeskmateCommand =
  | { type: "read" }
  | { type: "createTask"; title: string; note?: string; projectId?: string; dueDate?: string; sessionIds?: string[] }
  | { type: "updateTask"; taskId: string; title: string; note?: string; projectId?: string; dueDate: string; sessionIds?: string[] }
  | { type: "moveTask"; taskId: string; column: TaskColumn }
  | { type: "deleteClosed" }
  | { type: "createProject"; name: string; path: string }
  | { type: "updateProject"; projectId: string; name: string; path: string }
  | { type: "deleteProject"; projectId: string }
  | { type: "registerSession"; sessionId: string; label?: string; provider?: string; workspace?: string }
  | { type: "unregisterSession"; sessionId: string }
  | { type: "dismissAttention"; sessionId: string; reason: AttentionReason; since: string; requestId?: string }
  | { type: "applyEvent"; event: SessionEvent }
  | { type: "refreshSession"; observation: SessionObservation };

export interface CommandContext {
  now: Date;
  createId: () => string;
}

function ok(state: DeskmateState): ActionResult {
  return { ok: true, state };
}

function fail(state: DeskmateState, error: string): ActionResult {
  return { ok: false, error, state };
}

function clean(value: string | undefined): string | undefined {
  const text = value?.trim();
  return text ? text : undefined;
}

function registeredIds(state: DeskmateState): Set<string> {
  return new Set(state.sessions.map((session) => session.id));
}

function taskFields(state: DeskmateState, input: { title: string; note?: string; projectId?: string; dueDate: string; sessionIds?: string[] }): { error: string } | { title: string; note?: string; projectId?: string; dueDate: string; sessionIds: string[] } {
  const title = clean(input.title);
  if (!title) return { error: "Enter a title." };
  if (!isCalendarDate(input.dueDate)) return { error: "Enter a real calendar date, like 2026-10-31." };
  const projectId = clean(input.projectId);
  if (projectId && !state.projects.some((project) => project.id === projectId)) return { error: "Choose a project from the list." };
  const sessionIds: string[] = [];
  for (const sessionId of input.sessionIds ?? []) {
    const id = sessionId.trim();
    if (!id || sessionIds.includes(id)) continue;
    if (!state.sessions.some((session) => session.id === id)) return { error: "Link only registered sessions." };
    sessionIds.push(id);
  }
  return { title, dueDate: input.dueDate, sessionIds, ...(clean(input.note) ? { note: clean(input.note) } : {}), ...(projectId ? { projectId } : {}) };
}

export function createTask(state: DeskmateState, input: { title: string; note?: string; projectId?: string; dueDate?: string; sessionIds?: string[] }, now: Date, id: string): ActionResult {
  if (state.tasks.some((task) => task.id === id)) return fail(state, "That task already exists.");
  const fields = taskFields(state, { ...input, dueDate: clean(input.dueDate) ?? localDate(now) });
  if ("error" in fields) return fail(state, fields.error);
  const stamp = now.toISOString();
  const task: Task = { id, title: fields.title, dueDate: fields.dueDate, column: "todo", sessionIds: fields.sessionIds, createdAt: stamp, updatedAt: stamp };
  if (fields.note) task.note = fields.note;
  if (fields.projectId) task.projectId = fields.projectId;
  return ok({ ...state, tasks: [...state.tasks, task] });
}

export function updateTask(state: DeskmateState, input: { taskId: string; title: string; note?: string; projectId?: string; dueDate: string; sessionIds?: string[] }, now: Date): ActionResult {
  const current = state.tasks.find((task) => task.id === input.taskId);
  if (!current) return fail(state, "That task is gone.");
  const fields = taskFields(state, input);
  if ("error" in fields) return fail(state, fields.error);
  const task: Task = { ...current, title: fields.title, dueDate: fields.dueDate, sessionIds: fields.sessionIds, updatedAt: now.toISOString() };
  delete task.note;
  delete task.projectId;
  if (fields.note) task.note = fields.note;
  if (fields.projectId) task.projectId = fields.projectId;
  return ok({ ...state, tasks: state.tasks.map((entry) => (entry.id === task.id ? task : entry)) });
}

export function moveTask(state: DeskmateState, taskId: string, column: string, now: Date): ActionResult {
  if (!isTaskColumn(column)) return fail(state, "That column does not exist.");
  const current = state.tasks.find((task) => task.id === taskId);
  if (!current) return fail(state, "That task is gone.");
  if (current.column === column) return ok(state);
  const task: Task = { ...current, column, updatedAt: now.toISOString() };
  return ok({ ...state, tasks: state.tasks.map((entry) => (entry.id === task.id ? task : entry)) });
}

export function deleteClosedTasks(state: DeskmateState): ActionResult {
  return ok({ ...state, tasks: state.tasks.filter((task) => task.column !== "closed") });
}

function projectFields(input: { name: string; path: string }): { error: string } | { name: string; path: string } {
  const name = clean(input.name);
  const path = clean(input.path);
  if (!name) return { error: "Enter a project name." };
  if (!path || !isFullPath(path)) return { error: "Enter the full path of the project folder." };
  return { name, path };
}

export function createProject(state: DeskmateState, input: { name: string; path: string }, id: string): ActionResult {
  if (state.projects.some((project) => project.id === id)) return fail(state, "That project already exists.");
  const fields = projectFields(input);
  if ("error" in fields) return fail(state, fields.error);
  return ok({ ...state, projects: [...state.projects, { id, name: fields.name, path: fields.path }] });
}

export function updateProject(state: DeskmateState, input: { projectId: string; name: string; path: string }): ActionResult {
  if (!state.projects.some((project) => project.id === input.projectId)) return fail(state, "That project is gone.");
  const fields = projectFields(input);
  if ("error" in fields) return fail(state, fields.error);
  return ok({
    ...state,
    projects: state.projects.map((project) => (project.id === input.projectId ? { ...project, name: fields.name, path: fields.path } : project)),
  });
}

export function deleteProject(state: DeskmateState, projectId: string): ActionResult {
  if (!state.projects.some((project) => project.id === projectId)) return fail(state, "That project is gone.");
  const count = state.tasks.filter((task) => task.projectId === projectId).length;
  if (count > 0) return fail(state, `This project is still used by ${count} ${count === 1 ? "task" : "tasks"}.`);
  return ok({ ...state, projects: state.projects.filter((project) => project.id !== projectId) });
}

// Adds or updates projects from an outside list. A matching id is the same project.
// The same folder path updates the project already stored so tasks keep their link.
// Projects missing from the list stay, and tasks are left unchanged.
export function syncProjects(state: DeskmateState, sources: readonly { id: string; name: string; path: string }[]): ActionResult {
  let projects = state.projects;
  for (const source of sources) {
    const id = clean(source.id);
    const fields = projectFields(source);
    if (!id || "error" in fields) continue;
    const byId = projects.find((project) => project.id === id);
    const byPath = projects.find((project) => project.path === fields.path);
    if (byId) {
      const pathTaken = projects.some((project) => project.id !== byId.id && project.path === fields.path);
      const path = pathTaken ? byId.path : fields.path;
      if (byId.name === fields.name && byId.path === path) continue;
      projects = projects.map((project) => (project.id === byId.id ? { ...project, name: fields.name, path } : project));
      continue;
    }
    if (byPath) {
      if (byPath.name === fields.name) continue;
      projects = projects.map((project) => (project.id === byPath.id ? { ...project, name: fields.name } : project));
      continue;
    }
    projects = [...projects, { id, name: fields.name, path: fields.path }];
  }
  if (projects === state.projects) return ok(state);
  return ok({ ...state, projects });
}

function withProfile(session: RegisteredSession, profile: { label?: string; provider?: string; workspace?: string }): RegisteredSession {
  const next: RegisteredSession = { ...session };
  const label = clean(profile.label);
  const provider = clean(profile.provider);
  const workspace = clean(profile.workspace);
  if (label) next.label = label;
  if (provider) next.provider = provider;
  if (workspace) next.workspace = workspace;
  return next;
}

export function registerSession(state: DeskmateState, input: { sessionId: string; label?: string; provider?: string; workspace?: string }, now: Date): ActionResult {
  const id = clean(input.sessionId);
  if (!id) return fail(state, "Enter an agent id.");
  const existing = state.sessions.find((session) => session.id === id);
  if (existing) return ok({ ...state, sessions: state.sessions.map((session) => (session.id === id ? withProfile(session, input) : session)) });
  const session: RegisteredSession = { id, registeredAt: now.toISOString() };
  return ok({ ...state, sessions: [...state.sessions, withProfile(session, input)] });
}

export function unregisterSession(state: DeskmateState, sessionId: string): ActionResult {
  if (!state.sessions.some((session) => session.id === sessionId)) return fail(state, "That session is not registered.");
  return ok({
    ...state,
    sessions: state.sessions.filter((session) => session.id !== sessionId),
    attention: state.attention.filter((item) => item.sessionId !== sessionId),
    dismissed: state.dismissed.filter((entry) => entry.sessionId !== sessionId),
  });
}

export function dismissAttention(state: DeskmateState, target: { sessionId: string; reason: AttentionReason; since: string; requestId?: string }): ActionResult {
  const dismissed = dismissMatch(state.attention, state.dismissed, target);
  if (!dismissed) return fail(state, "That reminder is gone.");
  return ok({ ...state, dismissed });
}

export function applyAttention(state: DeskmateState, event: SessionEvent): ActionResult {
  const next = reduceAttention(state.attention, state.dismissed, registeredIds(state), event);
  return ok({ ...state, attention: next.items, dismissed: next.dismissed });
}

export function refreshSession(state: DeskmateState, observation: SessionObservation): ActionResult {
  if (!state.sessions.some((session) => session.id === observation.sessionId)) return ok(state);
  const next = applyObservation(state.attention, state.dismissed, observation);
  return ok({
    ...state,
    attention: next.items,
    dismissed: next.dismissed,
    sessions: state.sessions.map((session) => (session.id === observation.sessionId ? withProfile(session, observation) : session)),
  });
}

export function applyCommand(state: DeskmateState, command: DeskmateCommand, context: CommandContext): ActionResult {
  switch (command.type) {
    case "read":
      return ok(state);
    case "createTask":
      return createTask(state, command, context.now, context.createId());
    case "updateTask":
      return updateTask(state, command, context.now);
    case "moveTask":
      return moveTask(state, command.taskId, command.column, context.now);
    case "deleteClosed":
      return deleteClosedTasks(state);
    case "createProject":
      return createProject(state, command, context.createId());
    case "updateProject":
      return updateProject(state, command);
    case "deleteProject":
      return deleteProject(state, command.projectId);
    case "registerSession":
      return registerSession(state, command, context.now);
    case "unregisterSession":
      return unregisterSession(state, command.sessionId);
    case "dismissAttention":
      return dismissAttention(state, command);
    case "applyEvent":
      return applyAttention(state, command.event);
    case "refreshSession":
      return refreshSession(state, command.observation);
  }
}
