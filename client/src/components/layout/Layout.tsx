import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../utils/helpers';

export default function Layout() {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <div className={cn('fixed inset-y-0 left-0 z-30 transition-transform duration-300', sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        <Sidebar />
      </div>
      <main className={cn('flex-1 flex flex-col transition-all duration-300', sidebarOpen ? 'lg:ml-60' : 'ml-0')}>
        <Outlet />
      </main>
    </div>
  );
}
