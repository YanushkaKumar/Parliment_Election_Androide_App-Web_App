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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Firebase auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        setUser(null);
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'election', label: 'Elections', icon: '🗳️' },
    { id: 'candidate', label: 'Candidates', icon: '👤' },
    { id: 'voter', label: 'Voters', icon: '👥' },
    { id: 'results', label: 'Results', icon: '📈' }
  ];

  // Dashboard component
  const Dashboard = () => (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome to Election Management System</h2>
        <p>Manage your elections efficiently with our comprehensive admin panel</p>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">🗳️</div>
          <div className="stat-content">
            <h3>Elections</h3>
            <p>Manage election events</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-content">
            <h3>Candidates</h3>
            <p>Register & manage candidates</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Voters</h3>
            <p>Voter registration system</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Results</h3>
            <p>View election results</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-actions">
        <div className="action-card" onClick={() => setActiveTab('election')}>
          <h3>Create New Election</h3>
          <p>Set up a new election with date and details</p>
          <button>Get Started →</button>
        </div>
        
        <div className="action-card" onClick={() => setActiveTab('candidate')}>
          <h3>Add Candidates</h3>
          <p>Register candidates for upcoming elections</p>
          <button>Add Now →</button>
        </div>

         <div className="action-card" onClick={() => setActiveTab('voter')}>
          <h3>Add Voters</h3>
          <p>Register Voters for upcoming elections</p>
          <button>Add Now →</button>
        </div>
        
        
        <div className="action-card" onClick={() => setActiveTab('results')}>
          <h3>View Results</h3>
          <p>Check real-time election results and analytics</p>
          <button>View Results →</button>
        </div>

        
      </div>
    </div>
  );

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If no user is logged in, show Login page
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // Show dashboard after user is logged in
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🗳️</span>
            <span className="logo-text">ElectionMS</span>
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? '✕' : '☰'}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button 
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">👤</div>
            <div className="user-info">
              <span className="user-name">Admin</span>
              <span className="user-email">{user.email}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <span>🚪</span> Logout
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={toggleSidebar}>
              ☰
            </button>
            <h1 className="page-title">
              {navItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="header-right">
            <div className="user-menu">
              <span>Welcome, Admin</span>
              <button onClick={handleLogout} className="header-logout">
                Logout
              </button>
            </div>
          </div>
        </header>
        
        <main className="content-area">
          <div className="content-wrapper">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'election' && <Election />}
            {activeTab === 'candidate' && <Candidate />}
            {activeTab === 'voter' && <Voter />}
            {activeTab === 'results' && <Results />}
          </div>
        </main>
      </div>
      
      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
    </div>
  );
}

export default App;