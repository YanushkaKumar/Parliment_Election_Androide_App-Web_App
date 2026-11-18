import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { signInWithCustomToken } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "@/components/ui";
import { api, auth, errorMessage } from "@/lib/firebase";
import { colors, radius } from "@/lib/theme";

const LENGTH = 6;
const RESEND_SECONDS = 60;

export default function Otp() {
  const insets = useSafeAreaInsets();
  const { nic, maskedEmail } = useLocalSearchParams<{ nic: string; maskedEmail?: string }>();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [notice, setNotice] = useState<string | null>(null);
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async (value = code) => {
    if (value.length !== LENGTH || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.verifyOtp({ nic, otp: value });
      await signInWithCustomToken(auth, data.token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/home");
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(errorMessage(e, "Verification failed. Please try again."));
      setCode("");
      input.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const onChange = (t: string) => {
    const digits = t.replace(/\D/g, "").slice(0, LENGTH);
    setCode(digits);
    setError(null);
    if (digits.length === LENGTH) verify(digits);
  };

  const resend = async () => {
    setNotice(null);
    setError(null);
    try {
      await api.requestOtp({ nic });
      setCooldown(RESEND_SECONDS);
      setCode("");
      setNotice("A new code has been sent.");
    } catch (e) {
      setError(errorMessage(e, "Could not resend the code."));
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar style="dark" />
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back} hitSlop={10}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <View style={styles.iconWrap}>
        <Ionicons name="mail-open-outline" size={34} color={colors.primary} />
      </View>
      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code we sent to{"\n"}
        <Text style={{ fontWeight: "700", color: colors.text }}>{maskedEmail || "your registered email"}</Text>
      </Text>

      {/* One hidden input drives six visual boxes: supports paste and SMS/email autofill. */}
      <Pressable onPress={() => input.current?.focus()} style={styles.boxes} accessibilityLabel="Verification code">
        {Array.from({ length: LENGTH }, (_, i) => {
          const focused = i === code.length && !loading;
          return (
            <View key={i} style={[styles.box, focused && styles.boxFocused, error ? styles.boxError : null, code[i] ? styles.boxFilled : null]}>
              <Text style={styles.boxText}>{code[i] ?? ""}</Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={input}
        testID="otp-input"
        accessibilityLabel="Verification code input"
        value={code}
        onChangeText={onChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={LENGTH}
        autoFocus
        style={styles.hiddenInput}
      />

      {error ? (
        <View style={styles.msgRow}><Ionicons name="alert-circle" size={16} color={colors.danger} /><Text style={[styles.msg, { color: colors.danger }]}>{error}</Text></View>
      ) : notice ? (
        <View style={styles.msgRow}><Ionicons name="checkmark-circle" size={16} color={colors.success} /><Text style={[styles.msg, { color: colors.success }]}>{notice}</Text></View>
      ) : <View style={{ height: 22 }} />}

      <PrimaryButton title="Verify & continue" icon="shield-checkmark-outline" onPress={() => verify()} loading={loading} disabled={code.length !== LENGTH} style={{ marginTop: 24, alignSelf: "stretch" }} />

      <View style={styles.resendRow}>
        <Text style={styles.resendText}>Didn’t get it?</Text>
        {cooldown > 0 ? (
          <Text style={[styles.resendText, { fontWeight: "700" }]}>Resend in {cooldown}s</Text>
        ) : (
          <Pressable accessibilityRole="button" onPress={resend} hitSlop={8}>
            <Text style={styles.resendLink}>Resend code</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, alignItems: "center" },
  back: { alignSelf: "flex-start", width: 44, height: 44, justifyContent: "center" },
  iconWrap: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: colors.infoBg,
    alignItems: "center", justifyContent: "center", marginTop: 24, marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 15, color: colors.muted, textAlign: "center", marginTop: 8, lineHeight: 22 },
  boxes: { flexDirection: "row", gap: 10, marginTop: 32 },
  box: {
    width: 48, height: 58, borderRadius: radius.sm + 2, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.card, alignItems: "center", justifyContent: "center",
  },
  boxFocused: { borderColor: colors.primary, borderWidth: 2 },
  boxFilled: { borderColor: colors.primary, backgroundColor: colors.infoBg },
  boxError: { borderColor: colors.danger },
  boxText: { fontSize: 24, fontWeight: "800", color: colors.text },
  hiddenInput: { position: "absolute", opacity: 0, width: 1, height: 1 },
  msgRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16, minHeight: 22 },
  msg: { fontSize: 14, fontWeight: "600" },
  resendRow: { flexDirection: "row", gap: 6, marginTop: 20, alignItems: "center" },
  resendText: { fontSize: 14, color: colors.muted },
  resendLink: { fontSize: 14, color: colors.primary, fontWeight: "700" },
});
