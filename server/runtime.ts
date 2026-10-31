import type { PaseoApi } from "@getpaseo/client";
import type { PluginHookAgent, PluginServerContext, PluginSettings } from "@getpaseo/plugin/server";
import { applyCommand, isFullPath, syncProjects, type CommandContext, type DeskmateState, type SessionEvent, type SessionObservation } from "../shared/core";
import { deskmateCommand, type DeskmateRpcCommand, type DeskmateRpcResult } from "../shared/contract";
import type { storageSettings } from "../shared/settings";
import { goneObservation, observationFromAgent, type HostAgentSnapshot } from "./observe";
import { FileStateStore, resolveStateDirectory, stateFile } from "./store";

type StorageSettings = PluginSettings<typeof storageSettings.schema>;

function createQueue() {
  let chain = Promise.resolve();
  return function enqueue<T>(job: () => Promise<T>): Promise<T> {
    const run = chain.then(job, job);
    chain = run.then(() => undefined, () => undefined);
    return run;
  };
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Deskmate could not save.";
}

function context(): CommandContext {
  return { now: new Date(), createId: () => crypto.randomUUID() };
}

function profile(agent: PluginHookAgent): { label?: string; provider?: string; workspace?: string } {
  return {
    ...(agent.title ? { label: agent.title } : {}),
    ...(agent.provider ? { provider: agent.provider } : {}),
    ...(agent.cwd ? { workspace: agent.cwd } : {}),
  };
}

