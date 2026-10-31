import { localDate } from "../shared/core";

export function dueLabel(dueDate: string, now: Date): string {
  if (dueDate === localDate(now)) return "Today";
  if (dueDate === localDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))) return "Tomorrow";
  if (dueDate === localDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) return "Yesterday";
  const [year, month, day] = dueDate.split("-").map(Number);
  if (!year || !month || !day) return dueDate;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function sinceLabel(iso: string, now: Date): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const minutes = Math.max(0, Math.round((now.getTime() - then) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function timeLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function baseName(filePath: string): string {
  const parts = filePath.split(/[/\\]/).filter(Boolean);
  return parts.at(-1) ?? filePath;
}

export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "Could not reach Deskmate.";
}
