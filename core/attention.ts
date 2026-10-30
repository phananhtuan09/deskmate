// Deterministic Need attention signals (docs/product/need-attention.md).
// Host adapters translate their runtime events into SessionEvent; the core never sees host-specific shapes.
export type SessionEvent =
  | { type: "permission_requested"; sessionId: string; requestId: string; at: string }
  | { type: "permission_resolved"; sessionId: string; requestId: string; at: string }
  | { type: "turn_started"; sessionId: string; at: string }
  | { type: "turn_ended"; sessionId: string; outcome: "completed" | "failed" | "canceled"; at: string }
  | { type: "session_ended"; sessionId: string; at: string };

export type AttentionReason = "permission_pending" | "waiting_for_user" | "turn_failed" | "turn_canceled" | "session_ended";

export interface AttentionItem {
  sessionId: string;
  reason: AttentionReason;
  since: string;
  requestId?: string;
}

const TURN_REASONS: ReadonlySet<AttentionReason> = new Set(["waiting_for_user", "turn_failed", "turn_canceled"]);
const TURN_OUTCOME_REASON = { completed: "waiting_for_user", failed: "turn_failed", canceled: "turn_canceled" } as const;

// Returns the attention items after one event; events of unregistered sessions are ignored.
export function applySessionEvent(items: readonly AttentionItem[], registered: ReadonlySet<string>, event: SessionEvent): AttentionItem[] {
  if (!registered.has(event.sessionId)) return [...items];
  const others = items.filter((item) => item.sessionId !== event.sessionId);
  const own = items.filter((item) => item.sessionId === event.sessionId);
  switch (event.type) {
    case "permission_requested":
      return [...items, { sessionId: event.sessionId, reason: "permission_pending", since: event.at, requestId: event.requestId }];
    case "permission_resolved":
      return [...others, ...own.filter((item) => item.requestId !== event.requestId)];
    case "turn_started":
      return [...others, ...own.filter((item) => !TURN_REASONS.has(item.reason))];
    case "turn_ended":
      return [...others, ...own.filter((item) => !TURN_REASONS.has(item.reason)), { sessionId: event.sessionId, reason: TURN_OUTCOME_REASON[event.outcome], since: event.at }];
    case "session_ended":
      return [...others, { sessionId: event.sessionId, reason: "session_ended", since: event.at }];
  }
}
