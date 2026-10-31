import { defineSettings } from "@getpaseo/plugin";
import { z } from "zod";

// Empty directory means ~/.deskmate on the daemon machine.
export const storageSettings = defineSettings({
  id: "storage",
  scope: "host",
  version: 1,
  schema: z.object({
    directory: z.string().default(""),
  }),
});
