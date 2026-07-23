import { Menu, Bell, RefreshCw } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface NavbarProps { title: string; subtitle?: string; }

export default function Navbar({ title, subtitle }: NavbarProps) {
  const { toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries();
    toast.success('Data refreshed');
  };

  return (
    <header
      className="h-14 bg-[#0a0a0a] border-b border-[#1f1f1f] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 navbar-safe"
      style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — visible on ALL screen sizes */}
        <button
          onClick={toggleSidebar}
          className="p-2.5 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-white leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handleRefresh}
          className="p-2.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#1a1a1a]"
          title="Refresh data"
          aria-label="Refresh data"
        >
          <RefreshCw size={16} />
        </button>
        <button
          className="p-2.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#1a1a1a]"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>
        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold ml-1 overflow-hidden flex-shrink-0">
          {user?.avatar
            ? <img src={user.avatar} className="w-full h-full object-cover" alt="" />
            : user?.name?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
