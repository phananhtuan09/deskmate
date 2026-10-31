import type { PluginTheme } from "@getpaseo/plugin";
import { Icon, TextInput } from "@getpaseo/plugin/client/react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { AttentionReason } from "../shared/core";

const REASONS: Record<AttentionReason, { label: string; long: string; icon: string; tone: "statusWarning" | "accent" | "statusDanger" | "foregroundMuted" }> = {
  permission_pending: { label: "Permission", long: "Waiting for your permission", icon: "Shield", tone: "statusWarning" },
  turn_failed: { label: "Failed", long: "Turn failed", icon: "AlertTriangle", tone: "statusDanger" },
  turn_canceled: { label: "Canceled", long: "Turn canceled", icon: "Ban", tone: "statusWarning" },
  session_ended: { label: "Closed", long: "Session closed", icon: "XCircle", tone: "foregroundMuted" },
};

export function reasonPresentation(reason: AttentionReason) {
  return REASONS[reason];
}

export function PrimaryButton({ theme, label, icon, onPress, disabled }: { theme: PluginTheme; label: string; icon?: string; onPress: () => void; disabled?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: Boolean(disabled) }} disabled={disabled} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.accent, opacity: disabled ? 0.5 : 1, borderWidth: focused ? 2 : 0, borderColor: theme.colors.foreground }}>
      {icon ? <Icon name={icon} size={15} color={theme.colors.accentForeground} /> : null}
      <Text style={{ color: theme.colors.accentForeground, fontSize: 13, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ theme, label, icon, onPress, disabled, tone = "muted", accessibilityLabel }: { theme: PluginTheme; label: string; icon?: string; onPress: () => void; disabled?: boolean; tone?: "muted" | "danger"; accessibilityLabel?: string }) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const color = tone === "danger" ? theme.colors.statusDanger : theme.colors.foregroundMuted;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled: Boolean(disabled) }} disabled={disabled} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4, borderWidth: focused ? 2 : 0, borderColor: theme.colors.accent, backgroundColor: hovered ? theme.colors.surface2 : undefined, opacity: disabled ? 0.5 : 1 }}>
      {icon ? <Icon name={icon} size={13} color={color} /> : null}
      {label ? <Text style={{ color, fontSize: 12 }}>{label}</Text> : null}
    </Pressable>
  );
}

export function CountBadge({ theme, value, tone }: { theme: PluginTheme; value: number; tone: "muted" | "accent" }) {
  return (
    <View style={{ minWidth: 18, borderRadius: 10, paddingHorizontal: 7, backgroundColor: tone === "accent" ? theme.colors.accent : theme.colors.surface2, alignItems: "center" }}>
      <Text style={{ color: tone === "accent" ? theme.colors.accentForeground : theme.colors.foregroundMuted, fontSize: 12, fontVariant: ["tabular-nums"] }}>{value}</Text>
    </View>
  );
}

export function StatusPill({ theme, reason }: { theme: PluginTheme; reason: AttentionReason }) {
  const presentation = REASONS[reason];
  const color = theme.colors[presentation.tone];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: theme.colors.surface2 }}>
      <Icon name={presentation.icon} size={12} color={color} />
      <Text style={{ color, fontSize: 12, fontWeight: "600" }}>{presentation.label}</Text>
    </View>
  );
}

export function TextField({ theme, label, value, onChangeText, placeholder, multiline, error }: { theme: PluginTheme; label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; multiline?: boolean; error?: string | null }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>{label}</Text>
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.colors.foregroundMuted} multiline={multiline} autoCorrect={false} autoCapitalize="none" onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ color: theme.colors.foreground, backgroundColor: theme.colors.surface0, borderColor: error ? theme.colors.statusDanger : focused ? theme.colors.accent : theme.colors.border, borderWidth: focused || error ? 2 : 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, minHeight: multiline ? 72 : undefined, textAlignVertical: multiline ? "top" : "center" }} />
      {error ? <Text style={{ color: theme.colors.statusDanger, fontSize: 12 }}>{error}</Text> : null}
    </View>
  );
}

export function Choice({ theme, label, selected, onPress }: { theme: PluginTheme; label: string; selected: boolean; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: selected ? theme.colors.accent : theme.colors.surface2, borderWidth: focused ? 2 : 1, borderColor: focused ? theme.colors.foreground : theme.colors.border }}>
      <Text style={{ color: selected ? theme.colors.accentForeground : theme.colors.foreground, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function ErrorBanner({ theme, message, onRetry }: { theme: PluginTheme; message: string; onRetry?: () => void }) {
  return (
    <View style={{ borderRadius: 8, borderWidth: 1, borderColor: theme.colors.statusDanger, backgroundColor: theme.colors.surface1, padding: 12, gap: 8 }}>
      <Text style={{ color: theme.colors.statusDanger, fontSize: 13 }}>{message}</Text>
      {onRetry ? <GhostButton theme={theme} label="Retry" onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyNote({ theme, message }: { theme: PluginTheme; message: string }) {
  return <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12, paddingVertical: 8 }}>{message}</Text>;
}

function SegmentTab({ theme, label, selected, onPress }: { theme: PluginTheme; label: string; selected: boolean; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ borderRadius: 6, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: selected ? theme.colors.surface2 : theme.colors.surface1, borderWidth: 2, borderColor: focused ? theme.colors.accent : selected ? theme.colors.surface2 : theme.colors.surface1 }}>
      <Text style={{ color: selected ? theme.colors.foreground : theme.colors.foregroundMuted, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Segment({ theme, value, options, onChange }: { theme: PluginTheme; value: string; options: readonly { id: string; label: string }[]; onChange: (id: string) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", backgroundColor: theme.colors.surface1, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 8, padding: 2, gap: 2 }}>
      {options.map((option) => <SegmentTab key={option.id} theme={theme} label={option.label} selected={option.id === value} onPress={() => onChange(option.id)} />)}
    </View>
  );
}
