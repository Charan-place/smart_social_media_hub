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
    <header className="h-14 bg-[#0a0a0a] border-b border-[#1f1f1f] flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="text-gray-400 hover:text-white transition-colors lg:hidden">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleRefresh} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#1a1a1a]" title="Refresh data">
          <RefreshCw size={16} />
        </button>
        <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#1a1a1a]">
          <Bell size={16} />
        </button>
        <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold ml-1">
          {user?.avatar
            ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="" />
            : user?.name?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
