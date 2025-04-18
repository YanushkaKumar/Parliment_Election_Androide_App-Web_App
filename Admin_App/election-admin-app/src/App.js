import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from './firebase';
import Login from './Login';
import Election from './Election';
import Candidate from './Candidate';
import Voter from './Voter';
import Results from './Results';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('election');

  // Firebase auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // When auth state is determined, set loading to false
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  
  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        setUser(null);  // Set user to null when logged out
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  // Show loading indicator while checking auth state
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // If no user is logged in, show Login page
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // Show dashboard after user is logged in
  return (
    <div className="app-container">
      <div className="container">
        <header className="admin-header">
          <h1 className="main-title">Election Management Admin Dashboard</h1>
          <div className="user-info">
            <span>Logged in as: {user.email}</span>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </div>
        </header>
        
        {/* Navigation Tabs */}
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'election' ? 'active' : ''}`}
            onClick={() => setActiveTab('election')}
          >
            Add Election
          </button>
          <button 
            className={`tab-button ${activeTab === 'candidate' ? 'active' : ''}`}
            onClick={() => setActiveTab('candidate')}
          >
            Add Candidate
          </button>
          <button 
            className={`tab-button ${activeTab === 'voter' ? 'active' : ''}`}
            onClick={() => setActiveTab('voter')}
          >
            Add Voter
          </button>
          <button 
            className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
          Results
          </button>
        </div>
        
        {/* Component Selection */}
        <div className="form-container">
          {activeTab === 'election' && <Election />}
          {activeTab === 'candidate' && <Candidate />}
          {activeTab === 'voter' && <Voter />}
          {activeTab === 'results' && <Results />}
        </div>
      </div>
    </div>
  );
}

export default App;
