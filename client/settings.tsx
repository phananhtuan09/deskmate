import type { PluginSurfaceProps } from "@getpaseo/plugin/client";
import { useSettings } from "@getpaseo/plugin/client";
import { SettingsCard, SettingsGroup, SettingsInput, SettingsAction } from "@getpaseo/plugin/client/ui";
import { useState } from "react";
import { Text, View } from "react-native";
import { isFullPath } from "../shared/core";
import { storageSettings } from "../shared/settings";
import { GhostButton } from "./widgets";

function StorageForm({ theme, initial, problem, saving, onSave }: { theme: PluginSurfaceProps["theme"]; initial: string; problem: string | null; saving: boolean; onSave: (directory: string) => Promise<boolean> }) {
  const [directory, setDirectory] = useState(initial);
  const [error, setError] = useState<string | null>(problem);
  const [saved, setSaved] = useState(false);

  async function save() {
    const next = directory.trim();
    if (next && !isFullPath(next)) {
      setSaved(false);
      setError("State directory must be a full path.");
      return;
    }
    setError(null);
    const ok = await onSave(next);
    setSaved(ok);
    if (!ok) setError("Could not save settings.");
  }

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: theme.colors.surface0 }}>
      <SettingsGroup title="State file" info={<Text style={{ color: theme.colors.foregroundMuted, fontSize: 13 }}>Leave this empty to use ~/.deskmate on the daemon machine. A different directory is a different state file. Only one Paseo daemon should write a directory.</Text>}>
        <SettingsCard>
          <SettingsInput label="Directory" initialValue={initial} onChangeText={setDirectory} placeholder="/full/path/to/deskmate" error={error} />
          <SettingsAction label={saved ? "Saved. The next read uses this directory." : "Save the directory"} actionLabel={saving ? "Saving…" : "Save"} onPress={() => { void save(); }} disabled={saving} />
        </SettingsCard>
      </SettingsGroup>
    </View>
  );
}

export function DeskmateSettings({ theme }: PluginSurfaceProps) {
  const settings = useSettings(storageSettings);
  if (settings.status === "loading") {
    return <View style={{ flex: 1, padding: 24, backgroundColor: theme.colors.surface0 }}><Text style={{ color: theme.colors.foregroundMuted, fontSize: 14 }}>Loading settings…</Text></View>;
  }
  if (settings.status === "error") {
    return (
      <View style={{ flex: 1, padding: 24, gap: 12, backgroundColor: theme.colors.surface0 }}>
        <Text style={{ color: theme.colors.statusDanger, fontSize: 14 }}>{settings.error}</Text>
        <GhostButton theme={theme} label="Retry" onPress={() => { void settings.reload(); }} />
      </View>
    );
  }
  return (
    <StorageForm
      key={settings.revision}
      theme={theme}
      initial={settings.status === "ready" ? settings.values.directory : ""}
      problem={settings.status === "invalid" ? settings.error : null}
      saving={settings.saving}
      onSave={(directory) => settings.save({ directory }, settings.revision)}
    />
  );
}
