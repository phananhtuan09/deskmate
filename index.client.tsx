import type { PluginClientContext } from "@getpaseo/plugin/client";
import { DeskmateHome, DeskmateSidebarItem } from "./client/home";

export default function contribute(client: PluginClientContext) {
  const removers = [
    client.addScreen({ id: "home", title: "Deskmate", Component: DeskmateHome }),
    client.addSidebarHeaderItem({ id: "deskmate", title: "Deskmate", Component: DeskmateSidebarItem }),
  ];
  return () => { for (const remove of removers) remove(); };
}
