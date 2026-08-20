import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AgendaProvider } from './context/AgendaContext';
import { SettingsProvider } from './context/SettingsContext';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AgendaManagement from './pages/AgendaManagement';
import CalendarView from './pages/CalendarView';
import TVBoard from './pages/TVBoard';
import DisplayModes from './pages/DisplayModes';
import MobileView from './pages/MobileView';
import Login from './pages/Login';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <AgendaProvider>
        <SettingsProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/tv" element={
                <ProtectedRoute>
                  <TVBoard />
                </ProtectedRoute>
              } />
              <Route path="/mobile" element={<MobileView />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/agenda" element={<AgendaManagement />} />
                      <Route path="/calendar" element={<CalendarView />} />
                      <Route path="/display" element={<DisplayModes />} />
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </SettingsProvider>
      </AgendaProvider>
    </AuthProvider>
  );
}

export default App;
