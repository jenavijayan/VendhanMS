

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import WelcomePage from './components/WelcomePage';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import SetupPage from './pages/SetupPage'; // Import the new setup page

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<SetupPage />} /> {/* Add route for initial setup */}
          
          {/* All application-specific routes are now under /app and protected */}
          <Route 
            path="/app/*" 
            element={
              <ProtectedRoute>
                <DashboardPageRoutes />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect root to welcome page */}
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          
          {/* Fallback for any other unmatched routes, redirect to welcome */}
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

// Helper component to define routes rendered by DashboardPage
const DashboardPageRoutes: React.FC = () => {
  // The DashboardPage component itself will use useLocation() to determine what to render.
  return <DashboardPage />;
}

export default App;