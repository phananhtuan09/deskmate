import { useToast } from "@getpaseo/plugin/client/react-native";
import { useEffect } from "react";
import { reminderMessages, type DeskmateState, type Reminder } from "../shared/core";

// Shared across the sidebar and the screen so a reminder toasts once.
let seenHost = "";
let seenKeys: Set<string> | null = null;

export function takeNewReminders(hostId: string, state: DeskmateState, now: Date): Reminder[] {
  const messages = reminderMessages(state, now);
  const keys = new Set(messages.map((reminder) => reminder.key));
  if (seenHost !== hostId || seenKeys === null) {
    seenHost = hostId;
    seenKeys = keys;
    return [];
  }
  const fresh = messages.filter((reminder) => !seenKeys?.has(reminder.key));
  seenKeys = keys;
  return fresh;
}

export function ReminderToasts({ hostId, state, now }: { hostId: string; state: DeskmateState | undefined; now: Date }) {
  const toast = useToast();
  useEffect(() => {
    if (!state) return;
    for (const reminder of takeNewReminders(hostId, state, now)) {
      toast.show(reminder.message, { variant: reminder.tone === "warning" ? "warning" : "info" });
    }
  }, [hostId, now, state, toast]);
  return null;
}