// The daemon API is only available inside a handler or hook, so startup refresh runs on the first of those.
export function startDeskmate(server: PluginServerContext, settings: StorageSettings): () => void {
  const enqueue = createQueue();
  let stopped = false;
  let caughtUp = false;

  async function openStore(): Promise<FileStateStore> {
    const current = await settings.read();
    const override = current.status === "ready" ? current.values.directory : "";
    const directory = resolveStateDirectory(override);
    if (!directory.ok) throw new Error(directory.error);
    return new FileStateStore(stateFile(directory.directory));
  }

  async function readSnapshot(paseo: PaseoApi, sessionId: string): Promise<SessionObservation | null> {
    const refreshed = await paseo.agents.ref(sessionId).refresh();
    if (!refreshed?.agent) return null;
    const agent = refreshed.agent;
    const snapshot: HostAgentSnapshot = {
      status: agent.status,
      archivedAt: agent.archivedAt,
      attentionReason: agent.attentionReason,
      attentionTimestamp: agent.attentionTimestamp,
      pendingPermissions: agent.pendingPermissions.map((request) => ({ id: request.id, title: request.title, name: request.name })),
      lastError: agent.lastError,
      title: agent.title,
      provider: agent.provider,
      cwd: agent.cwd,
    };
    return observationFromAgent(sessionId, snapshot, new Date().toISOString());
  }

  // One pass over registered sessions, from the current snapshot, not from stored events.
  async function catchUp(paseo: PaseoApi, state: DeskmateState): Promise<DeskmateState> {
    if (caughtUp) return state;
    let next = state;
    let failed = false;
    for (const session of state.sessions) {
      try {
        const observation = (await readSnapshot(paseo, session.id)) ?? goneObservation(session.id, new Date().toISOString());
        const applied = applyCommand(next, { type: "refreshSession", observation }, context());
        if (applied.ok) next = applied.state;
      } catch (error) {
        failed = true;
        console.error("Deskmate could not refresh a registered session", session.id, message(error));
      }
    }
    if (!failed) caughtUp = true;
    return next;
  }

  async function commit(store: FileStateStore, before: DeskmateState, after: DeskmateState): Promise<void> {
    if (after !== before) await store.write(after);
  }

  async function work(paseo: PaseoApi, job: (store: FileStateStore, state: DeskmateState) => Promise<DeskmateRpcResult>): Promise<DeskmateRpcResult> {
    return enqueue(async () => {
      if (stopped) return { ok: false, error: "Deskmate is stopping." };
      try {
        const store = await openStore();
        const loaded = await store.read();
        const fresh = await catchUp(paseo, loaded);
        await commit(store, loaded, fresh);
        return await job(store, fresh);
      } catch (error) {
        return { ok: false, error: message(error) };
      }
    });
  }

  async function onRegistered(agent: PluginHookAgent, event: SessionEvent, paseo: PaseoApi): Promise<void> {
    await work(paseo, async (store, state) => {
      if (!state.sessions.some((session) => session.id === agent.id)) return { ok: true, state };
      const noted = applyCommand(state, { type: "registerSession", sessionId: agent.id, ...profile(agent) }, context());
      const base = noted.ok ? noted.state : state;
      const next = applyCommand(base, { type: "applyEvent", event }, context());
      if (!next.ok) return { ok: false, error: next.error, state: base };
      await commit(store, state, next.state);
      return { ok: true, state: next.state };
    });
  }

  const stops = [
    server.on("agent.permission_requested", (event, hook) => onRegistered(event.agent, {
      type: "permission_requested",
      sessionId: event.agent.id,
      requestId: event.request.id,
      at: new Date().toISOString(),
      detail: event.request.title || event.request.name,
    }, hook.paseo)),
    server.on("agent.permission_resolved", (event, hook) => onRegistered(event.agent, {
      type: "permission_resolved",
      sessionId: event.agent.id,
      requestId: event.requestId,
      at: new Date().toISOString(),
    }, hook.paseo)),
    server.on("agent.turn_started", (event, hook) => onRegistered(event.agent, {
      type: "turn_started",
      sessionId: event.agent.id,
      at: new Date().toISOString(),
    }, hook.paseo)),
    server.on("agent.turn_ended", (event, hook) => {
      // The timeline is intentionally unused. Version 1 does not review the conversation.
      const outcome = event.outcome.kind === "completed" ? "completed" : event.outcome.kind === "canceled" ? "canceled" : "failed";
      const detail = event.outcome.kind === "failed" ? event.outcome.error.message : event.outcome.kind === "canceled" ? event.outcome.reason : "Finished and waiting for your reply";
      return onRegistered(event.agent, { type: "turn_ended", sessionId: event.agent.id, outcome, at: new Date().toISOString(), detail }, hook.paseo);
    }),
    server.on("agent.closed", (event, hook) => onRegistered(event.agent, {
      type: "session_ended",
      sessionId: event.agent.id,
      at: new Date().toISOString(),
      detail: "Session closed",
    }, hook.paseo)),
    server.on("agent.archived", (event, hook) => onRegistered(event.agent, {
      type: "session_ended",
      sessionId: event.agent.id,
      at: event.archivedAt || new Date().toISOString(),
      detail: "Session archived",
    }, hook.paseo)),
  ];

  server.handle(deskmateCommand, (input, hook) => handle(input, hook.paseo));

  function handle(input: DeskmateRpcCommand, paseo: PaseoApi): Promise<DeskmateRpcResult> {
    return work(paseo, async (store, fresh) => {
      if (input.type === "registerSession") return register(paseo, store, fresh, input.sessionId);
      if (input.type === "syncProjects") return syncFromHost(paseo, store, fresh);
      const loaded = fresh;
      const result = applyCommand(fresh, input, context());
      if (result.ok) await commit(store, loaded, result.state);
      return result.ok ? { ok: true, state: result.state } : { ok: false, error: result.error, state: result.state };
    });
  }

  async function syncFromHost(paseo: PaseoApi, store: FileStateStore, fresh: DeskmateState): Promise<DeskmateRpcResult> {
    let sources: { id: string; name: string; path: string }[];
    try {
      const listed = await paseo.projects.list();
      sources = [];
      for (const project of listed.projects) {
        const path = project.projectRootPath.trim();
        const id = project.projectId.trim();
        const name = project.projectCustomName?.trim() || project.projectDisplayName.trim() || path.split(/[/\\]/).filter(Boolean).at(-1) || "";
        if (!id || !name || !isFullPath(path)) continue;
        sources.push({ id, name, path });
      }
    } catch (error) {
      return { ok: false, error: message(error), state: fresh };
    }
    const result = syncProjects(fresh, sources);
    if (!result.ok) return { ok: false, error: result.error, state: fresh };
    await commit(store, fresh, result.state);
    return { ok: true, state: result.state };
  }

  async function register(paseo: PaseoApi, store: FileStateStore, fresh: DeskmateState, sessionId: string): Promise<DeskmateRpcResult> {
    let observation: SessionObservation | null;
    try {
      observation = await readSnapshot(paseo, sessionId);
    } catch (error) {
      return { ok: false, error: message(error), state: fresh };
    }
    if (!observation) return { ok: false, error: "No agent has that id.", state: fresh };
    const registered = applyCommand(fresh, { type: "registerSession", sessionId, label: observation.label, provider: observation.provider, workspace: observation.workspace }, context());
    if (!registered.ok) return { ok: false, error: registered.error, state: fresh };
    const refreshed = applyCommand(registered.state, { type: "refreshSession", observation }, context());
    const next = refreshed.ok ? refreshed.state : registered.state;
    await commit(store, fresh, next);
    return refreshed.ok ? { ok: true, state: next } : { ok: false, error: refreshed.error, state: next };
  }

  return () => {
    stopped = true;
    for (const stop of stops) stop();
  };
}
