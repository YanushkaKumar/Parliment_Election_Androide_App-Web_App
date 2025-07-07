// Election.js
import React, { useState, useEffect } from 'react';
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

function Election() {
  const [electionData, setElectionData] = useState({
    name: '',
    date: '',

  });

  const [elections, setElections] = useState([]);
  


  // Fetch elections from Firestore
  const fetchElections = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "elections"));
      const electionsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setElections(electionsList);
    } catch (error) {
      console.error("Error fetching elections: ", error);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  const handleElectionSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "elections"), electionData);
      alert('Election added successfully!');
      fetchElections(); // Refetch elections after adding a new election
      setElectionData({
        name: '',
        date: '',
      });
    } catch (error) {
      console.error("Error adding election: ", error);
      alert("Failed to add election.");
    }
  };

    return (
    <div>
      {/* Election Form */}
      <form onSubmit={handleElectionSubmit} className="form-container">
        <h2 className="form-title">Add Election</h2>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Enter Election Name</label>
            <input 
              type="text" 
              className="form-input"
              value={electionData.name}
              onChange={(e) => setElectionData({...electionData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Enter Election Date</label>
            <input 
              type="date"
              className="form-input" 
              value={electionData.date}
              onChange={(e) => setElectionData({...electionData, date: e.target.value})}
              required
            />
          </div>
        </div>


        <div className="form-buttons" style={{ justifyContent: 'center' }}>
          {/* Add an inline style to the button to override the flex-grow property */}
          <button type="submit" className="submit-button" style={{ flex: 'none' }}>
            Submit Election
          </button>
        </div>

      </form>

      {/* Election List */}
      <div className="elections-container">
        {elections.length === 0 ? (
          <p>No elections found.</p>
        ) : (
          elections.map((election) => (
            <div key={election.id} className="voter-card">
              <h3>{election.name}</h3>
              <p><strong>Date:</strong> {election.date}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Election;