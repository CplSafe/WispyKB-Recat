import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
}

interface SystemConfig {
  siteName: string;
  siteTitle: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  theme: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  systemConfig: SystemConfig | null;
  sidebarCollapsed: boolean;
  locale: 'zh_CN' | 'en_US';
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setSystemConfig: (config: SystemConfig) => void;
  toggleSidebar: () => void;
  setLocale: (locale: 'zh_CN' | 'en_US') => void;
  clear: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      systemConfig: null,
      sidebarCollapsed: false,
      locale: 'zh_CN',
      setUser: (user) => set({ user }),
      setToken: (token) => {
        set({ token });
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('access_token', token);
            sessionStorage.setItem('access_token', token);
          } else {
            localStorage.removeItem('access_token');
            sessionStorage.removeItem('access_token');
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
          }
        }
      },
      setSystemConfig: (config) => set({ systemConfig: config }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setLocale: (locale) => set({ locale }),
      clear: () => {
        set({ user: null, token: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          sessionStorage.removeItem('access_token');
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
        }
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        token: state.token,
        sidebarCollapsed: state.sidebarCollapsed,
        locale: state.locale,
      }),
    }
  )
);
