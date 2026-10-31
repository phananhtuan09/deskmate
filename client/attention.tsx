import type { PluginTheme } from "@getpaseo/plugin";
import { Icon } from "@getpaseo/plugin/client/react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { attentionKey, visibleAttention, type AttentionItem, type DeskmateState } from "../shared/core";
import type { DeskmateMutation } from "./api";
import { errorText, sinceLabel } from "./format";
import { EmptyNote, ErrorBanner, StatusPill, reasonPresentation } from "./widgets";

function sessionOf(state: DeskmateState, sessionId: string) {
  return state.sessions.find((session) => session.id === sessionId);
}

function AttentionCard({ theme, state, item, now, onDismiss, onOpen }: { theme: PluginTheme; state: DeskmateState; item: AttentionItem; now: Date; onDismiss: () => void; onOpen?: (sessionId: string) => void }) {
  const session = sessionOf(state, item.sessionId);
  const name = session?.label || item.sessionId;
  const meta = [session?.provider, session?.workspace].filter(Boolean).join(" · ");
  const [dismissFocused, setDismissFocused] = useState(false);
  const [openFocused, setOpenFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <View style={{ flexGrow: 1, flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: hovered && onOpen ? theme.colors.surface1 : theme.colors.surface0, borderColor: openFocused ? theme.colors.accent : theme.colors.border, borderWidth: openFocused ? 2 : 1, borderRadius: 8, padding: 12 }}>
      <Pressable accessibilityRole={onOpen ? "button" : undefined} accessibilityLabel={onOpen ? `Open ${name}` : undefined} disabled={!onOpen} onPress={() => onOpen?.(item.sessionId)} onFocus={() => setOpenFocused(true)} onBlur={() => setOpenFocused(false)} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={{ flex: 1, gap: 6, cursor: onOpen ? "pointer" : "auto" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <StatusPill theme={theme} reason={item.reason} />
          <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>{sinceLabel(item.since, now)}</Text>
        </View>
        <Text style={{ color: theme.colors.foreground, fontSize: 14, fontWeight: "600" }}>{name}</Text>
        <Text style={{ color: theme.colors.foreground, fontSize: 13 }}>{item.detail || reasonPresentation(item.reason).long}</Text>
        {meta ? <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>{meta}</Text> : null}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Dismiss ${name}`} onPress={onDismiss} onFocus={() => setDismissFocused(true)} onBlur={() => setDismissFocused(false)} style={{ borderRadius: 4, padding: 2, borderWidth: dismissFocused ? 2 : 0, borderColor: theme.colors.accent }}>
        <Icon name="X" size={14} color={theme.colors.foregroundMuted} />
      </Pressable>
    </View>
  );
}

function useDismiss(run: (command: DeskmateMutation) => Promise<unknown>) {
  const [error, setError] = useState<string | null>(null);
  async function dismiss(item: AttentionItem) {
    setError(null);
    try {
      await run({ type: "dismissAttention", sessionId: item.sessionId, reason: item.reason, since: item.since, ...(item.requestId ? { requestId: item.requestId } : {}) });
    } catch (caught) {
      setError(errorText(caught));
    }
  }
  return { error, dismiss };
}

export function AttentionStrip({ theme, layout, state, now, run, onOpenSession }: { theme: PluginTheme; layout: { compact: boolean }; state: DeskmateState; now: Date; run: (command: DeskmateMutation) => Promise<unknown>; onOpenSession?: (sessionId: string) => void }) {
  const items = visibleAttention(state.attention, state.dismissed);
  const { error, dismiss } = useDismiss(run);
  return (
    <View style={{ backgroundColor: theme.colors.surface1, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 10, padding: 12, gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <Icon name="Bell" size={15} color={theme.colors.foreground} />
        <Text style={{ color: theme.colors.foreground, fontSize: 13, fontWeight: "600" }}>Needs attention</Text>
        <View style={{ minWidth: 18, borderRadius: 10, paddingHorizontal: 7, backgroundColor: theme.colors.surface2, alignItems: "center" }}>
          <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12, fontVariant: ["tabular-nums"] }}>{items.length}</Text>
        </View>
      </View>
      {error ? <ErrorBanner theme={theme} message={error} /> : null}
      {items.length === 0 ? <EmptyNote theme={theme} message="All registered sessions are fine." /> : (
        <View style={{ flexDirection: layout.compact ? "column" : "row", flexWrap: "wrap", gap: 10 }}>
          {items.map((item) => (
            <View key={attentionKey(item)} style={{ flexGrow: 1, flexBasis: layout.compact ? "auto" : 240 }}>
              <AttentionCard theme={theme} state={state} item={item} now={now} onOpen={onOpenSession} onDismiss={() => { void dismiss(item); }} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function AttentionView({ theme, state, now, run, onOpenSession }: { theme: PluginTheme; state: DeskmateState; now: Date; run: (command: DeskmateMutation) => Promise<unknown>; onOpenSession?: (sessionId: string) => void }) {
  const items = visibleAttention(state.attention, state.dismissed);
  const { error, dismiss } = useDismiss(run);
  return (
    <View style={{ gap: 16 }}>
      <Text style={{ color: theme.colors.foreground, fontSize: 16, fontWeight: "600" }}>Needs attention</Text>
      {error ? <ErrorBanner theme={theme} message={error} /> : null}
      {items.length === 0 ? <EmptyNote theme={theme} message="Nothing needs you right now." /> : items.map((item) => (
        <AttentionCard key={attentionKey(item)} theme={theme} state={state} item={item} now={now} onOpen={onOpenSession} onDismiss={() => { void dismiss(item); }} />
      ))}
    </View>
  );
}
