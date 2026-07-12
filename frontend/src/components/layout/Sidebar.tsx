import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ArrowRightLeft, 
  CalendarCheck, 
  Wrench, 
  ClipboardCheck, 
  BarChart3, 
  Bell, 
  Menu
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Organization', path: '/organization', icon: Users },
    { name: 'Assets', path: '/assets', icon: Package },
    { name: 'Allocations', path: '/allocations', icon: ArrowRightLeft },
    { name: 'Bookings', path: '/bookings', icon: CalendarCheck },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Audits', path: '/audits', icon: ClipboardCheck },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Activity Log', path: '/activity-log', icon: Bell },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">AF</div>
        {!collapsed && <div className="sidebar-brand">AssetFlow</div>}
      </div>

      <nav className="sidebar-nav">
        {!collapsed && <div className="sidebar-section-label">Main Menu</div>}
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              title={collapsed ? link.name : undefined}
            >
              <Icon className="sidebar-link-icon" />
              {!collapsed && <span>{link.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="btn btn-ghost w-full justify-center" onClick={onToggle}>
          <Menu size={20} />
        </button>
      </div>
    </aside>
  );
}
