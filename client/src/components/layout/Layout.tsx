import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useUIStore } from '../../store/uiStore';

export default function Layout() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const location = useLocation();

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Sync sidebar state when resizing between mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">

      {/* Backdrop — mobile only, shown when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — fixed, slides in/out on mobile, always visible on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <Sidebar />
      </div>

      {/* Main content — always offset by sidebar width on desktop */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-60">
        <Outlet />
      </main>

    </div>
  );
}
