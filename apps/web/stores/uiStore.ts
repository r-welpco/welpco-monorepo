import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

// Theme is managed by personalizationStore - do not duplicate here
export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),
}));

