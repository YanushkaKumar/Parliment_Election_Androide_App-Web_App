import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator, Animated, Image, Modal, Pressable, StyleSheet, Text, View,
  type StyleProp, type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { imageUri } from "@/lib/mappers";
import { colors, radius, shadow } from "@/lib/theme";
import type { Status } from "@/lib/electionTime";

type IconName = keyof typeof Ionicons.glyphMap;

export function PrimaryButton({
  title, onPress, loading, disabled, icon, variant = "primary", style,
}: {
  title: string; onPress: () => void; loading?: boolean; disabled?: boolean; icon?: IconName;
  variant?: "primary" | "secondary" | "ghost"; style?: StyleProp<ViewStyle>;
}) {
  const inactive = disabled || loading;
  const content = (
    <View style={styles.btnInner}>
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : colors.primary} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={variant === "primary" ? "#fff" : colors.primary} />}
          <Text style={[styles.btnText, variant !== "primary" && { color: colors.primary }]}>{title}</Text>
        </>
      )}
    </View>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!inactive }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [{ opacity: inactive ? 0.55 : pressed ? 0.85 : 1, borderRadius: radius.md }, style]}
    >
      {variant === "primary" ? (
        <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.btn, variant === "secondary" ? styles.btnSecondary : null]}>{content}</View>
      )}
    </Pressable>
  );
}

/** Gradient header that extends under the status bar. */
export function GradientHeader({
  title, subtitle, left, right, children,
}: { title: string; subtitle?: string; left?: ReactNode; right?: ReactNode; children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={colors.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.headerRow}>
        {left}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={2}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </LinearGradient>
  );
}

export function HeaderIconButton({ icon, onPress, label }: { icon: IconName; onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.headerIcon, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icon} size={22} color="#fff" />
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

export function Avatar({ base64, name, size = 56 }: { base64?: string; name: string; size?: number }) {
  const uri = imageUri(base64);
  const r = size / 2;
  return uri ? (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: r, backgroundColor: colors.infoBg }} />
  ) : (
    <LinearGradient colors={colors.gradient} style={{ width: size, height: size, borderRadius: r, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontWeight: "800", fontSize: size * 0.36 }}>{initials(name)}</Text>
    </LinearGradient>
  );
}

export function PartySymbol({ base64, size = 22 }: { base64?: string; size?: number }) {
  const uri = imageUri(base64);
  if (!uri) return <Ionicons name="flag" size={size * 0.8} color={colors.faint} />;
  return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: 4 }} resizeMode="contain" />;
}

const STATUS: Record<Status, { label: string; fg: string; bg: string; icon: IconName }> = {
  open: { label: "Voting open", fg: "#047857", bg: colors.successBg, icon: "radio-button-on" },
  upcoming: { label: "Upcoming", fg: "#B45309", bg: colors.warningBg, icon: "time-outline" },
  closed: { label: "Closed", fg: "#4B5563", bg: "#F3F4F6", icon: "lock-closed-outline" },
  invalid: { label: "Invalid date", fg: colors.danger, bg: colors.dangerBg, icon: "alert-circle-outline" },
};

export function StatusChip({ status }: { status: Status }) {
  const s = STATUS[status];
  return (
    <View style={[styles.chip, { backgroundColor: s.bg }]}>
      <Ionicons name={s.icon} size={12} color={s.fg} />
      <Text style={[styles.chipText, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[styles.filterChip, active && styles.filterChipActive]}
    >
      <Text style={[styles.filterChipText, active && { color: "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

/** Pulsing green dot shown next to data that updates in real time. */
export function LiveBadge({ light }: { light?: boolean }) {
  const [pulse] = useState(() => new Animated.Value(0.4));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={[styles.live, light && { backgroundColor: "rgba(255,255,255,0.2)" }]}>
      <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
      <Text style={[styles.liveText, light && { color: "#fff" }]}>LIVE</Text>
    </View>
  );
}

export function EmptyState({ icon, title, message }: { icon: IconName; title: string; message?: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
    </View>
  );
}

/** Bottom sheet style modal. */
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.sheetHandle} />
        {children}
      </View>
    </Modal>
  );
}

export function ProgressDots({ used, total }: { used: number; total: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.dot, i < used ? styles.dotUsed : styles.dotFree]}>
          {i < used && <Ionicons name="checkmark" size={12} color={colors.primary} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { height: 54, borderRadius: radius.md, paddingHorizontal: 20, justifyContent: "center" },
  btnSecondary: { backgroundColor: colors.infoBg },
  btnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
  header: { paddingHorizontal: 20, paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  headerSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: 2 },
  headerIcon: {
    width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, ...shadow },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill,
  },
  chipText: { fontSize: 12, fontWeight: "700" },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 13, fontWeight: "600", color: colors.text },
  live: {
    flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.pill, backgroundColor: colors.successBg, alignSelf: "flex-start",
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  liveText: { fontSize: 11, fontWeight: "800", color: "#047857", letterSpacing: 0.8 },
  empty: { alignItems: "center", padding: 32, gap: 8 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.infoBg,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.text, textAlign: "center" },
  emptyMessage: { fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 20 },
  backdrop: { flex: 1, backgroundColor: "rgba(17,24,39,0.45)" },
  sheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 10,
  },
  sheetHandle: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 16 },
  dot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  dotUsed: { backgroundColor: "#fff" },
  dotFree: { borderWidth: 2, borderColor: "rgba(255,255,255,0.6)" },
});
