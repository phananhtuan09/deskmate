import type { PluginScreenProps, PluginSidebarItemProps } from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { Text, View } from "react-native";

// Placeholder until the task board and Need attention screens land (docs/plans/active/v1-base.md).
export function DeskmateHome({ theme, layout }: PluginScreenProps) {
  return (
    <View style={{ flex: 1, padding: layout.compact ? 12 : 24, backgroundColor: theme.colors.surface0 }}>
      <Text style={{ color: theme.colors.foreground, fontSize: 16 }}>Deskmate</Text>
      <Text style={{ color: theme.colors.foregroundMuted, marginTop: 8 }}>Task board and Need attention are coming.</Text>
    </View>
  );
}

export function DeskmateSidebarItem({ currentScreen, openScreen }: PluginSidebarItemProps) {
  return <SidebarRow icon="SquareKanban" label="Deskmate" active={currentScreen?.screenId === "home"} onPress={() => openScreen({ screenId: "home" })} />;
}
