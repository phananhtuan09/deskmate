// Deterministic Need attention signals (docs/product/need-attention.md).
// Host adapters translate their runtime events into SessionEvent; the core never sees host-specific shapes.
export type SessionEvent =
  | { type: "permission_requested"; sessionId: string; requestId: string; at: string; detail?: string }
  | { type: "permission_resolved"; sessionId: string; requestId: string; at: string }
  | { type: "turn_started"; sessionId: string; at: string }
  | { type: "turn_ended"; sessionId: string; outcome: "completed" | "failed" | "canceled"; at: string; detail?: string }
  | { type: "session_ended"; sessionId: string; at: string; detail?: string };

export type AttentionReason = "permission_pending" | "turn_failed" | "turn_canceled" | "session_ended";

export const ATTENTION_REASONS: readonly AttentionReason[] = ["permission_pending", "turn_failed", "turn_canceled", "session_ended"];

export function isAttentionReason(value: string): value is AttentionReason {
  return (ATTENTION_REASONS as readonly string[]).includes(value);
}

export interface AttentionItem {
  sessionId: string;
  reason: AttentionReason;
  since: string;
  requestId?: string;
  detail?: string;
}

// A dismissal hides one current cause. It drops out once that cause is gone, so a new cause can show.
export interface AttentionDismissal {
  sessionId: string;
  reason: AttentionReason;
  since: string;
  requestId?: string;
}

// Current facts about one registered session. Adapters fill this from a live snapshot, not from history.
export interface SessionObservation {
  sessionId: string;
  /** Stable time of the current condition. Empty when the host has no such timestamp. */
  at: string;
  ended: boolean;
  running: boolean;
  permissionRequestIds: readonly string[];
  /** The host says a permission is waiting but did not list an id. */
  unspecifiedPermission?: boolean;
  permissionDetail?: string;
  turn: "completed" | "failed" | "canceled" | null;
  turnDetail?: string;
  label?: string;
  provider?: string;
  workspace?: string;
}

const TURN_REASONS: ReadonlySet<AttentionReason> = new Set(["turn_failed", "turn_canceled"]);
// A finished turn is not an attention reason: the user does not need a reminder for every agent reply.
const TURN_OUTCOME_REASON = { failed: "turn_failed", canceled: "turn_canceled" } as const;

function clip(detail: string | undefined): string | undefined {
  const text = detail?.trim();
  if (!text) return undefined;
  return text.length > 200 ? `${text.slice(0, 197)}...` : text;
}

function withDetail(item: AttentionItem, detail?: string): AttentionItem {
  const text = clip(detail);
  return text ? { ...item, detail: text } : item;
}

// Permission identity is the request. Session end is one condition. A turn is one occurrence, keyed by `since`.
export function sameAttentionCause(item: AttentionItem, entry: Pick<AttentionDismissal, "sessionId" | "reason" | "requestId" | "since">): boolean {
  if (item.sessionId !== entry.sessionId || item.reason !== entry.reason) return false;
  if (item.reason === "permission_pending") return item.requestId === entry.requestId;
  if (item.reason === "session_ended") return true;
  return item.since === entry.since;
}

export function visibleAttention(items: readonly AttentionItem[], dismissed: readonly AttentionDismissal[]): AttentionItem[] {
  return items.filter((item) => !dismissed.some((entry) => sameAttentionCause(item, entry)));
}

function pruneDismissals(dismissed: readonly AttentionDismissal[], items: readonly AttentionItem[]): AttentionDismissal[] {
  return dismissed.filter((entry) => items.some((item) => sameAttentionCause(item, entry)));
}

function isAfter(later: string, earlier: string): boolean {
  const left = Date.parse(later);
  const right = Date.parse(earlier);
  if (Number.isNaN(left) || Number.isNaN(right)) return later > earlier;
  return left > right;
}

