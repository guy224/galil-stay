import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ZimmerPage from './pages/Zimmer';
import VillaPage from './pages/Villa';
import GuestPortal from './pages/GuestPortal';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import UnitSettings from './pages/UnitSettings';

import { ToastProvider } from './components/ui/Toast';

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-background text-dark font-sans" dir="rtl">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/zimmer" element={<ZimmerPage />} />
            <Route path="/villa" element={<VillaPage />} />

            {/* Guest Portal */}
            <Route path="/guest/:id" element={<GuestPortal />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/settings" element={<UnitSettings />} />
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
