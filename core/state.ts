import type { AttentionItem } from "./attention";
import type { Project, Task } from "./task";

export interface RegisteredSession {
  /** Opaque agent id from the host, such as a Paseo agent id. */
  id: string;
  label?: string;
  registeredAt: string;
}

export interface DeskmateState {
  version: 1;
  tasks: Task[];
  projects: Project[];
  sessions: RegisteredSession[];
  attention: AttentionItem[];
}

export const emptyState = (): DeskmateState => ({ version: 1, tasks: [], projects: [], sessions: [], attention: [] });

// Each host adapter supplies where state is persisted (docs/decisions/2026-10-30-local-json-state-store.md).
export interface StateStore {
  read(): Promise<DeskmateState>;
  write(state: DeskmateState): Promise<void>;
}
