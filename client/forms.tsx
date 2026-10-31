import type { PluginTheme } from "@getpaseo/plugin";
import { Modal } from "@getpaseo/plugin/client/react-native";
import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import type { DeskmateMutation } from "./api";
import { errorText, timeLabel } from "./format";
import { Choice, EmptyNote, GhostButton, PrimaryButton, TextField } from "./widgets";
import { COLUMN_LABELS, isCalendarDate, isFullPath, localDate, TASK_COLUMNS, type DeskmateState, type Project, type Task, type TaskColumn } from "../shared/core";

function projectLabel(project: Project, projects: readonly Project[]): string {
  const shared = projects.filter((entry) => entry.name === project.name).length > 1;
  const folder = project.path.split(/[/\\]/).filter(Boolean).at(-1);
  return shared && folder ? `${project.name} (${folder})` : project.name;
}

function sessionLabel(session: DeskmateState["sessions"][number], sessions: DeskmateState["sessions"]): string {
  const name = session.label || session.id;
  const shared = sessions.filter((entry) => (entry.label || entry.id) === name).length > 1;
  return shared ? `${name} (${session.id.slice(0, 6)})` : name;
}

function FieldLabel({ theme, label, children }: { theme: PluginTheme; label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>
    </View>
  );
}

export function TaskDialog({ theme, state, now, mode, task, busy, onClose, onSubmit, onMove }: { theme: PluginTheme; state: DeskmateState; now: Date; mode: "create" | "edit"; task: Task | null; busy: boolean; onClose: () => void; onSubmit: (command: DeskmateMutation) => Promise<unknown>; onMove: (column: TaskColumn) => Promise<unknown> }) {
  if (mode === "edit" && !task) {
    return (
      <Modal title="Edit task" open onOpenChange={(open) => { if (!open) onClose(); }}>
        <Modal.Content>
          <Text style={{ color: theme.colors.foreground, fontSize: 14 }}>That task is gone.</Text>
          <GhostButton theme={theme} label="Close" onPress={onClose} />
        </Modal.Content>
      </Modal>
    );
  }
  return <TaskForm key={task?.id ?? "new"} theme={theme} state={state} now={now} task={task} busy={busy} onClose={onClose} onSubmit={onSubmit} onMove={onMove} />;
}

