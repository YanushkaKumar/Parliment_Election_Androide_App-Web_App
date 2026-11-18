import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Card, EmptyState, GradientHeader, HeaderIconButton, LiveBadge, PrimaryButton, Sheet, StatusChip,
} from "@/components/ui";
import { useLiveDoc, useLiveQuery, useNow } from "@/hooks/useLive";
import { closesAt, electionStatus, formatCountdown, formatDate, MAX_VOTES, type Status } from "@/lib/electionTime";
import { toElection, toTally, toVoter } from "@/lib/mappers";
import { useSession } from "@/lib/session";
import { colors, radius } from "@/lib/theme";
import type { Election } from "@/lib/types";

export default function Home() {
  const { voterId, logout } = useSession();
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  const voter = useLiveDoc(voterId ? `voters/${voterId}` : null, toVoter);
  const elections = useLiveQuery("elections", voterId ? {} : null, toElection);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [upcoming, setUpcoming] = useState<Election | null>(null);

  // Recompute once a minute so elections move between groups as time passes.
  const minute = Math.floor(now / 60000);
  const groups = useMemo(() => {
    const g: Record<Status, Election[]> = { open: [], upcoming: [], closed: [], invalid: [] };
    for (const e of elections.data) g[electionStatus(e, minute * 60000)].push(e);
    g.upcoming.sort((a, b) => a.date.localeCompare(b.date));
    g.closed.sort((a, b) => b.date.localeCompare(a.date));
    return g;
  }, [elections.data, minute]);

  if (!voterId) return <Redirect href="/login" />;

  const firstName = voter.data?.name.split(" ")[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <GradientHeader
        title={firstName ? `Hello, ${firstName}` : "Hello"}
        subtitle="Ready to make your voice heard?"
        right={<HeaderIconButton icon="log-out-outline" label="Log out" onPress={() => setConfirmLogout(true)} />}
      >
        {voter.data && (
          <View style={styles.voterCard}>
            <View style={styles.voterIcon}><Ionicons name="person" size={18} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.voterName} numberOfLines={1}>{voter.data.name}</Text>
              <Text style={styles.voterMeta} numberOfLines={1}>
                {voter.data.constituency} · {voter.data.district} · NIC {voter.data.nic}
              </Text>
            </View>
          </View>
        )}
      </GradientHeader>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 12 }}>
        {elections.loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : elections.data.length === 0 ? (
          <EmptyState icon="calendar-outline" title="No elections yet" message="Elections will appear here as soon as they are announced." />
        ) : (
          <>
            {groups.open.length > 0 && (
              <>
                <SectionTitle title="Live now" live />
                {groups.open.map((e) => <OpenElectionCard key={e.id} election={e} voterId={voterId} now={now} />)}
              </>
            )}
            {groups.upcoming.length > 0 && (
              <>
                <SectionTitle title="Upcoming" />
                {groups.upcoming.map((e) => (
                  <ElectionRow key={e.id} election={e} status="upcoming" onPress={() => setUpcoming(e)} />
                ))}
              </>
            )}
            {groups.closed.length > 0 && (
              <>
                <SectionTitle title="Past elections" />
                {groups.closed.map((e) => (
                  <ElectionRow key={e.id} election={e} status="closed" onPress={() => router.push(`/election/${e.id}/results`)} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Sheet visible={confirmLogout} onClose={() => setConfirmLogout(false)}>
        <Text style={styles.sheetTitle}>Log out?</Text>
        <Text style={styles.sheetText}>You’ll need a new verification code to sign in again.</Text>
        <PrimaryButton title="Log out" icon="log-out-outline" onPress={async () => { setConfirmLogout(false); await logout(); router.replace("/login"); }} style={{ marginTop: 20 }} />
        <PrimaryButton title="Cancel" variant="ghost" onPress={() => setConfirmLogout(false)} style={{ marginTop: 8 }} />
      </Sheet>

      <Sheet visible={!!upcoming} onClose={() => setUpcoming(null)}>
        <View style={styles.sheetIcon}><Ionicons name="calendar" size={28} color={colors.warning} /></View>
        <Text style={styles.sheetTitle}>{upcoming?.name}</Text>
        <Text style={styles.sheetText}>
          Voting opens on {upcoming ? formatDate(upcoming.date) : ""} at {upcoming?.startTime} and closes at {upcoming?.endTime} (Sri Lanka time).
        </Text>
        <PrimaryButton title="Got it" onPress={() => setUpcoming(null)} style={{ marginTop: 20 }} />
      </Sheet>
    </View>
  );
}

function SectionTitle({ title, live }: { title: string; live?: boolean }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {live && <LiveBadge />}
    </View>
  );
}

function OpenElectionCard({ election, voterId, now }: { election: Election; voterId: string; now: number }) {
  const tally = useLiveDoc(`voterVotes/${election.id}_${voterId}`, toTally);
  const used = tally.data?.count ?? 0;
  const done = used >= MAX_VOTES;
  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <View style={{ padding: 18, gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <StatusChip status="open" />
          <View style={styles.timer}>
            <Ionicons name="hourglass-outline" size={13} color={colors.danger} />
            <Text style={styles.timerText}>Closes in {formatCountdown(closesAt(election) - now)}</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>{election.name}</Text>
        <Text style={styles.cardMeta}>{formatDate(election.date)} · {election.startTime}–{election.endTime}</Text>

        <View style={styles.progressWrap}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={styles.progressLabel}>{done ? "All votes cast" : "Your votes"}</Text>
            <Text style={styles.progressLabel}>{used}/{MAX_VOTES}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(used / MAX_VOTES) * 100}%` }, done && { backgroundColor: colors.success }]} />
          </View>
        </View>
      </View>
      <View style={styles.cardActions}>
        <PrimaryButton
          title={done ? "View my ballot" : used > 0 ? "Continue voting" : "Vote now"}
          icon={done ? "checkmark-done" : "checkbox-outline"}
          onPress={() => router.push(`/election/${election.id}/vote`)}
          style={{ flex: 1 }}
        />
        <PrimaryButton
          title="Results"
          icon={done ? "stats-chart" : "lock-closed-outline"}
          variant="secondary"
          disabled={!done}
          onPress={() => router.push(`/election/${election.id}/results`)}
          style={{ flex: 1 }}
        />
      </View>
      {!done && <Text style={styles.cardFootnote}>Live results unlock after you’ve used all {MAX_VOTES} votes.</Text>}
    </Card>
  );
}

function ElectionRow({ election, status, onPress }: { election: Election; status: Status; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={election.name} onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
      <Card style={[styles.row, status === "upcoming" && { opacity: 0.9 }]}>
        <View style={[styles.rowIcon, { backgroundColor: status === "upcoming" ? colors.warningBg : "#F3F4F6" }]}>
          <Ionicons name={status === "upcoming" ? "calendar-outline" : "trophy-outline"} size={22} color={status === "upcoming" ? colors.warning : colors.muted} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.rowTitle} numberOfLines={2}>{election.name}</Text>
          <Text style={styles.cardMeta}>
            {formatDate(election.date)}{status === "upcoming" ? ` · opens ${election.startTime}` : ""}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <StatusChip status={status} />
          {status === "closed" && <Text style={styles.rowLink}>See results ›</Text>}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  voterCard: {
    flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18, padding: 12,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: radius.md,
  },
  voterIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  voterName: { color: "#fff", fontWeight: "700", fontSize: 15 },
  voterMeta: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 1 },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  cardTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
  cardMeta: { fontSize: 13, color: colors.muted },
  timer: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.dangerBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
  timerText: { color: colors.danger, fontWeight: "700", fontSize: 12, fontVariant: ["tabular-nums"] },
  progressWrap: { gap: 6, marginTop: 4 },
  progressLabel: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "#EEF0F6", overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  cardActions: { flexDirection: "row", gap: 10, paddingHorizontal: 18, paddingBottom: 14 },
  cardFootnote: { fontSize: 12, color: colors.faint, paddingHorizontal: 18, paddingBottom: 16, marginTop: -4 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  rowIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  rowLink: { fontSize: 12, fontWeight: "700", color: colors.primary },
  sheetIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.warningBg, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  sheetTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  sheetText: { fontSize: 15, color: colors.muted, marginTop: 8, lineHeight: 22 },
});
