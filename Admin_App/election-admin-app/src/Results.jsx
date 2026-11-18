import React, { useState, useMemo } from 'react';
import { electionStatus, useLiveCollection } from "./live";
import { LiveBadge, StatusChip } from "./ui";

// Ballots live in /results (one document per vote). Old ballots stored the human
// candidateId only; new ones (written by the castVote function) also store candidateDocId.
// Candidate photos come from /candidates so they are not duplicated in every ballot.

const getImageUrl = (base64String) => {
  if (!base64String) return null;
  return base64String.startsWith('data:image') ? base64String : `data:image/jpeg;base64,${base64String}`;
};

function buildTally(candidateDocs, ballotDocs) {
  const rows = new Map(); // key -> result row
  const byDocId = new Map();
  const byCandidateId = new Map();

  candidateDocs.forEach((c) => {
    const row = {
      key: c.id,
      candidateId: c.candidateId,
      candidateName: c.candidateName,
      candidateParty: c.candidateParty,
      constituency: c.constituency,
      district: c.district,
      photoBase64: c.candidatePhotoBase64,
      partySymbolBase64: c.partySymbolBase64,
      voteCount: 0,
    };
    rows.set(row.key, row);
    byDocId.set(c.id, row);
    if (c.candidateId) byCandidateId.set(c.candidateId, row);
  });

  ballotDocs.forEach((b) => {
    let row = byDocId.get(b.candidateDocId) || byCandidateId.get(b.candidateId);
    if (!row) {
      // Candidate was deleted after votes were cast: still count the ballots.
      const key = `orphan_${b.candidateId}_${b.candidateName}`;
      row = rows.get(key);
      if (!row) {
        row = {
          key,
          candidateId: b.candidateId,
          candidateName: b.candidateName,
          candidateParty: b.candidateParty,
          constituency: b.constituency,
          district: b.district,
          photoBase64: b.candidatePhotoBase64,
          partySymbolBase64: b.partySymbolBase64,
          voteCount: 0,
        };
        rows.set(key, row);
      }
    }
    row.voteCount += 1;
  });

  return { rows: Array.from(rows.values()), ballots: ballotDocs.length };
}

function Results() {
  const liveElections = useLiveCollection("elections");
  const [chosenId, setSelectedId] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterValue, setFilterValue] = useState('All');

  const elections = useMemo(
    () => [...liveElections.docs].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [liveElections.docs],
  );
  // Until the admin picks one, show the live election, else the most recent closed one.
  const selected = elections.find((e) => e.id === chosenId)
    || elections.find((e) => electionStatus(e) === "open")
    || elections.find((e) => electionStatus(e) === "closed")
    || elections[0];
  const selectedId = selected?.id || '';

  // Live subscriptions: ballots and candidate details update as votes are cast or edits are made.
  const liveCandidates = useLiveCollection("candidates", selected ? { electionName: selected.name } : null);
  const liveBallots = useLiveCollection(
    "results",
    selected ? { electionName: selected.name, electionDate: selected.date } : null,
  );
  const { rows: allResults, ballots: ballotCount } = useMemo(
    () => buildTally(liveCandidates.docs, liveBallots.docs),
    [liveCandidates.docs, liveBallots.docs],
  );
  const loading = liveElections.loading || liveCandidates.loading || liveBallots.loading;
  const error = liveElections.error || liveCandidates.error || liveBallots.error
    ? "Error fetching election results"
    : !liveElections.loading && elections.length === 0
      ? "No elections found"
      : !loading && allResults.length === 0
        ? "No candidates or votes for this election yet"
        : null;

  const filterValues = useMemo(() => {
    const field = filterType === 'District' ? 'district' : filterType === 'Constituency' ? 'constituency' : null;
    if (!field) return ['All'];
    const unique = new Set(allResults.map((r) => r[field]).filter((v) => v && v.trim() !== ''));
    return ['All', ...Array.from(unique).sort()];
  }, [filterType, allResults]);

  const displayedResults = useMemo(() => {
    let rows = allResults;
    if (filterType !== 'All' && filterValue !== 'All') {
      const field = filterType === 'District' ? 'district' : 'constituency';
      rows = rows.filter((r) => r[field] === filterValue);
    }
    return [...rows].sort((a, b) => b.voteCount - a.voteCount);
  }, [allResults, filterType, filterValue]);

  return (
    <div className="results-container">
      <h2 className="results-title">Election Results</h2>

      <div className="control-panel">
        <div className="control-item">
          <label htmlFor="election-select">Select Election:</label>
          <select
            id="election-select"
            onChange={(e) => { setSelectedId(e.target.value); setFilterType('All'); setFilterValue('All'); }}
            value={selectedId}
          >
            {elections.length === 0 && <option value="">No elections</option>}
            {elections.map((election) => (
              <option key={election.id} value={election.id}>
                {election.name} ({election.date})
              </option>
            ))}
          </select>
        </div>

        <div className="controls-row">
          <div className="control-item">
            <label htmlFor="filter-type">Filter by:</label>
            <select
              id="filter-type"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setFilterValue('All');
              }}
            >
              <option value="All">All</option>
              <option value="District">District</option>
              <option value="Constituency">Constituency</option>
            </select>
          </div>

          <div className="control-item">
            <label htmlFor="filter-value">Value:</label>
            <select
              id="filter-value"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              disabled={filterType === 'All'}
            >
              {filterValues.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && <p className="loading-message">Loading election results...</p>}
      {!loading && error && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <div className="results-list">
          <div className="list-meta">
            <span><strong>Total ballots cast:</strong> {ballotCount}</span>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <StatusChip status={electionStatus(selected)} />
              <LiveBadge />
            </span>
          </div>
          {displayedResults.length === 0 ? (
            <p className="no-results">No results match the selected filters</p>
          ) : (
            <div className="results-grid">
              {displayedResults.map((result) => (
                <div key={result.key} className="result-card">
                  <div className="result-card-header">
                    <div className="candidate-photo-container">
                      {result.photoBase64 ? (
                        <img
                          src={getImageUrl(result.photoBase64)}
                          alt=""
                          className="candidate-photo"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="candidate-photo-placeholder"></div>
                      )}
                    </div>
                    <div className="candidate-header-info">
                      <h3 className="candidate-name">{result.candidateName}</h3>
                      <div className="candidate-id">ID: {result.candidateId}</div>
                    </div>
                  </div>

                  <div className="result-card-details">
                    <div className="party-info">
                      {result.partySymbolBase64 && (
                        <img
                          src={getImageUrl(result.partySymbolBase64)}
                          alt=""
                          className="party-symbol1"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <span className="party-name">{result.candidateParty}</span>
                    </div>

                    <div className="location-info">
                      <div className="info-row">
                        <span className="info-label">Constituency:</span>
                        <span className="info-value">{result.constituency}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">District:</span>
                        <span className="info-value">{result.district}</span>
                      </div>
                    </div>

                    <div className="vote-count">
                      <span className="vote-count-label">Votes:</span>
                      <span className="vote-count-value">{result.voteCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Results;