function TaskForm({ theme, state, now, task, busy, onClose, onSubmit, onMove }: { theme: PluginTheme; state: DeskmateState; now: Date; task: Task | null; busy: boolean; onClose: () => void; onSubmit: (command: DeskmateMutation) => Promise<unknown>; onMove: (column: TaskColumn) => Promise<unknown> }) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [note, setNote] = useState(task?.note ?? "");
  const [projectId, setProjectId] = useState(task?.projectId ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? localDate(now));
  const [sessionIds, setSessionIds] = useState(task?.sessionIds ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const knownSessions = new Set(state.sessions.map((session) => session.id));
  const unknownSessions = sessionIds.filter((id) => !knownSessions.has(id));

  async function save() {
    if (saving || busy) return;
    const due = dueDate.trim() || localDate(now);
    if (!title.trim()) {
      setError("Enter a title.");
      return;
    }
    if (!isCalendarDate(due)) {
      setError("Enter a real calendar date, like 2026-10-31.");
      return;
    }
    if (projectId && !state.projects.some((project) => project.id === projectId)) {
      setError("Choose a project from the list.");
      return;
    }
    if (unknownSessions.length > 0) {
      setError("Link only registered sessions.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const fields = {
        title: title.trim(),
        dueDate: due,
        sessionIds,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(projectId ? { projectId } : {}),
      };
      await onSubmit(task ? { type: "updateTask", taskId: task.id, ...fields } : { type: "createTask", ...fields });
      onClose();
    } catch (caught) {
      setError(errorText(caught));
      setSaving(false);
    }
  }

  async function move(column: TaskColumn) {
    if (!task || column === task.column || saving || busy) return;
    setSaving(true);
    setError(null);
    try {
      await onMove(column);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setSaving(false);
    }
  }

  function toggleSession(id: string) {
    setSessionIds((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  }

  return (
    <Modal title={task ? "Edit task" : "New task"} open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Content>
        <TextField theme={theme} label="Title" value={title} onChangeText={setTitle} placeholder="What needs doing" />
        <TextField theme={theme} label="Note" value={note} onChangeText={setNote} placeholder="Optional" multiline />
        <FieldLabel theme={theme} label="Project">
          <Choice theme={theme} label="None" selected={!projectId} onPress={() => setProjectId("")} />
          {state.projects.map((project) => <Choice key={project.id} theme={theme} label={projectLabel(project, state.projects)} selected={project.id === projectId} onPress={() => setProjectId(project.id)} />)}
        </FieldLabel>
        {state.projects.length === 0 ? <EmptyNote theme={theme} message="No projects yet. Add one on the Projects screen." /> : null}
        <TextField theme={theme} label="Due date" value={dueDate} onChangeText={setDueDate} placeholder={localDate(now)} />
        <FieldLabel theme={theme} label="Linked sessions">
          {state.sessions.map((session) => <Choice key={session.id} theme={theme} label={sessionLabel(session, state.sessions)} selected={sessionIds.includes(session.id)} onPress={() => toggleSession(session.id)} />)}
          {unknownSessions.map((id) => <Choice key={id} theme={theme} label={`${id} (not registered)`} selected onPress={() => toggleSession(id)} />)}
        </FieldLabel>
        {state.sessions.length === 0 && unknownSessions.length === 0 ? <EmptyNote theme={theme} message="Register a session before linking it." /> : null}
        {task ? (
          <View style={{ gap: 6 }}>
            <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>Created {timeLabel(task.createdAt)}</Text>
            <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>Updated {timeLabel(task.updatedAt)}</Text>
            <FieldLabel theme={theme} label="Move to">
              {TASK_COLUMNS.map((column) => <Choice key={column} theme={theme} label={COLUMN_LABELS[column]} selected={task.column === column} onPress={() => { void move(column); }} />)}
            </FieldLabel>
          </View>
        ) : <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>New tasks start in Todo.</Text>}
        {error ? <Text style={{ color: theme.colors.statusDanger, fontSize: 13 }}>{error}</Text> : null}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
          <GhostButton theme={theme} label="Cancel" onPress={onClose} />
          <PrimaryButton theme={theme} label={saving ? "Saving…" : "Save"} onPress={() => { void save(); }} disabled={saving || busy} />
        </View>
      </Modal.Content>
    </Modal>
  );
}

export function ProjectDialog({ theme, state, mode, project, busy, onClose, onSubmit }: { theme: PluginTheme; state: DeskmateState; mode: "create" | "edit"; project: Project | null; busy: boolean; onClose: () => void; onSubmit: (command: DeskmateMutation) => Promise<unknown> }) {
  if (mode === "edit" && !project) {
    return (
      <Modal title="Edit project" open onOpenChange={(open) => { if (!open) onClose(); }}>
        <Modal.Content>
          <Text style={{ color: theme.colors.foreground, fontSize: 14 }}>That project is gone.</Text>
          <GhostButton theme={theme} label="Close" onPress={onClose} />
        </Modal.Content>
      </Modal>
    );
  }
  return <ProjectForm key={project?.id ?? "new"} theme={theme} project={project} busy={busy} onClose={onClose} onSubmit={onSubmit} />;
}

function ProjectForm({ theme, project, busy, onClose, onSubmit }: { theme: PluginTheme; project: Project | null; busy: boolean; onClose: () => void; onSubmit: (command: DeskmateMutation) => Promise<unknown> }) {
  const [name, setName] = useState(project?.name ?? "");
  const [folder, setFolder] = useState(project?.path ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving || busy) return;
    if (!name.trim()) {
      setError("Enter a project name.");
      return;
    }
    if (!isFullPath(folder.trim())) {
      setError("Enter the full path of the project folder.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const fields = { name: name.trim(), path: folder.trim() };
      await onSubmit(project ? { type: "updateProject", projectId: project.id, ...fields } : { type: "createProject", ...fields });
      onClose();
    } catch (caught) {
      setError(errorText(caught));
      setSaving(false);
    }
  }

  return (
    <Modal title={project ? "Edit project" : "New project"} open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Content>
        <TextField theme={theme} label="Name" value={name} onChangeText={setName} placeholder="Deskmate" />
        <TextField theme={theme} label="Folder" value={folder} onChangeText={setFolder} placeholder="/full/path/to/the/folder" />
        {error ? <Text style={{ color: theme.colors.statusDanger, fontSize: 13 }}>{error}</Text> : null}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
          <GhostButton theme={theme} label="Cancel" onPress={onClose} />
          <PrimaryButton theme={theme} label={saving ? "Saving…" : "Save"} onPress={() => { void save(); }} disabled={saving || busy} />
        </View>
      </Modal.Content>
    </Modal>
  );
}

export function RegisterDialog({ theme, state, busy, onClose, onSubmit, onUnregister, onOpenSession }: { theme: PluginTheme; state: DeskmateState; busy: boolean; onClose: () => void; onSubmit: (sessionId: string) => Promise<unknown>; onUnregister: (sessionId: string) => Promise<unknown>; onOpenSession?: (sessionId: string) => void }) {
  const [agentId, setAgentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function register() {
    if (saving || busy) return;
    const sessionId = agentId.trim();
    if (!sessionId) {
      setError("Enter an agent id.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await onSubmit(sessionId);
      setAgentId("");
      setNotice("Registered.");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setSaving(false);
    }
  }

  async function unregister(sessionId: string) {
    setRowError(null);
    try {
      await onUnregister(sessionId);
    } catch (caught) {
      setRowError(errorText(caught));
    }
  }

  return (
    <Modal title="Register session" open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Content>
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: 13 }}>Paste a Paseo agent id, or run /deskmate in that agent's chat. Deskmate only observes registered sessions.</Text>
        <TextField theme={theme} label="Agent id" value={agentId} onChangeText={setAgentId} placeholder="agent id" error={error} />
        {notice ? <Text style={{ color: theme.colors.statusSuccess, fontSize: 13 }}>{notice}</Text> : null}
        <PrimaryButton theme={theme} label={saving ? "Registering…" : "Register"} onPress={() => { void register(); }} disabled={saving || busy} />
        {state.sessions.length === 0 ? <EmptyNote theme={theme} message="No sessions registered." /> : state.sessions.map((session) => {
          const name = session.label || session.id;
          return (
            <View key={session.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 10, backgroundColor: theme.colors.surface0 }}>
              <Pressable accessibilityRole={onOpenSession ? "button" : undefined} accessibilityLabel={onOpenSession ? `Open ${name}` : undefined} disabled={!onOpenSession} onPress={() => onOpenSession?.(session.id)} style={{ flex: 1, gap: 4, cursor: onOpenSession ? "pointer" : "auto" }}>
                <Text style={{ color: theme.colors.foreground, fontSize: 14, fontWeight: "600" }}>{name}</Text>
                <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>{session.id}</Text>
                {session.workspace ? <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>{session.workspace}</Text> : null}
              </Pressable>
              <GhostButton theme={theme} label="Unregister" tone="danger" onPress={() => { void unregister(session.id); }} disabled={busy} />
            </View>
          );
        })}
        {rowError ? <Text style={{ color: theme.colors.statusDanger, fontSize: 13 }}>{rowError}</Text> : null}
      </Modal.Content>
    </Modal>
  );
}

export function MoveDialog({ theme, task, busy, onClose, onMove }: { theme: PluginTheme; task: Task | null; busy: boolean; onClose: () => void; onMove: (column: TaskColumn) => Promise<unknown> }) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function choose(column: TaskColumn) {
    if (!task || column === task.column || saving || busy) return;
    setSaving(true);
    setError(null);
    try {
      await onMove(column);
      onClose();
    } catch (caught) {
      setError(errorText(caught));
      setSaving(false);
    }
  }

  return (
    <Modal title="Move to" open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Content>
        {task ? (
          <FieldLabel theme={theme} label={task.title}>
            {TASK_COLUMNS.map((column) => <Choice key={column} theme={theme} label={COLUMN_LABELS[column]} selected={task.column === column} onPress={() => { void choose(column); }} />)}
          </FieldLabel>
        ) : <Text style={{ color: theme.colors.foreground, fontSize: 14 }}>That task is gone.</Text>}
        {error ? <Text style={{ color: theme.colors.statusDanger, fontSize: 13 }}>{error}</Text> : null}
        <GhostButton theme={theme} label="Cancel" onPress={onClose} />
      </Modal.Content>
    </Modal>
  );
}
