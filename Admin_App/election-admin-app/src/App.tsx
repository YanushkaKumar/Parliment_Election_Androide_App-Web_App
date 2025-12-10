import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
// @ts-ignore: Could not find a declaration file for module './firebase' (implicit any)
import { auth } from './firebase';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import Districts from './pages/Districts';
import Results from './pages/Results';
import Login from './pages/Login';
import Elections from './pages/Elections';
import CandidatesOld from './pages/CandidatesOld';
import Voters from './pages/Voters';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout user={user} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="elections" element={<Elections />} />
          <Route path="candidates-old" element={<CandidatesOld />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="voters" element={<Voters />} />
          <Route path="districts" element={<Districts />} />
          <Route path="results" element={<Results />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
