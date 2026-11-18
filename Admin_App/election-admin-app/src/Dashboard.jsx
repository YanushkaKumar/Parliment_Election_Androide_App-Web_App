import React, { useMemo } from "react";
import { electionStatus, imageSrc, useLiveCollection, useNow } from "./live";
import { LiveBadge, StatusChip } from "./ui";

const KPIS = [
  { key: "elections", label: "Elections", icon: "🗳️", bg: "#eef2ff", tab: "election" },
  { key: "candidates", label: "Candidates", icon: "👤", bg: "#fdf2f8", tab: "candidate" },
  { key: "voters", label: "Registered voters", icon: "👥", bg: "#ecfdf5", tab: "voter" },
  { key: "ballots", label: "Ballots cast", icon: "📨", bg: "#fffbeb", tab: "results" },
];

export default function Dashboard({ onNavigate }) {
  const now = useNow(30000);
  const elections = useLiveCollection("elections");
  const candidates = useLiveCollection("candidates");
  const voters = useLiveCollection("voters");
  const ballots = useLiveCollection("results");
  const tallies = useLiveCollection("voterVotes");

  const counts = {
    elections: elections.docs.length,
    candidates: candidates.docs.length,
    voters: voters.docs.length,
    ballots: ballots.docs.length,
  };

  const rows = useMemo(() => {
    const voted = new Map();
    for (const t of tallies.docs) voted.set(t.electionId, (voted.get(t.electionId) || 0) + 1);
    const order = { open: 0, upcoming: 1, closed: 2, invalid: 3 };
    return elections.docs
      .map((e) => ({ ...e, status: electionStatus(e, now), voted: voted.get(e.id) || 0 }))
      .sort((a, b) => order[a.status] - order[b.status] || (b.date || "").localeCompare(a.date || ""));
  }, [elections.docs, tallies.docs, now]);

  // Leaderboard: the open election, else the most recent one.
  const featured = rows.find((e) => e.status === "open") || rows.find((e) => e.status === "closed") || rows[0];
  const leaders = useMemo(() => {
    if (!featured) return [];
    return candidates.docs
      .filter((c) => c.electionName === featured.name)
      .sort((a, b) => (b.votes || 0) - (a.votes || 0))
      .slice(0, 5);
  }, [candidates.docs, featured]);
  const top = leaders[0]?.votes || 1;
  const openCount = rows.filter((e) => e.status === "open").length;

  return (
    <div className="dashboard">
      <div className="dash-hero">
        <div>
          <h2>Election control centre</h2>
          <p>
            {openCount > 0
              ? `${openCount} election${openCount > 1 ? "s are" : " is"} open for voting right now.`
              : "No elections are open right now."}{" "}
            Everything on this page updates live.
          </p>
        </div>
        <LiveBadge />
      </div>

      <div className="kpi-grid">
        {KPIS.map((k) => (
          <button key={k.key} className="kpi" onClick={() => onNavigate(k.tab)}>
            <div className="kpi-icon" style={{ background: k.bg }}>{k.icon}</div>
            <div>
              <div className="kpi-value">{counts[k.key]}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="dash-grid">
        <div className="panel">
          <div className="panel-head">
            <h3>Elections & turnout</h3>
            <button className="btn-ghost" onClick={() => onNavigate("election")}>Manage →</button>
          </div>
          {rows.length === 0 && <p className="empty-note">No elections yet. Create one to get started.</p>}
          {rows.map((e) => {
            const pct = counts.voters ? Math.round((e.voted / counts.voters) * 100) : 0;
            return (
              <div key={e.id} className="election-line">
                <div style={{ flex: 1 }}>
                  <strong>{e.name}</strong>
                  <small>{e.date} · {e.startTime || "09:00"}–{e.endTime || "16:00"} · {e.voted} voted ({pct}% turnout)</small>
                  <div className="turnout-track"><div className="turnout-fill" style={{ width: `${pct}%` }} /></div>
                </div>
                <StatusChip status={e.status} />
              </div>
            );
          })}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>{featured ? `Leaderboard · ${featured.name}` : "Leaderboard"}</h3>
            {featured?.status === "open" && <LiveBadge />}
          </div>
          {leaders.length === 0 && <p className="empty-note">No candidates for this election yet.</p>}
          {leaders.map((c, i) => (
            <div key={c.id} className="leader-row">
              <span className={`rank-badge ${c.votes ? `rank-${i + 1}` : ""}`}>{i + 1}</span>
              {imageSrc(c.candidatePhotoBase64)
                ? <img src={imageSrc(c.candidatePhotoBase64)} alt="" />
                : <span className="leader-avatar">{(c.candidateName || "?")[0]}</span>}
              <div className="leader-bar">
                <div className="name"><span>{c.candidateName}</span><span>{c.votes || 0}</span></div>
                <small style={{ color: "#6b7280" }}>{c.candidateParty} · {c.constituency}</small>
                <div className="turnout-track"><div className="turnout-fill" style={{ width: `${((c.votes || 0) / top) * 100}%` }} /></div>
              </div>
            </div>
          ))}
          {featured && (
            <button className="btn-primary" style={{ marginTop: 14, width: "100%" }} onClick={() => onNavigate("results")}>
              Full results →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
