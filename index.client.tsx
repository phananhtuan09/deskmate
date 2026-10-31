import type { PluginClientContext } from "@getpaseo/plugin/client";
import { DeskmateHome, DeskmateSidebarItem } from "./client/home";
import { DeskmateSettings } from "./client/settings";
import { deskmateCommand } from "./shared/contract";

export default function contribute(client: PluginClientContext) {
  const removers = [
    client.addScreen({ id: "home", title: "Deskmate", Component: DeskmateHome }),
    client.addSidebarHeaderItem({ id: "deskmate", title: "Deskmate", Component: DeskmateSidebarItem }),
    client.addSettingsScreen({ id: "storage", title: "Deskmate", icon: "FolderOpen", Component: DeskmateSettings }),
    // Runs in the agent composer and does not send text to the agent.
    client.addSlashCommand({
      name: "deskmate",
      description: "Register this agent with Deskmate",
      argumentHint: "",
      context: "agent",
      async onSubmit({ agent, rpc, openScreen }) {
        const result = await rpc(deskmateCommand, { type: "registerSession", sessionId: agent.id });
        if (!result.ok) throw new Error(result.error ?? "Could not register this agent.");
        openScreen({ screenId: "home" });
      },
    }),
  ];
  return () => {
    for (const remove of removers) remove();
  };
}
