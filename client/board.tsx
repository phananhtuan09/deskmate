import type { PluginTheme } from "@getpaseo/plugin";
import { Icon, ScrollView } from "@getpaseo/plugin/client/react-native";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { attentionForTask, COLUMN_LABELS, isOverdue, TASK_COLUMNS, type DeskmateState, type Task, type TaskColumn } from "../shared/core";
import type { DeskmateMutation } from "./api";
import { columnAtPoint, type DragFrame } from "./drag";
import { errorText, dueLabel } from "./format";
import { AttentionStrip } from "./attention";
import { Choice, EmptyNote, ErrorBanner, GhostButton, StatusPill } from "./widgets";

type Measurable = { measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void };

type PointerCapturable = { setPointerCapture?: (pointerId: number) => void };

function projectName(state: DeskmateState, projectId: string | undefined): string | null {
  if (!projectId) return null;
  return state.projects.find((project) => project.id === projectId)?.name ?? null;
}

function pointerPoint(event: { nativeEvent: { clientX?: number; clientY?: number; pageX?: number; pageY?: number; button?: number } }) {
  return {
    x: event.nativeEvent.clientX ?? event.nativeEvent.pageX ?? 0,
    y: event.nativeEvent.clientY ?? event.nativeEvent.pageY ?? 0,
    button: event.nativeEvent.button,
  };
}

