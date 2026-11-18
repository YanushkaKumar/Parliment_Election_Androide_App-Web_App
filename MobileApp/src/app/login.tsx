import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "@/components/ui";
import { api, errorMessage, USING_EMULATORS } from "@/lib/firebase";
import { colors, radius, shadow } from "@/lib/theme";

// Old NICs: 9 digits + V/X. New NICs: 12 digits.
const NIC_RE = /^(\d{9}[VvXx]|\d{12})$/;

export default function Login() {
  const insets = useSafeAreaInsets();
  const [nic, setNic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const value = nic.trim();
    if (!NIC_RE.test(value)) {
      setError("Enter a valid NIC: 9 digits + V/X, or 12 digits.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.requestOtp({ nic: value });
      router.push({ pathname: "/otp", params: { nic: value, maskedEmail: data.maskedEmail } });
    } catch (e) {
      if (__DEV__) console.warn("[requestOtp] failed", (e as { code?: string })?.code, String(e));
      setError(errorMessage(e, "Could not send the code. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 48 }]}>
          <View style={styles.logo}>
            <Ionicons name="checkbox" size={40} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Your vote,{"\n"}your voice.</Text>
          <Text style={styles.heroSubtitle}>Sign in with your National Identity Card to vote securely.</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.label}>NIC number</Text>
          <View style={[styles.inputWrap, error ? { borderColor: colors.danger } : null]}>
            <Ionicons name="card-outline" size={20} color={colors.muted} />
            <TextInput
              testID="nic-input"
              accessibilityLabel="NIC number"
              value={nic}
              onChangeText={(t) => { setNic(t); setError(null); }}
              placeholder="e.g. 199012345678"
              placeholderTextColor={colors.faint}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              returnKeyType="send"
              onSubmitEditing={submit}
              style={styles.input}
            />
          </View>
          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : (
            <Text style={styles.hint}>We’ll email a 6-digit code to the address registered with your NIC.</Text>
          )}
          <PrimaryButton title="Send verification code" icon="mail-outline" onPress={submit} loading={loading} style={{ marginTop: 20 }} />
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.footerRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.muted} />
            <Text style={styles.footerText}>Protected by one-time codes · Votes are counted on the server</Text>
          </View>
          {USING_EMULATORS && <Text style={styles.devBadge}>DEV · local emulators</Text>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 28, paddingBottom: 80, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  logo: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    marginBottom: 24, ...shadow,
  },
  heroTitle: { color: "#fff", fontSize: 34, fontWeight: "800", lineHeight: 40 },
  heroSubtitle: { color: "rgba(255,255,255,0.88)", fontSize: 15, marginTop: 10, lineHeight: 22 },
  card: {
    marginHorizontal: 20, marginTop: -48, backgroundColor: colors.card, borderRadius: radius.lg, padding: 22, ...shadow,
  },
  label: { fontSize: 13, fontWeight: "700", color: colors.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, backgroundColor: "#FAFAFF",
  },
  input: { flex: 1, height: 54, fontSize: 17, color: colors.text, letterSpacing: 0.5 },
  hint: { fontSize: 13, color: colors.muted, marginTop: 10, lineHeight: 18 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  error: { fontSize: 13, color: colors.danger, flex: 1 },
  footer: { flex: 1, justifyContent: "flex-end", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingTop: 24 },
  footerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { fontSize: 12, color: colors.muted, textAlign: "center", flexShrink: 1 },
  devBadge: { textAlign: "center", fontSize: 11, color: colors.warning, fontWeight: "700" },
});
