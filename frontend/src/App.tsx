import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PageShell } from './components/layout/PageShell';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { AssetDirectory } from './pages/AssetDirectory';
import { Allocations } from './pages/Allocations';
import { Bookings } from './pages/Bookings';
import { Maintenance } from './pages/Maintenance';
import { Audits } from './pages/Audits';
import { Organization } from './pages/Organization';
import { Reports } from './pages/Reports';
import { ActivityLog } from './pages/ActivityLog';
import { useAuthStore } from './store/authStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Placeholder pages for routing
const Placeholder = ({ title }: { title: string }) => (
  <div className="empty-state">
    <div className="empty-state-title">{title} Module</div>
    <p className="empty-state-desc">This module is currently being implemented.</p>
  </div>
);

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={
          <ProtectedRoute>
            <PageShell />
          </ProtectedRoute>
        }>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/organization" element={<Organization />} />
          <Route path="/assets" element={<AssetDirectory />} />
          <Route path="/allocations" element={<Allocations />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/audits" element={<Audits />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/activity-log" element={<ActivityLog />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
