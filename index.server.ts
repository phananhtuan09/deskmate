import type { PluginServerContext } from "@getpaseo/plugin/server";

// The Paseo adapter will register the file store RPCs and map lifecycle events to core SessionEvents here.
export default function contribute(_server: PluginServerContext) {
  return () => {};
}
