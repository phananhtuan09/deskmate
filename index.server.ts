import type { PluginServerContext } from "@getpaseo/plugin/server";
import { startDeskmate } from "./server/runtime";
import { storageSettings } from "./shared/settings";

export default function contribute(server: PluginServerContext) {
  const settings = server.registerSettings(storageSettings);
  return startDeskmate(server, settings);
}
