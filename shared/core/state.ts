import type { AttentionDismissal, AttentionItem } from "./attention";
import type { Project, Task } from "./task";

export interface RegisteredSession {
  /** Opaque agent id from the host, such as a Paseo agent id. */
  id: string;
  label?: string;
  provider?: string;
  /** Full working directory, shown so similarly named sessions can be told apart. */
  workspace?: string;
  registeredAt: string;
}

export interface DeskmateState {
  version: 1;
  tasks: Task[];
  projects: Project[];
  sessions: RegisteredSession[];
  attention: AttentionItem[];
  dismissed: AttentionDismissal[];
}

export const emptyState = (): DeskmateState => ({ version: 1, tasks: [], projects: [], sessions: [], attention: [], dismissed: [] });

// Each host adapter supplies where state is persisted (docs/decisions/2026-10-30-local-json-state-store.md).
export interface StateStore {
  read(): Promise<DeskmateState>;
  write(state: DeskmateState): Promise<void>;
}
