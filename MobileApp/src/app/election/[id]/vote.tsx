import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Avatar, Card, EmptyState, GradientHeader, HeaderIconButton, LiveBadge, PartySymbol,
  PrimaryButton, ProgressDots, Sheet,
} from "@/components/ui";
import { useLiveDoc, useLiveQuery, useNow } from "@/hooks/useLive";
import { closesAt, electionStatus, formatCountdown, MAX_VOTES } from "@/lib/electionTime";
import { api, errorMessage } from "@/lib/firebase";
import { toCandidate, toElection, toTally, toVoter } from "@/lib/mappers";
import { useSession } from "@/lib/session";
import { colors, radius } from "@/lib/theme";
import type { Candidate } from "@/lib/types";

export default function Vote() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { voterId } = useSession();
  const insets = useSafeAreaInsets();
  const now = useNow(1000);

  const election = useLiveDoc(`elections/${id}`, toElection);
  const voter = useLiveDoc(voterId ? `voters/${voterId}` : null, toVoter);
  const tally = useLiveDoc(voterId ? `voterVotes/${id}_${voterId}` : null, toTally);
  const filters = election.data && voter.data?.constituency
    ? { electionName: election.data.name, constituency: voter.data.constituency }
    : null;
  const candidates = useLiveQuery("candidates", filters, toCandidate);

  const [selected, setSelected] = useState<Candidate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const votedIds = useMemo(() => new Set(tally.data?.candidateDocIds ?? []), [tally.data]);
  const used = tally.data?.count ?? 0;
  const remaining = Math.max(0, MAX_VOTES - used);
  const sorted = useMemo(
    () => [...candidates.data].sort((a, b) => a.candidateName.localeCompare(b.candidateName)),
    [candidates.data],
  );

  if (!voterId) return <Redirect href="/login" />;

  const status = election.data ? electionStatus(election.data, now) : "invalid";
  const canVote = status === "open" && remaining > 0;

  const cast = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.castVote({ electionId: id, candidateId: selected.id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelected(null);
      if (data.votesRemaining <= 0) setFinished(true);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(errorMessage(e, "Your vote could not be recorded. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const loading = election.loading || voter.loading || (filters !== null && candidates.loading);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <GradientHeader
        title={election.data?.name ?? "Election"}
        subtitle={voter.data ? `${voter.data.constituency} constituency` : undefined}
        left={<HeaderIconButton icon="arrow-back" label="Back" onPress={() => router.back()} />}
      >
        <View style={styles.headerStats}>
          <View style={{ gap: 6 }}>
            <Text style={styles.headerStatLabel}>VOTES LEFT</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={styles.headerStatValue}>{remaining}</Text>
              <ProgressDots used={used} total={MAX_VOTES} />
            </View>
          </View>
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            <Text style={styles.headerStatLabel}>{status === "open" ? "CLOSES IN" : "STATUS"}</Text>
            <Text style={[styles.headerStatValue, { fontVariant: ["tabular-nums"], fontSize: 20 }]}>
              {status === "open" && election.data ? formatCountdown(closesAt(election.data) - now)
                : status === "upcoming" ? "Not open" : "Closed"}
            </Text>
          </View>
        </View>
      </GradientHeader>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: insets.bottom + 24 }}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.instructions}>
                {used >= MAX_VOTES
                  ? "You've used all your votes. Thank you for voting!"
                  : status !== "open"
                    ? "Voting is not open right now."
                    : `Choose up to ${MAX_VOTES} different candidates. Votes can't be changed.`}
              </Text>
              <LiveBadge />
            </View>
          }
          ListEmptyComponent={
            <EmptyState icon="people-outline" title="No candidates" message="No candidates are standing in your constituency for this election." />
          }
          renderItem={({ item }) => {
            const voted = votedIds.has(item.id);
            return (
              <Card style={[styles.candidate, voted && styles.candidateVoted]}>
                <View style={styles.candidateTop}>
                  <Avatar base64={item.candidatePhotoBase64} name={item.candidateName} size={64} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.candidateName}>{item.candidateName}</Text>
                    <View style={styles.partyRow}>
                      <PartySymbol base64={item.partySymbolBase64} />
                      <Text style={styles.partyName} numberOfLines={1}>{item.candidateParty}</Text>
                    </View>
                    <Text style={styles.candidateMeta}>#{item.candidateId} · {item.district}</Text>
                  </View>
                  {voted && (
                    <View style={styles.votedBadge} accessibilityLabel="Voted">
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </View>
                  )}
                </View>
                {voted ? (
                  <View style={styles.votedBar}><Ionicons name="checkmark-circle" size={18} color={colors.success} /><Text style={styles.votedText}>Voted</Text></View>
                ) : (
                  <PrimaryButton
                    title="Vote"
                    icon="checkbox-outline"
                    disabled={!canVote}
                    onPress={() => { setError(null); setSelected(item); }}
                  />
                )}
              </Card>
            );
          }}
        />
      )}

      <Sheet visible={!!selected} onClose={() => !submitting && setSelected(null)}>
        {selected && (
          <View style={{ alignItems: "center" }}>
            <Avatar base64={selected.candidatePhotoBase64} name={selected.candidateName} size={88} />
            <Text style={[styles.sheetTitle, { marginTop: 14 }]}>{selected.candidateName}</Text>
            <View style={[styles.partyRow, { marginTop: 4 }]}>
              <PartySymbol base64={selected.partySymbolBase64} size={20} />
              <Text style={styles.partyName}>{selected.candidateParty}</Text>
            </View>
            <View style={styles.warning}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <Text style={styles.warningText}>
                This uses vote {used + 1} of {MAX_VOTES}. Votes are final and cannot be changed.
              </Text>
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            <PrimaryButton title="Confirm vote" icon="checkmark-circle-outline" onPress={cast} loading={submitting} style={{ alignSelf: "stretch", marginTop: 16 }} />
            <PrimaryButton title="Cancel" variant="ghost" onPress={() => setSelected(null)} disabled={submitting} style={{ alignSelf: "stretch", marginTop: 6 }} />
          </View>
        )}
      </Sheet>

      <Sheet visible={finished} onClose={() => setFinished(false)}>
        <View style={{ alignItems: "center" }}>
          <View style={styles.doneIcon}><Ionicons name="ribbon" size={40} color={colors.success} /></View>
          <Text style={styles.sheetTitle}>Thank you for voting!</Text>
          <Text style={styles.sheetText}>All {MAX_VOTES} of your votes have been recorded. Live results are now unlocked.</Text>
          <PrimaryButton title="See live results" icon="stats-chart" onPress={() => { setFinished(false); router.replace(`/election/${id}/results`); }} style={{ alignSelf: "stretch", marginTop: 20 }} />
          <PrimaryButton title="Back to elections" variant="ghost" onPress={() => { setFinished(false); router.back(); }} style={{ alignSelf: "stretch", marginTop: 6 }} />
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  headerStats: {
    flexDirection: "row", justifyContent: "space-between", marginTop: 18, padding: 14,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: radius.md,
  },
  headerStatLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  headerStatValue: { color: "#fff", fontSize: 26, fontWeight: "800" },
  listHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  instructions: { flex: 1, fontSize: 14, color: colors.muted, lineHeight: 20 },
  candidate: { gap: 14 },
  candidateVoted: { borderWidth: 2, borderColor: colors.success },
  candidateTop: { flexDirection: "row", gap: 14, alignItems: "center" },
  candidateName: { fontSize: 18, fontWeight: "800", color: colors.text },
  partyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  partyName: { fontSize: 14, color: colors.text, fontWeight: "600", flexShrink: 1 },
  candidateMeta: { fontSize: 12, color: colors.muted },
  votedBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
  votedBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 48,
    borderRadius: radius.md, backgroundColor: colors.successBg,
  },
  votedText: { color: "#047857", fontWeight: "800", fontSize: 15 },
  sheetTitle: { fontSize: 22, fontWeight: "800", color: colors.text, textAlign: "center" },
  sheetText: { fontSize: 15, color: colors.muted, marginTop: 8, lineHeight: 22, textAlign: "center" },
  warning: {
    flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: colors.infoBg,
    borderRadius: radius.md, padding: 12, marginTop: 18,
  },
  warningText: { flex: 1, fontSize: 13, color: colors.primaryDark, lineHeight: 19 },
  error: { color: colors.danger, marginTop: 12, textAlign: "center", fontWeight: "600" },
  doneIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.successBg, alignItems: "center", justifyContent: "center", marginBottom: 14 },
});
