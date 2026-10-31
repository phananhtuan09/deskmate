import type { PluginTheme } from "@getpaseo/plugin";
import { useState } from "react";
import { Text, View } from "react-native";
import type { DeskmateState } from "../shared/core";
import type { DeskmateMutation } from "./api";
import { errorText } from "./format";
import { EmptyNote, GhostButton, PrimaryButton } from "./widgets";

export function ProjectsView({ theme, state, run, onCreate, onEdit }: { theme: PluginTheme; state: DeskmateState; run: (command: DeskmateMutation) => Promise<unknown>; onCreate: () => void; onEdit: (projectId: string) => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  async function remove(projectId: string) {
    setErrors((current) => ({ ...current, [projectId]: "" }));
    try {
      await run({ type: "deleteProject", projectId });
    } catch (caught) {
      setErrors((current) => ({ ...current, [projectId]: errorText(caught) }));
    }
  }

  async function sync() {
    if (syncing) return;
    setSyncing(true);
    setSyncNote(null);
    try {
      await run({ type: "syncProjects" });
      setSyncNote("Synced.");
    } catch (caught) {
      setSyncNote(errorText(caught));
    } finally {
      setSyncing(false);
    }
  }

  const syncFailed = syncNote !== null && syncNote !== "Synced.";

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <Text style={{ flexGrow: 1, color: theme.colors.foreground, fontSize: 16, fontWeight: "600" }}>Projects</Text>
        <GhostButton theme={theme} label={syncing ? "Syncing…" : "Sync"} icon="RefreshCw" accessibilityLabel="Sync projects from Paseo" onPress={() => { void sync(); }} disabled={syncing} />
        <PrimaryButton theme={theme} label="New project" icon="Plus" onPress={onCreate} />
      </View>
      {syncNote ? <Text style={{ color: syncFailed ? theme.colors.statusDanger : theme.colors.foregroundMuted, fontSize: 13 }}>{syncNote}</Text> : null}
      {state.projects.length === 0 ? <EmptyNote theme={theme} message="No projects yet." /> : state.projects.map((project) => (
        <View key={project.id} style={{ gap: 6, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12, backgroundColor: theme.colors.surface1 }}>
          <Text style={{ color: theme.colors.foreground, fontSize: 14, fontWeight: "600" }}>{project.name}</Text>
          <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>{project.path}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <GhostButton theme={theme} label="Edit" onPress={() => onEdit(project.id)} />
            <GhostButton theme={theme} label="Delete" tone="danger" onPress={() => { void remove(project.id); }} />
          </View>
          {errors[project.id] ? <Text style={{ color: theme.colors.statusDanger, fontSize: 13 }}>{errors[project.id]}</Text> : null}
        </View>
      ))}
    </View>
  );
}
