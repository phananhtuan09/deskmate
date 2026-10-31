import type { SessionObservation } from "../shared/core";

// The fields Deskmate reads from a host agent snapshot. Canceled turns are not visible here; those arrive as live events.
export interface HostAgentSnapshot {
  status: "initializing" | "idle" | "running" | "error" | "closed";
  archivedAt?: string | null;
  attentionReason?: "finished" | "error" | "permission" | null;
  attentionTimestamp?: string | null;
  pendingPermissions?: readonly { id: string; title?: string | null; name?: string | null }[];
  lastError?: string | null;
  title?: string | null;
  provider?: string | null;
  cwd?: string | null;
}

function clean(value: string | null | undefined): string | undefined {
  const text = value?.trim();
  return text ? text : undefined;
}

export function observationFromAgent(sessionId: string, agent: HostAgentSnapshot, fallbackAt: string): SessionObservation {
  const ended = agent.status === "closed" || Boolean(agent.archivedAt);
  const running = !ended && (agent.status === "running" || agent.status === "initializing");
  const permissions = (agent.pendingPermissions ?? []).filter((request) => request.id.trim() !== "");
  const permissionRequestIds = ended ? [] : permissions.map((request) => request.id);
  let turn: SessionObservation["turn"] = null;
  if (!ended && agent.attentionReason === "finished") turn = "completed";
  else if (!ended && (agent.attentionReason === "error" || agent.status === "error")) turn = "failed";
  const first = permissions[0];
  let turnDetail: string | undefined;
  if (ended) turnDetail = agent.archivedAt ? "Session archived" : "Session closed";
  else if (turn === "completed") turnDetail = "Finished and waiting for your reply";
  else if (turn === "failed") turnDetail = clean(agent.lastError) ?? "Turn failed";
  return {
    sessionId,
    at: agent.attentionTimestamp || agent.archivedAt || fallbackAt,
    ended,
    running,
    permissionRequestIds,
    unspecifiedPermission: !ended && permissionRequestIds.length === 0 && agent.attentionReason === "permission",
    ...(first ? { permissionDetail: clean(first.title) ?? clean(first.name) } : {}),
    turn,
    ...(turnDetail ? { turnDetail } : {}),
    ...(clean(agent.title) ? { label: clean(agent.title) } : {}),
    ...(clean(agent.provider) ? { provider: clean(agent.provider) } : {}),
    ...(clean(agent.cwd) ? { workspace: clean(agent.cwd) } : {}),
  };
}

export function goneObservation(sessionId: string, at: string): SessionObservation {
  return { sessionId, at, ended: true, running: false, permissionRequestIds: [], turn: null, turnDetail: "Session is gone" };
}
