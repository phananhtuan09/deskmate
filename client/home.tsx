import type { PluginScreenProps, PluginSidebarItemProps } from "@getpaseo/plugin/client";
import { Icon, ScrollView } from "@getpaseo/plugin/client/react-native";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { reminderCount, type TaskColumn } from "../shared/core";
import { AttentionView } from "./attention";
import { useDeskmate } from "./api";
import { TaskBoard } from "./board";
import { errorText } from "./format";
import { MoveDialog, ProjectDialog, RegisterDialog, TaskDialog } from "./forms";
import { ProjectsView } from "./projects";
import { ReminderToasts } from "./toasts";
import { CountBadge, ErrorBanner, PrimaryButton, Segment } from "./widgets";

type ScreenView = "board" | "attention" | "projects";

type Dialog =
  | { type: "task"; taskId: string | null }
  | { type: "project"; projectId: string | null }
  | { type: "register" }
  | { type: "move"; taskId: string };

const VIEWS: readonly { id: ScreenView; label: string }[] = [
  { id: "board", label: "Board" },
  { id: "attention", label: "Attention" },
  { id: "projects", label: "Projects" },
];

function isView(value: string): value is ScreenView {
  return VIEWS.some((entry) => entry.id === value);
}

export function DeskmateHome({ theme, layout, host, navigation }: PluginScreenProps) {
  const desk = useDeskmate(host.id);
  const [view, setView] = useState<ScreenView>("board");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [dragging, setDragging] = useState(false);
  const padding = layout.compact ? 14 : 24;

  if (!desk.state) {
    return (
      <View style={{ flex: 1, padding, gap: 12, backgroundColor: theme.colors.surface0 }}>
        {desk.loading ? <Text style={{ color: theme.colors.foregroundMuted, fontSize: 14 }}>Loading Deskmate…</Text> : <ErrorBanner theme={theme} message={errorText(desk.error)} onRetry={() => { void desk.refetch(); }} />}
      </View>
    );
  }

  const state = desk.state;
  const openSession = navigation ? (sessionId: string) => navigation.openAgent({ agentId: sessionId }) : undefined;
  const task = dialog?.type === "task" && dialog.taskId ? state.tasks.find((entry) => entry.id === dialog.taskId) ?? null : null;
  const project = dialog?.type === "project" && dialog.projectId ? state.projects.find((entry) => entry.id === dialog.projectId) ?? null : null;
  const moving = dialog?.type === "move" ? state.tasks.find((entry) => entry.id === dialog.taskId) ?? null : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface0 }}>
      <ScrollView scrollEnabled={!dragging} style={{ flex: 1 }} contentContainerStyle={{ padding, paddingBottom: layout.compact ? 88 : padding, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: layout.compact ? "column" : "row", alignItems: layout.compact ? "stretch" : "center", gap: 12 }}>
          <Text style={{ color: theme.colors.foreground, fontSize: 20, fontWeight: "600" }}>Deskmate</Text>
          <View style={layout.compact ? undefined : { marginLeft: "auto" }}>
            <Segment theme={theme} value={view} options={VIEWS} onChange={(id) => { if (isView(id)) setView(id); }} />
          </View>
          {!layout.compact && view === "board" ? <PrimaryButton theme={theme} label="New task" icon="Plus" onPress={() => setDialog({ type: "task", taskId: null })} /> : null}
        </View>
        {desk.error ? <ErrorBanner theme={theme} message={errorText(desk.error)} onRetry={() => { void desk.refetch(); }} /> : null}
        {view === "board" ? <TaskBoard theme={theme} layout={layout} state={state} now={desk.now} run={desk.run} onEdit={(taskId) => setDialog({ type: "task", taskId })} onMove={(taskId) => setDialog({ type: "move", taskId })} onCreate={() => setDialog({ type: "task", taskId: null })} onRegister={() => setDialog({ type: "register" })} onOpenSession={openSession} onDragging={setDragging} /> : null}
        {view === "attention" ? <AttentionView theme={theme} state={state} now={desk.now} run={desk.run} onRegister={() => setDialog({ type: "register" })} onOpenSession={openSession} /> : null}
        {view === "projects" ? <ProjectsView theme={theme} state={state} run={desk.run} onCreate={() => setDialog({ type: "project", projectId: null })} onEdit={(projectId) => setDialog({ type: "project", projectId })} /> : null}
      </ScrollView>
      {layout.compact && view === "board" ? (
        <Pressable accessibilityRole="button" accessibilityLabel="New task" onPress={() => setDialog({ type: "task", taskId: null })} style={{ position: "absolute", right: 16, bottom: 16, width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.accent }}>
          <Icon name="Plus" size={20} color={theme.colors.accentForeground} />
        </Pressable>
      ) : null}
      {dialog?.type === "task" ? <TaskDialog theme={theme} state={state} now={desk.now} mode={dialog.taskId ? "edit" : "create"} task={task} busy={desk.busy} onClose={() => setDialog(null)} onSubmit={desk.run} onMove={(column: TaskColumn) => desk.run({ type: "moveTask", taskId: dialog.taskId ?? "", column })} /> : null}
      {dialog?.type === "project" ? <ProjectDialog theme={theme} state={state} mode={dialog.projectId ? "edit" : "create"} project={project} busy={desk.busy} onClose={() => setDialog(null)} onSubmit={desk.run} /> : null}
      {dialog?.type === "register" ? <RegisterDialog theme={theme} state={state} busy={desk.busy} onClose={() => setDialog(null)} onSubmit={(sessionId) => desk.run({ type: "registerSession", sessionId })} onUnregister={(sessionId) => desk.run({ type: "unregisterSession", sessionId })} onOpenSession={openSession} /> : null}
      {dialog?.type === "move" && dialog.taskId ? <MoveDialog theme={theme} task={moving} busy={desk.busy} onClose={() => setDialog(null)} onMove={(column) => desk.run({ type: "moveTask", taskId: dialog.taskId, column })} /> : null}
      <ReminderToasts hostId={host.id} state={state} now={desk.now} />
    </View>
  );
}

export function DeskmateSidebarItem({ theme, host, currentScreen, openScreen }: PluginSidebarItemProps) {
  const desk = useDeskmate(host.id);
  const count = desk.state ? reminderCount(desk.state, desk.now) : 0;
  return (
    <>
      <ReminderToasts hostId={host.id} state={desk.state} now={desk.now} />
      <SidebarRow icon="SquareKanban" label="Deskmate" active={currentScreen?.screenId === "home"} onPress={() => openScreen({ screenId: "home" })} trailing={count > 0 ? <CountBadge theme={theme} value={count} tone="accent" /> : undefined} />
    </>
  );
}
