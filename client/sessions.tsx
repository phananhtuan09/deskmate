import type { PluginTheme } from "@getpaseo/plugin";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { visibleAttention, type DeskmateState } from "../shared/core";
import type { DeskmateMutation } from "./api";
import { errorText } from "./format";
import { EmptyNote, ErrorBanner, GhostButton, PrimaryButton, TextField } from "./widgets";

function SessionRow({ theme, name, meta, waiting, onOpen, onUnregister }: { theme: PluginTheme; name: string; meta: string; waiting: number; onOpen?: () => void; onUnregister: () => void }) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, borderWidth: focused ? 2 : 1, borderColor: focused ? theme.colors.accent : theme.colors.border, borderRadius: 8, padding: 12, backgroundColor: hovered && onOpen ? theme.colors.surface2 : theme.colors.surface1 }}>
      <Pressable accessibilityRole={onOpen ? "button" : undefined} accessibilityLabel={onOpen ? `Open ${name}` : undefined} disabled={!onOpen} onPress={onOpen} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={{ flex: 1, gap: 4, cursor: onOpen ? "pointer" : "auto" }}>
        <Text style={{ color: theme.colors.foreground, fontSize: 14, fontWeight: "600" }}>{name}</Text>
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>{meta}</Text>
        {waiting > 0 ? <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>{waiting} waiting</Text> : null}
      </Pressable>
      <GhostButton theme={theme} label="Unregister" tone="danger" onPress={onUnregister} />
    </View>
  );
}

export function SessionsView({ theme, state, busy, run, onOpenSession }: { theme: PluginTheme; state: DeskmateState; busy: boolean; run: (command: DeskmateMutation) => Promise<unknown>; onOpenSession?: (sessionId: string) => void }) {
  const items = visibleAttention(state.attention, state.dismissed);
  const [agentId, setAgentId] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function register() {
    if (saving || busy) return;
    const sessionId = agentId.trim();
    if (!sessionId) {
      setFieldError("Enter an agent id.");
      return;
    }
    setSaving(true);
    setFieldError(null);
    setNotice(null);
    try {
      await run({ type: "registerSession", sessionId });
      setAgentId("");
      setNotice("Registered.");
    } catch (caught) {
      setFieldError(errorText(caught));
    } finally {
      setSaving(false);
    }
  }

  async function unregister(sessionId: string) {
    setRowError(null);
    try {
      await run({ type: "unregisterSession", sessionId });
    } catch (caught) {
      setRowError(errorText(caught));
    }
  }

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 10 }}>
        <Text style={{ color: theme.colors.foreground, fontSize: 16, fontWeight: "600" }}>Register a session</Text>
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: 13 }}>Paste a Paseo agent id, or use the Deskmate pill in that agent's chat. Deskmate only observes registered sessions.</Text>
        <TextField theme={theme} label="Agent id" value={agentId} onChangeText={setAgentId} placeholder="agent id" error={fieldError} />
        {notice ? <Text style={{ color: theme.colors.statusSuccess, fontSize: 13 }}>{notice}</Text> : null}
        <View style={{ flexDirection: "row" }}>
          <PrimaryButton theme={theme} label={saving ? "Registering…" : "Register"} onPress={() => { void register(); }} disabled={saving || busy} />
        </View>
      </View>
      <Text style={{ color: theme.colors.foreground, fontSize: 16, fontWeight: "600" }}>Registered sessions</Text>
      {rowError ? <ErrorBanner theme={theme} message={rowError} /> : null}
      {state.sessions.length === 0 ? <EmptyNote theme={theme} message="No sessions registered." /> : state.sessions.map((session) => {
        const name = session.label || session.id;
        const waiting = items.filter((item) => item.sessionId === session.id).length;
        return (
          <SessionRow key={session.id} theme={theme} name={name} meta={[session.provider, session.workspace].filter(Boolean).join(" · ") || session.id} waiting={waiting} onOpen={onOpenSession ? () => onOpenSession(session.id) : undefined} onUnregister={() => { void unregister(session.id); }} />
        );
      })}
    </View>
  );
}
