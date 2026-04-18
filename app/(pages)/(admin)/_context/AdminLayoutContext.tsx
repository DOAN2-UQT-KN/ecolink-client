"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const SIDEBAR_COLLAPSED_KEY = "ecolink-admin-sidebar-collapsed";
const ADMIN_THEME_KEY = "ecolink-admin-theme";

export type AdminTheme = "light" | "dark";

type AdminLayoutContextValue = {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  toggleCollapsed: () => void;
  theme: AdminTheme;
  setTheme: (value: AdminTheme) => void;
  toggleTheme: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  isMobile: boolean;
};

const AdminLayoutContext = createContext<AdminLayoutContextValue | null>(null);

function isTabletRange() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(min-width: 768px) and (max-width: 1023px)")
    .matches;
}

export function AdminLayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsedState] = useState(false);
  const [theme, setThemeState] = useState<AdminTheme>("light");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const storedCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (storedCollapsed === null) {
      setCollapsedState(isTabletRange());
    } else {
      setCollapsedState(storedCollapsed === "true");
    }

    const storedTheme = localStorage.getItem(ADMIN_THEME_KEY);
    if (storedTheme === "dark" || storedTheme === "light") {
      setThemeState(storedTheme);
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
    setCollapsedState(value);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  const setTheme = useCallback((value: AdminTheme) => {
    localStorage.setItem(ADMIN_THEME_KEY, value);
    setThemeState(value);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(ADMIN_THEME_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      collapsed,
      setCollapsed,
      toggleCollapsed,
      theme,
      setTheme,
      toggleTheme,
      mobileNavOpen,
      setMobileNavOpen,
      isMobile,
    }),
    [
      collapsed,
      setCollapsed,
      toggleCollapsed,
      theme,
      setTheme,
      toggleTheme,
      mobileNavOpen,
      isMobile,
    ],
  );

  return (
    <AdminLayoutContext.Provider value={value}>
      {children}
    </AdminLayoutContext.Provider>
  );
}

export function useAdminLayout() {
  const ctx = useContext(AdminLayoutContext);
  if (!ctx) {
    throw new Error("useAdminLayout must be used within AdminLayoutProvider");
  }
  return ctx;
}
