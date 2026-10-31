import { visibleAttention, type AttentionItem, type AttentionReason } from "./attention";
import type { DeskmateState } from "./state";
import { isOverdue, type Task } from "./task";

export interface Reminder {
  key: string;
  message: string;
  tone: "info" | "warning";
}

const ATTENTION_MESSAGE: Record<AttentionReason, (name: string) => string> = {
  permission_pending: (name) => `${name} is waiting for permission`,
  turn_failed: (name) => `${name} had a turn fail`,
  turn_canceled: (name) => `${name} had a turn canceled`,
  session_ended: (name) => `${name} was closed`,
};

export function attentionKey(item: AttentionItem): string {
  if (item.reason === "permission_pending") return `attention:${item.sessionId}:permission_pending:${item.requestId ?? ""}`;
  if (item.reason === "session_ended") return `attention:${item.sessionId}:session_ended`;
  return `attention:${item.sessionId}:${item.reason}:${item.since}`;
}

export function overdueKey(task: Task): string {
  return `overdue:${task.id}:${task.dueDate}`;
}

function sessionName(state: DeskmateState, sessionId: string): string {
  return state.sessions.find((session) => session.id === sessionId)?.label || sessionId;
}

export function attentionForTask(state: DeskmateState, task: Task): AttentionItem[] {
  return visibleAttention(state.attention, state.dismissed).filter((item) => task.sessionIds.includes(item.sessionId));
}

export function reminderMessages(state: DeskmateState, now: Date): Reminder[] {
  const reminders: Reminder[] = visibleAttention(state.attention, state.dismissed).map((item) => ({
    key: attentionKey(item),
    message: ATTENTION_MESSAGE[item.reason](sessionName(state, item.sessionId)),
    tone: "info",
  }));
  for (const task of state.tasks) {
    if (!isOverdue(task, now)) continue;
    reminders.push({ key: overdueKey(task), message: `${task.title} is overdue`, tone: "warning" });
  }
  return reminders;
}

export function reminderCount(state: DeskmateState, now: Date): number {
  return reminderMessages(state, now).length;
}
