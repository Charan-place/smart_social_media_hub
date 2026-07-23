import { create } from 'zustand';

const isDesktop = () => typeof window !== 'undefined' && window.innerWidth >= 1024;

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Open by default on desktop, closed on mobile
  sidebarOpen: isDesktop(),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
