import type { PluginButton, PluginButtonIconProps, PluginButtonRegistration, PluginClientContext } from "@getpaseo/plugin/client";
import { Icon } from "@getpaseo/plugin/client/react-native";
import { View } from "react-native";
import { deskmateCommand } from "../shared/contract";

const REFRESH_MS = 2000;

function ActiveIcon({ theme, size }: PluginButtonIconProps) {
  // Paseo owns the pill background and border, so the active state draws a filled badge behind the icon.
  return (
    <View style={{ width: size + 6, height: size + 6, margin: -3, borderRadius: (size + 6) / 2, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.statusSuccess }}>
      <Icon name="BellRing" size={size - 2} color={theme.colors.surface0} />
    </View>
  );
}

function InactiveIcon({ theme, size }: PluginButtonIconProps) {
  return <Icon name="BellOff" size={size} color={theme.colors.foregroundMuted} />;
}

// A filled green badge marks a registered agent; a muted crossed bell marks an unregistered one.
function buttonFor(registered: boolean, toggle: () => Promise<void>): PluginButton {
  return registered
    ? { title: "Registered with Deskmate. Click to unregister.", icon: ActiveIcon, label: "Deskmate", behavior: { kind: "action", onPress: toggle } }
    : { title: "Not registered with Deskmate. Click to register.", icon: InactiveIcon, label: "Deskmate", behavior: { kind: "action", onPress: toggle } };
}

// One composer pill per agent shows whether that agent is registered with Deskmate and toggles it.
export function contributeComposerPills(client: PluginClientContext): () => void {
  const pills = new Map<string, { registration: PluginButtonRegistration; registered: boolean }>();
  const lifetime = new AbortController();
  let registeredIds = new Set<string>();

  async function readRegistered() {
    const result = await client.rpc(deskmateCommand, { type: "read" });
    if (!result.ok || !result.state) return;
    registeredIds = new Set(result.state.sessions.map((session) => session.id));
  }

  function sync() {
    for (const [agentId, pill] of pills) {
      const registered = registeredIds.has(agentId);
      if (registered === pill.registered) continue;
      pill.registered = registered;
      pill.registration.update(buttonFor(registered, () => toggle(agentId)));
    }
  }

  async function toggle(agentId: string) {
    const registered = registeredIds.has(agentId);
    const result = await client.rpc(deskmateCommand, registered ? { type: "unregisterSession", sessionId: agentId } : { type: "registerSession", sessionId: agentId });
    if (!result.ok) throw new Error(result.error ?? "Could not update Deskmate.");
    await readRegistered();
    sync();
  }

  function add(agent: { id: string; workspaceId?: string | null }) {
    if (lifetime.signal.aborted || !agent.workspaceId || pills.has(agent.id)) return;
    const agentId = agent.id;
    const registered = registeredIds.has(agentId);
    pills.set(agentId, { registered, registration: client.addComposerPill({ id: "register", workspaceId: agent.workspaceId, agentId, button: buttonFor(registered, () => toggle(agentId)) }) });
  }

  function remove(agentId: string) {
    pills.get(agentId)?.registration.remove();
    pills.delete(agentId);
  }

  function removeAll() {
    for (const agentId of [...pills.keys()]) remove(agentId);
  }

  const timer = setInterval(() => {
    readRegistered().then(sync).catch(() => undefined);
  }, REFRESH_MS);

  void readRegistered()
    .catch(() => undefined)
    .then(() => client.paseo.agents.list({ subscribe: {}, signal: lifetime.signal }))
    .then(({ subscription }) => {
      subscription.subscribe({
        snapshot: ({ entries }) => {
          removeAll();
          for (const { agent } of entries) add(agent);
        },
        update: (message) => {
          if (message.type !== "agent_update") return;
          const update = message.payload;
          if (update.kind === "upsert") add(update.agent);
          else remove(update.agentId);
        },
      });
      return undefined;
    })
    .catch((error: unknown) => {
      if (!lifetime.signal.aborted) console.error("Deskmate could not observe agents", error);
    });

  return () => {
    lifetime.abort();
    clearInterval(timer);
    removeAll();
  };
}
