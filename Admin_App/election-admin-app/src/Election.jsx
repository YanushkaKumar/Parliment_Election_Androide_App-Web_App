// Election.jsx
import React, { useMemo, useState } from 'react';
import { addDoc, collection, doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { electionStatus, useLiveCollection, useNow } from "./live";
import { StatusChip, useUi } from "./ui";

// Voting times are interpreted in Asia/Colombo by the castVote Cloud Function.
const emptyElection = { name: '', date: '', startTime: '09:00', endTime: '16:00' };

function Election() {
  const { toast, confirm } = useUi();
  const now = useNow(30000);
  const [electionData, setElectionData] = useState(emptyElection);
  const [loading, setLoading] = useState(false);
  const live = useLiveCollection("elections");

  const elections = useMemo(
    () => [...live.docs].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [live.docs],
  );

  const handleElectionSubmit = async (e) => {
    e.preventDefault();
    const name = electionData.name.trim();
    if (electionData.startTime >= electionData.endTime) {
      toast('Voting end time must be after the start time.', 'error');
      return;
    }
    // Candidates reference elections by name, so names must be unique.
    if (elections.some((el) => el.name === name)) {
      toast(`An election named "${name}" already exists.`, 'error');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "elections"), { ...electionData, name });
      toast(`Election "${name}" created.`);
      setElectionData(emptyElection);
    } catch (error) {
      console.error("Error adding election: ", error);
      toast(`Failed to add election: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteElection = async (election) => {
    const ok = await confirm({
      title: `Delete "${election.name}"?`,
      message: 'The election will disappear from the voter app. Its candidates and ballots are kept.',
      confirmLabel: 'Delete election',
      danger: true,
    });
    if (!ok) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "elections", election.id));
      toast(`Election "${election.name}" deleted.`, 'info');
    } catch (error) {
      console.error("Error deleting election: ", error);
      toast(`Failed to delete election: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Election Form */}
      <form onSubmit={handleElectionSubmit} className="form-container">
        <h2 className="form-title">Add Election</h2>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Election Name</label>
            <input
              type="text"
              className="form-input"
              value={electionData.name}
              onChange={(e) => setElectionData({ ...electionData, name: e.target.value })}
              placeholder="e.g. Parliamentary Election 2026"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Election Date</label>
            <input
              type="date"
              className="form-input"
              value={electionData.date}
              onChange={(e) => setElectionData({ ...electionData, date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Voting Opens (Sri Lanka time)</label>
            <input
              type="time"
              className="form-input"
              value={electionData.startTime}
              onChange={(e) => setElectionData({ ...electionData, startTime: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Voting Closes (Sri Lanka time)</label>
            <input
              type="time"
              className="form-input"
              value={electionData.endTime}
              onChange={(e) => setElectionData({ ...electionData, endTime: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-buttons" style={{ justifyContent: 'center' }}>
          <button type="submit" className="submit-button" style={{ flex: 'none' }} disabled={loading}>
            {loading ? 'Processing...' : 'Submit Election'}
          </button>
        </div>
      </form>

      {/* Election List */}
      <div className="list-meta" style={{ marginTop: 24 }}>
        <span>{elections.length} election{elections.length === 1 ? '' : 's'}</span>
      </div>
      <div className="elections-container">
        {live.loading ? (
          <p>Loading elections…</p>
        ) : elections.length === 0 ? (
          <p>No elections found.</p>
        ) : (
          elections.map((election) => (
            <div key={election.id} className="voter-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <h3>{election.name}</h3>
                <StatusChip status={electionStatus(election, now)} />
              </div>
              <p><strong>Date:</strong> {election.date}</p>
              <p>
                <strong>Voting hours:</strong> {election.startTime || '09:00'} – {election.endTime || '16:00'}
              </p>
              <div className="card-actions">
                <button
                  className="delete-button"
                  onClick={() => handleDeleteElection(election)}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Election;
