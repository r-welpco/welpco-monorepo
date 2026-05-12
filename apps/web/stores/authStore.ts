import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
}));

// Selectors to prevent unnecessary re-renders
// Components should use these instead of accessing the store directly
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);

// Selector for multiple values with shallow comparison
export const useAuthState = () =>
  useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
    }))
  );

