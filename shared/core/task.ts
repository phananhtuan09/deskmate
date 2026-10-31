// Columns and fields follow docs/product/task-board.md.
export type TaskColumn = "todo" | "doing" | "done" | "pending" | "closed";

export const TASK_COLUMNS: readonly TaskColumn[] = ["todo", "doing", "done", "pending", "closed"];

export const COLUMN_LABELS: Record<TaskColumn, string> = {
  todo: "Todo",
  doing: "Doing",
  done: "Done",
  pending: "Pending",
  closed: "Closed",
};

export interface Task {
  id: string;
  title: string;
  note?: string;
  /** Id of a registered project. */
  projectId?: string;
  /** Calendar date `YYYY-MM-DD` in the user's local time zone; defaults to the creation date. */
  dueDate: string;
  column: TaskColumn;
  /** Registered session ids linked to this task. */
  sessionIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  /** Full path of the project folder. */
  path: string;
}

export function isTaskColumn(value: string): value is TaskColumn {
  return (TASK_COLUMNS as readonly string[]).includes(value);
}

// The local calendar date of `at`, used as the default due date of a new task.
export function localDate(at: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

// A task becomes overdue at the end of its due day in local time and never while it is done or closed.
export function isOverdue(task: Task, now: Date): boolean {
  if (task.column === "done" || task.column === "closed") return false;
  if (!isCalendarDate(task.dueDate)) return false;
  const [year, month, day] = task.dueDate.split("-").map(Number);
  return now.getTime() >= new Date(year, month - 1, day + 1).getTime();
}

// A full folder path: POSIX absolute, Windows drive, or a UNC share.
export function isFullPath(value: string): boolean {
  return value.startsWith("/") || value.startsWith("\\\\") || /^[A-Za-z]:[\\/]/.test(value);
}