function TaskCard({ theme, state, task, now, dragging, dragEnabled, ignorePress, onEdit, onMove, onOpenSession, onArm }: { theme: PluginTheme; state: DeskmateState; task: Task; now: Date; dragging: boolean; dragEnabled: boolean; ignorePress: { current: boolean }; onEdit: () => void; onMove: () => void; onOpenSession?: (sessionId: string) => void; onArm: (task: Task, x: number, y: number, node: PointerCapturable, pointerId?: number) => void }) {
  const closed = task.column === "closed";
  const late = isOverdue(task, now);
  const project = projectName(state, task.projectId);
  const flags = attentionForTask(state, task);
  return (
    <View
      onPointerDown={(event) => {
        const point = pointerPoint(event);
        if (!dragEnabled || (point.button != null && point.button !== 0)) return;
        onArm(task, point.x, point.y, event.currentTarget as PointerCapturable, event.nativeEvent.pointerId);
      }}
      style={{ backgroundColor: theme.colors.surface0, borderColor: dragging ? theme.colors.accent : theme.colors.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, gap: 6, opacity: dragging ? 0.45 : 1, cursor: "pointer" }}
    >
    <Pressable accessibilityRole="button" accessibilityLabel={task.title} accessibilityHint={dragEnabled ? "Drag to another column to change its status, or open to edit." : "Open to edit."} onPress={() => { if (!ignorePress.current) onEdit(); }} style={{ gap: 6 }}>
      <Text style={{ color: closed ? theme.colors.foregroundMuted : theme.colors.foreground, fontSize: 13, fontWeight: "600", lineHeight: 18, textDecorationLine: closed ? "line-through" : "none" }}>{task.title}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        {project ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name="Folder" size={12} color={theme.colors.foregroundMuted} />
            <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>{project}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Icon name="Calendar" size={12} color={late ? theme.colors.statusDanger : theme.colors.foregroundMuted} />
          <Text style={{ color: late ? theme.colors.statusDanger : theme.colors.foregroundMuted, fontSize: 12, fontWeight: late ? "600" : "400" }}>{dueLabel(task.dueDate, now)}</Text>
        </View>
      </View>
    </Pressable>
      {flags.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
          {flags.map((item) => {
            const name = state.sessions.find((session) => session.id === item.sessionId)?.label || item.sessionId;
            return (
              <Pressable key={`${item.reason}:${item.requestId ?? ""}:${item.since}`} accessibilityRole={onOpenSession ? "button" : undefined} accessibilityLabel={onOpenSession ? `Open ${name}` : undefined} disabled={!onOpenSession} onPress={() => onOpenSession?.(item.sessionId)} onPointerDown={(event) => event.stopPropagation?.()} style={{ cursor: onOpenSession ? "pointer" : "auto" }}>
                <StatusPill theme={theme} reason={item.reason} />
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {dragEnabled ? null : <GhostButton theme={theme} label="Move to…" onPress={onMove} />}
    </View>
  );
}

export function TaskBoard({ theme, layout, state, now, run, onEdit, onMove, onCreate, onOpenSession, onDragging }: { theme: PluginTheme; layout: { compact: boolean; platform: "ios" | "android" | "web" }; state: DeskmateState; now: Date; run: (command: DeskmateMutation) => Promise<unknown>; onEdit: (taskId: string) => void; onMove: (taskId: string) => void; onCreate: () => void; onOpenSession?: (sessionId: string) => void; onDragging?: (active: boolean) => void }) {
  // Wide web shows every column, so a pointer drag can land on one. clientX matches measureInWindow. Compact keeps Move to because only one column is mounted.
  const dragEnabled = layout.platform === "web" && !layout.compact;
  const [tab, setTab] = useState<TaskColumn>("todo");
  const [over, setOver] = useState<TaskColumn | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [ghost, setGhost] = useState<{ left: number; top: number; title: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const frames = useRef<Partial<Record<TaskColumn, DragFrame>>>({});
  const nodes = useRef<Partial<Record<TaskColumn, Measurable | null>>>({});
  const nodeRefs = useRef<Partial<Record<TaskColumn, (node: Measurable | null) => void>>>({});
  const boardNode = useRef<Measurable | null>(null);
  const boardFrame = useRef<DragFrame | null>(null);
  const gesture = useRef<{ taskId: string; title: string; x: number; y: number; dragging: boolean; node: PointerCapturable; pointerId?: number } | null>(null);
  const ignorePress = useRef(false);
  const columns = dragEnabled ? TASK_COLUMNS : [tab];

  function columnRef(column: TaskColumn) {
    return nodeRefs.current[column] ??= (node: Measurable | null) => {
      nodes.current[column] = node;
      node?.measureInWindow((x, y, width, height) => {
        frames.current[column] = { x, y, width, height };
      });
    };
  }

  function measureAll(done: () => void) {
    const entries = TASK_COLUMNS.flatMap((column) => {
      const node = nodes.current[column];
      return node ? [{ column, node }] : [];
    });
    if (entries.length === 0) {
      done();
      return;
    }
    let pending = entries.length;
    for (const entry of entries) {
      entry.node.measureInWindow((x, y, width, height) => {
        frames.current[entry.column] = { x, y, width, height };
        pending -= 1;
        if (pending === 0) done();
      });
    }
  }

  function place(task: Task, column: TaskColumn | null) {
    if (!column || column === task.column) return;
    void run({ type: "moveTask", taskId: task.id, column }).catch((caught: unknown) => setActionError(errorText(caught)));
  }

  function measureBoard() {
    boardNode.current?.measureInWindow((x, y, width, height) => {
      boardFrame.current = { x, y, width, height };
    });
  }

  function rememberBoard(node: Measurable | null) {
    boardNode.current = node;
    measureBoard();
  }

  function highlight(x: number, y: number) {
    const next = columnAtPoint(frames.current, TASK_COLUMNS, x, y);
    setOver((current) => (current === next ? current : next));
    const frame = boardFrame.current;
    const active = gesture.current;
    if (frame && active) setGhost({ left: x - frame.x, top: y - frame.y, title: active.title });
  }

  function arm(task: Task, x: number, y: number, node: PointerCapturable, pointerId?: number) {
    gesture.current = { taskId: task.id, title: task.title, x, y, dragging: false, node, pointerId };
    measureBoard();
    measureAll(() => undefined);
  }

  function movePointer(x: number, y: number) {
    const active = gesture.current;
    if (!active) return;
    if (!active.dragging && Math.hypot(x - active.x, y - active.y) < 6) return;
    if (!active.dragging) {
      active.dragging = true;
      // Capture only once a drag starts, so a plain click still reaches the card's press handler.
      if (active.pointerId != null) active.node.setPointerCapture?.(active.pointerId);
      ignorePress.current = true;
      setActionError(null);
      setDraggingId(active.taskId);
      onDragging?.(true);
    }
    highlight(x, y);
    measureAll(() => highlight(x, y));
  }

  function endPointer(x: number | null, y: number | null) {
    const active = gesture.current;
    gesture.current = null;
    const wasDragging = Boolean(active?.dragging);
    setDraggingId(null);
    setOver(null);
    setGhost(null);
    if (wasDragging) {
      onDragging?.(false);
      setTimeout(() => { ignorePress.current = false; }, 200);
    }
    if (!active?.dragging || x === null || y === null) return;
    const task = state.tasks.find((entry) => entry.id === active.taskId);
    if (!task) return;
    const landed = columnAtPoint(frames.current, TASK_COLUMNS, x, y);
    if (landed) {
      place(task, landed);
      return;
    }
    measureAll(() => place(task, columnAtPoint(frames.current, TASK_COLUMNS, x, y)));
  }

  async function clearClosed() {
    setActionError(null);
    try {
      await run({ type: "deleteClosed" });
    } catch (caught) {
      setActionError(errorText(caught));
    }
  }

  return (
    <View ref={rememberBoard} onLayout={measureBoard} onPointerMove={(event) => { const point = pointerPoint(event); movePointer(point.x, point.y); }} onPointerUp={(event) => { const point = pointerPoint(event); endPointer(point.x, point.y); }} onPointerCancel={() => endPointer(null, null)} style={{ position: "relative", gap: 16 }}>
      <AttentionStrip theme={theme} layout={layout} state={state} now={now} run={run} onOpenSession={onOpenSession} />
      {actionError ? <ErrorBanner theme={theme} message={actionError} /> : null}
      {dragEnabled ? null : (
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {TASK_COLUMNS.map((column) => {
            const count = state.tasks.filter((task) => task.column === column).length;
            return (
              <View key={column} style={{ flexShrink: 0 }}>
                <Choice theme={theme} label={`${COLUMN_LABELS[column]} ${count}`} selected={column === tab} onPress={() => setTab(column)} />
              </View>
            );
          })}
        </ScrollView>
      )}
      <View style={{ flexDirection: dragEnabled ? "row" : "column", alignItems: "stretch", gap: 12 }}>
        {columns.map((column) => {
          const tasks = state.tasks.filter((task) => task.column === column);
          const compactClosed = !dragEnabled && column === "closed" && tasks.length > 0;
          return (
            <View key={column} ref={columnRef(column)} collapsable={false} onLayout={() => nodes.current[column]?.measureInWindow((x, y, width, height) => { frames.current[column] = { x, y, width, height }; })} style={{ flex: dragEnabled ? 1 : undefined, minWidth: 0, minHeight: dragEnabled ? 280 : 0, borderRadius: 10, padding: 10, gap: 8, backgroundColor: over === column ? theme.colors.surface2 : theme.colors.surface1, borderWidth: 2, borderColor: over === column ? theme.colors.accent : theme.colors.surface1 }}>
              {dragEnabled ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ color: theme.colors.foreground, fontSize: 13, fontWeight: "600" }}>{COLUMN_LABELS[column]}</Text>
                  <View style={{ minWidth: 18, borderRadius: 10, paddingHorizontal: 7, backgroundColor: theme.colors.surface2, alignItems: "center" }}>
                    <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12, fontVariant: ["tabular-nums"] }}>{tasks.length}</Text>
                  </View>
                  {column === "todo" ? <View style={{ marginLeft: "auto" }}><GhostButton theme={theme} label="" icon="Plus" accessibilityLabel="New task" onPress={onCreate} /></View> : null}
                  {column === "closed" && tasks.length > 0 ? <View style={{ marginLeft: "auto" }}><GhostButton theme={theme} label="Clear" icon="Trash2" accessibilityLabel="Delete every closed task" onPress={() => { void clearClosed(); }} /></View> : null}
                </View>
              ) : null}
              {compactClosed ? <GhostButton theme={theme} label="Clear" icon="Trash2" accessibilityLabel="Delete every closed task" onPress={() => { void clearClosed(); }} /> : null}
              {tasks.length === 0 ? <EmptyNote theme={theme} message="No tasks" /> : tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  theme={theme}
                  state={state}
                  task={task}
                  now={now}
                  dragging={draggingId === task.id}
                  dragEnabled={dragEnabled}
                  ignorePress={ignorePress}
                  onEdit={() => onEdit(task.id)}
                  onMove={() => onMove(task.id)}
                  onOpenSession={onOpenSession}
                  onArm={arm}
                />
              ))}
            </View>
          );
        })}
      </View>
      {ghost ? (
        <View pointerEvents="none" style={{ position: "absolute", left: ghost.left + 12, top: ghost.top + 12, zIndex: 20, maxWidth: 220, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.accent, backgroundColor: theme.colors.surface0, paddingHorizontal: 10, paddingVertical: 8 }}>
          <Text style={{ color: theme.colors.foreground, fontSize: 13, fontWeight: "600" }}>{ghost.title}</Text>
        </View>
      ) : null}
    </View>
  );
}
