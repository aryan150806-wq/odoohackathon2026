import React from 'react';
import { Bell, Search, User as UserIcon, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/client';

interface TopbarProps {
  sidebarCollapsed: boolean;
  title: string;
}

export function Topbar({ sidebarCollapsed, title }: TopbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [searchInput, setSearchInput] = React.useState('');

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {} // ignore errors on logout
    logout();
    navigate('/login');
  };

  return (
    <header className={`topbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="topbar-left">
        <h1 className="topbar-title">{title}</h1>
      </div>
      
      <div className="topbar-right">
        <div className="topbar-search">
          <Search size={18} className="text-tertiary" />
          <input 
            type="text" 
            placeholder="Search assets, users..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchInput.trim()) {
                navigate(`/assets?search=${encodeURIComponent(searchInput.trim())}`);
              }
            }}
          />
        </div>
        
        <button className="topbar-icon-btn">
          <Bell size={20} />
          <span className="topbar-badge"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
            {user?.name?.charAt(0) || <UserIcon size={16} />}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium">{user?.name || 'Loading...'}</div>
            <div className="text-xs text-secondary">{user?.role?.replace('_', ' ') || 'Guest'}</div>
          </div>
          <button onClick={handleLogout} className="ml-2 text-secondary hover:text-danger" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
