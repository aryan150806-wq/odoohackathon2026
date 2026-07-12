import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function PageShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Determine title based on route
  const path = location.pathname.split('/')[1];
  const title = path ? path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ') : 'Dashboard';

  return (
    <div className="app-layout">
      {/* Ambient background glow */}
      <div className="ambient-glow-container">
        <div className="ambient-glow-1"></div>
        <div className="ambient-glow-2"></div>
      </div>

      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <div className={`app-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar sidebarCollapsed={sidebarCollapsed} title={title} />
        <main className="page-wrapper animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
