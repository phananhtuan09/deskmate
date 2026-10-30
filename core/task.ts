// Columns and fields follow docs/product/task-board.md.
export type TaskColumn = "todo" | "doing" | "done" | "pending" | "closed";

export const TASK_COLUMNS: readonly TaskColumn[] = ["todo", "doing", "done", "pending", "closed"];

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

// The local calendar date of `at`, used as the default due date of a new task.
export function localDate(at: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}

// A task becomes overdue at the end of its due day in local time and never while it is done or closed.
export function isOverdue(task: Task, now: Date): boolean {
  if (task.column === "done" || task.column === "closed") return false;
  const [year, month, day] = task.dueDate.split("-").map(Number);
  return now.getTime() >= new Date(year, month - 1, day + 1).getTime();
}