// Returns the attention items after one event; events of unregistered sessions are ignored.
export function applySessionEvent(items: readonly AttentionItem[], registered: ReadonlySet<string>, event: SessionEvent): AttentionItem[] {
  if (!registered.has(event.sessionId)) return [...items];
  const others = items.filter((item) => item.sessionId !== event.sessionId);
  const own = items.filter((item) => item.sessionId === event.sessionId);
  switch (event.type) {
    case "permission_requested":
      return [...items.filter((item) => item.requestId !== event.requestId || item.reason !== "permission_pending" || item.sessionId !== event.sessionId), withDetail({ sessionId: event.sessionId, reason: "permission_pending", since: event.at, requestId: event.requestId }, event.detail)];
    case "permission_resolved":
      return [...others, ...own.filter((item) => item.requestId !== event.requestId)];
    case "turn_started":
      return [...others, ...own.filter((item) => !TURN_REASONS.has(item.reason))];
    case "turn_ended":
      if (event.outcome === "completed") return [...others, ...own.filter((item) => !TURN_REASONS.has(item.reason))];
      return [...others, ...own.filter((item) => !TURN_REASONS.has(item.reason)), withDetail({ sessionId: event.sessionId, reason: TURN_OUTCOME_REASON[event.outcome], since: event.at }, event.detail)];
    case "session_ended":
      return [...others, withDetail({ sessionId: event.sessionId, reason: "session_ended", since: event.at }, event.detail)];
  }
}

export function reduceAttention(items: readonly AttentionItem[], dismissed: readonly AttentionDismissal[], registered: ReadonlySet<string>, event: SessionEvent): { items: AttentionItem[]; dismissed: AttentionDismissal[] } {
  const next = applySessionEvent(items, registered, event);
  return { items: next, dismissed: pruneDismissals(dismissed, next) };
}

function deriveAttention(observation: SessionObservation): AttentionItem[] {
  if (observation.ended) return [withDetail({ sessionId: observation.sessionId, reason: "session_ended", since: observation.at }, observation.turnDetail)];
  const items: AttentionItem[] = [];
  for (const requestId of observation.permissionRequestIds) {
    items.push(withDetail({ sessionId: observation.sessionId, reason: "permission_pending", since: observation.at, requestId }, observation.permissionDetail));
  }
  if (observation.unspecifiedPermission && observation.permissionRequestIds.length === 0) {
    items.push(withDetail({ sessionId: observation.sessionId, reason: "permission_pending", since: observation.at }, observation.permissionDetail));
  }
  if (!observation.running && observation.turn === "failed") items.push(withDetail({ sessionId: observation.sessionId, reason: "turn_failed", since: observation.at }, observation.turnDetail));
  if (!observation.running && observation.turn === "canceled") items.push(withDetail({ sessionId: observation.sessionId, reason: "turn_canceled", since: observation.at }, observation.turnDetail));
  return items;
}

function stabilize(item: AttentionItem, previous: readonly AttentionItem[]): AttentionItem {
  const prior = previous.find((entry) => entry.reason === item.reason && entry.requestId === item.requestId);
  if (!prior) return item;
  if (item.since && isAfter(item.since, prior.since)) return item;
  return { ...item, since: prior.since };
}

// Replaces one session's attention from its current snapshot. An ongoing cause keeps its previous `since`.
export function applyObservation(items: readonly AttentionItem[], dismissed: readonly AttentionDismissal[], observation: SessionObservation): { items: AttentionItem[]; dismissed: AttentionDismissal[] } {
  const previous = items.filter((item) => item.sessionId === observation.sessionId);
  const own = deriveAttention(observation).map((item) => stabilize(item, previous));
  const next = [...items.filter((item) => item.sessionId !== observation.sessionId), ...own];
  return { items: next, dismissed: pruneDismissals(dismissed, next) };
}

export function dismissMatch(items: readonly AttentionItem[], dismissed: readonly AttentionDismissal[], target: Pick<AttentionDismissal, "sessionId" | "reason" | "requestId" | "since">): AttentionDismissal[] | null {
  const item = items.find((entry) => sameAttentionCause(entry, target));
  if (!item) return null;
  if (dismissed.some((entry) => sameAttentionCause(item, entry))) return [...dismissed];
  return [...dismissed, { sessionId: item.sessionId, reason: item.reason, since: item.since, ...(item.requestId ? { requestId: item.requestId } : {}) }];
}
