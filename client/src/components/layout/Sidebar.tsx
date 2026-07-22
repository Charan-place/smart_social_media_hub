import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Upload, BarChart2, Settings, LogOut, Youtube, Instagram, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/client';
import toast from 'react-hot-toast';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload & Publish' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (_) {}
    logout();
  };

  return (
    <aside className="w-60 min-h-screen bg-[#0a0a0a] border-r border-[#1f1f1f] flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">ContentFlow</p>
            <p className="text-xs text-gray-500 mt-0.5">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Platform badges */}
      <div className="px-4 py-3 border-b border-[#1f1f1f]">
        <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Platforms</p>
        <div className="flex gap-2">
          <span className="flex items-center gap-1 text-xs bg-red-950/30 text-red-400 px-2 py-1 rounded-md">
            <Youtube size={12} /> YouTube
          </span>
          <span className="flex items-center gap-1 text-xs bg-pink-950/30 text-pink-400 px-2 py-1 rounded-md">
            <Instagram size={12} /> Instagram
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-[#1f1f1f]">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {user?.avatar
              ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt={user.name} />
              : user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-950/20">
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
