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
      <form onSubmit={handleElectionSubmit}>
        <h2 className="form-title">Add Election</h2>

        <div className="form-group">
          <label>Enter Election Name</label>
          <input 
            type="text" 
            value={electionData.name}
            onChange={(e) => setElectionData({...electionData, name: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Enter Election Date</label>
          <input 
            type="date" 
            value={electionData.date}
            onChange={(e) => setElectionData({...electionData, date: e.target.value})}
            required
          />
        </div>

        <button type="submit" className="submit-button">
          Submit Election
        </button>
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