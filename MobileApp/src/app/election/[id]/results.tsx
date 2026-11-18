import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Avatar, Card, Chip, EmptyState, GradientHeader, HeaderIconButton, LiveBadge, PartySymbol, StatusChip,
} from "@/components/ui";
import { useLiveDoc, useLiveQuery, useNow } from "@/hooks/useLive";
import { electionStatus, formatDate, MAX_VOTES } from "@/lib/electionTime";
import { toCandidate, toElection, toTally } from "@/lib/mappers";
import { useSession } from "@/lib/session";
import { colors, radius } from "@/lib/theme";

type FilterType = "All" | "District" | "Constituency";
const MEDALS = [colors.gold, colors.silver, colors.bronze];

export default function Results() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { voterId } = useSession();
  const insets = useSafeAreaInsets();
  const now = useNow(30000);

  const election = useLiveDoc(`elections/${id}`, toElection);
  const tally = useLiveDoc(voterId ? `voterVotes/${id}_${voterId}` : null, toTally);
  const candidates = useLiveQuery("candidates", election.data ? { electionName: election.data.name } : null, toCandidate);

  const [filterType, setFilterType] = useState<FilterType>("All");
  const [filterValue, setFilterValue] = useState<string | null>(null);

  const values = useMemo(() => {
    if (filterType === "All") return [];
    const key = filterType === "District" ? "district" : "constituency";
    return [...new Set(candidates.data.map((c) => c[key]).filter(Boolean))].sort();
  }, [filterType, candidates.data]);

  const rows = useMemo(() => {
    let list = candidates.data;
    if (filterType !== "All" && filterValue) {
      const key = filterType === "District" ? "district" : "constituency";
      list = list.filter((c) => c[key] === filterValue);
    }
    return [...list].sort((a, b) => b.votes - a.votes || a.candidateName.localeCompare(b.candidateName));
  }, [candidates.data, filterType, filterValue]);

  if (!voterId) return <Redirect href="/login" />;

  const status = election.data ? electionStatus(election.data, now) : "invalid";
  // While voting is open, results are only shown to voters who have used all their votes.
  const locked = status === "open" && (tally.data?.count ?? 0) < MAX_VOTES;
  const total = rows.reduce((n, c) => n + c.votes, 0);
  const max = rows[0]?.votes || 1;
  const leader = rows[0] && rows[0].votes > 0 ? rows[0] : null;

  const header = (
    <GradientHeader
      title="Results"
      subtitle={election.data ? `${election.data.name} · ${formatDate(election.data.date)}` : undefined}
      left={<HeaderIconButton icon="arrow-back" label="Back" onPress={() => router.back()} />}
      right={status === "open" ? <LiveBadge light /> : undefined}
    >
      {!locked && election.data && (
        <View style={styles.stats}>
          <Stat label="Total votes" value={String(total)} />
          <View style={styles.statDivider} />
          <Stat label="Candidates" value={String(rows.length)} />
          <View style={styles.statDivider} />
          <Stat label="Leading" value={leader ? leader.candidateName.split(" ")[0] : "—"} />
        </View>
      )}
    </GradientHeader>
  );

  if (election.loading || (election.data && candidates.loading)) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }}>{header}<ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /></View>;
  }

  if (locked) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {header}
        <EmptyState icon="lock-closed-outline" title="Results are locked" message={`Live results unlock after you've cast all ${MAX_VOTES} of your votes.`} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {header}
      <FlatList
        data={rows}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          <View style={{ gap: 10, marginBottom: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={styles.sectionTitle}>Filter</Text>
              {election.data && <StatusChip status={status} />}
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["All", "District", "Constituency"] as FilterType[]).map((t) => (
                <Chip key={t} label={t} active={filterType === t} onPress={() => { setFilterType(t); setFilterValue(null); }} />
              ))}
            </View>
            {values.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <Chip label="All" active={!filterValue} onPress={() => setFilterValue(null)} />
                {values.map((v) => <Chip key={v} label={v} active={filterValue === v} onPress={() => setFilterValue(v)} />)}
              </ScrollView>
            )}
          </View>
        }
        ListEmptyComponent={<EmptyState icon="bar-chart-outline" title="No results" message="No candidates match this filter." />}
        renderItem={({ item, index }) => {
          const pct = total ? Math.round((item.votes / total) * 100) : 0;
          return (
            <Card style={[styles.row, index === 0 && item.votes > 0 && styles.rowLeader]}>
              <View style={[styles.rank, index < 3 && item.votes > 0 ? { backgroundColor: MEDALS[index] } : null]}>
                <Text style={[styles.rankText, index < 3 && item.votes > 0 ? { color: "#fff" } : null]}>{index + 1}</Text>
              </View>
              <Avatar base64={item.candidatePhotoBase64} name={item.candidateName} size={48} />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <Text style={styles.name} numberOfLines={1}>{item.candidateName}</Text>
                  <Text style={styles.votes}>{item.votes}</Text>
                </View>
                <View style={styles.partyRow}>
                  <PartySymbol base64={item.partySymbolBase64} size={16} />
                  <Text style={styles.party} numberOfLines={1}>{item.candidateParty}</Text>
                  <Text style={styles.pct}>{pct}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(item.votes / max) * 100}%` }, index === 0 && { backgroundColor: colors.violet }]} />
                </View>
                <Text style={styles.meta}>{item.constituency} · {item.district}</Text>
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: "row", alignItems: "center", marginTop: 18, paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: radius.md,
  },
  statDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.3)" },
  statValue: { color: "#fff", fontSize: 20, fontWeight: "800" },
  statLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "700", marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rowLeader: { borderWidth: 2, borderColor: colors.gold },
  rank: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  rankText: { fontWeight: "800", color: colors.muted },
  name: { fontSize: 16, fontWeight: "800", color: colors.text, flexShrink: 1 },
  votes: { fontSize: 20, fontWeight: "800", color: colors.primary, fontVariant: ["tabular-nums"] },
  partyRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  party: { fontSize: 13, color: colors.text, flex: 1 },
  pct: { fontSize: 12, fontWeight: "700", color: colors.muted },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: "#EEF0F6", overflow: "hidden", marginTop: 2 },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  meta: { fontSize: 11, color: colors.faint },
});
