import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from './firebase';
import Login from './Login';
import Election from './Election';
import Candidate from './Candidate';
import Voter from './Voter';
import Results from './Results';
import Dashboard from './Dashboard';
import { UiProvider } from './ui';
import './App.css';

function AdminApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Firebase auth state observer. Only accounts listed in /admins/{uid} may use the panel.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const adminDoc = await getDoc(doc(db, "admins", currentUser.uid));
        if (adminDoc.exists()) {
          setAuthError('');
          setUser(currentUser);
        } else {
          setAuthError(`${currentUser.email} is not an administrator. Add a document at admins/${currentUser.uid} in Firestore to grant access.`);
          await signOut(auth);
        }
      } catch (error) {
        console.error("Admin check failed:", error);
        setAuthError('Could not verify administrator access.');
        await signOut(auth);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).catch((error) => console.error("Logout error:", error));
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
    return <Login externalError={authError} />;
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
            {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
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

export default function App() {
  return (
    <UiProvider>
      <AdminApp />
    </UiProvider>
  );
}