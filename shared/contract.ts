import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

const column = z.enum(["todo", "doing", "done", "pending", "closed"]);
const reason = z.enum(["permission_pending", "waiting_for_user", "turn_failed", "turn_canceled", "session_ended"]);

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  note: z.string().optional(),
  projectId: z.string().optional(),
  dueDate: z.string(),
  column,
  sessionIds: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
});

const sessionSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  provider: z.string().optional(),
  workspace: z.string().optional(),
  registeredAt: z.string(),
});

const attentionSchema = z.object({
  sessionId: z.string(),
  reason,
  since: z.string(),
  requestId: z.string().optional(),
  detail: z.string().optional(),
});

const dismissalSchema = z.object({
  sessionId: z.string(),
  reason,
  since: z.string(),
  requestId: z.string().optional(),
});

export const deskmateStateSchema = z.object({
  version: z.literal(1),
  tasks: z.array(taskSchema),
  projects: z.array(projectSchema),
  sessions: z.array(sessionSchema),
  attention: z.array(attentionSchema),
  dismissed: z.array(dismissalSchema),
});

const commandInput = z.discriminatedUnion("type", [
  z.object({ type: z.literal("read") }),
  z.object({
    type: z.literal("createTask"),
    title: z.string(),
    note: z.string().optional(),
    projectId: z.string().optional(),
    dueDate: z.string().optional(),
    sessionIds: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.literal("updateTask"),
    taskId: z.string(),
    title: z.string(),
    note: z.string().optional(),
    projectId: z.string().optional(),
    dueDate: z.string(),
    sessionIds: z.array(z.string()).optional(),
  }),
  z.object({ type: z.literal("moveTask"), taskId: z.string(), column }),
  z.object({ type: z.literal("deleteClosed") }),
  z.object({ type: z.literal("createProject"), name: z.string(), path: z.string() }),
  z.object({ type: z.literal("updateProject"), projectId: z.string(), name: z.string(), path: z.string() }),
  z.object({ type: z.literal("deleteProject"), projectId: z.string() }),
  z.object({ type: z.literal("syncProjects") }),
  z.object({ type: z.literal("registerSession"), sessionId: z.string() }),
  z.object({ type: z.literal("unregisterSession"), sessionId: z.string() }),
  z.object({
    type: z.literal("dismissAttention"),
    sessionId: z.string(),
    reason,
    since: z.string(),
    requestId: z.string().optional(),
  }),
]);

const commandOutput = z.object({
  ok: z.boolean(),
  error: z.string().optional(),
  state: deskmateStateSchema.optional(),
});

export const deskmateCommand = defineRpc({
  name: "deskmate.command",
  input: commandInput,
  output: commandOutput,
});

export type DeskmateRpcCommand = z.infer<typeof commandInput>;
export type DeskmateRpcResult = z.infer<typeof commandOutput>;
